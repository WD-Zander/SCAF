import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Edit2, Trash2, X, Check, Search, ChevronRight,
  Settings, Box, MapPin, DoorOpen, Building2, Home, Layers,
  Package, Warehouse, Zap, Star, LayoutGrid, Activity,
  Hammer, ShieldCheck, Thermometer, Droplets, Bolt, Wind, Wrench,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import ConfirmModal from '../../components/Common/ConfirmModal';
import SearchableSelect from '../../components/Common/SearchableSelect';

// ─── Icon Registry ───────────────────────────────────────────
const ICON_MAP = {
  MapPin, DoorOpen, Box, Building2, Home, Layers, Package,
  Warehouse, Zap, Settings, Star, LayoutGrid, Activity,
  Hammer, ShieldCheck, Thermometer, Droplets, Bolt, Wind, Wrench,
};
const ICON_LIST = Object.keys(ICON_MAP);
const Icon = ({ name, size = 18, ...props }) => {
  const Comp = ICON_MAP[name] || Box;
  return <Comp size={size} {...props} />;
};

// ─── Field Types ─────────────────────────────────────────────
const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Lista de opciones' },
];

const BLANK_FIELD = { key: '', label: '', type: 'text', placeholder: '', options: [] };

// ─── Type Form Blank ─────────────────────────────────────────
const BLANK_TYPE = { slug: '', nombre: '', prefijoId: '', icono: 'Box', campos: [] };

