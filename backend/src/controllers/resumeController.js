const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/resumes/upload
// @desc    Upload a resume file
// @access  Private (candidate)
// ─────────────────────────────────────────────────────
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a resume file (PDF or DOCX).' });
  }

  const { label, targetRole, versionLabel } = req.body;
  const file = req.file;
  const ext = path.extname(file.originalname).replace('.', '').toLowerCase();

  // Mark previous versions as not latest
  await Resume.updateMany(
    { user: req.user.id, isLatest: true },
    { isLatest: false }
  );

  // Count versions
  const versionCount = await Resume.countDocuments({ user: req.user.id });

  // Create resume record
  const resume = await Resume.create({
    user: req.user.id,
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    fileSize: file.size,
    fileType: ext === 'doc' ? 'doc' : ext === 'docx' ? 'docx' : 'pdf',
    versionNumber: versionCount + 1,
    versionLabel: versionLabel || `v${versionCount + 1}`,
    label: label || `My Resume`,
    targetRole: targetRole || null,
    isLatest: true,
  });

  // Update user stats
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { totalResumesUploaded: 1 },
  });

  res.status(201).json({
    success: true,
    message: 'Resume uploaded successfully! 🎉 Ready for AI analysis.',
    resume: {
      id: resume._id,
      label: resume.label,
      originalName: resume.originalName,
      fileType: resume.fileType,
      fileSizeKB: resume.fileSizeKB,
      versionNumber: resume.versionNumber,
      versionLabel: resume.versionLabel,
      isLatest: resume.isLatest,
      isAnalyzed: resume.isAnalyzed,
      targetRole: resume.targetRole,
      createdAt: resume.createdAt,
    },
  });
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/resumes
// @desc    Get all resumes for current user
// @access  Private
// ─────────────────────────────────────────────────────
const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .select('-extractedText -parsedSections'); // Don't send full text in list

  res.status(200).json({
    success: true,
    count: resumes.length,
    resumes,
  });
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/resumes/:id
// @desc    Get a single resume with full data
// @access  Private
// ─────────────────────────────────────────────────────
const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.' });
  }

  res.status(200).json({ success: true, resume });
});

// ─────────────────────────────────────────────────────
// @route   DELETE /api/v1/resumes/:id
// @desc    Delete a resume
// @access  Private
// ─────────────────────────────────────────────────────
const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.' });
  }

  // Delete file from disk
  if (resume.filePath && fs.existsSync(resume.filePath)) {
    fs.unlinkSync(resume.filePath);
  }

  await Resume.findByIdAndDelete(req.params.id);

  // If deleted was latest, promote previous version
  if (resume.isLatest) {
    const prevResume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (prevResume) {
      prevResume.isLatest = true;
      await prevResume.save();
    }
  }

  res.status(200).json({ success: true, message: 'Resume deleted successfully.' });
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/resumes/:id/download
// @desc    Download resume file
// @access  Private
// ─────────────────────────────────────────────────────
const downloadResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.' });
  }

  if (!fs.existsSync(resume.filePath)) {
    return res.status(404).json({ success: false, message: 'File not found on server.' });
  }

  res.download(resume.filePath, resume.originalName);
});

// ─────────────────────────────────────────────────────
// @route   PUT /api/v1/resumes/:id/label
// @desc    Update resume label or targetRole
// @access  Private
// ─────────────────────────────────────────────────────
const updateResumeLabel = asyncHandler(async (req, res) => {
  const { label, targetRole, versionLabel } = req.body;

  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { label, targetRole, versionLabel },
    { new: true, runValidators: true }
  );

  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.' });
  }

  res.status(200).json({ success: true, message: 'Resume updated.', resume });
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/resumes/stats
// @desc    Get resume stats for dashboard
// @access  Private
// ─────────────────────────────────────────────────────
const getResumeStats = asyncHandler(async (req, res) => {
  const [totalResumes, analyzedResumes, latestResume] = await Promise.all([
    Resume.countDocuments({ user: req.user.id }),
    Resume.countDocuments({ user: req.user.id, isAnalyzed: true }),
    Resume.findOne({ user: req.user.id, isLatest: true }).select('atsScore label versionLabel'),
  ]);

  const bestScore = await Resume.findOne({ user: req.user.id })
    .sort({ atsScore: -1 })
    .select('atsScore label');

  res.status(200).json({
    success: true,
    stats: {
      totalResumes,
      analyzedResumes,
      latestResume,
      bestAtsScore: bestScore?.atsScore || null,
    },
  });
});

module.exports = {
  uploadResume,
  getMyResumes,
  getResume,
  deleteResume,
  downloadResume,
  updateResumeLabel,
  getResumeStats,
};
