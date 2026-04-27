require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ── Route Imports ──────────────────────────────────────
const authRoutes      = require('./routes/auth');
const resumeRoutes    = require('./routes/resumes');
const dashboardRoutes = require('./routes/dashboard');
const analysisRoutes  = require('./routes/analysis');
const builderRoutes   = require('./routes/builder');    // ✅ only once
const interviewRoutes = require('./routes/interviews');
const analyticsRoutes = require('./routes/analytics');  // ✅ moved to top

// ── App Init ───────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🟢 PrepPilot API is running',
    version: '3.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/resumes',   resumeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/analysis',  analysisRoutes);
app.use('/api/v1/builder',   builderRoutes);   // ✅ only once
app.use('/api/v1/interviews',interviewRoutes);
app.use('/api/v1/analytics', analyticsRoutes); // ✅ only once

// ── Error Handling ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('\n════════════════════════════════════════════');
  console.log(`  🚀 PrepPilot API Server`);
  console.log(`  📡 Port      : ${PORT}`);
  console.log(`  🌍 Env       : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 Health    : http://localhost:${PORT}/health`);
  console.log(`  📘 API Base  : http://localhost:${PORT}/api/v1`);
  console.log('════════════════════════════════════════════\n');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => { console.log('✅ Server closed.'); process.exit(0); });
});

module.exports = app;