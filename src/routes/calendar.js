const express = require('express');
const router = express.Router();
const ScheduleController = require('../controllers/ScheduleController');
const { verifyToken } = require('../middleware/auth');

// Calendar overview
router.get('/', verifyToken, ScheduleController.index);
router.get('/events', verifyToken, ScheduleController.getEvents);

// Schedule CRUD operations
router.get('/:id', verifyToken, ScheduleController.show);
router.delete('/:id', verifyToken, ScheduleController.delete);

module.exports = router;
