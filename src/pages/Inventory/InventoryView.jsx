import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Box, QrCode, Tag, Wrench, PackageOpen, MoveRight, Plus, FileText, X, Download } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api, BASE_URL } from '../../api';

const InventoryView = () => {
  const { assets, maintenances } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [movements, setMovements] = useState([]);
  const [lightbox, setLightbox] = useState(null); // 'photo' | 'pdf' | null

  useEffect(() => {
    if (!id) return;
    
    const fetchAsset = async () => {
      const found = assets.find(a => a.id === id);
      if (found) {
        setAsset(found);
        return;
      }
      
      try {
        const res = await api.get(`/api/assets/${id}`);
        if (res?.ok) {
          const data = await res.json();
          setAsset(data);
        } else {
          navigate('/inventory');
        }
      } catch (err) {
        console.error('Error fetching asset:', err);
        navigate('/inventory');
      }
    };
    
    fetchAsset();
  }, [id, assets, navigate]);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/movements/asset/${id}`)
      .then(res => res?.ok ? res.json() : [])
      .then(data => setMovements(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [id]);

  const assetMaintenances = maintenances.filter(m => m.assetId === id);

  if (!asset) return null;

  const photoUrl = asset.photoUrl ? (asset.photoUrl.startsWith('http') ? asset.photoUrl : `${BASE_URL}${asset.photoUrl}`) : null;
  const invoiceUrl = asset.invoiceUrl ? (asset.invoiceUrl.startsWith('http') ? asset.invoiceUrl : `${BASE_URL}${asset.invoiceUrl}`) : null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETADO': return <span className="badge success">COMPLETADO</span>;
      case 'EN PROGRESO': return <span className="badge warning">EN PROGRESO</span>;
      case 'PENDIENTE': return <span className="badge danger" style={{ background: '#fee2e2', color: '#b91c1c' }}>PENDIENTE</span>;
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
            onClick={() => navigate('/inventory')}
            style={{ padding: '8px', borderRadius: '50%' }}
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Ficha del Activo: {asset.id}</h1>
            <p className="text-muted">Perfil de sólo lectura para visualización rápida.</p>
          </div>
        </div>
      </div>

      {/* Main Profile Info */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={asset.name}
              title="Clic para ampliar"
              style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--glass-border)', cursor: 'zoom-in' }}
              onClick={() => setLightbox('photo')}
            />
          ) : (
            <div style={{
              width: '80px', height: '80px', borderRadius: '16px',
              background: 'var(--bg-tertiary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
            }}>
              <Box size={40} />
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{asset.name}</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={16} /> {asset.brand} - {asset.model}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><QrCode size={16} /> SN: {asset.serial || 'N/A'}</span>
            </div>
            {asset.description && (
              <p style={{ marginTop: '16px', color: 'var(--text-main)', opacity: 0.8 }}>{asset.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="dashboard-grid-2">
        {/* Card: Especificaciones */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Especificaciones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Categoría Principal</span> <strong>{asset.category || '--'}</strong></div>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Familia y Subfamilia</span> <strong>{asset.family || '--'} / {asset.subFamily || '--'}</strong></div>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Responsable de Carga Física</span> <strong>{asset.loadedBy || '--'}</strong></div>
          </div>
        </div>

        {/* Card: Adquisición y Finanzas */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Adquisición Financiera</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Proveedor Oficial</span> <strong>{asset.supplier || '--'}</strong></div>
            <div style={{ display: 'flex', gap: '32px' }}>
                <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Fecha de Ingreso</span> <strong>{asset.entryDate || '--'}</strong></div>
                <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Costo de Compra</span> <strong>$ {asset.acquisitionCost || '0.00'}</strong></div>
                <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Valor Actual (Libros)</span> <strong style={{ color: 'var(--success)'}}>$ {asset.currentValue || asset.acquisitionCost || '0.00'}</strong></div>
            </div>
            {invoiceUrl && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setLightbox('pdf')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(37,99,235,0.06)', border: '1px solid var(--accent-light)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                  <FileText size={16} /> Ver Factura de Compra (PDF)
                </button>
                <a href={invoiceUrl} download style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  <Download size={14} /> Descargar
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Card: Ubicación y Estado */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Estado y Ubicación</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Estado Operativo</span> {getStatusBadge(asset.status)}</div>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Departamento y Área</span> <strong>{asset.department || '--'} / {asset.area || '--'}</strong></div>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Ubicación Asignada</span> <strong>{asset.location || '--'}</strong></div>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Custodio a Cargo</span> <strong>{asset.assignedTo || 'Sin asignar'}</strong></div>
          </div>
        </div>

        {/* Card: Observaciones */}
        {asset.observations && (
          <div className="glass-panel" style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Observaciones Técnicas</h3>
            <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem' }}>{asset.observations}</p>
          </div>
        )}
      </div>

      {/* Historial de Movimientos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '40px', marginBottom: '16px' }}>
        <div className="form-section-title" style={{ margin: 0 }}>
          <PackageOpen size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }} /> Historial de Movimientos
        </div>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }} onClick={() => navigate(`/movements/new?assetId=${asset.id}`)}>
          <Plus size={15} /> Registrar Movimiento
        </button>
      </div>
      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '32px' }}>
        {movements.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sin movimientos registrados para este activo.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="movements-history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(37,99,235,0.05)' }}>
                  {['UBICACIÓN', 'DEPARTAMENTO', 'ÁREA', 'ESTADO', 'OBSERVACIÓN', 'REGISTRADO POR', 'FECHA'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.map(mv => (
                  <tr key={mv.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {mv.locationFrom !== mv.locationTo ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.83rem' }}>
                          <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{mv.locationFrom || '—'}</span>
                          <MoveRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{mv.locationTo || '—'}</span>
                        </span>
                      ) : <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{mv.locationTo || '—'}</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {mv.deptFrom !== mv.deptTo ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.83rem' }}>
                          <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{mv.deptFrom || '—'}</span>
                          <MoveRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{mv.deptTo || '—'}</span>
                        </span>
                      ) : <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{mv.deptTo || '—'}</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {mv.areaFrom !== mv.areaTo ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.83rem' }}>
                          <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{mv.areaFrom || '—'}</span>
                          <MoveRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{mv.areaTo || '—'}</span>
                        </span>
                      ) : <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{mv.areaTo || '—'}</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {mv.statusFrom !== mv.statusTo ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.83rem' }}>
                          <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{mv.statusFrom || '—'}</span>
                          <MoveRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{mv.statusTo || '—'}</span>
                        </span>
                      ) : <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{mv.statusTo || '—'}</span>}
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                      <span style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid var(--accent-light)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', lineHeight: '1.4', display: 'inline-block' }}>
                        {mv.observation}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.83rem' }}>{mv.changedBy || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {mv.changedAt ? mv.changedAt.replace('T', ' ').substring(0, 16) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial Médico del Activo (Mantenimientos) */}
      <div className="form-section-title" style={{ marginTop: '8px' }}><Wrench size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }} /> Historial de Mantenimientos</div>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>TICKET</th>
                <th>FECHA</th>
                <th>TIPO DE SOLUCION</th>
                <th>TÉCNICO / PROVEEDOR</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {assetMaintenances.length > 0 ? (
                assetMaintenances.map(m => (
                  <tr key={m.id} className="clickable-row mobile-list-format" onClick={() => navigate(`/maintenances/edit/${m.id}`)}>
                    <td data-label="TICKET" className="code-font">{m.id}</td>
                    <td data-label="FECHA"><strong>{m.startDate}</strong></td>
                    <td data-label="TIPO">
                      <strong>{m.title}</strong>
                      <p className="text-muted" style={{ fontSize: '0.8rem' }}>{m.type}</p>
                    </td>
                    <td data-label="TÉCNICO">
                      {m.assignedTo}
                      {m.provider !== 'Interno' && <p className="text-muted" style={{ fontSize: '0.75rem' }}>{m.provider}</p>}
                    </td>
                    <td data-label="ESTADO">{getStatusBadge(m.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="5" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>
                     No se han registrado mantenimientos para este activo.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox / PDF Modal */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Toolbar */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '960px', padding: '0 16px 12px' }}
          >
            <span style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.7 }}>
              {lightbox === 'photo' ? 'Foto del Activo' : 'Factura de Compra'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {lightbox === 'pdf' && (
                <a
                  href={invoiceUrl} download
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  <Download size={14} /> Descargar
                </a>
              )}
              <button
                onClick={() => setLightbox(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <X size={14} /> Cerrar
              </button>
            </div>
          </div>

          {/* Content */}
          {lightbox === 'photo' ? (
            <img
              src={photoUrl}
              alt={asset.name}
              onClick={e => e.stopPropagation()}
              className="pwa-lightbox-img"
              style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
            />
          ) : (
            <embed
              src={invoiceUrl}
              type="application/pdf"
              onClick={e => e.stopPropagation()}
              className="pwa-lightbox-pdf"
              style={{ width: '90vw', maxWidth: '960px', height: '80vh', borderRadius: '8px', border: 'none' }}
            />
          )}
        </div>
      )}

    </div>
  );
};

export default InventoryView;
