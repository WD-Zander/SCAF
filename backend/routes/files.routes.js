import express from 'express';
import { getFiles, createFile, createFileBatch, updateFile, deleteFile } from '../controllers/files.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/:entity', getFiles); // Lectura de configuración: accesible a cualquier usuario autenticado
router.post('/:entity/batch', requirePermission('files_manage'), createFileBatch);
router.post('/:entity', requirePermission('files_manage'), createFile);
router.put('/:entity/:id', requirePermission('files_manage'), updateFile);
router.delete('/:entity/:id', requirePermission('files_manage'), deleteFile);

export default router;
