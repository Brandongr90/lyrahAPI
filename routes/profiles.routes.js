const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profiles.controller");

// GET /api/profiles - Obtener todos los perfiles
router.get("/", ProfileController.getAllProfiles);

// GET /api/profiles/:id - Obtener un perfil por ID
router.get("/:id", ProfileController.getProfileById);

// GET /api/profiles/user/:userId - Obtener perfil por ID de usuario
router.get("/user/:userId", ProfileController.getProfileByUserId);

// POST /api/profiles - Crear un nuevo perfil
router.post("/", ProfileController.createProfile);

// PUT /api/profiles/:id - Actualizar un perfil
router.put("/:id", ProfileController.updateProfile);

// PATCH /api/profiles/:id/improvement-areas - Gestionar áreas de mejora
router.patch(
  "/:id/improvement-areas",
  ProfileController.manageProfieImprovementAreas
);

// PATCH /api/profiles/:id/wellness-activities - Gestionar actividades de bienestar
router.patch(
  "/:id/wellness-activities",
  ProfileController.manageProfileWellnessActivities
);

module.exports = router;
