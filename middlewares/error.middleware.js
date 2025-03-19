/**
 * Middleware para manejo centralizado de errores
 */

const errorMiddleware = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Registrar el error en consola
  console.error(`${statusCode} - ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Formatear la respuesta de error
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};

module.exports = errorMiddleware;
