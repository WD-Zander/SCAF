import React, { useState, useEffect } from 'react';
import { DollarSign, Box, Wrench, AlertTriangle, TrendingDown, CalendarClock, Clock, CheckCircle, Activity } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';

const StatCard = ({ title, value, icon, colorClass, subtitle }) => (
  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div className="flex-between">
      <h3 className="text-muted" style={{ fontSize: '0.9rem', fontWeight: '600' }}>{title}</h3>
      <div className={colorClass} style={{ padding: '8px', borderRadius: '8px', background: 'var(--glass-border)' }}>
        {icon}
      </div>
    </div>
    <div>
      <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</p>
      {subtitle && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>{subtitle}</p>}
    </div>
  </div>
);

const actionColors = {
  POST: 'var(--success)',
  PUT: 'var(--warning)',
  DELETE: 'var(--danger)',
  RESET: 'var(--danger)',
};

const actionLabels = {
  POST: 'Creado',
  PUT: 'Modificado',
  DELETE: 'Eliminado',
  RESET: 'Reset',
};

const Dashboard = () => {
  const { tenantName } = useAppContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard')
      .then(res => res?.json())
      .then(data => { if (data) setStats(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (val) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val ?? 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatRelative = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)} días`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Activity size={32} className="text-accent" style={{ animation: 'pulse 1.5s infinite' }} />
        <p className="text-muted">Cargando estadísticas...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <AlertTriangle size={32} className="text-warning" />
        <p className="text-muted">No se pudieron cargar los datos del dashboard. Verifica la conexión con el servidor.</p>
      </div>
    );
  }

  const { kpis, assetsByStatus, upcomingMaintenances, recentActivity } = stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      <div className="flex-between">
        <div>
          <h1 style={{ marginBottom: '8px' }}>Dashboard Ejecutivo</h1>
          <p className="text-muted">Resumen en tiempo real del estado y valor de los activos — {tenantName}.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="dashboard-grid">
        <StatCard
          title="Valor de Adquisición Total"
          value={formatMoney(kpis.totalAcquisitionValue)}
          icon={<DollarSign size={24} />}
          colorClass="text-success"
        />
        <StatCard
          title="Valor Neto Estimado (Actual)"
          value={formatMoney(kpis.totalCurrentValue)}
          icon={<TrendingDown size={24} />}
          colorClass="text-warning"
          subtitle={`Depreciación acumulada: ${formatMoney(kpis.totalDepreciation)}`}
        />
        <StatCard
          title="Total Activos Registrados"
          value={kpis.totalAssets}
          icon={<Box size={24} />}
          colorClass="text-info"
          subtitle={`${kpis.assetsInMaintenance} activos en mantenimiento activo`}
        />
        <StatCard
          title="Órdenes de Trabajo Activas"
          value={kpis.activeWorkOrders}
          icon={<Wrench size={24} />}
          colorClass="text-danger"
          subtitle={kpis.overdueMaintenances > 0 ? `⚠️ ${kpis.overdueMaintenances} mantenimientos vencidos` : 'Sin vencimientos pendientes'}
        />
      </div>

      {/* Activos por estado */}
      {assetsByStatus.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} className="text-success" /> Activos por Estado
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {assetsByStatus.map(s => (
              <div key={s.status} style={{
                background: 'rgba(15,23,42,0.4)', border: '1px solid var(--glass-border)',
                padding: '12px 20px', borderRadius: '8px', textAlign: 'center', minWidth: '100px'
              }}>
                <p style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{s.count}</p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>{s.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid-2">

        {/* Próximos mantenimientos */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle className="text-warning" size={20} />
              Mantenimientos Próximos (15 días)
            </h3>
            <span className="badge warning">{upcomingMaintenances.length}</span>
          </div>

          {upcomingMaintenances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle size={32} className="text-success" style={{ margin: '0 auto 8px', display: 'block' }} />
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Sin mantenimientos urgentes los próximos 15 días</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingMaintenances.map(item => (
                <div key={item.id} style={{
                  background: 'rgba(15,23,42,0.4)', border: '1px solid var(--glass-border)',
                  padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.assetName}</h4>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>{item.title}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-danger" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarClock size={13} /> {formatDate(item.dueDate)}
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.75rem' }}>{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad reciente desde auditoría */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Actividad Reciente</h3>
          {recentActivity.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>Sin actividad registrada aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {recentActivity.map((log, idx) => (
                <div key={idx} style={{
                  borderLeft: `2px solid ${actionColors[log.action] || 'var(--accent-primary)'}`,
                  marginLeft: '10px', paddingLeft: '16px', position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute', left: '-6px', top: '0',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: actionColors[log.action] || 'var(--accent-primary)'
                  }} />
                  <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {actionLabels[log.action] || log.action} — {log.entity}
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>{log.description}</p>
                  <p className="text-muted" style={{ fontSize: '0.74rem', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> {formatRelative(log.timestamp)} · {log.userName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
