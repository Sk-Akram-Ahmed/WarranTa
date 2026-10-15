const mongoose = require('mongoose');

const fileSubSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    format: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const warrantySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    brand: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'Brand cannot exceed 80 characters'],
    },
    model: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'Model cannot exceed 80 characters'],
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Serial number cannot exceed 100 characters'],
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    warrantyValue: {
      type: Number,
      required: [true, 'Warranty value is required'],
      min: [1, 'Warranty value must be at least 1'],
    },
    warrantyUnit: {
      type: String,
      required: true,
      enum: ['months', 'years'],
      default: 'months',
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    shopName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Shop name cannot exceed 100 characters'],
    },
    price: {
      type: Number,
      min: [0, 'Price must be positive'],
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    files: [fileSubSchema],
    reminder30Sent: {
      type: Boolean,
      default: false,
    },
    reminder7Sent: {
      type: Boolean,
      default: false,
    },
    reminder1Sent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

warrantySchema.index({ userId: 1, expiryDate: 1 });
warrantySchema.index({ userId: 1, productName: 1, brand: 1 });

module.exports = mongoose.model('Warranty', warrantySchema);
