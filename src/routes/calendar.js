const express = require('express');
const router = express.Router();
const CalendarController = require('../controllers/CalendarController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, CalendarController.index);
router.get('/events', verifyToken, CalendarController.getEvents);

module.exports = router;
