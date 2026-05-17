/**
 * Seed de roles por defecto para SCAF.
 * Ejecutar: node backend/seed-default-roles.js
 *
 * - Crea roles si no existen (upsert)
 * - No sobreescribe roles ya existentes con permisos personalizados
 */
import './loadEnv.js';
import { getPool, sql } from './db.js';

const DEFAULT_ROLES = [
  {
    id: 'SUPERADMIN',
    name: 'Super Administrador',
    description: 'Acceso total sin restricciones a todos los módulos del sistema.',
    permissions: ['all'],
  },
  {
    id: 'GESTOR',
    name: 'Gestor de Activos',
    description: 'Gestión completa de inventario, mantenimientos, movimientos y proveedores.',
    permissions: [
      'dashboard',
      'inventory_view', 'inventory_create', 'inventory_edit', 'inventory_status', 'inventory_import',
      'movements_view', 'movements_create',
      'calendar_view',
      'maintenances_view', 'maintenances_create', 'maintenances_edit', 'maintenances_status',
      'maintenances_plans', 'maintenances_workorders',
      'suppliers_view',
      'employees_view',
      'files_view',
      'assignments_view', 'assignments_manage',
      'scanner_view',
      'forms_view', 'forms_fill',
    ],
  },
  {
    id: 'TECNICO',
    name: 'Técnico de Campo',
    description: 'Acceso operativo para ejecutar mantenimientos y llenar formularios.',
    permissions: [
      'dashboard',
      'inventory_view',
      'maintenances_view', 'maintenances_status',
      'calendar_view',
      'forms_view', 'forms_fill',
      'scanner_view',
      'assignments_view',
    ],
  },
  {
    id: 'AUDITOR',
    name: 'Auditor',
    description: 'Acceso de solo lectura con reportes y auditoría.',
    permissions: [
      'dashboard',
      'inventory_view',
      'movements_view',
      'maintenances_view',
      'suppliers_view',
      'employees_view',
      'reports_view', 'reports_execute',
      'audit_view',
      'files_view',
    ],
  },
  {
    id: 'OPERADOR',
    name: 'Operador Básico',
    description: 'Acceso mínimo para consultas y escaneo de activos.',
    permissions: [
      'dashboard',
      'inventory_view',
      'maintenances_view', 'maintenances_status',
      'calendar_view',
      'scanner_view',
    ],
  },
];

async function seed() {
  try {
    const db = await getPool();
    console.log('Iniciando seed de roles por defecto...\n');

    for (const role of DEFAULT_ROLES) {
      const exists = await db.request()
        .input('id', sql.VarChar, role.id)
        .query('SELECT ID FROM ROL WHERE ID = @id');

      if (exists.recordset.length > 0) {
        console.log(`  [=] Rol "${role.id}" ya existe, omitido.`);
      } else {
        await db.request()
          .input('id', sql.VarChar, role.id)
          .input('name', sql.VarChar, role.name)
          .input('desc', sql.VarChar, role.description || '')
          .input('perms', sql.NVarChar, JSON.stringify(role.permissions))
          .query('INSERT INTO ROL (ID, NOMBRE, DESCRIPCION, PERMISOS) VALUES (@id, @name, @desc, @perms)');
        console.log(`  [+] Rol "${role.id}" creado con ${role.permissions.length} permisos.`);
      }
    }

    console.log('\nSeed completado.');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
}

seed();
