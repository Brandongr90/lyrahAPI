const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const UserModel = {
  /**
   * Obtener todos los usuarios
   * @returns {Promise<Array>} Lista de usuarios
   */
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

  /**
   * Obtener un usuario por ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
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

  /**
   * Obtener un usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object>} Datos del usuario incluyendo password_hash
   */
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

  /**
   * Obtener un usuario por nombre de usuario
   * @param {string} username - Nombre de usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  getUserByUsername: async (username) => {
    const query = `
      SELECT 
        user_id, 
        username, 
        email
      FROM users
      WHERE username = $1
    `;
    try {
      const result = await db.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario a crear
   * @returns {Promise<Object>} Usuario creado
   */
  createUser: async (userData) => {
    const { username, email, password_hash, role_id = 2 } = userData;
    const user_id = uuidv4(); // Generar UUID

    const query = `
      INSERT INTO users 
        (user_id, username, email, password_hash, role_id) 
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING 
        user_id, username, email, role_id, is_active, is_verified
    `;
    try {
      const result = await db.query(query, [
        user_id,
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

  /**
   * Actualizar un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
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

  /**
   * Actualizar el último login
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
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

  /**
   * Desactivar un usuario (soft delete)
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
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

  /**
   * Registrar intento de login
   * @param {string} userId - ID del usuario
   * @param {string} ipAddress - Dirección IP
   * @param {string} userAgent - User agent
   * @param {boolean} success - Si el login fue exitoso
   */
  logLogin: async (userId, ipAddress, userAgent, success) => {
    const query = `
      INSERT INTO login_history 
        (user_id, ip_address, user_agent, success) 
      VALUES 
        ($1, $2, $3, $4)
    `;
    try {
      await db.query(query, [userId, ipAddress, userAgent, success]);
      return true;
    } catch (error) {
      console.error("Error al registrar intento de login:", error);
      // No lanzamos el error aquí para no interrumpir el flujo principal
      return false;
    }
  },

  /**
   * Obtener roles disponibles
   * @returns {Promise<Array>} Lista de roles
   */
  getRoles: async () => {
    const query = `SELECT role_id, name, description FROM roles`;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = UserModel;
