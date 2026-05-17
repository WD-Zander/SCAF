import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft, Box, Check, ExternalLink } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

const CalendarSchedule = () => {
  const { maintenances, maintenanceScopes, assets, areas, rooms, infraItems, refreshMaintenances } = useAppContext();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedScope, setSelectedScope] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const title = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  let firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  const getEntityName = (m) => {
    if (m.entityName) return m.entityName;
    const id = m.entityId || m.assetId;
    if (!id) return '';
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

  const monthMaintenances = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return maintenances.filter(m => {
      if (!m.startDate) return false;
      const p = m.startDate.split('-');
      return p.length >= 3 && parseInt(p[0]) === year && parseInt(p[1]) - 1 === month;
    });
  }, [currentDate, maintenances]);

  const getDayMaintenances = (dayNumber) =>
    monthMaintenances.filter(m => parseInt(m.startDate.split('-')[2]) === dayNumber);

  const statusColor = (s) => s === 'COMPLETADO' ? '#22c55e' : s === 'EN PROGRESO' ? '#f59e0b' : '#ef4444';
  const statusBg = (s) => s === 'COMPLETADO' ? '#f0fdf4' : s === 'EN PROGRESO' ? '#fffbeb' : '#fef2f2';

  const getScopeStripe = (entries) => {
    if (!entries.length) return 'transparent';
    const colors = entries.map(([slug]) => maintenanceScopes.find(s => s.slug === slug)?.color || '#94a3b8');
    if (colors.length === 1) return colors[0];
    const pct = 100 / colors.length;
    return `linear-gradient(90deg, ${colors.map((c, i) => `${c} ${i*pct}%, ${c} ${(i+1)*pct}%`).join(', ')})`;
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'COMPLETADO' ? 'PENDIENTE' : 'COMPLETADO';
    try {
      const res = await api.put(`/api/maintenances/${task.id}`, { ...task, status: newStatus });
      if (res?.ok) {
        setSelectedDay(prev => prev ? ({
          ...prev,
          events: prev.events.map(e => e.id === task.id ? { ...e, status: newStatus } : e)
        }) : prev);
        refreshMaintenances();
      }
    } catch (e) {
      console.error('Error toggling status', e);
    }
  };

  const closeModal = () => { setSelectedDay(null); setSelectedScope(null); setSelectedAsset(null); };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarIcon className="text-accent" /> Planificador de Mantenimiento
        </h1>
        <p className="text-muted">Vista ejecutiva de la programaci&oacute;n por mes.</p>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {/* Calendar header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--glass-border)',
        }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{title}</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-secondary" onClick={prevMonth} style={{ padding: '8px' }}><ChevronLeft size={18} /></button>
            <button className="btn-secondary" onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Hoy</button>
            <button className="btn-secondary" onClick={nextMonth} style={{ padding: '8px' }}><ChevronRight size={18} /></button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#e8ecf1', gap: '1px', minWidth: '900px' }}>
            {['Lun','Mar','Mi\u00e9','Jue','Vie','S\u00e1b','Dom'].map(d => (
              <div key={d} style={{ background: '#f8fafc', padding: '10px', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem', color: '#64748b' }}>{d}</div>
            ))}

            {blanksArray.map(b => (
              <div key={`b-${b}`} style={{ background: '#fbfcfd', minHeight: '120px' }} />
            ))}

            {daysArray.map(day => {
              const dayMints = getDayMaintenances(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
              const hasEvents = dayMints.length > 0;

              const scopeGroups = {};
              dayMints.forEach(m => { const s = m.scope || 'activo'; if (!scopeGroups[s]) scopeGroups[s] = []; scopeGroups[s].push(m); });
              const scopeEntries = Object.entries(scopeGroups);

              return (
                <div key={day}
                  onClick={() => hasEvents && setSelectedDay({ day, events: dayMints })}
                  style={{
                    background: isToday ? '#eff6ff' : '#fff',
                    minHeight: '120px', display: 'flex', flexDirection: 'column',
                    cursor: hasEvents ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => { if (hasEvents) e.currentTarget.style.background = isToday ? '#dbeafe' : '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isToday ? '#eff6ff' : '#fff'; }}
                >
                  {/* Color stripe */}
                  {hasEvents && <div style={{ height: '3px', background: getScopeStripe(scopeEntries) }} />}

                  <div style={{ padding: '8px 10px 0' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: isToday ? '#1e40af' : 'transparent',
                      color: isToday ? '#fff' : '#334155',
                      fontWeight: isToday ? 700 : 500, fontSize: '0.88rem',
                    }}>{day}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '4px 6px 8px' }}>
                    {scopeEntries.slice(0, 3).map(([slug, items]) => {
                      const sc = maintenanceScopes.find(s => s.slug === slug);
                      const color = sc?.color || '#94a3b8';
                      const name = sc?.nombre || slug;
                      return (
                        <div key={slug} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '4px 8px', borderRadius: '6px',
                          background: `${color}0d`, borderLeft: `3px solid ${color}`,
                          fontSize: '0.76rem', fontWeight: 600, color,
                        }}>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                          <span style={{ background: `${color}1a`, padding: '1px 6px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>{items.length}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────── MODAL ─────────── */}
      {selectedDay && (() => {
        const scopeObj = selectedScope ? maintenanceScopes.find(s => s.slug === selectedScope) : null;
        const accentColor = scopeObj?.color || '#1e40af';
        const scopeTickets = selectedScope
          ? selectedDay.events.filter(m => (m.scope || 'activo') === selectedScope)
          : [];

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 99999,
            }}
          >
            <div style={{
              background: '#fff', borderRadius: '16px',
              width: '92%', maxWidth: '460px',
              height: 'auto', maxHeight: '70vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}>

              {/* ── Header ── */}
              {(() => {
                const canGoBack = selectedScope || selectedAsset;
                const handleBack = () => {
                  if (selectedAsset) setSelectedAsset(null);
                  else if (selectedScope) setSelectedScope(null);
                };
                const assetName = selectedAsset ? (getEntityName({ assetId: selectedAsset }) || selectedAsset) : '';
                const assetTasks = selectedAsset ? scopeTickets.filter(m => (m.entityId || m.assetId || 'sin-activo') === selectedAsset) : [];

                let headerTitle, headerSub;
                if (selectedAsset) {
                  headerTitle = assetName;
                  const done = assetTasks.filter(t => t.status === 'COMPLETADO').length;
                  headerSub = `${assetTasks.length} tarea${assetTasks.length !== 1 ? 's' : ''}${done > 0 ? ` · ${done} completada${done !== 1 ? 's' : ''}` : ''}`;
                } else if (selectedScope) {
                  headerTitle = scopeObj?.nombre || selectedScope;
                  const uniqueAssets = new Set(scopeTickets.map(m => m.entityId || m.assetId)).size;
                  headerSub = `${uniqueAssets} activo${uniqueAssets !== 1 ? 's' : ''} · ${scopeTickets.length} tarea${scopeTickets.length !== 1 ? 's' : ''}`;
                } else {
                  headerTitle = `${selectedDay.day} de ${monthNames[currentDate.getMonth()]}`;
                  headerSub = `${selectedDay.events.length} tarea${selectedDay.events.length !== 1 ? 's' : ''}`;
                }

                return (
                  <div style={{
                    padding: '18px 22px', flexShrink: 0,
                    borderBottom: `3px solid ${accentColor}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {canGoBack && (
                        <button onClick={handleBack} style={{
                          background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer',
                          padding: '5px', borderRadius: '8px', display: 'flex',
                        }}>
                          <ArrowLeft size={15} color="#475569" />
                        </button>
                      )}
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{headerTitle}</h3>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{headerSub}</span>
                      </div>
                    </div>
                    <button onClick={closeModal} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', fontSize: '1.3rem', lineHeight: 1, padding: '2px 4px',
                    }}>&#x2715;</button>
                  </div>
                );
              })()}

              {/* ── Body (scrollable) ── */}
              <div style={{
                flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 18px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                {!selectedScope ? (
                  /* ── STEP 1: scope cards ── */
                  (() => {
                    const groups = {};
                    selectedDay.events.forEach(m => { const s = m.scope || 'activo'; if (!groups[s]) groups[s] = []; groups[s].push(m); });
                    return Object.entries(groups).map(([slug, items]) => {
                      const sc = maintenanceScopes.find(s => s.slug === slug);
                      const color = sc?.color || '#94a3b8';
                      const name = sc?.nombre || slug;
                      const pending = items.filter(i => i.status === 'PENDIENTE').length;
                      const progress = items.filter(i => i.status === 'EN PROGRESO').length;
                      const done = items.filter(i => i.status === 'COMPLETADO').length;
                      return (
                        <div key={slug} onClick={() => setSelectedScope(slug)} style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                          background: '#fff', border: `1px solid ${color}22`,
                          borderLeft: `4px solid ${color}`,
                          transition: 'all 0.15s',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = 'translateX(2px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <div style={{
                            width: '42px', height: '42px', borderRadius: '10px',
                            background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color, fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
                          }}>{items.length}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: '2px' }}>{name}</div>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.73rem', flexWrap: 'wrap' }}>
                              {pending > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{pending} pendiente{pending > 1 ? 's' : ''}</span>}
                              {progress > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>{progress} en progreso</span>}
                              {done > 0 && <span style={{ color: '#22c55e', fontWeight: 600 }}>{done} listo{done > 1 ? 's' : ''}</span>}
                            </div>
                          </div>
                          <ChevronRight size={15} color="#cbd5e1" />
                        </div>
                      );
                    });
                  })()
                ) : !selectedAsset ? (
                  /* ── STEP 2: asset cards ── */
                  (() => {
                    const assetGroups = {};
                    scopeTickets.forEach(m => {
                      const key = m.entityId || m.assetId || 'sin-activo';
                      if (!assetGroups[key]) assetGroups[key] = [];
                      assetGroups[key].push(m);
                    });
                    return Object.entries(assetGroups).map(([assetId, tasks]) => {
                      const assetName = getEntityName(tasks[0]);
                      const pending = tasks.filter(t => t.status === 'PENDIENTE').length;
                      const progress = tasks.filter(t => t.status === 'EN PROGRESO').length;
                      const done = tasks.filter(t => t.status === 'COMPLETADO').length;
                      return (
                        <div key={assetId} onClick={() => {
                          const assetTasks = scopeTickets.filter(m => (m.entityId || m.assetId || 'sin-activo') === assetId);
                          const target = assetTasks.find(t => t.status !== 'COMPLETADO') || assetTasks[0];
                          if (target) {
                            closeModal();
                            navigate(`/maintenances/view/${target.id}`);
                          }
                        }} style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                          background: '#fff', border: '1px solid #e2e8f022',
                          borderLeft: `4px solid ${accentColor}`,
                          transition: 'all 0.15s',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${accentColor}08`; e.currentTarget.style.transform = 'translateX(2px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <div style={{
                            width: '42px', height: '42px', borderRadius: '10px',
                            background: `${accentColor}14`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Box size={18} color={accentColor} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {assetName || assetId}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem', flexWrap: 'wrap' }}>
                              <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{assetId}</span>
                              <span style={{ color: '#94a3b8' }}>&middot;</span>
                              <span style={{ color: '#64748b', fontWeight: 600 }}>{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</span>
                              {pending > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{pending} pend.</span>}
                              {progress > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>{progress} prog.</span>}
                              {done > 0 && <span style={{ color: '#22c55e', fontWeight: 600 }}>{done} lista{done !== 1 ? 's' : ''}</span>}
                            </div>
                          </div>
                          <ChevronRight size={15} color="#cbd5e1" />
                        </div>
                      );
                    });
                  })()
                ) : (
                  /* ── STEP 3: checklist agrupado por plan ── */
                  (() => {
                    const assetTasks = scopeTickets.filter(m => (m.entityId || m.assetId || 'sin-activo') === selectedAsset);
                    // Agrupar por workOrderId
                    const planGroups = {};
                    assetTasks.forEach(m => {
                      const key = m.workOrderId || 'direct';
                      if (!planGroups[key]) planGroups[key] = [];
                      planGroups[key].push(m);
                    });

                    return Object.entries(planGroups).map(([woId, tasks]) => {
                      const completed = tasks.filter(t => t.status === 'COMPLETADO').length;
                      const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                      // Derivar nombre del plan desde la descripción o workOrderId
                      const planLabel = woId === 'direct' ? 'Tarea Directa'
                        : (() => {
                          const desc = tasks[0]?.description || '';
                          const match = desc.match(/\[Sub-tarea de: (.+?)\]/);
                          return match ? match[1] : woId;
                        })();

                      return (
                        <div key={woId} style={{ marginBottom: '6px' }}>
                          {/* Plan header */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', marginBottom: '6px',
                            background: `${accentColor}08`, borderRadius: '8px',
                            borderLeft: `3px solid ${accentColor}`,
                          }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {planLabel}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                                {completed}/{tasks.length} completada{tasks.length !== 1 ? 's' : ''} · {pct}%
                              </div>
                            </div>
                            {/* Mini progress bar */}
                            <div style={{ width: '50px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, marginLeft: '10px' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#22c55e' : accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
                            </div>
                          </div>

                          {/* Task checklist */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {tasks.map(m => {
                              const isDone = m.status === 'COMPLETADO';
                              return (
                                <div key={m.id} style={{
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                  padding: '8px 12px', borderRadius: '8px',
                                  background: isDone ? 'rgba(34,197,94,0.05)' : '#fff',
                                  border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : '#f1f5f9'}`,
                                  transition: 'all 0.15s',
                                }}>
                                  {/* Checkbox */}
                                  <div
                                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(m); }}
                                    style={{
                                      width: '20px', height: '20px', borderRadius: '5px',
                                      border: `2px solid ${isDone ? '#22c55e' : '#cbd5e1'}`,
                                      background: isDone ? '#22c55e' : 'transparent',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                                    }}
                                    title={isDone ? 'Marcar pendiente' : 'Marcar completado'}
                                  >
                                    {isDone && <Check size={12} color="#fff" strokeWidth={3} />}
                                  </div>
                                  {/* Title + status */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: '0.84rem', fontWeight: 600, color: '#0f172a',
                                      textDecoration: isDone ? 'line-through' : 'none',
                                      opacity: isDone ? 0.6 : 1,
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>{m.title}</div>
                                  </div>
                                  <span style={{
                                    background: statusBg(m.status), color: statusColor(m.status),
                                    padding: '2px 6px', borderRadius: '4px',
                                    fontSize: '0.62rem', fontWeight: 700, flexShrink: 0,
                                  }}>{m.status || 'PENDIENTE'}</span>
                                  {/* Link to details */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/maintenances/view/${m.id}`); }}
                                    style={{
                                      background: 'transparent', border: 'none', cursor: 'pointer',
                                      color: '#94a3b8', padding: '2px', flexShrink: 0,
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
                    });
                  })()
                )}
              </div>

              {/* ── Footer (always visible) ── */}
              <div style={{
                padding: '12px 18px', flexShrink: 0,
                borderTop: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'flex-end',
              }}>
                <button onClick={closeModal} style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '7px 18px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
                }}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CalendarSchedule;
