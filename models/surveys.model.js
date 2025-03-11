const db = require("../config/db");

const SurveyModel = {
  // Obtener todas las encuestas
  getAllSurveys: async () => {
    const query = `
      SELECT 
        ws.*,
        p.first_name,
        p.last_name,
        u.username,
        u.email
      FROM wellness_surveys ws
      JOIN profiles p ON ws.profile_id = p.profile_id
      JOIN users u ON p.user_id = u.user_id
      ORDER BY ws.created_at DESC
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener una encuesta por ID
  getSurveyById: async (surveyId) => {
    const query = `
      SELECT 
        ws.*,
        p.first_name,
        p.last_name,
        u.username,
        u.email
      FROM wellness_surveys ws
      JOIN profiles p ON ws.profile_id = p.profile_id
      JOIN users u ON p.user_id = u.user_id
      WHERE ws.survey_id = $1
    `;
    try {
      const result = await db.query(query, [surveyId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener encuestas por perfil
  getSurveysByProfileId: async (profileId) => {
    const query = `
      SELECT *
      FROM wellness_surveys
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

  // Obtener la encuesta más reciente de un perfil
  getLatestSurveyByProfileId: async (profileId) => {
    const query = `
      SELECT *
      FROM wellness_surveys
      WHERE profile_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Crear una nueva encuesta
  createSurvey: async (surveyData) => {
    const {
      profile_id,
      health_status,
      sleep_quality,
      sleep_hours,
      mood_state,
      energy_level,
      financial_situation,
      financial_control,
      job_stability,
      personal_goals,
      social_relations,
      romantic_relations,
      life_balance,
      spiritual_connection,
    } = surveyData;

    const query = `
      INSERT INTO wellness_surveys (
        profile_id,
        health_status,
        sleep_quality,
        sleep_hours,
        mood_state,
        energy_level,
        financial_situation,
        financial_control,
        job_stability,
        personal_goals,
        social_relations,
        romantic_relations,
        life_balance,
        spiritual_connection
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    try {
      const values = [
        profile_id,
        health_status,
        sleep_quality,
        sleep_hours,
        mood_state,
        energy_level,
        financial_situation,
        financial_control,
        job_stability,
        personal_goals,
        social_relations,
        romantic_relations,
        life_balance,
        spiritual_connection,
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar una encuesta
  updateSurvey: async (surveyId, surveyData) => {
    // Construir dinámicamente la consulta de actualización
    let query = "UPDATE wellness_surveys SET ";
    const values = [];
    const params = [];

    // Añadir los campos a actualizar
    let paramIndex = 1;
    for (const [key, value] of Object.entries(surveyData)) {
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
    query += ` WHERE survey_id = $${paramIndex} RETURNING *`;
    values.push(surveyId);

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener historial de encuestas para un perfil
  getSurveyHistoryByProfileId: async (profileId) => {
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

  // Obtener métricas de bienestar
  getWellnessMetrics: async () => {
    const query = `SELECT * FROM wellness_metrics`;
    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener opciones de áreas de mejora
  getImprovementAreasOptions: async () => {
    const query = `SELECT * FROM improvement_areas_options ORDER BY option_id`;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener opciones de actividades de bienestar
  getWellnessActivitiesOptions: async () => {
    const query = `SELECT * FROM wellness_activities_options ORDER BY option_id`;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = SurveyModel;
