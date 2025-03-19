const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const ProfileModel = {
  /**
   * Obtener todos los perfiles con información básica del usuario
   * @returns {Promise<Array>} Lista de perfiles
   */
  getAllProfiles: async () => {
    const query = `
      SELECT 
        p.profile_id, 
        p.user_id, 
        u.username, 
        u.email, 
        p.first_name, 
        p.last_name, 
        p.birthdate, 
        p.gender, 
        p.city, 
        p.country
      FROM profiles p
      JOIN users u ON p.user_id = u.user_id
      WHERE u.is_active = TRUE
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener un perfil por ID
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Object>} Datos del perfil
   */
  getProfileById: async (profileId) => {
    const query = `
      SELECT 
        p.profile_id, 
        p.user_id, 
        u.username, 
        u.email, 
        p.first_name, 
        p.last_name, 
        p.birthdate, 
        p.gender, 
        p.profile_picture_url, 
        p.bio, 
        p.phone, 
        p.address, 
        p.city, 
        p.state, 
        p.country, 
        p.postal_code
      FROM profiles p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.profile_id = $1 AND u.is_active = TRUE
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener perfil por user_id
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos del perfil
   */
  getProfileByUserId: async (userId) => {
    const query = `
      SELECT 
        p.profile_id, 
        p.user_id, 
        p.first_name, 
        p.last_name, 
        p.birthdate, 
        p.gender, 
        p.profile_picture_url, 
        p.bio, 
        p.phone, 
        p.address, 
        p.city, 
        p.state, 
        p.country, 
        p.postal_code
      FROM profiles p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.user_id = $1 AND u.is_active = TRUE
    `;
    try {
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear un nuevo perfil
   * @param {Object} profileData - Datos del perfil
   * @returns {Promise<Object>} Perfil creado
   */
  createProfile: async (profileData) => {
    const {
      user_id,
      first_name,
      last_name,
      birthdate,
      gender,
      profile_picture_url,
      bio,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
    } = profileData;

    const profile_id = uuidv4(); // Generar UUID

    const query = `
      INSERT INTO profiles (
        profile_id,
        user_id,
        first_name,
        last_name,
        birthdate,
        gender,
        profile_picture_url,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postal_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    try {
      const values = [
        profile_id,
        user_id,
        first_name,
        last_name,
        birthdate,
        gender,
        profile_picture_url,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar un perfil
   * @param {string} profileId - ID del perfil
   * @param {Object} profileData - Datos a actualizar
   * @returns {Promise<Object>} Perfil actualizado
   */
  updateProfile: async (profileId, profileData) => {
    // Construir dinámicamente la consulta de actualización
    let query = "UPDATE profiles SET ";
    const values = [];
    const params = [];

    // Añadir los campos a actualizar
    let paramIndex = 1;
    for (const [key, value] of Object.entries(profileData)) {
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
    query += ` WHERE profile_id = $${paramIndex} RETURNING *`;
    values.push(profileId);

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener áreas de mejora de un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} Lista de áreas de mejora
   */
  getProfileImprovementAreas: async (profileId) => {
    const query = `
      SELECT 
        pia.profile_id,
        pia.option_id, 
        iao.name, 
        iao.description,
        pia.priority_order
      FROM profile_improvement_areas pia
      JOIN improvement_areas_options iao ON pia.option_id = iao.option_id
      WHERE pia.profile_id = $1
      ORDER BY pia.priority_order
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Añadir área de mejora a un perfil
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @param {number} priorityOrder - Orden de prioridad
   * @returns {Promise<Object>} Resultado de la operación
   */
  addProfileImprovementArea: async (profileId, optionId, priorityOrder) => {
    const query = `
      INSERT INTO profile_improvement_areas (profile_id, option_id, priority_order)
      VALUES ($1, $2, $3)
      ON CONFLICT (profile_id, option_id) 
      DO UPDATE SET priority_order = $3
      RETURNING *
    `;
    try {
      const result = await db.query(query, [
        profileId,
        optionId,
        priorityOrder,
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar área de mejora de un perfil
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @returns {Promise<Object>} Resultado de la operación
   */
  removeProfileImprovementArea: async (profileId, optionId) => {
    const query = `
      DELETE FROM profile_improvement_areas
      WHERE profile_id = $1 AND option_id = $2
      RETURNING *
    `;
    try {
      const result = await db.query(query, [profileId, optionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener actividades de bienestar de un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} Lista de actividades de bienestar
   */
  getProfileWellnessActivities: async (profileId) => {
    const query = `
      SELECT 
        pwa.profile_id,
        pwa.option_id, 
        o.name, 
        o.description
      FROM profile_wellness_activities pwa
      JOIN wellness_activities_options o ON pwa.option_id = o.option_id
      WHERE pwa.profile_id = $1
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Añadir actividad de bienestar a un perfil
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @returns {Promise<Object>} Resultado de la operación
   */
  addProfileWellnessActivity: async (profileId, optionId) => {
    const query = `
      INSERT INTO profile_wellness_activities (profile_id, option_id)
      VALUES ($1, $2)
      ON CONFLICT (profile_id, option_id) DO NOTHING
      RETURNING *
    `;
    try {
      const result = await db.query(query, [profileId, optionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar actividad de bienestar de un perfil
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @returns {Promise<Object>} Resultado de la operación
   */
  removeProfileWellnessActivity: async (profileId, optionId) => {
    const query = `
      DELETE FROM profile_wellness_activities
      WHERE profile_id = $1 AND option_id = $2
      RETURNING *
    `;
    try {
      const result = await db.query(query, [profileId, optionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ProfileModel;
