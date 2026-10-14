const path = require('path');
const fs = require('fs');
const Warranty = require('../models/Warranty');
const { UPLOADS_DIR } = require('../utils/fileHelper');

exports.getFile = async (req, res, next) => {
  try {
    const { warrantyId, filename } = req.params;

    const warranty = await Warranty.findOne({
      _id: warrantyId,
      userId: req.user._id,
    });

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty not found.' });
    }

    const fileMeta = warranty.files.find((f) => f.storedName === filename);
    if (!fileMeta) {
      return res.status(404).json({ success: false, message: 'File not associated with this record.' });
    }

    const safeFilename = path.basename(filename);
    const absolutePath = path.resolve(UPLOADS_DIR, safeFilename);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'File missing on server storage.' });
    }

    res.setHeader('Content-Type', fileMeta.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileMeta.originalName)}"`
    );

    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
