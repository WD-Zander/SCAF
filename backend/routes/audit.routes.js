import express from 'express';
import { getAuditLogs, getAuditUsers, getAuditEntities } from '../controllers/audit.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('audit_view'), getAuditLogs);
router.get('/users', requirePermission('audit_view'), getAuditUsers);
router.get('/entities', requirePermission('audit_view'), getAuditEntities);

export default router;
