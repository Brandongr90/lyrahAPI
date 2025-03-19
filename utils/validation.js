const { body, param, validationResult } = require("express-validator");

/**
 * Middleware para verificar si hay errores de validación
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Reglas de validación para registro de usuario
 */
const registerValidation = [
  body("username")
    .notEmpty()
    .withMessage("El nombre de usuario es requerido")
    .isLength({ min: 3, max: 50 })
    .withMessage("El nombre de usuario debe tener entre 3 y 50 caracteres"),

  body("email")
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("Formato de email inválido"),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es requerida")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres"),

  body("role_id")
    .optional()
    .isInt()
    .withMessage("ID de rol debe ser un número entero"),
];

/**
 * Reglas de validación para login de usuario
 */
const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("Formato de email inválido"),

  body("password").notEmpty().withMessage("La contraseña es requerida"),
];

/**
 * Reglas de validación para creación/actualización de perfil
 */
const profileValidation = [
  body("first_name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("El nombre debe tener máximo 100 caracteres"),

  body("last_name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("El apellido debe tener máximo 100 caracteres"),

  body("birthdate")
    .optional()
    .isDate()
    .withMessage("Formato de fecha inválido"),

  body("gender")
    .optional()
    .isLength({ max: 20 })
    .withMessage("El género debe tener máximo 20 caracteres"),

  body("phone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("El teléfono debe tener máximo 20 caracteres"),

  body("postal_code")
    .optional()
    .isLength({ max: 20 })
    .withMessage("El código postal debe tener máximo 20 caracteres"),

  body("improvement_areas")
    .optional()
    .isArray()
    .withMessage("Las áreas de mejora deben ser un array"),

  body("wellness_activities")
    .optional()
    .isArray()
    .withMessage("Las actividades de bienestar deben ser un array"),
];

/**
 * Reglas de validación para creación de encuesta
 */
const surveyValidation = [
  body("profile_id")
    .notEmpty()
    .withMessage("El ID del perfil es requerido")
    .isUUID()
    .withMessage("El ID del perfil debe ser un UUID válido"),

  // Puedes añadir validaciones para todos los campos de la encuesta
];

/**
 * Validación de parámetros UUID
 */
const validateUUID = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
  validateRequest,
];

module.exports = {
  validateRequest,
  registerValidation,
  loginValidation,
  profileValidation,
  surveyValidation,
  validateUUID,
};
