const User = require('../models/User');
const { sendTokenResponse, generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { asyncHandler } = require('../middleware/errorHandler');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/auth/register
// @desc    Register new user
// @access  Public
// ─────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'candidate',
  });

  console.log(`✅ New user registered: ${user.email} (${user.role})`);

  sendTokenResponse(user, 201, res, 'Account created successfully! Welcome to InterviewIQ 🎉');
});

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
// ─────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account deactivated. Contact support.',
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  console.log(`✅ User logged in: ${user.email}`);

  sendTokenResponse(user, 200, res, `Welcome back, ${user.firstName}!`);
});

// ─────────────────────────────────────────────────────
// @route   GET /api/v1/auth/me
// @desc    Get current logged-in user
// @access  Private
// ─────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by protect middleware
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user: user.toSafeObject(),
  });
});

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/auth/logout
// @desc    Logout user (clears cookie)
// @access  Private
// ─────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  res.cookie('accessToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// ─────────────────────────────────────────────────────
// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
// ─────────────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token required.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'User not found.' });
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  res.status(200).json({
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// ─────────────────────────────────────────────────────
// @route   PUT /api/v1/auth/update-profile
// @desc    Update user profile
// @access  Private
// ─────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'bio',
    'location', 'linkedinUrl', 'githubUrl',
    'targetRole', 'experienceLevel',
  ];

  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: user.toSafeObject(),
  });
});

// ─────────────────────────────────────────────────────
// @route   PUT /api/v1/auth/change-password
// @desc    Change password
// @access  Private
// ─────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required.',
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters.',
    });
  }

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

module.exports = { register, login, getMe, logout, refreshToken, updateProfile, changePassword };
