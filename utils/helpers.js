const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

/**
 * Genera un token JWT para el usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Token JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Encripta una contraseña
 * @param {string} password - Contraseña en texto plano
 * @returns {string} Contraseña encriptada
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compara una contraseña en texto plano con una encriptada
 * @param {string} plainPassword - Contraseña en texto plano
 * @param {string} hashedPassword - Contraseña encriptada
 * @returns {boolean} True si coinciden, false si no
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Genera un mensaje de respuesta estándar
 * @param {boolean} success - Indica si la operación fue exitosa
 * @param {string} message - Mensaje descriptivo
 * @param {object} data - Datos a devolver
 * @returns {object} Objeto de respuesta formateado
 */
const formatResponse = (success, message, data = null) => {
  const response = {
    success,
    message,
  };

  if (data) {
    response.data = data;
  }

  return response;
};

/**
 * Captura y maneja errores comunes de la base de datos
 * @param {Error} error - Error capturado
 * @param {object} res - Objeto de respuesta de Express
 */
const handleDatabaseError = (error, res) => {
  console.error("Error de base de datos:", error);

  // Errores específicos de PostgreSQL
  switch (error.code) {
    case "23505": // Violación de unicidad
      return res
        .status(409)
        .json(formatResponse(false, "El recurso ya existe"));
    case "23503": // Violación de clave foránea
      return res.status(400).json(formatResponse(false, "Referencia inválida"));
    case "23502": // Violación de no nulidad
      return res.status(400).json(formatResponse(false, "Datos incompletos"));
    default:
      return res
        .status(500)
        .json(formatResponse(false, "Error en el servidor"));
  }
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  formatResponse,
  handleDatabaseError,
};
