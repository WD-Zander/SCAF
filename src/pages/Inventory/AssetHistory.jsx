import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { api, BASE_URL } from '../../api';
import {
  ArrowLeft, Box, Tag, Wrench, MoveRight, FileText,
  Download, Clock, CheckCircle, AlertCircle, RotateCcw,
  MapPin, Users, Activity, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = (d.split('T')[0]).split('-');
  return `${day}/${m}/${y}`;
};

const fmtDatetime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_STYLES = {
  'COMPLETADO':  { bg: '#dcfce7', color: '#15803d', icon: '#22c55e', iconBg: 'rgba(34,197,94,0.15)',  label: 'Completado'  },
  'EN PROGRESO': { bg: '#fef9c3', color: '#a16207', icon: '#eab308', iconBg: 'rgba(234,179,8,0.15)',  label: 'En Progreso' },
  'PENDIENTE':   { bg: '#fee2e2', color: '#b91c1c', icon: '#ef4444', iconBg: 'rgba(239,68,68,0.15)',  label: 'Pendiente'   },
  'CANCELADO':   { bg: '#f1f5f9', color: '#64748b', icon: '#94a3b8', iconBg: 'rgba(148,163,184,0.15)', label: 'Cancelado'  },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: '#f1f5f9', color: '#475569', icon: '#94a3b8', iconBg: 'rgba(148,163,184,0.15)', label: status || '—' };

const StatusBadge = ({ status }) => {
  const s = getStatusStyle(status);
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: '6px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block' }}>
      {s.label}
    </span>
  );
};

