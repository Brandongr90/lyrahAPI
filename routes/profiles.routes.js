const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profiles.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const { profileValidation, validateRequest, validateUUID } = require("../utils/validation");

// Todas las rutas de perfiles requieren autenticación
router.use(protect);

// Rutas principales
router.get("/", authorize('admin'), ProfileController.getAllProfiles);
router.get("/:id", validateUUID, ProfileController.getProfileById);
router.get("/user/:userId", validateUUID, ProfileController.getProfileByUserId);
router.post("/", profileValidation, validateRequest, ProfileController.createProfile);
router.put("/:id", validateUUID, profileValidation, validateRequest, ProfileController.updateProfile);

// Rutas para áreas de mejora y actividades de bienestar
router.patch("/:id/improvement-areas", validateUUID, ProfileController.manageProfileImprovementAreas);
router.patch("/:id/wellness-activities", validateUUID, ProfileController.manageProfileWellnessActivities);

// Ruta para obtener perfil de bienestar completo
router.get("/:id/wellness", validateUUID, ProfileController.getWellnessProfile);

module.exports = router;