const { pool } = require('../config/database');

class IrrigationConfig {
  // Crear nueva configuración
  static async create(configData) {
    try {
      const { dispositivo_id, nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo } = configData;
      const [result] = await pool.query(
        'INSERT INTO configuraciones_riego (dispositivo_id, nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [dispositivo_id, nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Buscar configuración por ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM configuraciones_riego WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Listar configuraciones por dispositivo
  static async findByDeviceId(deviceId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM configuraciones_riego WHERE dispositivo_id = ? ORDER BY fecha_creacion DESC',
        [deviceId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar configuración
  static async update(id, configData) {
    try {
      const { nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo, activo } = configData;
      await pool.query(
        'UPDATE configuraciones_riego SET nombre = ?, sensor_id = ?, actuador_id = ?, umbral_inferior = ?, umbral_superior = ?, duracion_minutos = ?, modo = ?, activo = ? WHERE id = ?',
        [nombre, sensor_id, actuador_id, umbral_inferior, umbral_superior, duracion_minutos, modo, activo, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Eliminar configuración
  static async delete(id) {
    try {
      await pool.query('DELETE FROM configuraciones_riego WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  // Obtener configuraciones activas en modo automático
  static async getActiveAutoConfigs(deviceId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM configuraciones_riego WHERE dispositivo_id = ? AND activo = TRUE AND modo = "automatico"',
        [deviceId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = IrrigationConfig;
