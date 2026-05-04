import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

const getEntityTable = (entity) => {
  if (entity === 'categories') return 'CATEGORIA';
  if (entity === 'organization') return 'UNIDAD_ORG';
  if (entity === 'maintenanceTypes') return 'TIPO_MANT';
  if (entity === 'paymentMethods') return 'FORMA_PAGO';
  if (entity === 'assetStatuses') return 'ESTADO_ACTIVO';
  return null;
};

const buildTree = (data, parentId = null) => {
  const children = data.filter(d => d.ID_PADRE === parentId);
  if (!children.length) return [];
  return children.map(child => ({
    id: child.ID,
    name: child.NOMBRE,
    children: buildTree(data, child.ID)
  }));
};

export const getFiles = async (req, res) => {
  try {
    const table = getEntityTable(req.params.entity);
    if (!table) return res.status(400).json({ error: 'Entidad inválida' });

    const db = await getPool();
    const result = await db.request().query(`SELECT * FROM ${table}`);

    if (['TIPO_MANT', 'ESTADO_ACTIVO', 'FORMA_PAGO'].includes(table)) {
      res.json(result.recordset.map(r => ({ id: r.ID, name: r.NOMBRE, children: [] })));
    } else {
      res.json(buildTree(result.recordset, null));
    }
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const createFile = async (req, res) => {
  try {
    const table = getEntityTable(req.params.entity);
    if (!table) return res.status(400).json({ error: 'Entidad inválida' });

    const { name, parentId } = req.body;
    const db = await getPool();

    if (['ESTADO_ACTIVO', 'FORMA_PAGO'].includes(table)) {
      // ID es INT IDENTITY — no se pasa, lo genera el motor
      const color = req.body.color || null;
      const r = db.request().input('name', sql.VarChar, name);
      if (table === 'ESTADO_ACTIVO' && color) {
        r.input('color', sql.VarChar, color);
        await r.query(`INSERT INTO ESTADO_ACTIVO (NOMBRE, COLOR) VALUES (@name, @color)`);
      } else {
        await r.query(`INSERT INTO ${table} (NOMBRE) VALUES (@name)`);
      }
    } else {
      // TIPO_MANT, CATEGORIA, UNIDAD_ORG: usan ID alfanumérico con jerarquía
      const { id } = req.body;
      await db.request()
        .input('id',   sql.VarChar, id)
        .input('name', sql.VarChar, name)
        .input('pid',  sql.VarChar, parentId || null)
        .query(`INSERT INTO ${table} (ID, NOMBRE, ID_PADRE) VALUES (@id, @name, @pid)`);
    }
    await logAudit(req, 'POST', 'Ficheros', id || name, `Término de catálogo añadido a la entidad ${req.params.entity}: ${name}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const createFileBatch = async (req, res) => {
  try {
    const table = getEntityTable(req.params.entity);
    if (!table) return res.status(400).json({ error: 'Entidad inválida' });

    const { items } = req.body;
    const db = await getPool();
    let count = 0;

    // Ordenar para que los nodos padre (sin ID_PADRE) se inserten PRIMERO
    items.sort((a, b) => {
      const aPid = a['ID_PADRE'] || a['Padre'] || '';
      const bPid = b['ID_PADRE'] || b['Padre'] || '';
      if (!aPid && bPid) return -1;
      if (aPid && !bPid) return 1;
      return 0;
    });

    for (const [index, item] of items.entries()) {
      const name = item['NOMBRE'] || item['Nombre'] || 'Desconocido';
      const pid  = item['ID_PADRE'] || item['Padre'] || null;

      // ESTADO_ACTIVO y FORMA_PAGO: ID INT IDENTITY — upsert por NOMBRE (UNIQUE)
      // TIPO_MANT, CATEGORIA, UNIDAD_ORG: usan ID alfanumérico con soporte de jerarquía
      const isNameAsPk = ['ESTADO_ACTIVO', 'FORMA_PAGO'].includes(table);
      const id = isNameAsPk
        ? null
        : (item['ID'] ? item['ID'].toString() : `FIL-${Date.now().toString().slice(-4)}${Math.floor(Math.random()*1000)}`);

      try {
        if (isNameAsPk) {
          const color = item['COLOR'] || item['Color'] || null;
          const hasColor = table === 'ESTADO_ACTIVO' && color;
          const r = db.request()
            .input('name',  sql.VarChar, name)
            .input('color', sql.VarChar, color || null);
          await r.query(hasColor
            ? `IF NOT EXISTS (SELECT 1 FROM ${table} WHERE NOMBRE = @name)
                 INSERT INTO ${table} (NOMBRE, COLOR) VALUES (@name, @color)
               ELSE
                 UPDATE ${table} SET COLOR = @color WHERE NOMBRE = @name`
            : `IF NOT EXISTS (SELECT 1 FROM ${table} WHERE NOMBRE = @name)
                 INSERT INTO ${table} (NOMBRE) VALUES (@name)`
          );
        } else {
          // Tablas jerárquicas: CATEGORIA, UNIDAD_ORG, TIPO_MANT
          await db.request()
            .input('id',   sql.VarChar, id)
            .input('name', sql.VarChar, name)
            .input('pid',  sql.VarChar, pid)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM ${table} WHERE ID = @id)
                INSERT INTO ${table} (ID, NOMBRE, ID_PADRE) VALUES (@id, @name, @pid)
              ELSE
                UPDATE ${table} SET NOMBRE = @name, ID_PADRE = @pid WHERE ID = @id
            `);
        }
        count++;
      } catch (rowError) {
        throw new Error(`Error en Excel (Fila ${index + 2}) con ID '${id}' y Nombre '${name}': ${rowError.message}`);
      }
    }
    await logAudit(req, 'POST', 'Ficheros', 'BATCH', `Importación masiva de ${count} ítems en ${table}`);
    res.json({ success: true, count });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateFile = async (req, res) => {
  try {
    const table = getEntityTable(req.params.entity);
    if (!table) return res.status(400).json({ error: 'Entidad inválida' });

    const { name } = req.body;
    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, req.params.id)
      .input('name', sql.VarChar, name)
      .query(`UPDATE ${table} SET NOMBRE=@name WHERE ID=@id`);
    await logAudit(req, 'PUT', 'Ficheros', req.params.id, `Renombrado ítem de catálogo en ${req.params.entity} a: ${name}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const deleteFile = async (req, res) => {
  try {
    const table = getEntityTable(req.params.entity);
    if (!table) return res.status(400).json({ error: 'Entidad inválida' });

    const db = await getPool();
    if (!['TIPO_MANT', 'ESTADO_ACTIVO', 'FORMA_PAGO'].includes(table)) {
      const childCheck = await db.request().input('id', sql.VarChar, req.params.id)
        .query(`SELECT COUNT(*) as c FROM ${table} WHERE ID_PADRE=@id`);
      if (childCheck.recordset[0].c > 0) {
        return res.status(400).json({ error: 'No se puede eliminar un nodo que contiene sub-niveles.' });
      }
    }

    if (table === 'CATEGORIA') {
      const refCheck = await db.request().input('id', sql.VarChar, req.params.id).query(`
        SELECT COUNT(*) as c FROM ACTIVO WHERE ID_CATEGORIA = @id AND BORRADO = 0`);
      if (refCheck.recordset[0].c > 0) {
        return res.status(409).json({ error: `Esta categoría está asignada a ${refCheck.recordset[0].c} activo(s). No puede eliminarse.` });
      }
    } else if (table === 'UNIDAD_ORG') {
      const refCheck = await db.request().input('id', sql.VarChar, req.params.id).query(`
        SELECT
          (SELECT COUNT(*) FROM ACTIVO WHERE ID_DEPTO = @id AND BORRADO = 0) as activos,
          (SELECT COUNT(*) FROM MOVIMIENTO m
            INNER JOIN UNIDAD_ORG o ON m.DEPTO_ANT = o.NOMBRE OR m.DEPTO_NUE = o.NOMBRE
            WHERE o.ID = @id) as movimientos`);
      const { activos, movimientos } = refCheck.recordset[0];
      if (activos > 0) {
        return res.status(409).json({ error: `Esta sede/departamento está asignado a ${activos} activo(s). No puede eliminarse.` });
      }
      if (movimientos > 0) {
        return res.status(409).json({ error: `Esta sede/departamento aparece en ${movimientos} movimiento(s) histórico(s). No puede eliminarse.` });
      }
    } else if (table === 'TIPO_MANT') {
      const refCheck = await db.request().input('id', sql.VarChar, req.params.id).query(`
        SELECT COUNT(*) as c FROM TICKET_MANT WHERE ID_TIPO_MANT = @id AND BORRADO = 0`);
      if (refCheck.recordset[0].c > 0) {
        return res.status(409).json({ error: `Este tipo de mantenimiento está asignado a ${refCheck.recordset[0].c} ticket(s). No puede eliminarse.` });
      }
    } else if (table === 'FORMA_PAGO') {
      const refCheck = await db.request().input('id', sql.VarChar, req.params.id).query(`
        SELECT COUNT(*) as c FROM PROVEEDOR WHERE ID_FORMA_PAGO = @id`);
      if (refCheck.recordset[0].c > 0) {
        return res.status(409).json({ error: `Esta forma de pago está asignada a ${refCheck.recordset[0].c} proveedor(es). No puede eliminarse.` });
      }
    } else if (table === 'ESTADO_ACTIVO') {
      const refCheck = await db.request().input('id', sql.VarChar, req.params.id).query(`
        SELECT COUNT(*) as c FROM ACTIVO WHERE ID_ESTADO = @id AND BORRADO = 0`);
      if (refCheck.recordset[0].c > 0) {
        return res.status(409).json({ error: `Este estado está asignado a ${refCheck.recordset[0].c} activo(s). No puede eliminarse.` });
      }
    }

    await db.request().input('id', sql.VarChar, req.params.id).query(`DELETE FROM ${table} WHERE ID=@id`);
    await logAudit(req, 'DELETE', 'Ficheros', req.params.id, `Eliminación de estructura física o conceptual`);
    res.json({ success: true });
  } catch(e) {
    if (e.message && e.message.includes('REFERENCE constraint')) {
      return res.status(400).json({ error: 'No se puede eliminar porque está en uso por un activo o mantenimiento.' });
    }
    res.status(500).json({ error: e.message });
  }
};