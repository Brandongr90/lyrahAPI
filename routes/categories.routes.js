const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categories.controller');
const { protect } = require("../middlewares/auth.middleware");

// Todas las rutas de categorías requieren autenticación
router.use(protect);

// Rutas principales
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);
router.get('/:id/questions', CategoryController.getCategoryQuestions);
router.get('/all/with-questions', CategoryController.getCategoriesWithQuestions);
router.get('/mapping/questions', CategoryController.getQuestionCategoryMapping);

module.exports = router;