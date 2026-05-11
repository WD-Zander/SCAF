import { sql, getPool } from './db.js';

async function removeConstraint() {
  try {
    const pool = await getPool();
    console.log('Conectado a la base de datos...');
    
    await pool.request().query(`
      ALTER TABLE ACTIVOS DROP CONSTRAINT UQ__ACTIVOS__1CE6D4E790913588;
    `);
    console.log('Restriccion UQ__ACTIVOS__1CE6D4E790913588 eliminada con exito.');
  } catch (error) {
    if (error.message.includes('is not a constraint')) {
      console.log('La restriccion no existe o ya fue eliminada.');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

removeConstraint();
