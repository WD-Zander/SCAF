import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dir, '..', 'uploads', 'assets');

// Asegurar que la carpeta existe
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max por archivo
});

export const uploadAssetFiles = async (req, res) => {
  try {
    const assetId = req.params.id;
    if (!assetId) return res.status(400).json({ error: 'ID del activo requerido' });

    const db = await getPool();

    // Obtener URLs actuales para poder borrar archivos viejos del disco
    const current = await db.request()
      .input('id', sql.VarChar, assetId)
      .query('SELECT FOTO_URL, FACTURA_URL FROM ACTIVO WHERE ID = @id');

    const row = current.recordset[0] || {};
    const updates = {};

    if (req.files?.photo?.[0]) {
      // Eliminar foto vieja si existe
      if (row.FOTO_URL) {
        const oldPath = path.resolve(__dir, '..', row.FOTO_URL.replace(/^\/uploads\//, 'uploads/'));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.FOTO_URL = `/uploads/assets/${req.files.photo[0].filename}`;
    }

    if (req.files?.invoice?.[0]) {
      // Eliminar factura vieja si existe
      if (row.FACTURA_URL) {
        const oldPath = path.resolve(__dir, '..', row.FACTURA_URL.replace(/^\/uploads\//, 'uploads/'));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.FACTURA_URL = `/uploads/assets/${req.files.invoice[0].filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    // Construir SET dinámico
    const setParts = [];
    const dbReq = db.request().input('id', sql.VarChar, assetId);
    if (updates.FOTO_URL)    { setParts.push('FOTO_URL = @fotoUrl');       dbReq.input('fotoUrl',    sql.VarChar, updates.FOTO_URL); }
    if (updates.FACTURA_URL) { setParts.push('FACTURA_URL = @facturaUrl'); dbReq.input('facturaUrl', sql.VarChar, updates.FACTURA_URL); }

    await dbReq.query(`UPDATE ACTIVO SET ${setParts.join(', ')}, FECHA_ACT = GETUTCDATE() WHERE ID = @id`);

    await logAudit(req, 'PUT', 'Activos', assetId, `Archivos adjuntos actualizados: ${Object.keys(updates).join(', ')}`);
    res.json({ success: true, ...updates });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteAssetFile = async (req, res) => {
  try {
    const { id, type } = req.params; // type: 'photo' | 'invoice'
    if (!['photo', 'invoice'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' });

    const col = type === 'photo' ? 'FOTO_URL' : 'FACTURA_URL';
    const db = await getPool();

    const current = await db.request()
      .input('id', sql.VarChar, id)
      .query(`SELECT ${col} as url FROM ACTIVO WHERE ID = @id`);

    const fileUrl = current.recordset[0]?.url;
    if (fileUrl) {
      const filePath = path.resolve(__dir, '..', fileUrl.replace(/^\/uploads\//, 'uploads/'));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.request()
      .input('id', sql.VarChar, id)
      .query(`UPDATE ACTIVO SET ${col} = NULL, FECHA_ACT = GETUTCDATE() WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'Activos', id, `Archivo eliminado: ${col}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};