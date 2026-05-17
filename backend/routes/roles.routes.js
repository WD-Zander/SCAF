import express from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/roles.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('roles_view', 'users_view'), getRoles);
router.post('/', requirePermission('roles_create'), createRole);
router.put('/:id', requirePermission('roles_edit'), updateRole);
router.delete('/:id', requirePermission('roles_delete'), deleteRole);

export default router;
