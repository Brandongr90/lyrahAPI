const { Pool } = require("pg");
require("dotenv").config();

// Configuración para reintentos de conexión
const MAX_CONNECTION_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// Configuracion de la conexión a PostgreSQL
const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL_REQUIRED === 'true' ? {
    require: true,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
  // Configuración del pool
  max: process.env.DB_POOL_MAX || 20,      // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,                // Cuánto tiempo puede estar inactiva una conexión
  connectionTimeoutMillis: 10000,          // Timeout de conexión
  maxUses: 7500,                           // Número máximo de consultas por conexión antes de ser cerrada
};

// Crear el pool de conexiones
const pool = new Pool(poolConfig);

// Manejo de errores a nivel de pool
pool.on('error', (err, client) => {
  console.error('Error inesperado en el pool de conexiones:', err);
  // No cerrar el pool por un único error, solo registrarlo
});

// Función para verificar la conexión con reintentos
const testDatabaseConnection = async (retries = MAX_CONNECTION_RETRIES) => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    client.release();
    return true;
  } catch (error) {
    if (retries > 0) {
      console.error(`❌ Error al conectar con PostgreSQL (intentos restantes: ${retries}):`, error.message);
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return testDatabaseConnection(retries - 1);
    } else {
      console.error('❌ No se pudo conectar a la base de datos después de múltiples intentos:', error);
      // En producción, podrías querer enviar una notificación aquí
      return false;
    }
  }
};

testDatabaseConnection();

// Función auxiliar para consultas con manejo de errores y reintentos
const query = async (text, params, retries = 2) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    // Si es un error de conexión y quedan reintentos, intentar nuevamente
    if ((error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === '57P01') && retries > 0) {
      console.warn(`Reintentando consulta después de error: ${error.message}`);
      // Liberar cliente si existe
      if (client) client.release(true); // true = destruir el cliente
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000));
      return query(text, params, retries - 1);
    }
    
    console.error("Error en la consulta a la base de datos:", error);
    throw error;
  } finally {
    // Asegurarse de que el cliente sea liberado al pool
    if (client) client.release();
  }
};

// Función para transacciones con manejo de errores
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Verificar la conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error al conectar con PostgreSQL", err);
  }
  console.log("Conexión exitosa a PostgreSQL");
  release();
});

// Función para cerrar el pool (útil para tests o cierre ordenado)
const close = async () => {
  try {
    await pool.end();
    console.log('Pool de base de datos cerrado correctamente');
  } catch (error) {
    console.error('Error al cerrar el pool de base de datos:', error);
  }
};

// Ping para verificar la salud de la base de datos
const ping = async () => {
  try {
    const result = await query('SELECT 1');
    return result.rows[0] ? true : false;
  } catch (error) {
    console.error('Error en el ping a la base de datos:', error);
    return false;
  }
};

module.exports = {
  query,
  pool,
  transaction,
  close,
  ping,
};
