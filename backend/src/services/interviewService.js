const { generateAI } = require('./aiHelper');

const generateQuestions = async (resumeText, interviewType, targetRole, difficulty) => {
  const typeInstructions = {
    technical: 'Focus on technical skills, coding concepts, system design.',
    hr: 'Focus on career goals and personality.',
    behavioral: 'Use STAR method.',
    mixed: 'Mix of all types.',
  };

  const prompt = `You are an expert interviewer. Generate 8 questions.

RESUME: ${resumeText?.substring(0, 2000) || 'Not provided'}
TYPE: ${interviewType}
ROLE: ${targetRole || 'Software Developer'}
DIFFICULTY: ${difficulty || 'medium'}
INSTRUCTIONS: ${typeInstructions[interviewType] || typeInstructions.mixed}

Return ONLY JSON array.`;

  try {
    return await generateAI(prompt, 'array');
  } catch {
    return [
      {
        id: 1,
        question: "Tell me about yourself",
        type: "hr",
        difficulty: "easy",
        topic: "intro",
        expectedAnswer: "Brief intro",
        followUp: "Your strengths?"
      }
    ];
  }
};

const evaluateAnswer = async (question, answer, interviewType) => {
  if (!answer || answer.length < 5) {
    return {
      score: 0,
      feedback: 'No answer provided.',
      fillerWords: [],
      improvements: ['Give proper answer'],
      nextDifficulty: 'easy'
    };
  }

  const fillerWordsList = ['uh', 'um', 'like', 'basically'];
  const foundFillers = fillerWordsList.filter(w => answer.toLowerCase().includes(w));

  const prompt = `Evaluate answer.

Q: ${question}
A: ${answer}

Return JSON with score, feedback, improvements, nextDifficulty.`;

  try {
    const result = await generateAI(prompt, 'object');
    result.fillerWords = foundFillers;
    return result;
  } catch {
    return {
      score: 5,
      feedback: "AI unavailable",
      fillerWords: foundFillers,
      improvements: ["Try again"],
      nextDifficulty: "medium"
    };
  }
};

const generateInterviewReport = async (questions, answers, scores) => {
  const prompt = `Generate interview report.

Return JSON with summary, strengths, weaknesses.`;

  try {
    return await generateAI(prompt, 'object');
  } catch {
    return {
      summary: "Report unavailable",
      strengths: [],
      weaknesses: [],
      improvementPlan: []
    };
  }
};

module.exports = { generateQuestions, evaluateAnswer, generateInterviewReport };