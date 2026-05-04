import express from 'express';
import { getFiles, createFile, createFileBatch, updateFile, deleteFile } from '../controllers/files.controller.js';

const router = express.Router();

router.get('/:entity', getFiles);
router.post('/:entity/batch', createFileBatch);
router.post('/:entity', createFile);
router.put('/:entity/:id', updateFile);
router.delete('/:entity/:id', deleteFile);

export default router;
