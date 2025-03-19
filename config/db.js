const { Pool } = require("pg");
require("dotenv").config();

// Configuracion de la conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verificar la conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error al conectar con PostgreSQL", err);
  }
  console.log("Conexión exitosa a PostgreSQL");
  release();
});

// Función auxiliar para consultas con manejo de errores
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error("Error en la consulta a la base de datos:", error);
    throw error;
  }
};

module.exports = {
  query,
  pool,
};
