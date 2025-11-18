const { pool } = require('../config/database');

class Actuator {
  // Crear nuevo actuador
  static async create(actuatorData) {
    try {
      const { dispositivo_id, nombre, tipo, pin } = actuatorData;
      const [result] = await pool.query(
        'INSERT INTO actuadores (dispositivo_id, nombre, tipo, pin) VALUES (?, ?, ?, ?)',
        [dispositivo_id, nombre, tipo, pin]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Buscar actuador por ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM actuadores WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Listar actuadores por dispositivo
  static async findByDeviceId(deviceId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM actuadores WHERE dispositivo_id = ? ORDER BY fecha_creacion DESC',
        [deviceId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar actuador
  static async update(id, actuatorData) {
    try {
      const { nombre, tipo, pin, activo } = actuatorData;
      await pool.query(
        'UPDATE actuadores SET nombre = ?, tipo = ?, pin = ?, activo = ? WHERE id = ?',
        [nombre, tipo, pin, activo, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Cambiar estado del actuador
  static async updateState(id, estado) {
    try {
      await pool.query(
        'UPDATE actuadores SET estado = ? WHERE id = ?',
        [estado, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Eliminar actuador
  static async delete(id) {
    try {
      await pool.query('DELETE FROM actuadores WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  // Registrar evento de riego
  static async logEvent(eventData) {
    try {
      const { dispositivo_id, actuador_id, accion, modo, duracion_segundos, usuario_id } = eventData;
      const [result] = await pool.query(
        'INSERT INTO eventos_riego (dispositivo_id, actuador_id, accion, modo, duracion_segundos, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
        [dispositivo_id, actuador_id, accion, modo, duracion_segundos, usuario_id]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Obtener historial de eventos
  static async getEvents(actuatorId, limit = 50) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM eventos_riego WHERE actuador_id = ? ORDER BY fecha_evento DESC LIMIT ?',
        [actuatorId, limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Actuator;
