import express from 'express';
import { getAssets, getAssetById, createAsset, createAssetBatch, updateAsset, deleteAsset } from '../controllers/assets.controller.js';

const router = express.Router();

router.get('/', getAssets);
router.get('/:id', getAssetById);
router.post('/batch', createAssetBatch);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
