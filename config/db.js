const { Pool } = require("pg");
require("dotenv").config();

// Configuracion de la conexion a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verificar la conexion
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error connecting PostgreSQL", err);
  }
  console.log("Connected successfully to PostgreSQL");
  release();
});

// Para usar en consultas, por ejemplo:
// const { rows } = await pool.query('SELECT * FROM users');
module.exports = {
  query: (text, params) => pool.query(text, params),
};