const InfrastructureManager = () => {
  const { infraTypes, setInfraTypes, infraItems, setInfraItems, setGlobalAlert, maintenanceScopes, getCategoriesForScope } = useAppContext();

  // ─── State ────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState('');

  // Type modal
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState(BLANK_TYPE);
  const [savingType, setSavingType] = useState(false);

  // Item modal
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ nombre: '', descripcion: '', datos: {} });
  const [savingItem, setSavingItem] = useState(false);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, type: null, id: null, nombre: '' });

  // Auto-select first type
  useEffect(() => {
    if (!selectedType && infraTypes.length > 0) setSelectedType(infraTypes[0].slug);
  }, [infraTypes, selectedType]);

  // ─── Filtered items ───────────────────────────────────────
  const currentType = useMemo(() => infraTypes.find(t => t.slug === selectedType), [infraTypes, selectedType]);

  // Scope and categories linked to current infra type
  const linkedScope = useMemo(() => {
    if (!currentType) return null;
    return maintenanceScopes.find(s => s.tipoEntidad === currentType.slug);
  }, [currentType, maintenanceScopes]);

  const scopeCategories = useMemo(() => {
    if (!linkedScope) return [];
    return getCategoriesForScope(linkedScope.slug);
  }, [linkedScope, getCategoriesForScope]);

  // Flatten tree for select options
  const flatCategories = useMemo(() => {
    const result = [];
    const traverse = (nodes, level = 0) => {
      for (const n of nodes) {
        result.push({ id: n.id, name: n.name, level });
        if (n.children?.length) traverse(n.children, level + 1);
      }
    };
    traverse(scopeCategories);
    return result;
  }, [scopeCategories]);
  const filteredItems = useMemo(() => {
    const items = infraItems.filter(i => i.tipoSlug === selectedType);
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      (i.nombre || '').toLowerCase().includes(q) ||
      (i.id || '').toLowerCase().includes(q) ||
      (i.descripcion || '').toLowerCase().includes(q) ||
      Object.values(i.datos || {}).some(v => String(v).toLowerCase().includes(q))
    );
  }, [infraItems, selectedType, search]);

  // ─── Refresh ──────────────────────────────────────────────
  const refreshTypes = async () => {
    const res = await api.get('/api/infrastructure/types');
    if (res?.ok) setInfraTypes(await res.json());
  };
  const refreshItems = async () => {
    const res = await api.get('/api/infrastructure/items');
    if (res?.ok) setInfraItems(await res.json());
  };

  // ─── Type CRUD ────────────────────────────────────────────
  const openCreateType = () => {
    setEditingType(null);
    setTypeForm(BLANK_TYPE);
    setShowTypeForm(true);
  };
  const openEditType = (t) => {
    setEditingType(t);
    setTypeForm({
      slug: t.slug,
      nombre: t.nombre,
      prefijoId: t.prefijoId,
      icono: t.icono || 'Box',
      campos: t.campos || [],
    });
    setShowTypeForm(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.nombre.trim()) {
      setGlobalAlert({ isOpen: true, title: 'Validación', message: 'El nombre es obligatorio.' });
      return;
    }
    if (!editingType && !typeForm.slug.trim()) {
      setGlobalAlert({ isOpen: true, title: 'Validación', message: 'El identificador (slug) es obligatorio.' });
      return;
    }
    setSavingType(true);
    try {
      const payload = {
        nombre: typeForm.nombre,
        prefijoId: typeForm.prefijoId || typeForm.slug.toUpperCase(),
        icono: typeForm.icono,
        campos: typeForm.campos.filter(c => c.key && c.label),
      };
      if (editingType) {
        const res = await api.put(`/api/infrastructure/types/${editingType.slug}`, payload);
        if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al guardar');
      } else {
        payload.slug = typeForm.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const res = await api.post('/api/infrastructure/types', payload);
        if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al crear');
      }
      await refreshTypes();
      setShowTypeForm(false);
      if (!editingType) setSelectedType(typeForm.slug.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
    setSavingType(false);
  };

  const handleDeleteType = async () => {
    const { id } = confirmDelete;
    setConfirmDelete({ isOpen: false, type: null, id: null, nombre: '' });
    try {
      const res = await api.delete(`/api/infrastructure/types/${id}`);
      if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al eliminar');
      await refreshTypes();
      if (selectedType === id) setSelectedType(null);
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
  };

  // ─── Item CRUD ────────────────────────────────────────────
  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm({ nombre: '', descripcion: '', datos: {} });
    setShowItemForm(true);
  };
  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({ nombre: item.nombre, descripcion: item.descripcion || '', datos: { ...(item.datos || {}) } });
    setShowItemForm(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.nombre.trim()) {
      setGlobalAlert({ isOpen: true, title: 'Validación', message: 'El nombre es obligatorio.' });
      return;
    }
    setSavingItem(true);
    try {
      if (editingItem) {
        const res = await api.put(`/api/infrastructure/items/${editingItem.id}`, itemForm);
        if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al guardar');
      } else {
        const prefix = currentType?.prefijoId || 'INF';
        const id = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
        const res = await api.post('/api/infrastructure/items', {
          ...itemForm,
          id,
          tipoSlug: selectedType,
        });
        if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al crear');
      }
      await refreshItems();
      setShowItemForm(false);
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
    setSavingItem(false);
  };

  const handleDeleteItem = async () => {
    const { id } = confirmDelete;
    setConfirmDelete({ isOpen: false, type: null, id: null, nombre: '' });
    try {
      const res = await api.delete(`/api/infrastructure/items/${id}`);
      if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al eliminar');
      await refreshItems();
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
  };

  // ─── Field editor helpers (type form) ─────────────────────
  const addField = () => setTypeForm(p => ({ ...p, campos: [...p.campos, { ...BLANK_FIELD }] }));
  const updateField = (idx, key, val) => setTypeForm(p => {
    const campos = [...p.campos];
    campos[idx] = { ...campos[idx], [key]: val };
    if (key === 'label' && !campos[idx].key) {
      campos[idx].key = val.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    }
    return { ...p, campos };
  });
  const removeField = (idx) => setTypeForm(p => ({ ...p, campos: p.campos.filter((_, i) => i !== idx) }));

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 className="text-accent" /> Infraestructura
        </h1>
        <p className="text-muted">Gestiona los tipos de infraestructura y sus elementos.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: Type List */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '16px', borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Tipos</span>
            <button
              className="btn-primary"
              onClick={openCreateType}
              style={{ padding: '6px 10px', fontSize: '0.78rem', gap: '4px' }}
            >
              <Plus size={14} /> Nuevo
            </button>
          </div>

          <div style={{ padding: '8px' }}>
            {infraTypes.length === 0 && (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay tipos. Crea el primero.
              </p>
            )}
            {infraTypes.map(t => (
              <div
                key={t.slug}
                onClick={() => { setSelectedType(t.slug); setSearch(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: selectedType === t.slug ? 'var(--accent-primary)' : 'transparent',
                  color: selectedType === t.slug ? '#fff' : 'var(--text-main)',
                  transition: 'all 0.15s', marginBottom: '2px',
                }}
              >
                <Icon name={t.icono} size={16} />
                <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: selectedType === t.slug ? 600 : 500 }}>
                  {t.nombre}
                </span>
                <span style={{
                  fontSize: '0.72rem', opacity: 0.7,
                  background: selectedType === t.slug ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                  padding: '2px 6px', borderRadius: '4px',
                }}>
                  {infraItems.filter(i => i.tipoSlug === t.slug).length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Items Table */}
        <div>
          {currentType ? (
            <>
              {/* Type header with actions */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-primary)',
                  }}>
                    <Icon name={currentType.icono} size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{currentType.nombre}</h2>
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {currentType.campos.length} campo{currentType.campos.length !== 1 ? 's' : ''} · Prefijo: {currentType.prefijoId}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => openEditType(currentType)}
                    style={{ padding: '8px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Settings size={14} /> Configurar
                  </button>
                  <button className="btn-secondary"
                    onClick={() => setConfirmDelete({ isOpen: true, type: 'type', id: currentType.slug, nombre: currentType.nombre })}
                    style={{ padding: '8px', borderRadius: '8px', color: 'var(--danger)' }}
                    title="Eliminar tipo">
                    <Trash2 size={14} />
                  </button>
                  <button className="btn-primary" onClick={openCreateItem}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Nuevo {currentType.nombre.replace(/s$/, '')}
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="glass-panel" style={{
                padding: '10px 16px', marginBottom: '12px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Buscar en ${currentType.nombre.toLowerCase()}...`}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.88rem', color: 'var(--text-main)' }}
                />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>}
              </div>

              {/* Table */}
              <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Nombre</th>
                      {flatCategories.length > 0 && <th style={thStyle}>Categoría</th>}
                      {currentType.campos.map(c => (
                        <th key={c.key} style={thStyle}>{c.label}</th>
                      ))}
                      <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.id}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{item.nombre}</td>
                        {flatCategories.length > 0 && (
                          <td style={tdStyle}>
                            {item.datos?.categoriaNombre ? (
                              <span className="badge" style={{
                                background: `${linkedScope?.color || 'var(--accent-primary)'}14`,
                                color: linkedScope?.color || 'var(--accent-primary)',
                                border: `1px solid ${linkedScope?.color || 'var(--accent-primary)'}30`,
                                fontSize: '0.78rem',
                              }}>
                                {item.datos.categoriaNombre}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                        )}
                        {currentType.campos.map(c => (
                          <td key={c.key} style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                            {item.datos?.[c.key] || '—'}
                          </td>
                        ))}
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => openEditItem(item)} style={{ padding: '6px', borderRadius: '6px' }}><Edit2 size={14} /></button>
                            <button className="btn-secondary"
                              onClick={() => setConfirmDelete({ isOpen: true, type: 'item', id: item.id, nombre: item.nombre })}
                              style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={3 + (currentType.campos?.length || 0) + (flatCategories.length > 0 ? 1 : 0)} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                          {search ? 'Sin resultados para esta búsqueda.' : `No hay ${currentType.nombre.toLowerCase()} registrados. Crea el primero.`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center' }}>
              <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.4 }} />
              <h3 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Selecciona o crea un tipo de infraestructura</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
                Los tipos definen categorías como Áreas, Habitaciones, Vehículos, etc.
              </p>
              <button className="btn-primary" onClick={openCreateType} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Crear Tipo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TYPE MODAL ═══ */}
      {showTypeForm && createPortal(
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: '580px' }}>
            <div style={modalHeaderStyle}>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                {editingType ? `Editar: ${editingType.nombre}` : 'Nuevo Tipo de Infraestructura'}
              </h2>
              <button onClick={() => setShowTypeForm(false)} style={closeBtn}><X size={18} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: '1 1 auto', maxHeight: '60vh' }}>
              <div className="input-group">
                <label>Nombre *</label>
                <input className="input-control" type="text" value={typeForm.nombre}
                  onChange={e => {
                    const nombre = e.target.value;
                    setTypeForm(p => ({
                      ...p, nombre,
                      ...(!editingType && !p.slugManual ? { slug: nombre.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30) } : {}),
                    }));
                  }}
                  placeholder="Ej: Vehículos" />
              </div>

              {!editingType && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div className="input-group">
                    <label>Slug (identificador)</label>
                    <input className="input-control" type="text" value={typeForm.slug}
                      onChange={e => setTypeForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''), slugManual: true }))}
                      placeholder="vehiculos" />
                  </div>
                  <div className="input-group">
                    <label>Prefijo ID</label>
                    <input className="input-control" type="text" value={typeForm.prefijoId}
                      onChange={e => setTypeForm(p => ({ ...p, prefijoId: e.target.value.toUpperCase().substring(0, 10) }))}
                      placeholder="VEH" />
                  </div>
                </div>
              )}

              {editingType && (
                <div className="input-group">
                  <label>Prefijo ID</label>
                  <input className="input-control" type="text" value={typeForm.prefijoId}
                    onChange={e => setTypeForm(p => ({ ...p, prefijoId: e.target.value.toUpperCase().substring(0, 10) }))}
                    placeholder="VEH" />
                </div>
              )}

              {/* Icon selector */}
              <div className="input-group">
                <label>Icono</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {ICON_LIST.map(name => {
                    const isSelected = typeForm.icono === name;
                    return (
                      <div key={name} onClick={() => setTypeForm(p => ({ ...p, icono: name }))} title={name}
                        style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'}`,
                          transition: 'all 0.15s',
                        }}>
                        <Icon name={name} size={16} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic fields editor */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Campos personalizados
                  </label>
                  <button className="btn-secondary" onClick={addField}
                    style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={12} /> Campo
                  </button>
                </div>

                {typeForm.campos.length === 0 && (
                  <div style={{
                    padding: '20px', textAlign: 'center', border: '2px dashed var(--glass-border)',
                    borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.82rem',
                  }}>
                    Sin campos extra. Todos los tipos tienen Nombre y Descripción por defecto.
                  </div>
                )}

                {typeForm.campos.map((field, idx) => (
                  <div key={idx} style={{
                    padding: '12px', border: '1px solid var(--glass-border)',
                    borderRadius: '8px', marginBottom: '8px', background: 'var(--bg-primary)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Etiqueta</label>
                        <input className="input-control" type="text" value={field.label}
                          onChange={e => updateField(idx, 'label', e.target.value)}
                          placeholder="Ej: Ubicación" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tipo</label>
                        <select className="input-control" value={field.type}
                          onChange={e => updateField(idx, 'type', e.target.value)}
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                          {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                        </select>
                      </div>
                      <button onClick={() => removeField(idx)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--danger)', padding: '8px',
                      }}><Trash2 size={14} /></button>
                    </div>
                    {field.type === 'select' && (
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Opciones (separadas por coma)</label>
                        <input className="input-control" type="text"
                          value={(field.options || []).join(', ')}
                          onChange={e => updateField(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="Opción 1, Opción 2, Opción 3"
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                      </div>
                    )}
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Placeholder</label>
                      <input className="input-control" type="text" value={field.placeholder || ''}
                        onChange={e => updateField(idx, 'placeholder', e.target.value)}
                        placeholder="Texto de ayuda..."
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={modalFooterStyle}>
              <button className="btn-secondary" onClick={() => setShowTypeForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveType} disabled={savingType}>
                <Check size={16} /> {savingType ? 'Guardando...' : (editingType ? 'Guardar' : 'Crear Tipo')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ ITEM MODAL ═══ */}
      {showItemForm && currentType && createPortal(
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: '520px' }}>
            <div style={modalHeaderStyle}>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                {editingItem ? `Editar ${currentType.nombre.replace(/s$/, '')}` : `Nuevo ${currentType.nombre.replace(/s$/, '')}`}
              </h2>
              <button onClick={() => setShowItemForm(false)} style={closeBtn}><X size={18} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: '1 1 auto' }}>
              <div className="input-group">
                <label>Nombre *</label>
                <input className="input-control" type="text" value={itemForm.nombre}
                  onChange={e => setItemForm(p => ({ ...p, nombre: e.target.value }))}
                  placeholder={`Ej: ${currentType.nombre.replace(/s$/, '')} principal`} />
              </div>

              {/* Category selector (linked to maintenance scope) */}
              {flatCategories.length > 0 && (
                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Categoría
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 600,
                      color: linkedScope?.color || 'var(--accent-primary)',
                      background: `${linkedScope?.color || 'var(--accent-primary)'}15`,
                      padding: '1px 6px', borderRadius: '4px',
                    }}>
                      {linkedScope?.nombre}
                    </span>
                  </label>
                  <SearchableSelect
                    value={itemForm.datos?.categoriaId || ''}
                    onChange={(catId, catName) => {
                      setItemForm(p => ({ ...p, datos: { ...p.datos, categoriaId: catId, categoriaNombre: catName } }));
                    }}
                    options={flatCategories.map(c => ({
                      value: c.id,
                      label: `${'  '.repeat(c.level)}${c.level > 0 ? '└ ' : ''}${c.name}`,
                    }))}
                    placeholder="— Sin categoría —"
                    label="Categoría"
                    color={linkedScope?.color}
                  />
                </div>
              )}

              {/* Dynamic fields from type config */}
              {currentType.campos.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: currentType.campos.length >= 2 ? '1fr 1fr' : '1fr',
                  gap: '0 16px',
                }}>
                  {currentType.campos.map(campo => (
                    <div className="input-group" key={campo.key}>
                      <label>{campo.label}</label>
                      {campo.type === 'select' ? (
                        <select className="input-control"
                          value={itemForm.datos[campo.key] || ''}
                          onChange={e => setItemForm(p => ({ ...p, datos: { ...p.datos, [campo.key]: e.target.value } }))}>
                          <option value="">— Seleccionar —</option>
                          {(campo.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className="input-control"
                          type={campo.type === 'number' ? 'number' : 'text'}
                          value={itemForm.datos[campo.key] || ''}
                          onChange={e => setItemForm(p => ({ ...p, datos: { ...p.datos, [campo.key]: e.target.value } }))}
                          placeholder={campo.placeholder || ''} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="input-group">
                <label>Descripción</label>
                <textarea className="input-control" value={itemForm.descripcion}
                  onChange={e => setItemForm(p => ({ ...p, descripcion: e.target.value }))}
                  rows={3} placeholder="Descripción opcional..." />
              </div>
            </div>

            <div style={modalFooterStyle}>
              <button className="btn-secondary" onClick={() => setShowItemForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveItem} disabled={savingItem}>
                <Check size={16} /> {savingItem ? 'Guardando...' : (editingItem ? 'Guardar' : 'Crear')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.type === 'type' ? 'Eliminar Tipo' : 'Eliminar Elemento'}
        message={`¿Estás seguro de eliminar "${confirmDelete.nombre}"?`}
        onConfirm={confirmDelete.type === 'type' ? handleDeleteType : handleDeleteItem}
        onCancel={() => setConfirmDelete({ isOpen: false, type: null, id: null, nombre: '' })}
        isDanger
      />
    </div>
  );
};

// ─── Shared Styles ──────────────────────────────────────────
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' };
const tdStyle = { padding: '12px 16px', fontSize: '0.85rem' };

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(15, 23, 42, 0.4)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: '16px',
  animation: 'fadeIn 0.2s ease',
};
const modalStyle = {
  background: '#fff',
  border: '1px solid var(--glass-border)',
  borderRadius: '16px',
  width: '90%',
  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  display: 'flex', flexDirection: 'column',
  maxHeight: '90vh',
};
const modalHeaderStyle = {
  padding: '24px',
  borderBottom: '1px solid var(--glass-border)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const modalFooterStyle = {
  padding: '16px 24px',
  borderTop: '1px solid var(--glass-border)',
  background: 'var(--bg-primary)',
  display: 'flex', justifyContent: 'flex-end', gap: '12px',
};
const closeBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', padding: '4px', borderRadius: '6px',
};

export default InfrastructureManager;