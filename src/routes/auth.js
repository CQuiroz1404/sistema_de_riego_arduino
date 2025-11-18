const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.get('/login', AuthController.showLogin);
router.get('/register', AuthController.showRegister);
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Rutas protegidas
router.post('/logout', verifyToken, AuthController.logout);
router.get('/verify', verifyToken, AuthController.verifyToken);

module.exports = router;
