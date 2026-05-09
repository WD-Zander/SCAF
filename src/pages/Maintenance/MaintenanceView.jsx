import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, Box, User, Activity, CheckCircle, FileText, Clock, CalendarClock, MapPin } from 'lucide-react';
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
    </div>
  );
};

export default MaintenanceView;
