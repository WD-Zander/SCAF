/**
 * SCAF - Script de creación del Super Administrador
 * Ejecutar UNA SOLA VEZ desde la carpeta backend/:
 *   node create-superadmin.js
 */
import './loadEnv.js';
import bcrypt from 'bcryptjs';
import { getPool, sql } from './db.js';

const USERNAME  = 'admin';
const PASSWORD  = 'Admin2026';
const NOMBRE    = 'Super Administrador';
const ROLE_ID   = 'SUPERADMIN';
const ROLE_NAME = 'Super Administrador';
const PERMISOS  = JSON.stringify(['all']);

async function createSuperAdmin() {
  try {
    const db = await getPool();

    // 1. Crear rol SUPERADMIN si no existe
    const roleExists = await db.request()
      .input('id', sql.VarChar, ROLE_ID)
      .query('SELECT ID FROM ROL WHERE ID = @id');

    if (roleExists.recordset.length === 0) {
      await db.request()
        .input('id', sql.VarChar, ROLE_ID)
        .input('nombre', sql.VarChar, ROLE_NAME)
        .input('permisos', sql.NVarChar, PERMISOS)
        .query('INSERT INTO ROL (ID, NOMBRE, PERMISOS) VALUES (@id, @nombre, @permisos)');
      console.log('✅ Rol SUPERADMIN creado.');
    } else {
      console.log('ℹ️  Rol SUPERADMIN ya existe.');
    }

    // 2. Buscar si ya existe un usuario con ese username
    const userExists = await db.request()
      .input('username', sql.VarChar, USERNAME)
      .query('SELECT ID FROM USUARIO WHERE USERNAME = @username');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(PASSWORD, salt);

    if (userExists.recordset.length === 0) {
      await db.request()
        .input('id', sql.VarChar, 'USR-001')
        .input('nombre', sql.VarChar, NOMBRE)
        .input('username', sql.VarChar, USERNAME)
        .input('roleId', sql.VarChar, ROLE_ID)
        .input('hash', sql.VarChar, hash)
        .query(`
          INSERT INTO USUARIO (ID, NOMBRE, USERNAME, CORREO, ID_ROL, PASSWORD_HASH, ACTIVO)
          VALUES (@id, @nombre, @username, '', @roleId, @hash, 1)
        `);
      console.log('✅ Usuario Super Administrador creado exitosamente.');
    } else {
      // Si ya existe, actualizar contraseña y rol
      await db.request()
        .input('username', sql.VarChar, USERNAME)
        .input('hash', sql.VarChar, hash)
        .input('roleId', sql.VarChar, ROLE_ID)
        .input('nombre', sql.VarChar, NOMBRE)
        .query(`
          UPDATE USUARIO
          SET PASSWORD_HASH = @hash, ID_ROL = @roleId, NOMBRE = @nombre, ACTIVO = 1
          WHERE USERNAME = @username
        `);
      console.log('✅ Usuario existente actualizado con nueva contraseña y rol SUPERADMIN.');
    }

    console.log('');
    console.log('══════════════════════════════════════════');
    console.log('  CREDENCIALES DEL SUPER ADMINISTRADOR   ');
    console.log('══════════════════════════════════════════');
    console.log(`  Usuario   :  ${USERNAME}`);
    console.log(`  Contraseña:  ${PASSWORD}`);
    console.log('══════════════════════════════════════════');
    console.log('  Cambia la contraseña después del primer');
    console.log('  inicio de sesión desde Ajustes > Usuarios');
    console.log('══════════════════════════════════════════');
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createSuperAdmin();