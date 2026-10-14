const express = require('express');
const fileController = require('../controllers/file.controller');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/:warrantyId/:filename', authenticate, fileController.getFile);

module.exports = router;
