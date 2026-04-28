const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGemini = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

// ── Generate resume content from form data ─────────────
const generateResumeContent = async (formData) => {
  const model = getGemini();

  const prompt = `You are an expert resume writer. Create a professional, ATS-optimized resume based on this information.

NAME: ${formData.name}
EMAIL: ${formData.email}
PHONE: ${formData.phone}
LOCATION: ${formData.location}
LINKEDIN: ${formData.linkedin || 'Not provided'}
GITHUB: ${formData.github || 'Not provided'}
TARGET ROLE: ${formData.targetRole}
EXPERIENCE LEVEL: ${formData.experienceLevel}
SUMMARY: ${formData.summary || 'Generate a professional summary'}
SKILLS: ${formData.skills}
EXPERIENCE: ${JSON.stringify(formData.experience || [])}
EDUCATION: ${JSON.stringify(formData.education || [])}
PROJECTS: ${JSON.stringify(formData.projects || [])}
CERTIFICATIONS: ${formData.certifications || 'None'}

Return ONLY valid JSON with this structure:
{
  "summary": "2-3 sentence professional summary with power words",
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"]
  },
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2023 - Present",
      "bullets": ["bullet1 with action verb and metrics", "bullet2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "one line description",
      "bullets": ["bullet1", "bullet2"],
      "tech": ["tech1", "tech2"]
    }
  ],
  "education": [
    {
      "degree": "B.Tech in CS",
      "institution": "University Name",
      "duration": "2020-2024",
      "gpa": "8.5"
    }
  ],
  "powerWords": ["achieved", "built", "optimized"],
  "atsScore": 85,
  "improvements": ["suggestion1", "suggestion2"]
}`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  return JSON.parse(jsonMatch[0]);
};

// ── Generate learning recommendations ─────────────────
const generateLearningPlan = async (weaknesses, interviewType, targetRole) => {
  const model = getGemini();

  const prompt = `You are a career coach. Generate a personalized learning plan based on interview performance.

TARGET ROLE: ${targetRole || 'Software Developer'}
INTERVIEW TYPE: ${interviewType}
WEAK AREAS: ${weaknesses?.join(', ') || 'General improvement needed'}

Return ONLY valid JSON:
{
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "topic to focus on",
      "tasks": ["task1", "task2", "task3"],
      "resources": [
        {"title": "resource name", "type": "video|article|course|practice", "url": "https://..."}
      ]
    }
  ],
  "quickWins": ["quick tip 1", "quick tip 2", "quick tip 3"],
  "estimatedTime": "4 weeks",
  "topicsToRevise": ["topic1", "topic2", "topic3"]
}

Return a 3-week plan with real, helpful resources.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text().trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  return JSON.parse(jsonMatch[0]);
};

module.exports = { generateResumeContent, generateLearningPlan };