const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas del dashboard
router.get('/', DashboardController.index);
router.get('/data', DashboardController.getData);
router.get('/device/:id', DashboardController.getDeviceData);

module.exports = router;
