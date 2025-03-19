const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/questions.controller');
const { protect } = require("../middlewares/auth.middleware");

// Todas las rutas de preguntas requieren autenticación
router.use(protect);

// Rutas principales
router.get('/', QuestionController.getAllQuestions);
router.get('/:id', QuestionController.getQuestionById);
router.get('/section/:sectionNumber', QuestionController.getQuestionsBySection);
router.get('/:id/options', QuestionController.getQuestionOptions);
router.get('/options/:id', QuestionController.getOptionById);
router.get('/all/with-options', QuestionController.getQuestionsWithOptions);
router.get('/questionnaire/by-section', QuestionController.getQuestionnaireBySection);

module.exports = router;