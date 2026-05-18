import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Layers, Calendar as CalendarIcon,
  ChevronDown, ChevronUp, Check, ExternalLink, Wrench,
  Trash2, ChevronLeft, ChevronRight, Activity, User,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import { Button, Badge, Card, Field } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';
import ConfirmModal from '../../components/Common/ConfirmModal';

const ITEMS_PER_PAGE = 15;

const WorkOrdersList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const scope = searchParams.get('scope');
  const asset = searchParams.get('asset');
  const date = searchParams.get('date');
  const { setGlobalAlert, hasPermission, maintenances, maintenanceScopes } = useAppContext();
  const scopeMeta = maintenanceScopes.find(s => s.slug === scope);
  const scopeLabel = scopeMeta?.nombre || '';
  const scopeColor = scopeMeta?.color || 'var(--accent-primary)';

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [woTickets, setWoTickets] = useState({});
  const [loadingTickets, setLoadingTickets] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null, name: '' });
  const autoExpandedRef = useRef(false);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/work-orders');
      if (res?.ok) setWorkOrders(await res.json());
      else throw new Error('Error al cargar Planes en Marcha');
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
    setLoading(false);
  };

  useEffect(() => { fetchWorkOrders(); }, []);

  const handleDeleteConfirm = async () => {
    const { idToDelete } = confirmModal;
    setConfirmModal({ isOpen: false, idToDelete: null, name: '' });
    try {
      const res = await api.delete(`/api/work-orders/${idToDelete}`);
      if (res?.ok) {
        setWorkOrders(prev => prev.filter(w => w.Id !== idToDelete));
        if (expandedId === idToDelete) setExpandedId(null);
      } else {
        const data = await res.json();
        setGlobalAlert({ isOpen: true, title: 'Error', message: data.error || 'Error al eliminar.' });
      }
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
  };

  const toggleExpand = async (woId) => {
    if (expandedId === woId) { setExpandedId(null); return; }
    setExpandedId(woId);
    if (woTickets[woId]) return;
    setLoadingTickets(prev => ({ ...prev, [woId]: true }));
    try {
      const fromContext = maintenances.filter(m => m.workOrderId === woId);
      if (fromContext.length > 0) {
        setWoTickets(prev => ({ ...prev, [woId]: fromContext }));
      } else {
        const res = await api.get('/api/maintenances');
        if (res?.ok) {
          const all = await res.json();
          setWoTickets(prev => ({ ...prev, [woId]: all.filter(m => m.workOrderId === woId) }));
        }
      }
    } catch (e) { console.error(e); }
    setLoadingTickets(prev => ({ ...prev, [woId]: false }));
  };

  const filteredOrders = useMemo(() => workOrders.filter(w => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = [w.Id, w.PlanName, w.AssetName, w.AssetSerial].some(v => (v || '').toLowerCase().includes(term));
    const matchesScope = !scope || w.Scope === scope;
    const matchesAsset = !asset || w.AssetId === asset || w.AssetSerial === asset;
    return matchesSearch && matchesScope && matchesAsset;
  }), [workOrders, searchTerm, scope, asset]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (asset && !loading && filteredOrders.length > 0 && !autoExpandedRef.current) {
      autoExpandedRef.current = true;
      toggleExpand(filteredOrders[0].Id);
    }
  }, [asset, loading, filteredOrders.length]);

  const handleToggleTicketStatus = async (ticket) => {
    const newStatus = ticket.status === 'COMPLETADO' ? 'PENDIENTE' : 'COMPLETADO';
    try {
      const res = await api.put(`/api/maintenances/${ticket.id}`, { ...ticket, status: newStatus });
      if (res?.ok) {
        setWoTickets(prev => ({
          ...prev,
          [ticket.workOrderId]: (prev[ticket.workOrderId] || []).map(t =>
            t.id === ticket.id ? { ...t, status: newStatus } : t
          ),
        }));
        setWorkOrders(prev => prev.map(w => {
          if (w.Id !== ticket.workOrderId) return w;
          const delta = newStatus === 'COMPLETADO' ? 1 : -1;
          return { ...w, CompletedTasks: (w.CompletedTasks || 0) + delta };
        }));
      } else {
        const data = await res?.json().catch(() => ({}));
        setGlobalAlert({ isOpen: true, title: 'Error', message: data.error || 'No se pudo actualizar.' });
      }
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
  };

  // Stats
  const stats = useMemo(() => {
    let completed = 0, inProgress = 0, pending = 0;
    filteredOrders.forEach(w => {
      const p = w.TotalTasks ? Math.round((w.CompletedTasks || 0) / w.TotalTasks * 100) : 0;
      if (p === 100) completed++;
      else if (p > 0) inProgress++;
      else pending++;
    });
    return { completed, inProgress, pending };
  }, [filteredOrders]);

  const getPageNumbers = () => {
    const delta = 3;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) range.push(i);
    return range;
  };

  const renderWOCard = (w) => {
    const total = w.TotalTasks || 0;
    const completed = w.CompletedTasks || 0;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    const isExpanded_ = expandedId === w.Id;
    const allTickets = woTickets[w.Id] || [];
    const tickets = date ? allTickets.filter(t => t.startDate?.startsWith(date)) : allTickets;
    const isLoadingT = loadingTickets[w.Id];

    return (
      <Card key={w.Id} padded={false} style={{ overflow: 'hidden' }}>
        {/* Main row */}
        <div onClick={() => toggleExpand(w.Id)} style={{
          padding: isMobile ? '14px' : '16px 20px', cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="code-font" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>
                {w.Id}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3 }}>{w.PlanName}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
                {w.AssetName || w.AssetId}
                {w.AssetSerial && <span className="code-font" style={{ marginLeft: 6, fontSize: '0.74rem' }}>SN: {w.AssetSerial}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Badge tone={progress === 100 ? 'success' : progress > 0 ? 'warning' : 'neutral'} dot>
                {progress === 100 ? 'COMPLETADO' : w.Status || 'PENDIENTE'}
              </Badge>
              {isExpanded_ ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
            </div>
          </div>

          {/* Info row */}
          <div style={{ display: 'flex', gap: isMobile ? 10 : 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <CalendarIcon size={13} />
              <span>{w.StartDate?.split('T')[0]}</span>
              <span style={{ opacity: 0.5 }}>→</span>
              <span>{w.EndDate?.split('T')[0]}</span>
            </div>
            {w.AssignedTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <User size={12} /> {w.AssignedTo}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <div style={{ width: isMobile ? 60 : 100, height: 5, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${progress}%`, borderRadius: 3,
                  background: progress === 100 ? 'var(--success)' : 'var(--accent-primary)',
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: 30 }}>{progress}%</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{completed}/{total}</span>
            </div>
          </div>
        </div>

        {/* Expanded tickets */}
        {isExpanded_ && (
          <div style={{
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--bg-tertiary)',
            padding: isMobile ? '12px 14px' : '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {date ? `Tareas del ${date}` : 'Tickets del plan'}
              </span>
              {hasPermission('maintenances_delete') && (
                <button onClick={e => { e.stopPropagation(); setConfirmModal({ isOpen: true, idToDelete: w.Id, name: w.PlanName }); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, background: 'none',
                    border: '1px solid var(--danger)', borderRadius: 6, padding: '4px 10px',
                    color: 'var(--danger)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                  <Trash2 size={13} /> Eliminar
                </button>
              )}
            </div>

            {isLoadingT ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Activity size={18} style={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
              </div>
            ) : tickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0' }}>
                No hay tickets vinculados a este plan.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tickets.map(t => {
                  const isDone = t.status === 'COMPLETADO';
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
                      padding: isMobile ? '8px 10px' : '10px 14px',
                      background: isDone ? 'rgba(34,197,94,0.04)' : 'var(--bg-secondary)',
                      border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-sm)', transition: 'all 0.15s',
                    }}>
                      <div onClick={e => { e.stopPropagation(); handleToggleTicketStatus(t); }}
                        style={{
                          width: 20, height: 20, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                          border: `2px solid ${isDone ? 'var(--success)' : '#cbd5e1'}`,
                          background: isDone ? 'var(--success)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        title={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
                      >
                        {isDone && <Check size={12} color="#fff" strokeWidth={3} />}
                      </div>
                      {!isMobile && <span className="code-font" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', flexShrink: 0 }}>{t.id}</span>}
                      <span style={{
                        flex: 1, fontSize: '0.85rem', fontWeight: 500,
                        textDecoration: isDone ? 'line-through' : 'none',
                        opacity: isDone ? 0.6 : 1,
                      }}>{t.title}</span>
                      {!isMobile && <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', flexShrink: 0 }}>{t.startDate}</span>}
                      <Badge tone={isDone ? 'success' : t.status === 'EN PROGRESO' ? 'warning' : 'danger'}>
                        {t.status || 'PENDIENTE'}
                      </Badge>
                      <button onClick={e => { e.stopPropagation(); navigate(`/maintenances/view/${t.id}`); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}
                        title="Ver detalles">
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6, color: scopeColor }}>{scopeLabel || 'Operaciones'}</div>
          <h1 style={{ margin: 0 }}>Planes en Marcha</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--text-main)' }}>{filteredOrders.length}</strong> plan{filteredOrders.length !== 1 ? 'es' : ''}
            {stats.completed > 0 && <> · <strong style={{ color: 'var(--success)' }}>{stats.completed}</strong> completado{stats.completed !== 1 ? 's' : ''}</>}
            {stats.inProgress > 0 && <> · <strong style={{ color: 'var(--warning)' }}>{stats.inProgress}</strong> en progreso</>}
          </p>
          {(asset || date) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {asset && <Badge tone="neutral">{workOrders.find(w => w.AssetId === asset)?.AssetName || asset}</Badge>}
              {date && <Badge tone="warning">Fecha: {date}</Badge>}
              <button onClick={() => navigate(`/maintenances/work-orders${scope ? `?scope=${scope}` : ''}`)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>
                Ver todos
              </button>
            </div>
          )}
        </div>
        {hasPermission('maintenances_create') && (
          <Button variant="primary" icon={Plus} onClick={() => navigate(`/maintenances/routines${scope ? `?scope=${scope}` : ''}`)}>
            {isMobile ? 'Nuevo' : 'Nuevo Plan'}
          </Button>
        )}
      </div>

      {/* Search */}
      <Card padded={false} style={{ padding: '12px 14px' }}>
        <Field
          icon={Search}
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por ID, plan o activo..."
        />
      </Card>

      {/* Work orders list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', flexDirection: 'column', gap: 16 }}>
          <Activity size={28} style={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando planes en marcha...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card padded={false} style={{ padding: 60, textAlign: 'center' }}>
          <Layers size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay planes en marcha registrados.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginatedOrders.map(renderWOCard)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 12 : 4, padding: '8px 0' }}>
          {isMobile ? (
            <>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              {getPageNumbers().map(n => (
                <Button key={n} variant={currentPage === n ? 'primary' : 'ghost'} style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setCurrentPage(n)}>{n}</Button>
              ))}
              <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Plan en Marcha"
        message={`¿Estás seguro de eliminar "${confirmModal.name}" (${confirmModal.idToDelete})? Los tickets pendientes también serán eliminados.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null, name: '' })}
      />
    </div>
  );
};

export default WorkOrdersList;
