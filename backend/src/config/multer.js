const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage config — saves locally in dev, swap for Cloudinary in prod
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: userId_timestamp_originalname
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = `${userId}_${timestamp}${ext}`;
    cb(null, safeName);
  },
});

// File type filter — only allow PDF and DOCX
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const allowedExts = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents (.pdf, .doc, .docx) are allowed!'), false);
  }
};

// Main upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Profile picture upload (images only)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const imgDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
    cb(null, imgDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'unknown';
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${userId}_${Date.now()}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for profile pictures!'), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = { upload, uploadImage };
