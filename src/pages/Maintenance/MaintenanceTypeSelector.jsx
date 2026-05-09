import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Plus, Edit2, Trash2, X, Check, Wrench,
  MapPin, DoorOpen, Box, Building2, Home, Layers, Package,
  Warehouse, Zap, Settings, Star, LayoutGrid, Activity,
  Hammer, ShieldCheck, Thermometer, Droplets, Bolt, Wind
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

const BLANK_FORM = { nombre: '', slug: '', color: '#3b82f6', icono: 'Wrench', orden: 99 };

const MaintenanceTypeSelector = () => {
  const navigate = useNavigate();
  const { maintenanceScopes, setMaintenanceScopes, setGlobalAlert, maintenances, maintenancePlans } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [editingScope, setEditingScope] = useState(null);
  const [formData, setFormData] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nombre: '' });

  const openCreate = () => {
    setEditingScope(null);
    setFormData(BLANK_FORM);
    setShowForm(true);
  };

  const openEdit = (scope) => {
    setEditingScope(scope);
    setFormData({ nombre: scope.nombre, slug: scope.slug, color: scope.color, icono: scope.icono, orden: scope.orden });
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

  // Count tickets and plans per scope
  const getScopeStats = (slug) => {
    const tickets = maintenances.filter(m => m.scope === slug).length;
    const plans = maintenancePlans.filter(p => p.scope === slug).length;
    return { tickets, plans };
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div className="flex-between">
          <div>
            <h1 style={{ marginBottom: '8px', fontSize: '1.6rem' }}>Módulos de Mantenimiento</h1>
            <p className="text-muted">Configura los tipos de mantenimiento disponibles en el sistema.</p>
          </div>
          <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Plus size={18} /> Nuevo Módulo
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {maintenanceScopes.filter(s => s.activo !== false).map((scope) => {
          const stats = getScopeStats(scope.slug);
          return (
            <div
              key={scope.id}
              className="glass-panel"
              style={{
                padding: 0,
                overflow: 'hidden',
                border: `1px solid ${scope.color}30`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${scope.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              onClick={() => navigate(`/maintenances/list/${scope.slug}`)}
            >
              {/* Color bar */}
              <div style={{ height: '4px', background: `linear-gradient(90deg, ${scope.color}, ${scope.color}80)` }} />

              <div style={{ padding: '24px' }}>
                {/* Top row: icon + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `${scope.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: scope.color,
                  }}>
                    <IconComponent name={scope.icono} size={26} />
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-secondary"
                      title="Editar módulo"
                      onClick={() => openEdit(scope)}
                      style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-secondary"
                      title="Eliminar módulo"
                      onClick={() => setConfirmDelete({ isOpen: true, id: scope.id, nombre: scope.nombre })}
                      style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger)', border: '1px solid var(--glass-border)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                  {scope.nombre}
                </h2>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{stats.tickets}</strong> tickets
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{stats.plans}</strong> planes
                  </span>
                </div>

                {/* CTA */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: scope.color, fontWeight: 600, fontSize: '0.82rem',
                }}>
                  Ver mantenimientos <ArrowRight size={15} />
                </div>
              </div>
            </div>
          );
        })}

        {maintenanceScopes.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px' }}>
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
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '32px', position: 'relative' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>
              {editingScope ? `Editar: ${editingScope.nombre}` : 'Nuevo Módulo de Mantenimiento'}
            </h2>

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

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ background: formData.color }}>
                <Check size={16} /> {saving ? 'Guardando...' : (editingScope ? 'Guardar Cambios' : 'Crear Módulo')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar Módulo"
        message={`¿Estás seguro de eliminar el módulo "${confirmDelete.nombre}"? Solo se puede eliminar si no tiene mantenimientos asociados.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, nombre: '' })}
        isDanger
      />
    </div>
  );
};

export default MaintenanceTypeSelector;
