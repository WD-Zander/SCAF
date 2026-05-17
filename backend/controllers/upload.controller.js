import multer from 'multer';
import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';
import { createClient } from '@supabase/supabase-js';

// Supabase Storage client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vwwriqkjcramhhkyrarz.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

const BUCKET = 'assets';

// Usar memoria en vez de disco (Render no persiste archivos)
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

/**
 * Sube un archivo a Supabase Storage y retorna la URL pública.
 */
async function uploadToSupabase(file, folder) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Error subiendo archivo: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Elimina un archivo de Supabase Storage por su URL pública.
 */
async function deleteFromSupabase(publicUrl) {
  if (!publicUrl) return;
  // Extraer el path del archivo desde la URL pública
  // URL format: https://xxx.supabase.co/storage/v1/object/public/assets/photos/filename.jpg
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/assets\/(.+)$/);
  if (match) {
    await supabase.storage.from(BUCKET).remove([match[1]]);
  }
}

export const uploadAssetFiles = async (req, res) => {
  try {
    const assetId = req.params.id;
    if (!assetId) return res.status(400).json({ error: 'ID del activo requerido' });

    const db = await getPool();

    const current = await db.request()
      .input('id', sql.VarChar, assetId)
      .query('SELECT FOTO_URL, FACTURA_URL FROM ACTIVO WHERE ID = @id');

    const row = current.recordset[0] || {};
    const updates = {};

    if (req.files?.photo?.[0]) {
      // Eliminar foto vieja de Supabase
      await deleteFromSupabase(row.FOTO_URL);
      updates.FOTO_URL = await uploadToSupabase(req.files.photo[0], 'photos');
    }

    if (req.files?.invoice?.[0]) {
      // Eliminar factura vieja de Supabase
      await deleteFromSupabase(row.FACTURA_URL);
      updates.FACTURA_URL = await uploadToSupabase(req.files.invoice[0], 'invoices');
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

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
    const { id, type } = req.params;
    if (!['photo', 'invoice'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' });

    const col = type === 'photo' ? 'FOTO_URL' : 'FACTURA_URL';
    const db = await getPool();

    const current = await db.request()
      .input('id', sql.VarChar, id)
      .query(`SELECT ${col} as url FROM ACTIVO WHERE ID = @id`);

    const fileUrl = current.recordset[0]?.url;
    await deleteFromSupabase(fileUrl);

    await db.request()
      .input('id', sql.VarChar, id)
      .query(`UPDATE ACTIVO SET ${col} = NULL, FECHA_ACT = GETUTCDATE() WHERE ID = @id`);

    await logAudit(req, 'DELETE', 'Activos', id, `Archivo eliminado: ${col}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
