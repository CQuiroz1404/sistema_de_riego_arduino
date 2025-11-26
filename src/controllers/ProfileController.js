const { Usuarios, Dispositivos, Sensores, Lecturas } = require('../models');
const bcrypt = require('bcrypt');
const logger = require('../config/logger');

class ProfileController {
  // Mostrar perfil del usuario
  static async index(req, res) {
    try {
      const user = await Usuarios.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).render('error', {
          message: 'Usuario no encontrado'
        });
      }

      // Obtener estadísticas del usuario
      const devices = await Dispositivos.findAll({
        where: { usuario_id: req.user.id }
      });

      let totalSensors = 0;
      let totalReadings = 0;

      for (const device of devices) {
        const sensors = await Sensores.findAll({
          where: { dispositivo_id: device.id }
        });
        totalSensors += sensors.length;

        for (const sensor of sensors) {
          const readings = await Lecturas.count({
            where: { sensor_id: sensor.id }
          });
          totalReadings += readings;
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
        title: 'Mi Perfil'
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
      const { nombre, email } = req.body;

      // Verificar si el email ya existe (excepto el del usuario actual)
      const existingUser = await Usuarios.findOne({
        where: { email }
      });

      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }

      await Usuarios.update(
        { nombre, email },
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
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha seleccionado ningún archivo'
        });
      }

      const fs = require('fs');
      const path = require('path');

      // Obtener usuario actual para eliminar avatar anterior si existe
      const user = await Usuarios.findByPk(req.user.id);
      
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../public', user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Guardar ruta del nuevo avatar (relativa desde /public)
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      
      await Usuarios.update(
        { avatar: avatarPath },
        { where: { id: req.user.id } }
      );

      logger.info(`Usuario ${req.user.id} actualizó su foto de perfil`);

      res.json({
        success: true,
        message: 'Foto de perfil actualizada correctamente',
        avatar: avatarPath
      });
    } catch (error) {
      logger.error('Error al subir avatar: %o', error);
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
