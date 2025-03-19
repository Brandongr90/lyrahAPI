const express = require("express");
const router = express.Router();
const UserController = require("../controllers/users.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const { 
  registerValidation, 
  loginValidation,
  validateRequest,
  validateUUID
} = require("../utils/validation");

// Rutas públicas
router.post("/register", registerValidation, validateRequest, UserController.register);
router.post("/login", loginValidation, validateRequest, UserController.login);

// Ruta para obtener información del usuario autenticado
router.get("/me", protect, UserController.getMe);

// Rutas protegidas (requieren autenticación)
router.get("/", protect, authorize('admin'), UserController.getAllUsers);
router.get("/roles", protect, UserController.getRoles);
router.get("/:id", protect, validateUUID, UserController.getUserById);
router.put("/:id", protect, validateUUID, UserController.updateUser);
router.delete("/:id", protect, validateUUID, UserController.deleteUser);
router.post("/:id/change-password", protect, validateUUID, UserController.changePassword);

// Rutas para historial y actividad
router.get("/:id/login-history", protect, validateUUID, UserController.getLoginHistory);
router.get("/:id/activity", protect, validateUUID, UserController.getUserActivity);

module.exports = router;