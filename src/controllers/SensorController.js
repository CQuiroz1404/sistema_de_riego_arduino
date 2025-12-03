const { Sensores, Dispositivos, Lecturas, LogsSistema } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const PaginationHelper = require('../utils/paginationHelper');

class SensorController {
  // Crear nuevo sensor
  static async create(req, res) {
    try {
      const { dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo } = req.body;

      // Verificar permisos sobre el dispositivo
      const device = await Dispositivos.findByPk(dispositivo_id);
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

      const sensor = await Sensores.create({
        dispositivo_id,
        nombre,
        tipo,
        pin,
        unidad,
        valor_minimo,
        valor_maximo
      });

      logger.info(`[sensors] Nuevo sensor creado: ${nombre} (Disp: ${dispositivo_id}, User: ${req.user.id}, IP: ${req.ip})`);

      // Log de auditoría
      await LogsSistema.create({
        nivel: 'info',
        modulo: 'sensores',
        mensaje: `Sensor creado: ${nombre} (${tipo}) en dispositivo ${device.nombre}`,
        dispositivo_id: parseInt(dispositivo_id),
        usuario_id: req.user.id,
        fecha_log: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Sensor creado exitosamente',
        sensorId: sensor.id 
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
      const sensor = await Sensores.findByPk(id);

      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Dispositivos.findByPk(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver este sensor' 
        });
      }

      res.json({ 
        success: true, 
        sensor: sensor.toJSON() 
      });
    } catch (error) {
      console.error('Error al obtener sensor:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener sensor' 
      });
    }
  }

  // List sensors by device (with pagination)
  static async listByDevice(req, res) {
    try {
      const { deviceId } = req.params;

      // Verify permissions
      const device = await Dispositivos.findByPk(deviceId);
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

      // Build pagination
      const { limit, offset, page } = PaginationHelper.buildQueryOptions(req, 20);

      const result = await Sensores.findAndCountAll({
        where: { dispositivo_id: deviceId },
        limit,
        offset,
        order: [['id', 'ASC']]
      });

      const pagination = PaginationHelper.calculate(result.count, page, limit);

      res.json({ 
        success: true, 
        sensors: result.rows.map(s => s.toJSON()),
        pagination
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
      const sensor = await Sensores.findByPk(id);

      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Dispositivos.findByPk(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para editar este sensor' 
        });
      }

      await sensor.update(req.body);
      logger.info(`[sensors] Sensor actualizado: ${sensor.nombre} (Disp: ${sensor.dispositivo_id}, User: ${req.user.id}, IP: ${req.ip})`);

      // Log de auditoría
      await LogsSistema.create({
        nivel: 'info',
        modulo: 'sensores',
        mensaje: `Umbrales actualizados en sensor: ${sensor.nombre} (Min: ${sensor.valor_minimo}, Max: ${sensor.valor_maximo})`,
        dispositivo_id: sensor.dispositivo_id,
        usuario_id: req.user.id,
        fecha_log: new Date()
      });

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
      const sensor = await Sensores.findByPk(id);

      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Dispositivos.findByPk(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para eliminar este sensor' 
        });
      }

      const nombreSensor = sensor.nombre;
      const dispositivoId = sensor.dispositivo_id;
      
      await sensor.destroy();
      logger.warn(`[sensors] Sensor eliminado: ${nombreSensor} (Disp: ${dispositivoId}, User: ${req.user.id}, IP: ${req.ip})`);

      // Log de auditoría
      await LogsSistema.create({
        nivel: 'warning',
        modulo: 'sensores',
        mensaje: `Sensor eliminado: ${nombreSensor}`,
        dispositivo_id: dispositivoId,
        usuario_id: req.user.id,
        fecha_log: new Date()
      });

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

      const sensor = await Sensores.findByPk(id);
      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Dispositivos.findByPk(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver las lecturas' 
        });
      }

      const readings = await Lecturas.findAll({
        where: { sensor_id: id },
        order: [['fecha_registro', 'DESC']],
        limit: limit
      });

      res.json({ 
        success: true, 
        sensor: sensor.toJSON(),
        readings: readings.map(r => r.toJSON()) 
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

      const sensor = await Sensores.findByPk(id);
      if (!sensor) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sensor no encontrado' 
        });
      }

      // Verificar permisos
      const device = await Dispositivos.findByPk(sensor.dispositivo_id);
      if (req.user.rol !== 'admin' && device.usuario_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para ver las lecturas' 
        });
      }

      const readings = await Lecturas.findAll({
        where: {
          sensor_id: id,
          fecha_registro: {
            [Op.between]: [start, end]
          }
        },
        order: [['fecha_registro', 'ASC']]
      });

      res.json({ 
        success: true, 
        sensor: sensor.toJSON(),
        readings: readings.map(r => r.toJSON()) 
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
