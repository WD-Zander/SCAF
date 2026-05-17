import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

// ─── TIPOS DE INFRAESTRUCTURA ────────────────────────────────

// GET /api/infrastructure/types
export const getInfraTypes = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT ID as id, SLUG as slug, NOMBRE as nombre,
             PREFIJO_ID as prefijoId, ICONO as icono,
             CAMPOS as campos, ACTIVO as activo,
             FORMAT(FECHA_CREA, 'yyyy-MM-dd') as fechaCrea
      FROM TIPO_INFRAESTRUCTURA
      WHERE ACTIVO = 1
      ORDER BY NOMBRE ASC
    `);
    const rows = result.recordset.map(r => ({
      ...r,
      campos: JSON.parse(r.campos || '[]'),
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando tipos de infraestructura', detalle: err.message });
  }
};

// POST /api/infrastructure/types
export const createInfraType = async (req, res) => {
  try {
    const { slug, nombre, prefijoId, icono, campos } = req.body;
    if (!nombre?.trim() || !slug?.trim()) {
      return res.status(400).json({ error: 'Nombre y slug son obligatorios.' });
    }
    const db = await getPool();

    // Check unique slug
    const exists = await db.request()
      .input('slug', sql.VarChar, slug.trim().toLowerCase())
      .query('SELECT COUNT(*) as cnt FROM TIPO_INFRAESTRUCTURA WHERE SLUG = @slug');
    if (exists.recordset[0].cnt > 0) {
      return res.status(400).json({ error: `Ya existe un tipo con slug "${slug}".` });
    }

    await db.request()
      .input('slug', sql.VarChar, slug.trim().toLowerCase())
      .input('nombre', sql.VarChar, nombre.trim())
      .input('prefijoId', sql.VarChar, (prefijoId || slug).toUpperCase().substring(0, 20))
      .input('icono', sql.VarChar, icono || 'Box')
      .input('campos', sql.NVarChar, JSON.stringify(campos || []))
      .query(`
        INSERT INTO TIPO_INFRAESTRUCTURA (SLUG, NOMBRE, PREFIJO_ID, ICONO, CAMPOS)
        VALUES (@slug, @nombre, @prefijoId, @icono, @campos)
      `);

    await logAudit(req, 'POST', 'InfraType', slug, `Tipo creado: ${nombre}`);
    res.json({ success: true, slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/infrastructure/types/:slug
export const updateInfraType = async (req, res) => {
  try {
    const { nombre, prefijoId, icono, campos } = req.body;
    const slug = req.params.slug;
    const db = await getPool();

    await db.request()
      .input('slug', sql.VarChar, slug)
      .input('nombre', sql.VarChar, nombre?.trim() || '')
      .input('prefijoId', sql.VarChar, (prefijoId || '').toUpperCase().substring(0, 20))
      .input('icono', sql.VarChar, icono || 'Box')
      .input('campos', sql.NVarChar, JSON.stringify(campos || []))
      .query(`
        UPDATE TIPO_INFRAESTRUCTURA
        SET NOMBRE = @nombre, PREFIJO_ID = @prefijoId, ICONO = @icono, CAMPOS = @campos
        WHERE SLUG = @slug
      `);

    await logAudit(req, 'PUT', 'InfraType', slug, `Tipo actualizado: ${nombre}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/infrastructure/types/:slug
