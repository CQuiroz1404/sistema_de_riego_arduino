const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuarios } = require('../models');

class AuthController {
  // Mostrar página de login
  static async showLogin(req, res) {
    res.render('auth/login', { error: null });
  }

  // Mostrar página de registro
  static async showRegister(req, res) {
    res.render('auth/register', { error: null });
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
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Actualizar última conexión
      await Usuarios.update({ ultima_conexion: new Date() }, { where: { id: user.id } });

      // Log de login
      console.log(`[INFO] [auth] Login exitoso: ${user.email} (User: ${user.id}, IP: ${req.ip})`);

      // Establecer cookie con el token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
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
      console.error('Error en login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al procesar login' 
      });
    }
  }

  // Procesar registro
  static async register(req, res) {
    try {
      const { nombre, email, password, confirmPassword } = req.body;

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

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = await Usuarios.create({
        nombre,
        email,
        password: hashedPassword,
        rol: 'usuario'
      });

      // Log de registro
      console.log(`[INFO] [auth] Nuevo usuario registrado: ${email} (User: ${newUser.id}, IP: ${req.ip})`);

      res.json({ 
        success: true, 
        message: 'Usuario registrado exitosamente',
        userId: newUser.id 
      });
    } catch (error) {
      console.error('Error en registro:', error);
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
        console.log(`[INFO] [auth] Logout: ${req.user.email} (User: ${req.user.id}, IP: ${req.ip})`);
      }

      // Limpiar cookie
      res.clearCookie('token');
      res.json({ 
        success: true, 
        message: 'Sesión cerrada exitosamente' 
      });
    } catch (error) {
      console.error('Error en logout:', error);
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
}

module.exports = AuthController;
