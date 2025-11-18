const { pool } = require('../config/database');

class Device {
  // Crear nuevo dispositivo
  static async create(deviceData) {
    try {
      const { nombre, ubicacion, descripcion, mac_address, api_key, usuario_id } = deviceData;
      const [result] = await pool.query(
        'INSERT INTO dispositivos (nombre, ubicacion, descripcion, mac_address, api_key, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, ubicacion, descripcion, mac_address, api_key, usuario_id]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Buscar dispositivo por ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM dispositivos WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar dispositivo por API Key
  static async findByApiKey(apiKey) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM dispositivos WHERE api_key = ?',
        [apiKey]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Listar dispositivos por usuario
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM dispositivos WHERE usuario_id = ? ORDER BY fecha_creacion DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Listar todos los dispositivos
  static async findAll() {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM vista_estado_dispositivos ORDER BY ultima_conexion DESC'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar dispositivo
  static async update(id, deviceData) {
    try {
      const { nombre, ubicacion, descripcion, estado } = deviceData;
      await pool.query(
        'UPDATE dispositivos SET nombre = ?, ubicacion = ?, descripcion = ?, estado = ? WHERE id = ?',
        [nombre, ubicacion, descripcion, estado, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Actualizar última conexión
  static async updateLastConnection(id, ipAddress = null) {
    try {
      if (ipAddress) {
        await pool.query(
          'UPDATE dispositivos SET ultima_conexion = CURRENT_TIMESTAMP, ip_address = ? WHERE id = ?',
          [ipAddress, id]
        );
      } else {
        await pool.query(
          'UPDATE dispositivos SET ultima_conexion = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );
      }
    } catch (error) {
      throw error;
    }
  }

  // Eliminar dispositivo
  static async delete(id) {
    try {
      await pool.query('DELETE FROM dispositivos WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas del dispositivo
  static async getStats(id) {
    try {
      const [stats] = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM sensores WHERE dispositivo_id = ? AND activo = TRUE) as sensores_activos,
          (SELECT COUNT(*) FROM actuadores WHERE dispositivo_id = ? AND activo = TRUE) as actuadores_activos,
          (SELECT COUNT(*) FROM configuraciones_riego WHERE dispositivo_id = ? AND activo = TRUE) as configuraciones_activas
      `, [id, id, id]);
      return stats[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Device;
