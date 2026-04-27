const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    // ── Owner ─────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── File Info ─────────────────────────────────────
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },      // stored filename
    filePath: { type: String, required: true },       // local path or cloud URL
    fileSize: { type: Number, required: true },       // bytes
    fileType: {
      type: String,
      enum: ['pdf', 'doc', 'docx'],
      required: true,
    },
    cloudinaryUrl: { type: String, default: null },  // for production

    // ── Version Control ───────────────────────────────
    versionNumber: { type: Number, default: 1 },
    versionLabel: { type: String, default: 'v1' },   // e.g. "v1", "After SDE Feedback"
    isLatest: { type: Boolean, default: true },
    previousVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },

    // ── Extracted Content (Phase 2 fills these) ───────
    extractedText: { type: String, default: null },
    parsedSections: {
      summary: { type: String, default: null },
      experience: [{ type: String }],
      education: [{ type: String }],
      skills: [{ type: String }],
      projects: [{ type: String }],
      certifications: [{ type: String }],
    },
    extractedSkills: [{ type: String }],

    // ── ATS Analysis (Phase 2 fills these) ────────────
    atsScore: { type: Number, default: null, min: 0, max: 100 },
    atsBreakdown: {
      keywordMatch: { type: Number, default: null },
      formatting: { type: Number, default: null },
      sectionCompleteness: { type: Number, default: null },
      readability: { type: Number, default: null },
    },
    sectionRatings: {
      summary: { type: Number, default: null, min: 0, max: 5 },
      experience: { type: Number, default: null, min: 0, max: 5 },
      skills: { type: Number, default: null, min: 0, max: 5 },
      projects: { type: Number, default: null, min: 0, max: 5 },
      education: { type: Number, default: null, min: 0, max: 5 },
    },
    aiFeedback: { type: String, default: null },
    biasFlags: [{ type: String }],        // e.g. ["age_indicator", "gendered_language"]
    improvementSuggestions: [{ type: String }],

    // ── Metadata ──────────────────────────────────────
    label: { type: String, default: 'My Resume' },   // user-given name
    targetRole: { type: String, default: null },
    targetJobDescription: { type: String, default: null },
    isAnalyzed: { type: Boolean, default: false },
    analyzedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: file size in KB
resumeSchema.virtual('fileSizeKB').get(function () {
  return Math.round(this.fileSize / 1024);
});

// Index for faster user resume queries
resumeSchema.index({ user: 1, isLatest: 1 });
resumeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
