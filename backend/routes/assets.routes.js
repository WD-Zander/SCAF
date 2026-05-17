import express from 'express';
import { getAssets, getAssetById, createAsset, createAssetBatch, updateAsset, deleteAsset } from '../controllers/assets.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('inventory_view'), getAssets);
router.get('/:id', requirePermission('inventory_view'), getAssetById);
router.post('/batch', requirePermission('inventory_create', 'inventory_import'), createAssetBatch);
router.post('/', requirePermission('inventory_create'), createAsset);
router.put('/:id', requirePermission('inventory_edit'), updateAsset);
router.delete('/:id', requirePermission('inventory_delete'), deleteAsset);

export default router;
