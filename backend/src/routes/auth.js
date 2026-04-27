const express = require('express');
const router = express.Router();
const {
  register, login, getMe, logout,
  refreshToken, updateProfile, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidator, loginValidator, updateProfileValidator } = require('../middleware/validators');

// Public routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh', refreshToken);

// Protected routes (must be logged in)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-profile', protect, updateProfileValidator, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
