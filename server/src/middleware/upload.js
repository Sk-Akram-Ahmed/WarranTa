const multer = require('multer');
const path = require('path');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf']);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const hasValidMimeType = allowedMimeTypes.has(file.mimetype);
  const hasValidExtension = allowedExtensions.has(extension);

  if (hasValidMimeType && hasValidExtension) {
    cb(null, true);
    return;
  }

  cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },
  fileFilter,
});

module.exports = upload;
