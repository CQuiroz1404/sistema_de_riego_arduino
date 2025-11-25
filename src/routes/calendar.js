const express = require('express');
const router = express.Router();
const CalendarController = require('../controllers/CalendarController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, CalendarController.index);

module.exports = router;
