import express from 'express';
import { upload, uploadAssetFiles, deleteAssetFile } from '../controllers/upload.controller.js';

const router = express.Router();

// POST /api/assets/:id/files  — sube foto y/o factura
router.post('/:id/files', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'invoice', maxCount: 1 },
]), uploadAssetFiles);

// DELETE /api/assets/:id/files/:type  — elimina foto o factura
router.delete('/:id/files/:type', deleteAssetFile);

export default router;
