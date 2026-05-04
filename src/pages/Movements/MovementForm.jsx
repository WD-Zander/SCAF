import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, PackageOpen } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';

const MovementForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { assets, organizationalTree, assetStatuses, setGlobalAlert, refreshAssets } = useAppContext();

  const preselectedId = searchParams.get('assetId') || '';

  const [assetSearch, setAssetSearch] = useState(preselectedId);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formData, setFormData] = useState({
    newLocation: '',
    newDepartment: '',
    newArea: '',
    newStatus: '',
    observation: '',
  });
  const [saving, setSaving] = useState(false);

  const statusOptions = assetStatuses.map(s => s.name);

  // Cascading options derived from organizationalTree
  const sedeOptions = organizationalTree;
  const deptOptions = organizationalTree.find(s => s.name === formData.newLocation)?.children || [];
  const areaOptions = deptOptions.find(d => d.name === formData.newDepartment)?.children || [];

  useEffect(() => {
    if (preselectedId && assets.length > 0) {
      const found = assets.find(a => a.id === preselectedId);
      if (found) selectAsset(found);
    }
  }, [preselectedId, assets]);

  const selectAsset = (a) => {
    setSelectedAsset(a);
    setAssetSearch(a.id);
    setFormData({
      newLocation: a.location || '',
      newDepartment: a.department || '',
      newArea: a.area || '',
      newStatus: a.status || '',
      observation: '',
    });
  };

  const filteredAssets = !selectedAsset && assetSearch.length > 1
    ? assets.filter(a =>
        a.id?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.name?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.serial?.toLowerCase().includes(assetSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) {
      setGlobalAlert({ isOpen: true, title: 'Activo Requerido', message: 'Debes seleccionar un activo.' });
      return;
    }
    if (!formData.observation.trim()) {
      setGlobalAlert({ isOpen: true, title: 'Observación Requerida', message: 'Debes ingresar una observación del movimiento.' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/api/movements', {
        assetId: selectedAsset.id,
        newLocation: formData.newLocation,
        newDepartment: formData.newDepartment,
        newArea: formData.newArea,
        newStatus: formData.newStatus,
        observation: formData.observation,
      });
      if (res?.ok) {
        await refreshAssets(); // actualiza el contexto con los nuevos datos del activo
        navigate('/movements');
      } else {
        const body = await res.json().catch(() => ({}));
        setGlobalAlert({ isOpen: true, title: 'Error', message: body.error || 'No se pudo registrar el movimiento.' });
      }
    } catch (err) {
      setGlobalAlert({ isOpen: true, title: 'Error de Conexión', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Read-only pill showing the current value of a field
  const CurrentValue = ({ value }) => (
    <div style={{
      padding: '10px 14px',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--glass-border)',
      fontSize: '0.9rem',
      color: 'var(--text-muted)',
      minHeight: '42px',
      display: 'flex',
      alignItems: 'center',
    }}>
      {value || <em style={{ opacity: 0.4 }}>Sin dato</em>}
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/movements')} style={{ padding: '8px', borderRadius: '50%' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PackageOpen className="text-accent" size={28} /> Registrar Movimiento
            </h1>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Mueve un activo de ubicación, área o departamento. La observación es obligatoria.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>

          {/* ── Búsqueda de activo ── */}
          <div className="form-section">
            <div className="form-section-title">Activo a Mover</div>
            <div className="input-group">
              <label>Buscar Activo (código, nombre o serial)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="input-control code-font"
                    type="text"
                    value={assetSearch}
                    onChange={(e) => { setAssetSearch(e.target.value); setSelectedAsset(null); }}
                    placeholder="ACT-00X o nombre del activo..."
                  />
                  {filteredAssets.length > 0 && (
                    <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 10, marginTop: '4px', padding: '8px' }}>
                      {filteredAssets.map(a => (
                        <div
                          key={a.id}
                          onClick={() => selectAsset(a)}
                          className="clickable-row"
                          style={{ padding: '10px 12px', fontSize: '0.9rem', display: 'flex', gap: '8px', cursor: 'pointer', alignItems: 'center' }}
                        >
                          <span className="code-font" style={{ fontWeight: 600 }}>{a.id}</span>
                          <span className="text-muted" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                          {a.serial && <span className="text-muted code-font" style={{ fontSize: '0.78rem' }}>SN:{a.serial}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedAsset && (
                  <div style={{ padding: '10px 16px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <Check size={16} /> Seleccionado
                  </div>
                )}
              </div>
            </div>

            {selectedAsset && (
              <div style={{ marginTop: '12px', padding: '14px 18px', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <div><span className="text-muted">Activo: </span><strong className="code-font">{selectedAsset.id}</strong></div>
                <div><span className="text-muted">Nombre: </span><strong>{selectedAsset.name}</strong></div>
                {selectedAsset.brand && <div><span className="text-muted">Marca: </span>{selectedAsset.brand}</div>}
                {selectedAsset.serial && <div><span className="text-muted">Serial: </span><span className="code-font">{selectedAsset.serial}</span></div>}
              </div>
            )}
          </div>

          {/* ── Campos de movimiento — solo cuando hay activo seleccionado ── */}
          {selectedAsset && (
            <>
              {/* Ubicación en cascada */}
              <div className="form-section">
                <div className="form-section-title">
                  Estructura Organizativa
                  <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.78rem', marginLeft: '10px' }}>Valor actual (izquierda) → Nueva asignación (derecha)</span>
                </div>

                {/* Sede */}
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sede Física — Actual</label>
                    <CurrentValue value={selectedAsset.location} />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Sede Física — Nueva *</label>
                    <select
                      className="input-control"
                      value={formData.newLocation}
                      onChange={e => setFormData(prev => ({ ...prev, newLocation: e.target.value, newDepartment: '', newArea: '' }))}
                    >
                      <option value="">-- Seleccionar --</option>
                      {sedeOptions.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Departamento */}
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Departamento — Actual</label>
                    <CurrentValue value={selectedAsset.department} />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Departamento — Nuevo</label>
                    <select
                      className="input-control"
                      value={formData.newDepartment}
                      disabled={!formData.newLocation}
                      onChange={e => setFormData(prev => ({ ...prev, newDepartment: e.target.value, newArea: '' }))}
                    >
                      <option value="">-- Seleccionar --</option>
                      {deptOptions.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Área */}
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Área — Actual</label>
                    <CurrentValue value={selectedAsset.area} />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Área — Nueva</label>
                    <select
                      className="input-control"
                      value={formData.newArea}
                      disabled={!formData.newDepartment}
                      onChange={e => setFormData(prev => ({ ...prev, newArea: e.target.value }))}
                    >
                      <option value="">-- Seleccionar --</option>
                      {areaOptions.map(a => (
                        <option key={a.id} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="form-section">
                <div className="form-section-title">Estado del Activo</div>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estado — Actual</label>
                    <CurrentValue value={selectedAsset.status} />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Estado — Nuevo</label>
                    <select
                      className="input-control"
                      value={formData.newStatus}
                      onChange={e => setFormData(prev => ({ ...prev, newStatus: e.target.value }))}
                    >
                      <option value="">-- Sin cambio --</option>
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Observación obligatoria */}
              <div className="form-section" style={{ border: '1px solid var(--accent-light)', borderRadius: '10px', padding: '20px', background: 'rgba(37,99,235,0.03)' }}>
                <div className="form-section-title" style={{ color: 'var(--accent-primary)' }}>Observación del Movimiento *</div>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                  Describe el motivo o contexto del movimiento. Quedará registrado en el historial del activo.
                </p>
                <div className="input-group" style={{ margin: 0 }}>
                  <textarea
                    className="input-control"
                    name="observation"
                    rows={3}
                    value={formData.observation}
                    onChange={e => setFormData(prev => ({ ...prev, observation: e.target.value }))}
                    placeholder="Ej: Traslado por refacción de oficina, cambio de sede, equipo fuera de servicio..."
                    style={{ borderColor: !formData.observation.trim() ? 'var(--danger)' : 'var(--glass-border)' }}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/movements')}>CANCELAR</button>
            <button type="submit" className="btn-primary" disabled={!selectedAsset || saving}>
              <Check size={18} /> {saving ? 'GUARDANDO...' : 'REGISTRAR MOVIMIENTO'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default MovementForm;
