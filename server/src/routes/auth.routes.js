const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validate');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  authLimiter,
  authController.register
);

router.post(
  '/register/start',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  ],
  handleValidationErrors,
  authController.registerStart
);

router.post(
  '/register/verify',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('code').isString().matches(/^\d{6}$/).withMessage('Verification code must be 6 digits'),
  ],
  handleValidationErrors,
  authController.registerVerify
);

router.post(
  '/register/complete',
  authLimiter,
  [
    body('verifiedTicket').isString().notEmpty().withMessage('A verified ticket is required'),
    body('password')
      .isString()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Za-z]/)
      .withMessage('Password must include a letter')
      .matches(/\d/)
      .withMessage('Password must include a number'),
    body('acceptedTerms')
      .custom((value) => value === true)
      .withMessage('You must agree to the Terms and Conditions and Privacy Policy.'),
  ],
  handleValidationErrors,
  authController.registerComplete
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  authController.login
);

router.post('/google', authLimiter, authController.google);

router.post(
  '/google/signup',
  authLimiter,
  [
    body('signupTicket').isString().notEmpty().withMessage('A signup ticket is required'),
    body('acceptedTerms')
      .custom((value) => value === true)
      .withMessage('You must agree to the Terms and Conditions and Privacy Policy.'),
  ],
  handleValidationErrors,
  authController.googleSignup
);

router.post(
  '/google/link',
  authLimiter,
  [
    body('linkTicket').isString().notEmpty().withMessage('A link ticket is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  authController.googleLink
);

router.get('/me', authenticate, authController.getCurrentUser);
router.post('/accept-terms', authenticate, authController.acceptTerms);
router.post('/logout', authController.logout);

module.exports = router;
