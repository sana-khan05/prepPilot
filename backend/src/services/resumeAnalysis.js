const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const getGemini = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

const extractTextFromPDF = async (filePath) => {
  const pdfParse = require('pdf-parse');
  
  let dataBuffer;
  // Check if it's a URL (Cloudinary) or local file
  if (filePath.startsWith('http')) {
    const axios = require('axios');
    const response = await axios.get(filePath, { responseType: 'arraybuffer' });
    dataBuffer = Buffer.from(response.data);
  } else {
    const fs = require('fs');
    dataBuffer = fs.readFileSync(filePath);
  }
  
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const extractTextFromDOCX = async (filePath) => {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const extractResumeText = async (filePath, fileType) => {
  if (fileType === 'pdf') return await extractTextFromPDF(filePath);
  if (fileType === 'docx' || fileType === 'doc') return await extractTextFromDOCX(filePath);
  throw new Error('Unsupported file type');
};

const calculateATSScore = (resumeText, jobDescription = '') => {
  let score = 0;
  const text = resumeText.toLowerCase();
  const sections = {
    contact: ['email', 'phone', 'linkedin', 'github', 'address'],
    summary: ['summary', 'objective', 'profile', 'about'],
    experience: ['experience', 'work', 'employment', 'job', 'internship'],
    education: ['education', 'degree', 'university', 'college', 'bachelor', 'master'],
    skills: ['skills', 'technologies', 'tools', 'languages', 'frameworks'],
    projects: ['project', 'built', 'developed', 'created', 'implemented'],
  };
  let sectionScore = 0;
  const sectionResults = {};
  Object.entries(sections).forEach(([section, keywords]) => {
    const found = keywords.some(k => text.includes(k));
    sectionResults[section] = found ? 5 : 0;
    if (found) sectionScore += 5;
  });
  score += Math.min(sectionScore, 30);
  const lines = resumeText.split('\n').filter(l => l.trim());
  if (lines.length > 20) score += 5;
  if (lines.length > 40) score += 5;
  if (resumeText.length > 500) score += 5;
  if (resumeText.length > 1000) score += 5;
  if (jobDescription) {
    const jdWords = jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const uniqueJdWords = [...new Set(jdWords)];
    const matchCount = uniqueJdWords.filter(w => text.includes(w)).length;
    const matchPercent = matchCount / Math.max(uniqueJdWords.length, 1);
    score += Math.round(matchPercent * 30);
  } else {
    score += 15;
  }
  const techKeywords = ['javascript','python','java','react','node','mongodb','sql','aws','docker','git','api','html','css','typescript','express','django','flask','spring','kubernetes','linux','agile','scrum'];
  const techFound = techKeywords.filter(k => text.includes(k)).length;
  score += Math.min(techFound * 2, 20);
  return {
    total: Math.min(Math.round(score), 100),
    breakdown: {
      sectionCompleteness: Math.min(sectionScore, 30),
      formatting: 20,
      keywordMatch: jobDescription ? Math.round((score - sectionScore - 15) / 30 * 30) : 15,
      techKeywords: Math.min(techFound * 2, 20),
    },
    sectionResults,
  };
};

const detectBias = (resumeText) => {
  const text = resumeText.toLowerCase();
  const flags = [];
  const checks = [
    { words: ['born in','age:','dob:','date of birth','years old'], label: 'Age indicator' },
    { words: ['he/','she/','him/','her/'], label: 'Gendered pronoun' },
    { words: ['native of','hometown','originally from'], label: 'Location bias' },
    { words: ['christian','muslim','hindu','jewish'], label: 'Religion mention' },
    { words: ['married','single','divorced','spouse'], label: 'Marital status' },
  ];
  checks.forEach(({ words, label }) => {
    words.forEach(w => { if (text.includes(w)) flags.push(`${label}: "${w}"`); });
  });
  return flags;
};

const analyzeResumeWithAI = async (resumeText, targetRole = '', jobDescription = '') => {
  const model = getGemini();

  const prompt = `You are an expert ATS resume analyzer. Analyze this resume and return ONLY valid JSON, no extra text, no markdown.

Return exactly this JSON structure:
{
  "overallFeedback": "2-3 sentence summary",
  "sectionRatings": {
    "summary": { "score": 3, "feedback": "feedback here" },
    "experience": { "score": 4, "feedback": "feedback here" },
    "skills": { "score": 3, "feedback": "feedback here" },
    "projects": { "score": 3, "feedback": "feedback here" },
    "education": { "score": 4, "feedback": "feedback here" }
  },
  "skillsFound": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "rewrittenBullets": ["better bullet 1", "better bullet 2"],
  "powerWords": ["word1", "word2"]
}

RESUME: ${resumeText.substring(0, 3000)}
TARGET ROLE: ${targetRole || 'Not specified'}
JOB DESCRIPTION: ${jobDescription ? jobDescription.substring(0, 500) : 'Not provided'}`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();

  // Remove markdown code blocks if present
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');

  return JSON.parse(jsonMatch[0]);
};

module.exports = {
  extractResumeText,
  calculateATSScore,
  detectBias,
  analyzeResumeWithAI,
};