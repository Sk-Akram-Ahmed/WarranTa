const stream = require('stream');
const { cloudinary } = require('../../config/cloudinary');

const uploadFile = (buffer, originalName, userId) =>
  new Promise((resolve, reject) => {
    const baseName = (originalName || 'file')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file';

    const publicId = `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: `warranty-tracker/${userId}`,
        public_id: publicId,
        type: 'authenticated',
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload did not return a result.'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          size: result.bytes,
        });
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });

const deleteFile = async (publicId, resourceType, type = 'authenticated') => {
  if (!publicId) {
    return null;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType || 'auto',
    type: type || 'authenticated',
  });

  if (result.result === 'not_found') {
    return result;
  }

  if (result.result !== 'ok') {
    throw new Error(`Cloudinary delete failed for ${publicId}: ${result.result}`);
  }

  return result;
};

const getSignedUrl = (file) => {
  if (!file || !file.publicId) {
    throw new Error('File metadata is missing a Cloudinary public ID.');
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 300;

  return cloudinary.url(file.publicId, {
    resource_type: file.resourceType || 'auto',
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });
};

module.exports = {
  uploadFile,
  deleteFile,
  getSignedUrl,
};
