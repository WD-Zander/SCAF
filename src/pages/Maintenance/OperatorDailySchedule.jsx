import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Box, 
  Wrench, 
  Calendar, 
  ArrowRight,
  ListTodo,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  LayoutGrid
} from 'lucide-react';

const OperatorDailySchedule = () => {
  const { currentUser, maintenances, refreshMaintenances } = useAppContext();
  const navigate = useNavigate();
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

    if (viewMode === 'today') {
      filtered = maintenances.filter(m => 
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) && 
        m.startDate === todayStr
      );
    } else if (viewMode === 'week') {
      filtered = maintenances.filter(m => 
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) && 
        m.startDate >= weekRange.start && 
        m.startDate <= weekRange.end
      );
    } else if (viewMode === 'month') {
      filtered = maintenances.filter(m => 
        (isSuperAdmin || m.assignedTo?.trim() === currentUser.name?.trim() || !m.assignedTo) && 
        m.startDate >= monthRange.start && 
        m.startDate <= monthRange.end
      );
    } else if (viewMode === 'upcoming') {
      filtered = maintenances.filter(m => 
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
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              checklist: ticket.checklist.map(t => t.Id === taskId ? { ...t, IsCompleted: !currentState } : t)
            };
          }
          return ticket;
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
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ListTodo className="text-accent" size={32} /> Mi Agenda 
          </h1>
          <p className="text-muted">Gestión de actividades preventivas asignadas.</p>
        </div>
        <div className="glass-panel header-stats-panel">
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Progreso de Vista</div>
            <strong style={{ fontSize: '1.1rem' }}>{Math.round(progressPercent)}%</strong>
          </div>
          <div style={{ width: '100px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--success)', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>
      </div>

      {/* VIEW SWITCHER */}
      <div className="view-switcher-container">
        <button 
          onClick={() => setViewMode('today')}
          className={`btn-secondary ${viewMode === 'today' ? 'active-view' : ''}`}
          style={{ 
            border: 'none', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: viewMode === 'today' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: viewMode === 'today' ? '#fff' : 'var(--text-muted)',
            fontWeight: viewMode === 'today' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          <Calendar size={18} /> Hoy
        </button>
        <button 
          onClick={() => setViewMode('week')}
          className={`btn-secondary ${viewMode === 'week' ? 'active-view' : ''}`}
          style={{ 
            border: 'none', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: viewMode === 'week' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: viewMode === 'week' ? '#fff' : 'var(--text-muted)',
            fontWeight: viewMode === 'week' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          <CalendarRange size={18} /> Semana
        </button>
        <button 
          onClick={() => setViewMode('month')}
          className={`btn-secondary ${viewMode === 'month' ? 'active-view' : ''}`}
          style={{ 
            border: 'none', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: viewMode === 'month' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: viewMode === 'month' ? '#fff' : 'var(--text-muted)',
            fontWeight: viewMode === 'month' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          <LayoutGrid size={18} /> Mes
        </button>
        <button 
          onClick={() => setViewMode('upcoming')}
          className={`btn-secondary ${viewMode === 'upcoming' ? 'active-view' : ''}`}
          style={{ 
            border: 'none', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: viewMode === 'upcoming' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: viewMode === 'upcoming' ? '#fff' : 'var(--text-muted)',
            fontWeight: viewMode === 'upcoming' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowRight size={18} /> Siguientes
        </button>
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
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wrench size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge code-font" style={{ fontSize: '0.75rem' }}>{ticket.id}</span>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{ticket.title}</h3>
                          </div>
                          <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.85rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Box size={14} /> {ticket.assetId}</span>
                            <span className={`badge ${ticket.status === 'COMPLETADO' ? 'success' : 'warning'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{ticket.status}</span>
                          </div>
                        </div>
                      </div>
                      <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => navigate(`/maintenances/view/${ticket.id}`)}>
                        Detalles <ChevronRight size={16} />
                      </button>
                    </div>

                    <div style={{ padding: '16px 20px' }}>
                      <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                        {(ticket.checklist || []).map(task => (
                          <div
                            key={task.Id}
                            onClick={() => toggleTask(ticket.id, task.Id, task.IsCompleted)}
                            className={`checklist-item${task.IsCompleted ? ' is-done' : ''}`}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '10px',
                              background: task.IsCompleted ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-tertiary)',
                              border: task.IsCompleted ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid var(--glass-border)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {task.IsCompleted ? (
                              <CheckCircle2 size={20} className="text-success" />
                            ) : (
                              <Circle size={20} className="text-muted" />
                            )}
                            <span style={{ 
                              flex: 1, 
                              fontSize: '0.9rem',
                              color: task.IsCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                              textDecoration: task.IsCompleted ? 'line-through' : 'none'
                            }}>
                              {task.TaskDescription}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
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
