const { Usuarios, Dispositivos, Sensores, Lecturas } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const logger = require('../config/logger');

class ProfileController {
  // Mostrar perfil del usuario
  static async index(req, res) {
    try {
      if (!req.user || !req.user.id) {
         return res.redirect('/auth/login');
      }

      const user = await Usuarios.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).render('error', {
          message: 'Usuario no encontrado'
        });
      }

      // Obtener estadísticas de forma eficiente
      const devices = await Dispositivos.findAll({
        where: { usuario_id: req.user.id },
        attributes: ['id']
      });
      
      const deviceIds = devices.map(d => d.id);
      let totalSensors = 0;
      let totalReadings = 0;

      if (deviceIds.length > 0) {
        // Contar sensores
        const sensors = await Sensores.findAll({
            where: { dispositivo_id: { [Op.in]: deviceIds } },
            attributes: ['id']
        });
        totalSensors = sensors.length;
        
        const sensorIds = sensors.map(s => s.id);
        
        // Contar lecturas (solo si hay sensores)
        if (sensorIds.length > 0) {
            totalReadings = await Lecturas.count({
                where: { sensor_id: { [Op.in]: sensorIds } }
            });
        }
      }

      const stats = {
        total_dispositivos: devices.length,
        total_sensores: totalSensors,
        total_lecturas: totalReadings,
        fecha_registro: user.created_at
      };

      res.render('profile/index', {
        user: user.toJSON(),
        stats,
        title: 'Mi Perfil',
        scripts: '<script src="/js/profile.js"></script>'
      });
    } catch (error) {
      logger.error('Error al cargar perfil: %o', error);
      res.status(500).render('error', {
        message: 'Error al cargar perfil'
      });
    }
  }

  // Actualizar perfil
  static async update(req, res) {
    try {
      const { nombre } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre es requerido'
        });
      }

      await Usuarios.update(
        { nombre: nombre.trim() },
        { where: { id: req.user.id } }
      );

      logger.info(`Usuario ${req.user.id} actualizó su perfil`);

      res.json({
        success: true,
        message: 'Perfil actualizado correctamente'
      });
    } catch (error) {
      logger.error('Error al actualizar perfil: %o', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil'
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validar que las contraseñas nuevas coincidan
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden'
        });
      }

      // Validar longitud de contraseña
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Obtener usuario actual
      const user = await Usuarios.findByPk(req.user.id);

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await Usuarios.update(
        { password: hashedPassword },
        { where: { id: req.user.id } }
      );

      logger.info(`Usuario ${req.user.id} cambió su contraseña`);

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      logger.error('Error al cambiar contraseña: %o', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña'
      });
    }
  }

  // Subir avatar
  static async uploadAvatar(req, res) {
    try {
      console.log('=== UPLOAD AVATAR REQUEST ===');
      console.log('req.file:', req.file);
      console.log('req.user:', req.user ? req.user.id : 'NO USER');
      console.log('req.body:', req.body);
      
      if (!req.file) {
        console.log('ERROR: No file received');
        return res.status(400).json({
          success: false,
          message: 'No se ha seleccionado ningún archivo'
        });
      }

      console.log('File received:', {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      });

      const fs = require('fs');
      const path = require('path');

      // Verificar que la carpeta de uploads existe
      const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
      console.log('Upload directory:', uploadDir);
      console.log('Directory exists:', fs.existsSync(uploadDir));
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        logger.info('Carpeta de avatars creada durante upload: ' + uploadDir);
      }

      // Obtener usuario actual para eliminar avatar anterior si existe
      const user = await Usuarios.findByPk(req.user.id);
      console.log('User found:', user ? user.id : 'NO USER');
      
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../public', user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          try {
            fs.unlinkSync(oldAvatarPath);
            logger.info(`Avatar anterior eliminado: ${oldAvatarPath}`);
          } catch (err) {
            logger.error('Error al eliminar avatar anterior: %o', err);
          }
        }
      }

      // Guardar ruta del nuevo avatar (relativa desde /public)
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      console.log('Saving avatar path to DB:', avatarPath);
      
      await Usuarios.update(
        { avatar: avatarPath },
        { where: { id: req.user.id } }
      );

      console.log('Avatar updated successfully in DB');
      logger.info(`Usuario ${req.user.id} actualizó su foto de perfil: ${req.file.filename}`);

      res.json({
        success: true,
        message: 'Foto de perfil actualizada correctamente',
        avatar: avatarPath
      });
    } catch (error) {
      console.error('ERROR in uploadAvatar:', error);
      logger.error('Error al subir avatar: %o', error);
      
      // Eliminar el archivo subido si hubo error en la BD
      if (req.file && req.file.path) {
        try {
          const fs = require('fs');
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (err) {
          logger.error('Error al limpiar archivo después de error: %o', err);
        }
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Error al subir la foto de perfil'
      });
    }
  }

  // Eliminar avatar
  static async deleteAvatar(req, res) {
    try {
      const user = await Usuarios.findByPk(req.user.id);

      if (!user.avatar) {
        return res.status(400).json({
          success: false,
          message: 'No hay foto de perfil para eliminar'
        });
      }

      const fs = require('fs');
      const path = require('path');
      const avatarPath = path.join(__dirname, '../../public', user.avatar);

      // Eliminar archivo físico si existe
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }

      // Actualizar base de datos
      await Usuarios.update(
        { avatar: null },
        { where: { id: req.user.id } }
      );

      logger.info(`Usuario ${req.user.id} eliminó su foto de perfil`);

      res.json({
        success: true,
        message: 'Foto de perfil eliminada correctamente'
      });
    } catch (error) {
      logger.error('Error al eliminar avatar: %o', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la foto de perfil'
      });
    }
  }
}

module.exports = ProfileController;
