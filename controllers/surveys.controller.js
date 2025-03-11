const SurveyModel = require("../models/surveys.model");
const ProfileModel = require("../models/profiles.model");

const SurveyController = {
  // Obtener todas las encuestas
  getAllSurveys: async (req, res) => {
    try {
      const surveys = await SurveyModel.getAllSurveys();
      return res.status(200).json({
        success: true,
        count: surveys.length,
        data: surveys,
      });
    } catch (error) {
      console.error("Error al obtener encuestas:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener encuestas",
        error: error.message,
      });
    }
  },

  // Obtener una encuesta por ID
  getSurveyById: async (req, res) => {
    try {
      const { id } = req.params;
      const survey = await SurveyModel.getSurveyById(id);

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Encuesta no encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        data: survey,
      });
    } catch (error) {
      console.error(
        `Error al obtener encuesta con ID ${req.params.id}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener encuesta",
        error: error.message,
      });
    }
  },

  // Obtener encuestas por perfil
  getSurveysByProfileId: async (req, res) => {
    try {
      const { profileId } = req.params;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profileId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
      }

      const surveys = await SurveyModel.getSurveysByProfileId(profileId);

      return res.status(200).json({
        success: true,
        count: surveys.length,
        data: surveys,
      });
    } catch (error) {
      console.error(
        `Error al obtener encuestas para perfil ${req.params.profileId}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener encuestas por perfil",
        error: error.message,
      });
    }
  },

  // Obtener la encuesta más reciente de un perfil
  getLatestSurveyByProfileId: async (req, res) => {
    try {
      const { profileId } = req.params;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profileId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
      }

      const survey = await SurveyModel.getLatestSurveyByProfileId(profileId);

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "No se encontraron encuestas para este perfil",
        });
      }

      return res.status(200).json({
        success: true,
        data: survey,
      });
    } catch (error) {
      console.error(
        `Error al obtener última encuesta para perfil ${req.params.profileId}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener última encuesta",
        error: error.message,
      });
    }
  },

  // Crear una nueva encuesta
  createSurvey: async (req, res) => {
    try {
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
      } = req.body;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profile_id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
      }

      // Crear la encuesta
      const newSurvey = await SurveyModel.createSurvey({
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
      });

      return res.status(201).json({
        success: true,
        message: "Encuesta creada exitosamente",
        data: newSurvey,
      });
    } catch (error) {
      console.error("Error al crear encuesta:", error);
      return res.status(500).json({
        success: false,
        message: "Error al crear encuesta",
        error: error.message,
      });
    }
  },

  // Actualizar una encuesta
  updateSurvey: async (req, res) => {
    try {
      const { id } = req.params;
      const {
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
      } = req.body;

      // Verificar si la encuesta existe
      const existingSurvey = await SurveyModel.getSurveyById(id);
      if (!existingSurvey) {
        return res.status(404).json({
          success: false,
          message: "Encuesta no encontrada",
        });
      }

      // Actualizar la encuesta
      const updatedSurvey = await SurveyModel.updateSurvey(id, {
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
      });

      return res.status(200).json({
        success: true,
        message: "Encuesta actualizada exitosamente",
        data: updatedSurvey,
      });
    } catch (error) {
      console.error(
        `Error al actualizar encuesta con ID ${req.params.id}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al actualizar encuesta",
        error: error.message,
      });
    }
  },

  // Obtener historial de encuestas
  getSurveyHistoryByProfileId: async (req, res) => {
    try {
      const { profileId } = req.params;

      // Verificar si el perfil existe
      const profile = await ProfileModel.getProfileById(profileId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
      }

      const history = await SurveyModel.getSurveyHistoryByProfileId(profileId);

      return res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error) {
      console.error(
        `Error al obtener historial de encuestas para perfil ${req.params.profileId}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener historial de encuestas",
        error: error.message,
      });
    }
  },

  // Obtener métricas de bienestar
  getWellnessMetrics: async (req, res) => {
    try {
      const metrics = await SurveyModel.getWellnessMetrics();

      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error("Error al obtener métricas de bienestar:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener métricas de bienestar",
        error: error.message,
      });
    }
  },

  // Obtener opciones para áreas de mejora
  getImprovementAreasOptions: async (req, res) => {
    try {
      const options = await SurveyModel.getImprovementAreasOptions();

      return res.status(200).json({
        success: true,
        count: options.length,
        data: options,
      });
    } catch (error) {
      console.error("Error al obtener opciones de áreas de mejora:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener opciones de áreas de mejora",
        error: error.message,
      });
    }
  },

  // Obtener opciones para actividades de bienestar
  getWellnessActivitiesOptions: async (req, res) => {
    try {
      const options = await SurveyModel.getWellnessActivitiesOptions();

      return res.status(200).json({
        success: true,
        count: options.length,
        data: options,
      });
    } catch (error) {
      console.error(
        "Error al obtener opciones de actividades de bienestar:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener opciones de actividades de bienestar",
        error: error.message,
      });
    }
  },
};

module.exports = SurveyController;
