import './loadEnv.js';
import sql from 'mssql';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// Lee credenciales del .env (nunca hardcodeadas)
const config = {
  user:     process.env.SQL_USER     || 'sa',
  password: process.env.SQL_PASSWORD || '',
  server:   process.env.SQL_SERVER   || 'localhost',
  port:     parseInt(process.env.SQL_PORT) || 1433,
  database: 'master',            // conectar a master para poder CREATE DATABASE
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  }
};

async function run() {
  let pool;
  try {
    console.log(`⏳ Conectando a SQL Server (${config.server}:${config.port}) en master para reset...`);
    pool = await sql.connect(config);
    console.log('✅ Conectado.');

    const sqlPath = resolve(__dir, '..', 'Necesarios para instalacion', 'scaf_schema_3nf.sql');
    const script = fs.readFileSync(sqlPath, 'utf8');

    // Dividir por GO (case insensitive) y ejecutar cada bloque
    const batches = script.split(/^\s*GO\s*$/mi);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (!batch) continue;

      console.log(`Ejecutando bloque ${i + 1}...`);
      try {
        await pool.request().query(batch);
        console.log(`✅ Bloque ${i + 1} OK`);
      } catch (err) {
        console.error(`❌ Error en bloque ${i + 1}:`, err.message);
      }
    }

    // Crear usuario Super Administrador
    console.log('⏳ Creando usuario Super Administrador...');
    const hash = await bcrypt.hash('Admin2026', 10);
    const dbName = process.env.SQL_DATABASE || 'SCAF';
    await pool.request()
      .input('id',       sql.VarChar, 'USR-001')
      .input('nombre',   sql.VarChar, 'Super Administrador')
      .input('username', sql.VarChar, 'admin')
      .input('roleId',   sql.VarChar, 'SUPERADMIN')
      .input('hash',     sql.VarChar, hash)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM ${dbName}.dbo.USUARIO WHERE USERNAME = 'admin')
          INSERT INTO ${dbName}.dbo.USUARIO (ID, NOMBRE, USERNAME, CORREO, ID_ROL, PASSWORD_HASH, ACTIVO)
          VALUES (@id, @nombre, @username, '', @roleId, @hash, 1)
      `);

    console.log('');
    console.log('════════════════════════════════════════');
    console.log(`  Servidor : ${config.server}:${config.port}`);
    console.log(`  Base de datos : ${dbName}`);
    console.log('  Usuario  : admin');
    console.log('  Contraseña: Admin2026');
    console.log('════════════════════════════════════════');
    console.log('🎉 Reset completado. BD lista para usar.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    if (pool) await pool.close();
  }
}

run();
