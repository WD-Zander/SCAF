import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Shield, CheckCircle2, XCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';

const PERMISSION_GROUPS = [
  {
    module: 'Sistema',
    permissions: [
      { id: 'all', label: 'Acceso Total (SuperAdmin)' },
      { id: 'dashboard', label: 'Ver Dashboard' },
      { id: 'settings', label: 'Configuración del Sistema' },
      { id: 'audit', label: 'Ver Auditoría' }
    ]
  },
  {
    module: 'Inventario (Activos)',
    permissions: [
      { id: 'inventory_view', label: 'Ver Inventario' },
      { id: 'inventory_create', label: 'Crear Activos' },
      { id: 'inventory_edit', label: 'Editar Activos' },
      { id: 'inventory_delete', label: 'Borrar Activos' },
      { id: 'inventory_status', label: 'Cambiar Estado de Activo' }
    ]
  },
  {
    module: 'Mantenimientos y Tareas',
    permissions: [
      { id: 'maintenances_view', label: 'Ver Mantenimientos' },
      { id: 'maintenances_create', label: 'Crear/Planificar Mantenimientos' },
      { id: 'maintenances_edit', label: 'Editar Mantenimientos' },
      { id: 'maintenances_delete', label: 'Borrar Mantenimientos' },
      { id: 'maintenances_status', label: 'Cambiar Estatus de Tareas' }
    ]
  },
  {
    module: 'Proveedores',
    permissions: [
      { id: 'suppliers_view', label: 'Ver Proveedores' },
      { id: 'suppliers_create', label: 'Crear Proveedores' },
      { id: 'suppliers_edit', label: 'Editar Proveedores' },
      { id: 'suppliers_delete', label: 'Borrar Proveedores' }
    ]
  },
  {
    module: 'Usuarios y Roles',
    permissions: [
      { id: 'users_view', label: 'Ver Usuarios y Roles' },
      { id: 'users_create', label: 'Crear Usuarios/Roles' },
      { id: 'users_edit', label: 'Editar Usuarios/Roles' },
      { id: 'users_delete', label: 'Borrar Usuarios/Roles' }
    ]
  },
  {
    module: 'Otros Módulos',
    permissions: [
      { id: 'calendar', label: 'Ver Calendario' },
      { id: 'assignments', label: 'Gestión de Asignaciones' },
      { id: 'files', label: 'Gestión de Ficheros' }
    ]
  }
];

const getPermissionLabel = (permId) => {
  if (permId === 'all') return 'ACCESO TOTAL';
  for (const group of PERMISSION_GROUPS) {
    const p = group.permissions.find(x => x.id === permId);
    if (p) return p.label;
  }
  return permId;
};

