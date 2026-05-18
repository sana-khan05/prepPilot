const { generateAI } = require('./aiHelper');

const generateQuestions = async (resumeText, interviewType, targetRole, difficulty) => {
  const typeInstructions = {
    technical: 'Focus on technical skills, coding concepts, system design.',
    hr: 'Focus on career goals, salary expectations, strengths and weaknesses.',
    behavioral: 'Focus on past experiences using STAR method.',
    mixed: 'Mix of technical, HR, and behavioral questions.',
  };

  const prompt = `Generate 8 interview questions.
RESUME: ${resumeText?.substring(0, 2000) || 'Not provided'}
TYPE: ${interviewType}, ROLE: ${targetRole || 'Software Developer'}, DIFFICULTY: ${difficulty || 'medium'}
INSTRUCTIONS: ${typeInstructions[interviewType] || typeInstructions.mixed}
Return ONLY JSON array: [{"id":1,"question":"text","type":"${interviewType}","difficulty":"medium","topic":"topic","expectedAnswer":"hint","followUp":"follow up"}]`;

  try {
    return await generateAI(prompt, 'array') || getDefaultQuestions(interviewType);
  } catch {
    return getDefaultQuestions(interviewType);
  }
};

const getDefaultQuestions = (type) => [
  { id:1, question:"Tell me about yourself.", type, difficulty:"easy", topic:"Introduction", expectedAnswer:"Brief intro", followUp:"Your strengths?" },
  { id:2, question:"What are your technical strengths?", type, difficulty:"easy", topic:"Skills", expectedAnswer:"Key skills", followUp:"Give an example." },
  { id:3, question:"Describe a challenging project.", type, difficulty:"medium", topic:"Experience", expectedAnswer:"STAR method", followUp:"What would you do differently?" },
  { id:4, question:"How do you handle tight deadlines?", type, difficulty:"medium", topic:"Work style", expectedAnswer:"Time management", followUp:"Give a specific example." },
  { id:5, question:"Where do you see yourself in 5 years?", type, difficulty:"easy", topic:"Career goals", expectedAnswer:"Growth aligned with role", followUp:"How does this role fit?" },
  { id:6, question:"How do you stay updated with new technologies?", type, difficulty:"medium", topic:"Learning", expectedAnswer:"Resources, courses", followUp:"What did you learn recently?" },
  { id:7, question:"Describe a time you worked in a team.", type, difficulty:"medium", topic:"Teamwork", expectedAnswer:"STAR with collaboration", followUp:"How did you handle conflicts?" },
  { id:8, question:"Why do you want to work here?", type, difficulty:"easy", topic:"Motivation", expectedAnswer:"Company research + goals", followUp:"What do you know about us?" },
];

const evaluateAnswer = async (question, answer, interviewType) => {
  if (!answer || answer.trim().length < 5) {
    return { score:0, feedback:'No answer provided.', starCompliance:false, fillerWords:[], strengths:[], improvements:['Provide a detailed answer.'], nextDifficulty:'easy' };
  }
  const fillerWordsList = ['uh','um','like','you know','basically','actually'];
  const foundFillers = fillerWordsList.filter(w => answer.toLowerCase().includes(w));

  const prompt = `Evaluate interview answer.
Q: ${question}
A: ${answer}
TYPE: ${interviewType}
Return ONLY JSON: {"score":7,"feedback":"feedback","starCompliance":true,"strengths":["s1"],"improvements":["i1"],"idealAnswer":"ideal","nextDifficulty":"medium"}`;

  try {
    const result = await generateAI(prompt, 'object');
    if (result) { result.fillerWords = foundFillers; return result; }
    throw new Error('No result');
  } catch {
    return { score:5, feedback:"Answer received!", starCompliance:false, fillerWords:foundFillers, strengths:["Attempted"], improvements:["Be specific","Use STAR"], idealAnswer:"Give specific examples.", nextDifficulty:"medium" };
  }
};

const generateInterviewReport = async (questions, answers, scores, interviewType, targetRole) => {
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length * 10) : 0;
  const qaText = questions.map((q,i) => `Q${i+1}: ${q.question}\nA: ${answers[i]||'No answer'}\nScore: ${scores[i]||0}/10`).join('\n\n');

  const prompt = `Generate interview report.
TYPE: ${interviewType}, ROLE: ${targetRole||'Developer'}, SCORE: ${avgScore}/100
QA: ${qaText.substring(0, 1000)}
Return ONLY JSON: {"overallScore":${avgScore},"summary":"summary","strengths":["s1"],"weaknesses":["w1"],"improvementPlan":["p1"],"scores":{"technical":70,"communication":75,"confidence":65,"starMethod":60},"recommendedResources":["r1"]}`;

  try {
    return await generateAI(prompt, 'object') || getDefaultReport(avgScore);
  } catch {
    return getDefaultReport(avgScore);
  }
};

const getDefaultReport = (avg) => ({
  overallScore: avg, summary: "Keep practicing!", strengths:["Completed interview"], weaknesses:["Need more examples"],
  improvementPlan:["Practice daily","Review concepts","Improve communication"],
  scores:{technical:avg,communication:avg,confidence:avg,starMethod:avg},
  recommendedResources:["leetcode.com","pramp.com"]
});

module.exports = { generateQuestions, evaluateAnswer, generateInterviewReport };