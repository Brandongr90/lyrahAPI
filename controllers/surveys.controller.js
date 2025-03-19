const SurveyModel = require("../models/surveys.model");
const ProfileModel = require("../models/profiles.model");
const MetricsModel = require("../models/metrics.model");
const { formatResponse, handleDatabaseError } = require("../utils/helpers");

const SurveyController = {
  /**
   * Obtener todas las encuestas
   */
  getAllSurveys: async (req, res) => {
    try {
      // Solo admin puede ver todas las encuestas
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver todas las encuestas"
            )
          );
      }

      const surveys = await SurveyModel.getAllSurveys();

      return res.status(200).json(
        formatResponse(true, "Encuestas obtenidas exitosamente", {
          count: surveys.length,
          surveys,
        })
      );
    } catch (error) {
      console.error("Error al obtener encuestas:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener una encuesta por ID
   */
  getSurveyById: async (req, res) => {
    try {
      const { id } = req.params;
      const survey = await SurveyModel.getSurveyById(id);

      if (!survey) {
        return res
          .status(404)
          .json(formatResponse(false, "Encuesta no encontrada"));
      }

      // Verificar permisos (solo el dueño del perfil o un admin pueden ver la encuesta)
      const profile = await ProfileModel.getProfileById(survey.profile_id);
      if (req.user.userId !== profile.user_id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(false, "No tienes permisos para ver esta encuesta")
          );
      }

      return res
        .status(200)
        .json(
          formatResponse(true, "Encuesta obtenida exitosamente", { survey })
        );
    } catch (error) {
      console.error(
        `Error al obtener encuesta con ID ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener encuestas por perfil
   */
  getSurveysByProfileId: async (req, res) => {
    try {
      const { profileId } = req.params;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profileId);
      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos
      if (req.user.userId !== profile.user_id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver las encuestas de este perfil"
            )
          );
      }

      const surveys = await SurveyModel.getSurveysByProfileId(profileId);

      return res.status(200).json(
        formatResponse(true, "Encuestas obtenidas exitosamente", {
          count: surveys.length,
          surveys,
        })
      );
    } catch (error) {
      console.error(
        `Error al obtener encuestas para perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener la encuesta más reciente de un perfil
   */
  getLatestSurveyByProfileId: async (req, res) => {
    try {
      const { profileId } = req.params;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profileId);
      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos
      if (req.user.userId !== profile.user_id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver las encuestas de este perfil"
            )
          );
      }

      const survey = await SurveyModel.getLatestSurveyByProfileId(profileId);

      if (!survey) {
        return res
          .status(404)
          .json(
            formatResponse(
              false,
              "No se encontraron encuestas para este perfil"
            )
          );
      }

      return res
        .status(200)
        .json(
          formatResponse(true, "Última encuesta obtenida exitosamente", {
            survey,
          })
        );
    } catch (error) {
      console.error(
        `Error al obtener última encuesta para perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Crear una nueva encuesta
   */
  createSurvey: async (req, res) => {
    try {
      const { profile_id, consent_given, responses } = req.body;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profile_id);
      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos
      if (req.user.userId !== profile.user_id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para crear encuestas para este perfil"
            )
          );
      }

      // Validar que se proporcionen respuestas
      if (!responses || !Array.isArray(responses) || responses.length === 0) {
        return res
          .status(400)
          .json(
            formatResponse(
              false,
              "Debe proporcionar respuestas para la encuesta"
            )
          );
      }

      // Crear la encuesta
      const newSurvey = await SurveyModel.createSurvey({
        profile_id,
        consent_given,
        responses,
      });

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "creación_encuesta",
        activity_details: {
          profile_id,
          survey_id: newSurvey.survey_id,
        },
        ip_address: req.ip,
      });

      return res
        .status(201)
        .json(
          formatResponse(true, "Encuesta creada exitosamente", {
            survey: newSurvey,
          })
        );
    } catch (error) {
      console.error("Error al crear encuesta:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Actualizar una encuesta
   */
  updateSurvey: async (req, res) => {
    try {
      const { id } = req.params;
      const { consent_given, responses } = req.body;

      // Verificar si la encuesta existe
      const existingSurvey = await SurveyModel.getSurveyById(id);
      if (!existingSurvey) {
        return res
          .status(404)
          .json(formatResponse(false, "Encuesta no encontrada"));
      }

      // Verificar permisos
      const profile = await ProfileModel.getProfileById(
        existingSurvey.profile_id
      );
      if (req.user.userId !== profile.user_id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para actualizar esta encuesta"
            )
          );
      }

      // Actualizar la encuesta
      const updatedSurvey = await SurveyModel.updateSurvey(id, {
        consent_given,
        responses,
      });

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "actualización_encuesta",
        activity_details: {
          survey_id: id,
          profile_id: existingSurvey.profile_id,
        },
        ip_address: req.ip,
      });

      return res
        .status(200)
        .json(
          formatResponse(true, "Encuesta actualizada exitosamente", {
            survey: updatedSurvey,
          })
        );
    } catch (error) {
      console.error(
        `Error al actualizar encuesta con ID ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener historial de encuestas
   */
  getSurveyHistoryByProfileId: async (req, res) => {
    try {
      const { profileId } = req.params;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profileId);
      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos
      if (req.user.userId !== profile.user_id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver el historial de este perfil"
            )
          );
      }

      const history = await SurveyModel.getSurveyHistoryByProfileId(profileId);

      return res.status(200).json(
        formatResponse(true, "Historial de encuestas obtenido exitosamente", {
          count: history.length,
          history,
        })
      );
    } catch (error) {
      console.error(
        `Error al obtener historial de encuestas para perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener métricas de bienestar
   */
  getWellnessMetrics: async (req, res) => {
    try {
      // Solo admin puede ver las métricas generales
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver las métricas generales"
            )
          );
      }

      const metrics = await SurveyModel.getWellnessMetrics();

      return res
        .status(200)
        .json(
          formatResponse(true, "Métricas de bienestar obtenidas exitosamente", {
            metrics,
          })
        );
    } catch (error) {
      console.error("Error al obtener métricas de bienestar:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener opciones para áreas de mejora
   */
  getImprovementAreasOptions: async (req, res) => {
    try {
      const options = await SurveyModel.getImprovementAreasOptions();

      return res.status(200).json(
        formatResponse(
          true,
          "Opciones de áreas de mejora obtenidas exitosamente",
          {
            count: options.length,
            options,
          }
        )
      );
    } catch (error) {
      console.error("Error al obtener opciones de áreas de mejora:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener opciones para actividades de bienestar
   */
  getWellnessActivitiesOptions: async (req, res) => {
    try {
      const options = await SurveyModel.getWellnessActivitiesOptions();

      return res.status(200).json(
        formatResponse(
          true,
          "Opciones de actividades de bienestar obtenidas exitosamente",
          {
            count: options.length,
            options,
          }
        )
      );
    } catch (error) {
      console.error(
        "Error al obtener opciones de actividades de bienestar:",
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener todas las preguntas del cuestionario con sus opciones
   */
  getAllQuestions: async (req, res) => {
    try {
      const questions = await SurveyModel.getAllQuestions();

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
   * Obtener estadísticas de encuestas
   */
  getSurveyStatistics: async (req, res) => {
    try {
      // Solo admin puede ver las estadísticas
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver las estadísticas de encuestas"
            )
          );
      }

      const statistics = await MetricsModel.getSurveyStatistics();

      return res
        .status(200)
        .json(
          formatResponse(
            true,
            "Estadísticas de encuestas obtenidas exitosamente",
            { statistics }
          )
        );
    } catch (error) {
      console.error("Error al obtener estadísticas de encuestas:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener progreso de bienestar para un perfil
   */
  getWellnessProgress: async (req, res) => {
    try {
      const { profileId } = req.params;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profileId);
      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos
      if (req.user.userId !== profile.user_id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver el progreso de este perfil"
            )
          );
      }

      const progress = await MetricsModel.getWellnessProgress(profileId);

      return res
        .status(200)
        .json(
          formatResponse(true, "Progreso de bienestar obtenido exitosamente", {
            progress,
          })
        );
    } catch (error) {
      console.error(
        `Error al obtener progreso de bienestar para perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },
};

module.exports = SurveyController;
