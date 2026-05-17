import express from 'express';
import { upload, uploadAssetFiles, deleteAssetFile } from '../controllers/upload.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

// POST /api/assets/:id/files  — sube foto y/o factura
router.post('/:id/files', requirePermission('inventory_edit'), upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'invoice', maxCount: 1 },
]), uploadAssetFiles);

// DELETE /api/assets/:id/files/:type  — elimina foto o factura
router.delete('/:id/files/:type', requirePermission('inventory_edit'), deleteAssetFile);

export default router;
