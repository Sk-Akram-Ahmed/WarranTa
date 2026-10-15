const Warranty = require('../models/Warranty');
const { calculateExpiryDate, computeWarrantyStatus } = require('../utils/dateUtils');
const { uploadFile, deleteFile, getSignedUrl } = require('../services/cloudinaryService');

const formatWarrantyResponse = (doc) => {
  const plain = doc.toObject ? doc.toObject() : doc;
  const { status, daysRemaining } = computeWarrantyStatus(plain.expiryDate);
  return {
    ...plain,
    status,
    daysRemaining,
  };
};

const cloudinaryFailure = (message, cause, fileName) => {
  // Keep the upstream reason in the server log. Previously this was discarded,
  // which made every file-specific rejection look like an unexplained 502.
  const upstreamMessage = cause?.message || 'Unknown Cloudinary error';
  console.error(`[Cloudinary upload failed]${fileName ? ` ${fileName}:` : ''}`, upstreamMessage);

  const error = new Error(
    `${message}${fileName ? ` (${fileName})` : ''}. Cloudinary reported: ${upstreamMessage}`
  );
  // Cloudinary uses 4xx for a rejected asset (for example, malformed or
  // unsupported content) and 5xx for a service-side failure.
  error.statusCode = cause?.http_code >= 400 && cause.http_code < 500 ? 400 : 502;
  return error;
};

