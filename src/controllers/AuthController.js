const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuarios } = require('../models');
const logger = require('../config/logger');
const emailService = require('../services/emailService');

/**
 * @class AuthController
 * @description Controller for authentication operations (login, register, logout)
 */
class AuthController {
  /**
   * Show login page
   * @route GET /auth/login
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {void} Renders login view
   */
  static async showLogin(req, res) {
    res.render('auth/login', { title: 'Iniciar Sesión', noNavbar: true, error: null });
  }

  /**
   * Show registration page
   * @route GET /auth/register
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {void} Renders register view
   */
  static async showRegister(req, res) {
    res.render('auth/register', { title: 'Registro', noNavbar: true, error: null });
  }

  /**
   * Process user login
   * @route POST /auth/login
   * @param {object} req - Express request object
   * @param {string} req.body.email - User email
   * @param {string} req.body.password - User password
   * @param {object} res - Express response object
   * @returns {object} JSON response with success status and JWT token (in cookie)
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar datos
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email y contraseña son requeridos' 
        });
      }

      // Buscar usuario
      const user = await Usuarios.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciales inválidas' 
        });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciales inválidas' 
        });
      }

      // Verificar si el usuario está activo
      if (!user.activo) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuario inactivo. Contacte al administrador.' 
        });
      }

      // Generar token JWT
      // Se establece una duración larga (30 días) para mantener la sesión
      // hasta que el usuario decida cerrar sesión explícitamente.
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Actualizar última conexión
      await Usuarios.update({ ultima_conexion: new Date() }, { where: { id: user.id } });

      // Log de login
      logger.info(`[INFO] [auth] Login exitoso: ${user.email} (User: ${user.id}, IP: ${req.ip})`);

      // Establecer cookie con el token
      // La cookie durará 30 días, pero se borrará explícitamente al hacer logout
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
      });

      res.json({ 
        success: true, 
        message: 'Login exitoso',
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });
    } catch (error) {
      logger.error('Error en login: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al procesar login' 
      });
    }
  }

  /**
   * Process user registration
   * @route POST /auth/register
   * @param {object} req - Express request object
   * @param {string} req.body.nombre - User full name
   * @param {string} req.body.email - User email
   * @param {string} req.body.password - User password
   * @param {string} req.body.confirmPassword - Password confirmation
   * @param {string} [req.body.rut] - User RUT (optional)
   * @param {object} res - Express response object
   * @returns {object} JSON response with success status and user ID
   */
  static async register(req, res) {
    try {
      const { nombre, email, password, confirmPassword, rut } = req.body;

      // Validar datos
      if (!nombre || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos los campos son requeridos' 
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Las contraseñas no coinciden' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }

      // Verificar si el email ya existe
      const existingUser = await Usuarios.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'El email ya está registrado' 
        });
      }

      // Verificar si el RUT ya existe (si se proporciona)
      if (rut) {
        const existingRut = await Usuarios.findOne({ where: { rut } });
        if (existingRut) {
          return res.status(409).json({ 
            success: false, 
            message: 'El RUT ya está registrado' 
          });
        }
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = await Usuarios.create({
        nombre,
        email,
        password: hashedPassword,
        rol: 'usuario',
        rut: rut || null
      });

      // Log de registro
      logger.info(`[INFO] [auth] Nuevo usuario registrado: ${email} (User: ${newUser.id}, IP: ${req.ip})`);

      // Enviar correo de bienvenida
      await emailService.sendAlert(
        email,
        '¡Bienvenido al Sistema de Riego IoT!',
        `Hola ${nombre},<br><br>Tu cuenta ha sido creada exitosamente. Ahora puedes registrar tus dispositivos Arduino y comenzar a monitorear tu riego de forma inteligente.<br><br>¡Gracias por unirte!`,
        'info'
      );

      res.json({ 
        success: true, 
        message: 'Usuario registrado exitosamente',
        userId: newUser.id 
      });
    } catch (error) {
      logger.error('Error en registro: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al registrar usuario' 
      });
    }
  }

  /**
   * Process user logout
   * @route POST /auth/logout
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {object} JSON response with success status
   */
  static async logout(req, res) {
    try {
      // Log de logout
      if (req.user) {
        logger.info(`[INFO] [auth] Logout: ${req.user.email} (User: ${req.user.id}, IP: ${req.ip})`);
      }

      // Limpiar cookie
      res.clearCookie('token');
      res.json({ 
        success: true, 
        message: 'Sesión cerrada exitosamente' 
      });
    } catch (error) {
      logger.error('Error en logout: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al cerrar sesión' 
      });
    }
  }

  /**
   * Verify JWT token validity
   * @route GET /auth/verify
   * @param {object} req - Express request object
   * @param {object} req.user - Authenticated user (from middleware)
   * @param {object} res - Express response object
   * @returns {object} JSON response with user data
   */
  static async verifyToken(req, res) {
    res.json({ 
      success: true, 
      user: req.user 
    });
  }
}

module.exports = AuthController;
