const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGemini = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

// ── Generate interview questions from resume ───────────
const generateQuestions = async (resumeText, interviewType, targetRole, difficulty) => {
  const model = getGemini();

  const typeInstructions = {
    technical: 'Focus on technical skills, coding concepts, system design, and technologies mentioned in the resume.',
    hr: 'Focus on career goals, salary expectations, company culture fit, strengths and weaknesses.',
    behavioral: 'Focus on past experiences using STAR method - Situation, Task, Action, Result.',
    mixed: 'Mix of technical, HR, and behavioral questions.',
  };

  const prompt = `You are an expert interviewer. Generate 8 interview questions based on this resume.

RESUME: ${resumeText ? resumeText.substring(0, 2000) : 'Not provided'}
INTERVIEW TYPE: ${interviewType}
TARGET ROLE: ${targetRole || 'Software Developer'}
DIFFICULTY: ${difficulty || 'medium'}
INSTRUCTIONS: ${typeInstructions[interviewType] || typeInstructions.mixed}

Return ONLY valid JSON array, no extra text:
[
  {
    "id": 1,
    "question": "question text here",
    "type": "${interviewType}",
    "difficulty": "easy|medium|hard",
    "topic": "topic name",
    "expectedAnswer": "brief expected answer hint",
    "followUp": "a follow-up question"
  }
]

Make questions specific to the resume content. Return exactly 8 questions.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid questions format');
  return JSON.parse(jsonMatch[0]);
};

// ── Evaluate a single answer ───────────────────────────
const evaluateAnswer = async (question, answer, interviewType) => {
  if (!answer || answer.trim().length < 5) {
    return {
      score: 0,
      feedback: 'No answer provided.',
      starCompliance: false,
      fillerWords: [],
      improvements: ['Please provide a detailed answer.'],
      nextDifficulty: 'easy',
    };
  }

  const model = getGemini();

  // Count filler words
  const fillerWordsList = ['uh', 'um', 'like', 'you know', 'basically', 'actually', 'literally', 'sort of', 'kind of'];
  const lowerAnswer = answer.toLowerCase();
  const foundFillers = fillerWordsList.filter(w => lowerAnswer.includes(w));

  const prompt = `You are an expert interview coach. Evaluate this interview answer.

QUESTION: ${question}
ANSWER: ${answer}
INTERVIEW TYPE: ${interviewType}

Return ONLY valid JSON:
{
  "score": 7,
  "feedback": "specific feedback on the answer",
  "starCompliance": true,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "idealAnswer": "brief ideal answer",
  "nextDifficulty": "easy|medium|hard"
}

Score from 0-10. nextDifficulty should be harder if score >= 7, easier if score <= 4, same if 5-6.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid evaluation format');

  const evaluation = JSON.parse(jsonMatch[0]);
  evaluation.fillerWords = foundFillers;
  return evaluation;
};

// ── Generate final interview report ───────────────────
const generateInterviewReport = async (questions, answers, scores, interviewType, targetRole) => {
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10)
    : 0;

  const model = getGemini();

  const qaText = questions.map((q, i) => (
    `Q${i+1}: ${q.question}\nA: ${answers[i] || 'No answer'}\nScore: ${scores[i] || 0}/10`
  )).join('\n\n');

  const prompt = `You are an expert interview coach. Generate a final interview performance report.

INTERVIEW TYPE: ${interviewType}
TARGET ROLE: ${targetRole || 'Software Developer'}
AVERAGE SCORE: ${avgScore}/100

QUESTIONS AND ANSWERS:
${qaText.substring(0, 2000)}

Return ONLY valid JSON:
{
  "overallScore": ${avgScore},
  "summary": "2-3 sentence overall performance summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvementPlan": ["action 1", "action 2", "action 3"],
  "scores": {
    "technical": 70,
    "communication": 75,
    "confidence": 65,
    "starMethod": 60
  },
  "recommendedResources": ["resource 1", "resource 2"]
}`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid report format');
  return JSON.parse(jsonMatch[0]);
};

module.exports = { generateQuestions, evaluateAnswer, generateInterviewReport };