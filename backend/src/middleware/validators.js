const { body, validationResult } = require('express-validator');

// ── Run validation and return errors ──────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth Validators ────────────────────────────────────
const registerValidator = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  body('role')
    .optional()
    .isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),

  validate,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate,
];

// ── Profile Update Validators ──────────────────────────
const updateProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),

  body('linkedinUrl')
    .optional()
    .trim()
    .isURL().withMessage('Please enter a valid LinkedIn URL'),

  body('githubUrl')
    .optional()
    .trim()
    .isURL().withMessage('Please enter a valid GitHub URL'),

  validate,
];

module.exports = { registerValidator, loginValidator, updateProfileValidator, validate };
