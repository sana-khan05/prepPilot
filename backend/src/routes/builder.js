const express = require('express');
const router = express.Router();
const { generateResume, getLearningPlan } = require('../controllers/resumeBuilderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/generate', generateResume);
router.post('/learning-plan', getLearningPlan);

module.exports = router;