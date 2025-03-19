// Importaciones
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

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
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Middleware para las rutas no encontradas
app.use((req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Middleware para manejo de errores
app.use(errorMiddleware);

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`Server Running http://localhost:${PORT}`);
});
