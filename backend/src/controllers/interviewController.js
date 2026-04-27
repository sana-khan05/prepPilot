const InterviewSession = require('../models/InterviewSession');
const Resume = require('../models/Resume');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateQuestions, evaluateAnswer, generateInterviewReport } = require('../services/interviewService');

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/interviews/start
// @desc    Start a new interview session
// @access  Private
// ─────────────────────────────────────────────────────
const startInterview = asyncHandler(async (req, res) => {
  const { interviewType, targetRole, difficulty, resumeId } = req.body;

  if (!interviewType) {
    return res.status(400).json({ success: false, message: 'Interview type is required.' });
  }

  // Get resume text if provided
  let resumeText = '';
  let resume = null;
  if (resumeId) {
    resume = await Resume.findOne({ _id: resumeId, user: req.user.id });
    if (resume?.extractedText) resumeText = resume.extractedText;
  }

  // Generate questions
  const questions = await generateQuestions(
    resumeText,
    interviewType,
    targetRole || req.user.targetRole || 'Software Developer',
    difficulty || 'adaptive'
  );

  // Create session
  const session = await InterviewSession.create({
    candidate: req.user.id,
    resume: resumeId || null,
    interviewType,
    targetRole: targetRole || 'Software Developer',
    difficultyLevel: difficulty || 'adaptive',
    totalQuestionsPlanned: questions.length,
    status: 'in_progress',
    startedAt: new Date(),
    questions: questions.map(q => ({
      questionText: q.question,
      questionType: interviewType,
      difficulty: q.difficulty || 'medium',
      topic: q.topic || '',
    })),
  });

  res.status(201).json({
    success: true,
    message: 'Interview started! Good luck! 🎤',
    session: {
      id: session._id,
      interviewType: session.interviewType,
      targetRole: session.targetRole,
      totalQuestions: session.totalQuestionsPlanned,
      status: session.status,
      questions: session.questions.map((q, i) => ({
        index: i,
        id: q._id,
        questionText: q.questionText,
        topic: q.topic,
        difficulty: q.difficulty,
      })),
    },
  });
});

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/interviews/:id/answer
// @desc    Submit answer for a question
// @access  Private
// ─────────────────────────────────────────────────────
const submitAnswer = asyncHandler(async (req, res) => {
  const { questionIndex, answer } = req.body;

  if (questionIndex === undefined || !answer) {
    return res.status(400).json({ success: false, message: 'Question index and answer are required.' });
  }

  const session = await InterviewSession.findOne({
    _id: req.params.id,
    candidate: req.user.id,
    status: 'in_progress',
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Interview session not found.' });
  }

  const question = session.questions[questionIndex];
  if (!question) {
    return res.status(400).json({ success: false, message: 'Invalid question index.' });
  }

  // Evaluate answer with AI
  const evaluation = await evaluateAnswer(
    question.questionText,
    answer,
    session.interviewType
  );

  // Update question with answer and evaluation
  session.questions[questionIndex].userAnswer = answer;
  session.questions[questionIndex].answeredAt = new Date();
  session.questions[questionIndex].aiEvaluation = {
    score: evaluation.score,
    feedback: evaluation.feedback,
    starCompliance: evaluation.starCompliance,
    fillerWords: evaluation.fillerWords || [],
  };

  // Count filler words
  const totalFillers = [...(session.totalFillerWords || []), ...(evaluation.fillerWords || [])];
  session.totalFillerWords = totalFillers;
  session.fillerWordCount = totalFillers.length;
  session.currentQuestionIndex = questionIndex + 1;

  await session.save();

  res.status(200).json({
    success: true,
    evaluation: {
      score: evaluation.score,
      feedback: evaluation.feedback,
      starCompliance: evaluation.starCompliance,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      idealAnswer: evaluation.idealAnswer,
      fillerWords: evaluation.fillerWords,
      nextDifficulty: evaluation.nextDifficulty,
    },
    progress: {
      answered: questionIndex + 1,
      total: session.totalQuestionsPlanned,
      isLast: questionIndex + 1 >= session.totalQuestionsPlanned,
    },
  });
});

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/interviews/:id/complete
// @desc    Complete interview and generate report
// @access  Private
// ─────────────────────────────────────────────────────
const completeInterview = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.id,
    candidate: req.user.id,
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  // Get all scores
  const scores = session.questions
    .filter(q => q.aiEvaluation?.score !== null && q.aiEvaluation?.score !== undefined)
    .map(q => q.aiEvaluation.score);

  const answers = session.questions.map(q => q.userAnswer || '');
  const questions = session.questions.map(q => ({ question: q.questionText }));

  // Generate final report
  const report = await generateInterviewReport(
    questions, answers, scores,
    session.interviewType, session.targetRole
  );

  // Update session
  session.status = 'completed';
  session.completedAt = new Date();
  session.durationMinutes = Math.round(
    (new Date() - session.startedAt) / 1000 / 60
  );
  session.overallScore = report.overallScore;
  session.scores = report.scores;
  session.aiFeedbackReport = report.summary;
  session.strengths = report.strengths;
  session.weaknesses = report.weaknesses;
  session.improvementPlan = report.improvementPlan;
  session.reportGenerated = true;
  session.reportGeneratedAt = new Date();

  await session.save();

  res.status(200).json({
    success: true,
    message: 'Interview completed! 🎉',
    report: {
      overallScore: report.overallScore,
      summary: report.summary,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      improvementPlan: report.improvementPlan,
      scores: report.scores,
      recommendedResources: report.recommendedResources,
      durationMinutes: session.durationMinutes,
      fillerWordCount: session.fillerWordCount,
    },
  });
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/interviews
// @desc    Get all interview sessions
// @access  Private
// ─────────────────────────────────────────────────────
const getInterviews = asyncHandler(async (req, res) => {
  const sessions = await InterviewSession.find({ candidate: req.user.id })
    .sort({ createdAt: -1 })
    .select('-questions.userAnswer -questions.aiEvaluation')
    .limit(20);

  res.status(200).json({ success: true, sessions });
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/interviews/:id
// @desc    Get single interview session
// @access  Private
// ─────────────────────────────────────────────────────
const getInterview = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.id,
    candidate: req.user.id,
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  res.status(200).json({ success: true, session });
});

module.exports = { startInterview, submitAnswer, completeInterview, getInterviews, getInterview };