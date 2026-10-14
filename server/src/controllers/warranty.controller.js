const Warranty = require('../models/Warranty');
const { calculateExpiryDate, computeWarrantyStatus } = require('../utils/dateUtils');
const { deletePhysicalFile } = require('../utils/fileHelper');

const formatWarrantyResponse = (doc) => {
  const plain = doc.toObject ? doc.toObject() : doc;
  const { status, daysRemaining } = computeWarrantyStatus(plain.expiryDate);
  return {
    ...plain,
    status,
    daysRemaining,
  };
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

    const files = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        files.push({
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
        });
      });
    }

    const warranty = await Warranty.create({
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
      files,
    });

    res.status(201).json({
      success: true,
      message: 'Warranty created successfully',
      data: formatWarrantyResponse(warranty),
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach((f) => deletePhysicalFile(f.filename));
    }
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

    if (removedFiles) {
      const toRemove = Array.isArray(removedFiles) ? removedFiles : removedFiles.split(',');
      const remainingFiles = [];
      warranty.files.forEach((file) => {
        if (toRemove.includes(file.storedName)) {
          deletePhysicalFile(file.storedName);
        } else {
          remainingFiles.push(file);
        }
      });
      warranty.files = remainingFiles;
    }

    if (req.files && req.files.length > 0) {
      const totalAllowed = 3 - warranty.files.length;
      if (req.files.length > totalAllowed) {
        req.files.forEach((f) => deletePhysicalFile(f.filename));
        return res.status(400).json({
          success: false,
          message: `Cannot upload ${req.files.length} files. Maximum allowed per warranty is 3. Currently stored: ${warranty.files.length}.`,
        });
      }

      req.files.forEach((file) => {
        warranty.files.push({
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
        });
      });
    }

    await warranty.save();

    res.status(200).json({
      success: true,
      message: 'Warranty updated successfully',
      data: formatWarrantyResponse(warranty),
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach((f) => deletePhysicalFile(f.filename));
    }
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

    if (warranty.files && warranty.files.length > 0) {
      warranty.files.forEach((f) => deletePhysicalFile(f.storedName));
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
