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
  const DEFAULTS = { Name: 'Mi Empresa S.A.', AlertDays: 15, ItemsPerPage: 50, CurrencySymbol: '$', AllowDelete: true };
  try {
    const db = await getPool();
    try {
      const result = await db.request().query(`
        SELECT
          ID as Id, NOMBRE as Name, NIT as Nit, CORREO as Email, TEL as Phone,
          DIR as Address, MONEDA as Currency, TEMA as Theme,
          ISNULL(DIAS_ALERTA_MANT, 15) as AlertDays,
          ISNULL(ITEMS_POR_PAGINA, 50) as ItemsPerPage,
          ISNULL(MONEDA_SIMBOLO, '$') as CurrencySymbol,
          ISNULL(PERMITIR_BORRADO, 1) as AllowDelete
        FROM CONFIG_EMP WHERE ID=1
      `);
      return res.json(result.recordset[0] ?? DEFAULTS);
    } catch {
      // Columnas opcionales aún no existen — query básica con defaults en código
      const result = await db.request().query(
        `SELECT ID as Id, NOMBRE as Name, NIT as Nit, CORREO as Email, TEL as Phone, DIR as Address, MONEDA as Currency, TEMA as Theme FROM CONFIG_EMP WHERE ID=1`
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