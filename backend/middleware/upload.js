// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const crypto = require('crypto');

const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const DEFAULT_MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const now = new Date();
      const sub = path.join(
        BASE_UPLOAD_DIR,
        String(now.getFullYear()),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      );
      await ensureDir(sub);
      cb(null, sub);
    } catch (err) {
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    const rand = crypto.randomBytes(12).toString('hex');
    const name = `${file.fieldname}-${rand}${ext}`;
    cb(null, name);
  },
});

const DEFAULT_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

function createUpload(options = {}) {
  const maxSize = options.maxSize || DEFAULT_MAX_FILE_SIZE;
  const allowedMime = options.allowedMime || DEFAULT_ALLOWED_MIME;

  const fileFilter = (req, file, cb) => {
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
      err.message = 'Invalid file type';
      cb(err);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  });
}

module.exports = createUpload;
