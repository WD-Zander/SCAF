import express from 'express';
import { requireRole } from '../middleware/auth.js';
import { factoryReset, testDb, saveDb, getSettings, updateSettings } from '../controllers/system.controller.js';

const router = express.Router();

// Solo SUPERADMIN puede ejecutar acciones destructivas
router.post('/factory-reset', requireRole('SUPERADMIN'), factoryReset);
router.post('/db/test', requireRole('SUPERADMIN', 'ROL-ADMIN'), testDb);
router.post('/db/save', requireRole('SUPERADMIN'), saveDb);

// Configuración de empresa: cualquier usuario autenticado puede leer, solo admins modificar
router.get('/settings', getSettings);
router.put('/settings', requireRole('SUPERADMIN', 'ROL-ADMIN'), updateSettings);

export default router;
