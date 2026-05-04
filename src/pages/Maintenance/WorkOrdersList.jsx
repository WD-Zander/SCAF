import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Layers, Calendar as CalendarIcon, ChevronDown, ChevronUp, CheckCircle2, Circle, ExternalLink, Wrench, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import ConfirmModal from '../../components/Common/ConfirmModal';

const StatusBadge = ({ status, progress }) => {
  const isDone = progress === 100 || status === 'COMPLETADO';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
      background: isDone ? 'var(--success-bg)' : status === 'EN PROGRESO' ? 'var(--warning-bg)' : 'var(--bg-tertiary)',
      color: isDone ? 'var(--success)' : status === 'EN PROGRESO' ? 'var(--warning)' : 'var(--text-muted)'
    }}>
      {isDone ? 'COMPLETADO' : status || 'PENDIENTE'}
    </span>
  );
};

const WorkOrdersList = () => {
  const navigate = useNavigate();
  const { setGlobalAlert, hasPermission, maintenances } = useAppContext();

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [woTickets, setWoTickets] = useState({});
  const [loadingTickets, setLoadingTickets] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null, name: '' });

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/work-orders');
      if (res?.ok) {
        setWorkOrders(await res.json());
      } else {
        throw new Error('Error al cargar Planes en Marcha');
      }
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
        setGlobalAlert({ isOpen: true, title: 'No se puede eliminar', message: data.error || 'Error al eliminar el plan en marcha.' });
      }
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
  };

  const toggleExpand = async (woId) => {
    if (expandedId === woId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(woId);

    // Si ya tenemos los tickets cargados, no volver a buscar
    if (woTickets[woId]) return;

    setLoadingTickets(prev => ({ ...prev, [woId]: true }));
    try {
      // Primero buscar en el contexto (tickets con workOrderId)
      const fromContext = maintenances.filter(m => m.workOrderId === woId);
      if (fromContext.length > 0) {
        setWoTickets(prev => ({ ...prev, [woId]: fromContext }));
      } else {
        // Fallback: traer todos los maintenances y filtrar
        const res = await api.get('/api/maintenances');
        if (res?.ok) {
          const all = await res.json();
          setWoTickets(prev => ({ ...prev, [woId]: all.filter(m => m.workOrderId === woId) }));
        }
      }
    } catch (e) {
      console.error('Error cargando tickets del plan', e);
    }
    setLoadingTickets(prev => ({ ...prev, [woId]: false }));
  };

  const filteredOrders = workOrders.filter(w => {
    const term = searchTerm.toLowerCase();
    return (
      w.Id?.toLowerCase().includes(term) ||
      w.PlanName?.toLowerCase().includes(term) ||
      w.AssetName?.toLowerCase().includes(term) ||
      w.AssetSerial?.toLowerCase().includes(term)
    );
  });

  const ticketStatusColor = (status) => {
    if (status === 'COMPLETADO') return 'var(--success)';
    if (status === 'EN PROGRESO') return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Planes en Marcha</h1>
          <p className="text-muted">Supervisión de planes generales y su progreso.</p>
        </div>
        {hasPermission('maintenances_create') && (
          <button className="btn-primary" onClick={() => navigate('/maintenances/routines')}>
            <Plus size={20} /> NUEVO PLAN
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Buscar por ID, Plan o Activo..."
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Column headers */}
        <div className="wo-table-header" style={{
          display: 'grid',
          gridTemplateColumns: '105px 1fr 155px 125px 185px 110px 36px',
          gap: '0 12px',
          padding: '10px 20px',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          {['WORK ORDER', 'PLAN / ACTIVO', 'FECHAS', 'ASIGNADO', 'PROGRESO', 'ESTADO', ''].map(h => (
            <span key={h} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }} className="text-muted">
            Cargando planes en marcha...
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((w) => {
            const total = w.TotalTasks || 0;
            const completed = w.CompletedTasks || 0;
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
            const isExpanded = expandedId === w.Id;
            const tickets = woTickets[w.Id] || [];
            const isLoadingT = loadingTickets[w.Id];

            return (
              <div key={w.Id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {/* Main row */}
                <div
                  className="wo-list-row"
                  onClick={() => toggleExpand(w.Id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '105px 1fr 155px 125px 185px 110px 36px',
                    gap: '0 12px',
                    padding: '14px 20px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(47,129,247,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="code-font wo-id" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.Id}</span>

                  <div className="wo-plan">
                    <div style={{ fontWeight: 600 }}>{w.PlanName}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '3px' }}>
                      {w.AssetName || w.AssetId} · <span style={{ fontFamily: 'monospace' }}>{w.AssetSerial || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="wo-dates">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
                      <CalendarIcon size={13} className="text-muted" />
                      <span>{w.StartDate?.split('T')[0]}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.82rem', paddingLeft: '18px' }}>→ {w.EndDate?.split('T')[0]}</div>
                  </div>

                  <div className="wo-assigned" style={{ fontSize: '0.85rem', color: w.AssignedTo ? 'inherit' : 'var(--text-muted)' }}>
                    {w.AssignedTo || 'Sin asignar'}
                  </div>

                  <div className="wo-progress">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '5px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'var(--success)' : 'var(--accent-primary)', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '30px' }}>{progress}%</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '3px' }}>{completed} de {total} tareas</div>
                  </div>

                  <div className="wo-status">
                    <StatusBadge status={w.Status} progress={progress} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded panel: tickets del plan */}
                {isExpanded && (
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    borderTop: '1px solid var(--glass-border)',
                    padding: '16px 20px 20px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <Wrench size={15} className="text-muted" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Tickets del plan
                      </span>
                    </div>

                    {hasPermission('maintenances_delete') && (
                      <div style={{ marginBottom: '12px' }}>
                        <button
                          className="btn-secondary"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.8rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, idToDelete: w.Id, name: w.PlanName }); }}
                        >
                          <Trash2 size={14} /> Eliminar plan en marcha
                        </button>
                      </div>
                    )}

                    {isLoadingT ? (
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>Cargando tickets...</p>
                    ) : tickets.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        No hay tickets vinculados a este plan en marcha.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {tickets.map(t => (
                          <div
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 14px',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '8px',
                            }}
                          >
                            {t.status === 'COMPLETADO'
                              ? <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                              : <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            }
                            <span className="code-font" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{t.id}</span>
                            <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500 }}>{t.title}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{t.startDate}</span>
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                              color: ticketStatusColor(t.status),
                              background: t.status === 'COMPLETADO' ? 'var(--success-bg)' : t.status === 'EN PROGRESO' ? 'var(--warning-bg)' : 'rgba(248,81,73,0.1)',
                            }}>
                              {t.status || 'PENDIENTE'}
                            </span>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', flexShrink: 0 }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/maintenances/view/${t.id}`); }}
                              title="Ver detalles"
                            >
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '48px' }} className="text-muted">
            <Layers size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No hay planes en marcha registrados.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Plan en Marcha"
        message={`¿Estás seguro de que deseas eliminar "${confirmModal.name}" (${confirmModal.idToDelete})? Los tickets pendientes vinculados también serán eliminados. Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null, name: '' })}
      />
    </div>
  );
};

export default WorkOrdersList;
