const express = require('express');
const router = express.Router();
const ArduinoController = require('../controllers/ArduinoController');
const { verifyApiKey, verifyToken } = require('../middleware/auth');

// Rutas para Arduino (requieren API Key)
router.post('/data', verifyApiKey, ArduinoController.sendData);
router.get('/commands', verifyApiKey, ArduinoController.getCommands);
router.get('/ping', verifyApiKey, ArduinoController.ping);

// Ruta de AUTO-SINCRONIZACIÓN: Arduino obtiene IDs de sensores/actuadores
router.get('/sync', verifyApiKey, ArduinoController.syncDevice);

// Rutas para control manual (requieren autenticación de usuario)
router.post('/control', verifyToken, ArduinoController.controlActuator);

// Ruta de EMERGENCIA - Detener todos los actuadores
router.post('/emergency-stop', verifyToken, ArduinoController.emergencyStop);

// Ruta para actualizar umbrales de humedad remotamente
router.post('/update-thresholds', verifyToken, ArduinoController.updateThresholds);

// Ruta para obtener sensores actualizados (para dashboard en tiempo real)
router.get('/devices/:dispositivo_id/sensores', verifyToken, ArduinoController.getSensoresActualizados);

module.exports = router;
