import { getPool } from '../db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const db = await getPool();

    const [kpisRes, byStatusRes, alertsRes, overdueRes, activityRes, workOrdersRes] = await Promise.all([
      // KPIs financieros y conteos
      db.request().query(`
        SELECT
          COUNT(*) AS totalAssets,
          ISNULL(SUM(COSTO_ADQUIS), 0) AS totalAcquisitionValue,
          ISNULL(SUM(VALOR_ACTUAL), 0) AS totalCurrentValue,
          ISNULL(SUM(COSTO_ADQUIS) - SUM(VALOR_ACTUAL), 0) AS totalDepreciation
        FROM ACTIVO WHERE BORRADO = 0
      `),

      // Activos agrupados por estado (join a ESTADO_ACTIVO para nombre y color)
      db.request().query(`
        SELECT ea.NOMBRE AS status, ea.COLOR AS color, COUNT(*) AS count
        FROM ACTIVO a
        JOIN ESTADO_ACTIVO ea ON a.ID_ESTADO = ea.ID
        WHERE a.BORRADO = 0
        GROUP BY ea.NOMBRE, ea.COLOR
        ORDER BY count DESC
      `),

      // Mantenimientos próximos (hoy + 15 días)
      db.request().query(`
        SELECT TOP 10
          t.ID as id, t.TITULO as title,
          a.NOMBRE as assetName, a.ID as assetId,
          FORMAT(t.FECHA_FIN, 'yyyy-MM-dd') as dueDate,
          t.ESTADO as status,
          ISNULL(tm.NOMBRE, 'Preventivo') as type
        FROM TICKET_MANT t
        LEFT JOIN ACTIVO a ON t.ID_ACTIVO = a.ID
        LEFT JOIN TIPO_MANT tm ON t.ID_TIPO_MANT = tm.ID
        WHERE t.BORRADO = 0
          AND t.ESTADO NOT IN ('COMPLETADO')
          AND t.FECHA_FIN BETWEEN GETDATE() AND DATEADD(DAY, 15, GETDATE())
        ORDER BY t.FECHA_FIN ASC
      `),

      // Mantenimientos vencidos (sin completar y fecha pasada)
      db.request().query(`
        SELECT COUNT(*) AS overdueCount
        FROM TICKET_MANT
        WHERE BORRADO = 0
          AND ESTADO NOT IN ('COMPLETADO')
          AND FECHA_FIN < GETDATE()
      `),

      // Actividad reciente (últimas 10 acciones de auditoría)
      db.request().query(`
        SELECT TOP 10
          ACCION as action, ENTIDAD as entity, DESCRIPCION as description,
          NOMBRE_USUARIO as userName,
          FORMAT(FECHA, 'yyyy-MM-dd HH:mm:ss') as timestamp
        FROM AUDITORIA
        ORDER BY FECHA DESC
      `),

      // Órdenes de trabajo activas
      db.request().query(`
        SELECT COUNT(*) AS activeWorkOrders
        FROM ORDEN_TRAB
        WHERE ESTADO IN ('PENDIENTE', 'EN PROCESO')
      `),
    ]);

    const kpis = kpisRes.recordset[0];

    // Contar activos en mantenimiento activo
    const inMaintenanceRes = await db.request().query(`
      SELECT COUNT(DISTINCT ID_ACTIVO) AS inMaintenance
      FROM TICKET_MANT
      WHERE BORRADO = 0 AND ESTADO IN ('PENDIENTE', 'EN PROCESO')
    `);

    res.json({
      kpis: {
        totalAssets: kpis.totalAssets,
        totalAcquisitionValue: Number(kpis.totalAcquisitionValue),
        totalCurrentValue: Number(kpis.totalCurrentValue),
        totalDepreciation: Number(kpis.totalDepreciation),
        assetsInMaintenance: inMaintenanceRes.recordset[0].inMaintenance,
        overdueMaintenances: overdueRes.recordset[0].overdueCount,
        activeWorkOrders: workOrdersRes.recordset[0].activeWorkOrders,
      },
      assetsByStatus: byStatusRes.recordset,
      upcomingMaintenances: alertsRes.recordset,
      recentActivity: activityRes.recordset,
    });
  } catch (err) {
    console.error('Error en dashboard:', err);
    res.status(500).json({ error: 'Error consultando estadísticas del dashboard' });
  }
};