const ProfileModel = require("../models/profiles.model");

const ProfileController = {
  // Obtener todos los perfiles
  getAllProfiles: async (req, res) => {
    try {
      const profiles = await ProfileModel.getAllProfiles();
      return res.status(200).json({
        success: true,
        count: profiles.length,
        data: profiles,
      });
    } catch (error) {
      console.error("Error al obtener perfiles:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener perfiles",
        error: error.message,
      });
    }
  },

  // Obtener un perfil por ID
  getProfileById: async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await ProfileModel.getProfileById(id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
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

      return res.status(200).json({
        success: true,
        data: profileData,
      });
    } catch (error) {
      console.error(`Error al obtener perfil con ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener perfil",
        error: error.message,
      });
    }
  },

  // Obtener perfil por ID de usuario
  getProfileByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await ProfileModel.getProfileByUserId(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado para este usuario",
        });
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

      return res.status(200).json({
        success: true,
        data: profileData,
      });
    } catch (error) {
      console.error(
        `Error al obtener perfil para usuario ${req.params.userId}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener perfil por ID de usuario",
        error: error.message,
      });
    }
  },

  // Crear un nuevo perfil
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
        for (const optionId of improvement_areas) {
          await ProfileModel.addProfileImprovementArea(
            newProfile.profile_id,
            optionId
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

      return res.status(201).json({
        success: true,
        message: "Perfil creado exitosamente",
        data: {
          ...completeProfile,
          improvement_areas: improvementAreas,
          wellness_activities: wellnessActivityList,
        },
      });
    } catch (error) {
      console.error("Error al crear perfil:", error);

      // Manejo de errores de clave foránea (si el user_id no existe)
      if (error.code === "23503") {
        return res.status(400).json({
          success: false,
          message: "El usuario especificado no existe",
          error: error.message,
        });
      }

      // Manejo de errores de restricción única (si ya existe un perfil para este usuario)
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Ya existe un perfil para este usuario",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al crear perfil",
        error: error.message,
      });
    }
  },

  // Actualizar un perfil
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
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
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

        // Añadir nuevas áreas
        for (const optionId of areasToAdd) {
          await ProfileModel.addProfileImprovementArea(id, optionId);
        }

        // Eliminar áreas que ya no están seleccionadas
        for (const optionId of areasToRemove) {
          await ProfileModel.removeProfileImprovementArea(id, optionId);
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

        // Añadir nuevas actividades
        for (const optionId of activitiesToAdd) {
          await ProfileModel.addProfileWellnessActivity(id, optionId);
        }

        // Eliminar actividades que ya no están seleccionadas
        for (const optionId of activitiesToRemove) {
          await ProfileModel.removeProfileWellnessActivity(id, optionId);
        }
      }

      // Obtener el perfil actualizado con todas sus relaciones
      const completeProfile = await ProfileModel.getProfileById(id);
      const improvementAreas = await ProfileModel.getProfileImprovementAreas(
        id
      );
      const wellnessActivityList =
        await ProfileModel.getProfileWellnessActivities(id);

      return res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: {
          ...completeProfile,
          improvement_areas: improvementAreas,
          wellness_activities: wellnessActivityList,
        },
      });
    } catch (error) {
      console.error(
        `Error al actualizar perfil con ID ${req.params.id}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al actualizar perfil",
        error: error.message,
      });
    }
  },

  // Gestionar áreas de mejora
  manageProfieImprovementAreas: async (req, res) => {
    try {
      const { id } = req.params;
      const { add = [], remove = [] } = req.body;

      // Verificar si el perfil existe
      const existingProfile = await ProfileModel.getProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
      }

      // Añadir nuevas áreas
      for (const optionId of add) {
        await ProfileModel.addProfileImprovementArea(id, optionId);
      }

      // Eliminar áreas
      for (const optionId of remove) {
        await ProfileModel.removeProfileImprovementArea(id, optionId);
      }

      // Obtener las áreas actualizadas
      const updatedAreas = await ProfileModel.getProfileImprovementAreas(id);

      return res.status(200).json({
        success: true,
        message: "Áreas de mejora actualizadas exitosamente",
        data: updatedAreas,
      });
    } catch (error) {
      console.error(
        `Error al gestionar áreas de mejora para perfil ${req.params.id}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al gestionar áreas de mejora",
        error: error.message,
      });
    }
  },

  // Gestionar actividades de bienestar
  manageProfileWellnessActivities: async (req, res) => {
    try {
      const { id } = req.params;
      const { add = [], remove = [] } = req.body;

      // Verificar si el perfil existe
      const existingProfile = await ProfileModel.getProfileById(id);
      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
      }

      // Añadir nuevas actividades
      for (const optionId of add) {
        await ProfileModel.addProfileWellnessActivity(id, optionId);
      }

      // Eliminar actividades
      for (const optionId of remove) {
        await ProfileModel.removeProfileWellnessActivity(id, optionId);
      }

      // Obtener las actividades actualizadas
      const updatedActivities = await ProfileModel.getProfileWellnessActivities(
        id
      );

      return res.status(200).json({
        success: true,
        message: "Actividades de bienestar actualizadas exitosamente",
        data: updatedActivities,
      });
    } catch (error) {
      console.error(
        `Error al gestionar actividades de bienestar para perfil ${req.params.id}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al gestionar actividades de bienestar",
        error: error.message,
      });
    }
  },
};

module.exports = ProfileController;
