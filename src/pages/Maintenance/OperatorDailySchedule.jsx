import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import {
  Check, Circle, Box, Wrench,
  Calendar, ArrowRight, ChevronRight,
  CalendarRange, LayoutGrid, Activity, ExternalLink,
} from 'lucide-react';
import { Button, Badge, Card } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';

const OperatorDailySchedule = () => {
  const { currentUser, maintenances, maintenanceScopes, assets, areas, rooms, infraItems, refreshMaintenances } = useAppContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const scope = searchParams.get('scope');
  const scopeLabel = maintenanceScopes.find(s => s.slug === scope)?.nombre || '';
  const [dailyTasks, setDailyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today');

  const today = new Date();
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const weekRange = useMemo(() => {
    const curr = new Date(today);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));
    const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: fmt(monday), end: fmt(sunday) };
  }, [today]);

  const monthRange = useMemo(() => {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: fmt(firstDay), end: fmt(lastDay) };
  }, [today]);

  useEffect(() => {
    fetchFilteredTasks();
  }, [maintenances, currentUser, viewMode]);

  const fetchFilteredTasks = async () => {
    setLoading(true);
    const isSuperAdmin = currentUser?.role?.id === 'SUPERADMIN' || currentUser?.role?.id === 'ROL-ADMIN';
    const scopedMants = scope ? maintenances.filter(m => m.scope === scope) : maintenances;

    let filtered = [];
    if (viewMode === 'today') {
      filtered = scopedMants.filter(m =>
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) &&
        m.startDate === todayStr
      );
    } else if (viewMode === 'week') {
      filtered = scopedMants.filter(m =>
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) &&
        m.startDate >= weekRange.start && m.startDate <= weekRange.end
      );
    } else if (viewMode === 'month') {
      filtered = scopedMants.filter(m =>
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) &&
        m.startDate >= monthRange.start && m.startDate <= monthRange.end
      );
    } else if (viewMode === 'upcoming') {
      filtered = scopedMants.filter(m =>
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) &&
        m.startDate > monthRange.end
      );
    }

    filtered.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    setDailyTasks(filtered);
    setLoading(false);
  };

  // Agrupar por fecha
  const groupedTasks = useMemo(() => {
    const groups = {};
    dailyTasks.forEach(task => {
      if (!groups[task.startDate]) groups[task.startDate] = [];
      groups[task.startDate].push(task);
    });
    return groups;
  }, [dailyTasks]);

  const getEntityName = (m) => {
    const id = m.entityId || m.assetId;
    if (!id) return '';
    if (m.entityName) return m.entityName;
    const asset = assets.find(a => a.id === id);
    if (asset) return asset.name;
    const area = areas.find(a => a.id === id);
    if (area) return area.nombre;
    const room = rooms.find(r => r.id === id);
    if (room) return room.nombre;
    const infraItem = infraItems.find(i => i.id === id);
    if (infraItem) return infraItem.nombre;
    return '';
  };

  const toggleTicketStatus = async (ticket) => {
    const newStatus = ticket.status === 'COMPLETADO' ? 'PENDIENTE' : 'COMPLETADO';
    try {
      const res = await api.put(`/api/maintenances/${ticket.id}`, { ...ticket, status: newStatus });
      if (res?.ok) {
        setDailyTasks(prev => prev.map(t =>
          t.id === ticket.id ? { ...t, status: newStatus } : t
        ));
        refreshMaintenances();
      }
    } catch (e) {
      console.error('Error toggling ticket status', e);
    }
  };

  const completedCount = dailyTasks.filter(t => t.status === 'COMPLETADO').length;
  const progressPercent = dailyTasks.length > 0 ? (completedCount / dailyTasks.length) * 100 : 0;

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "Fecha Desconocida";
    if (dateStr === todayStr) return "Hoy";
    try {
      const d = new Date(dateStr + 'T12:00:00');
      if (isNaN(d.getTime())) return dateStr;
      const label = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      return label.charAt(0).toUpperCase() + label.slice(1);
    } catch(e) {
      return dateStr;
    }
  };

  const todayFormatted = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{todayFormatted}</div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            Mi Agenda
            {scopeLabel && <Badge tone="neutral">{scopeLabel}</Badge>}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            <strong>{dailyTasks.length}</strong> tarea{dailyTasks.length !== 1 ? 's' : ''} en este periodo
            {dailyTasks.length > 0 && (
              <> · <strong style={{ color: 'var(--success)' }}>{Math.round(progressPercent)}%</strong> completado</>
            )}
          </p>
        </div>

        {/* Progress indicator */}
        {dailyTasks.length > 0 && (
          <Card padded={false} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Progreso</div>
              <strong style={{ fontSize: '1.1rem' }}>{Math.round(progressPercent)}%</strong>
            </div>
            <div style={{ width: 80, height: 5, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--success)', transition: 'width 0.5s ease' }} />
            </div>
          </Card>
        )}
      </div>

      {/* View switcher */}
      <div style={{
        display: 'inline-flex', gap: 3, padding: 3,
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--glass-border)', alignSelf: 'flex-start',
      }}>
        {[
          { key: 'today', label: 'Hoy', Icon: Calendar },
          { key: 'week', label: 'Semana', Icon: CalendarRange },
          { key: 'month', label: 'Mes', Icon: LayoutGrid },
          { key: 'upcoming', label: 'Siguientes', Icon: ArrowRight },
        ].map(tab => (
          <button key={tab.key} onClick={() => setViewMode(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: isMobile ? '8px 12px' : '8px 16px', borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem', fontWeight: viewMode === tab.key ? 600 : 400,
            background: viewMode === tab.key ? 'var(--accent-primary)' : 'transparent',
            color: viewMode === tab.key ? '#fff' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <tab.Icon size={14} />
            {!isMobile && tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', flexDirection: 'column', gap: 16 }}>
          <Activity size={28} style={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando agenda...</p>
        </div>
      ) : dailyTasks.length === 0 ? (
        <Card padded={false} style={{ padding: isMobile ? 40 : 60, textAlign: 'center' }}>
          <Check size={32} style={{ color: 'var(--success)', margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ margin: '0 0 6px' }}>Sin tareas pendientes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No tienes actividades programadas para este periodo.</p>
          <Button variant="secondary" style={{ marginTop: 16 }} onClick={() => navigate('/calendar')}>Ver Calendario</Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {Object.keys(groupedTasks).map(dateKey => {
            // Sub-agrupar por activo dentro de cada fecha
            const assetGroups = {};
            groupedTasks[dateKey].forEach(ticket => {
              const assetKey = ticket.entityId || ticket.assetId || 'sin-activo';
              if (!assetGroups[assetKey]) assetGroups[assetKey] = [];
              assetGroups[assetKey].push(ticket);
            });

            return (
              <div key={dateKey}>
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <span style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: dateKey === todayStr ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: dateKey === todayStr ? '#fff' : 'var(--text-main)',
                    fontWeight: 700, fontSize: '0.84rem',
                  }}>
                    {formatDateLabel(dateKey)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                </div>

                {/* Asset groups for this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(assetGroups).map(([assetKey, tickets]) => {
                    const assetName = getEntityName(tickets[0]) || assetKey;
                    const doneCount = tickets.filter(t => t.status === 'COMPLETADO').length;
                    const pct = tickets.length > 0 ? Math.round((doneCount / tickets.length) * 100) : 0;

                    // Sub-agrupar por workOrderId
                    const planGroups = {};
                    tickets.forEach(t => {
                      const key = t.workOrderId || 'direct';
                      if (!planGroups[key]) planGroups[key] = [];
                      planGroups[key].push(t);
                    });

                    return (
                      <Card key={assetKey} padded={false} style={{ overflow: 'hidden' }}>
                        {/* Asset header */}
                        <div style={{
                          padding: isMobile ? '14px 14px' : '16px 20px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: '1px solid var(--glass-border)',
                          gap: 12,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                              background: 'var(--accent-light)', color: 'var(--accent-primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Wrench size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {assetName}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                                  <Box size={12} /> {assetKey}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                  {tickets.length} tarea{tickets.length !== 1 ? 's' : ''} · {doneCount} completada{doneCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Progress */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <div style={{ width: 50, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--success)' : 'var(--accent-primary)', transition: 'width 0.3s', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text-main)', minWidth: 28 }}>{pct}%</span>
                          </div>
                        </div>

                        {/* Plan groups + checklist */}
                        <div style={{ padding: isMobile ? '12px 14px' : '14px 20px' }}>
                          {Object.entries(planGroups).map(([woId, woTickets]) => {
                            const planLabel = woId === 'direct' ? 'Tarea Directa'
                              : (() => {
                                const desc = woTickets[0]?.description || '';
                                const match = desc.match(/\[Sub-tarea de: (.+?)\]/);
                                return match ? match[1] : woId;
                              })();

                            return (
                              <div key={woId} style={{ marginBottom: '10px' }}>
                                {/* Plan label */}
                                {Object.keys(planGroups).length > 1 && (
                                  <div style={{
                                    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)',
                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                    marginBottom: '6px', paddingLeft: '4px',
                                  }}>
                                    {planLabel}
                                  </div>
                                )}

                                {/* Task rows */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {woTickets.map((ticket, idx) => {
                                    const isDone = ticket.status === 'COMPLETADO';
                                    return (
                                      <div key={ticket.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                        background: isDone ? 'rgba(34,197,94,0.06)' : 'var(--bg-secondary)',
                                        border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : 'var(--glass-border)'}`,
                                        cursor: 'pointer', transition: 'background 0.15s',
                                      }}
                                        onClick={() => toggleTicketStatus(ticket)}
                                      >
                                        <span className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: 20 }}>
                                          {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        {/* Checkbox */}
                                        <div style={{
                                          width: '18px', height: '18px', borderRadius: '4px',
                                          border: `2px solid ${isDone ? '#22c55e' : '#cbd5e1'}`,
                                          background: isDone ? '#22c55e' : 'transparent',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          flexShrink: 0, transition: 'all 0.15s',
                                        }}>
                                          {isDone && <Check size={11} color="#fff" strokeWidth={3} />}
                                        </div>
                                        <span style={{
                                          flex: 1, fontSize: '0.84rem',
                                          color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                                          textDecoration: isDone ? 'line-through' : 'none',
                                        }}>
                                          {ticket.title}
                                        </span>
                                        {isDone && <span style={{ fontSize: '0.68rem', color: 'var(--success)', fontWeight: 600 }}>LISTO</span>}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); navigate(`/maintenances/view/${ticket.id}`); }}
                                          style={{
                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                            color: 'var(--text-muted)', padding: '2px', flexShrink: 0,
                                          }}
                                          title="Ver detalles"
                                        >
                                          <ExternalLink size={13} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OperatorDailySchedule;