const parseRemovedFiles = (removedFiles) => {
  if (!removedFiles) return [];
  if (Array.isArray(removedFiles)) return removedFiles;
  return String(removedFiles)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const cleanupUploadedFiles = async (uploadedFiles) => {
  for (const file of uploadedFiles) {
    try {
      await deleteFile(file.publicId, file.resourceType, 'authenticated');
    } catch (error) {
      console.error('[Cloudinary cleanup failed]', error.message);
    }
  }
};

exports.createWarranty = async (req, res, next) => {
  try {
    const {
      productName,
      brand,
      model,
      serialNumber,
      purchaseDate,
      warrantyValue,
      warrantyUnit,
      shopName,
      price,
      notes,
    } = req.body;

    const expiryDate = calculateExpiryDate(purchaseDate, warrantyValue, warrantyUnit);
    const uploadedFiles = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadFile(file.buffer, file.originalname, req.user._id.toString());
          uploadedFiles.push({
            originalName: file.originalname,
            url: result.url,
            publicId: result.publicId,
            resourceType: result.resourceType,
            format: result.format,
            size: result.size,
            uploadedAt: new Date(),
          });
        } catch (error) {
          throw cloudinaryFailure('Cloudinary upload failed while attaching this file', error, file.originalname);
        }
      }
    }

    let warranty;
    try {
      warranty = await Warranty.create({
        userId: req.user._id,
        productName,
        brand,
        model,
        serialNumber,
        purchaseDate: new Date(purchaseDate),
        warrantyValue: parseInt(warrantyValue, 10),
        warrantyUnit,
        expiryDate,
        shopName,
        price: price ? parseFloat(price) : 0,
        notes,
        files: uploadedFiles,
      });
    } catch (error) {
      await cleanupUploadedFiles(uploadedFiles);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Warranty created successfully',
      data: formatWarrantyResponse(warranty),
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarranties = async (req, res, next) => {
  try {
    const { search = '', status, sort = 'expiry_asc', page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { userId: req.user._id };

    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ productName: regex }, { brand: regex }];
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (status === 'Active') {
      query.expiryDate = { $gt: thirtyDaysFromNow };
    } else if (status === 'Expiring Soon') {
      query.expiryDate = { $gte: now, $lte: thirtyDaysFromNow };
    } else if (status === 'Expired') {
      query.expiryDate = { $lt: now };
    }

    let sortObj = { expiryDate: 1 };
    if (sort === 'expiry_desc') sortObj = { expiryDate: -1 };
    else if (sort === 'purchase_asc') sortObj = { purchaseDate: 1 };
    else if (sort === 'purchase_desc') sortObj = { purchaseDate: -1 };
    else if (sort === 'name_asc') sortObj = { productName: 1 };
    else if (sort === 'name_desc') sortObj = { productName: -1 };

    const [total, warranties] = await Promise.all([
      Warranty.countDocuments(query),
      Warranty.find(query).sort(sortObj).skip(skip).limit(limitNum),
    ]);

    const formattedWarranties = warranties.map(formatWarrantyResponse);

    res.status(200).json({
      success: true,
      data: formattedWarranties,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarrantyStats = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const userId = req.user._id;

    const [total, active, expiringSoon, expired] = await Promise.all([
      Warranty.countDocuments({ userId }),
      Warranty.countDocuments({ userId, expiryDate: { $gt: thirtyDaysFromNow } }),
      Warranty.countDocuments({ userId, expiryDate: { $gte: now, $lte: thirtyDaysFromNow } }),
      Warranty.countDocuments({ userId, expiryDate: { $lt: now } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        expiringSoon,
        expired,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarrantyById = async (req, res, next) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty record not found.' });
    }

    res.status(200).json({
      success: true,
      data: formatWarrantyResponse(warranty),
    });
  } catch (error) {
    next(error);
  }
};

exports.viewFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    const warranty = await Warranty.findOne({ _id: id, userId: req.user._id });

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty not found.' });
    }

    const fileMeta = warranty.files.find((file) => String(file._id) === String(fileId));
    if (!fileMeta) {
      return res.status(404).json({ success: false, message: 'File not found on this warranty.' });
    }

    const url = getSignedUrl(fileMeta.toObject ? fileMeta.toObject() : fileMeta);

    res.status(200).json({
      success: true,
      url,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateWarranty = async (req, res, next) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty record not found.' });
    }

    const {
      productName,
      brand,
      model,
      serialNumber,
      purchaseDate,
      warrantyValue,
      warrantyUnit,
      shopName,
      price,
      notes,
      removedFiles,
    } = req.body;

    const originalFiles = [...warranty.files];
    const filesToRemove = parseRemovedFiles(removedFiles);
    const uploadedInThisRequest = [];

    if (filesToRemove.length > 0) {
      const remainingFiles = [];
      for (const file of warranty.files) {
        const shouldRemove = filesToRemove.includes(file.publicId) || filesToRemove.includes(String(file._id));
        if (shouldRemove) {
          try {
            await deleteFile(file.publicId, file.resourceType, 'authenticated');
          } catch (error) {
            throw cloudinaryFailure('Cloudinary could not remove one or more uploaded files', error);
          }
        } else {
          remainingFiles.push(file);
        }
      }
      warranty.files = remainingFiles;
    }

    if (productName) warranty.productName = productName;
    if (brand !== undefined) warranty.brand = brand;
    if (model !== undefined) warranty.model = model;
    if (serialNumber !== undefined) warranty.serialNumber = serialNumber;
    if (shopName !== undefined) warranty.shopName = shopName;
    if (price !== undefined) warranty.price = price ? parseFloat(price) : 0;
    if (notes !== undefined) warranty.notes = notes;

    let dateChanged = false;
    if (purchaseDate) {
      warranty.purchaseDate = new Date(purchaseDate);
      dateChanged = true;
    }
    if (warrantyValue) {
      warranty.warrantyValue = parseInt(warrantyValue, 10);
      dateChanged = true;
    }
    if (warrantyUnit) {
      warranty.warrantyUnit = warrantyUnit;
      dateChanged = true;
    }

    if (dateChanged) {
      warranty.expiryDate = calculateExpiryDate(
        warranty.purchaseDate,
        warranty.warrantyValue,
        warranty.warrantyUnit
      );
      warranty.reminder30Sent = false;
      warranty.reminder7Sent = false;
      warranty.reminder1Sent = false;
    }

    if (req.files && req.files.length > 0) {
      const totalAllowed = 3 - warranty.files.length;
      if (req.files.length > totalAllowed) {
        return res.status(400).json({
          success: false,
          message: `Cannot upload ${req.files.length} files. Maximum allowed per warranty is 3. Currently stored: ${warranty.files.length}.`,
        });
      }

      for (const file of req.files) {
        try {
          const result = await uploadFile(file.buffer, file.originalname, req.user._id.toString());
          const fileMeta = {
            originalName: file.originalname,
            url: result.url,
            publicId: result.publicId,
            resourceType: result.resourceType,
            format: result.format,
            size: result.size,
            uploadedAt: new Date(),
          };
          uploadedInThisRequest.push(fileMeta);
          warranty.files.push(fileMeta);
        } catch (error) {
          await cleanupUploadedFiles(uploadedInThisRequest);
          throw cloudinaryFailure('Cloudinary upload failed while updating this file', error, file.originalname);
        }
      }
    }

    try {
      await warranty.save();
    } catch (error) {
      if (uploadedInThisRequest.length > 0) {
        await cleanupUploadedFiles(uploadedInThisRequest);
      }
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Warranty updated successfully',
      data: formatWarrantyResponse(warranty),
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteWarranty = async (req, res, next) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty record not found.' });
    }

    for (const file of warranty.files || []) {
      try {
        await deleteFile(file.publicId, file.resourceType, 'authenticated');
      } catch (error) {
        console.error('[Cloudinary warranty deletion cleanup failed]', error.message);
      }
    }

    await Warranty.deleteOne({ _id: warranty._id });

    res.status(200).json({
      success: true,
      message: 'Warranty and associated files deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
