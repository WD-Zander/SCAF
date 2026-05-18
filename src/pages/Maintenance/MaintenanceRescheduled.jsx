import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarClock, ExternalLink, ChevronLeft, ChevronRight,
  ArrowRight, Search, Activity,
} from 'lucide-react';
import { api } from '../../api';
import { useAppContext } from '../../context/AppContext';
import { Button, Badge, Card, Field } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';

const ITEMS_PER_PAGE = 20;

const MaintenanceRescheduled = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { maintenances, maintenanceScopes } = useAppContext();
  const [searchParams] = useSearchParams();
  const scope = searchParams.get('scope');
  const scopeMeta = maintenanceScopes.find(s => s.slug === scope);
  const scopeLabel = scopeMeta?.nombre || '';
  const scopeColor = scopeMeta?.color || 'var(--accent-primary)';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/maintenances/rescheduled');
        if (res?.ok) setRecords(await res.json());
        else setError('No se pudieron cargar los datos.');
      } catch (e) {
        setError('Error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredRecords = useMemo(() => {
    let result = records;
    if (scope) {
      const scopeTicketIds = new Set(maintenances.filter(m => m.scope === scope).map(m => m.id));
      result = result.filter(r => scopeTicketIds.has(r.ticketId));
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(r =>
        (r.ticketId || '').toLowerCase().includes(s) ||
        (r.title || '').toLowerCase().includes(s) ||
        (r.assetName || '').toLowerCase().includes(s) ||
        (r.reason || '').toLowerCase().includes(s) ||
        (r.changedBy || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [records, scope, maintenances, searchTerm]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginated = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const fmt = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const fmtDateTime = (str) => {
    if (!str) return '—';
    return str.replace('T', ' ').substring(0, 16);
  };

  const getPageNumbers = () => {
    const delta = 3;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) range.push(i);
    return range;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6, color: scopeColor }}>{scopeLabel || 'Operaciones'}</div>
          <h1 style={{ margin: 0 }}>Reprogramados</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--text-main)' }}>{filteredRecords.length}</strong> reprogramaci{filteredRecords.length === 1 ? 'ón' : 'ones'} registrada{filteredRecords.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <Card padded={false} style={{ padding: '12px 14px' }}>
        <Field
          icon={Search}
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por ticket, activo, motivo..."
        />
      </Card>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', flexDirection: 'column', gap: 16 }}>
          <Activity size={28} style={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando historial...</p>
        </div>
      ) : error ? (
        <Card padded={false} style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
          <Button variant="secondary" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>Reintentar</Button>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <Card padded={false} style={{ padding: 60, textAlign: 'center' }}>
          <CalendarClock size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ margin: '0 0 6px' }}>Sin reprogramaciones</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {searchTerm ? 'No se encontraron resultados.' : 'Cuando se modifique la fecha de un mantenimiento, aparecerá aquí.'}
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          {!isMobile && (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Ticket', 'Activo', 'Fecha Original', '', 'Nueva Fecha', 'Motivo', 'Modificado Por', 'Fecha Cambio', ''].map((h, i) => (
                      <th key={i} style={{
                        textAlign: i === 3 || i === 8 ? 'center' : 'left',
                        fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: 'var(--text-muted)', padding: i === 3 ? '11px 6px' : '11px 14px',
                        background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, i) => (
                    <tr key={r.id}
                      style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--glass-border)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <span className="code-font" style={{ fontWeight: 600, fontSize: '0.82rem' }}>{r.ticketId}</span>
                        {r.title && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.title}</div>}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '0.84rem' }}>
                        {r.assetName && <div style={{ fontWeight: 500 }}>{r.assetName}</div>}
                        {r.assetId && <div className="code-font" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{r.assetId}</div>}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--danger)' }}>{fmt(r.originalStart)}</span>
                        {r.originalEnd && r.originalEnd !== r.originalStart && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>hasta {fmt(r.originalEnd)}</div>
                        )}
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--success)' }}>{fmt(r.newStart)}</span>
                        {r.newEnd && r.newEnd !== r.newStart && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>hasta {fmt(r.newEnd)}</div>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', maxWidth: 240 }}>
                        <span style={{
                          display: 'inline-block', fontSize: '0.8rem', lineHeight: 1.4,
                          padding: '4px 10px', borderRadius: 6,
                          background: 'var(--warning-bg)', border: '1px solid rgba(234,179,8,0.25)',
                        }}>
                          {r.reason}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '0.84rem' }}>{r.changedBy || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDateTime(r.changedAt)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                        <button onClick={() => navigate(`/maintenances/view/${r.ticketId}`)} title="Ver ticket"
                          style={{ color: 'var(--text-muted)', padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}>
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{
                  padding: '14px 18px', borderTop: '1px solid var(--glass-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft size={16} />
                    </Button>
                    {getPageNumbers().map(n => (
                      <Button key={n} variant={currentPage === n ? 'primary' : 'ghost'} style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setCurrentPage(n)}>{n}</Button>
                    ))}
                    <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Mobile cards */}
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paginated.map(r => (
                <Card key={r.id} padded={false} style={{ padding: '14px', cursor: 'pointer' }}
                  onClick={() => navigate(`/maintenances/view/${r.ticketId}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                        {r.ticketId}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.25 }}>
                        {r.assetName || r.title || 'Sin nombre'}
                      </div>
                    </div>
                    <ExternalLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                  </div>

                  {/* Date change */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                    padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)',
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--danger)' }}>{fmt(r.originalStart)}</span>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--success)' }}>{fmt(r.newStart)}</span>
                  </div>

                  {/* Reason */}
                  <div style={{
                    fontSize: '0.82rem', lineHeight: 1.4, padding: '6px 10px', borderRadius: 6,
                    background: 'var(--warning-bg)', border: '1px solid rgba(234,179,8,0.2)', marginBottom: 8,
                  }}>
                    {r.reason}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>{r.changedBy || '—'}</span>
                    <span>{fmtDateTime(r.changedAt)}</span>
                  </div>
                </Card>
              ))}

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                  <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft size={16} />
                  </Button>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
                  <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MaintenanceRescheduled;
