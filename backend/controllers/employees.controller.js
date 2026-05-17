import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * GET /api/employees
 * Lista todos los empleados activos.
 */
export const getEmployees = async (req, res) => {
  try {
    const db = await getPool();
    const rows = await db.request().query(`
      SELECT
        e.ID        as id,
        e.NOMBRE    as nombre,
        e.APELLIDO  as apellido,
        e.CEDULA    as cedula,
        e.CARGO     as cargo,
        e.ACTIVO    as activo,
        e.ID_DEPTO  as deptoId,
        o.NOMBRE    as departamento
      FROM EMPLEADO e
      LEFT JOIN UNIDAD_ORG o ON e.ID_DEPTO = o.ID
      WHERE e.ACTIVO = 1
      ORDER BY e.APELLIDO, e.NOMBRE
    `);
    res.json(rows.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/employees/:id
 */
export const getEmployeeById = async (req, res) => {
  try {
    const db = await getPool();
    const row = await db.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query(`
        SELECT e.ID as id, e.NOMBRE as nombre, e.APELLIDO as apellido,
               e.CEDULA as cedula, e.CARGO as cargo, e.ACTIVO as activo,
               e.ID_DEPTO as deptoId, o.NOMBRE as departamento
        FROM EMPLEADO e
        LEFT JOIN UNIDAD_ORG o ON e.ID_DEPTO = o.ID
        WHERE e.ID = @id
      `);
    if (!row.recordset.length) return res.status(404).json({ error: 'Empleado no encontrado.' });
    res.json(row.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/employees
 */
export const createEmployee = async (req, res) => {
  try {
    const { nombre, apellido, cedula, cargo, deptoId, activo } = req.body;
    if (!nombre?.trim() || !apellido?.trim() || !cedula?.trim()) {
      return res.status(400).json({ error: 'Nombre, apellido y cédula son obligatorios.' });
    }
    const db = await getPool();
    const result = await db.request()
      .input('nombre',   sql.NVarChar, nombre.trim())
      .input('apellido', sql.NVarChar, apellido.trim())
      .input('cedula',   sql.VarChar,  cedula.trim())
      .input('cargo',    sql.NVarChar, cargo?.trim() || '')
      .input('deptoId',  sql.VarChar,  deptoId || null)
      .input('activo',   sql.Bit,      activo !== false ? 1 : 0)
      .query(`
        INSERT INTO EMPLEADO (NOMBRE, APELLIDO, CEDULA, CARGO, ID_DEPTO, ACTIVO)
        VALUES (@nombre, @apellido, @cedula, @cargo, @deptoId, @activo)
        RETURNING ID
      `);
    const newId = result.recordset[0].ID;
    await logAudit(req, 'POST', 'Empleados', newId, `Empleado creado: ${nombre} ${apellido}`);
    res.json({ id: newId, success: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.message?.includes('duplicate')) {
      return res.status(409).json({ error: 'Ya existe un empleado con esa cédula.' });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/employees/:id
 */
export const updateEmployee = async (req, res) => {
  try {
    const { nombre, apellido, cedula, cargo, deptoId, activo } = req.body;
    const db = await getPool();
    await db.request()
      .input('id',       sql.Int,      parseInt(req.params.id))
      .input('nombre',   sql.NVarChar, nombre?.trim() || '')
      .input('apellido', sql.NVarChar, apellido?.trim() || '')
      .input('cedula',   sql.VarChar,  cedula?.trim() || '')
      .input('cargo',    sql.NVarChar, cargo?.trim() || '')
      .input('deptoId',  sql.VarChar,  deptoId || null)
      .input('activo',   sql.Bit,      activo !== false ? 1 : 0)
      .query(`
        UPDATE EMPLEADO
        SET NOMBRE=@nombre, APELLIDO=@apellido, CEDULA=@cedula,
            CARGO=@cargo, ID_DEPTO=@deptoId, ACTIVO=@activo
        WHERE ID=@id
      `);
    await logAudit(req, 'PUT', 'Empleados', req.params.id, `Empleado actualizado: ${nombre} ${apellido}`);
    res.json({ success: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.message?.includes('duplicate')) {
      return res.status(409).json({ error: 'Ya existe un empleado con esa cédula.' });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/employees/:id  (baja lógica)
 */
export const deleteEmployee = async (req, res) => {
  try {
    const db = await getPool();
    await db.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query(`UPDATE EMPLEADO SET ACTIVO=0 WHERE ID=@id`);
    await logAudit(req, 'DELETE', 'Empleados', req.params.id, 'Empleado dado de baja');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
