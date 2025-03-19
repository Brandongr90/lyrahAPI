const CategoryModel = require("../models/categories.model");
const { formatResponse, handleDatabaseError } = require("../utils/helpers");

const CategoryController = {
  /**
   * Obtener todas las categorías
   */
  getAllCategories: async (req, res) => {
    try {
      const categories = await CategoryModel.getAllCategories();

      return res.status(200).json(
        formatResponse(true, "Categorías obtenidas exitosamente", {
          count: categories.length,
          categories,
        })
      );
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener una categoría por ID
   */
  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await CategoryModel.getCategoryById(id);

      if (!category) {
        return res
          .status(404)
          .json(formatResponse(false, "Categoría no encontrada"));
      }

      return res
        .status(200)
        .json(
          formatResponse(true, "Categoría obtenida exitosamente", { category })
        );
    } catch (error) {
      console.error(
        `Error al obtener categoría con ID ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener preguntas asociadas a una categoría
   */
  getCategoryQuestions: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si la categoría existe
      const category = await CategoryModel.getCategoryById(id);
      if (!category) {
        return res
          .status(404)
          .json(formatResponse(false, "Categoría no encontrada"));
      }

      const questions = await CategoryModel.getCategoryQuestions(id);

      return res.status(200).json(
        formatResponse(
          true,
          "Preguntas de la categoría obtenidas exitosamente",
          {
            category,
            count: questions.length,
            questions,
          }
        )
      );
    } catch (error) {
      console.error(
        `Error al obtener preguntas para categoría ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener categorías con sus preguntas
   */
  getCategoriesWithQuestions: async (req, res) => {
    try {
      const categories = await CategoryModel.getCategoriesWithQuestions();

      return res.status(200).json(
        formatResponse(
          true,
          "Categorías con preguntas obtenidas exitosamente",
          {
            count: categories.length,
            categories,
          }
        )
      );
    } catch (error) {
      console.error("Error al obtener categorías con preguntas:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener mapeo de preguntas a categorías
   */
  getQuestionCategoryMapping: async (req, res) => {
    try {
      const mapping = await CategoryModel.getQuestionCategoryMapping();

      return res.status(200).json(
        formatResponse(
          true,
          "Mapeo de preguntas a categorías obtenido exitosamente",
          {
            count: mapping.length,
            mapping,
          }
        )
      );
    } catch (error) {
      console.error("Error al obtener mapeo de preguntas a categorías:", error);
      return handleDatabaseError(error, res);
    }
  },
};

module.exports = CategoryController;
