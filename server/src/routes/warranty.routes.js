const express = require('express');
const { body, query } = require('express-validator');
const warrantyController = require('../controllers/warranty.controller');
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload');
const handleValidationErrors = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

const warrantyValidationRules = [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('purchaseDate')
    .notEmpty()
    .withMessage('Purchase date is required')
    .isISO8601()
    .withMessage('Purchase date must be a valid date')
    .custom((val) => {
      const pDate = new Date(val);
      const now = new Date();
      if (pDate > now) {
        throw new Error('Purchase date cannot be in the future');
      }
      return true;
    }),
  body('warrantyValue')
    .notEmpty()
    .withMessage('Warranty value is required')
    .isInt({ min: 1 })
    .withMessage('Warranty value must be a positive integer'),
  body('warrantyUnit')
    .notEmpty()
    .isIn(['months', 'years'])
    .withMessage("Warranty unit must be 'months' or 'years'"),
  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];

router.post(
  '/',
  upload.array('files', 3),
  warrantyValidationRules,
  handleValidationErrors,
  warrantyController.createWarranty
);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['Active', 'Expiring Soon', 'Expired']),
    query('sort')
      .optional()
      .isIn(['expiry_asc', 'expiry_desc', 'purchase_asc', 'purchase_desc', 'name_asc', 'name_desc']),
  ],
  handleValidationErrors,
  warrantyController.getWarranties
);

router.get('/stats', warrantyController.getWarrantyStats);

router.get('/:id', warrantyController.getWarrantyById);

router.put(
  '/:id',
  upload.array('files', 3),
  [
    body('productName').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('purchaseDate')
      .optional()
      .isISO8601()
      .withMessage('Purchase date must be valid')
      .custom((val) => {
        if (new Date(val) > new Date()) {
          throw new Error('Purchase date cannot be in the future');
        }
        return true;
      }),
    body('warrantyValue').optional().isInt({ min: 1 }).withMessage('Warranty value must be a positive integer'),
    body('warrantyUnit').optional().isIn(['months', 'years']).withMessage("Unit must be 'months' or 'years'"),
  ],
  handleValidationErrors,
  warrantyController.updateWarranty
);

router.delete('/:id', warrantyController.deleteWarranty);

module.exports = router;
