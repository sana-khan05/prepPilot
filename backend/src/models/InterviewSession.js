const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['technical', 'behavioral', 'hr', 'coding', 'case', 'followup'],
    default: 'technical',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  topic: { type: String, default: null },
  userAnswer: { type: String, default: null },
  aiEvaluation: {
    score: { type: Number, default: null, min: 0, max: 10 },
    feedback: { type: String, default: null },
    starCompliance: { type: Boolean, default: null },
    fillerWords: [{ type: String }],
    answerDurationSeconds: { type: Number, default: null },
  },
  answeredAt: { type: Date, default: null },
  skipped: { type: Boolean, default: false },
}, { _id: true });

const interviewSessionSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    interviewType: {
      type: String,
      enum: ['technical', 'hr', 'behavioral', 'coding', 'case', 'mixed'],
      required: true,
    },
    targetRole: { type: String, default: null },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'adaptive'],
      default: 'adaptive',
    },
    totalQuestionsPlanned: { type: Number, default: 10 },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
      default: 'not_started',
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
    questions: [questionSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    overallScore: { type: Number, default: null, min: 0, max: 100 },
    scores: {
      technical: { type: Number, default: null },
      communication: { type: Number, default: null },
      confidence: { type: Number, default: null },
      starMethodUsage: { type: Number, default: null },
    },
    fillerWordCount: { type: Number, default: 0 },
    totalFillerWords: [{ type: String }],
    aiFeedbackReport: { type: String, default: null },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    improvementPlan: [{ type: String }],
    resumeVsInterviewMismatch: [{ type: String }],
    reportGenerated: { type: Boolean, default: false },
    reportGeneratedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ── Virtuals ───────────────────────────────────────────
interviewSessionSchema.virtual('questionsAnswered').get(function () {
  return (this.questions || []).filter(q => q.userAnswer && !q.skipped).length;
});

interviewSessionSchema.virtual('completionPercent').get(function () {
  if (!this.totalQuestionsPlanned) return 0;
  return Math.round((this.questionsAnswered / this.totalQuestionsPlanned) * 100);
});

interviewSessionSchema.index({ candidate: 1, status: 1 });
interviewSessionSchema.index({ candidate: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);