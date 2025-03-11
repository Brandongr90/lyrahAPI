const db = require("../config/db");

const UserModel = {
  // Obtener todos los usuarios
  getAllUsers: async () => {
    const query = `
      SELECT 
        u.user_id, 
        u.username, 
        u.email, 
        u.role_id, 
        r.name AS role_name, 
        u.is_active, 
        u.is_verified, 
        u.last_login
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener un usuario por ID
  getUserById: async (userId) => {
    const query = `
      SELECT 
        u.user_id, 
        u.username, 
        u.email, 
        u.role_id, 
        r.name AS role_name, 
        u.is_active, 
        u.is_verified, 
        u.last_login
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = $1
    `;
    try {
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener un usuario por email (útil para login)
  getUserByEmail: async (email) => {
    const query = `
      SELECT 
        u.user_id, 
        u.username, 
        u.email, 
        u.password_hash, 
        u.role_id, 
        r.name AS role_name, 
        u.is_active, 
        u.is_verified
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = $1
    `;
    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Crear un nuevo usuario
  createUser: async (userData) => {
    const { username, email, password_hash, role_id } = userData;
    const query = `
      INSERT INTO users 
        (username, email, password_hash, role_id) 
      VALUES 
        ($1, $2, $3, $4)
      RETURNING 
        user_id, username, email, role_id, is_active, is_verified
    `;
    try {
      const result = await db.query(query, [
        username,
        email,
        password_hash,
        role_id,
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar un usuario
  updateUser: async (userId, userData) => {
    // Construir dinámicamente la consulta de actualización
    let query = "UPDATE users SET ";
    const values = [];
    const params = [];

    // Añadir los campos a actualizar
    let paramIndex = 1;
    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        params.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // Añadir el updated_at automáticamente
    params.push(`updated_at = CURRENT_TIMESTAMP`);

    // Completar la consulta
    query += params.join(", ");
    query += ` WHERE user_id = $${paramIndex} RETURNING *`;
    values.push(userId);

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar el último login
  updateLastLogin: async (userId) => {
    const query = `
      UPDATE users 
      SET 
        last_login = CURRENT_TIMESTAMP,
        login_count = login_count + 1
      WHERE user_id = $1
      RETURNING user_id
    `;
    try {
      await db.query(query, [userId]);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Borrar un usuario (actualiza is_active a FALSE en lugar de borrar realmente)
  deleteUser: async (userId) => {
    const query = `
      UPDATE users
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING user_id
    `;
    try {
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
};

module.exports = UserModel;
