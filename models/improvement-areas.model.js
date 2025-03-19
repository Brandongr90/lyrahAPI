const db = require("../config/db");

const ImprovementAreasModel = {
  /**
   * Obtener todas las opciones de áreas de mejora
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
      FROM improvement_areas_options
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
      FROM improvement_areas_options
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
   * Obtener todas las áreas de mejora de un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} Lista de áreas de mejora
   */
  getProfileAreas: async (profileId) => {
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
   * Añadir un área de mejora a un perfil
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @param {number} priorityOrder - Orden de prioridad
   * @returns {Promise<Object>} Resultado de la operación
   */
  addProfileArea: async (profileId, optionId, priorityOrder) => {
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
   * Eliminar un área de mejora de un perfil
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @returns {Promise<Object>} Resultado de la operación
   */
  removeProfileArea: async (profileId, optionId) => {
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
   * Actualizar la prioridad de un área de mejora
   * @param {string} profileId - ID del perfil
   * @param {number} optionId - ID de la opción
   * @param {number} priorityOrder - Nuevo orden de prioridad
   * @returns {Promise<Object>} Resultado de la operación
   */
  updatePriority: async (profileId, optionId, priorityOrder) => {
    const query = `
      UPDATE profile_improvement_areas
      SET priority_order = $3
      WHERE profile_id = $1 AND option_id = $2
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
};

module.exports = ImprovementAreasModel;
