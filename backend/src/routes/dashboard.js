const express = require('express');
const router = express.Router();
const { getDashboard, getRecruiterDashboard } = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', protect, getDashboard);
router.get('/recruiter', protect, restrictTo('recruiter', 'admin'), getRecruiterDashboard);

module.exports = router;
