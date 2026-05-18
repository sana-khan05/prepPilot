const { generateAI } = require('./aiHelper');

const generateResumeContent = async (formData) => {
  const prompt = `Create ATS-optimized resume from this data.
NAME: ${formData.name}, ROLE: ${formData.targetRole}, SKILLS: ${formData.skills}
EXPERIENCE: ${JSON.stringify(formData.experience||[])}
EDUCATION: ${JSON.stringify(formData.education||[])}
PROJECTS: ${JSON.stringify(formData.projects||[])}

Return ONLY JSON: {"summary":"professional summary","skills":{"technical":[],"tools":[],"soft":[]},"experience":[{"title":"","company":"","duration":"","bullets":[]}],"projects":[{"name":"","description":"","bullets":[],"tech":[]}],"education":[{"degree":"","institution":"","duration":"","gpa":""}],"powerWords":[],"atsScore":75,"improvements":[]}`;

  try {
    return await generateAI(prompt, 'object') || getDefaultResume(formData);
  } catch {
    return getDefaultResume(formData);
  }
};

const getDefaultResume = (formData) => ({
  summary: `${formData.experienceLevel} ${formData.targetRole} with skills in ${formData.skills}`,
  skills: { technical: formData.skills?.split(',').map(s=>s.trim()) || [], tools: [], soft: ["Problem Solving", "Teamwork"] },
  experience: formData.experience || [],
  projects: formData.projects || [],
  education: formData.education || [],
  powerWords: ["Built", "Developed", "Implemented", "Optimized"],
  atsScore: 65,
  improvements: ["Add more quantified achievements", "Include relevant keywords"]
});

const generateLearningPlan = async (weaknesses, interviewType, targetRole) => {
  const prompt = `Create 3-week learning plan.
ROLE: ${targetRole||'Software Developer'}, WEAK AREAS: ${weaknesses?.join(', ')||'General'}
Return ONLY JSON: {"weeklyPlan":[{"week":1,"focus":"topic","tasks":["t1","t2"],"resources":[{"title":"name","type":"video","url":"https://youtube.com"}]}],"quickWins":["tip1","tip2"],"estimatedTime":"3 weeks","topicsToRevise":["t1","t2"]}`;

  try {
    return await generateAI(prompt, 'object') || getDefaultPlan(targetRole);
  } catch {
    return getDefaultPlan(targetRole);
  }
};

const getDefaultPlan = (role) => ({
  weeklyPlan: [
    { week:1, focus:"Core Concepts", tasks:["Review fundamentals","Practice problems","Watch tutorials"], resources:[{title:"freeCodeCamp",type:"course",url:"https://freecodecamp.org"},{title:"YouTube Tutorials",type:"video",url:"https://youtube.com"}] },
    { week:2, focus:"Interview Practice", tasks:["Mock interviews","LeetCode problems","System design"], resources:[{title:"LeetCode",type:"practice",url:"https://leetcode.com"},{title:"Pramp",type:"practice",url:"https://pramp.com"}] },
    { week:3, focus:"Communication Skills", tasks:["STAR method practice","Behavioral questions","Research companies"], resources:[{title:"Interviewing.io",type:"practice",url:"https://interviewing.io"},{title:"Glassdoor",type:"article",url:"https://glassdoor.com"}] },
  ],
  quickWins: ["Practice STAR method daily", "Review your resume bullet points", "Research target companies"],
  estimatedTime: "3 weeks",
  topicsToRevise: ["Data Structures", "System Design", "Behavioral Questions", role || "Core Concepts"]
});

module.exports = { generateResumeContent, generateLearningPlan };