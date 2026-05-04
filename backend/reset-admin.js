import bcrypt from 'bcryptjs';
import { getPool, sql } from './db.js';

async function resetAdmin() {
  try {
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const db = await getPool();
    const result = await db.request()
      .input('hash', sql.VarChar, hash)
      .query(`
        UPDATE USUARIOS 
        SET PASSWORD_HASH = @hash 
        WHERE CORREO = 'admin@scaf.com';
      `);

    if (result.rowsAffected[0] > 0) {
      console.log('✅ Contraseña del administrador actualizada correctamente a: 123456');
    } else {
      console.log('❌ No se encontró el usuario admin@scaf.com. ¿Quizás usaste otro correo?');
      const users = await db.request().query('SELECT CORREO FROM USUARIOS');
      console.log('Usuarios disponibles en la BD:', users.recordset);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

resetAdmin();
