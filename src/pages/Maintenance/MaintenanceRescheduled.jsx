import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarClock, ExternalLink, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { api } from '../../api';
import { useAppContext } from '../../context/AppContext';

const MaintenanceRescheduled = () => {
  const navigate = useNavigate();
  const { maintenances, maintenanceScopes } = useAppContext();
  const [searchParams] = useSearchParams();
  const scope = searchParams.get('scope');
  const scopeLabel = maintenanceScopes.find(s => s.slug === scope)?.nombre || '';
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/maintenances/rescheduled');
        if (res?.ok) {
          setRecords(await res.json());
        } else {
          setError('No se pudieron cargar los datos.');
        }
      } catch (e) {
        setError('Error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredRecords = useMemo(() => {
    if (!scope) return records;
    const scopeTicketIds = new Set(maintenances.filter(m => m.scope === scope).map(m => m.id));
    return records.filter(r => scopeTicketIds.has(r.ticketId));
  }, [records, scope, maintenances]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const fmt = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const fmtDateTime = (str) => {
    if (!str) return '—';
    return str.replace('T', ' ').substring(0, 16);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarClock className="text-accent" size={30} /> Mantenimientos Reprogramados
            {scopeLabel && <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', background: 'var(--accent-light)', color: 'var(--accent-primary)', fontWeight: 600 }}>{scopeLabel}</span>}
          </h1>
          <p className="text-muted">
            Historial de todos los mantenimientos a los que se les modificó la fecha, con su motivo registrado.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <strong style={{ color: 'var(--text-main)', fontSize: '1.5rem' }}>{records.length}</strong>
          <br />reprogramaciones
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando historial...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
            <p style={{ fontWeight: 600 }}>{error}</p>
            <button className="btn-secondary" style={{ marginTop: '12px' }} onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <CalendarClock size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
            <p className="text-muted" style={{ fontWeight: 600 }}>Sin reprogramaciones registradas</p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              Cuando se modifique la fecha de un mantenimiento y se ingrese el motivo, aparecerá aquí.
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(37,99,235,0.05)' }}>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>TICKET</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>ACTIVO</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>FECHA ORIGINAL</th>
                    <th style={{ padding: '14px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}></th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>NUEVA FECHA</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>MOTIVO</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>MODIFICADO POR</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>FECHA CAMBIO</th>
                    <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>VER</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                      <td style={{ padding: '14px 20px' }}>
                        <span className="code-font" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.ticketId}</span>
                        {r.title && <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '2px' }}>{r.title}</p>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {r.assetId && <span className="code-font" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.assetId}</span>}
                        {r.assetName && <p style={{ fontSize: '0.88rem', fontWeight: 500 }}>{r.assetName}</p>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--danger)' }}>
                            {fmt(r.originalStart)}
                          </span>
                          {r.originalEnd && r.originalEnd !== r.originalStart && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>hasta {fmt(r.originalEnd)}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                        <ArrowRight size={18} color="var(--text-muted)" />
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--success)' }}>
                            {fmt(r.newStart)}
                          </span>
                          {r.newEnd && r.newEnd !== r.newStart && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>hasta {fmt(r.newEnd)}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', maxWidth: '280px' }}>
                        <span style={{
                          display: 'inline-block',
                          background: 'rgba(234,179,8,0.08)',
                          border: '1px solid rgba(234,179,8,0.3)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '0.82rem',
                          color: 'var(--text-main)',
                          lineHeight: '1.4'
                        }}>
                          {r.reason}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>{r.changedBy || '—'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDateTime(r.changedAt)}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/maintenances/view/${r.ticketId}`)}
                          title="Ver ticket"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Página {currentPage} de {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-secondary" style={{ padding: '6px 10px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} className={currentPage === n ? 'btn-primary' : 'btn-secondary'} style={{ padding: '4px 10px', fontSize: '0.85rem' }} onClick={() => setCurrentPage(n)}>{n}</button>
                  ))}
                  <button className="btn-secondary" style={{ padding: '6px 10px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
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

export default MaintenanceRescheduled;
