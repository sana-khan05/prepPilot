const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    // ── Role ──────────────────────────────────────────
    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin'],
      default: 'candidate',
    },

    // ── Profile ───────────────────────────────────────
    avatar: { type: String, default: null },
    phone: { type: String, default: null },
    bio: { type: String, maxlength: 500, default: null },
    location: { type: String, default: null },
    linkedinUrl: { type: String, default: null },
    githubUrl: { type: String, default: null },
    targetRole: {
      type: String,
      enum: ['software-engineer', 'data-analyst', 'ml-engineer', 'product-manager', 'devops', 'other', null],
      default: null,
    },
    experienceLevel: {
      type: String,
      enum: ['fresher', 'junior', 'mid', 'senior', null],
      default: null,
    },

    // ── Stats ─────────────────────────────────────────
    totalResumesUploaded: { type: Number, default: 0 },
    totalInterviewsTaken: { type: Number, default: 0 },
    avgInterviewScore: { type: Number, default: 0 },
    bestAtsScore: { type: Number, default: 0 },

    // ── Auth Tokens ───────────────────────────────────
    refreshToken: { type: String, select: false },
    passwordResetToken: String,
    passwordResetExpires: Date,

    // ── Account Status ────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: Full Name ─────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Pre-save: Hash password (fixed for new Mongoose) ───
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Method: Compare password ───────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Method: Safe user object ───────────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

// ── Index ──────────────────────────────────────────────
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
