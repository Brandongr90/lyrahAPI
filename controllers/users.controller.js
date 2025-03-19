const UserModel = require("../models/users.model");
const MetricsModel = require("../models/metrics.model");
const {
  generateToken,
  hashPassword,
  comparePassword,
  formatResponse,
  handleDatabaseError,
} = require("../utils/helpers");

const UserController = {
  /**
   * Obtener todos los usuarios
   */
  getAllUsers: async (req, res) => {
    try {
      const users = await UserModel.getAllUsers();

      return res.status(200).json(
        formatResponse(true, "Usuarios obtenidos exitosamente", {
          count: users.length,
          users,
        })
      );
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener un usuario por ID
   */
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await UserModel.getUserById(id);

      if (!user) {
        return res
          .status(404)
          .json(formatResponse(false, "Usuario no encontrado"));
      }

      return res
        .status(200)
        .json(formatResponse(true, "Usuario obtenido exitosamente", { user }));
    } catch (error) {
      console.error(
        `Error al obtener el usuario con ID ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Registrar un nuevo usuario
   */
  register: async (req, res) => {
    try {
      const { username, email, password, role_id } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await UserModel.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json(formatResponse(false, "Ya existe un usuario con ese email"));
      }

      // Verificar si el nombre de usuario ya existe
      const existingUsername = await UserModel.getUserByUsername(username);
      if (existingUsername) {
        return res
          .status(409)
          .json(
            formatResponse(
              false,
              "Ya existe un usuario con ese nombre de usuario"
            )
          );
      }

      // Encriptar la contraseña
      const password_hash = await hashPassword(password);

      // Crear el usuario
      const newUser = await UserModel.createUser({
        username,
        email,
        password_hash,
        role_id: role_id || 2, // Por defecto, asignar rol de usuario normal (2)
      });

      // Generar token JWT
      const token = generateToken(newUser.user_id);

      // Registrar la actividad
      if (req.ip) {
        await MetricsModel.logUserActivity({
          user_id: newUser.user_id,
          activity_type: "registro",
          activity_details: { username, email },
          ip_address: req.ip,
        });
      }

      return res.status(201).json(
        formatResponse(true, "Usuario registrado exitosamente", {
          user: {
            user_id: newUser.user_id,
            username: newUser.username,
            email: newUser.email,
            role_id: newUser.role_id,
            is_active: newUser.is_active,
            is_verified: newUser.is_verified,
          },
          token,
        })
      );
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Iniciar sesión
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Buscar el usuario por email
      const user = await UserModel.getUserByEmail(email);
      if (!user) {
        // Registrar intento de login fallido
        await UserModel.logLogin(
          null,
          req.ip,
          req.headers["user-agent"],
          false
        );

        return res
          .status(401)
          .json(formatResponse(false, "Credenciales inválidas"));
      }

      // Verificar si el usuario está activo
      if (!user.is_active) {
        await UserModel.logLogin(
          user.user_id,
          req.ip,
          req.headers["user-agent"],
          false
        );

        return res
          .status(401)
          .json(formatResponse(false, "Cuenta inactiva. Contacte al soporte."));
      }

      // Verificar la contraseña
      const isPasswordValid = await comparePassword(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        await UserModel.logLogin(
          user.user_id,
          req.ip,
          req.headers["user-agent"],
          false
        );

        return res
          .status(401)
          .json(formatResponse(false, "Credenciales inválidas"));
      }

      // Actualizar último login
      await UserModel.updateLastLogin(user.user_id);

      // Registrar login exitoso
      await UserModel.logLogin(
        user.user_id,
        req.ip,
        req.headers["user-agent"],
        true
      );

      // Generar token JWT
      const token = generateToken(user.user_id);

      return res.status(200).json(
        formatResponse(true, "Inicio de sesión exitoso", {
          user: {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role_name: user.role_name,
            is_verified: user.is_verified,
          },
          token,
        })
      );
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Actualizar un usuario
   */
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, is_active, role_id } = req.body;

      // Verificar si el usuario existe
      const existingUser = await UserModel.getUserById(id);
      if (!existingUser) {
        return res
          .status(404)
          .json(formatResponse(false, "Usuario no encontrado"));
      }

      // Verificar si el usuario tiene permisos para actualizar
      if (req.user.userId !== id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para actualizar este usuario"
            )
          );
      }

      // Actualizar usuario
      const updatedUser = await UserModel.updateUser(id, {
        username,
        email,
        is_active,
        role_id,
      });

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "actualización_usuario",
        activity_details: {
          target_user: id,
          fields_updated: Object.keys({
            username,
            email,
            is_active,
            role_id,
          }).filter((key) => req.body[key] !== undefined),
        },
        ip_address: req.ip,
      });

      return res
        .status(200)
        .json(
          formatResponse(true, "Usuario actualizado exitosamente", {
            user: updatedUser,
          })
        );
    } catch (error) {
      console.error(
        `Error al actualizar usuario con ID ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Verificar si el usuario existe y obtener su password_hash
      const user = await UserModel.getUserByEmail(req.user.email);
      if (!user) {
        return res
          .status(404)
          .json(formatResponse(false, "Usuario no encontrado"));
      }

      // Verificar si el usuario tiene permisos para cambiar contraseña
      if (req.user.userId !== id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para cambiar la contraseña de este usuario"
            )
          );
      }

      // Verificar la contraseña actual (a menos que sea admin)
      if (req.user.role !== "admin") {
        const isPasswordValid = await comparePassword(
          currentPassword,
          user.password_hash
        );
        if (!isPasswordValid) {
          return res
            .status(401)
            .json(formatResponse(false, "Contraseña actual incorrecta"));
        }
      }

      // Encriptar la nueva contraseña
      const password_hash = await hashPassword(newPassword);

      // Actualizar la contraseña
      await UserModel.updateUser(id, { password_hash });

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "cambio_contraseña",
        activity_details: { target_user: id },
        ip_address: req.ip,
      });

      return res
        .status(200)
        .json(formatResponse(true, "Contraseña actualizada exitosamente"));
    } catch (error) {
      console.error(
        `Error al cambiar contraseña de usuario ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Eliminar un usuario (desactivar)
   */
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si el usuario existe
      const existingUser = await UserModel.getUserById(id);
      if (!existingUser) {
        return res
          .status(404)
          .json(formatResponse(false, "Usuario no encontrado"));
      }

      // Verificar si el usuario tiene permisos para eliminar
      if (req.user.userId !== id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para eliminar este usuario"
            )
          );
      }

      // Desactivar usuario (soft delete)
      await UserModel.deleteUser(id);

      // Registrar la actividad
      await MetricsModel.logUserActivity({
        user_id: req.user.userId,
        activity_type: "eliminación_usuario",
        activity_details: { target_user: id },
        ip_address: req.ip,
      });

      return res
        .status(200)
        .json(formatResponse(true, "Usuario desactivado exitosamente"));
    } catch (error) {
      console.error(
        `Error al eliminar usuario con ID ${req.params.id}:`,
        error
      );
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener roles disponibles
   */
  getRoles: async (req, res) => {
    try {
      const roles = await UserModel.getRoles();

      return res
        .status(200)
        .json(formatResponse(true, "Roles obtenidos exitosamente", { roles }));
    } catch (error) {
      console.error("Error al obtener roles:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener información del usuario autenticado
   */
  getMe: async (req, res) => {
    try {
      const user = await UserModel.getUserById(req.user.userId);

      if (!user) {
        return res
          .status(404)
          .json(formatResponse(false, "Usuario no encontrado"));
      }

      return res
        .status(200)
        .json(
          formatResponse(true, "Información de usuario obtenida exitosamente", {
            user,
          })
        );
    } catch (error) {
      console.error("Error al obtener información del usuario:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener historial de login del usuario
   */
  getLoginHistory: async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;

      // Verificar si el usuario tiene permisos
      if (req.user.userId !== id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver el historial de este usuario"
            )
          );
      }

      const history = await MetricsModel.getLoginHistory(id, parseInt(limit));

      return res
        .status(200)
        .json(
          formatResponse(true, "Historial de login obtenido exitosamente", {
            history,
          })
        );
    } catch (error) {
      console.error("Error al obtener historial de login:", error);
      return handleDatabaseError(error, res);
    }
  },

  /**
   * Obtener actividad del usuario
   */
  getUserActivity: async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 20 } = req.query;

      // Verificar si el usuario tiene permisos
      if (req.user.userId !== id && req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            formatResponse(
              false,
              "No tienes permisos para ver la actividad de este usuario"
            )
          );
      }

      const activities = await MetricsModel.getUserActivity(
        id,
        parseInt(limit)
      );

      return res
        .status(200)
        .json(
          formatResponse(true, "Actividad del usuario obtenida exitosamente", {
            activities,
          })
        );
    } catch (error) {
      console.error("Error al obtener actividad del usuario:", error);
      return handleDatabaseError(error, res);
    }
  },
};

module.exports = UserController;
