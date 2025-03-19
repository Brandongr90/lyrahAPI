const express = require('express');
const router = express.Router();
const SurveyController = require('../controllers/surveys.controller');
const { protect, authorize } = require("../middlewares/auth.middleware");
const { surveyValidation, validateRequest, validateUUID } = require("../utils/validation");

// Todas las rutas de encuestas requieren autenticación
router.use(protect);

// Rutas principales
router.get('/', authorize('admin'), SurveyController.getAllSurveys);
router.get('/:id', validateUUID, SurveyController.getSurveyById);
router.post('/', surveyValidation, validateRequest, SurveyController.createSurvey);
router.put('/:id', validateUUID, SurveyController.updateSurvey);

// Rutas para encuestas por perfil
router.get('/profile/:profileId', validateUUID, SurveyController.getSurveysByProfileId);
router.get('/profile/:profileId/latest', validateUUID, SurveyController.getLatestSurveyByProfileId);
router.get('/profile/:profileId/history', validateUUID, SurveyController.getSurveyHistoryByProfileId);
router.get('/profile/:profileId/progress', validateUUID, SurveyController.getWellnessProgress);

// Rutas para cuestionario
router.get('/questions/all', SurveyController.getAllQuestions);

// Rutas para opciones
router.get('/options/improvement-areas', SurveyController.getImprovementAreasOptions);
router.get('/options/wellness-activities', SurveyController.getWellnessActivitiesOptions);

// Rutas para métricas y estadísticas
router.get('/metrics/wellness', authorize('admin'), SurveyController.getWellnessMetrics);
router.get('/statistics/summary', authorize('admin'), SurveyController.getSurveyStatistics);

module.exports = router;