const { Dispositivos, Sensores, Actuadores, Lecturas } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class DeviceController {
  // Mostrar todos los dispositivos
  static async index(req, res) {
    try {
      let devices;
      if (req.user.rol === 'admin') {
        devices = await Dispositivos.findAll();
      } else {
        devices = await Dispositivos.findAll({ where: { usuario_id: req.user.id } });
      }
      
      // Calcular estado de conexión en tiempo real (encendido si última conexión < 30 segundos)
      const now = new Date();
      const devicesWithStatus = devices.map(d => {
        const device = d.toJSON();
        const lastConnection = device.ultima_conexion ? new Date(device.ultima_conexion) : null;
        const secondsAgo = lastConnection ? Math.floor((now - lastConnection) / 1000) : null;
        
        // Estado de encendido: está enviando datos (última conexión < 30 segundos)
        device.isOnline = lastConnection && secondsAgo < 30;
        device.estadoConexion = device.isOnline ? 'encendido' : 'apagado';
        device.secondsAgo = secondsAgo;
        
        return device;
      });
      
      res.render('devices/index', { 
        devices: devicesWithStatus, 
        user: req.user 
      });
    } catch (error) {
      logger.error('Error al obtener dispositivos: %o', error);
      res.status(500).render('error', { 
        message: 'Error al cargar dispositivos' 
      });
    }
  }

  // Mostrar formulario de creación
  static async create(req, res) {
    res.render('devices/create', { title: 'Nuevo Dispositivo', user: req.user });
  }

  // Crear nuevo dispositivo
  static async store(req, res) {
    try {
      const { nombre, ubicacion, descripcion } = req.body;

      // Generar API key única
      const api_key = crypto.randomBytes(32).toString('hex');

      const device = await Dispositivos.create({
        nombre,
        ubicacion,
        descripcion,
        api_key,
        usuario_id: req.user.id
      });

      logger.info(`[INFO] [devices] Nuevo dispositivo creado: ${nombre} (Disp: ${device.id}, User: ${req.user.id}, IP: ${req.ip})`);

      res.json({ 
        success: true, 
        message: 'Dispositivo creado exitosamente',
        deviceId: device.id,
        api_key 
      });
    } catch (error) {
      logger.error('Error al crear dispositivo: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear dispositivo' 
      });
    }
  }

  // Mostrar un dispositivo específico
  static async show(req, res) {
    try {
      const { id } = req.params;
      const device = await Dispositivos.findByPk(id);

      if (!device) {
        return res.status(404).render('error', { 
          message: 'Dispositivo no encontrado' 
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).render('error', { 
          message: 'No tienes permisos para ver este dispositivo' 
        });
      }

      const sensors = await Sensores.findAll({ where: { dispositivo_id: id } });
      const actuators = await Actuadores.findAll({ where: { dispositivo_id: id } });
      
      // Calcular estado de conexión
      const now = new Date();
      const deviceJson = device.toJSON();
      const lastConnection = deviceJson.ultima_conexion ? new Date(deviceJson.ultima_conexion) : null;
      const secondsAgo = lastConnection ? Math.floor((now - lastConnection) / 1000) : null;
      
      // Estado de encendido: está enviando datos (última conexión < 30 segundos)
      deviceJson.isOnline = lastConnection && secondsAgo < 30;
      deviceJson.estadoConexion = deviceJson.isOnline ? 'encendido' : 'apagado';
      deviceJson.secondsAgo = secondsAgo;
      
      // Calcular estadísticas básicas
      const stats = {
        total_sensores: sensors.length,
        total_actuadores: actuators.length,
        ultima_conexion: device.ultima_conexion
      };

      res.render('devices/show', { 
        device: deviceJson, 
        sensors: sensors.map(s => s.toJSON()), 
        actuators: actuators.map(a => a.toJSON()), 
        stats,
        user: req.user 
      });
    } catch (error) {
      logger.error('Error al obtener dispositivo: %o', error);
      res.status(500).render('error', { 
        message: 'Error al cargar dispositivo' 
      });
    }
  }

  // Mostrar formulario de edición
  static async edit(req, res) {
    try {
      const { id } = req.params;
      const device = await Dispositivos.findByPk(id);

      if (!device) {
        return res.status(404).render('error', { 
          message: 'Dispositivo no encontrado' 
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).render('error', { 
          message: 'No tienes permisos para editar este dispositivo' 
        });
      }

      res.render('devices/edit', { 
        device: device.toJSON(), 
        user: req.user 
      });
    } catch (error) {
      logger.error('Error al cargar formulario: %o', error);
      res.status(500).render('error', { 
        message: 'Error al cargar formulario' 
      });
    }
  }

  // Actualizar dispositivo
  static async update(req, res) {
    try {
      const { id } = req.params;
      const device = await Dispositivos.findByPk(id);

      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dispositivo no encontrado' 
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para editar este dispositivo' 
        });
      }

      await device.update(req.body);
      logger.info(`[INFO] [devices] Dispositivo actualizado: ${device.nombre} (Disp: ${id}, User: ${req.user.id}, IP: ${req.ip})`);

      res.json({ 
        success: true, 
        message: 'Dispositivo actualizado exitosamente' 
      });
    } catch (error) {
      logger.error('Error al actualizar dispositivo: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar dispositivo' 
      });
    }
  }

  // Eliminar dispositivo
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const device = await Dispositivos.findByPk(id);

      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dispositivo no encontrado' 
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para eliminar este dispositivo' 
        });
      }

      await device.destroy();
      logger.warn(`[WARNING] [devices] Dispositivo eliminado: ${device.nombre} (Disp: ${id}, User: ${req.user.id}, IP: ${req.ip})`);

      res.json({ 
        success: true, 
        message: 'Dispositivo eliminado exitosamente' 
      });
    } catch (error) {
      logger.error('Error al eliminar dispositivo: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar dispositivo' 
      });
    }
  }

  // API: Listar dispositivos (JSON)
  static async apiList(req, res) {
    try {
      let devices;
      if (req.user.rol === 'admin') {
        devices = await Dispositivos.findAll();
      } else {
        devices = await Dispositivos.findAll({ where: { usuario_id: req.user.id } });
      }
      
      res.json({ 
        success: true, 
        devices: devices.map(d => d.toJSON()) 
      });
    } catch (error) {
      logger.error('Error al obtener dispositivos: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al cargar dispositivos' 
      });
    }
  }

  // API: Verificar estado de conexión de un dispositivo
  static async checkStatus(req, res) {
    try {
      const { id } = req.params;
      const device = await Dispositivos.findByPk(id);

      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dispositivo no encontrado' 
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos' 
        });
      }

      // Considerar encendido si la última conexión fue hace menos de 30 segundos
      const now = new Date();
      const lastConnection = device.ultima_conexion ? new Date(device.ultima_conexion) : null;
      const secondsAgo = lastConnection ? Math.floor((now - lastConnection) / 1000) : null;
      const isOnline = lastConnection && secondsAgo < 30;

      logger.debug(`[Device ${id}] ultima_conexion: ${device.ultima_conexion}, isOnline: ${isOnline}, secondsAgo: ${secondsAgo}`);

      res.json({ 
        success: true, 
        data: {
          online: isOnline,
          estadoConexion: isOnline ? 'encendido' : 'apagado',
          last_connection: device.ultima_conexion,
          estado: device.estado,
          seconds_ago: secondsAgo
        }
      });
    } catch (error) {
      logger.error('Error al verificar estado: %o', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al verificar estado' 
      });
    }
  }
}

module.exports = DeviceController;
