const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a resume file (PDF or DOCX).' });
  }

  const { label, targetRole, versionLabel } = req.body;
  const file = req.file;
  const ext = file.originalname.split('.').pop().toLowerCase();

  // Handle both local and Cloudinary uploads
  const fileUrl = file.path; // Cloudinary gives full URL, local gives file path
  const fileSize = file.size || 0;

  await Resume.updateMany({ user: req.user.id, isLatest: true }, { isLatest: false });
  const versionCount = await Resume.countDocuments({ user: req.user.id });

  const resume = await Resume.create({
    user: req.user.id,
    originalName: file.originalname,
    fileName: file.filename || file.originalname,
    filePath: fileUrl,
    fileSize: fileSize,
    fileType: ext === 'doc' ? 'doc' : ext === 'docx' ? 'docx' : 'pdf',
    versionNumber: versionCount + 1,
    versionLabel: versionLabel || `v${versionCount + 1}`,
    label: label || 'My Resume',
    targetRole: targetRole || null,
    isLatest: true,
    cloudinaryUrl: process.env.NODE_ENV === 'production' ? fileUrl : null,
  });

  await User.findByIdAndUpdate(req.user.id, { $inc: { totalResumesUploaded: 1 } });

  res.status(201).json({
    success: true,
    message: 'Resume uploaded successfully! 🎉 Ready for AI analysis.',
    resume: {
      id: resume._id,
      label: resume.label,
      originalName: resume.originalName,
      fileType: resume.fileType,
      fileSizeKB: Math.round(fileSize / 1024),
      versionNumber: resume.versionNumber,
      versionLabel: resume.versionLabel,
      isLatest: resume.isLatest,
      isAnalyzed: resume.isAnalyzed,
      targetRole: resume.targetRole,
      createdAt: resume.createdAt,
    },
  });
});

const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .select('-extractedText -parsedSections');

  res.status(200).json({ success: true, count: resumes.length, resumes });
});

const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });
  res.status(200).json({ success: true, resume });
});

const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

  // Delete from Cloudinary if production
  if (process.env.NODE_ENV === 'production' && resume.cloudinaryUrl) {
    try {
      const { cloudinary } = require('../config/cloudinary');
      const publicId = resume.cloudinaryUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`preppilot-resumes/${publicId}`, { resource_type: 'raw' });
    } catch (err) {
      console.error('Cloudinary delete error:', err.message);
    }
  } else if (resume.filePath && fs.existsSync(resume.filePath)) {
    fs.unlinkSync(resume.filePath);
  }

  await Resume.findByIdAndDelete(req.params.id);

  if (resume.isLatest) {
    const prevResume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (prevResume) { prevResume.isLatest = true; await prevResume.save(); }
  }

  res.status(200).json({ success: true, message: 'Resume deleted successfully.' });
});

const downloadResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

  // If Cloudinary URL — redirect to it
  if (resume.filePath && resume.filePath.startsWith('http')) {
    return res.redirect(resume.filePath);
  }

  if (!fs.existsSync(resume.filePath)) {
    return res.status(404).json({ success: false, message: 'File not found on server.' });
  }

  res.download(resume.filePath, resume.originalName);
});

const updateResumeLabel = asyncHandler(async (req, res) => {
  const { label, targetRole, versionLabel } = req.body;
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { label, targetRole, versionLabel },
    { new: true, runValidators: true }
  );
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });
  res.status(200).json({ success: true, message: 'Resume updated.', resume });
});

const getResumeStats = asyncHandler(async (req, res) => {
  const [totalResumes, analyzedResumes, latestResume] = await Promise.all([
    Resume.countDocuments({ user: req.user.id }),
    Resume.countDocuments({ user: req.user.id, isAnalyzed: true }),
    Resume.findOne({ user: req.user.id, isLatest: true }).select('atsScore label versionLabel'),
  ]);
  const bestScore = await Resume.findOne({ user: req.user.id }).sort({ atsScore: -1 }).select('atsScore label');
  res.status(200).json({
    success: true,
    stats: { totalResumes, analyzedResumes, latestResume, bestAtsScore: bestScore?.atsScore || null },
  });
});

module.exports = { uploadResume, getMyResumes, getResume, deleteResume, downloadResume, updateResumeLabel, getResumeStats };