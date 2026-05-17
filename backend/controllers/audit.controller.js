import { getPool, sql } from '../db.js';

export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 30));
    const offset = (page - 1) * limit;

    // Filters
    const { user, action, entity, fechaDesde, fechaHasta, search } = req.query;

    let where = '1=1';
    const db = await getPool();
    const request = db.request();
    const countRequest = db.request();

    if (user) {
      where += ' AND NOMBRE_USUARIO LIKE @user';
      request.input('user', sql.NVarChar, `%${user}%`);
      countRequest.input('user', sql.NVarChar, `%${user}%`);
    }
    if (action) {
      where += ' AND ACCION = @action';
      request.input('action', sql.VarChar, action);
      countRequest.input('action', sql.VarChar, action);
    }
    if (entity) {
      where += ' AND ENTIDAD LIKE @entity';
      request.input('entity', sql.NVarChar, `%${entity}%`);
      countRequest.input('entity', sql.NVarChar, `%${entity}%`);
    }
    if (fechaDesde) {
      where += ' AND FECHA >= @fechaDesde';
      request.input('fechaDesde', sql.Date, fechaDesde);
      countRequest.input('fechaDesde', sql.Date, fechaDesde);
    }
    if (fechaHasta) {
      where += ' AND FECHA < DATEADD(day, 1, @fechaHasta)';
      request.input('fechaHasta', sql.Date, fechaHasta);
      countRequest.input('fechaHasta', sql.Date, fechaHasta);
    }
    if (search) {
      where += ' AND (DESCRIPCION LIKE @search OR NOMBRE_USUARIO LIKE @search OR ENTIDAD LIKE @search OR ID_ENTIDAD LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
      countRequest.input('search', sql.NVarChar, `%${search}%`);
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const [result, countRes] = await Promise.all([
      request.query(`
        SELECT ID as id, FECHA as timestamp, ACCION as actionType, ENTIDAD as entity,
               ID_ENTIDAD as entityId, DESCRIPCION as description,
               ID_USUARIO as userId, NOMBRE_USUARIO as userName
        FROM AUDITORIA
        WHERE ${where}
        ORDER BY FECHA DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `),
      countRequest.query(`SELECT COUNT(*) AS total FROM AUDITORIA WHERE ${where}`),
    ]);

    const total = countRes.recordset[0].total;

    res.json({
      data: result.recordset,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/audit/users — lista de usuarios unicos para el filtro
export const getAuditUsers = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT DISTINCT NOMBRE_USUARIO as nombre
      FROM AUDITORIA
      WHERE NOMBRE_USUARIO IS NOT NULL
      ORDER BY NOMBRE_USUARIO
    `);
    res.json(result.recordset.map(r => r.nombre));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/audit/entities — lista de entidades unicas para el filtro
export const getAuditEntities = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT DISTINCT ENTIDAD as nombre
      FROM AUDITORIA
      WHERE ENTIDAD IS NOT NULL
      ORDER BY ENTIDAD
    `);
    res.json(result.recordset.map(r => r.nombre));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
