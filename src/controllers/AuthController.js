const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Usuarios, LogsSistema } = require('../models');
const logger = require('../config/logger');
const emailService = require('../services/emailService');

class AuthController {
  // Mostrar página de login
  static async showLogin(req, res) {
    res.render('auth/login', { title: 'Iniciar Sesión', noNavbar: true, error: null });
  }

  // Mostrar página de registro
  static async showRegister(req, res) {
    res.render('auth/register', { title: 'Registro', noNavbar: true, error: null });
  }

  // Procesar login
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
      
      // Guardar en auditoría
      await LogsSistema.create({
        nivel: 'info',
        modulo: 'auth',
        mensaje: `Inicio de sesión exitoso: ${user.email}`,
        usuario_id: user.id,
        fecha_log: new Date()
      });

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

  // Procesar registro
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

      // Guardar en auditoría
      await LogsSistema.create({
        nivel: 'info',
        modulo: 'auth',
        mensaje: `Nuevo usuario registrado: ${email}`,
        usuario_id: newUser.id,
        fecha_log: new Date()
      });

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

  // Cerrar sesión
  static async logout(req, res) {
    try {
      // Log de logout
      if (req.user) {
        logger.info(`[INFO] [auth] Logout: ${req.user.email} (User: ${req.user.id}, IP: ${req.ip})`);
        
        // Guardar en auditoría
        await LogsSistema.create({
          nivel: 'info',
          modulo: 'auth',
          mensaje: `Cierre de sesión: ${req.user.email}`,
          usuario_id: req.user.id,
          fecha_log: new Date()
        });
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

  // Verificar token
  static async verifyToken(req, res) {
    res.json({ 
      success: true, 
      user: req.user 
    });
  }

  // Mostrar página de recuperación de contraseña
  static async showForgotPassword(req, res) {
    res.render('auth/forgot-password', { 
      title: 'Recuperar Contraseña', 
      noNavbar: true, 
      error: null,
      success: null 
    });
  }

  // Procesar solicitud de recuperación de contraseña
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Validar email
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'El email es requerido' 
        });
      }

      // Buscar usuario
      const user = await Usuarios.findOne({ where: { email } });
      
      // Por seguridad, siempre respondemos éxito aunque el usuario no exista
      // para evitar enumeration attacks
      if (!user) {
        logger.warn(`Intento de recuperación de contraseña para email no existente: ${email}`);
        return res.json({ 
          success: true, 
          message: 'Si el correo existe en nuestra base de datos, recibirás un email con instrucciones para recuperar tu contraseña.' 
        });
      }

      // Verificar si el usuario está activo
      if (!user.activo) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuario inactivo. Contacte al administrador.' 
        });
      }

      // Generar token único
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

      // Guardar token en la base de datos
      await Usuarios.update(
        { 
          reset_token: resetToken,
          reset_token_expiry: resetTokenExpiry 
        },
        { where: { id: user.id } }
      );

      // Enviar correo de recuperación
      await emailService.sendPasswordReset(email, resetToken, user.nombre);

      // Log
      logger.info(`[INFO] [auth] Solicitud de recuperación de contraseña: ${email} (User: ${user.id}, IP: ${req.ip})`);
      
      await LogsSistema.create({
        nivel: 'info',
        modulo: 'auth',
        mensaje: `Solicitud de recuperación de contraseña: ${email}`,
        usuario_id: user.id,
        fecha_log: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Si el correo existe en nuestra base de datos, recibirás un email con instrucciones para recuperar tu contraseña.' 
      });
    } catch (error) {
      logger.error('Error en recuperación de contraseña: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al procesar la solicitud' 
      });
    }
  }

  // Mostrar página para restablecer contraseña
  static async showResetPassword(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.render('auth/reset-password', { 
          title: 'Restablecer Contraseña', 
          noNavbar: true, 
          error: 'Token inválido o expirado',
          validToken: false 
        });
      }

      // Verificar si el token existe y no ha expirado
      const user = await Usuarios.findOne({ 
        where: { 
          reset_token: token
        } 
      });

      if (!user || !user.reset_token_expiry || new Date() > new Date(user.reset_token_expiry)) {
        return res.render('auth/reset-password', { 
          title: 'Restablecer Contraseña', 
          noNavbar: true, 
          error: 'El enlace de recuperación ha expirado o es inválido. Por favor solicita uno nuevo.',
          validToken: false 
        });
      }

      res.render('auth/reset-password', { 
        title: 'Restablecer Contraseña', 
        noNavbar: true, 
        error: null,
        validToken: true,
        token 
      });
    } catch (error) {
      logger.error('Error mostrando página de reset: %o', error);
      res.render('auth/reset-password', { 
        title: 'Restablecer Contraseña', 
        noNavbar: true, 
        error: 'Error al procesar la solicitud',
        validToken: false 
      });
    }
  }

  // Procesar restablecimiento de contraseña
  static async resetPassword(req, res) {
    try {
      const { token, password, confirmPassword } = req.body;

      // Validar datos
      if (!token || !password || !confirmPassword) {
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

      // Buscar usuario con el token
      const user = await Usuarios.findOne({ 
        where: { 
          reset_token: token
        } 
      });

      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: 'Token inválido' 
        });
      }

      // Verificar si el token ha expirado
      if (!user.reset_token_expiry || new Date() > new Date(user.reset_token_expiry)) {
        return res.status(400).json({ 
          success: false, 
          message: 'El enlace de recuperación ha expirado. Por favor solicita uno nuevo.' 
        });
      }

      // Encriptar nueva contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Actualizar contraseña y limpiar token
      await Usuarios.update(
        { 
          password: hashedPassword,
          reset_token: null,
          reset_token_expiry: null 
        },
        { where: { id: user.id } }
      );

      // Log
      logger.info(`[INFO] [auth] Contraseña restablecida exitosamente: ${user.email} (User: ${user.id}, IP: ${req.ip})`);
      
      await LogsSistema.create({
        nivel: 'info',
        modulo: 'auth',
        mensaje: `Contraseña restablecida exitosamente: ${user.email}`,
        usuario_id: user.id,
        fecha_log: new Date()
      });

      // Enviar correo de confirmación
      await emailService.sendAlert(
        user.email,
        'Contraseña Actualizada',
        `Hola ${user.nombre},<br><br>Tu contraseña ha sido actualizada exitosamente. Si no realizaste este cambio, por favor contacta al administrador inmediatamente.<br><br>Fecha: ${new Date().toLocaleString('es-ES')}`,
        'info'
      );

      res.json({ 
        success: true, 
        message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.' 
      });
    } catch (error) {
      logger.error('Error en reset de contraseña: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al restablecer la contraseña' 
      });
    }
  }
}

module.exports = AuthController;
