import { getPool, sql } from '../db.js';

export const logAudit = async (req, action, entity, entityId, desc) => {
  try {
    const userId = req.user?.id || 'Sistema';
    const userName = req.user?.nombre || req.headers['x-user-name'] || 'Automático';
    const db = await getPool();
    await db.request()
      .input('action',   sql.VarChar,  action)
      .input('entity',   sql.VarChar,  entity)
      .input('entityId', sql.VarChar,  entityId || '')
      .input('desc',     sql.NVarChar, desc || '')
      .input('uid',      sql.VarChar,  userId)
      .input('uname',    sql.VarChar,  userName)
      .query(`
        INSERT INTO AUDITORIA (ACCION, ENTIDAD, ID_ENTIDAD, DESCRIPCION, ID_USUARIO, NOMBRE_USUARIO)
        VALUES (@action, @entity, @entityId, @desc, @uid, @uname)
      `);
  } catch(e) {
    console.error("Error guardando auditoría:", e);
  }
};