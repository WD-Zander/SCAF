import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getWorkOrders = async (req, res, next) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT
        w.ID as Id, w.TITULO as PlanName, w.ID_ACTIVO as AssetId,
        FORMAT(w.FECHA_INICIO, 'yyyy-MM-dd') as StartDate,
        FORMAT(w.FECHA_FIN, 'yyyy-MM-dd') as EndDate,
        w.ID_ASIGNADO as AssignedTo, w.NOTAS as Notes, w.ESTADO as Status,
        FORMAT(w.FECHA_CREA, 'yyyy-MM-dd HH:mm') as CreatedAt,
        a.NOMBRE as AssetName,
        a.SERIAL as AssetSerial,
        (SELECT COUNT(*) FROM TICKET_MANT m WHERE m.ID_ORDEN_TRAB = w.ID) as TotalTasks,
        (SELECT COUNT(*) FROM TICKET_MANT m WHERE m.ID_ORDEN_TRAB = w.ID AND m.ESTADO = 'COMPLETADO') as CompletedTasks
      FROM ORDEN_TRAB w
      LEFT JOIN ACTIVO a ON w.ID_ACTIVO = a.ID
      ORDER BY w.FECHA_CREA DESC
    `);
    res.json(result.recordset);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteWorkOrder = async (req, res, next) => {
  try {
    const db = await getPool();
    const woId = req.params.id;

    // Verificar que existe
    const check = await db.request().input('id', sql.VarChar, woId)
      .query(`SELECT TOP 1 ID FROM ORDEN_TRAB WHERE ID = @id`);
    if (!check.recordset.length) {
      return res.status(404).json({ error: 'Plan en marcha no encontrado.' });
    }

    // Eliminar físicamente las dependencias de los tickets vinculados a esta orden
    await db.request().input('id', sql.VarChar, woId)
      .query(`DELETE FROM TAREA_TICKET WHERE ID_TICKET IN (SELECT ID FROM TICKET_MANT WHERE ID_ORDEN_TRAB = @id)`);

    await db.request().input('id', sql.VarChar, woId)
      .query(`DELETE FROM REPROGRAMACION WHERE ID_TICKET IN (SELECT ID FROM TICKET_MANT WHERE ID_ORDEN_TRAB = @id)`);

    // Eliminar físicamente los tickets
    await db.request().input('id', sql.VarChar, woId)
      .query(`DELETE FROM TICKET_MANT WHERE ID_ORDEN_TRAB = @id`);

    // Eliminar la orden
    await db.request().input('id', sql.VarChar, woId)
      .query(`DELETE FROM ORDEN_TRAB WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'WorkOrders', woId, 'Plan en marcha eliminado');
    res.json({ success: true });
  } catch(e) { next(e); }
};

export const createWorkOrder = async (req, res, next) => {
  try {
    const { id, name, assetId, startDate, endDate, assignedTo, notes } = req.body;
    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('name', sql.VarChar, name)
      .input('assetId', sql.VarChar, assetId)
      .input('start', sql.Date, startDate)
      .input('end', sql.Date, endDate)
      .input('assigned', sql.VarChar, assignedTo || '')
      .input('notes', sql.NVarChar, notes || '')
      .query(`
        INSERT INTO ORDEN_TRAB (ID, TITULO, ID_ACTIVO, FECHA_INICIO, FECHA_FIN, ID_ASIGNADO, NOTAS)
        VALUES (@id, @name, @assetId, @start, @end,
          (SELECT TOP 1 ID FROM USUARIO WHERE @assigned IS NOT NULL AND @assigned != '' AND NOMBRE = @assigned),
          @notes)
      `);
    await logAudit(req, 'POST', 'WorkOrders', id, `Plan en marcha creado: ${name}`);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};