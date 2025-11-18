const express = require('express');
const router = express.Router();
const ArduinoController = require('../controllers/ArduinoController');
const { verifyApiKey, verifyToken } = require('../middleware/auth');

// Rutas para Arduino (requieren API Key)
router.post('/data', verifyApiKey, ArduinoController.sendData);
router.get('/commands', verifyApiKey, ArduinoController.getCommands);
router.get('/ping', verifyApiKey, ArduinoController.ping);

// Rutas para control manual (requieren autenticación de usuario)
router.post('/control', verifyToken, ArduinoController.controlActuator);

module.exports = router;
