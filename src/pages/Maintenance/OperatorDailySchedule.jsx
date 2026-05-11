import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import {
  CheckCircle2, Circle, Box, Wrench,
  Calendar, ArrowRight, ChevronRight,
  CalendarRange, LayoutGrid, Activity,
} from 'lucide-react';
import { Button, Badge, Card } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';

const OperatorDailySchedule = () => {
  const { currentUser, maintenances, maintenanceScopes } = useAppContext();
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

    const tasksWithDetails = await Promise.all(filtered.map(async (m) => {
      if (viewMode !== 'today') return { ...m, checklist: [] };
      try {
        const res = await api.get(`/api/maintenances/${m.id}/tasks`);
        const checklist = res?.ok ? (await res.json()) : [];
        return { ...m, checklist: Array.isArray(checklist) ? checklist : [] };
      } catch (e) {
        return { ...m, checklist: [] };
      }
    }));

    tasksWithDetails.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    setDailyTasks(tasksWithDetails);
    setLoading(false);
  };

  const groupedTasks = useMemo(() => {
    const groups = {};
    dailyTasks.forEach(task => {
      if (!groups[task.startDate]) groups[task.startDate] = [];
      groups[task.startDate].push(task);
    });
    return groups;
  }, [dailyTasks]);

  const toggleTask = async (ticketId, taskId, currentState) => {
    try {
      const res = await api.put(`/api/maintenances/tasks/${taskId}`, { isCompleted: !currentState });
      if (res?.ok) {
        setDailyTasks(prev => prev.map(ticket => {
          if (ticket.id !== ticketId) return ticket;
          const updatedChecklist = ticket.checklist.map(t =>
            t.Id === taskId ? { ...t, IsCompleted: !currentState } : t
          );
          const allDone = updatedChecklist.length > 0 && updatedChecklist.every(t => t.IsCompleted);
          if (allDone && ticket.status !== 'COMPLETADO') {
            api.put(`/api/maintenances/${ticketId}`, { ...ticket, status: 'COMPLETADO' });
            return { ...ticket, checklist: updatedChecklist, status: 'COMPLETADO' };
          }
          return { ...ticket, checklist: updatedChecklist };
        }));
      }
    } catch (e) {
      console.error("Error toggling task", e);
    }
  };

  const completedCount = dailyTasks.reduce((acc, ticket) =>
    acc + ticket.checklist.filter(t => t.IsCompleted).length, 0
  );
  const totalTasksCount = dailyTasks.reduce((acc, ticket) => acc + ticket.checklist.length, 0);
  const progressPercent = totalTasksCount > 0 ? (completedCount / totalTasksCount) * 100 : 0;

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

  const ticketStatusTone = (status) => {
    if (status === 'COMPLETADO') return 'success';
    if (status === 'EN_PROGRESO') return 'warning';
    return 'neutral';
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
            {totalTasksCount > 0 && (
              <> · <strong style={{ color: 'var(--success)' }}>{Math.round(progressPercent)}%</strong> completado</>
            )}
          </p>
        </div>

        {/* Progress indicator */}
        {totalTasksCount > 0 && (
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
          <CheckCircle2 size={32} style={{ color: 'var(--success)', margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ margin: '0 0 6px' }}>Sin tareas pendientes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No tienes actividades programadas para este periodo.</p>
          <Button variant="secondary" style={{ marginTop: 16 }} onClick={() => navigate('/calendar')}>Ver Calendario</Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {Object.keys(groupedTasks).map(dateKey => (
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

              {/* Tasks for this day */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {groupedTasks[dateKey].map(ticket => {
                  const done = ticket.checklist.filter(t => t.IsCompleted).length;
                  const pct = ticket.checklist.length > 0 ? Math.round((done / ticket.checklist.length) * 100) : 0;
                  const isCurrent = ticket.status === 'EN_PROGRESO';
                  const isDone = ticket.status === 'COMPLETADO';

                  return (
                    <Card key={ticket.id} padded={false} style={{
                      overflow: 'hidden',
                      opacity: isDone ? 0.7 : 1,
                      borderColor: isCurrent ? 'var(--accent-primary)' : undefined,
                    }}>
                      {/* Ticket header */}
                      <div style={{
                        padding: isMobile ? '14px 14px' : '16px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: ticket.checklist.length > 0 ? '1px solid var(--glass-border)' : 'none',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span className="code-font" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ticket.id}</span>
                              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{ticket.title}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                                <Box size={12} /> {ticket.assetId}
                              </span>
                              <Badge tone={ticketStatusTone(ticket.status)} dot>{ticket.status}</Badge>
                              {ticket.checklist.length > 0 && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{done}/{ticket.checklist.length} tareas</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="secondary" style={{ padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0 }}
                          onClick={() => navigate(`/maintenances/view/${ticket.id}`)}>
                          Detalles <ChevronRight size={14} style={{ marginLeft: 2 }} />
                        </Button>
                      </div>

                      {/* Checklist */}
                      {ticket.checklist.length > 0 && (
                        <div style={{ padding: isMobile ? '12px 14px' : '14px 20px' }}>
                          {/* Progress bar */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                              <span>Progreso de sub-tareas</span>
                              <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text-main)' }}>{pct}%</span>
                            </div>
                            <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--success)' : 'var(--accent-primary)', transition: 'width 0.4s ease', borderRadius: 2 }} />
                            </div>
                          </div>

                          {/* Task rows */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {ticket.checklist.map((task, idx) => (
                              <div key={task.Id} onClick={() => toggleTask(ticket.id, task.Id, task.IsCompleted)} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                background: task.IsCompleted ? 'rgba(34,197,94,0.06)' : 'var(--bg-secondary)',
                                border: `1px solid ${task.IsCompleted ? 'rgba(34,197,94,0.2)' : 'var(--glass-border)'}`,
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}>
                                <span className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: 20 }}>{String(idx + 1).padStart(2, '0')}</span>
                                {task.IsCompleted
                                  ? <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                  : <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                }
                                <span style={{
                                  flex: 1, fontSize: '0.84rem',
                                  color: task.IsCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                                  textDecoration: task.IsCompleted ? 'line-through' : 'none',
                                }}>
                                  {task.TaskDescription}
                                </span>
                                {task.IsCompleted && <span style={{ fontSize: '0.68rem', color: 'var(--success)', fontWeight: 600 }}>LISTO</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperatorDailySchedule;
