const express = require('express');
const router = express.Router();
const {
  uploadResume, getMyResumes, getResume,
  deleteResume, downloadResume,
  updateResumeLabel, getResumeStats,
} = require('../controllers/resumeController');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../config/multer');

// All resume routes require login
router.use(protect);

// Stats
router.get('/stats', getResumeStats);

// CRUD
router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getMyResumes);
router.get('/:id', getResume);
router.delete('/:id', deleteResume);
router.get('/:id/download', downloadResume);
router.put('/:id/label', updateResumeLabel);

module.exports = router;