/* ─── Timeline item wrapper ────────────────────────── */
const TimelineItem = ({ icon, iconColor, iconBg, date, title, subtitle, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '0' }}>
      {/* Línea + icono */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '36px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${iconColor}40` }}>
          {icon}
        </div>
        <div style={{ flex: 1, width: '2px', background: 'var(--glass-border)', margin: '4px 0' }} />
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, paddingBottom: '20px', minWidth: 0 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border)', borderLeft: `4px solid ${iconColor}`, gap: '12px' }}
          onClick={() => setOpen(o => !o)}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <Clock size={13} /> {date}
            </span>
            {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>
        </div>
        {open && (
          <div style={{ marginTop: '8px', padding: '16px', background: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.85rem' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Componente principal ────────────────────────── */
const AssetHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { assets, maintenances } = useAppContext();
  const printRef = useRef();

  const [asset, setAsset] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const found = assets.find(a => a.id === id);
    if (found) setAsset(found);
    else {
      api.get(`/api/assets/${id}`)
        .then(r => r?.ok ? r.json() : null)
        .then(d => { if (d) setAsset(d); })
        .catch(() => {});
    }
  }, [id, assets]);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/movements/asset/${id}`)
      .then(r => r?.ok ? r.json() : [])
      .then(d => setMovements(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const assetMaintenances = maintenances.filter(m => m.assetId === id);

  // Combinar y ordenar cronológicamente
  const timelineItems = [
    ...assetMaintenances.map(m => ({
      type: 'maintenance',
      date: m.startDate || m.endDate || '',
      data: m,
    })),
    ...movements.map(mv => ({
      type: 'movement',
      date: mv.changedAt || '',
      data: mv,
    })),
  ].sort((a, b) => {
    const da = new Date(a.date || 0);
    const db = new Date(b.date || 0);
    return db - da; // más reciente primero
  });

  const completedMnts = assetMaintenances.filter(m => m.status === 'COMPLETADO').length;
  const pendingMnts   = assetMaintenances.filter(m => m.status === 'PENDIENTE').length;

  const handlePrint = () => {
    const inProgress = assetMaintenances.filter(m => m.status === 'EN PROGRESO').length;
    const canceledMnts = assetMaintenances.filter(m => m.status === 'CANCELADO').length;

    const statusLabel = (s) => ({ COMPLETADO: 'Completado', PENDIENTE: 'Pendiente', 'EN PROGRESO': 'En Progreso', CANCELADO: 'Cancelado' }[s] || s || '—');
    const statusColor = (s) => ({ COMPLETADO: '#15803d', PENDIENTE: '#b91c1c', 'EN PROGRESO': '#a16207', CANCELADO: '#64748b' }[s] || '#475569');
    const statusBg    = (s) => ({ COMPLETADO: '#dcfce7', PENDIENTE: '#fee2e2', 'EN PROGRESO': '#fef9c3', CANCELADO: '#f1f5f9' }[s] || '#f8fafc');

    const mntsRows = [...assetMaintenances]
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
      .map((m, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:8px 12px;font-family:monospace;font-size:0.78rem;color:#2563eb;white-space:nowrap">${m.id}</td>
          <td style="padding:8px 12px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.title || '—'}</td>
          <td style="padding:8px 12px;white-space:nowrap">${m.type || '—'}</td>
          <td style="padding:8px 12px">
            <span style="background:${statusBg(m.status)};color:${statusColor(m.status)};border-radius:5px;padding:2px 8px;font-size:0.75rem;font-weight:700">${statusLabel(m.status)}</span>
          </td>
          <td style="padding:8px 12px;white-space:nowrap">${m.assignedTo || '—'}</td>
          <td style="padding:8px 12px;white-space:nowrap">${fmtDate(m.startDate)}</td>
          <td style="padding:8px 12px;white-space:nowrap">${fmtDate(m.endDate)}</td>
          <td style="padding:8px 12px;font-size:0.8rem;max-width:200px">${m.description ? m.description.substring(0, 80) + (m.description.length > 80 ? '…' : '') : '—'}</td>
        </tr>`).join('');

    const movRows = [...movements]
      .sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0))
      .map((mv, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:8px 12px;white-space:nowrap;font-size:0.8rem">${fmtDatetime(mv.changedAt)}</td>
          <td style="padding:8px 12px">${mv.motivoNombre || '—'}</td>
          <td style="padding:8px 12px">${mv.locationFrom || '—'} → ${mv.locationTo || '—'}</td>
          <td style="padding:8px 12px">${mv.deptFrom || '—'} → ${mv.deptTo || '—'}</td>
          <td style="padding:8px 12px">${mv.statusTo || mv.statusFrom || '—'}</td>
          <td style="padding:8px 12px;white-space:nowrap">${mv.changedBy || '—'}</td>
          <td style="padding:8px 12px;max-width:160px;font-size:0.8rem">${mv.observation || '—'}</td>
        </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Historial ${asset.id} — ${asset.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.5; }
    @page { margin: 18mm 15mm; size: A4; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px solid #2563eb; margin-bottom: 20px; }
    .header-title { font-size: 22px; font-weight: 800; color: #1e40af; }
    .header-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
    .header-logo { font-size: 11px; color: #64748b; text-align: right; }

    /* Ficha */
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 18px; }
    .card-title { font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .field-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
    .field-value { font-weight: 600; font-size: 12px; }

    /* Stats */
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 18px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-num { font-size: 24px; font-weight: 800; }
    .stat-label { font-size: 10px; color: #64748b; margin-top: 3px; }

    /* Tabla */
    h3 { font-size: 13px; font-weight: 700; color: #1e293b; margin: 20px 0 10px; display: flex; align-items: center; gap: 6px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 8px; }
    thead tr { background: #1e40af; color: #fff; }
    thead th { padding: 9px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }

    /* Badges */
    .badge { border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; display: inline-block; }
    .badge-green  { background: #dcfce7; color: #15803d; }
    .badge-red    { background: #fee2e2; color: #b91c1c; }
    .badge-yellow { background: #fef9c3; color: #a16207; }
    .badge-gray   { background: #f1f5f9; color: #64748b; }

    /* Footer */
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }

    /* Page break */
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <div class="header-title">Historial Completo del Activo</div>
      <div class="header-sub">${asset.name} &nbsp;·&nbsp; ${asset.id}</div>
    </div>
    <div class="header-logo">
      <strong>SCAF Platform</strong><br>
      Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
      ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
    </div>
  </div>

  <!-- Ficha del activo -->
  <div class="card">
    <div class="card-title">Información del Activo</div>
    <div class="grid">
      <div><div class="field-label">Categoría</div><div class="field-value">${asset.category || '—'}</div></div>
      <div><div class="field-label">Familia</div><div class="field-value">${asset.family || '—'}</div></div>
      <div><div class="field-label">SubFamilia</div><div class="field-value">${asset.subFamily || '—'}</div></div>
      <div><div class="field-label">Estado</div><div class="field-value"><span class="badge ${asset.status === 'ACTIVO' || asset.status === 'EN USO' ? 'badge-green' : 'badge-gray'}">${asset.status || '—'}</span></div></div>
      <div><div class="field-label">Marca / Modelo</div><div class="field-value">${asset.brand || '—'} ${asset.model || ''}</div></div>
      <div><div class="field-label">N° Serie</div><div class="field-value">${asset.serial || '—'}</div></div>
      <div><div class="field-label">Proveedor</div><div class="field-value">${asset.supplier || '—'}</div></div>
      <div><div class="field-label">Fecha Ingreso</div><div class="field-value">${fmtDate(asset.entryDate)}</div></div>
      <div><div class="field-label">Departamento</div><div class="field-value">${asset.department || '—'}</div></div>
      <div><div class="field-label">Área</div><div class="field-value">${asset.area || '—'}</div></div>
      <div><div class="field-label">Ubicación</div><div class="field-value">${asset.location || '—'}</div></div>
      <div><div class="field-label">Custodio</div><div class="field-value">${asset.assignedTo || '—'}</div></div>
      <div><div class="field-label">Costo Adquisición</div><div class="field-value">${asset.acquisitionCost ? '$ ' + asset.acquisitionCost : '—'}</div></div>
      <div><div class="field-label">Valor Actual</div><div class="field-value">${asset.currentValue ? '$ ' + asset.currentValue : '—'}</div></div>
    </div>
    ${asset.observations ? `<div style="margin-top:12px;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #e2e8f0;font-size:11.5px;color:#475569"><strong>Observaciones:</strong> ${asset.observations}</div>` : ''}
  </div>

  <!-- Resumen estadístico -->
  <div class="stats">
    <div class="stat"><div class="stat-num" style="color:#1e40af">${assetMaintenances.length}</div><div class="stat-label">Total Mantenimientos</div></div>
    <div class="stat"><div class="stat-num" style="color:#15803d">${completedMnts}</div><div class="stat-label">Completados</div></div>
    <div class="stat"><div class="stat-num" style="color:#a16207">${inProgress}</div><div class="stat-label">En Progreso</div></div>
    <div class="stat"><div class="stat-num" style="color:#b91c1c">${pendingMnts}</div><div class="stat-label">Pendientes</div></div>
    <div class="stat"><div class="stat-num" style="color:#64748b">${movements.length}</div><div class="stat-label">Movimientos</div></div>
  </div>

  <!-- Tabla de mantenimientos -->
  ${assetMaintenances.length > 0 ? `
  <h3>🔧 Historial de Mantenimientos (${assetMaintenances.length})</h3>
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Título</th><th>Tipo</th><th>Estado</th><th>Responsable</th><th>F. Inicio</th><th>F. Fin</th><th>Descripción</th>
      </tr>
    </thead>
    <tbody>${mntsRows}</tbody>
  </table>` : ''}

  <!-- Tabla de movimientos -->
  ${movements.length > 0 ? `
  <h3 ${assetMaintenances.length > 6 ? 'class="page-break"' : ''}>📦 Historial de Movimientos (${movements.length})</h3>
  <table>
    <thead>
      <tr>
        <th>Fecha</th><th>Motivo</th><th>Ubicación</th><th>Departamento</th><th>Estado</th><th>Registrado Por</th><th>Observación</th>
      </tr>
    </thead>
    <tbody>${movRows}</tbody>
  </table>` : ''}

  <div class="footer">
    <span>SCAF Platform — Documento Confidencial</span>
    <span>Activo: ${asset.id} — ${asset.name}</span>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=700');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  if (loading || !asset) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Cargando historial...</div>
      </div>
    );
  }

  const photoUrl = asset.photoUrl ? (asset.photoUrl.startsWith('http') ? asset.photoUrl : `${BASE_URL}${asset.photoUrl}`) : null;

  return (
    <>

      <div className="animate-fade-in" style={{ paddingBottom: '60px' }} id="asset-history-print" ref={printRef}>

        {/* Header */}
        <div className="flex-between no-print" style={{ marginBottom: '24px' }}>
          <button className="btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={18} /> Volver
          </button>
          <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Exportar PDF
          </button>
        </div>

        {/* ── Ficha del activo ── */}
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
          {/* Título de impresión */}
          <div style={{ display: 'none', marginBottom: '16px', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '12px' }} className="print-only">
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>Historial Completo del Activo</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            {photoUrl ? (
              <img src={photoUrl} alt={asset.name} style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--glass-border)' }} />
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                <Box size={36} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: '1.4rem', margin: '0 0 6px' }}>{asset.name}</h1>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Tag size={14} /> <strong style={{ color: 'var(--text-main)' }}>{asset.id}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Tag size={14} /> {asset.brand} — {asset.model}</span>
                {asset.serial && <span>SN: {asset.serial}</span>}
              </div>
            </div>
          </div>

          {/* Grid de datos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
            <DataField label="Categoría" value={asset.category} />
            <DataField label="Familia" value={asset.family} />
            <DataField label="SubFamilia" value={asset.subFamily} />
            <DataField label="Estado" value={<StatusBadge status={asset.status} />} />
            <DataField label="Departamento" value={asset.department} />
            <DataField label="Área" value={asset.area} />
            <DataField label="Ubicación" value={asset.location} />
            <DataField label="Custodio" value={asset.assignedTo} />
            <DataField label="Proveedor" value={asset.supplier} />
            <DataField label="Fecha Ingreso" value={fmtDate(asset.entryDate)} />
            <DataField label="Costo Adquisición" value={asset.acquisitionCost ? `$ ${asset.acquisitionCost}` : null} />
            <DataField label="Valor Actual" value={asset.currentValue ? `$ ${asset.currentValue}` : null} />
          </div>
        </div>

        {/* ── Resumen estadístico ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard icon={<Wrench size={20} color="#3b82f6" />} bg="rgba(59,130,246,0.08)" label="Total Mantenimientos" value={assetMaintenances.length} />
          <StatCard icon={<CheckCircle size={20} color="#22c55e" />} bg="rgba(34,197,94,0.08)" label="Completados" value={completedMnts} />
          <StatCard icon={<AlertCircle size={20} color="#ef4444" />} bg="rgba(239,68,68,0.08)" label="Pendientes" value={pendingMnts} />
          <StatCard icon={<MoveRight size={20} color="#8b5cf6" />} bg="rgba(139,92,246,0.08)" label="Movimientos" value={movements.length} />
        </div>

        {/* ── Historial cronológico ── */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent-primary)" /> Historial Cronológico
          <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px' }}>
            ({timelineItems.length} eventos — más reciente primero)
          </span>
        </h2>

        {timelineItems.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay mantenimientos ni movimientos registrados para este activo.
          </div>
        ) : (
          <div>
            {timelineItems.map((item, idx) => {
              if (item.type === 'maintenance') {
                const m = item.data;
                const ss = getStatusStyle(m.status);
                return (
                  <TimelineItem
                    key={`mnt-${m.id}-${idx}`}
                    icon={<Wrench size={16} color={ss.icon} />}
                    iconColor={ss.icon}
                    iconBg={ss.iconBg}
                    date={fmtDate(m.startDate)}
                    title={m.title || m.id}
                    subtitle={`${m.type || 'Mantenimiento'} · ${m.id}`}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <DataField label="ID" value={m.id} mono />
                      <DataField label="Tipo" value={m.type} />
                      <DataField label="Estado" value={<StatusBadge status={m.status} />} />
                      <DataField label="Responsable" value={m.assignedTo} />
                      <DataField label="Proveedor" value={m.provider} />
                      <DataField label="Fecha Inicio" value={fmtDate(m.startDate)} />
                      <DataField label="Fecha Fin" value={fmtDate(m.endDate)} />
                      {m.workOrderId && <DataField label="Orden de Trabajo" value={m.workOrderId} mono />}
                    </div>
                    {m.description && (
                      <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {m.description}
                      </div>
                    )}
                    <div className="no-print" style={{ marginTop: '10px' }}>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => navigate(`/maintenances/view/${m.id}`)}
                      >
                        <FileText size={13} /> Ver detalle completo
                      </button>
                    </div>
                  </TimelineItem>
                );
              }

              // Movimiento
              const mv = item.data;
              const hasChanges = mv.locationFrom || mv.locationTo || mv.deptFrom || mv.deptTo || mv.areaFrom || mv.areaTo || mv.statusFrom || mv.statusTo;
              return (
                <TimelineItem
                  key={`mov-${mv.id || idx}-${idx}`}
                  icon={<MoveRight size={16} color="#8b5cf6" />}
                  iconColor="#8b5cf6"
                  iconBg="rgba(139,92,246,0.12)"
                  date={fmtDatetime(mv.changedAt)}
                  title="Movimiento de activo"
                  subtitle={`Registrado por: ${mv.changedBy || '—'}`}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: mv.observation ? '12px' : '0' }}>
                    {mv.locationFrom !== mv.locationTo && (mv.locationFrom || mv.locationTo) && (
                      <ChangeField label="Ubicación" from={mv.locationFrom} to={mv.locationTo} />
                    )}
                    {mv.deptFrom !== mv.deptTo && (mv.deptFrom || mv.deptTo) && (
                      <ChangeField label="Departamento" from={mv.deptFrom} to={mv.deptTo} />
                    )}
                    {mv.areaFrom !== mv.areaTo && (mv.areaFrom || mv.areaTo) && (
                      <ChangeField label="Área" from={mv.areaFrom} to={mv.areaTo} />
                    )}
                    {mv.statusFrom !== mv.statusTo && (mv.statusFrom || mv.statusTo) && (
                      <ChangeField label="Estado" from={mv.statusFrom} to={mv.statusTo} />
                    )}
                    {!hasChanges && (
                      <DataField label="Fecha" value={fmtDatetime(mv.changedAt)} />
                    )}
                    <DataField label="Registrado por" value={mv.changedBy} />
                    <DataField label="Fecha" value={fmtDatetime(mv.changedAt)} />
                  </div>
                  {mv.observation && (
                    <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      <strong>Observación:</strong> {mv.observation}
                    </div>
                  )}
                </TimelineItem>
              );
            })}

            {/* Último nodo — registro del activo */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '36px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(34,197,94,0.2)', flexShrink: 0 }}>
                  <Calendar size={16} color="#22c55e" />
                </div>
              </div>
              <div style={{ flex: 1, paddingBottom: '8px' }}>
                <div style={{ padding: '10px 16px', background: 'rgba(34,197,94,0.06)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#15803d' }}>Activo registrado en el sistema</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{fmtDate(asset.entryDate)} · {asset.loadedBy || 'Usuario del sistema'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Secciones detalladas para impresión ── */}
        {/* Tabla de mantenimientos (compacta) */}
        {assetMaintenances.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <Wrench size={18} color="#3b82f6" /> Mantenimientos ({assetMaintenances.length})
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {['ID', 'Título', 'Tipo', 'Estado', 'Responsable', 'F. Inicio', 'F. Fin'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...assetMaintenances].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')).map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--bg-secondary)' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>{m.id}</td>
                      <td style={{ padding: '8px 12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{m.type || '—'}</td>
                      <td style={{ padding: '8px 12px' }}><StatusBadge status={m.status} /></td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{m.assignedTo || '—'}</td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{fmtDate(m.startDate)}</td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{fmtDate(m.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabla de movimientos */}
        {movements.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <MoveRight size={18} color="#8b5cf6" /> Movimientos ({movements.length})
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {['Fecha', 'Motivo', 'Ubicación Ant.', 'Ubicación Nueva', 'Depto Ant.', 'Depto Nuevo', 'Estado', 'Registrado Por', 'Observación'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...movements].sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0)).map((mv, i) => (
                    <tr key={mv.id || i} style={{ background: i % 2 === 0 ? '#fff' : 'var(--bg-secondary)' }}>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{fmtDatetime(mv.changedAt)}</td>
                      <td style={{ padding: '8px 12px' }}>{mv.motivoNombre || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{mv.locationFrom || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{mv.locationTo || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{mv.deptFrom || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{mv.deptTo || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{mv.statusTo || mv.statusFrom || '—'}</td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{mv.changedBy || '—'}</td>
                      <td style={{ padding: '8px 12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mv.observation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer de impresión */}
        <div style={{ display: 'none', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }} className="print-only">
          SCAF Platform — Historial de activo {asset.id} — Confidencial
        </div>
      </div>
    </>
  );
};

/* ─── Helpers de presentación ─────────────────────── */
const DataField = ({ label, value, mono = false }) => (
  <div>
    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '—'}</div>
  </div>
);

const ChangeField = ({ label, from, to }) => (
  <div style={{ gridColumn: '1 / -1' }}>
    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
      <span style={{ padding: '2px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontWeight: 600 }}>{from || '—'}</span>
      <MoveRight size={14} color="var(--text-muted)" />
      <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#15803d', borderRadius: '4px', fontWeight: 600 }}>{to || '—'}</span>
    </div>
  </div>
);

const StatCard = ({ icon, bg, label, value }) => (
  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    </div>
  </div>
);

export default AssetHistory;
