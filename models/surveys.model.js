const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const SurveyModel = require("../models/surveys.model");

const SurveyModel = {
  /**
   * Obtener todas las encuestas
   * @returns {Promise<Array>} Lista de encuestas
   */
  getAllSurveys: async () => {
    const query = `
      SELECT 
        ws.survey_id,
        ws.profile_id,
        p.first_name,
        p.last_name,
        u.username,
        u.email,
        ws.survey_date,
        ws.consent_given,
        ws.created_at
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

  /**
   * Obtener una encuesta por ID
   * @param {string} surveyId - ID de la encuesta
   * @returns {Promise<Object>} Encuesta completa con respuestas y puntajes
   */
  getSurveyById: async (surveyId) => {
    // Consulta principal para datos básicos de la encuesta
    const surveyQuery = `
      SELECT 
        ws.survey_id,
        ws.profile_id,
        p.first_name,
        p.last_name,
        u.username,
        u.email,
        ws.survey_date,
        ws.consent_given,
        ws.created_at
      FROM wellness_surveys ws
      JOIN profiles p ON ws.profile_id = p.profile_id
      JOIN users u ON p.user_id = u.user_id
      WHERE ws.survey_id = $1
    `;

    // Consulta para obtener respuestas
    const responsesQuery = `
      SELECT 
        sr.response_id,
        sr.question_id,
        wq.question_text,
        sr.selected_option_id,
        wqo.option_text,
        sr.score
      FROM survey_responses sr
      JOIN wellness_questions wq ON sr.question_id = wq.question_id
      JOIN wellness_question_options wqo ON sr.selected_option_id = wqo.option_id
      WHERE sr.survey_id = $1
    `;

    // Consulta para obtener puntajes por categoría
    const scoresQuery = `
      SELECT 
        scs.category_id,
        wc.name AS category_name,
        scs.score
      FROM survey_category_scores scs
      JOIN wellness_categories wc ON scs.category_id = wc.category_id
      WHERE scs.survey_id = $1
      ORDER BY wc.display_order
    `;

    try {
      // Ejecutar las tres consultas
      const surveyResult = await db.query(surveyQuery, [surveyId]);
      const responsesResult = await db.query(responsesQuery, [surveyId]);
      const scoresResult = await db.query(scoresQuery, [surveyId]);

      // Si no se encuentra la encuesta
      if (surveyResult.rows.length === 0) {
        return null;
      }

      // Combinar los resultados
      const survey = surveyResult.rows[0];
      survey.responses = responsesResult.rows;
      survey.category_scores = scoresResult.rows;

      return survey;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener encuestas por perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} Lista de encuestas del perfil
   */
  getSurveysByProfileId: async (profileId) => {
    const query = `
      SELECT 
        ws.survey_id,
        ws.profile_id,
        ws.survey_date,
        ws.consent_given,
        ws.created_at
      FROM wellness_surveys ws
      WHERE ws.profile_id = $1
      ORDER BY ws.created_at DESC
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener la encuesta más reciente de un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Object>} Encuesta más reciente con puntajes por categoría
   */
  getLatestSurveyByProfileId: async (profileId) => {
    // Consulta para obtener la encuesta más reciente
    const surveyQuery = `
      SELECT 
        ws.survey_id,
        ws.profile_id,
        ws.survey_date,
        ws.consent_given,
        ws.created_at
      FROM wellness_surveys ws
      WHERE ws.profile_id = $1
      ORDER BY ws.created_at DESC
      LIMIT 1
    `;

    try {
      const surveyResult = await db.query(surveyQuery, [profileId]);

      // Si no hay encuestas
      if (surveyResult.rows.length === 0) {
        return null;
      }

      const survey = surveyResult.rows[0];

      // Consulta para obtener los puntajes por categoría
      const scoresQuery = `
        SELECT 
          scs.category_id,
          wc.name AS category_name,
          scs.score
        FROM survey_category_scores scs
        JOIN wellness_categories wc ON scs.category_id = wc.category_id
        WHERE scs.survey_id = $1
        ORDER BY wc.display_order
      `;

      const scoresResult = await db.query(scoresQuery, [survey.survey_id]);
      survey.category_scores = scoresResult.rows;

      return survey;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear una nueva encuesta con sus respuestas
   * @param {Object} surveyData - Datos de la encuesta y respuestas
   * @returns {Promise<Object>} Encuesta creada
   */
  createSurvey: async (surveyData) => {
    const { profile_id, consent_given = false, responses = [] } = surveyData;
    const survey_id = uuidv4(); // Generar UUID

    // Comenzar transacción
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // Insertar la encuesta principal
      const surveyQuery = `
        INSERT INTO wellness_surveys (
          survey_id,
          profile_id,
          consent_given
        ) VALUES ($1, $2, $3)
        RETURNING *
      `;

      const surveyResult = await client.query(surveyQuery, [
        survey_id,
        profile_id,
        consent_given,
      ]);

      // Insertar las respuestas
      if (responses.length > 0) {
        for (const response of responses) {
          const { question_id, selected_option_id, score } = response;

          const responseQuery = `
            INSERT INTO survey_responses (
              survey_id,
              question_id,
              selected_option_id,
              score
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
          `;

          await client.query(responseQuery, [
            survey_id,
            question_id,
            selected_option_id,
            score,
          ]);
        }
      }

      // Esperar un poco para asegurar que los triggers se hayan ejecutado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Si quieres estar 100% seguro, puedes recalcular explícitamente los puntajes
      await client.query("SELECT recalculate_survey_scores($1)", [survey_id]);

      await client.query("COMMIT");

      // Obtener la encuesta completa con puntajes calculados
      const completeSurvey = await SurveyModel.getSurveyById(survey_id);

      return completeSurvey;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Actualizar una encuesta
   * @param {string} surveyId - ID de la encuesta
   * @param {Object} surveyData - Datos a actualizar
   * @returns {Promise<Object>} Encuesta actualizada
   */
  updateSurvey: async (surveyId, surveyData) => {
    const { consent_given, responses = [] } = surveyData;

    // Comenzar transacción
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // Actualizar la encuesta principal
      const surveyQuery = `
        UPDATE wellness_surveys SET
          consent_given = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE survey_id = $2
        RETURNING *
      `;

      await client.query(surveyQuery, [consent_given, surveyId]);

      // Actualizar las respuestas
      if (responses.length > 0) {
        // Primero eliminar respuestas existentes
        await client.query(
          "DELETE FROM survey_responses WHERE survey_id = $1",
          [surveyId]
        );

        // Luego insertar las nuevas respuestas
        for (const response of responses) {
          const { question_id, selected_option_id, score } = response;

          const responseQuery = `
            INSERT INTO survey_responses (
              survey_id,
              question_id,
              selected_option_id,
              score
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
          `;

          await client.query(responseQuery, [
            surveyId,
            question_id,
            selected_option_id,
            score,
          ]);
        }
      }

      // Recalcular puntajes
      await client.query("SELECT recalculate_survey_scores($1)", [surveyId]);

      await client.query("COMMIT");

      // Obtener la encuesta completa con puntajes actualizados
      const updatedSurvey = await SurveyModel.getSurveyById(surveyId);

      return updatedSurvey;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Obtener historial de encuestas para un perfil
   * @param {string} profileId - ID del perfil
   * @returns {Promise<Array>} Historial de encuestas
   */
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

  /**
   * Obtener métricas de bienestar
   * @returns {Promise<Object>} Métricas generales
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
   * Obtener todas las preguntas con sus opciones
   * @returns {Promise<Array>} Lista de preguntas con opciones
   */
  getAllQuestions: async () => {
    const query = `
      SELECT 
        wq.question_id,
        wq.question_text,
        wq.section_number,
        wq.question_number,
        json_agg(
          json_build_object(
            'option_id', wqo.option_id,
            'option_text', wqo.option_text,
            'score', wqo.score,
            'display_order', wqo.display_order
          ) ORDER BY wqo.display_order
        ) AS options
      FROM wellness_questions wq
      JOIN wellness_question_options wqo ON wq.question_id = wqo.question_id
      GROUP BY wq.question_id
      ORDER BY wq.question_number
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener opciones para áreas de mejora
   * @returns {Promise<Array>} Lista de opciones de áreas de mejora
   */
  getImprovementAreasOptions: async () => {
    const query = `
      SELECT * 
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
   * Obtener opciones para actividades de bienestar
   * @returns {Promise<Array>} Lista de opciones de actividades de bienestar
   */
  getWellnessActivitiesOptions: async () => {
    const query = `
      SELECT * 
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
};

module.exports = SurveyModel;
