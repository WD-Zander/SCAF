import express from 'express';
import { getSuppliers, createSupplier, createSupplierBatch, updateSupplier, deleteSupplier } from '../controllers/suppliers.controller.js';

const router = express.Router();

router.get('/', getSuppliers);
router.post('/batch', createSupplierBatch);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
