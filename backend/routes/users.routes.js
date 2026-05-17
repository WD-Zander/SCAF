import express from 'express';
import { getUsers, createUser, updateUser } from '../controllers/users.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('users_view'), getUsers);
router.post('/', requirePermission('users_create'), createUser);
router.put('/:id', requirePermission('users_edit'), updateUser);

export default router;
