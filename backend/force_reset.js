import sql from 'mssql';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// Conectar a 'master' para poder crear/recrear SCAF si fuera necesario
const config = {
  user: 'sa',
  password: 'Master6034',
  server: '100.67.97.89',
  port: 1433,
  database: 'master',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  }
};

async function run() {
  let pool;
  try {
    console.log('⏳ Conectando a SQL Server (master) para reset...');
    pool = await sql.connect(config);
    console.log('✅ Conectado.');

    const sqlPath = resolve(__dir, '..', 'Necesarios para instalacion', 'scaf_schema_3nf.sql');
    const script = fs.readFileSync(sqlPath, 'utf8');

    // Split by GO (case insensitive)
    const batches = script.split(/^\s*GO\s*$/mi);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (!batch) continue;
      
      console.log(`Ejecutando bloque ${i + 1}...`);
      try {
        await pool.request().query(batch);
        console.log(`✅ Bloque ${i + 1} completado.`);
      } catch (err) {
        console.error(`❌ Error en bloque ${i + 1}:`, err.message);
      }
    }

    // Crear usuario Super Administrador
    console.log('⏳ Creando usuario Super Administrador...');
    const hash = await bcrypt.hash('Admin2026', 10);
    await pool.request()
      .input('id',       sql.VarChar,  'USR-001')
      .input('nombre',   sql.VarChar,  'Super Administrador')
      .input('username', sql.VarChar,  'admin')
      .input('roleId',   sql.VarChar,  'SUPERADMIN')
      .input('hash',     sql.VarChar,  hash)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM SCAF.dbo.USUARIO WHERE USERNAME = 'admin')
          INSERT INTO SCAF.dbo.USUARIO (ID, NOMBRE, USERNAME, CORREO, ID_ROL, PASSWORD_HASH, ACTIVO)
          VALUES (@id, @nombre, @username, '', @roleId, @hash, 1)
      `);
    console.log('✅ Usuario admin / Admin2026 creado.');
    console.log('🎉 Reset completado. BD lista para usar.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (pool) await pool.close();
  }
}

run();
