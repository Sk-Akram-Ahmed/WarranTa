require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Warranty = require('../src/models/Warranty');
const { uploadFile } = require('../src/services/cloudinaryService');

const uploadsDir = path.join(__dirname, '../uploads');

const log = (message) => console.log(`[Cloudinary Migration] ${message}`);

async function migrateWarrantyFiles() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in the server .env file.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  log(`Connected to MongoDB: ${process.env.MONGODB_URI}`);

  const warranties = await Warranty.find({});
  let migrated = 0;
  let skipped = 0;
  let missingLocalFiles = 0;

  for (const warranty of warranties) {
    const files = warranty.files || [];
    const migratedFiles = [];

    for (const file of files) {
      if (file.url && file.publicId) {
        migratedFiles.push(file);
        skipped += 1;
        continue;
      }

      const storedName = file.storedName;
      if (!storedName) {
        migratedFiles.push(file);
        continue;
      }

      const localFilePath = path.join(uploadsDir, storedName);
      if (!fs.existsSync(localFilePath)) {
        log(`Skipping missing local file for warranty ${warranty._id}: ${storedName}`);
        migratedFiles.push(file);
        missingLocalFiles += 1;
        continue;
      }

      const fileBuffer = fs.readFileSync(localFilePath);
      const uploadResult = await uploadFile(fileBuffer, file.originalName || storedName, String(warranty.userId));

      migratedFiles.push({
        originalName: file.originalName || storedName,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        resourceType: uploadResult.resourceType,
        format: uploadResult.format,
        size: uploadResult.size,
        uploadedAt: new Date(),
      });

      fs.unlinkSync(localFilePath);
      migrated += 1;
    }

    warranty.files = migratedFiles;
    await warranty.save();
  }

  log(`Migration complete. Migrated ${migrated} files, skipped ${skipped} already-migrated files, and found ${missingLocalFiles} missing local files.`);
  await mongoose.disconnect();
}

migrateWarrantyFiles().catch((error) => {
  console.error('[Cloudinary Migration Failed]', error.message);
  process.exit(1);
});
