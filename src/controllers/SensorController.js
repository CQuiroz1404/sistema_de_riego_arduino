const Sensor = require('../models/Sensor');
const Device = require('../models/Device');
const { dbLogger } = require('../middleware/logger');

class SensorController {
  // Crear nuevo sensor
  static async create(req, res) {
    try {
      const { dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo } = req.body;

      // Verificar permisos sobre el dispositivo
      const device = await Device.findById(dispositivo_id);
      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dispositivo no encontrado' 
        });
      }

      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos sobre este dispositivo' 
        });
      }

      const sensorId = await Sensor.create({
        dispositivo_id,
        nombre,
        tipo,
        pin,
        unidad,
        valor_minimo,
        valor_maximo
      });

      await dbLogger('info', 'sensors', `Nuevo sensor creado: ${nombre}`, dispositivo_id, req.user.id, req.ip);

      res.json({ 
        success: true, 
        message: 'Sensor creado exitosamente',
        sensorId 
      });
    } catch (error) {
      console.error('Error al crear sensor:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear sensor' 
      });
    }
  }

  // Obtener sensor por ID
  static async show(req, res) {
    try {
      const { id } = req.params;
      const sensor = await Sensor.findById(id);

      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Device.findById(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver este sensor' 
        });
      }

      res.json({ 
        success: true, 
        sensor 
      });
    } catch (error) {
      console.error('Error al obtener sensor:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener sensor' 
      });
    }
  }

  // Listar sensores por dispositivo
  static async listByDevice(req, res) {
    try {
      const { deviceId } = req.params;

      // Verificar permisos
      const device = await Device.findById(deviceId);
      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dispositivo no encontrado' 
        });
      }

      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos sobre este dispositivo' 
        });
      }

      const sensors = await Sensor.findByDeviceId(deviceId);

      res.json({ 
        success: true, 
        sensors 
      });
    } catch (error) {
      console.error('Error al obtener sensores:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener sensores' 
      });
    }
  }

  // Actualizar sensor
  static async update(req, res) {
    try {
      const { id } = req.params;
      const sensor = await Sensor.findById(id);

      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Device.findById(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para editar este sensor' 
        });
      }

      await Sensor.update(id, req.body);
      await dbLogger('info', 'sensors', `Sensor actualizado: ${sensor.nombre}`, sensor.dispositivo_id, req.user.id, req.ip);

      res.json({ 
        success: true, 
        message: 'Sensor actualizado exitosamente' 
      });
    } catch (error) {
      console.error('Error al actualizar sensor:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar sensor' 
      });
    }
  }

  // Eliminar sensor
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const sensor = await Sensor.findById(id);

      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Device.findById(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para eliminar este sensor' 
        });
      }

      await Sensor.delete(id);
      await dbLogger('warning', 'sensors', `Sensor eliminado: ${sensor.nombre}`, sensor.dispositivo_id, req.user.id, req.ip);

      res.json({ 
        success: true, 
        message: 'Sensor eliminado exitosamente' 
      });
    } catch (error) {
      console.error('Error al eliminar sensor:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar sensor' 
      });
    }
  }

  // Obtener últimas lecturas de un sensor
  static async getReadings(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const sensor = await Sensor.findById(id);
      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Device.findById(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver las lecturas' 
        });
      }

      const readings = await Sensor.getLastReadings(id, limit);

      res.json({ 
        success: true, 
        sensor,
        readings 
      });
    } catch (error) {
      console.error('Error al obtener lecturas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener lecturas' 
      });
    }
  }

  // Obtener lecturas por rango de fechas
  static async getReadingsByRange(req, res) {
    try {
      const { id } = req.params;
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ 
          success: false, 
          message: 'Fechas de inicio y fin son requeridas' 
        });
      }

      const sensor = await Sensor.findById(id);
      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Device.findById(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver las lecturas' 
        });
      }

      const readings = await Sensor.getReadingsByDateRange(id, start, end);

      res.json({ 
        success: true, 
        sensor,
        readings 
      });
    } catch (error) {
      console.error('Error al obtener lecturas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener lecturas' 
      });
    }
  }
}

module.exports = SensorController;
