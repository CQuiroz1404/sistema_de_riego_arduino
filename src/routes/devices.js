const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/DeviceController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas de dispositivos
router.get('/', DeviceController.index);
router.get('/create', DeviceController.create);
router.post('/', DeviceController.store);
router.get('/:id', DeviceController.show);
router.get('/:id/edit', DeviceController.edit);
router.put('/:id', DeviceController.update);
router.delete('/:id', DeviceController.delete);

// API JSON
router.get('/api/list', DeviceController.apiList);
router.get('/:id/status', DeviceController.checkStatus);

module.exports = router;
