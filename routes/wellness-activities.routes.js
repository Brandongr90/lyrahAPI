const express = require('express');
const router = express.Router();
const WellnessActivitiesController = require('../controllers/wellness-activities.controller');
const { protect } = require("../middlewares/auth.middleware");
const { validateUUID } = require("../utils/validation");

// Todas las rutas de actividades de bienestar requieren autenticación
router.use(protect);

// Rutas para opciones
router.get('/options', WellnessActivitiesController.getAllOptions);
router.get('/options/:id', WellnessActivitiesController.getOptionById);

// Rutas para perfiles
router.get('/profile/:profileId', validateUUID, WellnessActivitiesController.getProfileActivities);
router.post('/profile/:profileId', validateUUID, WellnessActivitiesController.addProfileActivity);
router.delete('/profile/:profileId/:optionId', validateUUID, WellnessActivitiesController.removeProfileActivity);
router.put('/profile/:profileId', validateUUID, WellnessActivitiesController.setProfileActivities);

module.exports = router;