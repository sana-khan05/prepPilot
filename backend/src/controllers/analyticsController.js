const InterviewSession = require('../models/InterviewSession');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/analytics
// @desc    Get full analytics for current user
// @access  Private
// ─────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const objectId = mongoose.Types.ObjectId.createFromHexString(userId);

  // ── Interview Stats ────────────────────────────────
  const [
    totalInterviews,
    completedInterviews,
    allSessions,
    resumeStats,
  ] = await Promise.all([
    InterviewSession.countDocuments({ candidate: userId }),
    InterviewSession.countDocuments({ candidate: userId, status: 'completed' }),
    InterviewSession.find({ candidate: userId, status: 'completed' })
      .sort({ createdAt: 1 })
      .select('overallScore scores interviewType createdAt durationMinutes fillerWordCount strengths weaknesses'),
    Resume.find({ user: userId, isAnalyzed: true })
      .select('atsScore label versionLabel createdAt extractedSkills sectionRatings'),
  ]);

  // ── Score Progress (for chart) ─────────────────────
  const scoreProgress = allSessions.map((s, i) => ({
    session: i + 1,
    date: new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    score: s.overallScore || 0,
    type: s.interviewType,
  }));

  // ── Average scores ─────────────────────────────────
  const avgScore = allSessions.length > 0
    ? Math.round(allSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / allSessions.length)
    : 0;

  // ── Best & worst session ───────────────────────────
  const bestSession = allSessions.reduce((best, s) =>
    (s.overallScore || 0) > (best?.overallScore || 0) ? s : best, null);
  const worstSession = allSessions.reduce((worst, s) =>
    (s.overallScore || 0) < (worst?.overallScore || 999) ? s : worst, null);

  // ── Interview type breakdown ───────────────────────
  const typeBreakdown = {};
  allSessions.forEach(s => {
    if (!typeBreakdown[s.interviewType]) {
      typeBreakdown[s.interviewType] = { count: 0, totalScore: 0 };
    }
    typeBreakdown[s.interviewType].count++;
    typeBreakdown[s.interviewType].totalScore += s.overallScore || 0;
  });
  const typeStats = Object.entries(typeBreakdown).map(([type, data]) => ({
    type,
    count: data.count,
    avgScore: Math.round(data.totalScore / data.count),
  }));

  // ── Skill metrics ──────────────────────────────────
  const avgCommunication = allSessions.length > 0
    ? Math.round(allSessions.reduce((sum, s) => sum + (s.scores?.communication || 0), 0) / allSessions.length)
    : 0;
  const avgTechnical = allSessions.length > 0
    ? Math.round(allSessions.reduce((sum, s) => sum + (s.scores?.technical || 0), 0) / allSessions.length)
    : 0;
  const avgConfidence = allSessions.length > 0
    ? Math.round(allSessions.reduce((sum, s) => sum + (s.scores?.confidence || 0), 0) / allSessions.length)
    : 0;

  // ── Filler words total ─────────────────────────────
  const totalFillerWords = allSessions.reduce((sum, s) => sum + (s.fillerWordCount || 0), 0);

  // ── ATS score progress ─────────────────────────────
  const atsProgress = resumeStats.map((r, i) => ({
    version: r.versionLabel || `v${i+1}`,
    label: r.label,
    score: r.atsScore || 0,
    date: new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  // ── Recent sessions ────────────────────────────────
  const recentSessions = await InterviewSession.find({ candidate: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('interviewType status overallScore durationMinutes createdAt targetRole');

  res.status(200).json({
    success: true,
    analytics: {
      overview: {
        totalInterviews,
        completedInterviews,
        avgScore,
        totalFillerWords,
        avgCommunication,
        avgTechnical,
        avgConfidence,
        bestScore: bestSession?.overallScore || 0,
        improvement: scoreProgress.length >= 2
          ? scoreProgress[scoreProgress.length - 1].score - scoreProgress[0].score
          : 0,
      },
      scoreProgress,
      typeStats,
      atsProgress,
      recentSessions,
      bestSession: bestSession ? {
        score: bestSession.overallScore,
        type: bestSession.interviewType,
        date: bestSession.createdAt,
      } : null,
    },
  });
});

module.exports = { getAnalytics };