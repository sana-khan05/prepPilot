const jwt = require('jsonwebtoken');

// ── Generate access token (short-lived) ───────────────
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── Generate refresh token (long-lived) ───────────────
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// ── Send tokens as response ────────────────────────────
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res
    .status(statusCode)
    .cookie('accessToken', accessToken, cookieOptions)
    .json({
      success: true,
      message,
      accessToken,
      refreshToken,
      user: user.toSafeObject ? user.toSafeObject() : user,
    });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokenResponse };
