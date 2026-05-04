import bcrypt from 'bcryptjs';
import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getUsers = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(
      'SELECT u.ID as id, u.NOMBRE as name, u.USERNAME as username, u.CORREO as email, u.ID_ROL as roleId, u.ACTIVO as isActive FROM USUARIO u'
    );
    res.json(result.recordset);
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const createUser = async (req, res) => {
  const { id, name, username, email, roleId, password } = req.body;
  try {
    const db = await getPool();
    const salt = await bcrypt.genSalt(10);
    const hash = password ? await bcrypt.hash(password, salt) : null;

    await db.request()
      .input('id', sql.VarChar, id)
      .input('name', sql.VarChar, name)
      .input('username', sql.VarChar, username || null)
      .input('email', sql.VarChar, email || '')
      .input('roleId', sql.VarChar, roleId)
      .input('hash', sql.VarChar, hash)
      .query('INSERT INTO USUARIO (ID, NOMBRE, USERNAME, CORREO, ID_ROL, PASSWORD_HASH, ACTIVO) VALUES (@id, @name, @username, @email, @roleId, @hash, 1)');

    await logAudit(req, 'POST', 'USUARIO', id, `Usuario creado: ${name} (@${username})`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateUser = async (req, res) => {
  const { name, username, email, roleId, password, isActive } = req.body;
  try {
    const db = await getPool();

    let query = 'UPDATE USUARIO SET NOMBRE = @name, USERNAME = @username, CORREO = @email, ID_ROL = @roleId, ACTIVO = @isActive';
    const reqDb = db.request()
      .input('id', sql.VarChar, req.params.id)
      .input('name', sql.VarChar, name)
      .input('username', sql.VarChar, username || null)
      .input('email', sql.VarChar, email || '')
      .input('roleId', sql.VarChar, roleId)
      .input('isActive', sql.Bit, isActive ? 1 : 0);

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      query += ', PASSWORD_HASH = @hash';
      reqDb.input('hash', sql.VarChar, hash);
    }

    query += ' WHERE ID = @id';

    await reqDb.query(query);
    await logAudit(req, 'PUT', 'USUARIO', req.params.id, `Usuario modificado: ${name} (@${username})`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};