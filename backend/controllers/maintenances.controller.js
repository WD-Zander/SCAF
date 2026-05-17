import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getMaintenances = async (req, res) => {
  try {
    const all = req.query.all === 'true';
    const from = req.query.from || null;
    const to   = req.query.to   || null;

    const db = await getPool();
    const r = db.request();

    let dateFilter = '';
    if (!all) {
      if (from && to) {
        r.input('from', sql.Date, from);
        r.input('to',   sql.Date, to);
        dateFilter = 'AND m.FECHA_INICIO >= @from AND m.FECHA_INICIO <= @to';
      } else {
        dateFilter = `AND m.FECHA_INICIO >= DATEADD(month, -12, GETDATE())
                      AND m.FECHA_INICIO <= DATEADD(month, 18, GETDATE())`;
      }
    }

    // Intentar con columnas de scope (ID_SCOPE / SCOPE_MANT).
    // Si la migración aún no se ejecutó, cae al query base sin ellas.
    let result;
    try {
      result = await r.query(`
        SELECT
          m.ID as id, m.ID_ACTIVO as assetId,
          ISNULL(m.TIPO_ENTIDAD, 'activo') as entityType,
          ISNULL(m.ID_ENTIDAD, m.ID_ACTIVO) as entityId,
          m.TITULO as title,
          m.ID_TIPO_MANT as typeId, t.NOMBRE as type,
          m.ID_PROVEEDOR as providerId, ISNULL(s.NOMBRE, 'Interno') as provider,
          u.NOMBRE as assignedTo,
          FORMAT(m.FECHA_INICIO, 'yyyy-MM-dd') as startDate, FORMAT(m.FECHA_FIN, 'yyyy-MM-dd') as endDate,
          m.ESTADO as status, m.COSTO as cost, m.DESCRIPCION as description,
          m.ID_PLAN as planId, m.ID_ORDEN_TRAB as workOrderId,
          m.ID_SCOPE as scopeId, sc.SLUG as scope,
          COALESCE(a.NOMBRE, inf.NOMBRE) as entityName
        FROM TICKET_MANT m
        LEFT JOIN TIPO_MANT t ON m.ID_TIPO_MANT = t.ID
        LEFT JOIN PROVEEDOR s ON m.ID_PROVEEDOR = s.ID
        LEFT JOIN USUARIO u ON m.ID_ASIGNADO = u.ID
        LEFT JOIN SCOPE_MANT sc ON m.ID_SCOPE = sc.ID
        LEFT JOIN ACTIVO a ON ISNULL(m.TIPO_ENTIDAD, 'activo') = 'activo' AND ISNULL(m.ID_ENTIDAD, m.ID_ACTIVO) = a.ID
        LEFT JOIN INFRAESTRUCTURA_ITEM inf ON m.TIPO_ENTIDAD != 'activo' AND m.ID_ENTIDAD = inf.ID
        WHERE m.BORRADO = 0
        ${dateFilter}
        ORDER BY m.FECHA_INICIO ASC
      `);
    } catch {
      // Fallback: columnas de scope aún no existen (migración pendiente)
      const r2 = db.request();
      if (from && to) {
        r2.input('from', sql.Date, from);
        r2.input('to',   sql.Date, to);
      }
      result = await r2.query(`
        SELECT
          m.ID as id, m.ID_ACTIVO as assetId, m.TITULO as title,
          m.ID_TIPO_MANT as typeId, t.NOMBRE as type,
          m.ID_PROVEEDOR as providerId, ISNULL(s.NOMBRE, 'Interno') as provider,
          u.NOMBRE as assignedTo,
          FORMAT(m.FECHA_INICIO, 'yyyy-MM-dd') as startDate, FORMAT(m.FECHA_FIN, 'yyyy-MM-dd') as endDate,
          m.ESTADO as status, m.COSTO as cost, m.DESCRIPCION as description,
          m.ID_PLAN as planId, m.ID_ORDEN_TRAB as workOrderId,
          NULL as scopeId, 'activo' as scope
        FROM TICKET_MANT m
        LEFT JOIN TIPO_MANT t ON m.ID_TIPO_MANT = t.ID
        LEFT JOIN PROVEEDOR s ON m.ID_PROVEEDOR = s.ID
        LEFT JOIN USUARIO u ON m.ID_ASIGNADO = u.ID
        WHERE m.BORRADO = 0
        ${dateFilter}
        ORDER BY m.FECHA_INICIO ASC
      `);
    }
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando mantenimientos', detalle: err.message });
  }
};

