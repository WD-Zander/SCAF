import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

const __dir = dirname(fileURLToPath(import.meta.url));

export const factoryReset = async (req, res) => {
  try {
    const userRole = req.user?.rol;
    if (userRole !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo el Super Administrador puede inicializar el sistema a cero.' });
    }

    const db = await getPool();
    await db.request().query(`
      DELETE FROM AUDITORIA;
      DELETE FROM REPROGRAMACION;
      DELETE FROM MOVIMIENTO;
      DELETE FROM TAREA_TICKET;
      DELETE FROM TICKET_MANT;
      DELETE FROM ORDEN_TRAB;
      DELETE FROM TAREA_PLAN;
      DELETE FROM PLAN_MANT;
      DELETE FROM ACTIVO;
      DELETE FROM CATEGORIA;
      DELETE FROM UNIDAD_ORG;
      DELETE FROM TIPO_MANT;
      DELETE FROM PROVEEDOR;
      DELETE FROM USUARIO WHERE ID_ROL != 'SUPERADMIN';
      DELETE FROM ROL WHERE ID != 'SUPERADMIN';
    `);

    await logAudit(req, 'RESET', 'Sistema', 'ALL', 'Software inicializado a 0 por el Super Administrador (Puesta en marcha)');
    res.json({ success: true, message: 'El software ha sido inicializado a 0 exitosamente.' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

export const testDb = async (req, res) => {
  try {
    const db = await getPool();
    await db.request().query("SELECT 1 AS Result");
    res.json({ message: 'Conexión Exitosa', success: true });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
};

export const saveDb = async (req, res) => {
  const { server, user, password, database } = req.body;
  try {
    const envContent = `SQL_SERVER=${server || ''}\nSQL_USER=${user || ''}\nSQL_PASSWORD=${password || ''}\nSQL_DATABASE=${database || ''}\nSQL_PORT=1433\n`;
    // Guardar en backend/.env (directorio del controlador → su padre es backend/)
    fs.writeFileSync(resolve(__dir, '..', '.env'), envContent);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
};

export const getSettings = async (req, res) => {
  const DEFAULTS = { name: 'Mi Empresa S.A.', alertdays: 15, itemsperpage: 50, currencysymbol: '$', allowdelete: true };
  try {
    const db = await getPool();
    try {
      const result = await db.request().query(`
        SELECT
          ID as id, NOMBRE as name, NIT as nit, CORREO as email, TEL as phone,
          DIR as address, MONEDA as currency, TEMA as theme,
          COALESCE(DIAS_ALERTA_MANT, 15) as alertdays,
          COALESCE(ITEMS_POR_PAGINA, 50) as itemsperpage,
          COALESCE(MONEDA_SIMBOLO, '$') as currencysymbol,
          COALESCE(PERMITIR_BORRADO, TRUE) as allowdelete
        FROM CONFIG_EMP WHERE ID=1
      `);
      return res.json(result.recordset[0] ?? DEFAULTS);
    } catch {
      const result = await db.request().query(
        `SELECT ID as id, NOMBRE as name, NIT as nit, CORREO as email, TEL as phone, DIR as address, MONEDA as currency, TEMA as theme FROM CONFIG_EMP WHERE ID=1`
      );
      return res.json({ ...DEFAULTS, ...(result.recordset[0] ?? {}) });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateSettings = async (req, res) => {
  try {
    const { Name, Nit, Email, Phone, Address, Currency, AlertDays, ItemsPerPage, CurrencySymbol, AllowDelete } = req.body;
    const db = await getPool();
    await db.request()
      .input('name',        sql.VarChar, Name)
      .input('nit',         sql.VarChar, Nit || '')
      .input('email',       sql.VarChar, Email || '')
      .input('phone',       sql.VarChar, Phone || '')
      .input('address',     sql.NVarChar, Address || '')
      .input('curr',        sql.VarChar, Currency || 'USD')
      .input('alertDays',   sql.Int, AlertDays ?? 15)
      .input('itemsPerPage',sql.Int, ItemsPerPage ?? 50)
      .input('currSymbol',  sql.VarChar, CurrencySymbol || '$')
      .input('allowDelete', sql.Bit, AllowDelete ? 1 : 0)
      .query(`
        UPDATE CONFIG_EMP SET
          NOMBRE=@name, NIT=@nit, CORREO=@email, TEL=@phone, DIR=@address, MONEDA=@curr,
          DIAS_ALERTA_MANT=@alertDays, ITEMS_POR_PAGINA=@itemsPerPage,
          MONEDA_SIMBOLO=@currSymbol, PERMITIR_BORRADO=@allowDelete,
          FEC_ACT=GETUTCDATE()
        WHERE ID=1
      `);
    await logAudit(req, 'PUT', 'Ajustes', 'Empresa', 'Configuración corporativa actualizada');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};