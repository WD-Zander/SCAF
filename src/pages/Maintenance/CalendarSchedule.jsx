import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, Wrench } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const CalendarSchedule = () => {
  const { maintenances } = useAppContext();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); // Para el modal de +X más

  // Logica de calendario
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const title = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  let firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  firstDay = firstDay === 0 ? 6 : firstDay - 1; // Adaptar a Lunes: 0

  // Pre-calcular dias
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  // Filtrar y amarrar mantenimientos
  const monthMaintenances = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return maintenances.filter(m => {
      if (!m.startDate) return false;
      // Parse as local date string (YYYY-MM-DD) to avoid timezone shifts
      const parts = m.startDate.split('-');
      if (parts.length < 3) return false;
      const mYear = parseInt(parts[0], 10);
      const mMonth = parseInt(parts[1], 10) - 1; // 0-indexed
      return mYear === year && mMonth === month;
    });
  }, [currentDate, maintenances]);

  const getDayMaintenances = (dayNumber) => {
    return monthMaintenances.filter(m => {
      const parts = m.startDate.split('-');
      return parseInt(parts[2], 10) === dayNumber;
    });
  };

  const statusColor = (status) => {
    if(status === 'COMPLETADO') return 'var(--success)';
    if(status === 'EN PROGRESO') return 'var(--warning)';
    return 'var(--danger)'; 
  };

  const statusBg = (status) => {
    if(status === 'COMPLETADO') return 'rgba(34, 197, 94, 0.1)';
    if(status === 'EN PROGRESO') return 'rgba(234, 179, 8, 0.1)';
    return 'rgba(239, 68, 68, 0.1)'; 
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarIcon className="text-accent" /> Planificador de Mantenimiento
          </h1>
          <p className="text-muted">Vista ejecutiva de la programación de activos por mes.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {/* Header Calendario */}
        <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>{title}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={prevMonth} style={{ padding: '8px' }}><ChevronLeft size={20} /></button>
            <button className="btn-secondary" onClick={() => setCurrentDate(new Date())} style={{ padding: '8px 16px' }}>Hoy</button>
            <button className="btn-secondary" onClick={nextMonth} style={{ padding: '8px' }}><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Grid Calendario con Scroll responsivo */}
        <div className="calendar-grid-wrapper" style={{ overflowX: 'auto' }}>
          <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--glass-border)', gap: '1px', minWidth: '900px' }}>
            {/* Días de la semana */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="calendar-day-header" style={{ background: '#fff', padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {day}
            </div>
          ))}

          {/* Bloques Vacíos */}
          {blanksArray.map(b => (
            <div key={`blank-${b}`} className="calendar-day-cell" style={{ background: '#fafafa', minHeight: '100px' }} />
          ))}

          {/* Días Activos */}
          {daysArray.map(day => {
            const dayMints = getDayMaintenances(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
            const visibleMints = dayMints.slice(0, 2);
            const hiddenCount = dayMints.length - visibleMints.length;
            
            return (
              <div key={day} className="calendar-day-cell" style={{ 
                background: '#fff', 
                minHeight: '100px', 
                padding: '12px',
                borderTop: isToday ? '3px solid var(--accent-primary)' : 'none',
                position: 'relative',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div className="calendar-day-number" style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isToday ? 'var(--accent-primary)' : 'transparent',
                  color: isToday ? '#fff' : 'inherit',
                  fontWeight: isToday ? 700 : 500,
                  fontSize: '0.9rem',
                  marginBottom: '8px'
                }}>
                  {day}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {visibleMints.map(m => (
                    <div 
                      key={m.id}
                      onClick={() => navigate(`/maintenances/view/${m.id}`)}
                      className="calendar-event"
                      style={{ 
                        background: statusBg(m.status),
                        borderLeft: `3px solid ${statusColor(m.status)}`,
                        padding: '6px 8px',
                        borderRadius: '0 6px 6px 0',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                      title={`${m.id} - ${m.title}`}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.title}
                      </div>
                      <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--text-muted)'}}>
                         <Clock size={10} /> {m.assetId}
                      </div>
                    </div>
                  ))}
                  
                  {/* Etiqueta +X Más */}
                  {hiddenCount > 0 && (
                    <div 
                      onClick={() => setSelectedDay({ day, events: dayMints })}
                      className="calendar-event-more"
                      style={{
                        padding: '4px', textAlign: 'center', fontSize: '0.75rem', 
                        color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600,
                        background: '#f1f5f9', borderRadius: '4px', marginTop: '2px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      +{hiddenCount}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Día */}
      {selectedDay && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Día {selectedDay.day} - Mantenimientos</h3>
              <button 
                onClick={() => setSelectedDay(null)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
              {selectedDay.events.map(m => (
                <div 
                  key={m.id}
                  onClick={() => navigate(`/maintenances/view/${m.id}`)}
                  style={{ 
                    background: 'var(--bg-primary)', borderLeft: `4px solid ${statusColor(m.status)}`,
                    borderTop: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)',
                    padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.3' }}>{m.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/>{m.assetId}</span>
                     <span className="badge code-font" style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', fontSize: '0.7rem' }}>{m.id}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setSelectedDay(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSchedule;
