const { generateAI } = require('./aiHelper');

const generateResumeContent = async (formData) => {
  const prompt = `Create resume JSON.

DATA: ${JSON.stringify(formData)}

Return JSON with summary, skills, experience.`;

  try {
    return await generateAI(prompt, 'object');
  } catch {
    return {
      summary: "AI unavailable",
      skills: {},
      experience: [],
      projects: [],
      education: []
    };
  }
};

const generateLearningPlan = async (weaknesses, interviewType, targetRole) => {
  const prompt = `Create learning plan.

WEAKNESSES: ${weaknesses}

Return JSON.`;

  try {
    return await generateAI(prompt, 'object');
  } catch {
    return {
      weeklyPlan: [],
      quickWins: ["Try again later"]
    };
  }
};

module.exports = { generateResumeContent, generateLearningPlan };