const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.get('/login', AuthController.showLogin);
router.get('/register', AuthController.showRegister);

// Rutas con rate limiting para prevenir bruteforce
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  message: { success: false, message: 'Demasiados intentos. Intente de nuevo en 15 minutos' },
  skipSuccessfulRequests: true
});

router.post('/login', authLimiter, AuthController.login);
router.post('/register', authLimiter, AuthController.register);

// Rutas protegidas
router.post('/logout', verifyToken, AuthController.logout);
router.get('/verify', verifyToken, AuthController.verifyToken);

module.exports = router;
