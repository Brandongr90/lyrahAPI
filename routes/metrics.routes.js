const express = require('express');
const router = express.Router();
const MetricsController = require('../controllers/metrics.controller');
const { protect, authorize } = require("../middlewares/auth.middleware");
const { validateUUID } = require("../utils/validation");

// Todas las rutas de métricas requieren autenticación
router.use(protect);

// Rutas para métricas generales (solo admin)
router.get('/wellness', authorize('admin'), MetricsController.getWellnessMetrics);
router.get('/users', authorize('admin'), MetricsController.getUserMetrics);

// Rutas para encuestas
router.get('/surveys/history/:profileId', validateUUID, MetricsController.getSurveyHistory);
router.get('/surveys/progress/:profileId', validateUUID, MetricsController.getWellnessProgress);
router.get('/surveys/statistics', authorize('admin'), MetricsController.getSurveyStatistics);

// Rutas para usuarios
router.get('/users/:userId/login-history', validateUUID, MetricsController.getLoginHistory);
router.get('/users/:userId/activity', validateUUID, MetricsController.getUserActivity);
router.post('/users/:userId/activity', validateUUID, authorize('admin'), MetricsController.logUserActivity);

// Ruta para perfil de bienestar completo
router.get('/wellness-profile/:profileId', validateUUID, MetricsController.getWellnessProfile);

module.exports = router;