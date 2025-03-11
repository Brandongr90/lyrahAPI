const UserModel = require("../models/users.model");

const UserController = {
  // Obtener todos los usuarios
  getAllUsers: async (req, res) => {
    try {
      const users = await UserModel.getAllUsers();
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener usuarios",
        error: error.message,
      });
    }
  },

  // Obtener un usuario por ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await UserModel.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error(
        `Error al obtener el usuario con ID ${req.params.id}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener el usuario",
        error: error.message,
      });
    }
  },

  // Crear un nuevo usuario
  createUser: async (req, res) => {
    try {
      // En un sistema real, aquí verificarías los datos y hashearías la contraseña
      // antes de guardarla en la base de datos
      const { username, email, password, role_id } = req.body;

      // Ejemplo simple (en producción, deberías usar bcrypt para hashear la contraseña)
      const password_hash = password; // Esto es solo para ejemplo

      const newUser = await UserModel.createUser({
        username,
        email,
        password_hash,
        role_id: role_id || 2, // Por defecto, asignar rol de usuario normal (2)
      });

      return res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente",
        data: newUser,
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);

      // Manejo específico para errores de duplicación (email o username ya existentes)
      if (error.code === "23505") {
        // Código PostgreSQL para violación de restricción única
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario con ese email o nombre de usuario",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al crear usuario",
        error: error.message,
      });
    }
  },

  // Actualizar un usuario
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, is_active, role_id } = req.body;

      // Verificar si el usuario existe
      const existingUser = await UserModel.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Actualizar usuario
      const updatedUser = await UserModel.updateUser(id, {
        username,
        email,
        is_active,
        role_id,
      });

      return res.status(200).json({
        success: true,
        message: "Usuario actualizado exitosamente",
        data: updatedUser,
      });
    } catch (error) {
      console.error(
        `Error al actualizar usuario con ID ${req.params.id}:`,
        error
      );

      // Manejo de errores de duplicación
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario con ese email o nombre de usuario",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al actualizar usuario",
        error: error.message,
      });
    }
  },

  // Eliminar un usuario (desactivar)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si el usuario existe
      const existingUser = await UserModel.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Desactivar usuario (en lugar de eliminarlo completamente)
      await UserModel.deleteUser(id);

      return res.status(200).json({
        success: true,
        message: "Usuario desactivado exitosamente",
      });
    } catch (error) {
      console.error(
        `Error al eliminar usuario con ID ${req.params.id}:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error al eliminar usuario",
        error: error.message,
      });
    }
  },
};

module.exports = UserController;
