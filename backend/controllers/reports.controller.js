import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

// GET /api/reports
export const getReports = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT ID as id, NOMBRE as nombre, DESCRIPCION as descripcion,
             CONSULTA_SQL as consultaSql, VARIABLES as variables,
             FORMAT(FECHA_CREA, 'yyyy-MM-dd') as fechaCrea,
             FORMAT(FECHA_MODIFICA, 'yyyy-MM-dd') as fechaModifica,
             CREADO_POR as creadoPor
      FROM INFORME
      WHERE ACTIVO = 1
      ORDER BY FECHA_CREA DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando informes', detalle: err.message });
  }
};

// GET /api/reports/:id
export const getReportById = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ID as id, NOMBRE as nombre, DESCRIPCION as descripcion,
               CONSULTA_SQL as consultaSql, VARIABLES as variables,
               FORMAT(FECHA_CREA, 'yyyy-MM-dd') as fechaCrea,
               CREADO_POR as creadoPor
        FROM INFORME WHERE ID = @id AND ACTIVO = 1
      `);
    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Informe no encontrado' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/reports
export const createReport = async (req, res) => {
  try {
    const { nombre, descripcion, consultaSql, variables } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }
    if (!consultaSql?.trim()) {
      return res.status(400).json({ error: 'La consulta SQL es obligatoria.' });
    }

    const db = await getPool();
    const result = await db.request()
      .input('nombre', sql.NVarChar, nombre.trim())
      .input('descripcion', sql.NVarChar, descripcion || null)
      .input('consultaSql', sql.NVarChar, consultaSql.trim())
      .input('variables', sql.NVarChar, variables ? JSON.stringify(variables) : null)
      .input('creadoPor', sql.NVarChar, req.user?.name || null)
      .query(`
        INSERT INTO INFORME (NOMBRE, DESCRIPCION, CONSULTA_SQL, VARIABLES, CREADO_POR)
        VALUES (@nombre, @descripcion, @consultaSql, @variables, @creadoPor)
        RETURNING ID
      `);

    await logAudit(req, 'POST', 'Informes', result.recordset[0].ID, `Informe creado: ${nombre}`);
    res.json({ success: true, id: result.recordset[0].ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/reports/:id
export const updateReport = async (req, res) => {
  try {
    const { nombre, descripcion, consultaSql, variables } = req.body;
    const id = parseInt(req.params.id);

    const db = await getPool();
    await db.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar, nombre?.trim() || '')
      .input('descripcion', sql.NVarChar, descripcion || null)
      .input('consultaSql', sql.NVarChar, consultaSql?.trim() || '')
      .input('variables', sql.NVarChar, variables ? JSON.stringify(variables) : null)
      .query(`
        UPDATE INFORME
        SET NOMBRE = @nombre, DESCRIPCION = @descripcion,
            CONSULTA_SQL = @consultaSql, VARIABLES = @variables,
            FECHA_MODIFICA = GETDATE()
        WHERE ID = @id
      `);

    await logAudit(req, 'PUT', 'Informes', id, `Informe actualizado: ${nombre}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/reports/:id
export const deleteReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = await getPool();
    await db.request()
      .input('id', sql.Int, id)
      .query(`UPDATE INFORME SET ACTIVO = 0 WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'Informes', id, 'Informe desactivado');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/reports/execute — Ejecutar un query SQL y devolver resultados
export const executeQuery = async (req, res) => {
  try {
    const { consultaSql, variables } = req.body;
    if (!consultaSql?.trim()) {
      return res.status(400).json({ error: 'La consulta SQL es obligatoria.' });
    }

    // Solo permitir SELECT para seguridad
    const trimmed = consultaSql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH') && !trimmed.startsWith('DECLARE')) {
      return res.status(400).json({ error: 'Solo se permiten consultas SELECT / WITH / DECLARE.' });
    }

    // Bloquear operaciones peligrosas
    const forbidden = ['INSERT ', 'UPDATE ', 'DELETE ', 'DROP ', 'ALTER ', 'TRUNCATE ', 'EXEC ', 'EXECUTE ', 'CREATE ', 'GRANT ', 'REVOKE '];
    // Check after removing DECLARE blocks (which might contain SET)
    const upperSql = consultaSql.toUpperCase();
    for (const kw of forbidden) {
      // Allow these keywords only inside string literals — simple heuristic
      if (upperSql.includes(kw)) {
        return res.status(400).json({ error: `Operacion no permitida: ${kw.trim()}` });
      }
    }

    const db = await getPool();
    const request = db.request();
    request.timeout = 30000; // 30s max

    // Bind variables if provided
    if (variables?.length) {
      for (const v of variables) {
        const sqlType = v.tipo === 'number' ? sql.Float
          : v.tipo === 'date' ? sql.Date
          : sql.NVarChar;
        request.input(v.nombre, sqlType, v.valor ?? v.valorDefault ?? null);
      }
    }

    const result = await request.query(consultaSql);
    const data = result.recordset || [];
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    res.json({ columns, data, total: data.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
