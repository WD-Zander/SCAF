import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Plus, Edit2, Trash2, X, Check, Wrench,
  MapPin, DoorOpen, Box, Building2, Home, Layers, Package,
  Warehouse, Zap, Settings, Star, LayoutGrid, Activity,
  Hammer, ShieldCheck, Thermometer, Droplets, Bolt, Wind,
  FolderTree, FolderOpen, Folder, FilePlus, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import ConfirmModal from '../../components/Common/ConfirmModal';

const AVAILABLE_ICONS = [
  { name: 'MapPin',     component: MapPin },
  { name: 'DoorOpen',   component: DoorOpen },
  { name: 'Box',        component: Box },
  { name: 'Building2',  component: Building2 },
  { name: 'Home',       component: Home },
  { name: 'Layers',     component: Layers },
  { name: 'Package',    component: Package },
  { name: 'Warehouse',  component: Warehouse },
  { name: 'Zap',        component: Zap },
  { name: 'Settings',   component: Settings },
  { name: 'Star',       component: Star },
  { name: 'LayoutGrid', component: LayoutGrid },
  { name: 'Activity',   component: Activity },
  { name: 'Hammer',     component: Hammer },
  { name: 'ShieldCheck',component: ShieldCheck },
  { name: 'Thermometer',component: Thermometer },
  { name: 'Droplets',   component: Droplets },
  { name: 'Bolt',       component: Bolt },
  { name: 'Wind',       component: Wind },
  { name: 'Wrench',     component: Wrench },
];

const PALETTE = [
  '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6',
  '#f97316', '#14b8a6', '#ec4899', '#64748b', '#0ea5e9',
  '#a855f7', '#10b981', '#f59e0b', '#6366f1', '#84cc16',
];

const IconComponent = ({ name, size = 40 }) => {
  const found = AVAILABLE_ICONS.find(i => i.name === name);
  const Comp = found?.component || Wrench;
  return <Comp size={size} />;
};

const BLANK_FORM = { nombre: '', slug: '', color: '#3b82f6', icono: 'Wrench', orden: 99, tipoEntidad: 'activo' };

// ── Mini Tree Node for inline category editor ────────────────────
const MiniTreeNode = ({ node, level = 0, color, onRename, onAddChild, onDelete }) => {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const hasChildren = node.children?.length > 0;

  const saveEdit = () => {
    if (editName.trim()) onRename(node.id, editName.trim());
    else setEditName(node.name);
    setEditing(false);
  };

  return (
    <div style={{
      marginLeft: level > 0 ? '20px' : 0,
      borderLeft: level > 0 ? `1px dashed ${color}40` : 'none',
      paddingLeft: level > 0 ? '12px' : 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 10px', borderRadius: '8px',
        background: level === 0 ? `${color}08` : 'transparent',
        marginBottom: '4px',
        transition: 'background 0.1s',
      }}
        onMouseEnter={e => { if (level > 0) e.currentTarget.style.background = `${color}06`; }}
        onMouseLeave={e => { if (level > 0) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Expand/collapse */}
        <span
          onClick={() => hasChildren && setOpen(!open)}
          style={{ cursor: hasChildren ? 'pointer' : 'default', color, display: 'flex', flexShrink: 0 }}
        >
          {hasChildren
            ? (open ? <FolderOpen size={15} /> : <Folder size={15} />)
            : <FilePlus size={15} style={{ opacity: 0.5 }} />
          }
        </span>

        {/* Name */}
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditing(false); setEditName(node.name); } }}
              style={{
                border: `1px solid ${color}50`, outline: 'none', borderRadius: '6px',
                padding: '3px 8px', fontSize: '0.85rem', flex: 1, background: 'var(--bg-primary, #fff)',
              }}
            />
            <button onClick={saveEdit} style={{ background: color, color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', display: 'flex' }}>
              <Check size={12} />
            </button>
          </div>
        ) : (
          <span
            style={{ flex: 1, fontSize: '0.88rem', fontWeight: level === 0 ? 600 : 500, cursor: 'pointer' }}
            onClick={() => hasChildren && setOpen(!open)}
          >
            {node.name}
          </span>
        )}

        {/* Actions */}
        {!editing && (
          <div style={{ display: 'flex', gap: '2px', opacity: 0.7 }}>
            <button
              onClick={() => { setOpen(true); onAddChild(node.id); }}
              title="Agregar sub-nivel"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color, display: 'flex', borderRadius: '4px' }}
              onMouseEnter={e => e.currentTarget.style.background = `${color}15`}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Plus size={13} />
            </button>
            <button
              onClick={() => setEditing(true)}
              title="Editar nombre"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-muted)', display: 'flex', borderRadius: '4px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary, #f1f5f9)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => onDelete(node.id, node.name)}
              title="Eliminar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--danger)', display: 'flex', borderRadius: '4px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {open && hasChildren && node.children.map(child => (
        <MiniTreeNode
          key={child.id}
          node={child}
          level={level + 1}
          color={color}
          onRename={onRename}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

