const express = require('express');
const router = express.Router();
const SurveyController = require('../controllers/surveys.controller');

// GET /api/surveys - Obtener todas las encuestas
router.get('/', SurveyController.getAllSurveys);

// GET /api/surveys/:id - Obtener una encuesta por ID
router.get('/:id', SurveyController.getSurveyById);

// GET /api/surveys/profile/:profileId - Obtener encuestas por perfil
router.get('/profile/:profileId', SurveyController.getSurveysByProfileId);

// GET /api/surveys/profile/:profileId/latest - Obtener la encuesta más reciente de un perfil
router.get('/profile/:profileId/latest', SurveyController.getLatestSurveyByProfileId);

// POST /api/surveys - Crear una nueva encuesta
router.post('/', SurveyController.createSurvey);

// PUT /api/surveys/:id - Actualizar una encuesta
router.put('/:id', SurveyController.updateSurvey);

// GET /api/surveys/profile/:profileId/history - Obtener historial de encuestas
router.get('/profile/:profileId/history', SurveyController.getSurveyHistoryByProfileId);

// GET /api/surveys/metrics - Obtener métricas de bienestar
router.get('/metrics/wellness', SurveyController.getWellnessMetrics);

// GET /api/surveys/options/improvement-areas - Obtener opciones para áreas de mejora
router.get('/options/improvement-areas', SurveyController.getImprovementAreasOptions);

// GET /api/surveys/options/wellness-activities - Obtener opciones para actividades de bienestar
router.get('/options/wellness-activities', SurveyController.getWellnessActivitiesOptions);

module.exports = router;