import express from 'express';
import { createMovement, getAllMovements, getMovementsByAsset } from '../controllers/movements.controller.js';

const router = express.Router();

router.get('/', getAllMovements);
router.get('/asset/:assetId', getMovementsByAsset);
router.post('/', createMovement);

export default router;
