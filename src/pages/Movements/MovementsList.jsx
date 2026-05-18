import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageOpen, Plus, Search, ChevronLeft, ChevronRight, MoveRight, ExternalLink } from 'lucide-react';
import { api } from '../../api';

const MovementsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef(null);
  const LIMIT = 20;

  const loadPage = async (page, q) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/movements?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(q || '')}`);
      if (res?.ok) {
        const json = await res.json();
        setRows(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.pages || 1);
        setCurrentPage(page);
      }
    } catch (e) {
      console.error('Error cargando movimientos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1, '');
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadPage(1, value), 400);
  };

  const fmtDateTime = (str) => {
    if (!str) return '—';
    return str.replace('T', ' ').substring(0, 16);
  };

  const DiffCell = ({ from, to }) => {
    const changed = from !== to;
    if (!from && !to) return <span className="text-muted">—</span>;
    if (!changed) return <span style={{ fontSize: '0.85rem' }}>{to || '—'}</span>;
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', opacity: 0.8 }}>✕ {from || '—'}</span>
        <span style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600 }}>✓ {to || '—'}</span>
      </span>
    );
  };

  const buildPageButtons = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PackageOpen className="text-accent" size={32} /> Movimientos de Activos
          </h1>
          <p className="text-muted">Trazabilidad de traslados, cambios de ubicación y estados.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/movements/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-control"
            type="text"
            placeholder="Buscar por activo, observación..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel movements-panel">
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p className="text-muted" style={{ marginTop: '16px' }}>Cargando historial...</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <PackageOpen size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.35 }} />
            <h3>Sin movimientos registrados</h3>
            <p className="text-muted" style={{ marginBottom: '20px' }}>Cuando muevas un activo aparecerá aquí con toda su trazabilidad.</p>
            <button className="btn-primary" onClick={() => navigate('/movements/new')}>
              <Plus size={16} /> Registrar primer movimiento
            </button>
          </div>
        ) : (
          <>
            <div className="movements-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(37,99,235,0.05)' }}>
                    {['ACTIVO', 'UBICACIÓN', 'DEPARTAMENTO', 'ÁREA', 'ESTADO', 'OBSERVACIÓN', 'REGISTRADO POR', 'FECHA', ''].map(h => (
                      <th key={h} style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                      <td style={{ padding: '13px 16px' }}>
                        <span className="code-font" style={{ fontWeight: 700, fontSize: '0.88rem' }}>{r.assetId}</span>
                        {r.assetName && <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '2px' }}>{r.assetName}</p>}
                      </td>
                      <td style={{ padding: '13px 16px', maxWidth: '180px' }}>
                        <DiffCell from={r.locationFrom} to={r.locationTo} />
                      </td>
                      <td style={{ padding: '13px 16px', maxWidth: '180px' }}>
                        <DiffCell from={r.deptFrom} to={r.deptTo} />
                      </td>
                      <td style={{ padding: '13px 16px', maxWidth: '160px' }}>
                        <DiffCell from={r.areaFrom} to={r.areaTo} />
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <DiffCell from={r.statusFrom} to={r.statusTo} />
                      </td>
                      <td style={{ padding: '13px 16px', maxWidth: '260px' }}>
                        <span style={{
                          display: 'inline-block',
                          background: 'rgba(37,99,235,0.06)',
                          border: '1px solid var(--accent-light)',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.82rem',
                          lineHeight: '1.4'
                        }}>
                          {r.observation}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '0.85rem' }}>{r.changedBy || '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmtDateTime(r.changedAt)}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          title="Ver activo"
                          onClick={() => navigate(`/inventory/view/${r.assetId}`)}
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginator */}
            {totalPages > 1 && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                  Página {currentPage} de {totalPages} — {total} registros
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" style={{ padding: '6px 10px' }} disabled={currentPage === 1} onClick={() => loadPage(currentPage - 1, search)}>
                    <ChevronLeft size={16} />
                  </button>
                  {buildPageButtons().map((p, i) =>
                    p === '...'
                      ? <span key={`e${i}`} style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>…</span>
                      : <button key={p} className={currentPage === p ? 'btn-primary' : 'btn-secondary'} style={{ padding: '4px 10px', fontSize: '0.85rem' }} onClick={() => loadPage(p, search)}>{p}</button>
                  )}
                  <button className="btn-secondary" style={{ padding: '6px 10px' }} disabled={currentPage === totalPages} onClick={() => loadPage(currentPage + 1, search)}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.table-row-hover:hover { background: rgba(37,99,235,0.02); }` }} />
    </div>
  );
};

export default MovementsList;
