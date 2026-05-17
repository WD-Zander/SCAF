import express from 'express';
import {
  getForms, getFormById, createForm, updateForm, deleteForm,
  getFormRecords, createFormRecord, deleteFormRecord
} from '../controllers/forms.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/',            requirePermission('forms_view'), getForms);
router.get('/:id',         requirePermission('forms_view'), getFormById);
router.post('/',           requirePermission('forms_create'), createForm);
router.put('/:id',         requirePermission('forms_edit'), updateForm);
router.delete('/:id',      requirePermission('forms_delete'), deleteForm);

// Registros (respuestas)
router.get('/:id/records',              requirePermission('forms_view', 'forms_fill'), getFormRecords);
router.post('/:id/records',             requirePermission('forms_fill'), createFormRecord);
router.delete('/:formId/records/:recordId', requirePermission('forms_delete'), deleteFormRecord);

export default router;
