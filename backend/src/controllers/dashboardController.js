const User = require('../models/User');
const Resume = require('../models/Resume');
const InterviewSession = require('../models/InterviewSession');
const { asyncHandler } = require('../middleware/errorHandler');

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/dashboard
// @desc    Get dashboard data for current user
// @access  Private
// ─────────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    totalResumes,
    analyzedResumes,
    latestResume,
    totalInterviews,
    completedInterviews,
    recentInterviews,
    recentResumes,
  ] = await Promise.all([
    Resume.countDocuments({ user: userId }),
    Resume.countDocuments({ user: userId, isAnalyzed: true }),
    Resume.findOne({ user: userId, isLatest: true })
      .select('atsScore label versionLabel isAnalyzed createdAt'),
    InterviewSession.countDocuments({ candidate: userId }),
    InterviewSession.countDocuments({ candidate: userId, status: 'completed' }),
    InterviewSession.find({ candidate: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('interviewType status overallScore durationMinutes createdAt'),
    Resume.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('label atsScore versionLabel isAnalyzed fileType createdAt'),
  ]);

  // Average interview score
  const scoreAgg = await InterviewSession.aggregate([
    { $match: { candidate: require('mongoose').Types.ObjectId.createFromHexString(userId), status: 'completed' } },
    { $group: { _id: null, avgScore: { $avg: '$overallScore' } } },
  ]);
  const avgInterviewScore = scoreAgg[0]?.avgScore ? Math.round(scoreAgg[0].avgScore) : null;

  res.status(200).json({
    success: true,
    dashboard: {
      user: {
        fullName: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.role,
        targetRole: req.user.targetRole,
        experienceLevel: req.user.experienceLevel,
        avatar: req.user.avatar,
      },
      stats: {
        totalResumes,
        analyzedResumes,
        totalInterviews,
        completedInterviews,
        avgInterviewScore,
        latestAtsScore: latestResume?.atsScore || null,
      },
      latestResume,
      recentInterviews,
      recentResumes,
    },
  });
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/dashboard/recruiter
// @desc    Recruiter dashboard — see all candidates
// @access  Private (recruiter only)
// ─────────────────────────────────────────────────────
const getRecruiterDashboard = asyncHandler(async (req, res) => {
  // Get all candidates with their best ATS scores and interview scores
  const candidates = await User.find({ role: 'candidate', isActive: true })
    .select('firstName lastName email targetRole experienceLevel totalResumesUploaded totalInterviewsTaken avgInterviewScore bestAtsScore lastLoginAt createdAt')
    .sort({ createdAt: -1 })
    .limit(50);

  const totalCandidates = await User.countDocuments({ role: 'candidate' });
  const totalInterviews = await InterviewSession.countDocuments({ status: 'completed' });

  res.status(200).json({
    success: true,
    dashboard: {
      stats: {
        totalCandidates,
        totalInterviews,
      },
      candidates,
    },
  });
});

module.exports = { getDashboard, getRecruiterDashboard };
