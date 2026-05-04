import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';
import sql from 'mssql';

const __dir = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dir, '.env') });
dotenvConfig({ path: resolve(__dir, '..', '.env') });

// -------------------------------------------------------------
// SCAF CONFIGURACIÓN DE CONEXIÓN A BASE DE DATOS SQL SERVER
// -------------------------------------------------------------
// REEMPLAZA ESTOS DATOS en un archivo ".env" o directamente aquí
// para conectar con tu motor SQL Server real en Producción.

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  port: parseInt(process.env.SQL_PORT) || 1433,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: false, // Debe estar en falso para entornos locales Windows
    trustServerCertificate: true, // Necesario en desarrollo local
    enableArithAbort: true,
  },
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 60000,
    acquireTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
  connectionTimeout: 15000,
};

let pool = null;

/**
 * Retorna el Connection Pool. Si no existe o está muerto, lo (re)inicializa.
 * Esto previene agotar las conexiones del servidor.
 */
async function getPool() {
  try {
    if (pool && pool.connected) {
      return pool;
    }

    // Si el pool existía pero se desconectó, cerrarlo limpio
    if (pool) {
      try { await pool.close(); } catch(e) { /* ignore */ }
      pool = null;
    }

    console.log('⏳ Estableciendo conexión con SQL Server...');
    pool = await sql.connect(config);
    console.log('✅ Conexión exitosa a SQL Server (SCAF)');

    // Listener para reconexión automática si la BD se cae
    pool.on('error', (err) => {
      console.error('⚠️ Error en el pool de SQL Server, se reconectará automáticamente:', err.message);
      pool = null; // Forzar reconexión en la siguiente llamada
    });

    return pool;
  } catch (error) {
    pool = null; // Limpiar para intentar reconectar en la siguiente llamada
    console.error('❌ Error al conectar con SQL Server:', error.message);
    throw error;
  }
}

export {
  getPool,
  sql
};