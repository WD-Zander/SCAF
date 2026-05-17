import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

// GET /api/rooms
export const getRooms = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT h.ID as id, h.NOMBRE as nombre, h.NUMERO as numero,
             h.ID_AREA as areaId, a.NOMBRE as areaNombre,
             h.PISO as piso, h.TIPO as tipo,
             h.DESCRIPCION as descripcion, h.ACTIVO as activo,
             FORMAT(h.FECHA_CREA, 'yyyy-MM-dd') as fechaCrea
      FROM HABITACION h
      LEFT JOIN AREA a ON h.ID_AREA = a.ID
      WHERE h.ACTIVO = 1
      ORDER BY h.NOMBRE ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando habitaciones', detalle: err.message });
  }
};

// POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { id, nombre, numero, areaId, piso, tipo, descripcion } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('nombre', sql.VarChar, nombre.trim())
      .input('numero', sql.VarChar, numero || null)
      .input('areaId', sql.VarChar, areaId || null)
      .input('piso', sql.VarChar, piso || null)
      .input('tipo', sql.VarChar, tipo || null)
      .input('descripcion', sql.NVarChar, descripcion || null)
      .query(`
        INSERT INTO HABITACION (ID, NOMBRE, NUMERO, ID_AREA, PISO, TIPO, DESCRIPCION)
        VALUES (@id, @nombre, @numero, @areaId, @piso, @tipo, @descripcion)
      `);

    await logAudit(req, 'POST', 'Habitaciones', id, `Habitación creada: ${nombre}`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const { nombre, numero, areaId, piso, tipo, descripcion, activo } = req.body;
    const id = req.params.id;

    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('nombre', sql.VarChar, nombre?.trim() || '')
      .input('numero', sql.VarChar, numero || null)
      .input('areaId', sql.VarChar, areaId || null)
      .input('piso', sql.VarChar, piso || null)
      .input('tipo', sql.VarChar, tipo || null)
      .input('descripcion', sql.NVarChar, descripcion || null)
      .input('activo', sql.Bit, activo !== false ? 1 : 0)
      .query(`
        UPDATE HABITACION
        SET NOMBRE = @nombre, NUMERO = @numero, ID_AREA = @areaId,
            PISO = @piso, TIPO = @tipo, DESCRIPCION = @descripcion, ACTIVO = @activo
        WHERE ID = @id
      `);

    await logAudit(req, 'PUT', 'Habitaciones', id, `Habitación actualizada: ${nombre}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const id = req.params.id;
    const db = await getPool();

    // Check if any maintenance references this room
    try {
      const used = await db.request()
        .input('id', sql.VarChar, id)
        .query(`SELECT COUNT(*) as cnt FROM TICKET_MANT WHERE TIPO_ENTIDAD = 'habitacion' AND ID_ENTIDAD = @id AND BORRADO = 0`);
      if (used.recordset[0].cnt > 0) {
        return res.status(400).json({ error: 'No se puede eliminar: hay mantenimientos asociados a esta habitación.' });
      }
    } catch { /* columns may not exist */ }

    await db.request()
      .input('id', sql.VarChar, id)
      .query(`UPDATE HABITACION SET ACTIVO = 0 WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'Habitaciones', id, 'Habitación desactivada');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
