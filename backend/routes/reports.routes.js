import express from 'express';
import {
  getReports, getReportById, createReport, updateReport, deleteReport, executeQuery
} from '../controllers/reports.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/',           requirePermission('reports_view'), getReports);
router.get('/:id',        requirePermission('reports_view'), getReportById);
router.post('/execute',   requirePermission('reports_execute', 'reports_view'), executeQuery);
router.post('/',          requirePermission('reports_create'), createReport);
router.put('/:id',        requirePermission('reports_edit'), updateReport);
router.delete('/:id',     requirePermission('reports_delete'), deleteReport);

export default router;
