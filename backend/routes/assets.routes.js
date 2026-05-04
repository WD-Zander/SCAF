import express from 'express';
import { getAssets, createAsset, createAssetBatch, updateAsset, deleteAsset } from '../controllers/assets.controller.js';

const router = express.Router();

router.get('/', getAssets);
router.post('/batch', createAssetBatch);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
