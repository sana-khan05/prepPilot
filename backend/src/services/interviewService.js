const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGemini = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

const generateQuestions = async (resumeText, interviewType, targetRole, difficulty) => {
  const model = getGemini();
  const typeInstructions = {
    technical: 'Focus on technical skills, coding concepts, system design, and technologies mentioned in the resume.',
    hr: 'Focus on career goals, salary expectations, company culture fit, strengths and weaknesses.',
    behavioral: 'Focus on past experiences using STAR method.',
    mixed: 'Mix of technical, HR, and behavioral questions.',
  };
  const prompt = `You are an expert interviewer. Generate 8 interview questions.
RESUME: ${resumeText ? resumeText.substring(0, 2000) : 'Not provided'}
INTERVIEW TYPE: ${interviewType}
TARGET ROLE: ${targetRole || 'Software Developer'}
DIFFICULTY: ${difficulty || 'medium'}
INSTRUCTIONS: ${typeInstructions[interviewType] || typeInstructions.mixed}

Return ONLY valid JSON array, no markdown:
[{"id":1,"question":"question text","type":"${interviewType}","difficulty":"medium","topic":"topic","expectedAnswer":"hint","followUp":"follow up question"}]
Return exactly 8 questions.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid questions format');
  return JSON.parse(jsonMatch[0]);
};

const evaluateAnswer = async (question, answer, interviewType) => {
  if (!answer || answer.trim().length < 5) {
    return { score: 0, feedback: 'No answer provided.', starCompliance: false, fillerWords: [], improvements: ['Please provide a detailed answer.'], nextDifficulty: 'easy' };
  }
  const model = getGemini();
  const fillerWordsList = ['uh', 'um', 'like', 'you know', 'basically', 'actually', 'literally'];
  const foundFillers = fillerWordsList.filter(w => answer.toLowerCase().includes(w));

  const prompt = `Evaluate this interview answer.
QUESTION: ${question}
ANSWER: ${answer}
TYPE: ${interviewType}

Return ONLY valid JSON, no markdown:
{"score":7,"feedback":"feedback here","starCompliance":true,"strengths":["s1"],"improvements":["i1"],"idealAnswer":"ideal answer","nextDifficulty":"medium"}
Score 0-10.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid evaluation format');
  const evaluation = JSON.parse(jsonMatch[0]);
  evaluation.fillerWords = foundFillers;
  return evaluation;
};

const generateInterviewReport = async (questions, answers, scores, interviewType, targetRole) => {
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
  const model = getGemini();
  const qaText = questions.map((q, i) => `Q${i+1}: ${q.question}\nA: ${answers[i] || 'No answer'}\nScore: ${scores[i] || 0}/10`).join('\n\n');

  const prompt = `Generate interview performance report.
TYPE: ${interviewType}, ROLE: ${targetRole || 'Software Developer'}, AVG SCORE: ${avgScore}/100
QA: ${qaText.substring(0, 1500)}

Return ONLY valid JSON, no markdown:
{"overallScore":${avgScore},"summary":"summary here","strengths":["s1","s2"],"weaknesses":["w1"],"improvementPlan":["p1","p2"],"scores":{"technical":70,"communication":75,"confidence":65,"starMethod":60},"recommendedResources":["r1"]}`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid report format');
  return JSON.parse(jsonMatch[0]);
};

module.exports = { generateQuestions, evaluateAnswer, generateInterviewReport };