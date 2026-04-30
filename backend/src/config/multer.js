const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Local storage for development ─────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'unknown';
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${Date.now()}${ext}`);
  },
});

// ── Cloudinary storage for production ─────────────────
let storage;
if (process.env.NODE_ENV === 'production' && process.env.CLOUDINARY_CLOUD_NAME) {
  const { storage: cloudStorage } = require('./cloudinary');
  storage = cloudStorage;
} else {
  storage = localStorage;
}

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.doc', '.docx'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { upload };