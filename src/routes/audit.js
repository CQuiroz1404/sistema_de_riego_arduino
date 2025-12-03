const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, AuditController.index);

module.exports = router;
