import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

// GET /api/areas
export const getAreas = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT ID as id, NOMBRE as nombre, UBICACION as ubicacion, PISO as piso,
             DESCRIPCION as descripcion, ACTIVO as activo,
             FORMAT(FECHA_CREA, 'yyyy-MM-dd') as fechaCrea
      FROM AREA
      WHERE ACTIVO = 1
      ORDER BY NOMBRE ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando áreas', detalle: err.message });
  }
};

// POST /api/areas
export const createArea = async (req, res) => {
  try {
    const { id, nombre, ubicacion, piso, descripcion } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('nombre', sql.VarChar, nombre.trim())
      .input('ubicacion', sql.VarChar, ubicacion || null)
      .input('piso', sql.VarChar, piso || null)
      .input('descripcion', sql.NVarChar, descripcion || null)
      .query(`
        INSERT INTO AREA (ID, NOMBRE, UBICACION, PISO, DESCRIPCION)
        VALUES (@id, @nombre, @ubicacion, @piso, @descripcion)
      `);

    await logAudit(req, 'POST', 'Areas', id, `Área creada: ${nombre}`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/areas/:id
export const updateArea = async (req, res) => {
  try {
    const { nombre, ubicacion, piso, descripcion, activo } = req.body;
    const id = req.params.id;

    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('nombre', sql.VarChar, nombre?.trim() || '')
      .input('ubicacion', sql.VarChar, ubicacion || null)
      .input('piso', sql.VarChar, piso || null)
      .input('descripcion', sql.NVarChar, descripcion || null)
      .input('activo', sql.Bit, activo !== false ? 1 : 0)
      .query(`
        UPDATE AREA
        SET NOMBRE = @nombre, UBICACION = @ubicacion, PISO = @piso,
            DESCRIPCION = @descripcion, ACTIVO = @activo
        WHERE ID = @id
      `);

    await logAudit(req, 'PUT', 'Areas', id, `Área actualizada: ${nombre}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/areas/:id
export const deleteArea = async (req, res) => {
  try {
    const id = req.params.id;
    const db = await getPool();

    // Check if any habitacion references this area
    try {
      const used = await db.request()
        .input('id', sql.VarChar, id)
        .query(`SELECT COUNT(*) as cnt FROM HABITACION WHERE ID_AREA = @id AND ACTIVO = 1`);
      if (used.recordset[0].cnt > 0) {
        return res.status(400).json({ error: 'No se puede eliminar: hay habitaciones asociadas a esta área.' });
      }
    } catch { /* table may not exist */ }

    // Check if any maintenance references this area
    try {
      const used = await db.request()
        .input('id', sql.VarChar, id)
        .query(`SELECT COUNT(*) as cnt FROM TICKET_MANT WHERE TIPO_ENTIDAD = 'area' AND ID_ENTIDAD = @id AND BORRADO = 0`);
      if (used.recordset[0].cnt > 0) {
        return res.status(400).json({ error: 'No se puede eliminar: hay mantenimientos asociados a esta área.' });
      }
    } catch { /* columns may not exist */ }

    await db.request()
      .input('id', sql.VarChar, id)
      .query(`UPDATE AREA SET ACTIVO = 0 WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'Areas', id, 'Área desactivada');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
