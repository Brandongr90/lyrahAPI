const jwt = require("jsonwebtoken");
const UserModel = require("../models/users.model");

/**
 * Middleware de autenticación para proteger rutas
 */
const protect = async (req, res, next) => {
  let token;

  // Verificar si existe un token en los headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Obtener el token del header
      token = req.headers.authorization.split(" ")[1];

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar el usuario y añadirlo a la solicitud
      const user = await UserModel.getUserById(decoded.userId);

      if (!user) {
        res.status(401);
        throw new Error("Usuario no encontrado o no autorizado");
      }

      if (!user.is_active) {
        res.status(401);
        throw new Error("Cuenta de usuario inactiva");
      }

      req.user = {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role_name,
      };

      // Registrar el acceso
      await UserModel.updateLastLogin(user.user_id);

      next();
    } catch (error) {
      res.status(401);
      throw new Error("No autorizado, token inválido");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("No autorizado, no se proporcionó token");
  }
};

/**
 * Middleware para verificar roles específicos
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("No tienes permisos para acceder a este recurso");
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
