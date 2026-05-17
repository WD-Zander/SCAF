import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  Type, Hash, Calendar, List, CheckSquare, AlignLeft, ToggleLeft, Eye
} from 'lucide-react';
import { api } from '../../api';
import AlertModal from '../../components/Common/AlertModal';

const FIELD_TYPES = [
  { value: 'text',     label: 'Texto',          icon: <Type size={14} /> },
  { value: 'number',   label: 'Numero',         icon: <Hash size={14} /> },
  { value: 'date',     label: 'Fecha',           icon: <Calendar size={14} /> },
  { value: 'select',   label: 'Lista desplegable', icon: <List size={14} /> },
  { value: 'checkbox', label: 'Casilla (Si/No)', icon: <CheckSquare size={14} /> },
  { value: 'textarea', label: 'Texto largo',     icon: <AlignLeft size={14} /> },
  { value: 'toggle',   label: 'Interruptor',     icon: <ToggleLeft size={14} /> },
];

const emptyField = () => ({ nombre: '', tipo: 'text', requerido: false, opciones: [] });

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [campos, setCampos] = useState([emptyField()]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        const res = await api.get(`/api/forms/${id}`);
        if (res?.ok) {
          const data = await res.json();
          setNombre(data.nombre);
          setDescripcion(data.descripcion || '');
          setCampos(data.campos.map(c => ({
            ...c,
            opciones: c.opciones ? (typeof c.opciones === 'string' ? JSON.parse(c.opciones) : c.opciones) : []
          })));
        }
      })();
    }
  }, [id]);

  const updateField = (idx, key, val) => {
    setCampos(prev => prev.map((f, i) => i === idx ? { ...f, [key]: val } : f));
  };

  const removeField = (idx) => {
    if (campos.length <= 1) return;
    setCampos(prev => prev.filter((_, i) => i !== idx));
  };

  const moveField = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= campos.length) return;
    const arr = [...campos];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setCampos(arr);
  };

  const addOption = (idx) => {
    setCampos(prev => prev.map((f, i) =>
      i === idx ? { ...f, opciones: [...(f.opciones || []), ''] } : f
    ));
  };

  const updateOption = (fieldIdx, optIdx, val) => {
    setCampos(prev => prev.map((f, i) => {
      if (i !== fieldIdx) return f;
      const opts = [...(f.opciones || [])];
      opts[optIdx] = val;
      return { ...f, opciones: opts };
    }));
  };

  const removeOption = (fieldIdx, optIdx) => {
    setCampos(prev => prev.map((f, i) => {
      if (i !== fieldIdx) return f;
      return { ...f, opciones: (f.opciones || []).filter((_, j) => j !== optIdx) };
    }));
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      setAlert({ title: 'Error', message: 'El nombre del formulario es obligatorio.' });
      return;
    }
    const validCampos = campos.filter(c => c.nombre.trim());
    if (validCampos.length === 0) {
      setAlert({ title: 'Error', message: 'Agrega al menos un campo con nombre.' });
      return;
    }

    setSaving(true);
    const body = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      campos: validCampos.map(c => ({
        nombre: c.nombre.trim(),
        tipo: c.tipo,
        requerido: c.requerido,
        opciones: c.tipo === 'select' ? (c.opciones || []).filter(o => o.trim()) : null,
      }))
    };

    const res = isEdit
      ? await api.put(`/api/forms/${id}`, body)
      : await api.post('/api/forms', body);

    setSaving(false);
    if (res?.ok) {
      navigate('/forms');
    } else {
      let msg = 'No se pudo guardar el formulario.';
      try { const err = await res.json(); msg = err.error || err.detalle || msg; } catch {}
      setAlert({ title: 'Error', message: msg });
    }
  };

  // ── Vista previa ────────────────────────
  const renderPreview = () => (
    <div className="glass-panel" style={{ padding: '28px', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '6px' }}>{nombre || 'Sin nombre'}</h2>
      {descripcion && <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>{descripcion}</p>}
      {campos.filter(c => c.nombre.trim()).map((c, i) => (
        <div key={i} style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
            {c.nombre} {c.requerido && <span style={{ color: 'var(--danger)' }}>*</span>}
          </label>
          {c.tipo === 'text' && <input className="input-control" style={{ width: '100%' }} placeholder={c.nombre} readOnly />}
          {c.tipo === 'number' && <input className="input-control" type="number" style={{ width: '100%' }} placeholder="0" readOnly />}
          {c.tipo === 'date' && <input className="input-control" type="date" style={{ width: '100%' }} readOnly />}
          {c.tipo === 'textarea' && <textarea className="input-control" rows={3} style={{ width: '100%', resize: 'vertical' }} readOnly />}
          {c.tipo === 'checkbox' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" disabled /> Si
            </label>
          )}
          {c.tipo === 'toggle' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" disabled /> Activado
            </label>
          )}
          {c.tipo === 'select' && (
            <select className="input-control" style={{ width: '100%' }} disabled>
              <option value="">-- Seleccionar --</option>
              {(c.opciones || []).map((opt, j) => <option key={j}>{opt}</option>)}
            </select>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn-secondary" onClick={() => navigate('/forms')} style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px' }}>{isEdit ? 'Editar Formulario' : 'Nuevo Formulario'}</h1>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Define los campos y tipos de datos de tu formulario.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={() => setPreview(!preview)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Eye size={16} /> {preview ? 'Editor' : 'Vista Previa'}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {preview ? renderPreview() : (
        <>
          {/* Datos generales */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre del Formulario *</label>
                <input
                  className="input-control"
                  style={{ width: '100%' }}
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Servicios Publicos"
                />
              </div>
              <div>
                <label style={labelStyle}>Descripcion</label>
                <input
                  className="input-control"
                  style={{ width: '100%' }}
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Breve descripcion del formulario"
                />
              </div>
            </div>
          </div>

          {/* Campos */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Campos del Formulario</h3>
              <button
                className="btn-secondary"
                onClick={() => setCampos(prev => [...prev, emptyField()])}
                style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Agregar Campo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {campos.map((campo, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '16px',
                    background: 'var(--bg-primary)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Orden */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' }}>
                      <button
                        onClick={() => moveField(idx, -1)}
                        style={{ padding: '2px', opacity: idx === 0 ? 0.3 : 1 }}
                        disabled={idx === 0}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <GripVertical size={14} style={{ color: 'var(--text-muted)' }} />
                      <button
                        onClick={() => moveField(idx, 1)}
                        style={{ padding: '2px', opacity: idx === campos.length - 1 ? 0.3 : 1 }}
                        disabled={idx === campos.length - 1}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Nombre del campo */}
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Nombre del campo</label>
                      <input
                        className="input-control"
                        style={{ width: '100%' }}
                        value={campo.nombre}
                        onChange={e => updateField(idx, 'nombre', e.target.value)}
                        placeholder="Ej: Nivel de Agua"
                      />
                    </div>

                    {/* Tipo */}
                    <div style={{ minWidth: '180px' }}>
                      <label style={labelStyle}>Tipo de dato</label>
                      <select
                        className="input-control"
                        style={{ width: '100%' }}
                        value={campo.tipo}
                        onChange={e => updateField(idx, 'tipo', e.target.value)}
                      >
                        {FIELD_TYPES.map(ft => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Requerido */}
                    <div style={{ paddingTop: '24px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={campo.requerido}
                          onChange={e => updateField(idx, 'requerido', e.target.checked)}
                        />
                        Requerido
                      </label>
                    </div>

                    {/* Eliminar */}
                    <div style={{ paddingTop: '22px' }}>
                      <button
                        onClick={() => removeField(idx)}
                        style={{ color: 'var(--danger)', padding: '6px', borderRadius: '6px', opacity: campos.length <= 1 ? 0.3 : 1 }}
                        disabled={campos.length <= 1}
                        title="Eliminar campo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Opciones para tipo select */}
                  {campo.tipo === 'select' && (
                    <div style={{ marginTop: '12px', marginLeft: '34px' }}>
                      <label style={{ ...labelStyle, marginBottom: '8px' }}>Opciones de la lista</label>
                      {(campo.opciones || []).map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                          <input
                            className="input-control"
                            style={{ flex: 1, maxWidth: '300px' }}
                            value={opt}
                            onChange={e => updateOption(idx, optIdx, e.target.value)}
                            placeholder={`Opcion ${optIdx + 1}`}
                          />
                          <button
                            onClick={() => removeOption(idx, optIdx)}
                            style={{ color: 'var(--danger)', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="btn-secondary"
                        onClick={() => addOption(idx)}
                        style={{ fontSize: '0.78rem', padding: '4px 12px', marginTop: '4px' }}
                      >
                        <Plus size={12} /> Agregar Opcion
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {alert && (
        <AlertModal
          isOpen={true}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' };

export default FormBuilder;
