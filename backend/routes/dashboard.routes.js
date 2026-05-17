import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', getDashboardStats); // Dashboard accesible a cualquier usuario autenticado

export default router;
