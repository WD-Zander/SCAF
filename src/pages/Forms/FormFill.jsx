import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ClipboardList, Table2 } from 'lucide-react';
import { api } from '../../api';
import AlertModal from '../../components/Common/AlertModal';

const FormFill = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await api.get(`/api/forms/${id}`);
      if (res?.ok) {
        const data = await res.json();
        data.campos = data.campos.map(c => ({
          ...c,
          opciones: c.opciones ? (typeof c.opciones === 'string' ? JSON.parse(c.opciones) : c.opciones) : []
        }));
        setForm(data);
        const init = {};
        data.campos.forEach(c => {
          init[c.nombre] = c.tipo === 'checkbox' || c.tipo === 'toggle' ? false : '';
        });
        setValues(init);
      }
    })();
  }, [id]);

  const handleChange = (name, val) => {
    setValues(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async () => {
    if (form) {
      for (const c of form.campos) {
        if (c.requerido) {
          const v = values[c.nombre];
          if (v === '' || v === undefined || v === null) {
            setAlert({ title: 'Campo requerido', message: `El campo "${c.nombre}" es obligatorio.` });
            return;
          }
        }
      }
    }

    setSaving(true);
    const res = await api.post(`/api/forms/${id}/records`, { datos: values });
    setSaving(false);

    if (res?.ok) {
      setAlert({ title: 'Guardado', message: 'Registro guardado exitosamente.' });
      const init = {};
      form.campos.forEach(c => {
        init[c.nombre] = c.tipo === 'checkbox' || c.tipo === 'toggle' ? false : '';
      });
      setValues(init);
    } else {
      setAlert({ title: 'Error', message: 'No se pudo guardar el registro.' });
    }
  };

  const renderField = (c, i) => {
    const isWide = c.tipo === 'textarea';
    return (
      <div key={i} style={isWide ? { gridColumn: '1 / -1' } : {}}>
        <label style={labelStyle}>
          {c.nombre} {c.requerido && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>

        {c.tipo === 'text' && (
          <input className="input-control" style={inputStyle} value={values[c.nombre] || ''} onChange={e => handleChange(c.nombre, e.target.value)} placeholder={c.nombre} />
        )}
        {c.tipo === 'number' && (
          <input className="input-control" type="number" style={inputStyle} value={values[c.nombre] || ''} onChange={e => handleChange(c.nombre, e.target.value)} placeholder="0" />
        )}
        {c.tipo === 'date' && (
          <input className="input-control" type="date" style={inputStyle} value={values[c.nombre] || ''} onChange={e => handleChange(c.nombre, e.target.value)} />
        )}
        {c.tipo === 'textarea' && (
          <textarea className="input-control" rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={values[c.nombre] || ''} onChange={e => handleChange(c.nombre, e.target.value)} placeholder={c.nombre} />
        )}
        {c.tipo === 'checkbox' && (
          <div style={{ marginTop: '6px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: values[c.nombre] ? 'rgba(34,197,94,0.08)' : 'transparent', transition: 'all 0.15s' }}>
              <input type="checkbox" checked={!!values[c.nombre]} onChange={e => handleChange(c.nombre, e.target.checked)} /> Si
            </label>
          </div>
        )}
        {c.tipo === 'toggle' && (
          <div style={{ marginTop: '6px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: values[c.nombre] ? 'rgba(34,197,94,0.08)' : 'transparent', transition: 'all 0.15s' }}>
              <input type="checkbox" checked={!!values[c.nombre]} onChange={e => handleChange(c.nombre, e.target.checked)} />
              {values[c.nombre] ? 'Activado' : 'Desactivado'}
            </label>
          </div>
        )}
        {c.tipo === 'select' && (
          <select className="input-control" style={inputStyle} value={values[c.nombre] || ''} onChange={e => handleChange(c.nombre, e.target.value)}>
            <option value="">-- Seleccionar --</option>
            {(c.opciones || []).map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
          </select>
        )}
      </div>
    );
  };

  if (!form) return <div style={{ padding: '40px', textAlign: 'center' }} className="text-muted">Cargando formulario...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '860px', marginBottom: '28px' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="btn-secondary" onClick={() => navigate('/forms/records')} style={{ padding: '8px' }}>
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList size={24} className="text-accent" /> {form.nombre}
            </h1>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/forms/view/${id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Table2 size={16} /> Ver Registros
          </button>
        </div>
      </div>

      {/* Form card */}
      <div className="glass-panel" style={{ padding: '36px 40px', width: '100%', maxWidth: '860px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px', paddingBottom: '18px', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>Nuevo Registro</h3>
          {form.descripcion && <p className="text-muted" style={{ fontSize: '0.85rem' }}>{form.descripcion}</p>}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '22px 32px',
        }}>
          {form.campos.map((c, i) => renderField(c, i))}
        </div>

        <div style={{ marginTop: '32px', paddingTop: '22px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              const init = {};
              form.campos.forEach(c => { init[c.nombre] = c.tipo === 'checkbox' || c.tipo === 'toggle' ? false : ''; });
              setValues(init);
            }}
            style={{ padding: '10px 28px' }}
          >
            Limpiar
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ padding: '10px 36px' }}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Registro'}
          </button>
        </div>
      </div>

      {alert && <AlertModal isOpen title={alert.title} message={alert.message} onClose={() => setAlert(null)} />}
    </div>
  );
};

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.78rem', marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const inputStyle = { width: '100%' };

export default FormFill;
