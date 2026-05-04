import { getPool } from '../db.js';

export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const db = await getPool();

    const [result, countRes] = await Promise.all([
      db.request()
        .input('offset', offset)
        .input('limit', limit)
        .query(`
          SELECT ID as id, FECHA as timestamp, ACCION as actionType, ENTIDAD as entity,
                 ID_ENTIDAD as entityId, DESCRIPCION as description, ID_USUARIO as userId, NOMBRE_USUARIO as userName
          FROM AUDITORIA
          ORDER BY FECHA DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `),
      db.request().query('SELECT COUNT(*) AS total FROM AUDITORIA'),
    ]);

    res.json({
      data: result.recordset,
      total: countRes.recordset[0].total,
      page,
      pages: Math.ceil(countRes.recordset[0].total / limit),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};