export const createMaintenance = async (req, res) => {
  try {
    const { id, assetId, title, typeId, type, providerId, provider, assignedTo, startDate, endDate, status, cost, description, planId, workOrderId, scope, entityType, entityId } = req.body;
    const db = await getPool();

    // Resolve subquery values in JS before the INSERT
    const resolvedEntityType = entityType || 'activo';
    const resolvedEntityId = entityId || assetId;

    // Resolve typeId via lookup if not provided
    let resolvedTypeId = typeId || null;
    if (!resolvedTypeId && type) {
      const typeSearch = await db.request()
        .input('type', sql.VarChar, '%' + (type || '') + '%')
        .query(`SELECT ID FROM TIPO_MANT WHERE NOMBRE LIKE @type LIMIT 1`);
      if (typeSearch.recordset.length > 0) {
        resolvedTypeId = typeSearch.recordset[0].ID;
      }
    }
    if (!resolvedTypeId) {
      const fallbackType = await db.request()
        .query(`SELECT ID FROM TIPO_MANT LIMIT 1`);
      if (fallbackType.recordset.length > 0) {
        resolvedTypeId = fallbackType.recordset[0].ID;
      }
    }

    // Resolve providerId via lookup if not provided
    let resolvedProviderId = providerId || null;
    if (!resolvedProviderId && provider) {
      const provSearch = await db.request()
        .input('provider', sql.VarChar, provider)
        .query(`SELECT ID FROM PROVEEDOR WHERE NOMBRE = @provider LIMIT 1`);
      if (provSearch.recordset.length > 0) {
        resolvedProviderId = provSearch.recordset[0].ID;
      }
    }

    // Resolve assignedTo user ID
    let resolvedAssignedId = null;
    if (assignedTo) {
      const userSearch = await db.request()
        .input('assignedTo', sql.VarChar, assignedTo)
        .query(`SELECT ID FROM USUARIO WHERE NOMBRE = @assignedTo LIMIT 1`);
      if (userSearch.recordset.length > 0) {
        resolvedAssignedId = userSearch.recordset[0].ID;
      }
    }

    // Intentar con columna ID_SCOPE. Si la migración no se ejecutó aún, usar INSERT sin esa columna.
    try {
      // Resolve scope ID
      let resolvedScopeId = null;
      const scopeSearch = await db.request()
        .input('scope', sql.VarChar, scope || 'activo')
        .query(`SELECT ID FROM SCOPE_MANT WHERE SLUG = @scope LIMIT 1`);
      if (scopeSearch.recordset.length > 0) {
        resolvedScopeId = scopeSearch.recordset[0].ID;
      }

      await db.request()
        .input('id', sql.VarChar, id)
        .input('assetId', sql.VarChar, resolvedEntityType === 'activo' ? resolvedEntityId : null)
        .input('title', sql.VarChar, title)
        .input('typeId', sql.VarChar, resolvedTypeId)
        .input('providerId', sql.VarChar, resolvedProviderId)
        .input('assignedId', sql.VarChar, resolvedAssignedId)
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate || null)
        .input('status', sql.VarChar, status)
        .input('cost', sql.Decimal, cost || 0)
        .input('desc', sql.NVarChar, description || '')
        .input('planId', sql.VarChar, planId || null)
        .input('workOrderId', sql.VarChar, workOrderId || null)
        .input('scopeId', sql.VarChar, resolvedScopeId)
        .input('entityType', sql.VarChar, resolvedEntityType)
        .input('entityId', sql.VarChar, resolvedEntityId)
        .query(`
          INSERT INTO TICKET_MANT (ID, ID_ACTIVO, TITULO, ID_TIPO_MANT, ID_PROVEEDOR, ID_ASIGNADO, FECHA_INICIO, FECHA_FIN, ESTADO, COSTO, DESCRIPCION, ID_PLAN, ID_ORDEN_TRAB, ID_SCOPE, TIPO_ENTIDAD, ID_ENTIDAD)
          VALUES (@id, @assetId, @title, @typeId, @providerId, @assignedId,
            @startDate, @endDate, @status, @cost, @desc, @planId, @workOrderId,
            @scopeId, @entityType, @entityId)
        `);
    } catch {
      // Fallback: sin columna ID_SCOPE
      await db.request()
        .input('id', sql.VarChar, id)
        .input('assetId', sql.VarChar, assetId)
        .input('title', sql.VarChar, title)
        .input('typeId', sql.VarChar, resolvedTypeId)
        .input('providerId', sql.VarChar, resolvedProviderId)
        .input('assignedId', sql.VarChar, resolvedAssignedId)
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate || null)
        .input('status', sql.VarChar, status)
        .input('cost', sql.Decimal, cost || 0)
        .input('desc', sql.NVarChar, description || '')
        .input('planId', sql.VarChar, planId || null)
        .input('workOrderId', sql.VarChar, workOrderId || null)
        .query(`
          INSERT INTO TICKET_MANT (ID, ID_ACTIVO, TITULO, ID_TIPO_MANT, ID_PROVEEDOR, ID_ASIGNADO, FECHA_INICIO, FECHA_FIN, ESTADO, COSTO, DESCRIPCION, ID_PLAN, ID_ORDEN_TRAB)
          VALUES (@id, @assetId, @title, @typeId, @providerId, @assignedId,
            @startDate, @endDate, @status, @cost, @desc, @planId, @workOrderId)
        `);
    }

    if (planId) {
      const monthIndex = req.body.monthIndex || 1;
      await db.request()
        .input('ticketId', sql.VarChar, id)
        .input('planId', sql.VarChar, planId)
        .input('mIdx', sql.Int, monthIndex)
        .query(`
          INSERT INTO TAREA_TICKET (ID_TICKET, DESCRIPCION)
          SELECT @ticketId, DESCRIPCION
          FROM TAREA_PLAN
          WHERE ID_PLAN = @planId
          AND (
            FRECUENCIA IS NULL OR FRECUENCIA = 'N/A' OR FRECUENCIA = ''
            OR FRECUENCIA = 'Mensual'
            OR (FRECUENCIA = 'Bimestral' AND @mIdx % 2 = 0)
            OR (FRECUENCIA = 'Trimestral' AND @mIdx % 3 = 0)
            OR (FRECUENCIA = 'Cuatrimestral' AND @mIdx % 4 = 0)
            OR (FRECUENCIA = 'Semestral' AND @mIdx % 6 = 0)
            OR (FRECUENCIA = 'Anual' AND @mIdx = 12)
          )
        `);
    } else if (req.body.singleTask) {
      await db.request()
        .input('ticketId', sql.VarChar, id)
        .input('taskDesc', sql.NVarChar, req.body.singleTask)
        .query(`INSERT INTO TAREA_TICKET (ID_TICKET, DESCRIPCION) VALUES (@ticketId, @taskDesc)`);
    }

    await logAudit(req, 'POST', 'Mantenimientos', id, `Ticket ${type} abierto para el activo ${assetId}: ${title}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateMaintenance = async (req, res) => {
  try {
    const { assetId, title, typeId, type, providerId, provider, assignedTo, startDate, endDate, status, cost, description, reprogramReason, scope } = req.body;
    const db = await getPool();
    const ticketId = req.params.id;

    const current = await db.request()
      .input('id', sql.VarChar, ticketId)
      .query(`SELECT FORMAT(FECHA_INICIO,'yyyy-MM-dd') as startDate, FORMAT(FECHA_FIN,'yyyy-MM-dd') as endDate FROM TICKET_MANT WHERE ID=@id`);

    const prev = current.recordset[0] || {};
    const dateChanged = prev.startDate !== startDate || prev.endDate !== (endDate || null);

    if (dateChanged && !reprogramReason?.trim()) {
      return res.status(400).json({ error: 'Debes indicar el motivo de la reprogramación al cambiar las fechas.' });
    }

    // Resolve subquery values in JS before the UPDATE
    let resolvedTypeId = typeId || null;
    if (!resolvedTypeId && type) {
      const typeSearch = await db.request()
        .input('type', sql.VarChar, '%' + (type || '') + '%')
        .query(`SELECT ID FROM TIPO_MANT WHERE NOMBRE LIKE @type LIMIT 1`);
      if (typeSearch.recordset.length > 0) {
        resolvedTypeId = typeSearch.recordset[0].ID;
      }
    }
    if (!resolvedTypeId) {
      const fallbackType = await db.request()
        .query(`SELECT ID FROM TIPO_MANT LIMIT 1`);
      if (fallbackType.recordset.length > 0) {
        resolvedTypeId = fallbackType.recordset[0].ID;
      }
    }

    let resolvedProviderId = providerId || null;
    if (!resolvedProviderId && provider) {
      const provSearch = await db.request()
        .input('provider', sql.VarChar, provider)
        .query(`SELECT ID FROM PROVEEDOR WHERE NOMBRE = @provider LIMIT 1`);
      if (provSearch.recordset.length > 0) {
        resolvedProviderId = provSearch.recordset[0].ID;
      }
    }

    let resolvedAssignedId = null;
    if (assignedTo) {
      const userSearch = await db.request()
        .input('assignedTo', sql.VarChar, assignedTo)
        .query(`SELECT ID FROM USUARIO WHERE NOMBRE = @assignedTo LIMIT 1`);
      if (userSearch.recordset.length > 0) {
        resolvedAssignedId = userSearch.recordset[0].ID;
      }
    }

    // Intentar UPDATE con ID_SCOPE; fallback sin esa columna
    try {
      let resolvedScopeId = null;
      const scopeSearch = await db.request()
        .input('scope', sql.VarChar, scope || 'activo')
        .query(`SELECT ID FROM SCOPE_MANT WHERE SLUG = @scope LIMIT 1`);
      if (scopeSearch.recordset.length > 0) {
        resolvedScopeId = scopeSearch.recordset[0].ID;
      }

      await db.request()
        .input('id', sql.VarChar, ticketId)
        .input('assetId', sql.VarChar, assetId)
        .input('title', sql.VarChar, title)
        .input('typeId', sql.VarChar, resolvedTypeId)
        .input('providerId', sql.VarChar, resolvedProviderId)
        .input('assignedId', sql.VarChar, resolvedAssignedId)
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate || null)
        .input('status', sql.VarChar, status)
        .input('cost', sql.Decimal, cost || 0)
        .input('desc', sql.NVarChar, description || '')
        .input('scopeId', sql.VarChar, resolvedScopeId)
        .query(`
          UPDATE TICKET_MANT SET
            ID_ACTIVO=@assetId, TITULO=@title,
            ID_TIPO_MANT=@typeId,
            ID_PROVEEDOR=@providerId,
            ID_ASIGNADO=@assignedId,
            FECHA_INICIO=@startDate, FECHA_FIN=@endDate, ESTADO=@status, COSTO=@cost, DESCRIPCION=@desc,
            ID_SCOPE=@scopeId,
            FECHA_ACT=GETUTCDATE()
          WHERE ID=@id
        `);
    } catch {
      // Fallback sin ID_SCOPE
      await db.request()
        .input('id', sql.VarChar, ticketId)
        .input('assetId', sql.VarChar, assetId)
        .input('title', sql.VarChar, title)
        .input('typeId', sql.VarChar, resolvedTypeId)
        .input('providerId', sql.VarChar, resolvedProviderId)
        .input('assignedId', sql.VarChar, resolvedAssignedId)
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate || null)
        .input('status', sql.VarChar, status)
        .input('cost', sql.Decimal, cost || 0)
        .input('desc', sql.NVarChar, description || '')
        .query(`
          UPDATE TICKET_MANT SET
            ID_ACTIVO=@assetId, TITULO=@title,
            ID_TIPO_MANT=@typeId,
            ID_PROVEEDOR=@providerId,
            ID_ASIGNADO=@assignedId,
            FECHA_INICIO=@startDate, FECHA_FIN=@endDate, ESTADO=@status, COSTO=@cost, DESCRIPCION=@desc,
            FECHA_ACT=GETUTCDATE()
          WHERE ID=@id
        `);
    }

    if (dateChanged && reprogramReason?.trim()) {
      await db.request()
        .input('ticketId', sql.VarChar, ticketId)
        .input('fecIniOrig', sql.Date, prev.startDate || null)
        .input('fecFinOrig', sql.Date, prev.endDate || null)
        .input('fecIniNueva', sql.Date, startDate)
        .input('fecFinNueva', sql.Date, endDate || null)
        .input('motivo', sql.NVarChar, reprogramReason.trim())
        .input('userId', sql.VarChar, req.user?.id || null)
        .input('userName', sql.VarChar, req.user?.nombre || null)
        .query(`
          INSERT INTO REPROGRAMACION (ID_TICKET, FECHA_INI_ORI, FECHA_FIN_ORI, FECHA_INI_NUE, FECHA_FIN_NUE, MOTIVO, ID_USUARIO, NOMBRE_USUARIO)
          VALUES (@ticketId, @fecIniOrig, @fecFinOrig, @fecIniNueva, @fecFinNueva, @motivo, @userId, @userName)
        `);
    }

    await logAudit(req, 'PUT', 'Mantenimientos', ticketId,
      dateChanged
        ? `Ticket reprogramado. Nuevo estado: ${status}. Motivo: ${reprogramReason}`
        : `Ticket modificado. Nuevo estado: ${status}`
    );
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const getRescheduled = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT
        r.ID as id,
        r.ID_TICKET as ticketId,
        m.TITULO as title,
        a.NOMBRE as assetName,
        a.ID as assetId,
        FORMAT(r.FECHA_INI_ORI, 'yyyy-MM-dd') as originalStart,
        FORMAT(r.FECHA_FIN_ORI, 'yyyy-MM-dd') as originalEnd,
        FORMAT(r.FECHA_INI_NUE, 'yyyy-MM-dd') as newStart,
        FORMAT(r.FECHA_FIN_NUE, 'yyyy-MM-dd') as newEnd,
        r.MOTIVO as reason,
        FORMAT(r.FECHA_CREA, 'yyyy-MM-dd HH:mm') as changedAt,
        r.NOMBRE_USUARIO as changedBy
      FROM REPROGRAMACION r
      LEFT JOIN TICKET_MANT m ON r.ID_TICKET = m.ID
      LEFT JOIN ACTIVO a ON m.ID_ACTIVO = a.ID
      ORDER BY r.FECHA_CREA DESC
    `);
    res.json(result.recordset);
  } catch(e) { res.status(500).json({ error: e.message }); }
};

