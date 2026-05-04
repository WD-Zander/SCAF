import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, Box, User, Activity, CheckCircle, FileText, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';

const MaintenanceView = () => {
  const { maintenances, assets } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const [maintenance, setMaintenance] = useState(null);
  const [assetDetails, setAssetDetails] = useState(null);
  const [ticketTasks, setTicketTasks] = useState([]);

  useEffect(() => {
    const found = maintenances.find(m => m.id === id);
    if (found) {
      setMaintenance(found);
      const _asset = assets.find(a => a.id === found.assetId);
      setAssetDetails(_asset || { name: 'Activo no encontrado', serial: 'N/A', brand: '--' });
      
      // Fetch ticket-specific tasks
      api.get(`/api/maintenances/${id}/tasks`)
        .then(res => res?.json())
        .then(data => setTicketTasks(data || []))
        .catch(err => console.error("Error fetching tasks", err));
        
    } else {
      navigate('/maintenances');
    }
  }, [id, maintenances, assets, navigate]);

  if (!maintenance || !assetDetails) return null;

  const toggleTask = async (taskId, currentState) => {
    try {
      const newState = !currentState;
      // Optimistic update
      setTicketTasks(ticketTasks.map(t => t.Id === taskId ? { ...t, IsCompleted: newState } : t));

      await api.put(`/api/maintenances/tasks/${taskId}`, { isCompleted: newState });
    } catch(err) {
      console.error(err);
      // Revert if error
      setTicketTasks(ticketTasks.map(t => t.Id === taskId ? { ...t, IsCompleted: currentState } : t));
    }
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETADO': return <span className="badge success">COMPLETADO</span>;
      case 'EN PROGRESO': return <span className="badge warning">EN PROGRESO</span>;
      case 'PENDIENTE': return <span className="badge danger" style={{ background: '#fee2e2', color: '#b91c1c' }}>PENDIENTE</span>;
      case 'CANCELADO': return <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>CANCELADO</span>;
      default: return <span className="badge info">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/maintenances')}
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
        <div>
          {getStatusBadge(maintenance.status)}
        </div>
      </div>

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
        {/* Detalles del Activo */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={18} /> Activo Intervenido
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Nombre del Equipo</span> <strong>{assetDetails.name}</strong></div>
            <div className="form-grid-2">
              <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>ID Sistema</span> <strong>{maintenance.assetId}</strong></div>
              <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Número de Serie</span> <strong>{assetDetails.serial || '--'}</strong></div>
            </div>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Descripción Reportada</span> <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>{maintenance.description || 'Sin detalles de falla/planificación.'}</p></div>
          </div>
        </div>

        {/* Fechas y Costos */}
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
              <CheckCircle size={20} className={maintenance.endDate ? "text-success" : "text-muted"} />
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
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Técnico Asignado</span> <strong>{maintenance.assignedTo || '--'}</strong></div>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Proveedor (Opcional)</span> <div className="badge info" style={{ marginTop: '4px' }}>{maintenance.provider || 'Mantenimiento Interno'}</div></div>
          </div>
        </div>
      </div>
      
      {/* Checklist Protocolo (Si existe) */}
      {ticketTasks.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} className="text-accent" /> Checklist de Protocolo
            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
              {ticketTasks.filter(t => t.IsCompleted).length} / {ticketTasks.length} Completadas
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
                {task.IsCompleted && (
                  <CheckCircle size={18} className="text-success" />
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceView;
