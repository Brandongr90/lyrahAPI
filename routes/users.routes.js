const express = require("express");
const router = express.Router();
const UserController = require("../controllers/users.controller");

// GET /api/users - Obtener todos los usuarios
router.get("/", UserController.getAllUsers);

// GET /api/users/:id - Obtener un usuario por ID
router.get("/:id", UserController.getUserById);

// POST /api/users - Crear un nuevo usuario
router.post("/", UserController.createUser);

// PUT /api/users/:id - Actualizar un usuario
router.put("/:id", UserController.updateUser);

// DELETE /api/users/:id - Eliminar (desactivar) un usuario
router.delete("/:id", UserController.deleteUser);

module.exports = router;
