const OpenAI = require('openai');

// ── OpenAI Client ──────────────────────────────────────
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in .env file');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// ── Helper: Call OpenAI ────────────────────────────────
const callOpenAI = async (prompt) => {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });
  return response.choices[0].message.content.trim();
};

// ── Fallback Questions (jab API fail ho) ──────────────
const getFallbackQuestions = (interviewType, targetRole) => {
  const fallbacks = {
    technical: [
      { id: 1, question: `Explain the difference between REST and GraphQL APIs.`, type: 'technical', difficulty: 'medium', topic: 'API Design', expectedAnswer: 'REST uses fixed endpoints, GraphQL uses single endpoint with flexible queries.', followUp: 'When would you choose GraphQL over REST?' },
      { id: 2, question: `What is the difference between SQL and NoSQL databases?`, type: 'technical', difficulty: 'easy', topic: 'Databases', expectedAnswer: 'SQL is structured/relational, NoSQL is flexible/document-based.', followUp: 'Which would you use for a social media app?' },
      { id: 3, question: `Explain how JWT authentication works.`, type: 'technical', difficulty: 'medium', topic: 'Authentication', expectedAnswer: 'JWT has header, payload, signature. Server signs token, client sends it with requests.', followUp: 'How do you handle JWT expiry?' },
      { id: 4, question: `What is the time complexity of binary search?`, type: 'technical', difficulty: 'easy', topic: 'DSA', expectedAnswer: 'O(log n) because it halves the search space each time.', followUp: 'How does it compare to linear search?' },
      { id: 5, question: `Explain React hooks and why they were introduced.`, type: 'technical', difficulty: 'medium', topic: 'React', expectedAnswer: 'Hooks let functional components use state and lifecycle without class components.', followUp: 'What is the difference between useEffect and useLayoutEffect?' },
      { id: 6, question: `What is a Promise in JavaScript?`, type: 'technical', difficulty: 'easy', topic: 'JavaScript', expectedAnswer: 'A Promise represents a future value. It can be pending, fulfilled, or rejected.', followUp: 'What is the difference between Promise.all and Promise.race?' },
      { id: 7, question: `Explain the concept of microservices architecture.`, type: 'technical', difficulty: 'hard', topic: 'System Design', expectedAnswer: 'Breaking an app into small independent services that communicate via APIs.', followUp: 'What are the challenges of microservices?' },
      { id: 8, question: `What is Docker and why is it used?`, type: 'technical', difficulty: 'medium', topic: 'DevOps', expectedAnswer: 'Docker containerizes apps so they run consistently across environments.', followUp: 'What is the difference between Docker and a VM?' },
    ],
    hr: [
      { id: 1, question: `Tell me about yourself and your journey so far.`, type: 'hr', difficulty: 'easy', topic: 'Introduction', expectedAnswer: 'Brief background, education, key experiences, why this role.', followUp: 'What made you choose this career path?' },
      { id: 2, question: `Where do you see yourself in 5 years?`, type: 'hr', difficulty: 'easy', topic: 'Career Goals', expectedAnswer: 'Show ambition aligned with company growth.', followUp: 'How does this role help you get there?' },
      { id: 3, question: `What are your salary expectations?`, type: 'hr', difficulty: 'medium', topic: 'Compensation', expectedAnswer: 'Research market rate, give a range, show flexibility.', followUp: 'Are you open to negotiation?' },
      { id: 4, question: `Why do you want to work at this company?`, type: 'hr', difficulty: 'easy', topic: 'Motivation', expectedAnswer: 'Show research on company, align personal goals.', followUp: 'What do you know about our culture?' },
      { id: 5, question: `What is your biggest strength?`, type: 'hr', difficulty: 'easy', topic: 'Self Assessment', expectedAnswer: 'Give a specific strength with a real example.', followUp: 'How has this strength helped you in your work?' },
      { id: 6, question: `What is your biggest weakness?`, type: 'hr', difficulty: 'medium', topic: 'Self Assessment', expectedAnswer: 'Real weakness + what you are doing to improve it.', followUp: 'How are you working on this?' },
      { id: 7, question: `How do you handle work-life balance?`, type: 'hr', difficulty: 'easy', topic: 'Work Style', expectedAnswer: 'Show you are organized, can set boundaries, stay productive.', followUp: 'Give an example of a stressful deadline you managed.' },
      { id: 8, question: `Why are you leaving your current job?`, type: 'hr', difficulty: 'medium', topic: 'Motivation', expectedAnswer: 'Stay positive, focus on growth opportunities not complaints.', followUp: 'What would make you stay at your current job?' },
    ],
    behavioral: [
      { id: 1, question: `Tell me about a time you faced a major challenge at work.`, type: 'behavioral', difficulty: 'medium', topic: 'Problem Solving', expectedAnswer: 'Use STAR: Situation, Task, Action, Result.', followUp: 'What would you do differently now?' },
      { id: 2, question: `Describe a situation where you worked in a team conflict.`, type: 'behavioral', difficulty: 'medium', topic: 'Teamwork', expectedAnswer: 'Show conflict resolution, communication, empathy.', followUp: 'How did the team relationship change after?' },
      { id: 3, question: `Give an example of when you showed leadership.`, type: 'behavioral', difficulty: 'medium', topic: 'Leadership', expectedAnswer: 'Specific story of taking initiative and guiding others.', followUp: 'How did others respond to your leadership?' },
      { id: 4, question: `Tell me about a time you missed a deadline.`, type: 'behavioral', difficulty: 'hard', topic: 'Accountability', expectedAnswer: 'Own the mistake, explain what happened, what you learned.', followUp: 'How did you prevent it from happening again?' },
      { id: 5, question: `Describe a time you had to learn something quickly.`, type: 'behavioral', difficulty: 'medium', topic: 'Learning', expectedAnswer: 'Show adaptability, resourcefulness, speed of learning.', followUp: 'How do you approach learning new technologies?' },
      { id: 6, question: `Tell me about a successful project you led.`, type: 'behavioral', difficulty: 'easy', topic: 'Achievement', expectedAnswer: 'Specific project, your role, measurable outcome.', followUp: 'What was the most challenging part?' },
      { id: 7, question: `Give an example of handling a difficult client or stakeholder.`, type: 'behavioral', difficulty: 'hard', topic: 'Communication', expectedAnswer: 'Stay calm, understand their concern, find a solution.', followUp: 'What did you learn about communication from this?' },
      { id: 8, question: `Describe a time you disagreed with your manager.`, type: 'behavioral', difficulty: 'hard', topic: 'Professionalism', expectedAnswer: 'Show respectful disagreement, data-driven approach.', followUp: 'What was the final outcome?' },
    ],
    mixed: [
      { id: 1, question: `Tell me about yourself and your technical background.`, type: 'mixed', difficulty: 'easy', topic: 'Introduction', expectedAnswer: 'Education, skills, key projects, career goals.', followUp: 'What is your strongest technical skill?' },
      { id: 2, question: `Explain a technical project you are most proud of.`, type: 'mixed', difficulty: 'medium', topic: 'Projects', expectedAnswer: 'Tech stack, your role, challenges, outcome.', followUp: 'What would you improve if you rebuilt it?' },
      { id: 3, question: `How do you stay updated with new technologies?`, type: 'mixed', difficulty: 'easy', topic: 'Learning', expectedAnswer: 'Blogs, courses, GitHub, communities, side projects.', followUp: 'What have you learned recently?' },
      { id: 4, question: `Describe a time you solved a critical bug under pressure.`, type: 'mixed', difficulty: 'medium', topic: 'Problem Solving', expectedAnswer: 'STAR format: what happened, your debugging steps, fix, result.', followUp: 'How do you approach debugging in general?' },
      { id: 5, question: `What is your experience with agile development?`, type: 'mixed', difficulty: 'easy', topic: 'Process', expectedAnswer: 'Sprints, standups, retrospectives, collaboration.', followUp: 'What do you think is the biggest challenge in agile?' },
      { id: 6, question: `How do you prioritize tasks when everything is urgent?`, type: 'mixed', difficulty: 'medium', topic: 'Time Management', expectedAnswer: 'Impact vs effort matrix, communicate with stakeholders.', followUp: 'Give a real example of this situation.' },
      { id: 7, question: `What do you know about our company and why us?`, type: 'mixed', difficulty: 'easy', topic: 'Research', expectedAnswer: 'Show genuine research, align values with company mission.', followUp: 'What excites you most about this role?' },
      { id: 8, question: `Where do you want to be in your tech career in 3 years?`, type: 'mixed', difficulty: 'easy', topic: 'Career Goals', expectedAnswer: 'Specific growth plan, skills to develop, roles to target.', followUp: 'How does this position help you reach that goal?' },
    ],
  };

  return fallbacks[interviewType] || fallbacks.mixed;
};

