const QuestionModel = require("../models/questions.model");
const { formatResponse, handleDatabaseError } = require("../utils/helpers");

const QuestionController = {
  /**
   * Obtener todas las preguntas
   */
  getAllQuestions: async (req, res) => {
    try {
      const questions = await QuestionModel.getAllQuestions();

      return res.status(200).json(
        formatResponse(true, "Preguntas obtenidas exitosamente", {
          count: questions.length,
          questions,
        })
      );
    } catch (error) {
      console.error("Error al obtener preguntas:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener una pregunta por ID
   */
  getQuestionById: async (req, res) => {
    try {
      const { id } = req.params;
      const question = await QuestionModel.getQuestionById(id);

      if (!question) {
        return res
          .status(404)
          .json(formatResponse(false, "Pregunta no encontrada"));
      }

      // Obtener opciones de la pregunta
      const options = await QuestionModel.getQuestionOptions(id);

      return res.status(200).json(
        formatResponse(true, "Pregunta obtenida exitosamente", {
          question,
          options,
        })
      );
    } catch (error) {
      console.error(
        `Error al obtener pregunta con ID ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener preguntas por sección
   */
  getQuestionsBySection: async (req, res) => {
    try {
      const { sectionNumber } = req.params;
      const questions = await QuestionModel.getQuestionsBySection(
        sectionNumber
      );

      return res.status(200).json(
        formatResponse(true, "Preguntas de la sección obtenidas exitosamente", {
          section: parseInt(sectionNumber),
          count: questions.length,
          questions,
        })
      );
    } catch (error) {
      console.error(
        `Error al obtener preguntas para sección ${req.params.sectionNumber}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener opciones de una pregunta
   */
  getQuestionOptions: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si la pregunta existe
      const question = await QuestionModel.getQuestionById(id);
      if (!question) {
        return res
          .status(404)
          .json(formatResponse(false, "Pregunta no encontrada"));
      }

      const options = await QuestionModel.getQuestionOptions(id);

      return res.status(200).json(
        formatResponse(true, "Opciones de la pregunta obtenidas exitosamente", {
          question,
          count: options.length,
          options,
        })
      );
    } catch (error) {
      console.error(
        `Error al obtener opciones para pregunta ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener una opción por ID
   */
  getOptionById: async (req, res) => {
    try {
      const { id } = req.params;
      const option = await QuestionModel.getOptionById(id);

      if (!option) {
        return res
          .status(404)
          .json(formatResponse(false, "Opción no encontrada"));
      }

      return res
        .status(200)
        .json(formatResponse(true, "Opción obtenida exitosamente", { option }));
    } catch (error) {
      console.error(`Error al obtener opción con ID ${req.params.id}:`, error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener preguntas con sus opciones
   */
  getQuestionsWithOptions: async (req, res) => {
    try {
      const questions = await QuestionModel.getQuestionsWithOptions();

      return res.status(200).json(
        formatResponse(true, "Preguntas con opciones obtenidas exitosamente", {
          count: questions.length,
          questions,
        })
      );
    } catch (error) {
      console.error("Error al obtener preguntas con opciones:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener cuestionario completo organizado por secciones
   */
  getQuestionnaireBySection: async (req, res) => {
    try {
      const sections = await QuestionModel.getQuestionnaireBySection();

      return res.status(200).json(
        formatResponse(true, "Cuestionario obtenido exitosamente", {
          sections_count: Object.keys(sections).length,
          sections,
        })
      );
    } catch (error) {
      console.error("Error al obtener cuestionario por secciones:", error);
      return handleDatabaseError(error, res);
    }
  },
};

module.exports = QuestionController;
