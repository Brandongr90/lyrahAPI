// Importaciones
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

// Importaciones de Rutas
const userRoutes = require("./routes/users.routes");
const profileRoutes = require("./routes/profiles.routes");
const surveyRoutes = require("./routes/surveys.routes");

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

// Ruta para verificar que el servidor esta funcionando PING
app.get("/", (req, res) => {
  res.json({ message: "Welcome to LyrahAPI" });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Error en el servidor",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`Server Running http://localhost:${PORT}`);
})