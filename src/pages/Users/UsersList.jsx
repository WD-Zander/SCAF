import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit, Shield, CheckCircle2, XCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getPermissionLabel } from '../../data/permissions';
import { api } from '../../api';

const UsersList = () => {
  const navigate = useNavigate();
  const { setGlobalAlert, hasPermission } = useAppContext();
  const [viewState, setViewState] = useState('list'); // 'list' | 'editUser'
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', username: '', email: '', roleId: '', password: '', isActive: true });

  useEffect(() => { fetchData(); }, []);

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
        setFetchError('No se pudo conectar con el servidor.');
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
        } catch {
          setGlobalAlert({ isOpen: true, title: 'Error del Servidor', message: `No se pudo guardar. Status: ${res?.status}` });
        }
      }
    } catch (e) { setGlobalAlert({ isOpen: true, title: 'Error', message: 'Error de conexión.' }); }
  };

  // Selected role info for the form
  const selectedRole = roles.find(r => r.id === userForm.roleId);

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

          {/* Role permissions summary */}
          {selectedRole && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Permisos del rol: {selectedRole.name}
              </p>
              {selectedRole.permissions?.includes('all') ? (
                <span className="badge success" style={{ fontSize: '0.75rem' }}>ACCESO TOTAL</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(selectedRole.permissions || []).map(p => (
                    <span key={p} style={{
                      fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px',
                      background: 'rgba(37,99,235,0.06)', color: 'var(--accent-primary)', fontWeight: 500,
                    }}>
                      {getPermissionLabel(p)}
                    </span>
                  ))}
                  {(!selectedRole.permissions || selectedRole.permissions.length === 0) && (
                    <span className="text-muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Sin permisos asignados</span>
                  )}
                </div>
              )}
            </div>
          )}

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
  // RENDER: LIST PAGE
  // ============================
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users className="text-accent" /> Usuarios del Sistema
          </h1>
          <p className="text-muted">Administra los usuarios y sus credenciales de acceso.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {hasPermission('roles_view') && (
            <button className="btn-secondary" onClick={() => navigate('/roles')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} /> Gestionar Roles
            </button>
          )}
          {hasPermission('users_create') && (
            <button className="btn-primary" onClick={() => handleOpenUserModal()}>
              <Plus size={18} /> Nuevo Usuario
            </button>
          )}
        </div>
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
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default UsersList;
