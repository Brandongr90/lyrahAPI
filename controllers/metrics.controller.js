const MetricsModel = require("../models/metrics.model");
const { formatResponse, handleDatabaseError } = require("../utils/helpers");

const MetricsController = {
  /**
   * Obtener métricas generales de bienestar
   */
  getWellnessMetrics: async (req, res) => {
    try {
      // Solo admin puede ver las métricas
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

      const metrics = await MetricsModel.getWellnessMetrics();

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
   * Obtener métricas de usuarios
   */
  getUserMetrics: async (req, res) => {
    try {
      // Solo admin puede ver las métricas de usuarios
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver las métricas de usuarios"
            )
          );
      }

      const metrics = await MetricsModel.getUserMetrics();

      return res
        .status(200)
        .json(
          formatResponse(true, "Métricas de usuarios obtenidas exitosamente", {
            metrics,
          })
        );
    } catch (error) {
      console.error("Error al obtener métricas de usuarios:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener historial de encuestas para un perfil
   */
  getSurveyHistory: async (req, res) => {
    try {
      const { profileId } = req.params;
      const history = await MetricsModel.getSurveyHistory(profileId);

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
   * Obtener progreso de bienestar para un perfil
   */
  getWellnessProgress: async (req, res) => {
    try {
      const { profileId } = req.params;
      const progress = await MetricsModel.getWellnessProgress(profileId);

      return res.status(200).json(
        formatResponse(true, "Progreso de bienestar obtenido exitosamente", {
          count: progress.length,
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

  /**
   * Obtener historial de login para un usuario
   */
  getLoginHistory: async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;

      // Verificar permisos (solo el propio usuario o un admin pueden ver el historial)
      if (req.user.userId !== userId && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver el historial de este usuario"
            )
          );
      }

      const history = await MetricsModel.getLoginHistory(
        userId,
        parseInt(limit)
      );

      return res.status(200).json(
        formatResponse(true, "Historial de login obtenido exitosamente", {
          count: history.length,
          history,
        })
      );
    } catch (error) {
      console.error(
        `Error al obtener historial de login para usuario ${req.params.userId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener actividad de un usuario
   */
  getUserActivity: async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;

      // Verificar permisos (solo el propio usuario o un admin pueden ver la actividad)
      if (req.user.userId !== userId && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver la actividad de este usuario"
            )
          );
      }

      const activities = await MetricsModel.getUserActivity(
        userId,
        parseInt(limit)
      );

      return res.status(200).json(
        formatResponse(true, "Actividad del usuario obtenida exitosamente", {
          count: activities.length,
          activities,
        })
      );
    } catch (error) {
      console.error(
        `Error al obtener actividad para usuario ${req.params.userId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Registrar actividad de usuario
   */
  logUserActivity: async (req, res) => {
    try {
      const { userId } = req.params;
      const { activity_type, activity_details } = req.body;

      // Verificar permisos (solo admin puede registrar actividad manualmente)
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para registrar actividad manualmente"
            )
          );
      }

      const result = await MetricsModel.logUserActivity({
        user_id: userId,
        activity_type,
        activity_details,
        ip_address: req.ip,
      });

      return res
        .status(201)
        .json(
          formatResponse(true, "Actividad registrada exitosamente", { result })
        );
    } catch (error) {
      console.error(
        `Error al registrar actividad para usuario ${req.params.userId}:`,
        error
      );
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
   * Obtener perfil de bienestar completo
   */
  getWellnessProfile: async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await MetricsModel.getWellnessProfile(profileId);

      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil de bienestar no encontrado"));
      }

      return res
        .status(200)
        .json(
          formatResponse(true, "Perfil de bienestar obtenido exitosamente", {
            profile,
          })
        );
    } catch (error) {
      console.error(
        `Error al obtener perfil de bienestar para ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },
};

module.exports = MetricsController;
