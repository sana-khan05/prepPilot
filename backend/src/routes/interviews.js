const express = require('express');
const router = express.Router();
const {
  startInterview, submitAnswer, completeInterview,
  getInterviews, getInterview,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getInterviews);
router.post('/start', startInterview);
router.get('/:id', getInterview);
router.post('/:id/answer', submitAnswer);
router.post('/:id/complete', completeInterview);

module.exports = router;