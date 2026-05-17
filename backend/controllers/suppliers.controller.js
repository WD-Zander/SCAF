import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getSuppliers = async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT p.ID as id, p.NOMBRE as name, p.CONTACTO as contact, p.TEL as phone,
             p.CORREO as email, p.DIR as address, p.RIF as rif,
             fp.NOMBRE as paymentMethod
      FROM PROVEEDOR p
      LEFT JOIN FORMA_PAGO fp ON p.ID_FORMA_PAGO = fp.ID
      WHERE p.ACTIVO = 1
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor consultando Proveedores' });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { id, name, contact, phone, email, address, rif, paymentMethod } = req.body;
    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, id)
      .input('name', sql.VarChar, name)
      .input('contact', sql.VarChar, contact || '')
      .input('phone', sql.VarChar, phone || '')
      .input('email', sql.VarChar, email || '')
      .input('address', sql.VarChar, address || '')
      .input('rif', sql.VarChar, rif || null)
      .input('paymentMethod', sql.VarChar, paymentMethod || null)
      .query(`
        INSERT INTO PROVEEDOR (ID, NOMBRE, CONTACTO, TEL, CORREO, DIR, RIF, ID_FORMA_PAGO)
        VALUES (@id, @name, @contact, @phone, @email, @address, @rif,
          (SELECT ID FROM FORMA_PAGO WHERE NOMBRE = @paymentMethod LIMIT 1))
      `);
    await logAudit(req, 'POST', 'Proveedores', id, `Proveedor de servicio añadido: ${name}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateSupplier = async (req, res) => {
  try {
    const { name, contact, phone, email, address, rif, paymentMethod } = req.body;
    const db = await getPool();
    await db.request()
      .input('id', sql.VarChar, req.params.id)
      .input('name', sql.VarChar, name)
      .input('contact', sql.VarChar, contact || '')
      .input('phone', sql.VarChar, phone || '')
      .input('email', sql.VarChar, email || '')
      .input('address', sql.VarChar, address || '')
      .input('rif', sql.VarChar, rif || null)
      .input('paymentMethod', sql.VarChar, paymentMethod || null)
      .query(`
        UPDATE PROVEEDOR
        SET NOMBRE=@name, CONTACTO=@contact, TEL=@phone, CORREO=@email,
            DIR=@address, RIF=@rif,
            ID_FORMA_PAGO=(SELECT ID FROM FORMA_PAGO WHERE NOMBRE = @paymentMethod LIMIT 1)
        WHERE ID=@id
      `);
    await logAudit(req, 'PUT', 'Proveedores', req.params.id, `Se han modificado los datos del proveedor: ${name}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const createSupplierBatch = async (req, res) => {
  try {
    const { suppliers } = req.body;
    if (!suppliers?.length) return res.status(400).json({ error: 'No se recibieron proveedores.' });

    const db = await getPool();
    let count = 0;

    for (const [index, row] of suppliers.entries()) {
      const id   = (row.id   || row.ID   || `PROV-IMP-${Date.now().toString().slice(-5)}${index}`).toString().trim();
      const name = (row.name || row.NOMBRE || '').toString().trim();
      if (!name) continue;

      try {
        const existing = await db.request()
          .input('id', sql.VarChar, id)
          .query(`SELECT 1 FROM PROVEEDOR WHERE ID = @id`);

        if (existing.recordset.length === 0) {
          await db.request()
            .input('id',            sql.VarChar, id)
            .input('name',          sql.VarChar, name)
            .input('contact',       sql.VarChar, (row.contact       || row.CONTACTO       || '').toString().trim())
            .input('phone',         sql.VarChar, (row.phone         || row.TEL            || '').toString().trim())
            .input('email',         sql.VarChar, (row.email         || row.CORREO         || '').toString().trim())
            .input('address',       sql.VarChar, (row.address       || row.DIR            || '').toString().trim())
            .input('rif',           sql.VarChar, (row.rif           || row.RIF            || null))
            .input('paymentMethod', sql.VarChar, (row.paymentMethod || row.ID_FORMA_PAGO  || null))
            .query(`
              INSERT INTO PROVEEDOR (ID, NOMBRE, CONTACTO, TEL, CORREO, DIR, RIF, ID_FORMA_PAGO)
              VALUES (@id, @name, @contact, @phone, @email, @address, @rif,
                (SELECT ID FROM FORMA_PAGO WHERE NOMBRE = @paymentMethod LIMIT 1))
            `);
        } else {
          await db.request()
            .input('id',            sql.VarChar, id)
            .input('name',          sql.VarChar, name)
            .input('contact',       sql.VarChar, (row.contact       || row.CONTACTO       || '').toString().trim())
            .input('phone',         sql.VarChar, (row.phone         || row.TEL            || '').toString().trim())
            .input('email',         sql.VarChar, (row.email         || row.CORREO         || '').toString().trim())
            .input('address',       sql.VarChar, (row.address       || row.DIR            || '').toString().trim())
            .input('rif',           sql.VarChar, (row.rif           || row.RIF            || null))
            .input('paymentMethod', sql.VarChar, (row.paymentMethod || row.ID_FORMA_PAGO  || null))
            .query(`
              UPDATE PROVEEDOR
              SET NOMBRE=@name, CONTACTO=@contact, TEL=@phone, CORREO=@email,
                  DIR=@address, RIF=@rif,
                  ID_FORMA_PAGO=(SELECT ID FROM FORMA_PAGO WHERE NOMBRE = @paymentMethod LIMIT 1)
              WHERE ID=@id
            `);
        }
        count++;
      } catch (rowErr) {
        throw new Error(`Error en proveedor '${name}' (Fila ${index + 2}): ${rowErr.message}`);
      }
    }

    await logAudit(req, 'POST', 'Proveedores', 'BATCH', `Carga masiva de ${count} proveedores completada`);
    res.json({ success: true, count });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

export const deleteSupplier = async (req, res) => {
  try {
    const db = await getPool();
    const supplierId = req.params.id;

    const refs = await db.request().input('id', sql.VarChar, supplierId).query(`
      SELECT
        (SELECT COUNT(*) FROM ACTIVO      WHERE ID_PROVEEDOR = @id AND BORRADO = 0) as activos,
        (SELECT COUNT(*) FROM TICKET_MANT WHERE ID_PROVEEDOR = @id AND BORRADO = 0) as tickets
    `);

    const { activos, tickets } = refs.recordset[0];

    if (activos > 0) {
      return res.status(409).json({
        error: `Este proveedor está asignado a ${activos} activo(s). No puede eliminarse; desactívalo si ya no está en uso.`
      });
    }
    if (tickets > 0) {
      return res.status(409).json({
        error: `Este proveedor está referenciado en ${tickets} mantenimiento(s). No puede eliminarse para preservar el historial.`
      });
    }

    await db.request().input('id', sql.VarChar, supplierId).query(`UPDATE PROVEEDOR SET ACTIVO=0 WHERE ID=@id`);
    await logAudit(req, 'DELETE', 'Proveedores', supplierId, `El proveedor ha sido desactivado`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};