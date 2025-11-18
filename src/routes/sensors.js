const express = require('express');
const router = express.Router();
const SensorController = require('../controllers/SensorController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas de sensores
router.post('/', SensorController.create);
router.get('/:id', SensorController.show);
router.get('/device/:deviceId', SensorController.listByDevice);
router.put('/:id', SensorController.update);
router.delete('/:id', SensorController.delete);

// Lecturas
router.get('/:id/readings', SensorController.getReadings);
router.get('/:id/readings/range', SensorController.getReadingsByRange);

module.exports = router;
