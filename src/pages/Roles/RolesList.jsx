import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound, Plus, Edit, Trash2, ArrowLeft, CheckCircle2, Shield,
  AlertTriangle, Users, ChevronDown, ChevronRight,
  Settings, Box, PackageOpen, CalendarDays, FileText, BarChart3,
  Wrench, Home, ScanLine, Truck, UserCheck, FolderTree, ListTodo,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { PERMISSION_GROUPS, getPermissionLabel } from '../../data/permissions';
import NoPermission from '../../components/Common/NoPermission';
import { api } from '../../api';

const ICON_MAP = {
  Settings, Box, PackageOpen, CalendarDays, FileText, BarChart3,
  Wrench, Home, ScanLine, Truck, UserCheck, Users, FolderTree, ListTodo,
};

const RolesList = () => {
  const { setGlobalAlert, hasPermission, currentUser } = useAppContext();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState('list'); // 'list' | 'edit'
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ id: '', name: '', permissions: [] });
  const [expandedGroups, setExpandedGroups] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const isSuperAdmin = (currentUser?.role?.permissions || []).includes('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        api.get('/api/roles'),
        api.get('/api/users'),
      ]);
      if (rolesRes?.ok) setRoles(await rolesRes.json());
      if (usersRes?.ok) setUsers(await usersRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getUserCount = (roleId) => users.filter(u => u.roleId === roleId).length;

  const getNextId = () => {
    let max = 0;
    for (const r of roles) {
      const match = r.id?.match(/^ROL-(\d+)$/);
      if (match) { const n = parseInt(match[1], 10); if (n > max) max = n; }
    }
    return `ROL-${String(max + 1).padStart(3, '0')}`;
  };

  // --- HANDLERS ---
  const handleNew = () => {
    setEditingRole(null);
    setRoleForm({ id: getNextId(), name: '', permissions: [] });
    setExpandedGroups({});
    setViewState('edit');
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setRoleForm({ id: role.id, name: role.name, permissions: [...(role.permissions || [])] });
    // Expand groups that have at least one permission selected
    const expanded = {};
    PERMISSION_GROUPS.forEach(g => {
      if (g.permissions.some(p => (role.permissions || []).includes(p.id))) {
        expanded[g.module] = true;
      }
    });
    setExpandedGroups(expanded);
    setViewState('edit');
  };

  const handleDelete = async (role) => {
    try {
      const res = await api.delete(`/api/roles/${role.id}`);
      if (res?.ok) {
        setGlobalAlert({ isOpen: true, title: 'Eliminado', message: `Rol "${role.name}" eliminado correctamente.` });
        setConfirmDelete(null);
        fetchData();
      } else {
        const err = await res?.json().catch(() => ({}));
        setGlobalAlert({ isOpen: true, title: 'Error', message: err.error || 'No se pudo eliminar el rol.' });
      }
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: 'Error de conexión.' });
    }
  };

  const handleTogglePermission = (permId) => {
    setRoleForm(prev => {
      let perms = [...prev.permissions];
      if (permId === 'all') {
        // Toggle superadmin: if already has 'all', remove it; otherwise set only 'all'
        return { ...prev, permissions: perms.includes('all') ? [] : ['all'] };
      }
      // If has 'all', remove it first
      perms = perms.filter(p => p !== 'all');
      if (perms.includes(permId)) {
        perms = perms.filter(p => p !== permId);
      } else {
        perms.push(permId);
      }
      return { ...prev, permissions: perms };
    });
  };

  const handleToggleGroup = (group) => {
    const groupPermIds = group.permissions.map(p => p.id).filter(id => id !== 'all');
    const allSelected = groupPermIds.every(id => roleForm.permissions.includes(id));

    setRoleForm(prev => {
      let perms = prev.permissions.filter(p => p !== 'all');
      if (allSelected) {
        // Deselect all in group
        perms = perms.filter(p => !groupPermIds.includes(p));
      } else {
        // Select all in group
        groupPermIds.forEach(id => { if (!perms.includes(id)) perms.push(id); });
      }
      return { ...prev, permissions: perms };
    });
  };

  const handleSave = async () => {
    if (!roleForm.name.trim()) {
      return setGlobalAlert({ isOpen: true, title: 'Error', message: 'El rol debe tener un nombre.' });
    }

    try {
      const body = { name: roleForm.name.trim(), permissions: roleForm.permissions };
      const res = editingRole
        ? await api.put(`/api/roles/${editingRole.id}`, body)
        : await api.post('/api/roles', { ...body, id: roleForm.id });

      if (res?.ok) {
        setGlobalAlert({ isOpen: true, title: 'Guardado', message: `Rol "${roleForm.name}" guardado correctamente.` });
        setViewState('list');
        fetchData();
      } else {
        const err = await res?.json().catch(() => ({}));
        setGlobalAlert({ isOpen: true, title: 'Error', message: err.error || 'No se pudo guardar.' });
      }
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: 'Error de conexión.' });
    }
  };

  const toggleGroupExpand = (module) => {
    setExpandedGroups(prev => ({ ...prev, [module]: !prev[module] }));
  };

  // --- Permission summary for list view ---
  const getPermissionSummary = (permissions) => {
    if (!permissions || permissions.length === 0) return [];
    if (permissions.includes('all')) return [{ module: 'Sistema', label: 'ACCESO TOTAL', color: '#d97706' }];

    const summary = [];
    PERMISSION_GROUPS.forEach(g => {
      const groupPermIds = g.permissions.map(p => p.id).filter(id => id !== 'all');
      const count = groupPermIds.filter(id => permissions.includes(id)).length;
      if (count > 0) {
        summary.push({
          module: g.module,
          label: count === groupPermIds.length ? 'Completo' : `${count}/${groupPermIds.length}`,
          full: count === groupPermIds.length,
        });
      }
    });
    return summary;
  };

  // --- ACCESS CHECK ---
  if (!hasPermission('roles_view')) {
    return <NoPermission />;
  }

  const hasAllPerm = roleForm.permissions.includes('all');

  // ========== EDIT VIEW ==========
  if (viewState === 'edit') {
    const canEdit = editingRole?.id === 'SUPERADMIN' ? isSuperAdmin : true;

    return (
      <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
        <button className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setViewState('list')}>
          <ArrowLeft size={18} /> Volver a Roles
        </button>

        <div style={{ maxWidth: '960px' }}>
          <div className="glass-panel" style={{ padding: '32px', marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <KeyRound className="text-accent" size={24} />
              {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
            </h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '28px' }}>
              Configura los permisos granulares que tendrán los usuarios con este rol.
            </p>

            {!canEdit && (
              <div style={{ padding: '14px 18px', background: 'rgba(234,179,8,0.08)', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} style={{ color: '#a16207' }} />
                <span style={{ fontSize: '0.85rem', color: '#a16207' }}>Solo un Super Administrador puede modificar este rol.</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '16px' }}>
              <div className="input-group">
                <label>ID del Rol</label>
                <input
                  type="text"
                  className="input-control"
                  value={roleForm.id}
                  disabled
                  style={{ opacity: 0.6, fontFamily: 'monospace' }}
                />
              </div>
              <div className="input-group">
                <label>Nombre del Rol</label>
                <input
                  type="text"
                  className="input-control"
                  value={roleForm.name}
                  onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Ej. Gestor de Activos"
                  disabled={!canEdit}
                  style={{ fontSize: '1.05rem' }}
                />
              </div>
            </div>
          </div>

          {/* SuperAdmin warning */}
          {hasAllPerm && (
            <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '20px', border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} style={{ color: '#d97706' }} />
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Acceso Total activado</strong>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                    Este rol tiene acceso sin restricciones a todos los módulos del sistema. Los permisos individuales no aplican.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Permission Matrix */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              Matriz de Permisos por Módulo
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {PERMISSION_GROUPS.map(group => {
                const groupPermIds = group.permissions.map(p => p.id).filter(id => id !== 'all');
                const selectedCount = groupPermIds.filter(id => roleForm.permissions.includes(id)).length;
                const allInGroup = groupPermIds.length > 0 && selectedCount === groupPermIds.length;
                const someInGroup = selectedCount > 0 && !allInGroup;
                const isExpanded = expandedGroups[group.module];
                const IconComp = ICON_MAP[group.icon] || Settings;

                // Skip the "all" permission rendering in groups — it's handled separately
                const visiblePerms = group.permissions.filter(p => p.id !== 'all');
                const hasAllEntry = group.permissions.some(p => p.id === 'all');

                return (
                  <div key={group.module} style={{
                    background: 'var(--bg-secondary)', borderRadius: '12px',
                    border: `1px solid ${allInGroup || hasAllPerm ? 'rgba(34,197,94,0.3)' : someInGroup ? 'rgba(37,99,235,0.2)' : 'var(--glass-border)'}`,
                    overflow: 'hidden',
                  }}>
                    {/* Group Header */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 18px', cursor: canEdit ? 'pointer' : 'default',
                      }}
                      onClick={() => canEdit && toggleGroupExpand(group.module)}
                    >
                      <IconComp size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem' }}>{group.module}</span>

                      {/* Count badge */}
                      {!hasAllPerm && visiblePerms.length > 0 && (
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '10px',
                          background: allInGroup ? 'rgba(34,197,94,0.1)' : someInGroup ? 'rgba(37,99,235,0.08)' : 'var(--bg-tertiary)',
                          color: allInGroup ? '#15803d' : someInGroup ? 'var(--accent-primary)' : 'var(--text-muted)',
                        }}>
                          {selectedCount}/{groupPermIds.length}
                        </span>
                      )}
                      {hasAllPerm && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', color: '#15803d' }}>
                          Completo
                        </span>
                      )}

                      {/* "Select all" toggle */}
                      {canEdit && !hasAllPerm && visiblePerms.length > 0 && (
                        <div
                          onClick={(e) => { e.stopPropagation(); handleToggleGroup(group); }}
                          title={allInGroup ? 'Quitar todos' : 'Seleccionar todos'}
                          style={{
                            width: '36px', height: '20px', borderRadius: '10px',
                            background: allInGroup ? 'var(--success)' : someInGroup ? 'var(--accent-primary)' : '#cbd5e1',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                          }}
                        >
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            background: '#fff', position: 'absolute', top: '2px',
                            left: allInGroup ? '18px' : '2px',
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          }} />
                        </div>
                      )}

                      {/* "all" toggle for Sistema group */}
                      {hasAllEntry && canEdit && (
                        <div
                          onClick={(e) => { e.stopPropagation(); handleTogglePermission('all'); }}
                          title="Acceso Total (SuperAdmin)"
                          style={{
                            padding: '4px 12px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                            background: hasAllPerm ? 'rgba(217,119,6,0.12)' : 'var(--bg-tertiary)',
                            color: hasAllPerm ? '#d97706' : 'var(--text-muted)',
                            border: `1px solid ${hasAllPerm ? 'rgba(217,119,6,0.3)' : 'var(--glass-border)'}`,
                          }}
                        >
                          {hasAllPerm ? 'ALL ACTIVO' : 'ALL'}
                        </div>
                      )}

                      {canEdit && (
                        isExpanded
                          ? <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Expanded permissions */}
                    {isExpanded && !hasAllPerm && canEdit && visiblePerms.length > 0 && (
                      <div style={{
                        padding: '4px 18px 18px',
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px',
                      }}>
                        {visiblePerms.map(p => {
                          const isSelected = roleForm.permissions.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleTogglePermission(p.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--success)' : 'var(--glass-border)',
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-primary)',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                            >
                              <div style={{
                                width: '18px', height: '18px', borderRadius: '5px',
                                border: '2px solid', borderColor: isSelected ? 'var(--success)' : '#cbd5e1',
                                background: isSelected ? 'var(--success)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                {isSelected && <CheckCircle2 size={12} color="#fff" />}
                              </div>
                              <span style={{
                                fontSize: '0.85rem',
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                              }}>
                                {p.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Resumen: {hasAllPerm ? 'ACCESO TOTAL' : `${roleForm.permissions.filter(p => p !== 'all').length} permisos seleccionados`}
              </p>
              {!hasAllPerm && roleForm.permissions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {roleForm.permissions.map(p => (
                    <span key={p} style={{
                      fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px',
                      background: 'rgba(37,99,235,0.06)', color: 'var(--accent-primary)', fontWeight: 500,
                    }}>
                      {getPermissionLabel(p)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '24px' }}>
              <button className="btn-secondary" onClick={() => setViewState('list')}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} style={{ padding: '12px 32px' }}>
                {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== LIST VIEW ==========
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <KeyRound className="text-accent" size={28} /> Gestión de Roles
          </h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            Configura los perfiles de acceso y permisos del sistema — <strong style={{ color: 'var(--text-main)' }}>{roles.length}</strong> roles
          </p>
        </div>
        {hasPermission('roles_create') && (
          <button className="btn-primary" onClick={handleNew}>
            <Plus size={18} /> Nuevo Rol
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <p className="text-muted">Cargando roles...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {roles.map(role => {
            const summary = getPermissionSummary(role.permissions);
            const userCount = getUserCount(role.id);
            const isAll = role.permissions?.includes('all');

            return (
              <div key={role.id} className="glass-panel" style={{
                padding: '24px', position: 'relative',
                border: isAll ? '1px solid rgba(217,119,6,0.2)' : '1px solid var(--glass-border)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: isAll ? 'rgba(217,119,6,0.08)' : 'rgba(37,99,235,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {isAll ? <Shield size={22} style={{ color: '#d97706' }} /> : <KeyRound size={22} style={{ color: 'var(--accent-primary)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '2px' }}>{role.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--accent-primary)',
                        background: 'rgba(37,99,235,0.06)', padding: '1px 8px', borderRadius: '4px', fontWeight: 600,
                      }}>
                        {role.id}
                      </span>
                      <span style={{
                        fontSize: '0.72rem', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '3px',
                      }}>
                        <Users size={11} /> {userCount} usuario{userCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {hasPermission('roles_edit') && (
                      <button className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }} onClick={() => handleEdit(role)} title="Editar">
                        <Edit size={15} />
                      </button>
                    )}
                    {hasPermission('roles_delete') && role.id !== 'SUPERADMIN' && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px', borderRadius: '8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                        onClick={() => setConfirmDelete(role)}
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Permission summary */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {summary.map((s, i) => (
                    <span key={i} style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
                      background: s.color ? `rgba(217,119,6,0.08)` : s.full ? 'rgba(34,197,94,0.08)' : 'var(--bg-tertiary)',
                      color: s.color || (s.full ? '#15803d' : 'var(--text-muted)'),
                      border: `1px solid ${s.color ? 'rgba(217,119,6,0.15)' : s.full ? 'rgba(34,197,94,0.15)' : 'var(--glass-border)'}`,
                    }}>
                      {s.module}: {s.label}
                    </span>
                  ))}
                  {summary.length === 0 && (
                    <span className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Sin permisos asignados</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <>
          <div onClick={() => setConfirmDelete(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200,
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 201, textAlign: 'center',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'rgba(220,38,38,0.08)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Trash2 size={26} style={{ color: 'var(--danger)' }} />
            </div>
            <h3 style={{ marginBottom: '8px' }}>Eliminar Rol</h3>
            <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '24px' }}>
              ¿Estás seguro de eliminar el rol <strong>"{confirmDelete.name}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)} style={{ padding: '10px 24px' }}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ padding: '10px 24px', background: 'var(--danger)' }}
                onClick={() => handleDelete(confirmDelete)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RolesList;
