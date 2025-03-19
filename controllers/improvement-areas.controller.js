const ImprovementAreasModel = require("../models/improvement-areas.model");
const { formatResponse, handleDatabaseError } = require("../utils/helpers");

const ImprovementAreasController = {
  /**
   * Obtener todas las opciones de áreas de mejora
   */
  getAllOptions: async (req, res) => {
    try {
      const options = await ImprovementAreasModel.getAllOptions();

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
   * Obtener una opción por ID
   */
  getOptionById: async (req, res) => {
    try {
      const { id } = req.params;
      const option = await ImprovementAreasModel.getOptionById(id);

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
   * Obtener áreas de mejora de un perfil
   */
  getProfileAreas: async (req, res) => {
    try {
      const { profileId } = req.params;
      const areas = await ImprovementAreasModel.getProfileAreas(profileId);

      return res.status(200).json(
        formatResponse(true, "Áreas de mejora obtenidas exitosamente", {
          count: areas.length,
          areas,
        })
      );
    } catch (error) {
      console.error(
        `Error al obtener áreas de mejora para perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Añadir un área de mejora a un perfil
   */
  addProfileArea: async (req, res) => {
    try {
      const { profileId } = req.params;
      const { optionId, priorityOrder } = req.body;

      if (!optionId) {
        return res
          .status(400)
          .json(formatResponse(false, "Debe proporcionar el ID de la opción"));
      }

      const result = await ImprovementAreasModel.addProfileArea(
        profileId,
        optionId,
        priorityOrder || 999
      );

      return res
        .status(201)
        .json(
          formatResponse(true, "Área de mejora añadida exitosamente", {
            result,
          })
        );
    } catch (error) {
      console.error(
        `Error al añadir área de mejora a perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Eliminar un área de mejora de un perfil
   */
  removeProfileArea: async (req, res) => {
    try {
      const { profileId, optionId } = req.params;

      const result = await ImprovementAreasModel.removeProfileArea(
        profileId,
        optionId
      );

      if (!result) {
        return res
          .status(404)
          .json(
            formatResponse(
              false,
              "Área de mejora no encontrada para este perfil"
            )
          );
      }

      return res
        .status(200)
        .json(formatResponse(true, "Área de mejora eliminada exitosamente"));
    } catch (error) {
      console.error(
        `Error al eliminar área de mejora ${req.params.optionId} de perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Actualizar la prioridad de un área de mejora
   */
  updatePriority: async (req, res) => {
    try {
      const { profileId, optionId } = req.params;
      const { priorityOrder } = req.body;

      if (priorityOrder === undefined) {
        return res
          .status(400)
          .json(
            formatResponse(false, "Debe proporcionar el orden de prioridad")
          );
      }

      const result = await ImprovementAreasModel.updatePriority(
        profileId,
        optionId,
        priorityOrder
      );

      if (!result) {
        return res
          .status(404)
          .json(
            formatResponse(
              false,
              "Área de mejora no encontrada para este perfil"
            )
          );
      }

      return res
        .status(200)
        .json(
          formatResponse(true, "Prioridad actualizada exitosamente", { result })
        );
    } catch (error) {
      console.error(
        `Error al actualizar prioridad de área ${req.params.optionId} para perfil ${req.params.profileId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },
};

module.exports = ImprovementAreasController;
