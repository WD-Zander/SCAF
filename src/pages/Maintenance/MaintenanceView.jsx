import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, Box, User, Activity, CheckCircle, Check, FileText, Clock, CalendarClock, MapPin, ExternalLink, XCircle, RefreshCw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';

const MaintenanceView = () => {
  const { maintenances, assets, updateMaintenance, hasPermission, currentUser } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const [maintenance, setMaintenance] = useState(null);
  const [assetDetails, setAssetDetails] = useState(null);
  const [ticketTasks, setTicketTasks] = useState([]);

  // Estado inline
  const [savingStatus, setSavingStatus] = useState(false);

  // Panel de reprogramación
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [savingReschedule, setSavingReschedule] = useState(false);

  // Acciones masivas para tareas del plan
  const [bulkAction, setBulkAction] = useState(null); // 'reschedule' | 'cancel' | null
  const [bulkRescheduleDate, setBulkRescheduleDate] = useState('');
  const [bulkRescheduleReason, setBulkRescheduleReason] = useState('');
  const [savingBulk, setSavingBulk] = useState(false);

  useEffect(() => {
    const found = maintenances.find(m => m.id === id);
    if (found) {
      setMaintenance(found);
      const _asset = assets.find(a => a.id === found.assetId);
      setAssetDetails(_asset || { name: 'Activo no encontrado', serial: 'N/A', brand: '--' });

      api.get(`/api/maintenances/${id}/tasks`)
        .then(res => res?.json())
        .then(data => setTicketTasks(data || []))
        .catch(err => console.error('Error fetching tasks', err));
    } else {
      navigate('/maintenances');
    }
  }, [id, maintenances, assets, navigate]);

  // Tareas hermanas del mismo plan (workOrder) para el mismo activo y fecha
  const dayTasks = useMemo(() => {
    if (!maintenance?.workOrderId) return [];
    const dateStr = maintenance.startDate?.split('T')[0];
    const assetKey = maintenance.entityId || maintenance.assetId;
    if (!dateStr || !assetKey) return [];
    return maintenances.filter(m =>
      m.workOrderId === maintenance.workOrderId &&
      m.startDate?.startsWith(dateStr) &&
      (m.entityId || m.assetId) === assetKey
    );
  }, [maintenance, maintenances]);

  if (!maintenance || !assetDetails) return null;

  const toggleTask = async (taskId, currentState) => {
    try {
      const newState = !currentState;
      const updatedTasks = ticketTasks.map(t => t.Id === taskId ? { ...t, IsCompleted: newState } : t);
      setTicketTasks(updatedTasks);
      await api.put(`/api/maintenances/tasks/${taskId}`, { isCompleted: newState });

      // Auto-complete ticket when all tasks are done
      const allDone = updatedTasks.every(t => t.IsCompleted);
      if (allDone && maintenance.status !== 'COMPLETADO') {
        await handleStatusChange('COMPLETADO');
      }
    } catch (err) {
      console.error(err);
      setTicketTasks(ticketTasks.map(t => t.Id === taskId ? { ...t, IsCompleted: currentState } : t));
    }
  };

  const handleStatusChange = async (newStatus) => {
    setSavingStatus(true);
    const updated = { ...maintenance, status: newStatus };
    await updateMaintenance(updated);
    setMaintenance(updated);
    setSavingStatus(false);
  };

  const handleReschedule = async () => {
    if (!rescheduleForm.reason.trim()) return;
    setSavingReschedule(true);
    const updated = {
      ...maintenance,
      startDate: rescheduleForm.startDate || maintenance.startDate,
      endDate: rescheduleForm.endDate || maintenance.endDate,
      reprogramReason: rescheduleForm.reason,
      changedBy: currentUser?.name
    };
    await updateMaintenance(updated);
    setMaintenance(updated);
    setSavingReschedule(false);
    setShowReschedule(false);
    setRescheduleForm({ startDate: '', endDate: '', reason: '' });
  };

  const openReschedule = () => {
    setRescheduleForm({ startDate: maintenance.startDate || '', endDate: maintenance.endDate || '', reason: '' });
    setShowReschedule(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETADO': return 'var(--success)';
      case 'EN PROGRESO': return 'var(--warning)';
      case 'PENDIENTE': return '#b91c1c';
      case 'CANCELADO': return 'var(--text-muted)';
      default: return 'var(--accent-primary)';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'COMPLETADO': return 'var(--success-bg)';
      case 'EN PROGRESO': return 'var(--warning-bg)';
      case 'PENDIENTE': return '#fee2e2';
      case 'CANCELADO': return 'var(--bg-tertiary)';
      default: return 'var(--accent-light)';
    }
  };

  const canStatus = hasPermission('maintenances_status') || hasPermission('maintenances_edit');
  const canEdit = hasPermission('maintenances_edit');

  const handleToggleDayTask = async (task) => {
    const newStatus = task.status === 'COMPLETADO' ? 'PENDIENTE' : 'COMPLETADO';
    await updateMaintenance({ ...task, status: newStatus });
    if (task.id === maintenance.id) {
      setMaintenance(prev => ({ ...prev, status: newStatus }));
    }
  };

  const getPendingDayTasks = () => dayTasks.filter(t => t.status !== 'COMPLETADO' && t.status !== 'CANCELADO');

  const handleBulkReschedule = async () => {
    const pending = getPendingDayTasks();
    if (!bulkRescheduleDate || !bulkRescheduleReason.trim() || pending.length === 0) return;
    setSavingBulk(true);
    for (const task of pending) {
      await updateMaintenance({
        ...task,
        startDate: bulkRescheduleDate,
        endDate: bulkRescheduleDate,
        reprogramReason: bulkRescheduleReason,
        changedBy: currentUser?.name,
      });
      if (task.id === maintenance.id) {
        setMaintenance(prev => ({ ...prev, startDate: bulkRescheduleDate, endDate: bulkRescheduleDate }));
      }
    }
    setSavingBulk(false);
    setBulkAction(null);
    setBulkRescheduleDate('');
    setBulkRescheduleReason('');
  };

  const handleBulkCancel = async () => {
    const pending = getPendingDayTasks();
    if (pending.length === 0) return;
    setSavingBulk(true);
    for (const task of pending) {
      await updateMaintenance({ ...task, status: 'CANCELADO' });
      if (task.id === maintenance.id) {
        setMaintenance(prev => ({ ...prev, status: 'CANCELADO' }));
      }
    }
    setSavingBulk(false);
    setBulkAction(null);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn-secondary"
            onClick={() => navigate(-1)}
            style={{ padding: '8px', borderRadius: '50%' }}
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Orden de Trabajo: {maintenance.id}</h1>
            <p className="text-muted">Detalles de mantenimiento y asignación.</p>
          </div>
        </div>

        {/* Estado + botón Reprogramar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {canEdit && (
            <button
              className="btn-secondary"
              onClick={openReschedule}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <CalendarClock size={16} /> Reprogramar
            </button>
          )}
          {canStatus ? (
            <select
              value={maintenance.status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={savingStatus}
              style={{
                background: getStatusBg(maintenance.status),
                color: getStatusColor(maintenance.status),
                border: 'none',
                padding: '6px 20px 6px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'Outfit, sans-serif',
                opacity: savingStatus ? 0.6 : 1
              }}
            >
              <option value="PENDIENTE" style={{ background: '#fff', color: '#0f172a' }}>PENDIENTE</option>
              <option value="EN PROGRESO" style={{ background: '#fff', color: '#0f172a' }}>EN PROGRESO</option>
              <option value="COMPLETADO" style={{ background: '#fff', color: '#0f172a' }}>COMPLETADO</option>
              <option value="CANCELADO" style={{ background: '#fff', color: '#0f172a' }}>CANCELADO</option>
            </select>
          ) : (
            <span style={{
              background: getStatusBg(maintenance.status),
              color: getStatusColor(maintenance.status),
              padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700
            }}>
              {maintenance.status}
            </span>
          )}
        </div>
      </div>

      {/* Panel de Reprogramación */}
      {showReschedule && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '24px', marginBottom: '24px',
          border: '1px solid var(--warning)', background: 'rgba(234,179,8,0.03)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarClock size={18} /> Reprogramar Tarea
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Nueva Fecha de Inicio</label>
              <input
                type="date"
                className="input-control"
                value={rescheduleForm.startDate}
                onChange={e => {
                  const newStart = e.target.value;
                  setRescheduleForm(f => ({
                    ...f,
                    startDate: newStart,
                    // Si la fecha fin queda antes de la nueva fecha inicio, ajustarla
                    endDate: (f.endDate && f.endDate < newStart) ? newStart : f.endDate
                  }));
                }}
              />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Nueva Fecha de Fin</label>
              <input
                type="date"
                className="input-control"
                min={rescheduleForm.startDate || undefined}
                value={rescheduleForm.endDate}
                onChange={e => setRescheduleForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="input-group" style={{ margin: '0 0 16px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Motivo de Reprogramación *
            </label>
            <textarea
              className="input-control"
              rows={3}
              placeholder="Ej: Falta de repuestos, equipo en uso crítico, cambio de prioridad..."
              value={rescheduleForm.reason}
              onChange={e => setRescheduleForm(f => ({ ...f, reason: e.target.value }))}
              style={{ borderColor: !rescheduleForm.reason.trim() ? 'var(--danger)' : 'var(--glass-border)', margin: 0 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setShowReschedule(false)}>Cancelar</button>
            <button
              className="btn-primary"
              onClick={handleReschedule}
              disabled={savingReschedule || !rescheduleForm.reason.trim()}
            >
              {savingReschedule ? 'Guardando...' : 'Confirmar Reprogramación'}
            </button>
          </div>
        </div>
      )}

      {/* Main Info */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '16px',
            background: 'var(--bg-tertiary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
          }}>
            <Wrench size={40} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{maintenance.title}</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16} /> Tipo: {maintenance.type}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getStatusColor(maintenance.status), fontWeight: 600 }}>
                <CheckCircle size={16} /> Estado: {maintenance.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2">
        {/* Activo */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={18} /> Activo Intervenido
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Nombre del Equipo</span><strong>{assetDetails.name}</strong></div>
            <div className="form-grid-2">
              <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>ID Sistema</span><strong>{maintenance.assetId}</strong></div>
              <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Número de Serie</span><strong>{assetDetails.serial || '--'}</strong></div>
            </div>
            {(assetDetails.location || assetDetails.department) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <MapPin size={16} color="var(--accent-primary)" />
                <div>
                  <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>Ubicación</span>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {[assetDetails.location, assetDetails.department].filter(Boolean).join(' — ')}
                  </strong>
                </div>
              </div>
            )}
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Descripción Reportada</span><p style={{ fontSize: '0.9rem', marginTop: '4px' }}>{maintenance.description || 'Sin detalles de falla/planificación.'}</p></div>
          </div>
        </div>

        {/* Planificación */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} /> Planificación
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} className="text-muted" />
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Fecha de Inicio</span>
                <strong>{maintenance.startDate}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} className={maintenance.endDate ? 'text-success' : 'text-muted'} />
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Fecha de Finalización</span>
                <strong>{maintenance.endDate || 'En curso...'}</strong>
              </div>
            </div>
            {maintenance.cost && (
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span className="text-muted" style={{ fontWeight: 600 }}>Costo Total / Cotización</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>$ {maintenance.cost}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Asignación */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} /> Ejecutor / Responsable
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Técnico Asignado</span><strong>{maintenance.assignedTo || '--'}</strong></div>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Proveedor (Opcional)</span><div className="badge info" style={{ marginTop: '4px' }}>{maintenance.provider || 'Mantenimiento Interno'}</div></div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      {ticketTasks.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} className="text-accent" /> Checklist de Protocolo
            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
              {ticketTasks.filter(t => t.IsCompleted).length} / {ticketTasks.length} COMPLETADAS
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ticketTasks.map(task => (
              <label key={task.Id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: task.IsCompleted ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-tertiary)',
                borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition)',
                border: task.IsCompleted ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid transparent'
              }}>
                <input
                  type="checkbox"
                  checked={task.IsCompleted}
                  onChange={() => toggleTask(task.Id, task.IsCompleted)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
                />
                <span style={{
                  flex: 1,
                  textDecoration: task.IsCompleted ? 'line-through' : 'none',
                  color: task.IsCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                  transition: 'var(--transition)'
                }}>
                  {task.TaskDescription}
                </span>
                {task.IsCompleted && <CheckCircle size={18} className="text-success" />}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tareas del Plan para este día */}
      {dayTasks.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{
            marginBottom: '16px', borderBottom: '1px solid var(--glass-border)',
            paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Wrench size={18} className="text-accent" /> Tareas del Plan &mdash; {maintenance.startDate?.split('T')[0]}
            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
              {dayTasks.filter(t => t.status === 'COMPLETADO').length} / {dayTasks.length} COMPLETADAS
            </span>
          </h3>

          {/* Barra de progreso */}
          {(() => {
            const completed = dayTasks.filter(t => t.status === 'COMPLETADO').length;
            const pct = dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0;
            return (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: pct === 100 ? 'var(--success)' : 'var(--accent-primary)',
                    borderRadius: '3px', transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>{pct}%</div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dayTasks.map(task => {
              const isCurrent = task.id === maintenance.id;
              const isDone = task.status === 'COMPLETADO';
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: '10px',
                  background: isCurrent ? 'var(--accent-light)' : isDone ? 'rgba(34,197,94,0.05)' : 'var(--bg-tertiary)',
                  border: isCurrent ? '2px solid var(--accent-primary)' : isDone ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  {/* Checkbox */}
                  <div
                    onClick={() => handleToggleDayTask(task)}
                    style={{
                      width: '22px', height: '22px', borderRadius: '6px',
                      border: `2px solid ${isDone ? 'var(--success)' : '#cbd5e1'}`,
                      background: isDone ? 'var(--success)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                    }}
                    title={isDone ? 'Marcar pendiente' : 'Marcar completado'}
                  >
                    {isDone && <Check size={13} color="#fff" strokeWidth={3} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.88rem',
                      textDecoration: isDone ? 'line-through' : 'none',
                      opacity: isDone ? 0.6 : 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace' }}>{task.id}</span>
                      {isCurrent && <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>&larr; Actual</span>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    background: getStatusBg(task.status), color: getStatusColor(task.status),
                  }}>
                    {task.status || 'PENDIENTE'}
                  </span>

                  {/* Navigate button */}
                  {!isCurrent && (
                    <button
                      onClick={() => navigate(`/maintenances/view/${task.id}`)}
                      style={{
                        background: 'transparent', border: '1px solid var(--glass-border)',
                        borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
                        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                      }}
                      title="Ver detalles"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Acciones masivas para pendientes */}
          {(() => {
            const pending = getPendingDayTasks();
            if (pending.length === 0) return null;
            return (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '18px' }}>

                {/* Formulario de reprogramación */}
                {bulkAction === 'reschedule' && (
                  <div className="animate-fade-in" style={{
                    padding: '18px', borderRadius: '10px', marginBottom: '12px',
                    background: 'rgba(234,179,8,0.04)', border: '1px solid var(--warning)',
                  }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarClock size={16} /> Reprogramar {pending.length} tarea{pending.length !== 1 ? 's' : ''} pendiente{pending.length !== 1 ? 's' : ''}
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <div style={{ flex: '1 1 180px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Nueva Fecha *</label>
                        <input
                          type="date"
                          className="input-control"
                          value={bulkRescheduleDate}
                          onChange={e => setBulkRescheduleDate(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Motivo de Reprogramación *</label>
                      <textarea
                        className="input-control"
                        rows={2}
                        placeholder="Ej: Falta de repuestos, equipo en uso crítico..."
                        value={bulkRescheduleReason}
                        onChange={e => setBulkRescheduleReason(e.target.value)}
                        style={{ width: '100%', borderColor: !bulkRescheduleReason.trim() ? 'var(--danger)' : 'var(--glass-border)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" onClick={() => { setBulkAction(null); setBulkRescheduleDate(''); setBulkRescheduleReason(''); }} disabled={savingBulk}>
                        Cancelar
                      </button>
                      <button
                        className="btn-primary"
                        onClick={handleBulkReschedule}
                        disabled={savingBulk || !bulkRescheduleDate || !bulkRescheduleReason.trim()}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={14} /> {savingBulk ? 'Reprogramando...' : 'Confirmar Reprogramación'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmación de cancelación */}
                {bulkAction === 'cancel' && (
                  <div className="animate-fade-in" style={{
                    padding: '18px', borderRadius: '10px', marginBottom: '12px',
                    background: 'rgba(239,68,68,0.04)', border: '1px solid var(--danger)',
                  }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <XCircle size={16} /> Cancelar {pending.length} tarea{pending.length !== 1 ? 's' : ''} pendiente{pending.length !== 1 ? 's' : ''}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                      Las tareas pendientes ser&aacute;n marcadas como <strong style={{ color: 'var(--danger)' }}>CANCELADO</strong> y no se contar&aacute;n como mantenimiento realizado. Esta acci&oacute;n no se puede deshacer f&aacute;cilmente.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" onClick={() => setBulkAction(null)} disabled={savingBulk}>
                        No, Volver
                      </button>
                      <button
                        onClick={handleBulkCancel}
                        disabled={savingBulk}
                        style={{
                          background: 'var(--danger)', color: '#fff', border: 'none',
                          padding: '8px 18px', borderRadius: '8px', fontWeight: 700,
                          fontSize: '0.85rem', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', gap: '6px', opacity: savingBulk ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={14} /> {savingBulk ? 'Cancelando...' : 'Sí, Cancelar Pendientes'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                {!bulkAction && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setBulkAction('reschedule')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                    >
                      <CalendarClock size={16} /> Reprogramar Pendientes ({pending.length})
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setBulkAction('cancel')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                      <XCircle size={16} /> Cancelar Pendientes ({pending.length})
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default MaintenanceView;
