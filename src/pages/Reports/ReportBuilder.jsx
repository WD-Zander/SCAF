import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Play, Plus, Trash2, Variable, Database,
  AlertTriangle, CheckCircle, Clock, Table2
} from 'lucide-react';
import { api } from '../../api';
import AlertModal from '../../components/Common/AlertModal';

const VAR_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Numero' },
  { value: 'date', label: 'Fecha' },
];

const ReportBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [consultaSql, setConsultaSql] = useState('SELECT TOP 100 *\nFROM ');
  const [variables, setVariables] = useState([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // Ejecucion
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [execError, setExecError] = useState(null);
  const [execTime, setExecTime] = useState(null);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        const res = await api.get(`/api/reports/${id}`);
        if (res?.ok) {
          const data = await res.json();
          setNombre(data.nombre);
          setDescripcion(data.descripcion || '');
          setConsultaSql(data.consultaSql);
          setVariables(data.variables ? (typeof data.variables === 'string' ? JSON.parse(data.variables) : data.variables) : []);
        }
      })();
    }
  }, [id]);

  // Variables
  const addVariable = () => {
    setVariables(prev => [...prev, { nombre: '', tipo: 'text', valorDefault: '' }]);
  };
  const updateVar = (idx, key, val) => {
    setVariables(prev => prev.map((v, i) => i === idx ? { ...v, [key]: val } : v));
  };
  const removeVar = (idx) => {
    setVariables(prev => prev.filter((_, i) => i !== idx));
  };

  // Ejecutar query
  const handleExecute = async () => {
    if (!consultaSql.trim()) return;
    setExecuting(true);
    setExecError(null);
    setResults(null);
    const t0 = Date.now();

    const varsWithValues = variables.map(v => ({
      ...v,
      valor: v.valor ?? v.valorDefault ?? '',
    }));

    const res = await api.post('/api/reports/execute', {
      consultaSql,
      variables: varsWithValues,
    });

    const elapsed = Date.now() - t0;
    setExecTime(elapsed);
    setExecuting(false);

    if (res?.ok) {
      setResults(await res.json());
    } else {
      let msg = 'Error ejecutando la consulta.';
      try { const err = await res.json(); msg = err.error || msg; } catch {}
      setExecError(msg);
    }
  };

  // Guardar
  const handleSave = async () => {
    if (!nombre.trim()) {
      setAlert({ title: 'Error', message: 'El nombre es obligatorio.' });
      return;
    }
    if (!consultaSql.trim()) {
      setAlert({ title: 'Error', message: 'La consulta SQL es obligatoria.' });
      return;
    }

    setSaving(true);
    const body = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      consultaSql: consultaSql.trim(),
      variables: variables.filter(v => v.nombre.trim()),
    };

    const res = isEdit
      ? await api.put(`/api/reports/${id}`, body)
      : await api.post('/api/reports', body);

    setSaving(false);
    if (res?.ok) {
      navigate('/reports');
    } else {
      let msg = 'No se pudo guardar.';
      try { const err = await res.json(); msg = err.error || msg; } catch {}
      setAlert({ title: 'Error', message: msg });
    }
  };

  // Ctrl+Enter para ejecutar
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn-secondary" onClick={() => navigate('/reports')} style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px' }}>{isEdit ? 'Editar Informe' : 'Crear Informe'}</h1>
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>Escribe tu consulta SQL, declara variables y ejecuta.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={handleExecute}
            disabled={executing || !consultaSql.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', borderColor: '#15803d' }}
          >
            <Play size={16} /> {executing ? 'Ejecutando...' : 'Ejecutar'}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Nombre + Descripcion */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nombre del Informe *</label>
            <input className="input-control" style={{ width: '100%' }} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Reporte de Activos por Area" />
          </div>
          <div>
            <label style={labelStyle}>Descripcion</label>
            <input className="input-control" style={{ width: '100%' }} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripcion breve" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'flex-start' }}>
        {/* SQL Editor */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(15,23,42,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Consulta SQL</span>
            </div>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Ctrl + Enter para ejecutar</span>
          </div>

          <textarea
            value={consultaSql}
            onChange={e => setConsultaSql(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="SELECT * FROM ..."
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '280px',
              padding: '20px',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: '0.88rem',
              lineHeight: '1.6',
              background: 'var(--bg-primary)',
              color: 'var(--text-main)',
              tabSize: 2,
            }}
          />
        </div>

        {/* Variables Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="flex-between" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Variable size={16} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Variables</span>
            </div>
            <button
              onClick={addVariable}
              style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              className="btn-secondary"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>

          {variables.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>
              Sin variables. Usa @nombre en tu SQL y declaralas aqui.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {variables.map((v, idx) => (
                <div key={idx} style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>Nombre</label>
                      <input
                        className="input-control"
                        style={{ width: '100%', fontSize: '0.82rem' }}
                        value={v.nombre}
                        onChange={e => updateVar(idx, 'nombre', e.target.value)}
                        placeholder="nombreVar"
                      />
                    </div>
                    <button onClick={() => removeVar(idx)} style={{ color: 'var(--danger)', padding: '4px', marginTop: '16px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>Tipo</label>
                      <select className="input-control" style={{ width: '100%', fontSize: '0.82rem' }} value={v.tipo} onChange={e => updateVar(idx, 'tipo', e.target.value)}>
                        {VAR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>Valor</label>
                      <input
                        className="input-control"
                        type={v.tipo === 'number' ? 'number' : v.tipo === 'date' ? 'date' : 'text'}
                        style={{ width: '100%', fontSize: '0.82rem' }}
                        value={v.valor ?? v.valorDefault ?? ''}
                        onChange={e => updateVar(idx, 'valor', e.target.value)}
                        placeholder="valor"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results area */}
      {(results || execError) && (
        <div className="glass-panel" style={{ marginTop: '16px', overflow: 'hidden' }}>
          {/* Status bar */}
          <div style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', gap: '12px',
            background: execError ? 'rgba(185,28,28,0.05)' : 'rgba(21,128,61,0.05)',
          }}>
            {execError
              ? <><AlertTriangle size={16} style={{ color: 'var(--danger)' }} /><span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>Error</span></>
              : <><CheckCircle size={16} style={{ color: '#15803d' }} /><span style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 600 }}>{results.total} filas</span></>
            }
            {execTime != null && (
              <span className="text-muted" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {execTime}ms
              </span>
            )}
          </div>

          {execError ? (
            <div style={{ padding: '20px', color: 'var(--danger)', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
              {execError}
            </div>
          ) : results && results.data?.length > 0 ? (
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(37,99,235,0.05)', position: 'sticky', top: 0 }}>
                    <th style={thStyle}>#</th>
                    {results.columns.map((col, i) => (
                      <th key={i} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{rIdx + 1}</td>
                      {results.columns.map((col, cIdx) => (
                        <td key={cIdx} style={tdStyle}>
                          {row[col] == null ? <span className="text-muted">NULL</span> : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <Table2 size={32} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '8px' }} />
              <p className="text-muted">La consulta no devolvio resultados.</p>
            </div>
          )}
        </div>
      )}

      {alert && <AlertModal isOpen title={alert.title} message={alert.message} onClose={() => setAlert(null)} />}
    </div>
  );
};

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.78rem', marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' };
const thStyle = { padding: '10px 16px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'left' };
const tdStyle = { padding: '8px 16px', whiteSpace: 'nowrap' };

export default ReportBuilder;
