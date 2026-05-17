import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

// GET /api/maintenance-scopes
export const getScopes = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT ID as id, NOMBRE as nombre, SLUG as slug, COLOR as color, ICONO as icono, ACTIVO as activo, ORDEN as orden,
             ISNULL(TIPO_ENTIDAD, 'activo') as tipoEntidad
      FROM SCOPE_MANT
      ORDER BY ORDEN ASC, ID ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando módulos de mantenimiento', detalle: err.message });
  }
};

// POST /api/maintenance-scopes
export const createScope = async (req, res) => {
  try {
    const { nombre, slug, color, icono, orden, tipoEntidad } = req.body;
    if (!nombre?.trim() || !slug?.trim()) {
      return res.status(400).json({ error: 'Nombre y slug son obligatorios.' });
    }

    // Sanitize slug: lowercase, no spaces, only alphanumeric and hyphens
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');

    const db = await getPool();

    // Check unique slug
    const existing = await db.request()
      .input('slug', sql.VarChar, cleanSlug)
      .query(`SELECT ID FROM SCOPE_MANT WHERE SLUG = @slug`);
    if (existing.recordset.length > 0) {
      return res.status(400).json({ error: `El slug "${cleanSlug}" ya está en uso.` });
    }

    const result = await db.request()
      .input('nombre', sql.NVarChar, nombre.trim())
      .input('slug',   sql.VarChar,  cleanSlug)
      .input('color',  sql.VarChar,  color || '#3b82f6')
      .input('icono',  sql.VarChar,  icono || 'Wrench')
      .input('orden',  sql.Int,      orden || 99)
      .input('tipoEntidad', sql.VarChar, tipoEntidad || 'activo')
      .query(`
        INSERT INTO SCOPE_MANT (NOMBRE, SLUG, COLOR, ICONO, ORDEN, TIPO_ENTIDAD)
        VALUES (@nombre, @slug, @color, @icono, @orden, @tipoEntidad)
        RETURNING ID
      `);

    const newId = result.recordset[0].ID;
    await logAudit(req, 'POST', 'ScopesMant', String(newId), `Módulo creado: ${nombre}`);
    res.json({ success: true, id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/maintenance-scopes/:id
export const updateScope = async (req, res) => {
  try {
    const { nombre, color, icono, orden, activo, tipoEntidad } = req.body;
    const id = req.params.id;

    const db = await getPool();
    await db.request()
      .input('id',     sql.Int,      id)
      .input('nombre', sql.NVarChar, nombre?.trim() || '')
      .input('color',  sql.VarChar,  color || '#3b82f6')
      .input('icono',  sql.VarChar,  icono || 'Wrench')
      .input('orden',  sql.Int,      orden ?? 99)
      .input('activo', sql.Bit,      activo !== false ? 1 : 0)
      .input('tipoEntidad', sql.VarChar, tipoEntidad || 'activo')
      .query(`
        UPDATE SCOPE_MANT
        SET NOMBRE=@nombre, COLOR=@color, ICONO=@icono, ORDEN=@orden, ACTIVO=@activo, TIPO_ENTIDAD=@tipoEntidad
        WHERE ID=@id
      `);

    await logAudit(req, 'PUT', 'ScopesMant', String(id), `Módulo actualizado: ${nombre}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/maintenance-scopes/:id
export const deleteScope = async (req, res) => {
  try {
    const id = req.params.id;
    const db = await getPool();

    // Check if any ticket uses this scope
    const used = await db.request()
      .input('id', sql.Int, id)
      .query(`SELECT COUNT(*) as cnt FROM TICKET_MANT WHERE ID_SCOPE = @id AND BORRADO = 0`);
    if (used.recordset[0].cnt > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: hay mantenimientos asociados a este módulo.' });
    }

    // Check if any category is linked to this scope
    try {
      const catUsed = await db.request()
        .input('id', sql.Int, id)
        .query(`SELECT COUNT(*) as cnt FROM CATEGORIA WHERE ID_SCOPE = @id`);
      if (catUsed.recordset[0].cnt > 0) {
        return res.status(400).json({ error: 'No se puede eliminar: hay categorías de activos asignadas a este módulo.' });
      }
    } catch { /* ID_SCOPE column may not exist yet */ }

    await db.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM SCOPE_MANT WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'ScopesMant', String(id), 'Módulo eliminado');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
