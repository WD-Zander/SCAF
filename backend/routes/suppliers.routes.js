import express from 'express';
import { getSuppliers, createSupplier, createSupplierBatch, updateSupplier, deleteSupplier } from '../controllers/suppliers.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('suppliers_view'), getSuppliers);
router.post('/batch', requirePermission('suppliers_create'), createSupplierBatch);
router.post('/', requirePermission('suppliers_create'), createSupplier);
router.put('/:id', requirePermission('suppliers_edit'), updateSupplier);
router.delete('/:id', requirePermission('suppliers_delete'), deleteSupplier);

export default router;
