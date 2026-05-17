import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ClipboardList, FileText, Plus, Table2 } from 'lucide-react';
import { api } from '../../api';

const FormRecords = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get('/api/forms');
      if (res?.ok) setForms(await res.json());
      setLoading(false);
    })();
  }, []);

  const filtered = forms.filter(f => {
    const q = search.toLowerCase();
    return f.nombre?.toLowerCase().includes(q) || f.descripcion?.toLowerCase().includes(q);
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList className="text-accent" size={28} /> Registros de Formularios
        </h1>
        <p className="text-muted">Selecciona un formulario para llenar o ver sus registros.</p>
      </div>

      <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
        <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'text' }}>
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Buscar formulario..."
            style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.9rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-muted" style={{ textAlign: 'center', padding: '60px 0' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
          <p className="text-muted">No hay formularios disponibles.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map(form => (
            <div
              key={form.id}
              className="glass-panel"
              style={{
                padding: '24px',
                transition: 'all 0.2s',
                border: '1px solid var(--glass-border)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>{form.nombre}</h3>
              {form.descripcion && (
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>{form.descripcion}</p>
              )}
              {!form.descripcion && <div style={{ marginBottom: '16px' }} />}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/forms/fill/${form.id}`)}
                  style={{ fontSize: '0.8rem', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                >
                  <Plus size={14} /> Llenar
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/forms/view/${form.id}`)}
                  style={{ fontSize: '0.8rem', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                >
                  <Table2 size={14} /> Registros ({form.totalRegistros})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormRecords;
