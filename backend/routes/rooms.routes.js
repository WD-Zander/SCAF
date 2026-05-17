import express from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/rooms.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/',     getRooms); // Lectura accesible: se usa en formularios
router.post('/',    requirePermission('infrastructure_manage'), createRoom);
router.put('/:id',  requirePermission('infrastructure_manage'), updateRoom);
router.delete('/:id', requirePermission('infrastructure_manage'), deleteRoom);

export default router;
