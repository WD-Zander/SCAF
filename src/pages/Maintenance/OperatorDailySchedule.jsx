import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import { 
  CheckCircle2, 
  Circle, 
  Box, 
  Wrench, 
  Calendar, 
  ArrowRight,
  ListTodo,
  ChevronRight,
  CalendarRange,
  LayoutGrid
} from 'lucide-react';

const OperatorDailySchedule = () => {
  const { currentUser, maintenances, refreshMaintenances, maintenanceScopes } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scope = searchParams.get('scope');
  const scopeLabel = maintenanceScopes.find(s => s.slug === scope)?.nombre || '';
  const [dailyTasks, setDailyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'week', 'month', 'upcoming'

  // Auxiliares de fecha
  const today = new Date();
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Calcular límites de semana (Lunes-Domingo)
  const weekRange = useMemo(() => {
    const curr = new Date(today);
    const day = curr.getDay(); // 0 is Sunday
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));
    const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
    
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: fmt(monday), end: fmt(sunday) };
  }, [today]);

  // Límites de mes
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
    let filtered = [];

    const isSuperAdmin = currentUser?.role?.id === 'SUPERADMIN' || currentUser?.role?.id === 'ROL-ADMIN';
    const scopedMants = scope ? maintenances.filter(m => m.scope === scope) : maintenances;

    if (viewMode === 'today') {
      filtered = scopedMants.filter(m =>
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) &&
        m.startDate === todayStr
      );
    } else if (viewMode === 'week') {
      filtered = scopedMants.filter(m =>
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) &&
        m.startDate >= weekRange.start &&
        m.startDate <= weekRange.end
      );
    } else if (viewMode === 'month') {
      filtered = scopedMants.filter(m =>
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) &&
        m.startDate >= monthRange.start &&
        m.startDate <= monthRange.end
      );
    } else if (viewMode === 'upcoming') {
      filtered = scopedMants.filter(m =>
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) &&
        m.startDate > monthRange.end
      );
    }

    // Para la vista "today" se cargan los checklists (pocos tickets).
    // Para semana/mes/siguientes se omite para no lanzar N requests paralelas.
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

    // Ordenar por fecha — null-safe para evitar crash cuando startDate es null
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
      const d = new Date(dateStr + 'T12:00:00'); // center time to avoid offset
      if (isNaN(d.getTime())) return dateStr;
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      const label = d.toLocaleDateString('es-ES', options);
      return label.charAt(0).toUpperCase() + label.slice(1);
    } catch(e) {
      return dateStr;
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ListTodo className="text-accent" size={32} /> Mi Agenda
            {scopeLabel && <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', background: 'var(--accent-light)', color: 'var(--accent-primary)', fontWeight: 600 }}>{scopeLabel}</span>}
          </h1>
          <p className="text-muted">Gestión de actividades de mantenimiento asignadas.</p>
        </div>
        {/* Progreso */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Progreso</div>
            <strong style={{ fontSize: '1.1rem' }}>{Math.round(progressPercent)}%</strong>
          </div>
          <div style={{ width: '100px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--success)', transition: 'width 0.5s ease' }}></div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {dailyTasks.length} tarea{dailyTasks.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── VIEW SWITCHER ── */}
      <div className="view-switcher-container" style={{
        display: 'inline-flex', gap: '4px', padding: '4px',
        background: 'var(--bg-secondary)', borderRadius: '12px',
        border: '1px solid var(--glass-border)', marginBottom: '28px'
      }}>
        {[
          { key: 'today', label: 'Hoy', icon: <Calendar size={16} /> },
          { key: 'week', label: 'Semana', icon: <CalendarRange size={16} /> },
          { key: 'month', label: 'Mes', icon: <LayoutGrid size={16} /> },
          { key: 'upcoming', label: 'Siguientes', icon: <ArrowRight size={16} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px',
              fontSize: '0.85rem', fontWeight: viewMode === tab.key ? 600 : 400,
              background: viewMode === tab.key ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === tab.key ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '100px', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: '20px' }}>Cargando agenda...</p>
        </div>
      ) : dailyTasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '80px', textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-tertiary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3>¡Sin tareas pendientes!</h3>
          <p className="text-muted">No tienes actividades programadas para este periodo.</p>
          <button className="btn-secondary" style={{ marginTop: '20px' }} onClick={() => navigate('/calendar')}>Ver Calendario Completo</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {Object.keys(groupedTasks).map(dateKey => (
            <div key={dateKey}>
              {/* Day Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ 
                  padding: '8px 16px', 
                  borderRadius: '100px', 
                  background: dateKey === todayStr ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: dateKey === todayStr ? '#fff' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  {formatDateLabel(dateKey)}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
              </div>

              {/* Tasks for this day */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {groupedTasks[dateKey].map(ticket => (
                  <div key={ticket.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ 
                      padding: '20px 24px', 
                      background: 'rgba(255,255,255,0.03)', 
                      borderBottom: '1px solid var(--glass-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Wrench size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge code-font" style={{ fontSize: '0.75rem' }}>{ticket.id}</span>
                            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{ticket.title}</h3>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.82rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}><Box size={13} /> {ticket.assetId}</span>
                            <span className={`badge ${ticket.status === 'COMPLETADO' ? 'success' : ticket.status === 'EN_PROGRESO' ? 'info' : 'warning'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{ticket.status}</span>
                            {ticket.checklist?.length > 0 && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                {ticket.checklist.filter(t => t.IsCompleted).length}/{ticket.checklist.length} tareas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0 }} onClick={() => navigate(`/maintenances/view/${ticket.id}`)}>
                        Detalles <ChevronRight size={16} />
                      </button>
                    </div>

                    {ticket.checklist?.length > 0 && (
                      <div style={{ padding: '0 24px 20px' }}>
                        {/* Progress bar */}
                        {(() => {
                          const done = ticket.checklist.filter(t => t.IsCompleted).length;
                          const pct = Math.round((done / ticket.checklist.length) * 100);
                          return (
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                <span>Progreso de sub-tareas</span>
                                <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text-main)' }}>{pct}%</span>
                              </div>
                              <div style={{ height: '5px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--success)' : 'var(--accent-primary)', transition: 'width 0.4s ease', borderRadius: '3px' }} />
                              </div>
                            </div>
                          );
                        })()}
                        {/* Task rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {ticket.checklist.map((task, idx) => (
                            <div
                              key={task.Id}
                              onClick={() => toggleTask(ticket.id, task.Id, task.IsCompleted)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: task.IsCompleted ? 'rgba(34,197,94,0.06)' : 'var(--bg-secondary)',
                                border: `1px solid ${task.IsCompleted ? 'rgba(34,197,94,0.2)' : 'var(--glass-border)'}`,
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: '22px' }}>{String(idx + 1).padStart(2, '0')}</span>
                              {task.IsCompleted
                                ? <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                : <Circle size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              }
                              <span style={{
                                flex: 1,
                                fontSize: '0.88rem',
                                color: task.IsCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                                textDecoration: task.IsCompleted ? 'line-through' : 'none'
                              }}>
                                {task.TaskDescription}
                              </span>
                              {task.IsCompleted && <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>LISTO</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperatorDailySchedule;
