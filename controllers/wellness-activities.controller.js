const WellnessActivitiesModel = require("../models/wellness-activities.model");
const { formatResponse, handleDatabaseError } = require("../utils/helpers");

const WellnessActivitiesController = {
  /**
   * Obtener todas las opciones de actividades de bienestar
   */
  getAllOptions: async (req, res) => {
    try {
      const options = await WellnessActivitiesModel.getAllOptions();

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
   * Obtener una opción por ID
   */
  getOptionById: async (req, res) => {
    try {
      const { id } = req.params;
      const option = await WellnessActivitiesModel.getOptionById(id);

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
   * Obtener actividades de bienestar de un perfil
   */
  getProfileActivities: async (req, res) => {
    try {
      const { profileId } = req.params;
      const activities = await WellnessActivitiesModel.getProfileActivities(
        profileId
      );

      return res.status(200).json(
        formatResponse(
          true,
          "Actividades de bienestar obtenidas exitosamente",
          {
            count: activities.length,
            activities,
          }
        )
      );
    } catch (error) {
      console.error(
        `Error al obtener actividades de bienestar para perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Añadir una actividad de bienestar a un perfil
   */
  addProfileActivity: async (req, res) => {
    try {
      const { profileId } = req.params;
      const { optionId } = req.body;

      if (!optionId) {
        return res
          .status(400)
          .json(formatResponse(false, "Debe proporcionar el ID de la opción"));
      }

      const result = await WellnessActivitiesModel.addProfileActivity(
        profileId,
        optionId
      );

      return res
        .status(201)
        .json(
          formatResponse(true, "Actividad de bienestar añadida exitosamente", {
            result,
          })
        );
    } catch (error) {
      console.error(
        `Error al añadir actividad de bienestar a perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Eliminar una actividad de bienestar de un perfil
   */
  removeProfileActivity: async (req, res) => {
    try {
      const { profileId, optionId } = req.params;

      const result = await WellnessActivitiesModel.removeProfileActivity(
        profileId,
        optionId
      );

      if (!result) {
        return res
          .status(404)
          .json(
            formatResponse(
              false,
              "Actividad de bienestar no encontrada para este perfil"
            )
          );
      }

      return res
        .status(200)
        .json(
          formatResponse(true, "Actividad de bienestar eliminada exitosamente")
        );
    } catch (error) {
      console.error(
        `Error al eliminar actividad ${req.params.optionId} de perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Establecer múltiples actividades para un perfil
   */
  setProfileActivities: async (req, res) => {
    try {
      const { profileId } = req.params;
      const { optionIds } = req.body;

      if (!optionIds || !Array.isArray(optionIds)) {
        return res
          .status(400)
          .json(
            formatResponse(
              false,
              "Debe proporcionar un array de IDs de opciones"
            )
          );
      }

      const results = await WellnessActivitiesModel.setProfileActivities(
        profileId,
        optionIds
      );

      return res.status(200).json(
        formatResponse(
          true,
          "Actividades de bienestar actualizadas exitosamente",
          {
            count: results.length,
            activities: results,
          }
        )
      );
    } catch (error) {
      console.error(
        `Error al establecer actividades para perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },
};

module.exports = WellnessActivitiesController;