// ── Generate interview questions from resume ───────────
const generateQuestions = async (resumeText, interviewType, targetRole, difficulty) => {
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

  try {
    const content = await callOpenAI(prompt);
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid questions format');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn('⚠️ OpenAI failed for questions, using fallback:', err.message);
    return getFallbackQuestions(interviewType, targetRole);
  }
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

  try {
    const content = await callOpenAI(prompt);
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid evaluation format');
    const evaluation = JSON.parse(jsonMatch[0]);
    evaluation.fillerWords = foundFillers;
    return evaluation;
  } catch (err) {
    console.warn('⚠️ OpenAI failed for evaluation, using fallback:', err.message);
    return {
      score: 5,
      feedback: 'AI evaluation temporarily unavailable. Your answer has been recorded.',
      starCompliance: false,
      strengths: ['Answer was submitted successfully'],
      improvements: ['Try to structure your answer using the STAR method'],
      idealAnswer: 'A strong answer includes specific examples with measurable outcomes.',
      fillerWords: foundFillers,
      nextDifficulty: 'medium',
    };
  }
};

// ── Generate final interview report ───────────────────
const generateInterviewReport = async (questions, answers, scores, interviewType, targetRole) => {
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10)
    : 50;

  const qaText = questions.map((q, i) => (
    `Q${i + 1}: ${q.question}\nA: ${answers[i] || 'No answer'}\nScore: ${scores[i] || 0}/10`
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

  try {
    const content = await callOpenAI(prompt);
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid report format');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn('⚠️ OpenAI failed for report, using fallback:', err.message);
    return {
      overallScore: avgScore,
      summary: `You completed the ${interviewType} interview for ${targetRole || 'Software Developer'} role. Your average score was ${avgScore}/100. Keep practicing to improve your performance.`,
      strengths: ['Completed the full interview', 'Attempted all questions', 'Showed initiative'],
      weaknesses: ['Some answers could be more detailed', 'Practice STAR method for behavioral questions'],
      improvementPlan: ['Practice mock interviews daily', 'Study the STAR method for behavioral questions', 'Review technical concepts for your target role'],
      scores: {
        technical: avgScore,
        communication: avgScore,
        confidence: avgScore,
        starMethod: avgScore,
      },
      recommendedResources: ['LeetCode for DSA practice', 'Pramp for mock interviews', 'YouTube: interviewing.io'],
    };
  }
};

module.exports = { generateQuestions, evaluateAnswer, generateInterviewReport };