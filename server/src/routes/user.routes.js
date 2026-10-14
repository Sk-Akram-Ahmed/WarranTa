const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.put(
  '/profile',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Name too long'),
  ],
  handleValidationErrors,
  userController.updateProfile
);

router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  handleValidationErrors,
  userController.changePassword
);

module.exports = router;
