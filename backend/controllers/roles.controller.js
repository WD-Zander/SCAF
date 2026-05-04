import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getRoles = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query('SELECT ID as id, NOMBRE as name, PERMISOS as permissions FROM ROL');
    res.json(result.recordset.map(r => ({ ...r, permissions: JSON.parse(r.permissions || '[]') })));
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const createRole = async (req, res) => {
  const { id, name, permissions } = req.body;
  try {
    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('name', sql.VarChar, name)
      .input('permissions', sql.NVarChar, JSON.stringify(permissions))
      .query('INSERT INTO ROL (ID, NOMBRE, PERMISOS) VALUES (@id, @name, @permissions)');

    await logAudit(req, 'POST', 'ROL', id, `Rol creado: ${name}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateRole = async (req, res) => {
  const { name, permissions } = req.body;
  try {
    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, req.params.id)
      .input('name', sql.VarChar, name)
      .input('permissions', sql.NVarChar, JSON.stringify(permissions))
      .query('UPDATE ROL SET NOMBRE = @name, PERMISOS = @permissions WHERE ID = @id');

    await logAudit(req, 'PUT', 'ROL', req.params.id, `Rol modificado: ${name}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};