const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGemini = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
};

const extractTextFromPDF = async (filePath) => {
  let dataBuffer;
  if (filePath.startsWith('http')) {
    const response = await axios.get(filePath, { responseType: 'arraybuffer' });
    dataBuffer = Buffer.from(response.data);
  } else {
    dataBuffer = fs.readFileSync(filePath);
  }
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const extractTextFromDOCX = async (filePath) => {
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
    contact: ['email', 'phone', 'linkedin', 'github'],
    summary: ['summary', 'objective', 'profile'],
    experience: ['experience', 'work', 'internship'],
    education: ['education', 'degree', 'university'],
    skills: ['skills', 'technologies', 'tools'],
    projects: ['project', 'built', 'developed'],
  };
  let sectionScore = 0;
  Object.values(sections).forEach(keywords => {
    if (keywords.some(k => text.includes(k))) sectionScore += 5;
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
    score += Math.round((matchCount / Math.max(uniqueJdWords.length, 1)) * 30);
  } else {
    score += 15;
  }
  const techKeywords = ['javascript','python','java','react','node','mongodb','sql','aws','docker','git','api','html','css','typescript'];
  const techFound = techKeywords.filter(k => text.includes(k)).length;
  score += Math.min(techFound * 2, 20);
  return {
    total: Math.min(Math.round(score), 100),
    breakdown: {
      sectionCompleteness: Math.min(sectionScore, 30),
      formatting: 20,
      keywordMatch: jobDescription ? 15 : 15,
      techKeywords: Math.min(techFound * 2, 20),
    },
  };
};

const detectBias = (resumeText) => {
  const text = resumeText.toLowerCase();
  const flags = [];
  const checks = [
    { words: ['born in', 'age:', 'dob:', 'date of birth', 'years old'], label: 'Age indicator' },
    { words: ['he/', 'she/', 'him/', 'her/'], label: 'Gendered pronoun' },
    { words: ['native of', 'hometown', 'originally from'], label: 'Location bias' },
    { words: ['married', 'single', 'divorced', 'spouse'], label: 'Marital status' },
  ];
  checks.forEach(({ words, label }) => {
    words.forEach(w => { if (text.includes(w)) flags.push(`${label}: "${w}"`); });
  });
  return flags;
};

const analyzeResumeWithAI = async (resumeText, targetRole = '', jobDescription = '') => {
  const model = getGemini();
  const prompt = `You are an expert ATS resume analyzer. Analyze this resume and return ONLY valid JSON, no markdown:
{"overallFeedback":"summary","sectionRatings":{"summary":{"score":3,"feedback":""},"experience":{"score":4,"feedback":""},"skills":{"score":3,"feedback":""},"projects":{"score":3,"feedback":""},"education":{"score":4,"feedback":""}},"skillsFound":[],"missingSkills":[],"strengths":[],"improvements":[],"rewrittenBullets":[],"powerWords":[]}

RESUME: ${resumeText.substring(0, 3000)}
TARGET ROLE: ${targetRole || 'Not specified'}
JOB DESCRIPTION: ${jobDescription ? jobDescription.substring(0, 500) : 'Not provided'}`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  return JSON.parse(jsonMatch[0]);
};

module.exports = { extractResumeText, calculateATSScore, detectBias, analyzeResumeWithAI };