const MaintenanceTypeSelector = () => {
  const navigate = useNavigate();
  const {
    maintenanceScopes, setMaintenanceScopes, setGlobalAlert,
    maintenances, maintenancePlans, infraTypes,
    assetCategoriesTree, setAssetCategoriesTree, getCategoriesForScope,
  } = useAppContext();

  const ENTITY_TYPES = [
    { value: 'activo', label: 'Activos (Inventario)' },
    ...infraTypes.map(t => ({ value: t.slug, label: t.nombre })),
  ];

  const [showForm, setShowForm] = useState(false);
  const [editingScope, setEditingScope] = useState(null);
  const [formData, setFormData] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nombre: '' });
  const [expandedScopeId, setExpandedScopeId] = useState(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState({ isOpen: false, id: null, name: '' });

  const openCreate = () => {
    setEditingScope(null);
    setFormData(BLANK_FORM);
    setShowForm(true);
  };

  const openEdit = (scope) => {
    setEditingScope(scope);
    setFormData({ nombre: scope.nombre, slug: scope.slug, color: scope.color, icono: scope.icono, orden: scope.orden, tipoEntidad: scope.tipoEntidad || 'activo' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      setGlobalAlert({ isOpen: true, title: 'Validación', message: 'El nombre es obligatorio.' });
      return;
    }
    if (!editingScope && !formData.slug.trim()) {
      setGlobalAlert({ isOpen: true, title: 'Validación', message: 'El identificador (slug) es obligatorio.' });
      return;
    }
    setSaving(true);
    try {
      if (editingScope) {
        const res = await api.put(`/api/maintenance-scopes/${editingScope.id}`, formData);
        if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al guardar');
      } else {
        const res = await api.post('/api/maintenance-scopes', formData);
        if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al guardar');
      }
      const fresh = await api.get('/api/maintenance-scopes');
      if (fresh?.ok) setMaintenanceScopes(await fresh.json());
      setShowForm(false);
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const { id } = confirmDelete;
    setConfirmDelete({ isOpen: false, id: null, nombre: '' });
    try {
      const res = await api.delete(`/api/maintenance-scopes/${id}`);
      if (!res?.ok) {
        const err = await res?.json();
        throw new Error(err?.error || 'Error al eliminar');
      }
      const fresh = await api.get('/api/maintenance-scopes');
      if (fresh?.ok) setMaintenanceScopes(await fresh.json());
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
  };

  const handleNombreChange = (val) => {
    setFormData(prev => ({
      ...prev,
      nombre: val,
      ...(editingScope ? {} : {
        slug: val.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      })
    }));
  };

  const getScopeStats = (slug) => {
    const tickets = maintenances.filter(m => m.scope === slug).length;
    const plans = maintenancePlans.filter(p => p.scope === slug).length;
    return { tickets, plans };
  };

  // ── Category tree helpers for inline editor ────────────────────
  const traverseAndUpdate = (nodes, id, updater) =>
    nodes.map(n => {
      if (n.id === id) return updater(n);
      if (n.children) return { ...n, children: traverseAndUpdate(n.children, id, updater) };
      return n;
    });

  const traverseAndAdd = (nodes, parentId, newNode) =>
    nodes.map(n => {
      if (n.id === parentId) return { ...n, children: [...(n.children || []), newNode] };
      if (n.children) return { ...n, children: traverseAndAdd(n.children, parentId, newNode) };
      return n;
    });

  const traverseAndDelete = (nodes, id) =>
    nodes.filter(n => n.id !== id).map(n => {
      if (n.children) return { ...n, children: traverseAndDelete(n.children, id) };
      return n;
    });

  const handleCatRename = async (catId, newName) => {
    setAssetCategoriesTree(prev => traverseAndUpdate(prev, catId, n => ({ ...n, name: newName })));
    await api.put(`/api/files/categories/${catId}`, { name: newName });
  };

  const handleCatAddChild = async (parentId) => {
    const newId = `CAT-${Date.now().toString().slice(-6)}`;
    const newNode = { id: newId, name: 'Nueva Categoría', children: [] };
    setAssetCategoriesTree(prev => traverseAndAdd(prev, parentId, newNode));
    await api.post('/api/files/categories', { id: newId, name: 'Nueva Categoría', parentId });
  };

  const handleCatAddRoot = async (scopeId) => {
    const newId = `CAT-${Date.now().toString().slice(-6)}`;
    const newNode = { id: newId, name: 'Nueva Categoría', children: [], scopeId };
    setAssetCategoriesTree(prev => [...prev, newNode]);
    await api.post('/api/files/categories', { id: newId, name: 'Nueva Categoría', parentId: null, scopeId });
  };

  const handleCatDeleteRequest = (id, name) => {
    setConfirmDeleteCat({ isOpen: true, id, name });
  };

  const confirmCatDelete = async () => {
    const { id } = confirmDeleteCat;
    setConfirmDeleteCat({ isOpen: false, id: null, name: '' });
    try {
      const res = await api.delete(`/api/files/categories/${id}`);
      if (!res?.ok) {
        const err = await res?.json();
        setGlobalAlert({ isOpen: true, title: 'Error', message: err?.error || 'No se puede eliminar.' });
      } else {
        setAssetCategoriesTree(prev => traverseAndDelete(prev, id));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div className="flex-between">
          <div>
            <h1 style={{ marginBottom: '8px', fontSize: '1.6rem' }}>Módulos de Mantenimiento</h1>
            <p className="text-muted">Configura los tipos de mantenimiento y sus categorías.</p>
          </div>
          <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Plus size={18} /> Nuevo Módulo
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        {maintenanceScopes.filter(s => s.activo !== false).map((scope) => {
          const stats = getScopeStats(scope.slug);
          const isExpanded = expandedScopeId === scope.id;
          const scopeCategories = getCategoriesForScope(scope.slug);

          return (
            <div
              key={scope.id}
              className="glass-panel"
              style={{
                padding: 0, overflow: 'hidden',
                border: `1px solid ${isExpanded ? scope.color : scope.color + '30'}`,
                transition: 'all 0.2s',
              }}
            >
              {/* Color bar */}
              <div style={{ height: '4px', background: `linear-gradient(90deg, ${scope.color}, ${scope.color}80)` }} />

              {/* Card content */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Icon */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `${scope.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: scope.color, flexShrink: 0,
                  }}>
                    <IconComponent name={scope.icono} size={26} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{scope.nombre}</h2>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600, color: scope.color,
                        background: `${scope.color}15`, padding: '2px 8px', borderRadius: '6px',
                      }}>
                        {ENTITY_TYPES.find(e => e.value === (scope.tipoEntidad || 'activo'))?.label || 'Activos'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{stats.tickets}</strong> tickets
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{stats.plans}</strong> planes
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{scopeCategories.length}</strong> categorías
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setExpandedScopeId(isExpanded ? null : scope.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.82rem', padding: '7px 14px',
                        color: scope.color, borderColor: `${scope.color}50`,
                      }}
                    >
                      <FolderTree size={15} />
                      Categorías
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/maintenances/list/${scope.slug}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 14px' }}
                    >
                      Ver <ArrowRight size={14} />
                    </button>
                    <button
                      className="btn-secondary"
                      title="Editar módulo"
                      onClick={() => openEdit(scope)}
                      style={{ padding: '7px', borderRadius: '8px' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-secondary"
                      title="Eliminar módulo"
                      onClick={() => setConfirmDelete({ isOpen: true, id: scope.id, nombre: scope.nombre })}
                      style={{ padding: '7px', borderRadius: '8px', color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Expandable category tree ── */}
              {isExpanded && (
                <div style={{
                  borderTop: `1px solid ${scope.color}20`,
                  background: `${scope.color}03`,
                  padding: '16px 24px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FolderTree size={14} /> Categorías de {scope.nombre}
                    </span>
                    <button
                      onClick={() => handleCatAddRoot(scope.id)}
                      style={{
                        background: 'none', border: `1px dashed ${scope.color}60`,
                        borderRadius: '6px', padding: '4px 12px', cursor: 'pointer',
                        color: scope.color, fontSize: '0.8rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <Plus size={14} /> Nueva Categoría
                    </button>
                  </div>

                  {scopeCategories.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '24px',
                      color: 'var(--text-muted)', fontSize: '0.85rem',
                    }}>
                      No hay categorías para este módulo. Crea la primera para organizar tus planes.
                    </div>
                  ) : (
                    <div>
                      {scopeCategories.map(cat => (
                        <MiniTreeNode
                          key={cat.id}
                          node={cat}
                          color={scope.color}
                          onRename={handleCatRename}
                          onAddChild={handleCatAddChild}
                          onDelete={handleCatDeleteRequest}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {maintenanceScopes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Wrench size={28} style={{ opacity: 0.3 }} />
            </div>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>No hay módulos configurados.</p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>Crea el primero con el botón "Nuevo Módulo".</p>
          </div>
        )}
      </div>

      {/* Modal de creación / edición */}
      {showForm && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            width: '90%', maxWidth: '540px',
            maxHeight: '90vh',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                {editingScope ? `Editar: ${editingScope.nombre}` : 'Nuevo Módulo de Mantenimiento'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '4px', borderRadius: '6px',
              }}><X size={18} /></button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: '1 1 auto' }}>
              {/* Nombre */}
              <div className="input-group">
                <label>Nombre del Módulo *</label>
                <input
                  className="input-control"
                  type="text"
                  value={formData.nombre}
                  onChange={e => handleNombreChange(e.target.value)}
                  placeholder="Ej: Mantenimientos de Área"
                />
              </div>

              {/* Slug */}
              {!editingScope && (
                <div className="input-group">
                  <label>Identificador único (slug)</label>
                  <input
                    className="input-control code-font"
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                    placeholder="area, habitacion, activo..."
                  />
                  <small className="text-muted">Solo letras minúsculas, números y guiones. No se puede cambiar después.</small>
                </div>
              )}

              <div className="form-grid-2">
                {/* Orden */}
                <div className="input-group">
                  <label>Orden de aparición</label>
                  <input
                    className="input-control"
                    type="number"
                    min="1"
                    value={formData.orden}
                    onChange={e => setFormData(prev => ({ ...prev, orden: parseInt(e.target.value) || 99 }))}
                  />
                </div>

                {/* Tipo de Entidad */}
                <div className="input-group">
                  <label>Tipo de Entidad</label>
                  <select
                    className="input-control"
                    value={formData.tipoEntidad}
                    onChange={e => setFormData(prev => ({ ...prev, tipoEntidad: e.target.value }))}
                  >
                    {ENTITY_TYPES.map(et => (
                      <option key={et.value} value={et.value}>{et.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color */}
              <div className="input-group">
                <label>Color del módulo</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {PALETTE.map(c => (
                    <div
                      key={c}
                      onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: c,
                        cursor: 'pointer', border: formData.color === c ? '3px solid var(--text-main)' : '2px solid transparent',
                        boxSizing: 'border-box', transition: 'border 0.15s'
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer' }}
                    title="Color personalizado"
                  />
                </div>
              </div>

              {/* Icono */}
              <div className="input-group">
                <label>Icono</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {AVAILABLE_ICONS.map(ic => {
                    const Comp = ic.component;
                    const isSelected = formData.icono === ic.name;
                    return (
                      <div
                        key={ic.name}
                        onClick={() => setFormData(prev => ({ ...prev, icono: ic.name }))}
                        title={ic.name}
                        style={{
                          width: '38px', height: '38px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          background: isSelected ? formData.color : 'var(--bg-tertiary)',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          border: `2px solid ${isSelected ? formData.color : 'transparent'}`,
                          transition: 'all 0.15s'
                        }}
                      >
                        <Comp size={18} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div style={{
                marginTop: '12px', padding: '16px', borderRadius: '12px',
                background: `${formData.color}10`, border: `1px solid ${formData.color}30`,
                display: 'flex', alignItems: 'center', gap: '14px'
              }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: `${formData.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: formData.color,
                }}>
                  <IconComponent name={formData.icono} size={22} />
                </div>
                <span style={{ fontWeight: 700, color: formData.color, fontSize: '0.95rem' }}>{formData.nombre || 'Vista previa...'}</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--glass-border)',
              background: 'var(--bg-primary)',
              display: 'flex', justifyContent: 'flex-end', gap: '12px',
            }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ background: formData.color }}>
                <Check size={16} /> {saving ? 'Guardando...' : (editingScope ? 'Guardar Cambios' : 'Crear Módulo')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar Módulo"
        message={`¿Estás seguro de eliminar el módulo "${confirmDelete.nombre}"? Solo se puede eliminar si no tiene mantenimientos asociados.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, nombre: '' })}
        isDanger
      />

      <ConfirmModal
        isOpen={confirmDeleteCat.isOpen}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar "${confirmDeleteCat.name}" y todos sus sub-niveles? No se puede eliminar si está vinculada a activos o planes.`}
        onConfirm={confirmCatDelete}
        onCancel={() => setConfirmDeleteCat({ isOpen: false, id: null, name: '' })}
        isDanger
      />
    </div>
  );
};

export default MaintenanceTypeSelector;
