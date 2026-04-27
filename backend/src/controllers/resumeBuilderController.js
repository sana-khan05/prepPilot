const { asyncHandler } = require('../middleware/errorHandler');
const { generateResumeContent, generateLearningPlan } = require('../services/resumeBuilderService');
const InterviewSession = require('../models/InterviewSession');

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/builder/generate
// @desc    Generate AI resume from form data
// @access  Private
// ─────────────────────────────────────────────────────
const generateResume = asyncHandler(async (req, res) => {
  const {
    name, email, phone, location, linkedin, github,
    targetRole, experienceLevel, summary, skills,
    experience, education, projects, certifications,
  } = req.body;

  if (!name || !email || !targetRole) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and target role are required.',
    });
  }

  const resumeData = await generateResumeContent({
    name, email, phone, location, linkedin, github,
    targetRole, experienceLevel, summary, skills,
    experience: experience || [],
    education: education || [],
    projects: projects || [],
    certifications,
  });

  res.status(200).json({
    success: true,
    message: 'Resume generated successfully! 🎉',
    resume: resumeData,
    userInfo: { name, email, phone, location, linkedin, github },
  });
});

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/builder/learning-plan
// @desc    Generate learning plan from interview performance
// @access  Private
// ─────────────────────────────────────────────────────
const getLearningPlan = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  let weaknesses = [];
  let interviewType = 'technical';
  let targetRole = 'Software Developer';

  // Get data from interview session if provided
  if (sessionId) {
    const session = await InterviewSession.findOne({
      _id: sessionId,
      candidate: req.user.id,
      status: 'completed',
    });

    if (session) {
      weaknesses = session.weaknesses || [];
      interviewType = session.interviewType;
      targetRole = session.targetRole || 'Software Developer';
    }
  }

  // Use provided weaknesses if no session
  if (req.body.weaknesses) {
    weaknesses = req.body.weaknesses;
  }
  if (req.body.targetRole) {
    targetRole = req.body.targetRole;
  }

  const plan = await generateLearningPlan(weaknesses, interviewType, targetRole);

  res.status(200).json({
    success: true,
    plan,
    targetRole,
    interviewType,
  });
});

module.exports = { generateResume, getLearningPlan };