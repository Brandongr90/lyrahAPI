const db = require("../config/db");

const CategoryModel = {
  /**
   * Obtener todas las categorías de bienestar
   * @returns {Promise<Array>} Lista de categorías
   */
  getAllCategories: async () => {
    const query = `
      SELECT 
        category_id, 
        name, 
        description, 
        display_order
      FROM wellness_categories
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
   * Obtener una categoría por ID
   * @param {number} categoryId - ID de la categoría
   * @returns {Promise<Object>} Datos de la categoría
   */
  getCategoryById: async (categoryId) => {
    const query = `
      SELECT 
        category_id, 
        name, 
        description, 
        display_order
      FROM wellness_categories
      WHERE category_id = $1
    `;
    try {
      const result = await db.query(query, [categoryId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener preguntas asociadas a una categoría
   * @param {number} categoryId - ID de la categoría
   * @returns {Promise<Array>} Lista de preguntas
   */
  getCategoryQuestions: async (categoryId) => {
    const query = `
      SELECT 
        wq.question_id, 
        wq.question_text, 
        wq.section_number, 
        wq.question_number,
        qcm.weight,
        qcm.is_external
      FROM wellness_questions wq
      JOIN question_category_mapping qcm ON wq.question_id = qcm.question_id
      WHERE qcm.category_id = $1
      ORDER BY wq.question_number
    `;
    try {
      const result = await db.query(query, [categoryId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener categorías con sus preguntas
   * @returns {Promise<Array>} Lista de categorías con preguntas
   */
  getCategoriesWithQuestions: async () => {
    const categoriesQuery = `
      SELECT 
        category_id, 
        name, 
        description, 
        display_order
      FROM wellness_categories
      ORDER BY display_order
    `;

    try {
      const categoriesResult = await db.query(categoriesQuery);
      const categories = categoriesResult.rows;

      // Para cada categoría, obtener sus preguntas
      for (const category of categories) {
        const questionsQuery = `
          SELECT 
            wq.question_id, 
            wq.question_text, 
            wq.section_number, 
            wq.question_number,
            qcm.weight,
            qcm.is_external
          FROM wellness_questions wq
          JOIN question_category_mapping qcm ON wq.question_id = qcm.question_id
          WHERE qcm.category_id = $1
          ORDER BY wq.question_number
        `;

        const questionsResult = await db.query(questionsQuery, [
          category.category_id,
        ]);
        category.questions = questionsResult.rows;
      }

      return categories;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener mapeo de preguntas a categorías
   * @returns {Promise<Array>} Lista de mapeo
   */
  getQuestionCategoryMapping: async () => {
    const query = `
      SELECT 
        qcm.mapping_id,
        qcm.question_id,
        wq.question_text,
        qcm.category_id,
        wc.name AS category_name,
        qcm.weight,
        qcm.is_external
      FROM question_category_mapping qcm
      JOIN wellness_questions wq ON qcm.question_id = wq.question_id
      JOIN wellness_categories wc ON qcm.category_id = wc.category_id
      ORDER BY wc.display_order, wq.question_number
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = CategoryModel;
