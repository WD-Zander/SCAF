import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAssets = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(5000, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    // Orden dinámico — solo columnas permitidas para evitar SQL injection
    const SORT_MAP = {
      id: 'a.ID',
      name: 'a.NOMBRE',
      category: 'c.NOMBRE',
      serial: 'a.SERIAL',
      status: 'ea.NOMBRE',
    };
    const sortKey = SORT_MAP[req.query.sortKey] || 'a.FECHA_CREA';
    const sortDir = req.query.sortDir === 'asc' ? 'ASC' : 'DESC';

    const db = await getPool();
    const req_ = db.request()
      .input('offset', offset)
      .input('limit', limit)
      .input('search', `%${search}%`);

    const result = await req_.query(`
      SELECT
        a.ID as id, a.NOMBRE as name, a.MARCA as brand, a.MODELO as model, a.SERIAL as serial,
        ea.NOMBRE as status, ea.COLOR as statusColor, a.DESCRIPCION as description,
        a.ID_CATEGORIA as categoryId, c.NOMBRE AS category,
        a.FAMILIA as family, a.SUBFAM as subFamily,
        a.ID_DEPTO as departmentId, d.NOMBRE AS department,
        TO_CHAR(a.FECHA_INGRESO, 'YYYY-MM-DD') as entryDate, a.COSTO_ADQUIS as acquisitionCost,
        a.ID_CUSTODIO as assignedToId, u.NOMBRE as assignedTo,
        a.ID_PROVEEDOR as supplierId, s.NOMBRE as supplier,
        a.UBICACION as location, a.AREA as area,
        a.OBSERVACIONES as observations, a.VALOR_ACTUAL as currentValue,
        a.FOTO_URL as photoUrl, a.FACTURA_URL as invoiceUrl,
        c.ID_SCOPE as scopeId
      FROM ACTIVO a
      LEFT JOIN CATEGORIA c ON a.ID_CATEGORIA = c.ID
      LEFT JOIN UNIDAD_ORG d ON a.ID_DEPTO = d.ID
      LEFT JOIN USUARIO u ON a.ID_CUSTODIO = u.ID
      LEFT JOIN PROVEEDOR s ON a.ID_PROVEEDOR = s.ID
      LEFT JOIN ESTADO_ACTIVO ea ON a.ID_ESTADO = ea.ID
      WHERE a.BORRADO = FALSE
        AND (@search = '%%' OR a.NOMBRE LIKE @search OR a.SERIAL LIKE @search OR a.MARCA LIKE @search OR a.ID::TEXT LIKE @search)
      ORDER BY ${sortKey} ${sortDir}
      LIMIT @limit OFFSET @offset
    `);

    const countRes = await db.request()
      .input('search', `%${search}%`)
      .query(`
        SELECT COUNT(*) AS total FROM ACTIVO
        WHERE BORRADO = FALSE
          AND (@search = '%%' OR NOMBRE LIKE @search OR SERIAL LIKE @search OR MARCA LIKE @search)
      `);

    res.json({
      data: result.recordset,
      total: countRes.recordset[0].total,
      page,
      pages: Math.ceil(countRes.recordset[0].total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor consultando Activos' });
  }
};

export const getAssetById = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('id', sql.VarChar, req.params.id)
      .query(`
        SELECT
          a.ID as id, a.NOMBRE as name, a.MARCA as brand, a.MODELO as model, a.SERIAL as serial,
          ea.NOMBRE as status, ea.COLOR as statusColor, a.DESCRIPCION as description,
          a.ID_CATEGORIA as categoryId, c.NOMBRE AS category,
          a.FAMILIA as family, a.SUBFAM as subFamily,
          a.ID_DEPTO as departmentId, d.NOMBRE AS department,
          TO_CHAR(a.FECHA_INGRESO, 'YYYY-MM-DD') as entryDate, a.COSTO_ADQUIS as acquisitionCost,
          a.ID_CUSTODIO as assignedToId, u.NOMBRE as assignedTo,
          a.ID_PROVEEDOR as supplierId, s.NOMBRE as supplier,
          a.UBICACION as location, a.AREA as area,
          a.OBSERVACIONES as observations, a.VALOR_ACTUAL as currentValue,
          a.FOTO_URL as photoUrl, a.FACTURA_URL as invoiceUrl,
          c.ID_SCOPE as scopeId
        FROM ACTIVO a
        LEFT JOIN CATEGORIA c ON a.ID_CATEGORIA = c.ID
        LEFT JOIN UNIDAD_ORG d ON a.ID_DEPTO = d.ID
        LEFT JOIN USUARIO u ON a.ID_CUSTODIO = u.ID
        LEFT JOIN PROVEEDOR s ON a.ID_PROVEEDOR = s.ID
        LEFT JOIN ESTADO_ACTIVO ea ON a.ID_ESTADO = ea.ID
        WHERE a.ID = @id AND a.BORRADO = FALSE
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error in getAssetById:', err);
    res.status(500).json({ error: 'Error del servidor consultando Activo' });
  }
};

export const createAsset = async (req, res) => {
  try {
    const {
      id, name, brand, model, serial, status, description,
      categoryId,
      departmentId, supplierId,
      assignedTo, entryDate, acquisitionCost, location, area, observations, currentValue
    } = req.body;
    const db = await getPool();

    // Resolve status ID
    const statusRes = await db.request()
      .input('status', sql.VarChar, status || 'Activo')
      .query(`SELECT ID FROM ESTADO_ACTIVO WHERE NOMBRE = @status LIMIT 1`);
    const statusId = statusRes.recordset[0]?.id || null;

    // Resolve custodian ID
    let custodianId = null;
    if (assignedTo) {
      const custRes = await db.request()
        .input('usr', sql.VarChar, assignedTo)
        .query(`SELECT ID FROM USUARIO WHERE NOMBRE = @usr LIMIT 1`);
      custodianId = custRes.recordset[0]?.id || null;
    }

    await db.request()
      .input('id', sql.VarChar, id)
      .input('name', sql.VarChar, name)
      .input('brand', sql.VarChar, brand || '')
      .input('model', sql.VarChar, model || '')
      .input('serial', sql.VarChar, serial || null)
      .input('statusId', sql.VarChar, statusId)
      .input('desc', sql.NVarChar, description || '')
      .input('catId', sql.VarChar, categoryId || null)
      .input('depId', sql.VarChar, departmentId || null)
      .input('custId', sql.VarChar, custodianId)
      .input('supId', sql.VarChar, supplierId || null)
      .input('date', sql.Date, entryDate || null)
      .input('cost', sql.Decimal, acquisitionCost || 0)
      .input('loc', sql.VarChar, location || '')
      .input('area', sql.VarChar, area || '')
      .input('obs', sql.NVarChar, observations || '')
      .input('currVal', sql.Decimal, currentValue || 0)
      .query(`
        INSERT INTO ACTIVO (
          ID, NOMBRE, MARCA, MODELO, SERIAL, ID_ESTADO, DESCRIPCION,
          ID_CATEGORIA,
          ID_DEPTO, ID_CUSTODIO, ID_PROVEEDOR, FECHA_INGRESO, COSTO_ADQUIS,
          UBICACION, AREA, OBSERVACIONES, VALOR_ACTUAL
        )
        VALUES (@id, @name, @brand, @model, @serial,
          @statusId,
          @desc,
          @catId,
          @depId,
          @custId,
          @supId,
          @date, @cost, @loc, @area, @obs, @currVal)
      `);
    await logAudit(req, 'POST', 'Activos', id, `Registrado nuevo activo: ${name} (Serial: ${serial || 'N/A'})`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const createAssetBatch = async (req, res) => {
  try {
    const { assets } = req.body;
    const db = await getPool();
    let count = 0;

    for (const [index, asset] of assets.entries()) {
      const {
        id, name, brand, model, serial, status, description, category, department,
        assignedTo, supplier, entryDate, acquisitionCost, family, subFamily, location, area, observations, currentValue
      } = asset;

      try {
        // Resolve category ID
        let catId = null;
        if (category) {
          const catRes = await db.request()
            .input('cat', sql.VarChar, category)
            .query(`SELECT ID FROM CATEGORIA WHERE NOMBRE = @cat LIMIT 1`);
          catId = catRes.recordset[0]?.id || null;
        }

        // Resolve status ID
        const statusRes = await db.request()
          .input('status', sql.VarChar, status || 'Activo')
          .query(`SELECT ID FROM ESTADO_ACTIVO WHERE NOMBRE = @status LIMIT 1`);
        let statusId = statusRes.recordset[0]?.id || null;
        if (!statusId) {
          const defaultRes = await db.request()
            .query(`SELECT ID FROM ESTADO_ACTIVO WHERE NOMBRE = 'Activo' LIMIT 1`);
          statusId = defaultRes.recordset[0]?.id || null;
        }

        // Resolve department ID
        let depId = null;
        if (department) {
          const depRes = await db.request()
            .input('dep', sql.VarChar, department)
            .query(`SELECT ID FROM UNIDAD_ORG WHERE NOMBRE = @dep LIMIT 1`);
          depId = depRes.recordset[0]?.id || null;
        }

        // Resolve custodian ID
        let custId = null;
        if (assignedTo) {
          const custRes = await db.request()
            .input('usr', sql.VarChar, assignedTo)
            .query(`SELECT ID FROM USUARIO WHERE NOMBRE = @usr LIMIT 1`);
          custId = custRes.recordset[0]?.id || null;
        }

        // Resolve supplier ID
        let supId = null;
        if (supplier) {
          const supRes = await db.request()
            .input('sup', sql.VarChar, supplier)
            .query(`SELECT ID FROM PROVEEDOR WHERE NOMBRE = @sup LIMIT 1`);
          supId = supRes.recordset[0]?.id || null;
        }

        // Check if asset exists
        const existsRes = await db.request()
          .input('id', sql.VarChar, id)
          .query(`SELECT 1 FROM ACTIVO WHERE ID = @id`);

        if (existsRes.recordset.length === 0) {
          // INSERT
          await db.request()
            .input('id', sql.VarChar, id)
            .input('name', sql.VarChar, name)
            .input('brand', sql.VarChar, brand || '')
            .input('model', sql.VarChar, model || '')
            .input('serial', sql.VarChar, serial || null)
            .input('statusId', sql.VarChar, statusId)
            .input('desc', sql.NVarChar, description || '')
            .input('catId', sql.VarChar, catId)
            .input('depId', sql.VarChar, depId)
            .input('custId', sql.VarChar, custId)
            .input('supId', sql.VarChar, supId)
            .input('date', sql.Date, entryDate || new Date())
            .input('cost', sql.Decimal, acquisitionCost || 0)
            .input('loc', sql.VarChar, location || '')
            .input('area', sql.VarChar, area || '')
            .input('obs', sql.NVarChar, observations || '')
            .input('currVal', sql.Decimal, currentValue || 0)
            .query(`
              INSERT INTO ACTIVO (
                ID, NOMBRE, MARCA, MODELO, SERIAL, ID_ESTADO, DESCRIPCION,
                ID_CATEGORIA, ID_DEPTO, ID_CUSTODIO, ID_PROVEEDOR, FECHA_INGRESO, COSTO_ADQUIS,
                UBICACION, AREA, OBSERVACIONES, VALOR_ACTUAL
              )
              VALUES (@id, @name, @brand, @model, @serial,
                @statusId, @desc,
                @catId, @depId, @custId, @supId,
                @date, @cost, @loc, @area, @obs, @currVal)
            `);
        } else {
          // UPDATE
          await db.request()
            .input('id', sql.VarChar, id)
            .input('name', sql.VarChar, name)
            .input('brand', sql.VarChar, brand || '')
            .input('model', sql.VarChar, model || '')
            .input('serial', sql.VarChar, serial || null)
            .input('statusId', sql.VarChar, statusId)
            .input('desc', sql.NVarChar, description || '')
            .input('catId', sql.VarChar, catId)
            .input('depId', sql.VarChar, depId)
            .input('custId', sql.VarChar, custId)
            .input('supId', sql.VarChar, supId)
            .input('date', sql.Date, entryDate || new Date())
            .input('cost', sql.Decimal, acquisitionCost || 0)
            .input('loc', sql.VarChar, location || '')
            .input('area', sql.VarChar, area || '')
            .input('obs', sql.NVarChar, observations || '')
            .input('currVal', sql.Decimal, currentValue || 0)
            .query(`
              UPDATE ACTIVO SET
                NOMBRE=@name, MARCA=@brand, MODELO=@model, SERIAL=@serial,
                ID_ESTADO=@statusId,
                DESCRIPCION=@desc,
                ID_CATEGORIA=@catId,
                ID_DEPTO=@depId,
                ID_CUSTODIO=@custId,
                ID_PROVEEDOR=@supId,
                FECHA_INGRESO=@date, COSTO_ADQUIS=@cost,
                UBICACION=@loc, AREA=@area, OBSERVACIONES=@obs, VALOR_ACTUAL=@currVal,
                FECHA_ACT=NOW()
              WHERE ID=@id AND BORRADO = FALSE
            `);
        }
        count++;
      } catch (rowError) {
        throw new Error(`Error en el Activo '${name}' (Fila ${index + 2}): ${rowError.message}`);
      }
    }
    await logAudit(req, 'POST', 'Activos', 'BATCH', `Carga masiva de ${count} activos completada`);
    res.json({ success: true, count });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateAsset = async (req, res) => {
  try {
    const {
      name, brand, model, serial, status, description,
      categoryId,
      departmentId, supplierId,
      assignedTo, entryDate, acquisitionCost, location, area, observations, currentValue
    } = req.body;
    const db = await getPool();

    // Resolve status ID
    const statusRes = await db.request()
      .input('status', sql.VarChar, status || 'Activo')
      .query(`SELECT ID FROM ESTADO_ACTIVO WHERE NOMBRE = @status LIMIT 1`);
    const statusId = statusRes.recordset[0]?.id || null;

    // Resolve custodian ID
    let custodianId = null;
    if (assignedTo) {
      const custRes = await db.request()
        .input('usr', sql.VarChar, assignedTo)
        .query(`SELECT ID FROM USUARIO WHERE NOMBRE = @usr LIMIT 1`);
      custodianId = custRes.recordset[0]?.id || null;
    }

    await db.request()
      .input('id', sql.VarChar, req.params.id)
      .input('name', sql.VarChar, name)
      .input('brand', sql.VarChar, brand || '')
      .input('model', sql.VarChar, model || '')
      .input('serial', sql.VarChar, serial || null)
      .input('statusId', sql.VarChar, statusId)
      .input('desc', sql.NVarChar, description || '')
      .input('catId', sql.VarChar, categoryId || null)
      .input('depId', sql.VarChar, departmentId || null)
      .input('custId', sql.VarChar, custodianId)
      .input('supId', sql.VarChar, supplierId || null)
      .input('date', sql.Date, entryDate || null)
      .input('cost', sql.Decimal, acquisitionCost || 0)
      .input('loc', sql.VarChar, location || '')
      .input('area', sql.VarChar, area || '')
      .input('obs', sql.NVarChar, observations || '')
      .input('currVal', sql.Decimal, currentValue || 0)
      .query(`
        UPDATE ACTIVO SET
          NOMBRE=@name, MARCA=@brand, MODELO=@model, SERIAL=@serial,
          ID_ESTADO=@statusId,
          DESCRIPCION=@desc,
          ID_CATEGORIA=@catId,
          ID_DEPTO=@depId,
          ID_CUSTODIO=@custId,
          ID_PROVEEDOR=@supId,
          FECHA_INGRESO=@date, COSTO_ADQUIS=@cost,
          UBICACION=@loc, AREA=@area, OBSERVACIONES=@obs, VALOR_ACTUAL=@currVal,
          FECHA_ACT=NOW()
        WHERE ID=@id
      `);
    await logAudit(req, 'PUT', 'Activos', req.params.id, `Actualización de ficha del activo: ${name}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const deleteAsset = async (req, res) => {
  try {
    const db = await getPool();
    const assetId = req.params.id;

    // Bloqueo absoluto — el activo no puede eliminarse si tiene trazabilidad histórica
    const refs = await db.request().input('id', sql.VarChar, assetId).query(`
      SELECT
        (SELECT COUNT(*) FROM TICKET_MANT  WHERE ID_ACTIVO  = @id AND BORRADO = FALSE) as tickets,
        (SELECT COUNT(*) FROM MOVIMIENTO   WHERE ID_ACTIVO  = @id)                  as movimientos,
        (SELECT COUNT(*) FROM ORDEN_TRAB   WHERE ID_ACTIVO  = @id)                  as ordenes
    `);

    const { tickets, movimientos, ordenes } = refs.recordset[0];

    if (tickets > 0) {
      return res.status(409).json({
        error: `Este activo tiene ${tickets} mantenimiento(s) registrado(s). No puede eliminarse; desactívalo si ya no está en uso.`
      });
    }
    if (movimientos > 0) {
      return res.status(409).json({
        error: `Este activo tiene ${movimientos} movimiento(s) en su historial. No puede eliminarse para preservar la trazabilidad.`
      });
    }
    if (ordenes > 0) {
      return res.status(409).json({
        error: `Este activo está vinculado a ${ordenes} plan(es) en marcha. No puede eliminarse.`
      });
    }

    await db.request().input('id', sql.VarChar, assetId).query(`UPDATE ACTIVO SET BORRADO=TRUE, FECHA_BAJA=NOW() WHERE ID=@id`);
    await logAudit(req, 'DELETE', 'Activos', assetId, `Baja del activo: ${assetId}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};
