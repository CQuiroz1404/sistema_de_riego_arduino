const Device = require('../models/Device');
const Sensor = require('../models/Sensor');
const Actuator = require('../models/Actuator');
const Alert = require('../models/Alert');
const { pool } = require('../config/database');

class DashboardController {
  // Vista principal del dashboard
  static async index(req, res) {
    try {
      // Obtener dispositivos del usuario
      let devices;
      if (req.user.rol === 'admin') {
        devices = await Device.findAll();
      } else {
        devices = await Device.findByUserId(req.user.id);
      }

      // Obtener alertas no leídas
      const alerts = await Alert.getUnread();

      // Estadísticas generales
      const stats = await DashboardController.getGeneralStats(req.user);

      res.render('dashboard/index', {
        user: req.user,
        devices,
        alerts,
        stats
      });
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      res.status(500).render('error', {
        message: 'Error al cargar el dashboard'
      });
    }
  }

  // Obtener estadísticas generales
  static async getGeneralStats(user) {
    try {
      const userId = user.rol === 'admin' ? null : user.id;

      let query = `
        SELECT 
          (SELECT COUNT(*) FROM dispositivos ${userId ? 'WHERE usuario_id = ?' : ''}) as total_dispositivos,
          (SELECT COUNT(*) FROM dispositivos WHERE estado = 'activo' ${userId ? 'AND usuario_id = ?' : ''}) as dispositivos_activos,
          (SELECT COUNT(*) FROM sensores s 
           JOIN dispositivos d ON s.dispositivo_id = d.id 
           WHERE s.activo = TRUE ${userId ? 'AND d.usuario_id = ?' : ''}) as total_sensores,
          (SELECT COUNT(*) FROM actuadores a 
           JOIN dispositivos d ON a.dispositivo_id = d.id 
           WHERE a.activo = TRUE ${userId ? 'AND d.usuario_id = ?' : ''}) as total_actuadores,
          (SELECT COUNT(*) FROM alertas WHERE leida = FALSE) as alertas_no_leidas
      `;

      const params = userId ? [userId, userId, userId, userId] : [];
      const [stats] = await pool.query(query, params);

      return stats[0];
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {};
    }
  }

  // API: Obtener datos del dashboard
  static async getData(req, res) {
    try {
      let devices;
      if (req.user.rol === 'admin') {
        devices = await Device.findAll();
      } else {
        devices = await Device.findByUserId(req.user.id);
      }

      // Obtener última lectura de cada dispositivo
      const devicesWithData = await Promise.all(
        devices.map(async (device) => {
          const sensors = await Sensor.findByDeviceId(device.id);
          const sensorsWithReadings = await Promise.all(
            sensors.map(async (sensor) => {
              const lastReading = await Sensor.getLastReading(sensor.id);
              return { ...sensor, lastReading };
            })
          );
          return { ...device, sensors: sensorsWithReadings };
        })
      );

      const stats = await DashboardController.getGeneralStats(req.user);
      const alerts = await Alert.getUnread();

      res.json({
        success: true,
        devices: devicesWithData,
        stats,
        alerts
      });
    } catch (error) {
      console.error('Error al obtener datos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos del dashboard'
      });
    }
  }

  // API: Obtener datos de un dispositivo específico
  static async getDeviceData(req, res) {
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
          message: 'No tienes permisos para ver este dispositivo'
        });
      }

      const sensors = await Sensor.findByDeviceId(id);
      const actuators = await Actuator.findByDeviceId(id);

      // Obtener última lectura de cada sensor
      const sensorsWithReadings = await Promise.all(
        sensors.map(async (sensor) => {
          const lastReading = await Sensor.getLastReading(sensor.id);
          return { ...sensor, lastReading };
        })
      );

      res.json({
        success: true,
        device,
        sensors: sensorsWithReadings,
        actuators
      });
    } catch (error) {
      console.error('Error al obtener datos del dispositivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos'
      });
    }
  }
}

module.exports = DashboardController;
