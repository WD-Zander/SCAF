import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * POST /api/movements
 * Registra un movimiento de activo: actualiza ubicación/departamento/área/estado
 * y deja trazabilidad en la tabla MOVIMIENTO.
 */
export const createMovement = async (req, res) => {
  try {
    const { assetId, newLocation, newDepartment, newArea, newStatus, observation } = req.body;

    if (!assetId) return res.status(400).json({ error: 'El ID del activo es requerido.' });
    if (!observation?.trim()) return res.status(400).json({ error: 'La observación es obligatoria.' });

    const db = await getPool();

    // 1. Leer estado actual del activo
    const current = await db.request()
      .input('aid', sql.VarChar, assetId)
      .query(`
        SELECT a.UBICACION, a.AREA, ea.NOMBRE as ESTADO, o.NOMBRE as DEPTO
        FROM ACTIVO a
        LEFT JOIN UNIDAD_ORG o ON a.ID_DEPTO = o.ID
        LEFT JOIN ESTADO_ACTIVO ea ON a.ID_ESTADO = ea.ID
        WHERE a.ID = @aid AND a.BORRADO = 0
      `);

    if (!current.recordset.length) {
      return res.status(404).json({ error: 'Activo no encontrado.' });
    }

    const prev = current.recordset[0];

    // 2. Construir SET dinámico — solo actualizar campos que el usuario cambió
    const updates = [];
    const r = db.request().input('aid', sql.VarChar, assetId);

    if (newLocation !== undefined && newLocation !== null) {
      updates.push('UBICACION = @loc');
      r.input('loc', sql.NVarChar, newLocation);
    }
    if (newDepartment !== undefined && newDepartment !== null) {
      updates.push('ID_DEPTO = (SELECT TOP 1 ID FROM UNIDAD_ORG WHERE @dep IS NOT NULL AND @dep != \'\' AND NOMBRE = @dep)');
      r.input('dep', sql.NVarChar, newDepartment);
    }
    if (newArea !== undefined && newArea !== null) {
      updates.push('AREA = @area');
      r.input('area', sql.NVarChar, newArea);
    }
    if (newStatus !== undefined && newStatus !== null) {
      updates.push('ID_ESTADO = (SELECT TOP 1 ID FROM ESTADO_ACTIVO WHERE NOMBRE = @status)');
      r.input('status', sql.VarChar, newStatus);
    }

    if (updates.length > 0) {
      updates.push('FECHA_ACT = GETUTCDATE()');
      await r.query(`UPDATE ACTIVO SET ${updates.join(', ')} WHERE ID = @aid AND BORRADO = 0`);
    }

    // 3. Insertar registro en MOVIMIENTO
    const userId = req.user?.id || null;
    const userName = req.user?.name || req.user?.username || null;

    await db.request()
      .input('assetId',  sql.VarChar,  assetId)
      .input('locAnt',   sql.NVarChar, prev.UBICACION || '')
      .input('locNue',   sql.NVarChar, newLocation ?? prev.UBICACION ?? '')
      .input('depAnt',   sql.NVarChar, prev.DEPTO || '')
      .input('depNue',   sql.NVarChar, newDepartment ?? prev.DEPTO ?? '')
      .input('areaAnt',  sql.NVarChar, prev.AREA || '')
      .input('areaNue',  sql.NVarChar, newArea ?? prev.AREA ?? '')
      .input('estAnt',   sql.VarChar,  prev.ESTADO || '')
      .input('estNue',   sql.VarChar,  newStatus ?? prev.ESTADO ?? '')
      .input('obs',      sql.NVarChar, observation.trim())
      .input('userId',   sql.VarChar,  userId)
      .input('userName', sql.NVarChar, userName)
      .query(`
        INSERT INTO MOVIMIENTO (
          ID_ACTIVO, UBICACION_ANT, UBICACION_NUE,
          DEPTO_ANT, DEPTO_NUE, AREA_ANT, AREA_NUE,
          ESTADO_ANT, ESTADO_NUE, OBSERVACION, ID_USUARIO, NOMBRE_USUARIO
        ) VALUES (
          @assetId, @locAnt, @locNue,
          @depAnt, @depNue, @areaAnt, @areaNue,
          @estAnt, @estNue, @obs, @userId, @userName
        )
      `);

    await logAudit(req, 'MOVE', 'Activos', assetId,
      `Movimiento registrado. Obs: ${observation.trim().substring(0, 100)}`);

    res.json({ success: true });
  } catch (err) {
    console.error('Error en createMovement:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/movements
 * Lista todos los movimientos (paginado).
 */
export const getAllMovements = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    const db = await getPool();

    const rows = await db.request()
      .input('offset', offset)
      .input('limit', limit)
      .input('search', `%${search}%`)
      .query(`
        SELECT
          m.ID as id,
          m.ID_ACTIVO as assetId,
          a.NOMBRE as assetName,
          m.UBICACION_ANT as locationFrom, m.UBICACION_NUE as locationTo,
          m.DEPTO_ANT as deptFrom, m.DEPTO_NUE as deptTo,
          m.AREA_ANT as areaFrom, m.AREA_NUE as areaTo,
          m.ESTADO_ANT as statusFrom, m.ESTADO_NUE as statusTo,
          m.OBSERVACION as observation,
          m.NOMBRE_USUARIO as changedBy,
          FORMAT(m.FECHA, 'yyyy-MM-ddTHH:mm:ss') as changedAt
        FROM MOVIMIENTO m
        LEFT JOIN ACTIVO a ON m.ID_ACTIVO = a.ID
        WHERE @search = '%%'
          OR m.ID_ACTIVO LIKE @search
          OR a.NOMBRE LIKE @search
          OR m.OBSERVACION LIKE @search
        ORDER BY m.FECHA DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    const countRow = await db.request()
      .input('search', `%${search}%`)
      .query(`
        SELECT COUNT(*) as total FROM MOVIMIENTO m
        LEFT JOIN ACTIVO a ON m.ID_ACTIVO = a.ID
        WHERE @search = '%%'
          OR m.ID_ACTIVO LIKE @search
          OR a.NOMBRE LIKE @search
          OR m.OBSERVACION LIKE @search
      `);

    res.json({
      data: rows.recordset,
      total: countRow.recordset[0].total,
      page,
      pages: Math.ceil(countRow.recordset[0].total / limit),
    });
  } catch (err) {
    console.error('Error en getAllMovements:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/movements/asset/:assetId
 * Historial de movimientos de un activo específico.
 */
export const getMovementsByAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const db = await getPool();

    const rows = await db.request()
      .input('assetId', sql.VarChar, assetId)
      .query(`
        SELECT
          m.ID as id,
          m.ID_ACTIVO as assetId,
          a.NOMBRE as assetName,
          m.UBICACION_ANT as locationFrom, m.UBICACION_NUE as locationTo,
          m.DEPTO_ANT as deptFrom, m.DEPTO_NUE as deptTo,
          m.AREA_ANT as areaFrom, m.AREA_NUE as areaTo,
          m.ESTADO_ANT as statusFrom, m.ESTADO_NUE as statusTo,
          m.OBSERVACION as observation,
          m.NOMBRE_USUARIO as changedBy,
          FORMAT(m.FECHA, 'yyyy-MM-ddTHH:mm:ss') as changedAt
        FROM MOVIMIENTO m
        LEFT JOIN ACTIVO a ON m.ID_ACTIVO = a.ID
        WHERE m.ID_ACTIVO = @assetId
        ORDER BY m.FECHA DESC
      `);

    res.json(rows.recordset);
  } catch (err) {
    console.error('Error en getMovementsByAsset:', err);
    res.status(500).json({ error: err.message });
  }
};