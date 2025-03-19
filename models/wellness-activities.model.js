const db = require("../config/db");

const WellnessActivitiesModel = {
  /**
   * Obtener todas las opciones de actividades de bienestar
   * @returns {Promise<Array>} Lista de opciones
   */
  getAllOptions: async () => {
    const query = `
      SELECT 
        option_id, 
        name, 
        description, 
        display_order,
        created_at
      FROM wellness_activities_options
      ORDER BY display_order
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener una opción por ID
   * @param {number} optionId - ID de la opción
   * @returns {Promise<Object>} Datos de la opción
   */
  getOptionById: async (optionId) => {
    const query = `
      SELECT 
        option_id, 
        name, 
        description, 
        display_order,
        created_at
      FROM wellness_activities_options
      WHERE option_id = $1
    `;
    try {
      const result = await db.query(query, [optionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener todas las actividades de bienestar de un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} Lista de actividades de bienestar
   */
  getProfileActivities: async (profileId) => {
    const query = `
      SELECT 
        pwa.profile_id,
        pwa.option_id,
        wao.name,
        wao.description
      FROM profile_wellness_activities pwa
      JOIN wellness_activities_options wao ON pwa.option_id = wao.option_id
      WHERE pwa.profile_id = $1
      ORDER BY wao.display_order
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Añadir una actividad de bienestar a un perfil
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @returns {Promise<Object>} Resultado de la operación
   */
  addProfileActivity: async (profileId, optionId) => {
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
   * Eliminar una actividad de bienestar de un perfil
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @returns {Promise<Object>} Resultado de la operación
   */
  removeProfileActivity: async (profileId, optionId) => {
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

  /**
   * Establecer múltiples actividades para un perfil
   * @param {string} profileId - ID del perfil
   * @param {Array} optionIds - Lista de IDs de opciones
   * @returns {Promise<Array>} Resultados de las operaciones
   */
  setProfileActivities: async (profileId, optionIds) => {
    // Comenzar transacción
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // Eliminar actividades existentes
      await client.query(
        "DELETE FROM profile_wellness_activities WHERE profile_id = $1",
        [profileId]
      );

      // Añadir nuevas actividades
      const results = [];

      for (const optionId of optionIds) {
        const query = `
          INSERT INTO profile_wellness_activities (profile_id, option_id)
          VALUES ($1, $2)
          RETURNING *
        `;

        const result = await client.query(query, [profileId, optionId]);
        results.push(result.rows[0]);
      }

      await client.query("COMMIT");

      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = WellnessActivitiesModel;
