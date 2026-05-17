import express from 'express';
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employees.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/',     getEmployees); // Lectura accesible: se usa en formularios de mantenimiento
router.get('/:id',  getEmployeeById);
router.post('/',    requirePermission('employees_create'), createEmployee);
router.put('/:id',  requirePermission('employees_edit'), updateEmployee);
router.delete('/:id', requirePermission('employees_delete'), deleteEmployee);

export default router;
