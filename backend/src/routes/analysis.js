const express = require('express');
const router = express.Router();
const { analyzeResume, getAnalysisResult } = require('../controllers/analysisController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/:resumeId/analyze', analyzeResume);
router.get('/:resumeId/result', getAnalysisResult);

module.exports = router;