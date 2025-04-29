// Importaciones
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const db = require("./config/db");
require("dotenv").config();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importaciones de Rutas
const userRoutes = require("./routes/users.routes");
const profileRoutes = require("./routes/profiles.routes");
const surveyRoutes = require("./routes/surveys.routes");
const categoryRoutes = require("./routes/categories.routes");
const questionRoutes = require("./routes/questions.routes");
const improvementAreasRoutes = require("./routes/improvement-areas.routes");
const wellnessActivitiesRoutes = require("./routes/wellness-activities.routes");
const metricsRoutes = require("./routes/metrics.routes");

// Importaciones de Middlewares
const errorMiddleware = require("./middlewares/error.middleware");

// Inicializacion de express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para verificar estado de la DB en cada petición
app.use(async (req, res, next) => {
  // Verificar DB solo para rutas que no sean de salud
  if (!req.path.includes('/health') && !req.path.includes('/status')) {
    const isDbConnected = await db.ping().catch(() => false);
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: "Servicio no disponible: Problema de conexión con la base de datos"
      });
    }
  }
  next();
});

// Rutas
app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/improvement-areas", improvementAreasRoutes);
app.use("/api/wellness-activities", wellnessActivitiesRoutes);
app.use("/api/metrics", metricsRoutes);

// Ruta para verificar si el servidor esta funcionando
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to LyrahAPI",
    version: "2.0",
    status: "running",
  });
});

// Endpoint de estado para monitorización
app.get("/health", async (req, res) => {
  try {
    const dbStatus = await db.ping();
    res.json({
      status: "ok",
      db: dbStatus ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware para las rutas no encontradas
app.use((req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Middleware para manejo de errores
app.use(errorMiddleware);

// Iniciar Servidor
const server = app.listen(PORT, () => {
  console.log(`Server Running http://localhost:${PORT}`);
});

// Manejo de señales de terminación
const handleShutdown = async () => {
  console.log('Cerrando servidor...');
  server.close(async () => {
    console.log('Servidor HTTP cerrado.');
    // Cerrar conexiones a la base de datos
    await db.close();
    process.exit(0);
  });

  // Si no se cierra en 10 segundos, forzar salida
  setTimeout(() => {
    console.error('Forzando cierre después de 10s');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// Manejar rechazos de promesas no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo de promesa no manejado:', reason);
  // No cerramos la aplicación, solo registramos el error
});

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  // En producción, generalmente queremos cerrar la aplicación
  // pero de forma ordenada
  handleShutdown();
});