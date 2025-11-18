const { pool } = require('../config/database');

class Alert {
  // Crear nueva alerta
  static async create(alertData) {
    try {
      const { dispositivo_id, tipo, severidad, mensaje } = alertData;
      const [result] = await pool.query(
        'INSERT INTO alertas (dispositivo_id, tipo, severidad, mensaje) VALUES (?, ?, ?, ?)',
        [dispositivo_id, tipo, severidad, mensaje]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Obtener alertas no leídas
  static async getUnread(deviceId = null) {
    try {
      let query = 'SELECT * FROM alertas WHERE leida = FALSE';
      const params = [];
      
      if (deviceId) {
        query += ' AND dispositivo_id = ?';
        params.push(deviceId);
      }
      
      query += ' ORDER BY fecha_creacion DESC';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Marcar alerta como leída
  static async markAsRead(id) {
    try {
      await pool.query(
        'UPDATE alertas SET leida = TRUE, fecha_lectura = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Obtener todas las alertas
  static async getAll(limit = 100) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM alertas ORDER BY fecha_creacion DESC LIMIT ?',
        [limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar alertas antiguas
  static async deleteOld(days = 30) {
    try {
      await pool.query(
        'DELETE FROM alertas WHERE fecha_creacion < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [days]
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Alert;