export const deleteMaintenance = async (req, res) => {
  try {
    const db = await getPool();
    const ticketId = req.params.id;

    const estadoRes = await db.request().input('id', sql.VarChar, ticketId)
      .query(`SELECT ISNULL(ESTADO, '') as estado FROM TICKET_MANT WHERE ID = @id LIMIT 1`);
    const estado = estadoRes.recordset.length > 0 ? estadoRes.recordset[0].estado : '';

    const tareasRes = await db.request().input('id', sql.VarChar, ticketId)
      .query(`SELECT COUNT(*) as cnt FROM TAREA_TICKET WHERE ID_TICKET = @id AND COMPLETADO = 1`);
    const tareasCompletadas = tareasRes.recordset[0].cnt;

    const reprogRes = await db.request().input('id', sql.VarChar, ticketId)
      .query(`SELECT COUNT(*) as cnt FROM REPROGRAMACION WHERE ID_TICKET = @id`);
    const reprogramaciones = reprogRes.recordset[0].cnt;

    if (estado === 'COMPLETADO') {
      return res.status(409).json({ error: 'Este mantenimiento ya fue completado y forma parte del historial operacional.' });
    }
    if (tareasCompletadas > 0) {
      return res.status(409).json({ error: `Este ticket tiene ${tareasCompletadas} tarea(s) completada(s). No puede eliminarse.` });
    }
    if (reprogramaciones > 0) {
      return res.status(409).json({ error: `Este ticket tiene ${reprogramaciones} reprogramación(es) registrada(s). No puede eliminarse.` });
    }

    await db.request().input('id', sql.VarChar, ticketId).query(`DELETE FROM TAREA_TICKET WHERE ID_TICKET=@id`);
    await db.request().input('id', sql.VarChar, ticketId).query(`DELETE FROM REPROGRAMACION WHERE ID_TICKET=@id`);
    await db.request().input('id', sql.VarChar, ticketId).query(`DELETE FROM TICKET_MANT WHERE ID=@id`);
    await logAudit(req, 'DELETE', 'Mantenimientos', ticketId, `Baja de ticket preventivo/correctivo`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const getMaintenanceTasks = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('ticketId', sql.VarChar, req.params.id)
      .query('SELECT ID as Id, ID_TICKET as TicketId, DESCRIPCION as TaskDescription, COMPLETADO as IsCompleted, FECHA_COMP as CompletedAt FROM TAREA_TICKET WHERE ID_TICKET = @ticketId');
    res.json(result.recordset);
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateMaintenanceTask = async (req, res) => {
  try {
    const { isCompleted } = req.body;
    const db = await getPool();
    await db.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .input('completed', sql.Bit, isCompleted ? 1 : 0)
      .query(`
        UPDATE TAREA_TICKET
        SET COMPLETADO = @completed, FECHA_COMP = CASE WHEN @completed = 1 THEN GETDATE() ELSE NULL END
        WHERE ID = @id
      `);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};
