import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

// ── FORMULARIOS ─────────────────────────────────────────────

// GET /api/forms
export const getForms = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT f.ID as id, f.NOMBRE as nombre, f.DESCRIPCION as descripcion,
             f.ACTIVO as activo, FORMAT(f.FECHA_CREA, 'yyyy-MM-dd') as fechaCrea,
             f.CREADO_POR as creadoPor,
             (SELECT COUNT(*) FROM FORMULARIO_CAMPO WHERE ID_FORMULARIO = f.ID AND ACTIVO = 1) as totalCampos,
             (SELECT COUNT(*) FROM FORMULARIO_REGISTRO WHERE ID_FORMULARIO = f.ID) as totalRegistros
      FROM FORMULARIO f
      WHERE f.ACTIVO = 1
      ORDER BY f.FECHA_CREA DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando formularios', detalle: err.message });
  }
};

// GET /api/forms/:id
export const getFormById = async (req, res) => {
  try {
    const db = await getPool();
    const form = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ID as id, NOMBRE as nombre, DESCRIPCION as descripcion,
               ACTIVO as activo, FORMAT(FECHA_CREA, 'yyyy-MM-dd') as fechaCrea,
               CREADO_POR as creadoPor
        FROM FORMULARIO WHERE ID = @id
      `);

    if (!form.recordset.length) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    const campos = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ID as id, NOMBRE as nombre, TIPO as tipo, REQUERIDO as requerido,
               OPCIONES as opciones, ORDEN as orden
        FROM FORMULARIO_CAMPO
        WHERE ID_FORMULARIO = @id AND ACTIVO = 1
        ORDER BY ORDEN ASC
      `);

    res.json({ ...form.recordset[0], campos: campos.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/forms
export const createForm = async (req, res) => {
  try {
    const { nombre, descripcion, campos } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    const db = await getPool();
    const result = await db.request()
      .input('nombre', sql.NVarChar, nombre.trim())
      .input('descripcion', sql.NVarChar, descripcion || null)
      .input('creadoPor', sql.NVarChar, req.user?.name || null)
      .query(`
        INSERT INTO FORMULARIO (NOMBRE, DESCRIPCION, CREADO_POR)
        VALUES (@nombre, @descripcion, @creadoPor)
        RETURNING ID
      `);

    const formId = result.recordset[0].ID;

    // Insertar campos si vienen
    if (campos?.length) {
      for (let i = 0; i < campos.length; i++) {
        const c = campos[i];
        await db.request()
          .input('idForm', sql.Int, formId)
          .input('nombre', sql.NVarChar, c.nombre)
          .input('tipo', sql.NVarChar, c.tipo)
          .input('requerido', sql.Bit, c.requerido ? 1 : 0)
          .input('opciones', sql.NVarChar, c.opciones ? JSON.stringify(c.opciones) : null)
          .input('orden', sql.Int, i)
          .query(`
            INSERT INTO FORMULARIO_CAMPO (ID_FORMULARIO, NOMBRE, TIPO, REQUERIDO, OPCIONES, ORDEN)
            VALUES (@idForm, @nombre, @tipo, @requerido, @opciones, @orden)
          `);
      }
    }

    await logAudit(req, 'POST', 'Formularios', formId, `Formulario creado: ${nombre}`);
    res.json({ success: true, id: formId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/forms/:id
export const updateForm = async (req, res) => {
  try {
    const { nombre, descripcion, campos } = req.body;
    const id = parseInt(req.params.id);

    const db = await getPool();
    await db.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar, nombre?.trim() || '')
      .input('descripcion', sql.NVarChar, descripcion || null)
      .query(`
        UPDATE FORMULARIO
        SET NOMBRE = @nombre, DESCRIPCION = @descripcion
        WHERE ID = @id
      `);

    // Reemplazar campos: desactivar todos y re-insertar
    if (campos) {
      await db.request()
        .input('id', sql.Int, id)
        .query(`UPDATE FORMULARIO_CAMPO SET ACTIVO = 0 WHERE ID_FORMULARIO = @id`);

      for (let i = 0; i < campos.length; i++) {
        const c = campos[i];
        await db.request()
          .input('idForm', sql.Int, id)
          .input('nombre', sql.NVarChar, c.nombre)
          .input('tipo', sql.NVarChar, c.tipo)
          .input('requerido', sql.Bit, c.requerido ? 1 : 0)
          .input('opciones', sql.NVarChar, c.opciones ? JSON.stringify(c.opciones) : null)
          .input('orden', sql.Int, i)
          .query(`
            INSERT INTO FORMULARIO_CAMPO (ID_FORMULARIO, NOMBRE, TIPO, REQUERIDO, OPCIONES, ORDEN)
            VALUES (@idForm, @nombre, @tipo, @requerido, @opciones, @orden)
          `);
      }
    }

    await logAudit(req, 'PUT', 'Formularios', id, `Formulario actualizado: ${nombre}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/forms/:id
export const deleteForm = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = await getPool();

    await db.request()
      .input('id', sql.Int, id)
      .query(`UPDATE FORMULARIO SET ACTIVO = 0 WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'Formularios', id, 'Formulario desactivado');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── REGISTROS (respuestas de formulario) ────────────────────

// GET /api/forms/:id/records
export const getFormRecords = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ID as id, DATOS as datos,
               FORMAT(FECHA_CREA, 'yyyy-MM-dd HH:mm') as fechaCrea,
               CREADO_POR as creadoPor
        FROM FORMULARIO_REGISTRO
        WHERE ID_FORMULARIO = @id
        ORDER BY FECHA_CREA DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/forms/:id/records
export const createFormRecord = async (req, res) => {
  try {
    const { datos } = req.body;
    const formId = parseInt(req.params.id);

    const db = await getPool();
    const result = await db.request()
      .input('idForm', sql.Int, formId)
      .input('datos', sql.NVarChar, JSON.stringify(datos))
      .input('creadoPor', sql.NVarChar, req.user?.name || null)
      .query(`
        INSERT INTO FORMULARIO_REGISTRO (ID_FORMULARIO, DATOS, CREADO_POR)
        VALUES (@idForm, @datos, @creadoPor)
        RETURNING ID
      `);

    await logAudit(req, 'POST', 'FormularioRegistros', result.recordset[0].ID, `Registro en formulario #${formId}`);
    res.json({ success: true, id: result.recordset[0].ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/forms/:formId/records/:recordId
export const deleteFormRecord = async (req, res) => {
  try {
    const db = await getPool();
    await db.request()
      .input('id', sql.Int, req.params.recordId)
      .query(`DELETE FROM FORMULARIO_REGISTRO WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'FormularioRegistros', req.params.recordId, 'Registro eliminado');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
