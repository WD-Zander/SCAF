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
    // Protección: solo SUPERADMIN puede modificar el rol SUPERADMIN
    if (req.params.id === 'SUPERADMIN' && !(req.user.permisos || []).includes('all')) {
      return res.status(403).json({ error: 'No puedes modificar el rol Super Administrador.' });
    }

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

export const deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    // No se puede eliminar SUPERADMIN
    if (id === 'SUPERADMIN') {
      return res.status(400).json({ error: 'El rol Super Administrador no puede ser eliminado.' });
    }

    const db = await getPool();

    // Verificar que no haya usuarios asignados a este rol
    const usersCheck = await db.request()
      .input('rolId', sql.VarChar, id)
      .query('SELECT COUNT(*) as total FROM USUARIO WHERE ID_ROL = @rolId');

    if (usersCheck.recordset[0].total > 0) {
      return res.status(400).json({ error: `No se puede eliminar: hay ${usersCheck.recordset[0].total} usuario(s) asignado(s) a este rol.` });
    }

    await db.request()
      .input('id', sql.VarChar, id)
      .query('DELETE FROM ROL WHERE ID = @id');

    await logAudit(req, 'DELETE', 'ROL', id, `Rol eliminado: ${id}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};