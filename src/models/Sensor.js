const { pool } = require('../config/database');

class Sensor {
  // Crear nuevo sensor
  static async create(sensorData) {
    try {
      const { dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo } = sensorData;
      const [result] = await pool.query(
        'INSERT INTO sensores (dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [dispositivo_id, nombre, tipo, pin, unidad, valor_minimo, valor_maximo]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Buscar sensor por ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM sensores WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Listar sensores por dispositivo
  static async findByDeviceId(deviceId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM sensores WHERE dispositivo_id = ? ORDER BY fecha_creacion DESC',
        [deviceId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar sensor
  static async update(id, sensorData) {
    try {
      const { nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo } = sensorData;
      await pool.query(
        'UPDATE sensores SET nombre = ?, tipo = ?, pin = ?, unidad = ?, valor_minimo = ?, valor_maximo = ?, activo = ? WHERE id = ?',
        [nombre, tipo, pin, unidad, valor_minimo, valor_maximo, activo, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Eliminar sensor
  static async delete(id) {
    try {
      await pool.query('DELETE FROM sensores WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  // Registrar lectura
  static async addReading(sensorId, valor) {
    try {
      const [result] = await pool.query(
        'INSERT INTO lecturas (sensor_id, valor) VALUES (?, ?)',
        [sensorId, valor]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Obtener últimas lecturas
  static async getLastReadings(sensorId, limit = 10) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM lecturas WHERE sensor_id = ? ORDER BY fecha_lectura DESC LIMIT ?',
        [sensorId, limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Obtener última lectura
  static async getLastReading(sensorId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM lecturas WHERE sensor_id = ? ORDER BY fecha_lectura DESC LIMIT 1',
        [sensorId]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener lecturas por rango de fechas
  static async getReadingsByDateRange(sensorId, startDate, endDate) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM lecturas WHERE sensor_id = ? AND fecha_lectura BETWEEN ? AND ? ORDER BY fecha_lectura ASC',
        [sensorId, startDate, endDate]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Sensor;
