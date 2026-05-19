const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const mammoth = require('mammoth');
const { generateAI } = require('./aiHelper');

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
  const techKeywords = ['javascript','python','java','react','node','mongodb','sql','aws','docker','git','html','css','typescript','express','django','flask'];
  const techFound = techKeywords.filter(k => text.includes(k)).length;
  score += Math.min(techFound * 2, 20);
  return {
    total: Math.min(Math.round(score), 100),
    breakdown: {
      sectionCompleteness: Math.min(sectionScore, 30),
      formatting: 20,
      keywordMatch: 15,
      techKeywords: Math.min(techFound * 2, 20),
    },
  };
};

const detectBias = (resumeText) => {
  const text = resumeText.toLowerCase();
  const flags = [];
  const checks = [
    { words: ['born in', 'age:', 'dob:', 'years old'], label: 'Age indicator' },
    { words: ['he/', 'she/', 'him/', 'her/'], label: 'Gendered pronoun' },
    { words: ['native of', 'hometown'], label: 'Location bias' },
    { words: ['married', 'single', 'divorced'], label: 'Marital status' },
  ];
  checks.forEach(({ words, label }) => {
    words.forEach(w => { if (text.includes(w)) flags.push(`${label}: "${w}"`); });
  });
  return flags;
};

const analyzeResumeWithAI = async (resumeText, targetRole = '', jobDescription = '') => {
  const prompt = `You are an expert ATS resume analyzer. Analyze this resume and return ONLY valid JSON, no markdown, no extra text.

Return exactly this structure:
{"overallFeedback":"2-3 sentence summary","sectionRatings":{"summary":{"score":3,"feedback":"feedback"},"experience":{"score":4,"feedback":"feedback"},"skills":{"score":3,"feedback":"feedback"},"projects":{"score":3,"feedback":"feedback"},"education":{"score":4,"feedback":"feedback"}},"skillsFound":["skill1","skill2"],"missingSkills":["skill1","skill2"],"strengths":["s1","s2"],"improvements":["i1","i2"],"rewrittenBullets":["bullet1","bullet2"],"powerWords":["word1","word2"]}

RESUME: ${resumeText.substring(0, 3000)}
TARGET ROLE: ${targetRole || 'Not specified'}
JOB DESCRIPTION: ${jobDescription ? jobDescription.substring(0, 500) : 'Not provided'}`;

  try {
    return await generateAI(prompt, 'object');
  } catch {
    return {
      overallFeedback: "AI analysis temporarily unavailable. Please try again.",
      sectionRatings: {
        summary: { score: 3, feedback: "Please try again later" },
        experience: { score: 3, feedback: "Please try again later" },
        skills: { score: 3, feedback: "Please try again later" },
        projects: { score: 3, feedback: "Please try again later" },
        education: { score: 3, feedback: "Please try again later" },
      },
      skillsFound: [],
      missingSkills: [],
      strengths: ["Resume uploaded successfully"],
      improvements: ["AI temporarily unavailable"],
      rewrittenBullets: [],
      powerWords: [],
    };
  }
};

module.exports = { extractResumeText, calculateATSScore, detectBias, analyzeResumeWithAI };