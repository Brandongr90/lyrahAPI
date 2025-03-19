const db = require("../config/db");

const MetricsModel = {
  /**
   * Obtener métricas generales de bienestar
   * @returns {Promise<Object>} Métricas de bienestar
   */
  getWellnessMetrics: async () => {
    const query = `
      SELECT *
      FROM wellness_metrics
      ORDER BY calculation_date DESC
      LIMIT 1
    `;
    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener métricas de usuarios
   * @returns {Promise<Object>} Métricas de usuarios
   */
  getUserMetrics: async () => {
    const query = `SELECT * FROM user_metrics`;
    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener historial de encuestas para un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} Historial de encuestas
   */
  getSurveyHistory: async (profileId) => {
    const query = `
      SELECT *
      FROM survey_history
      WHERE profile_id = $1
      ORDER BY created_at DESC
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener progreso de bienestar para un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} Datos de progreso
   */
  getWellnessProgress: async (profileId) => {
    const query = `
      SELECT *
      FROM wellness_progress_view
      WHERE profile_id = $1
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener historial de login para un usuario
   * @param {string} userId - ID del usuario
   * @param {number} limit - Límite de registros (opcional)
   * @returns {Promise<Array>} Historial de login
   */
  getLoginHistory: async (userId, limit = 10) => {
    const query = `
      SELECT 
        login_id,
        login_timestamp,
        ip_address,
        user_agent,
        success
      FROM login_history
      WHERE user_id = $1
      ORDER BY login_timestamp DESC
      LIMIT $2
    `;
    try {
      const result = await db.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener actividad de un usuario
   * @param {string} userId - ID del usuario
   * @param {number} limit - Límite de registros (opcional)
   * @returns {Promise<Array>} Registros de actividad
   */
  getUserActivity: async (userId, limit = 20) => {
    const query = `
      SELECT 
        activity_id,
        activity_type,
        activity_details,
        created_at,
        ip_address
      FROM user_activity_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    try {
      const result = await db.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Registrar actividad de usuario
   * @param {Object} activityData - Datos de la actividad
   * @returns {Promise<Object>} Resultado de la operación
   */
  logUserActivity: async (activityData) => {
    const { user_id, activity_type, activity_details, ip_address } =
      activityData;

    const query = `
      INSERT INTO user_activity_log (
        user_id,
        activity_type,
        activity_details,
        ip_address
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        user_id,
        activity_type,
        activity_details,
        ip_address,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error("Error al registrar actividad:", error);
      // No lanzamos el error para no interrumpir el flujo principal
      return null;
    }
  },

  /**
   * Obtener estadísticas de encuestas
   * @returns {Promise<Object>} Estadísticas de encuestas
   */
  getSurveyStatistics: async () => {
    const query = `
      SELECT 
        COUNT(*) as total_surveys,
        COUNT(DISTINCT profile_id) as unique_profiles,
        MAX(created_at) as latest_survey,
        MIN(created_at) as first_survey
      FROM wellness_surveys
    `;
    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener perfil de bienestar completo
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Object>} Perfil de bienestar completo
   */
  getWellnessProfile: async (profileId) => {
    const query = `
      SELECT * FROM wellness_profile_view
      WHERE profile_id = $1
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
};

module.exports = MetricsModel;
