import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import ConfirmModal from '../../components/Common/ConfirmModal';

const BLANK = { nombre: '', ubicacion: '', piso: '', descripcion: '' };

const AreasManager = () => {
  const { areas, setAreas, setGlobalAlert } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nombre: '' });

  const filtered = areas.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (a.nombre || '').toLowerCase().includes(q) ||
      (a.id || '').toLowerCase().includes(q) ||
      (a.ubicacion || '').toLowerCase().includes(q) ||
      (a.piso || '').toLowerCase().includes(q);
  });

  const openCreate = () => { setEditing(null); setFormData(BLANK); setShowForm(true); };
  const openEdit = (area) => {
    setEditing(area);
    setFormData({ nombre: area.nombre, ubicacion: area.ubicacion || '', piso: area.piso || '', descripcion: area.descripcion || '' });
    setShowForm(true);
  };

  const refreshAreas = async () => {
    const res = await api.get('/api/areas');
    if (res?.ok) setAreas(await res.json());
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      setGlobalAlert({ isOpen: true, title: 'Validación', message: 'El nombre es obligatorio.' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/api/areas/${editing.id}`, formData);
        if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al guardar');
      } else {
        const id = `AREA-${Date.now().toString(36).toUpperCase()}`;
        const res = await api.post('/api/areas', { ...formData, id });
        if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al crear');
      }
      await refreshAreas();
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
      const res = await api.delete(`/api/areas/${id}`);
      if (!res?.ok) throw new Error((await res?.json())?.error || 'Error al eliminar');
      await refreshAreas();
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div className="flex-between">
          <div>
            <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin className="text-accent" /> Áreas
            </h1>
            <p className="text-muted">Gestiona las áreas de la empresa para mantenimiento.</p>
          </div>
          <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Nueva Área
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar área..."
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.88rem', color: 'var(--text-main)' }}
        />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>}
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nombre</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ubicación</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Piso</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(area => (
              <tr key={area.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{area.id}</td>
                <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 600 }}>{area.nombre}</td>
                <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{area.ubicacion || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{area.piso || '—'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={() => openEdit(area)} style={{ padding: '6px', borderRadius: '6px' }}><Edit2 size={14} /></button>
                    <button className="btn-secondary" onClick={() => setConfirmDelete({ isOpen: true, id: area.id, nombre: area.nombre })}
                      style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {search ? 'Sin resultados para esta búsqueda.' : 'No hay áreas registradas. Crea la primera.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
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
            width: '90%', maxWidth: '520px',
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
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{editing ? 'Editar Área' : 'Nueva Área'}</h2>
              <button onClick={() => setShowForm(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '4px', borderRadius: '6px',
              }}><X size={18} /></button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="input-group">
                <label>Nombre *</label>
                <input className="input-control" type="text" value={formData.nombre} onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Lobby Principal" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="input-group">
                  <label>Ubicación</label>
                  <input className="input-control" type="text" value={formData.ubicacion} onChange={e => setFormData(p => ({ ...p, ubicacion: e.target.value }))} placeholder="Ej: Edificio A" />
                </div>
                <div className="input-group">
                  <label>Piso</label>
                  <input className="input-control" type="text" value={formData.piso} onChange={e => setFormData(p => ({ ...p, piso: e.target.value }))} placeholder="Ej: Planta Baja" />
                </div>
              </div>
              <div className="input-group">
                <label>Descripción</label>
                <textarea className="input-control" value={formData.descripcion} onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))} rows={3} placeholder="Descripción opcional..." />
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
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                <Check size={16} /> {saving ? 'Guardando...' : (editing ? 'Guardar' : 'Crear')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar Área"
        message={`¿Estás seguro de eliminar "${confirmDelete.nombre}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, nombre: '' })}
        isDanger
      />
    </div>
  );
};

export default AreasManager;
