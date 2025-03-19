const express = require('express');
const router = express.Router();
const ImprovementAreasController = require('../controllers/improvement-areas.controller');
const { protect } = require("../middlewares/auth.middleware");
const { validateUUID } = require("../utils/validation");

// Todas las rutas de áreas de mejora requieren autenticación
router.use(protect);

// Rutas para opciones
router.get('/options', ImprovementAreasController.getAllOptions);
router.get('/options/:id', ImprovementAreasController.getOptionById);

// Rutas para perfiles
router.get('/profile/:profileId', validateUUID, ImprovementAreasController.getProfileAreas);
router.post('/profile/:profileId', validateUUID, ImprovementAreasController.addProfileArea);
router.delete('/profile/:profileId/:optionId', validateUUID, ImprovementAreasController.removeProfileArea);
router.put('/profile/:profileId/:optionId/priority', validateUUID, ImprovementAreasController.updatePriority);

module.exports = router;