const UsersList = () => {
  const { setGlobalAlert, currentUser, hasPermission } = useAppContext();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'roles'
  const [viewState, setViewState] = useState('list'); // 'list', 'editUser', 'editRole'
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const [userForm, setUserForm] = useState({ name: '', username: '', email: '', roleId: '', password: '', isActive: true });
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetchError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/roles')
      ]);
      if (usersRes?.ok) setUsers(await usersRes.json());
      else if (usersRes) {
        const err = await usersRes.json().catch(() => ({}));
        setFetchError(err.error || `Error del servidor (${usersRes.status})`);
      } else {
        setFetchError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
      }
      if (rolesRes?.ok) setRoles(await rolesRes.json());
    } catch (e) {
      console.error(e);
      setFetchError('Error inesperado al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const getNextId = (prefix, list) => {
    let maxNum = 0;
    for (const item of list) {
      const match = item.id?.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // --- USER HANDLERS ---
  const handleOpenUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ name: user.name, username: user.username || '', email: user.email || '', roleId: user.roleId, password: '', isActive: user.isActive });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', username: '', email: '', roleId: roles.length > 0 ? roles[0].id : '', password: '', isActive: true });
    }
    setViewState('editUser');
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.username || !userForm.roleId) return setGlobalAlert({ isOpen: true, title: 'Error', message: 'Faltan campos obligatorios (Nombre, Usuario y Rol)' });
    if (!editingUser && !userForm.password) return setGlobalAlert({ isOpen: true, title: 'Error', message: 'Debes asignar una contraseña' });

    try {
      const body = editingUser ? userForm : { ...userForm, id: getNextId('USR', users) };

      const res = editingUser
        ? await api.put(`/api/users/${editingUser.id}`, body)
        : await api.post('/api/users', body);

      if (res?.ok) {
        setGlobalAlert({ isOpen: true, title: 'Éxito', message: 'Usuario guardado' });
        setViewState('list');
        fetchData();
      } else {
        try {
          const err = await res?.json();
          setGlobalAlert({ isOpen: true, title: 'Error', message: err?.error });
        } catch(parseErr) {
          setGlobalAlert({ isOpen: true, title: 'Error del Servidor', message: `No se pudo guardar. ¿Reiniciaste el servidor backend (node server.js)? Status: ${res?.status}` });
        }
      }
    } catch (e) { setGlobalAlert({ isOpen: true, title: 'Error', message: 'Error de conexión. Verifica que el servidor backend esté corriendo.' }); }
  };

  // --- ROLE HANDLERS ---
  const handleOpenRoleModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, permissions: role.permissions || [] });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', permissions: [] });
    }
    setViewState('editRole');
  };

  const handleTogglePermission = (permId) => {
    let newPerms = [...roleForm.permissions];
    if (newPerms.includes(permId)) {
      newPerms = newPerms.filter(p => p !== permId);
    } else {
      newPerms.push(permId);
    }
    setRoleForm({ ...roleForm, permissions: newPerms });
  };

  const handleSaveRole = async () => {
    if (!roleForm.name) return setGlobalAlert({ isOpen: true, title: 'Error', message: 'El rol debe tener nombre' });

    try {
      const body = editingRole ? roleForm : { ...roleForm, id: getNextId('ROL', roles) };

      const res = editingRole
        ? await api.put(`/api/roles/${editingRole.id}`, body)
        : await api.post('/api/roles', body);

      if (res?.ok) {
        setGlobalAlert({ isOpen: true, title: 'Éxito', message: 'Rol guardado' });
        setViewState('list');
        fetchData();
      } else {
        try {
          const err = await res?.json();
          setGlobalAlert({ isOpen: true, title: 'Error', message: err?.error });
        } catch(parseErr) {
          setGlobalAlert({ isOpen: true, title: 'Error del Servidor', message: `No se pudo guardar el rol. ¿Reiniciaste el backend? Status: ${res?.status}` });
        }
      }
    } catch (e) { setGlobalAlert({ isOpen: true, title: 'Error', message: 'Error de conexión. Verifica que el servidor backend esté corriendo.' }); }
  };

  // ============================
  // RENDER: EDIT USER PAGE
  // ============================
  if (viewState === 'editUser') {
    return (
      <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
        <button className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setViewState('list')}>
          <ArrowLeft size={18} /> Volver a la Lista
        </button>
        <div className="glass-panel" style={{ maxWidth: '800px', padding: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
          <p className="text-muted" style={{ marginBottom: '32px' }}>Completa los datos del perfil y asigna las credenciales de acceso.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className="input-group">
              <label>Nombre Completo</label>
              <input type="text" className="input-control" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="Ej. Juan Pérez" />
            </div>
            <div className="input-group">
              <label>Usuario (para iniciar sesión)</label>
              <input type="text" className="input-control" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value.toLowerCase().replace(/\s/g, '')})} disabled={editingUser && userForm.username === 'admin'} placeholder="Ej. jperez" autoComplete="off" />
            </div>
            <div className="input-group">
              <label>Correo Electrónico (opcional)</label>
              <input type="email" className="input-control" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="juan@empresa.com" />
            </div>
            <div className="input-group">
              <label>Rol del Sistema</label>
              <select className="input-control" value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})} disabled={editingUser && userForm.username === 'admin'}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Contraseña {editingUser && '(Opcional)'}</label>
              <input type="password" className="input-control" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder={editingUser ? "Dejar en blanco para no cambiar" : "******"} />
            </div>
          </div>
          
          {editingUser && userForm.username !== 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <input type="checkbox" id="isActive" checked={userForm.isActive} onChange={e => setUserForm({...userForm, isActive: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
              <div>
                <label htmlFor="isActive" style={{ fontWeight: 600, cursor: 'pointer', display: 'block' }}>Usuario Activo en el Sistema</label>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Si se desmarca, este usuario no podrá iniciar sesión.</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
            <button className="btn-secondary" onClick={() => setViewState('list')}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveUser}>{editingUser ? 'Guardar Cambios' : 'Registrar Usuario'}</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // RENDER: EDIT ROLE PAGE
  // ============================
  if (viewState === 'editRole') {
    return (
      <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
        <button className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setViewState('list')}>
          <ArrowLeft size={18} /> Volver a la Lista
        </button>
        <div className="glass-panel" style={{ maxWidth: '900px', padding: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>{editingRole ? 'Editar Perfil de Rol' : 'Diseñar Nuevo Rol'}</h2>
          <p className="text-muted" style={{ marginBottom: '32px' }}>Configura los niveles de acceso y los módulos permitidos para este rol en el sistema.</p>
          
          <div className="input-group" style={{ maxWidth: '400px', marginBottom: '32px' }}>
            <label>Nombre del Rol</label>
            <input type="text" className="input-control" style={{ fontSize: '1.1rem', padding: '14px 16px' }} value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} placeholder="Ej. TÉCNICO DE CAMPO" />
          </div>

          <h3 style={{ marginBottom: '16px', fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Matriz de Permisos por Módulo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            {PERMISSION_GROUPS.map(group => (
              <div key={group.module} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>{group.module}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {group.permissions.map(p => {
                    const isSelected = roleForm.permissions.includes(p.id);
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => handleTogglePermission(p.id)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--success)' : 'var(--glass-border)',
                          borderRadius: '8px', 
                          background: isSelected ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-primary)', 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ 
                          width: '20px', height: '20px', borderRadius: '6px', 
                          border: '2px solid', borderColor: isSelected ? 'var(--success)' : '#cbd5e1',
                          background: isSelected ? 'var(--success)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isSelected && <CheckCircle2 size={14} color="#fff" />}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--text-main)' : 'var(--text-muted)' }}>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
            <button className="btn-secondary" onClick={() => setViewState('list')}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveRole}>{editingRole ? 'Guardar Cambios' : 'Crear Rol'}</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // RENDER: LIST PAGE
  // ============================
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users className="text-accent" /> Control de Acceso
          </h1>
          <p className="text-muted">Administra los usuarios, perfiles y permisos de la plataforma.</p>
        </div>
        <div>
          {activeTab === 'users' ? (
            hasPermission('users_create') && <button className="btn-primary" onClick={() => handleOpenUserModal()}><Plus size={18} /> Nuevo Usuario</button>
          ) : (
            hasPermission('users_create') && <button className="btn-primary" onClick={() => handleOpenRoleModal()}><Plus size={18} /> Nuevo Rol</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ padding: '12px 24px', borderBottom: activeTab === 'users' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'users' ? 'var(--text-main)' : 'var(--text-muted)' }}
        >
          <Users size={16} style={{ display: 'inline', marginRight: '8px' }} /> Usuarios Registrados
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          style={{ padding: '12px 24px', borderBottom: activeTab === 'roles' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'roles' ? 'var(--text-main)' : 'var(--text-muted)' }}
        >
          <Shield size={16} style={{ display: 'inline', marginRight: '8px' }} /> Configuración de Roles
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos...</div>
        ) : fetchError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>Error al cargar datos</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{fetchError}</p>
            <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={fetchData}>Reintentar</button>
          </div>
        ) : activeTab === 'users' ? (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>USUARIO</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>ROL ASIGNADO</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>ESTADO</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover mobile-list-format">
                    <td data-label="USUARIO" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                          {(u.name || u.email || '??').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>@{u.username || u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="ROL" style={{ padding: '16px 20px' }}>
                      <span className="badge info" style={{ display: 'inline-flex', gap: '4px' }}>
                        <Shield size={12} /> {roles.find(r => r.id === u.roleId)?.name || u.roleId}
                      </span>
                    </td>
                    <td data-label="ESTADO" style={{ padding: '16px 20px' }}>
                      {u.isActive ? (
                        <span className="badge success" style={{ display: 'inline-flex', gap: '4px' }}><CheckCircle2 size={12} /> Activo</span>
                      ) : (
                        <span className="badge danger" style={{ display: 'inline-flex', gap: '4px' }}><XCircle size={12} /> Inactivo</span>
                      )}
                    </td>
                    <td data-label="ACCIONES" style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {hasPermission('users_edit') && (
                        <button className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }} onClick={() => handleOpenUserModal(u)}>
                          <Edit size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {roles.map(r => (
                <div key={r.id} style={{ padding: '20px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'var(--bg-primary)' }}>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <KeyRound className="text-accent" size={20} />
                      <strong style={{ fontSize: '1.1rem' }}>{r.name}</strong>
                    </div>
                    {hasPermission('users_edit') && (
                      <button className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }} onClick={() => handleOpenRoleModal(r)}>
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  <div>
                    {r.permissions?.includes('all') ? (
                      <span className="badge success">ACCESO TOTAL</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {r.permissions?.map(p => (
                          <span key={p} className="badge info" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>{getPermissionLabel(p)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;
