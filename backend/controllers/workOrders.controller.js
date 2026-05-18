import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getWorkOrders = async (req, res, next) => {
  try {
    const db = await getPool();
    let result;
    try {
      result = await db.request().query(`
        SELECT
          w.ID as "Id", w.TITULO as "PlanName", w.ID_ACTIVO as "AssetId",
          COALESCE(w.TIPO_ENTIDAD, 'activo') as "EntityType",
          COALESCE(w.ID_ENTIDAD, w.ID_ACTIVO) as "EntityId",
          TO_CHAR(w.FECHA_INICIO, 'YYYY-MM-DD') as "StartDate",
          TO_CHAR(w.FECHA_FIN, 'YYYY-MM-DD') as "EndDate",
          w.ID_ASIGNADO as "AssignedTo", w.NOTAS as "Notes", w.ESTADO as "Status",
          TO_CHAR(w.FECHA_CREA, 'YYYY-MM-DD HH24:MI') as "CreatedAt",
          COALESCE(a.NOMBRE, inf.NOMBRE) as "AssetName",
          a.SERIAL as "AssetSerial",
          sc.SLUG as "Scope",
          (SELECT COUNT(*) FROM TICKET_MANT m WHERE m.ID_ORDEN_TRAB = w.ID) as "TotalTasks",
          (SELECT COUNT(*) FROM TICKET_MANT m WHERE m.ID_ORDEN_TRAB = w.ID AND m.ESTADO = 'COMPLETADO') as "CompletedTasks"
        FROM ORDEN_TRAB w
        LEFT JOIN ACTIVO a ON COALESCE(w.TIPO_ENTIDAD, 'activo') = 'activo' AND COALESCE(w.ID_ENTIDAD, w.ID_ACTIVO) = a.ID
        LEFT JOIN INFRAESTRUCTURA_ITEM inf ON w.TIPO_ENTIDAD != 'activo' AND w.ID_ENTIDAD = inf.ID
        LEFT JOIN SCOPE_MANT sc ON w.ID_SCOPE = sc.ID
        ORDER BY w.FECHA_CREA DESC
      `);
    } catch {
      // Fallback: ID_SCOPE column doesn't exist yet
      result = await db.request().query(`
        SELECT
          w.ID as "Id", w.TITULO as "PlanName", w.ID_ACTIVO as "AssetId",
          TO_CHAR(w.FECHA_INICIO, 'YYYY-MM-DD') as "StartDate",
          TO_CHAR(w.FECHA_FIN, 'YYYY-MM-DD') as "EndDate",
          w.ID_ASIGNADO as "AssignedTo", w.NOTAS as "Notes", w.ESTADO as "Status",
          TO_CHAR(w.FECHA_CREA, 'YYYY-MM-DD HH24:MI') as "CreatedAt",
          a.NOMBRE as "AssetName",
          a.SERIAL as "AssetSerial",
          'activo' as "Scope",
          (SELECT COUNT(*) FROM TICKET_MANT m WHERE m.ID_ORDEN_TRAB = w.ID) as "TotalTasks",
          (SELECT COUNT(*) FROM TICKET_MANT m WHERE m.ID_ORDEN_TRAB = w.ID AND m.ESTADO = 'COMPLETADO') as "CompletedTasks"
        FROM ORDEN_TRAB w
        LEFT JOIN ACTIVO a ON w.ID_ACTIVO = a.ID
        ORDER BY w.FECHA_CREA DESC
      `);
    }
    res.json(result.recordset);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteWorkOrder = async (req, res, next) => {
  try {
    const db = await getPool();
    const woId = req.params.id;

    const check = await db.request().input('id', sql.VarChar, woId)
      .query(`SELECT ID FROM ORDEN_TRAB WHERE ID = @id LIMIT 1`);
    if (!check.recordset.length) {
      return res.status(404).json({ error: 'Plan en marcha no encontrado.' });
    }

    await db.request().input('id', sql.VarChar, woId)
      .query(`DELETE FROM TAREA_TICKET WHERE ID_TICKET IN (SELECT ID FROM TICKET_MANT WHERE ID_ORDEN_TRAB = @id)`);

    await db.request().input('id', sql.VarChar, woId)
      .query(`DELETE FROM REPROGRAMACION WHERE ID_TICKET IN (SELECT ID FROM TICKET_MANT WHERE ID_ORDEN_TRAB = @id)`);

    await db.request().input('id', sql.VarChar, woId)
      .query(`DELETE FROM TICKET_MANT WHERE ID_ORDEN_TRAB = @id`);

    await db.request().input('id', sql.VarChar, woId)
      .query(`DELETE FROM ORDEN_TRAB WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'WorkOrders', woId, 'Plan en marcha eliminado');
    res.json({ success: true });
  } catch(e) { next(e); }
};

export const createWorkOrder = async (req, res, next) => {
  try {
    const { id, name, assetId, startDate, endDate, assignedTo, notes, scope, entityType, entityId } = req.body;
    const db = await getPool();

    const resolvedEntityType = entityType || 'activo';
    const resolvedEntityId = entityId || assetId;

    // Resolve assignedTo user ID in JS to avoid PostgreSQL parameter type ambiguity
    let resolvedAssignedId = null;
    if (assignedTo) {
      const userSearch = await db.request()
        .input('assignedTo', sql.VarChar, assignedTo)
        .query(`SELECT ID FROM USUARIO WHERE NOMBRE = @assignedTo LIMIT 1`);
      if (userSearch.recordset.length > 0) {
        resolvedAssignedId = userSearch.recordset[0].ID;
      }
    }

    // Resolve scope ID
    let resolvedScopeId = null;
    try {
      const scopeSearch = await db.request()
        .input('scope', sql.VarChar, scope || 'activo')
        .query(`SELECT ID FROM SCOPE_MANT WHERE SLUG = @scope LIMIT 1`);
      if (scopeSearch.recordset.length > 0) {
        resolvedScopeId = scopeSearch.recordset[0].ID;
      }
    } catch { /* SCOPE_MANT may not exist yet */ }

    try {
      await db.request()
        .input('id', sql.VarChar, id)
        .input('name', sql.VarChar, name)
        .input('assetId', sql.VarChar, resolvedEntityType === 'activo' ? resolvedEntityId : null)
        .input('start', sql.Date, startDate)
        .input('end', sql.Date, endDate)
        .input('assignedId', sql.VarChar, resolvedAssignedId)
        .input('notes', sql.NVarChar, notes || '')
        .input('scopeId', sql.Int, resolvedScopeId)
        .input('entityType', sql.VarChar, resolvedEntityType)
        .input('entityId', sql.VarChar, resolvedEntityId)
        .query(`
          INSERT INTO ORDEN_TRAB (ID, TITULO, ID_ACTIVO, FECHA_INICIO, FECHA_FIN, ID_ASIGNADO, NOTAS, ID_SCOPE, TIPO_ENTIDAD, ID_ENTIDAD)
          VALUES (@id, @name, @assetId, @start, @end, @assignedId, @notes, @scopeId, @entityType, @entityId)
        `);
    } catch {
      // Fallback: ID_SCOPE column doesn't exist yet
      await db.request()
        .input('id', sql.VarChar, id)
        .input('name', sql.VarChar, name)
        .input('assetId', sql.VarChar, assetId)
        .input('start', sql.Date, startDate)
        .input('end', sql.Date, endDate)
        .input('assignedId', sql.VarChar, resolvedAssignedId)
        .input('notes', sql.NVarChar, notes || '')
        .query(`
          INSERT INTO ORDEN_TRAB (ID, TITULO, ID_ACTIVO, FECHA_INICIO, FECHA_FIN, ID_ASIGNADO, NOTAS)
          VALUES (@id, @name, @assetId, @start, @end, @assignedId, @notes)
        `);
    }

    await logAudit(req, 'POST', 'WorkOrders', id, `Plan en marcha creado: ${name}`);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
