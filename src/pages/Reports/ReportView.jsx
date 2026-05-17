import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Play, BarChart3, Clock, CheckCircle, AlertTriangle, Table2, Download
} from 'lucide-react';
import { api } from '../../api';

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [variables, setVariables] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [execError, setExecError] = useState(null);
  const [execTime, setExecTime] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await api.get(`/api/reports/${id}`);
      if (res?.ok) {
        const data = await res.json();
        setReport(data);
        const vars = data.variables ? (typeof data.variables === 'string' ? JSON.parse(data.variables) : data.variables) : [];
        setVariables(vars.map(v => ({ ...v, valor: v.valorDefault || '' })));
      }
    })();
  }, [id]);

  const handleExecute = async () => {
    if (!report) return;
    setExecuting(true);
    setExecError(null);
    setResults(null);
    const t0 = Date.now();

    const res = await api.post('/api/reports/execute', {
      consultaSql: report.consultaSql,
      variables,
    });

    setExecTime(Date.now() - t0);
    setExecuting(false);

    if (res?.ok) {
      setResults(await res.json());
    } else {
      let msg = 'Error ejecutando la consulta.';
      try { const err = await res.json(); msg = err.error || msg; } catch {}
      setExecError(msg);
    }
  };

  const exportCSV = () => {
    if (!results?.data?.length) return;
    const sep = ',';
    const header = results.columns.join(sep);
    const rows = results.data.map(row =>
      results.columns.map(col => {
        const val = row[col] == null ? '' : String(row[col]).replace(/"/g, '""');
        return `"${val}"`;
      }).join(sep)
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report?.nombre || 'informe'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!report) return <div style={{ padding: '60px', textAlign: 'center' }} className="text-muted">Cargando informe...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn-secondary" onClick={() => navigate('/reports')} style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={24} className="text-accent" /> {report.nombre}
            </h1>
            {report.descripcion && <p className="text-muted" style={{ fontSize: '0.85rem' }}>{report.descripcion}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {results?.data?.length > 0 && (
            <button className="btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={16} /> Exportar CSV
            </button>
          )}
          <button
            className="btn-primary"
            onClick={handleExecute}
            disabled={executing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Play size={16} /> {executing ? 'Ejecutando...' : 'Ejecutar'}
          </button>
        </div>
      </div>

      {/* Variables */}
      {variables.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px' }}>Variables</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {variables.map((v, idx) => (
              <div key={idx} style={{ minWidth: '180px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  @{v.nombre}
                </label>
                <input
                  className="input-control"
                  type={v.tipo === 'number' ? 'number' : v.tipo === 'date' ? 'date' : 'text'}
                  style={{ width: '100%' }}
                  value={v.valor || ''}
                  onChange={e => {
                    const arr = [...variables];
                    arr[idx] = { ...arr[idx], valor: e.target.value };
                    setVariables(arr);
                  }}
                  placeholder={v.nombre}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {(results || execError) && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {/* Status bar */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', gap: '16px',
            background: execError ? 'rgba(185,28,28,0.04)' : 'rgba(21,128,61,0.04)',
          }}>
            {execError
              ? <><AlertTriangle size={16} style={{ color: 'var(--danger)' }} /><span style={{ color: 'var(--danger)', fontSize: '0.88rem', fontWeight: 600 }}>Error</span></>
              : <><CheckCircle size={16} style={{ color: '#15803d' }} /><span style={{ color: '#15803d', fontSize: '0.88rem', fontWeight: 600 }}>{results.total} filas</span></>
            }
            {execTime != null && (
              <span className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {execTime}ms
              </span>
            )}
          </div>

          {execError ? (
            <div style={{ padding: '24px', color: 'var(--danger)', fontFamily: 'monospace', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
              {execError}
            </div>
          ) : results?.data?.length > 0 ? (
            <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(37,99,235,0.05)', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={thStyle}>#</th>
                    {results.columns.map((col, i) => <th key={i} style={thStyle}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
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
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Table2 size={36} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '10px' }} />
              <p className="text-muted">La consulta no devolvio resultados.</p>
            </div>
          )}
        </div>
      )}

      {/* Hint si no se ha ejecutado */}
      {!results && !execError && (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <Play size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '12px' }} />
          <p className="text-muted">Presiona "Ejecutar" para ver los resultados del informe.</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.table-row-hover:hover{background:rgba(37,99,235,0.02)}` }} />
    </div>
  );
};

const thStyle = { padding: '12px 18px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'left', background: 'var(--bg-secondary)' };
const tdStyle = { padding: '10px 18px', whiteSpace: 'nowrap' };

export default ReportView;
