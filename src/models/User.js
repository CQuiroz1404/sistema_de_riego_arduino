const { pool } = require('../config/database');

class User {
  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo usuario
  static async create(userData) {
    try {
      const { nombre, email, password, rol = 'usuario' } = userData;
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, password, rol]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar última conexión
  static async updateLastConnection(userId) {
    try {
      await pool.query(
        'UPDATE usuarios SET ultima_conexion = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Listar todos los usuarios
  static async findAll() {
    try {
      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, activo, fecha_creacion, ultima_conexion FROM usuarios ORDER BY fecha_creacion DESC'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar usuario
  static async update(id, userData) {
    try {
      const { nombre, email, rol, activo } = userData;
      await pool.query(
        'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ? WHERE id = ?',
        [nombre, email, rol, activo, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Eliminar usuario
  static async delete(id) {
    try {
      await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
