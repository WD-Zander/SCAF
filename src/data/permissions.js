export const PERMISSION_GROUPS = [
  {
    module: 'Sistema',
    icon: 'Settings',
    permissions: [
      { id: 'all', label: 'Acceso Total (SuperAdmin)', description: 'Acceso sin restricciones a todos los módulos' },
      { id: 'dashboard', label: 'Ver Dashboard' },
      { id: 'settings_view', label: 'Ver Configuración' },
      { id: 'settings_edit', label: 'Editar Configuración' },
      { id: 'audit_view', label: 'Ver Auditoría' },
    ]
  },
  {
    module: 'Inventario (Activos)',
    icon: 'Box',
    permissions: [
      { id: 'inventory_view', label: 'Ver Inventario' },
      { id: 'inventory_create', label: 'Crear Activos' },
      { id: 'inventory_edit', label: 'Editar Activos' },
      { id: 'inventory_delete', label: 'Eliminar Activos' },
      { id: 'inventory_status', label: 'Cambiar Estado' },
      { id: 'inventory_import', label: 'Importar (Excel)' },
    ]
  },
  {
    module: 'Movimientos',
    icon: 'PackageOpen',
    permissions: [
      { id: 'movements_view', label: 'Ver Movimientos' },
      { id: 'movements_create', label: 'Registrar Movimientos' },
    ]
  },
  {
    module: 'Calendario',
    icon: 'CalendarDays',
    permissions: [
      { id: 'calendar_view', label: 'Ver Calendario' },
    ]
  },
  {
    module: 'Formularios',
    icon: 'FileText',
    permissions: [
      { id: 'forms_view', label: 'Ver Formularios' },
      { id: 'forms_create', label: 'Crear Formularios' },
      { id: 'forms_edit', label: 'Editar Formularios' },
      { id: 'forms_delete', label: 'Eliminar Formularios' },
      { id: 'forms_fill', label: 'Llenar Formularios' },
    ]
  },
  {
    module: 'Informes',
    icon: 'BarChart3',
    permissions: [
      { id: 'reports_view', label: 'Ver Informes' },
      { id: 'reports_create', label: 'Crear Informes' },
      { id: 'reports_edit', label: 'Editar Informes' },
      { id: 'reports_delete', label: 'Eliminar Informes' },
      { id: 'reports_execute', label: 'Ejecutar Consultas SQL' },
    ]
  },
  {
    module: 'Operaciones (Mantenimientos)',
    icon: 'Wrench',
    permissions: [
      { id: 'maintenances_view', label: 'Ver Mantenimientos' },
      { id: 'maintenances_create', label: 'Crear Mantenimientos' },
      { id: 'maintenances_edit', label: 'Editar Mantenimientos' },
      { id: 'maintenances_delete', label: 'Eliminar Mantenimientos' },
      { id: 'maintenances_status', label: 'Cambiar Estatus de Tareas' },
      { id: 'maintenances_plans', label: 'Gestionar Planes/Rutinas' },
      { id: 'maintenances_workorders', label: 'Gestionar Órdenes de Trabajo' },
      { id: 'maintenances_scopes', label: 'Configurar Módulos/Alcances' },
    ]
  },
  {
    module: 'Infraestructura',
    icon: 'Home',
    permissions: [
      { id: 'infrastructure_view', label: 'Ver Infraestructura' },
      { id: 'infrastructure_manage', label: 'Gestionar Infraestructura' },
    ]
  },
  {
    module: 'Escáner',
    icon: 'ScanLine',
    permissions: [
      { id: 'scanner_view', label: 'Usar Escáner' },
    ]
  },
  {
    module: 'Proveedores',
    icon: 'Truck',
    permissions: [
      { id: 'suppliers_view', label: 'Ver Proveedores' },
      { id: 'suppliers_create', label: 'Crear Proveedores' },
      { id: 'suppliers_edit', label: 'Editar Proveedores' },
      { id: 'suppliers_delete', label: 'Eliminar Proveedores' },
    ]
  },
  {
    module: 'Empleados',
    icon: 'UserCheck',
    permissions: [
      { id: 'employees_view', label: 'Ver Empleados' },
      { id: 'employees_create', label: 'Crear Empleados' },
      { id: 'employees_edit', label: 'Editar Empleados' },
      { id: 'employees_delete', label: 'Eliminar Empleados' },
    ]
  },
  {
    module: 'Usuarios y Roles',
    icon: 'Users',
    permissions: [
      { id: 'users_view', label: 'Ver Usuarios' },
      { id: 'users_create', label: 'Crear Usuarios' },
      { id: 'users_edit', label: 'Editar Usuarios' },
      { id: 'users_delete', label: 'Eliminar Usuarios' },
      { id: 'roles_view', label: 'Ver Roles' },
      { id: 'roles_create', label: 'Crear Roles' },
      { id: 'roles_edit', label: 'Editar Roles' },
      { id: 'roles_delete', label: 'Eliminar Roles' },
    ]
  },
  {
    module: 'Ficheros',
    icon: 'FolderTree',
    permissions: [
      { id: 'files_view', label: 'Ver Ficheros' },
      { id: 'files_manage', label: 'Gestionar Ficheros' },
    ]
  },
  {
    module: 'Asignaciones',
    icon: 'ListTodo',
    permissions: [
      { id: 'assignments_view', label: 'Ver Asignaciones' },
      { id: 'assignments_manage', label: 'Gestionar Asignaciones' },
    ]
  },
];

// Mapa plano para resolución rápida de labels
export const PERMISSION_MAP = {};
PERMISSION_GROUPS.forEach(g => {
  g.permissions.forEach(p => {
    PERMISSION_MAP[p.id] = p.label;
  });
});

export const getPermissionLabel = (permId) => {
  if (permId === 'all') return 'ACCESO TOTAL';
  return PERMISSION_MAP[permId] || permId;
};

// Todos los IDs de permisos (sin 'all') para validación
export const ALL_PERMISSION_IDS = PERMISSION_GROUPS
  .flatMap(g => g.permissions.map(p => p.id))
  .filter(id => id !== 'all');
