const Device = require('../models/Device');
const Sensor = require('../models/Sensor');
const Actuator = require('../models/Actuator');
const { dbLogger } = require('../middleware/logger');
const crypto = require('crypto');

class DeviceController {
  // Mostrar todos los dispositivos
  static async index(req, res) {
    try {
      let devices;
      if (req.user.rol === 'admin') {
        devices = await Device.findAll();
      } else {
        devices = await Device.findByUserId(req.user.id);
      }
      
      res.render('devices/index', { 
        devices, 
        user: req.user 
      });
    } catch (error) {
      console.error('Error al obtener dispositivos:', error);
      res.status(500).render('error', { 
        message: 'Error al cargar dispositivos' 
      });
    }
  }

  // Mostrar formulario de creación
  static async create(req, res) {
    res.render('devices/create', { user: req.user });
  }

  // Crear nuevo dispositivo
  static async store(req, res) {
    try {
      const { nombre, ubicacion, descripcion, mac_address } = req.body;

      // Generar API key única
      const api_key = crypto.randomBytes(32).toString('hex');

      const deviceId = await Device.create({
        nombre,
        ubicacion,
        descripcion,
        mac_address,
        api_key,
        usuario_id: req.user.id
      });

      await dbLogger('info', 'devices', `Nuevo dispositivo creado: ${nombre}`, deviceId, req.user.id, req.ip);

      res.json({ 
        success: true, 
        message: 'Dispositivo creado exitosamente',
        deviceId,
        api_key 
      });
    } catch (error) {
      console.error('Error al crear dispositivo:', error);
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
      const device = await Device.findById(id);

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

      const sensors = await Sensor.findByDeviceId(id);
      const actuators = await Actuator.findByDeviceId(id);
      const stats = await Device.getStats(id);

      res.render('devices/show', { 
        device, 
        sensors, 
        actuators, 
        stats,
        user: req.user 
      });
    } catch (error) {
      console.error('Error al obtener dispositivo:', error);
      res.status(500).render('error', { 
        message: 'Error al cargar dispositivo' 
      });
    }
  }

  // Mostrar formulario de edición
  static async edit(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findById(id);

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
        device, 
        user: req.user 
      });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      res.status(500).render('error', { 
        message: 'Error al cargar formulario' 
      });
    }
  }

  // Actualizar dispositivo
  static async update(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findById(id);

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

      await Device.update(id, req.body);
      await dbLogger('info', 'devices', `Dispositivo actualizado: ${device.nombre}`, id, req.user.id, req.ip);

      res.json({ 
        success: true, 
        message: 'Dispositivo actualizado exitosamente' 
      });
    } catch (error) {
      console.error('Error al actualizar dispositivo:', error);
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
      const device = await Device.findById(id);

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

      await Device.delete(id);
      await dbLogger('warning', 'devices', `Dispositivo eliminado: ${device.nombre}`, id, req.user.id, req.ip);

      res.json({ 
        success: true, 
        message: 'Dispositivo eliminado exitosamente' 
      });
    } catch (error) {
      console.error('Error al eliminar dispositivo:', error);
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
        devices = await Device.findAll();
      } else {
        devices = await Device.findByUserId(req.user.id);
      }
      
      res.json({ 
        success: true, 
        devices 
      });
    } catch (error) {
      console.error('Error al obtener dispositivos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al cargar dispositivos' 
      });
    }
  }
}

module.exports = DeviceController;
