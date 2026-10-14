const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const deletePhysicalFile = (storedName) => {
  if (!storedName) return;
  const filePath = path.join(UPLOADS_DIR, storedName);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`[File Unlink Error] Could not delete ${filePath}:`, err.message);
    }
  });
};

module.exports = {
  UPLOADS_DIR,
  deletePhysicalFile,
};