export const deleteInfraType = async (req, res) => {
  try {
    const slug = req.params.slug;
    const db = await getPool();

    // Check items
    const items = await db.request()
      .input('slug', sql.VarChar, slug)
      .query('SELECT COUNT(*) as cnt FROM INFRAESTRUCTURA_ITEM WHERE TIPO_SLUG = @slug AND ACTIVO = 1');
    if (items.recordset[0].cnt > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: hay elementos asociados a este tipo.' });
    }

    // Check maintenance scopes using this type
    try {
      const scopes = await db.request()
        .input('slug', sql.VarChar, slug)
        .query("SELECT COUNT(*) as cnt FROM SCOPE_MANT WHERE TIPO_ENTIDAD = @slug AND BORRADO = 0");
      if (scopes.recordset[0].cnt > 0) {
        return res.status(400).json({ error: 'No se puede eliminar: hay módulos de mantenimiento usando este tipo.' });
      }
    } catch { /* SCOPE_MANT might not have TIPO_ENTIDAD */ }

    await db.request()
      .input('slug', sql.VarChar, slug)
      .query('UPDATE TIPO_INFRAESTRUCTURA SET ACTIVO = 0 WHERE SLUG = @slug');

    await logAudit(req, 'DELETE', 'InfraType', slug, 'Tipo desactivado');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── ITEMS DE INFRAESTRUCTURA ────────────────────────────────

// GET /api/infrastructure/items?type=area
export const getInfraItems = async (req, res) => {
  try {
    const { type } = req.query;
    const db = await getPool();
    const request = db.request();
    let where = 'i.ACTIVO = 1';
    if (type) {
      request.input('type', sql.VarChar, type);
      where += ' AND i.TIPO_SLUG = @type';
    }
    const result = await request.query(`
      SELECT i.ID as id, i.TIPO_SLUG as tipoSlug, i.NOMBRE as nombre,
             i.DATOS as datos, i.DESCRIPCION as descripcion,
             i.ACTIVO as activo,
             FORMAT(i.FECHA_CREA, 'yyyy-MM-dd') as fechaCrea,
             t.NOMBRE as tipoNombre, t.ICONO as tipoIcono
      FROM INFRAESTRUCTURA_ITEM i
      LEFT JOIN TIPO_INFRAESTRUCTURA t ON i.TIPO_SLUG = t.SLUG
      WHERE ${where}
      ORDER BY i.NOMBRE ASC
    `);
    const rows = result.recordset.map(r => ({
      ...r,
      datos: JSON.parse(r.datos || '{}'),
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando elementos', detalle: err.message });
  }
};

// POST /api/infrastructure/items
export const createInfraItem = async (req, res) => {
  try {
    const { id, tipoSlug, nombre, datos, descripcion } = req.body;
    if (!nombre?.trim() || !tipoSlug) {
      return res.status(400).json({ error: 'Nombre y tipo son obligatorios.' });
    }
    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('tipoSlug', sql.VarChar, tipoSlug)
      .input('nombre', sql.VarChar, nombre.trim())
      .input('datos', sql.NVarChar, JSON.stringify(datos || {}))
      .input('descripcion', sql.NVarChar, descripcion || null)
      .query(`
        INSERT INTO INFRAESTRUCTURA_ITEM (ID, TIPO_SLUG, NOMBRE, DATOS, DESCRIPCION)
        VALUES (@id, @tipoSlug, @nombre, @datos, @descripcion)
      `);

    await logAudit(req, 'POST', 'InfraItem', id, `Item creado: ${nombre} (${tipoSlug})`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/infrastructure/items/:id
export const updateInfraItem = async (req, res) => {
  try {
    const { nombre, datos, descripcion } = req.body;
    const id = req.params.id;
    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('nombre', sql.VarChar, nombre?.trim() || '')
      .input('datos', sql.NVarChar, JSON.stringify(datos || {}))
      .input('descripcion', sql.NVarChar, descripcion || null)
      .query(`
        UPDATE INFRAESTRUCTURA_ITEM
        SET NOMBRE = @nombre, DATOS = @datos, DESCRIPCION = @descripcion
        WHERE ID = @id
      `);

    await logAudit(req, 'PUT', 'InfraItem', id, `Item actualizado: ${nombre}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/infrastructure/items/:id
export const deleteInfraItem = async (req, res) => {
  try {
    const id = req.params.id;
    const db = await getPool();

    // Check maintenance references
    try {
      const used = await db.request()
        .input('id', sql.VarChar, id)
        .query("SELECT COUNT(*) as cnt FROM TICKET_MANT WHERE ID_ENTIDAD = @id AND BORRADO = 0");
      if (used.recordset[0].cnt > 0) {
        return res.status(400).json({ error: 'No se puede eliminar: hay mantenimientos asociados a este elemento.' });
      }
    } catch { /* column may not exist */ }

    await db.request()
      .input('id', sql.VarChar, id)
      .query('UPDATE INFRAESTRUCTURA_ITEM SET ACTIVO = 0 WHERE ID = @id');

    await logAudit(req, 'DELETE', 'InfraItem', id, 'Item desactivado');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};