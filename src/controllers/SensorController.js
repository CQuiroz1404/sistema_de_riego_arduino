const { Sensores, Dispositivos, Lecturas } = require('../models');
const { Op } = require('sequelize');

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

      console.log(`[INFO] [sensors] Nuevo sensor creado: ${nombre} (Disp: ${dispositivo_id}, User: ${req.user.id}, IP: ${req.ip})`);

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

  // Listar sensores por dispositivo
  static async listByDevice(req, res) {
    try {
      const { deviceId } = req.params;

      // Verificar permisos
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

      const sensors = await Sensores.findAll({ where: { dispositivo_id: deviceId } });

      res.json({ 
        success: true, 
        sensors: sensors.map(s => s.toJSON()) 
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
      console.log(`[INFO] [sensors] Sensor actualizado: ${sensor.nombre} (Disp: ${sensor.dispositivo_id}, User: ${req.user.id}, IP: ${req.ip})`);

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

      await sensor.destroy();
      console.log(`[WARNING] [sensors] Sensor eliminado: ${sensor.nombre} (Disp: ${sensor.dispositivo_id}, User: ${req.user.id}, IP: ${req.ip})`);

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
