import express from 'express';
import { getScopes, createScope, updateScope, deleteScope } from '../controllers/maintenanceScopes.controller.js';

const router = express.Router();

router.get('/',     getScopes);
router.post('/',    createScope);
router.put('/:id',  updateScope);
router.delete('/:id', deleteScope);

export default router;
