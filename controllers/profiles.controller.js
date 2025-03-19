const ProfileModel = require("../models/profiles.model");
const MetricsModel = require("../models/metrics.model");
const { formatResponse, handleDatabaseError } = require("../utils/helpers");

const ProfileController = {
  /**
   * Obtener todos los perfiles
   */
  getAllProfiles: async (req, res) => {
    try {
      const profiles = await ProfileModel.getAllProfiles();

      return res.status(200).json(
        formatResponse(true, "Perfiles obtenidos exitosamente", {
          count: profiles.length,
          profiles,
        })
      );
    } catch (error) {
      console.error("Error al obtener perfiles:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener un perfil por ID
   */
  getProfileById: async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await ProfileModel.getProfileById(id);

      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Obtener áreas de mejora y actividades de bienestar
      const improvementAreas = await ProfileModel.getProfileImprovementAreas(
        id
      );
      const wellnessActivities =
        await ProfileModel.getProfileWellnessActivities(id);

      // Combinar todos los datos
      const profileData = {
        ...profile,
        improvement_areas: improvementAreas,
        wellness_activities: wellnessActivities,
      };

      return res
        .status(200)
        .json(
          formatResponse(true, "Perfil obtenido exitosamente", {
            profile: profileData,
          })
        );
    } catch (error) {
      console.error(`Error al obtener perfil con ID ${req.params.id}:`, error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener perfil por ID de usuario
   */
  getProfileByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await ProfileModel.getProfileByUserId(userId);

      if (!profile) {
        return res
          .status(404)
          .json(
            formatResponse(false, "Perfil no encontrado para este usuario")
          );
      }

      // Obtener áreas de mejora y actividades de bienestar
      const improvementAreas = await ProfileModel.getProfileImprovementAreas(
        profile.profile_id
      );
      const wellnessActivities =
        await ProfileModel.getProfileWellnessActivities(profile.profile_id);

      // Combinar todos los datos
      const profileData = {
        ...profile,
        improvement_areas: improvementAreas,
        wellness_activities: wellnessActivities,
      };

      return res
        .status(200)
        .json(
          formatResponse(true, "Perfil obtenido exitosamente", {
            profile: profileData,
          })
        );
    } catch (error) {
      console.error(
        `Error al obtener perfil para usuario ${req.params.userId}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Crear un nuevo perfil
   */
  createProfile: async (req, res) => {
    try {
      const {
        user_id,
        first_name,
        last_name,
        birthdate,
        gender,
        profile_picture_url,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
        improvement_areas,
        wellness_activities,
      } = req.body;

      // Verificar permisos (solo el propio usuario o un admin pueden crear su perfil)
      if (req.user.userId !== user_id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(false, "No tienes permisos para crear este perfil")
          );
      }

      // Crear el perfil básico
      const newProfile = await ProfileModel.createProfile({
        user_id,
        first_name,
        last_name,
        birthdate,
        gender,
        profile_picture_url,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
      });

      // Añadir áreas de mejora si se proporcionaron
      if (improvement_areas && Array.isArray(improvement_areas)) {
        for (let i = 0; i < improvement_areas.length; i++) {
          const optionId = improvement_areas[i];
          // Usar el índice como orden de prioridad (empezando desde 1)
          await ProfileModel.addProfileImprovementArea(
            newProfile.profile_id,
            optionId,
            i + 1
          );
        }
      }

      // Añadir actividades de bienestar si se proporcionaron
      if (wellness_activities && Array.isArray(wellness_activities)) {
        for (const optionId of wellness_activities) {
          await ProfileModel.addProfileWellnessActivity(
            newProfile.profile_id,
            optionId
          );
        }
      }

      // Obtener el perfil completo con relaciones
      const completeProfile = await ProfileModel.getProfileById(
        newProfile.profile_id
      );
      const improvementAreas = await ProfileModel.getProfileImprovementAreas(
        newProfile.profile_id
      );
      const wellnessActivityList =
        await ProfileModel.getProfileWellnessActivities(newProfile.profile_id);

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "creación_perfil",
        activity_details: { profile_id: newProfile.profile_id },
        ip_address: req.ip,
      });

      return res.status(201).json(
        formatResponse(true, "Perfil creado exitosamente", {
          profile: {
            ...completeProfile,
            improvement_areas: improvementAreas,
            wellness_activities: wellnessActivityList,
          },
        })
      );
    } catch (error) {
      console.error("Error al crear perfil:", error);

      // Manejo de errores de clave foránea (si el user_id no existe)
      if (error.code === "23503") {
        return res
          .status(400)
          .json(formatResponse(false, "El usuario especificado no existe"));
      }

      // Manejo de errores de restricción única (si ya existe un perfil para este usuario)
      if (error.code === "23505") {
        return res
          .status(409)
          .json(formatResponse(false, "Ya existe un perfil para este usuario"));
      }

      return handleDatabaseError(error, res);
    }
  },

  /**
   * Actualizar un perfil
   */
  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        birthdate,
        gender,
        profile_picture_url,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
        improvement_areas,
        wellness_activities,
      } = req.body;

      // Verificar si el perfil existe
      const existingProfile = await ProfileModel.getProfileById(id);
      if (!existingProfile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos (solo el propio usuario o un admin pueden actualizar el perfil)
      if (
        req.user.userId !== existingProfile.user_id &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para actualizar este perfil"
            )
          );
      }

      // Actualizar perfil básico
      const updatedProfile = await ProfileModel.updateProfile(id, {
        first_name,
        last_name,
        birthdate,
        gender,
        profile_picture_url,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
      });

      // Actualizar áreas de mejora si se proporcionaron
      if (improvement_areas && Array.isArray(improvement_areas)) {
        // Primero obtener las áreas actuales
        const currentAreas = await ProfileModel.getProfileImprovementAreas(id);
        const currentAreaIds = currentAreas.map((area) => area.option_id);

        // Identificar áreas para añadir y eliminar
        const areasToAdd = improvement_areas.filter(
          (optionId) => !currentAreaIds.includes(optionId)
        );
        const areasToRemove = currentAreaIds.filter(
          (optionId) => !improvement_areas.includes(optionId)
        );

        // Eliminar áreas que ya no están seleccionadas
        for (const optionId of areasToRemove) {
          await ProfileModel.removeProfileImprovementArea(id, optionId);
        }

        // Añadir nuevas áreas con prioridad basada en el índice
        for (let i = 0; i < improvement_areas.length; i++) {
          const optionId = improvement_areas[i];
          await ProfileModel.addProfileImprovementArea(id, optionId, i + 1);
        }
      }

      // Actualizar actividades de bienestar si se proporcionaron
      if (wellness_activities && Array.isArray(wellness_activities)) {
        // Primero obtener las actividades actuales
        const currentActivities =
          await ProfileModel.getProfileWellnessActivities(id);
        const currentActivityIds = currentActivities.map(
          (activity) => activity.option_id
        );

        // Identificar actividades para añadir y eliminar
        const activitiesToAdd = wellness_activities.filter(
          (optionId) => !currentActivityIds.includes(optionId)
        );
        const activitiesToRemove = currentActivityIds.filter(
          (optionId) => !wellness_activities.includes(optionId)
        );

        // Eliminar actividades que ya no están seleccionadas
        for (const optionId of activitiesToRemove) {
          await ProfileModel.removeProfileWellnessActivity(id, optionId);
        }

        // Añadir nuevas actividades
        for (const optionId of activitiesToAdd) {
          await ProfileModel.addProfileWellnessActivity(id, optionId);
        }
      }

      // Obtener el perfil actualizado con todas sus relaciones
      const completeProfile = await ProfileModel.getProfileById(id);
      const improvementAreas = await ProfileModel.getProfileImprovementAreas(
        id
      );
      const wellnessActivityList =
        await ProfileModel.getProfileWellnessActivities(id);

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "actualización_perfil",
        activity_details: {
          profile_id: id,
          fields_updated: Object.keys(req.body).filter(
            (key) => req.body[key] !== undefined
          ),
        },
        ip_address: req.ip,
      });

      return res.status(200).json(
        formatResponse(true, "Perfil actualizado exitosamente", {
          profile: {
            ...completeProfile,
            improvement_areas: improvementAreas,
            wellness_activities: wellnessActivityList,
          },
        })
      );
    } catch (error) {
      console.error(
        `Error al actualizar perfil con ID ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Gestionar áreas de mejora
   */
  manageProfileImprovementAreas: async (req, res) => {
    try {
      const { id } = req.params;
      const { add = [], remove = [], priorities = {} } = req.body;

      // Verificar si el perfil existe
      const existingProfile = await ProfileModel.getProfileById(id);
      if (!existingProfile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos
      if (
        req.user.userId !== existingProfile.user_id &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para gestionar este perfil"
            )
          );
      }

      // Eliminar áreas
      for (const optionId of remove) {
        await ProfileModel.removeProfileImprovementArea(id, optionId);
      }

      // Añadir nuevas áreas
      for (const optionId of add) {
        const priority = priorities[optionId] || 999; // Prioridad por defecto alta si no se especifica
        await ProfileModel.addProfileImprovementArea(id, optionId, priority);
      }

      // Actualizar prioridades existentes
      for (const [optionId, priority] of Object.entries(priorities)) {
        if (!add.includes(parseInt(optionId))) {
          // Solo actualizar si no está en la lista de añadir (ya que esos ya los añadimos con la prioridad correcta)
          await ProfileModel.updatePriority(id, optionId, priority);
        }
      }

      // Obtener las áreas actualizadas
      const updatedAreas = await ProfileModel.getProfileImprovementAreas(id);

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "actualización_areas_mejora",
        activity_details: {
          profile_id: id,
          added: add,
          removed: remove,
          updated_priorities: Object.keys(priorities),
        },
        ip_address: req.ip,
      });

      return res
        .status(200)
        .json(
          formatResponse(true, "Áreas de mejora actualizadas exitosamente", {
            improvement_areas: updatedAreas,
          })
        );
    } catch (error) {
      console.error(
        `Error al gestionar áreas de mejora para perfil ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Gestionar actividades de bienestar
   */
  manageProfileWellnessActivities: async (req, res) => {
    try {
      const { id } = req.params;
      const { add = [], remove = [] } = req.body;

      // Verificar si el perfil existe
      const existingProfile = await ProfileModel.getProfileById(id);
      if (!existingProfile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos
      if (
        req.user.userId !== existingProfile.user_id &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para gestionar este perfil"
            )
          );
      }

      // Eliminar actividades
      for (const optionId of remove) {
        await ProfileModel.removeProfileWellnessActivity(id, optionId);
      }

      // Añadir nuevas actividades
      for (const optionId of add) {
        await ProfileModel.addProfileWellnessActivity(id, optionId);
      }

      // Obtener las actividades actualizadas
      const updatedActivities = await ProfileModel.getProfileWellnessActivities(
        id
      );

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "actualización_actividades_bienestar",
        activity_details: {
          profile_id: id,
          added: add,
          removed: remove,
        },
        ip_address: req.ip,
      });

      return res
        .status(200)
        .json(
          formatResponse(
            true,
            "Actividades de bienestar actualizadas exitosamente",
            { wellness_activities: updatedActivities }
          )
        );
    } catch (error) {
      console.error(
        `Error al gestionar actividades de bienestar para perfil ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener perfil de bienestar completo
   */
  getWellnessProfile: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si el perfil existe
      const existingProfile = await ProfileModel.getProfileById(id);
      if (!existingProfile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil no encontrado"));
      }

      // Verificar permisos
      if (
        req.user.userId !== existingProfile.user_id &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json(
            formatResponse(false, "No tienes permisos para ver este perfil")
          );
      }

      // Obtener el perfil de bienestar completo
      const wellnessProfile = await MetricsModel.getWellnessProfile(id);

      if (!wellnessProfile) {
        return res
          .status(404)
          .json(formatResponse(false, "Perfil de bienestar no encontrado"));
      }

      return res
        .status(200)
        .json(
          formatResponse(true, "Perfil de bienestar obtenido exitosamente", {
            profile: wellnessProfile,
          })
        );
    } catch (error) {
      console.error(
        `Error al obtener perfil de bienestar ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },
};

module.exports = ProfileController;
