const Resume = require('../models/Resume');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  extractResumeText,
  calculateATSScore,
  detectBias,
  analyzeResumeWithAI,
} = require('../services/resumeAnalysis');

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/analysis/:resumeId/analyze
// @desc    Analyze a resume with AI
// @access  Private
// ─────────────────────────────────────────────────────
const analyzeResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({
    _id: req.params.resumeId,
    user: req.user.id,
  });

  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.' });
  }

  // Check if file exists
  const fs = require('fs');
  // Skip file existence check for Cloudinary URLs
  if (!resume.filePath.startsWith('http') && !fs.existsSync(resume.filePath)) {
    return res.status(404).json({ success: false, message: 'Resume file not found on server.' });
  }

  res.json({ success: true, message: 'Analysis started...', status: 'processing' });

  // Run analysis in background
  try {
    // Step 1: Extract text
    const extractedText = await extractResumeText(resume.filePath, resume.fileType);

    // Step 2: ATS Score
    const atsResult = calculateATSScore(extractedText, req.body?.jobDescription || '');

    // Step 3: Bias detection
    const biasFlags = detectBias(extractedText);

    // Step 4: AI Analysis
    const aiResult = await analyzeResumeWithAI(
      extractedText,
      resume.targetRole || '',
      req.body?.jobDescription || ''
    );

    // Step 5: Save results
    await Resume.findByIdAndUpdate(resume._id, {
      extractedText,
      atsScore: atsResult.total,
      atsBreakdown: atsResult.breakdown,
      extractedSkills: aiResult.skillsFound || [],
      sectionRatings: {
        summary: aiResult.sectionRatings?.summary?.score || null,
        experience: aiResult.sectionRatings?.experience?.score || null,
        skills: aiResult.sectionRatings?.skills?.score || null,
        projects: aiResult.sectionRatings?.projects?.score || null,
        education: aiResult.sectionRatings?.education?.score || null,
      },
      aiFeedback: JSON.stringify({
        overall: aiResult.overallFeedback,
        sectionRatings: aiResult.sectionRatings,
        strengths: aiResult.strengths,
        improvements: aiResult.improvements,
        missingSkills: aiResult.missingSkills,
        rewrittenBullets: aiResult.rewrittenBullets,
        powerWords: aiResult.powerWords,
      }),
      biasFlags,
      improvementSuggestions: aiResult.improvements || [],
      isAnalyzed: true,
      analyzedAt: new Date(),
    });

    console.log(`✅ Resume ${resume._id} analyzed successfully. ATS Score: ${atsResult.total}`);
  } catch (err) {
    console.error('❌ Resume analysis failed:', err.message);
    await Resume.findByIdAndUpdate(resume._id, { isAnalyzed: false });
  }
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/analysis/:resumeId/result
// @desc    Get analysis result for a resume
// @access  Private
// ─────────────────────────────────────────────────────
const getAnalysisResult = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({
    _id: req.params.resumeId,
    user: req.user.id,
  });

  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found.' });
  }

  if (!resume.isAnalyzed) {
    return res.status(200).json({
      success: true,
      status: 'pending',
      message: 'Analysis not done yet. Click Analyze to start.',
    });
  }

  let aiFeedback = null;
  try {
    aiFeedback = resume.aiFeedback ? JSON.parse(resume.aiFeedback) : null;
  } catch {
    aiFeedback = { overall: resume.aiFeedback };
  }

  res.status(200).json({
    success: true,
    status: 'completed',
    result: {
      atsScore: resume.atsScore,
      atsBreakdown: resume.atsBreakdown,
      sectionRatings: resume.sectionRatings,
      extractedSkills: resume.extractedSkills,
      biasFlags: resume.biasFlags,
      improvementSuggestions: resume.improvementSuggestions,
      analyzedAt: resume.analyzedAt,
      aiFeedback,
    },
  });
});

module.exports = { analyzeResume, getAnalysisResult };