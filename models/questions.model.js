const db = require("../config/db");

const QuestionModel = {
  /**
   * Obtener todas las preguntas
   * @returns {Promise<Array>} Lista de preguntas
   */
  getAllQuestions: async () => {
    const query = `
      SELECT 
        question_id, 
        question_text, 
        section_number, 
        question_number,
        created_at
      FROM wellness_questions
      ORDER BY question_number
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener una pregunta por ID
   * @param {number} questionId - ID de la pregunta
   * @returns {Promise<Object>} Datos de la pregunta
   */
  getQuestionById: async (questionId) => {
    const query = `
      SELECT 
        question_id, 
        question_text, 
        section_number, 
        question_number,
        created_at
      FROM wellness_questions
      WHERE question_id = $1
    `;
    try {
      const result = await db.query(query, [questionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener preguntas por sección
   * @param {number} sectionNumber - Número de sección
   * @returns {Promise<Array>} Lista de preguntas de la sección
   */
  getQuestionsBySection: async (sectionNumber) => {
    const query = `
      SELECT 
        question_id, 
        question_text, 
        section_number, 
        question_number,
        created_at
      FROM wellness_questions
      WHERE section_number = $1
      ORDER BY question_number
    `;
    try {
      const result = await db.query(query, [sectionNumber]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener opciones de una pregunta
   * @param {number} questionId - ID de la pregunta
   * @returns {Promise<Array>} Lista de opciones
   */
  getQuestionOptions: async (questionId) => {
    const query = `
      SELECT 
        option_id, 
        question_id, 
        option_text, 
        score, 
        display_order
      FROM wellness_question_options
      WHERE question_id = $1
      ORDER BY display_order
    `;
    try {
      const result = await db.query(query, [questionId]);
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
        question_id, 
        option_text, 
        score, 
        display_order
      FROM wellness_question_options
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
   * Obtener preguntas con sus opciones
   * @returns {Promise<Array>} Lista de preguntas con opciones
   */
  getQuestionsWithOptions: async () => {
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
   * Obtener cuestionario completo organizado por secciones
   * @returns {Promise<Object>} Cuestionario organizado por secciones
   */
  getQuestionnaireBySection: async () => {
    try {
      // Obtener todas las preguntas con sus opciones
      const questions = await this.getQuestionsWithOptions();

      // Agrupar por sección
      const sections = {};

      for (const question of questions) {
        if (!sections[question.section_number]) {
          sections[question.section_number] = [];
        }

        sections[question.section_number].push(question);
      }

      return sections;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = QuestionModel;
