import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, Edit2, Trash2, Wrench, ArrowUpDown, Plus, Activity,
  ChevronLeft, ChevronRight, Calendar, User, ExternalLink,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Button, Badge, Card, Field } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';
import ConfirmModal from '../../components/Common/ConfirmModal';

const SCOPE_LABELS = {
  area: 'Mantenimientos de Área',
  habitacion: 'Mantenimiento de Habitaciones',
  activo: 'Mantenimiento de Activos',
};

const ITEMS_PER_PAGE = 20;

const MaintenanceList = () => {
  const { maintenances, setMaintenances, removeMaintenance, updateMaintenance, assets, hasPermission, maintenanceScopes } = useAppContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { scope } = useParams();
  const scopeMeta = maintenanceScopes.find(s => s.slug === scope);
  const scopeLabel = scopeMeta?.nombre || SCOPE_LABELS[scope] || 'Mantenimientos';
  const scopeColor = scopeMeta?.color || 'var(--accent-primary)';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null });
  const [expandedId, setExpandedId] = useState(null);

  const getAssetDetails = (assetId) => assets.find(a => a.id === assetId) || { name: 'Activo no encontrado', serial: '' };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const statusTone = (status) => {
    if (status === 'COMPLETADO') return 'success';
    if (status === 'EN PROGRESO') return 'warning';
    if (status === 'PENDIENTE') return 'danger';
    return 'neutral';
  };

  const handleStatusChange = async (item, newStatus) => {
    try { await updateMaintenance({ ...item, status: newStatus }); } catch (e) { console.error(e); }
  };

  const sorted = useMemo(() => {
    let filtered = maintenances.filter(m => {
      if (scope && m.scope !== scope) return false;
      const asset = getAssetDetails(m.assetId);
      const s = searchTerm.toLowerCase();
      const searchMatch = !s || [m.id, m.assetId, asset.name, asset.serial, m.type, m.status, m.provider, m.assignedTo, m.title]
        .some(v => (v || '').toLowerCase().includes(s));
      const statusMatch = statusFilter === 'TODOS' || m.status === statusFilter;
      return searchMatch && statusMatch;
    });
    filtered.sort((a, b) => {
      let aVal = sortConfig.key === 'assetName' ? getAssetDetails(a.assetId).name : a[sortConfig.key];
      let bVal = sortConfig.key === 'assetName' ? getAssetDetails(b.assetId).name : b[sortConfig.key];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [maintenances, searchTerm, statusFilter, sortConfig, assets, scope]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const confirmDelete = () => {
    if (confirmModal.idToDelete) removeMaintenance(confirmModal.idToDelete);
    setConfirmModal({ isOpen: false, idToDelete: null });
  };

  // Stats
  const counts = useMemo(() => {
    const c = { PENDIENTE: 0, 'EN PROGRESO': 0, COMPLETADO: 0, total: sorted.length };
    sorted.forEach(m => { if (c[m.status] !== undefined) c[m.status]++; });
    return c;
  }, [sorted]);

  const getPageNumbers = () => {
    const delta = 3;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) range.push(i);
    return range;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6, color: scopeColor }}>{scope ? `Módulo: ${scopeLabel}` : 'Operaciones'}</div>
          <h1 style={{ margin: 0 }}>Tickets de Mantenimiento</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--text-main)' }}>{counts.total}</strong> ticket{counts.total !== 1 ? 's' : ''} registrado{counts.total !== 1 ? 's' : ''}
            {counts.PENDIENTE > 0 && <> · <strong style={{ color: 'var(--danger)' }}>{counts.PENDIENTE}</strong> pendiente{counts.PENDIENTE !== 1 ? 's' : ''}</>}
          </p>
        </div>
        {hasPermission('maintenances_create') && (
          <Button variant="primary" icon={Plus} onClick={() => navigate('/maintenances/new', { state: { scope } })}>
            {isMobile ? 'Nuevo' : 'Nuevo Mantenimiento'}
          </Button>
        )}
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { key: 'TODOS', label: 'Todos', count: counts.total },
          { key: 'PENDIENTE', label: 'Pendientes', count: counts.PENDIENTE },
          { key: 'EN PROGRESO', label: 'En Progreso', count: counts['EN PROGRESO'] },
          { key: 'COMPLETADO', label: 'Completados', count: counts.COMPLETADO },
        ].map(f => (
          <button key={f.key} onClick={() => { setStatusFilter(f.key); setCurrentPage(1); }} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600,
            border: '1px solid var(--glass-border)', cursor: 'pointer',
            background: statusFilter === f.key ? (f.key === 'TODOS' ? 'var(--accent-primary)' : 'var(--bg-tertiary)') : 'transparent',
            color: statusFilter === f.key ? (f.key === 'TODOS' ? '#fff' : 'var(--text-main)') : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>
            {f.label} <span style={{ opacity: 0.7 }}>({f.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <Card padded={false} style={{ padding: '12px 14px' }}>
        <Field
          icon={Search}
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por ticket, activo, serial, tipo..."
        />
      </Card>

      {/* Desktop table */}
      {!isMobile && (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { label: 'Ticket', key: 'id' },
                  { label: 'Activo', key: 'assetName' },
                  { label: 'Tipo', key: 'type' },
                  { label: 'Fechas', key: 'startDate' },
                  { label: 'Asignado', key: 'assignedTo' },
                  { label: 'Estado', key: 'status' },
                  { label: 'Acciones', key: null },
                ].map((h, i) => (
                  <th key={i} onClick={h.key ? () => handleSort(h.key) : undefined} style={{
                    textAlign: i === 6 ? 'center' : 'left',
                    fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', padding: '11px 14px',
                    background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)',
                    cursor: h.key ? 'pointer' : 'default',
                  }}>
                    {h.label}
                    {h.key && <ArrowUpDown size={10} style={{ display: 'inline', marginLeft: 4, opacity: 0.5 }} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 60, textAlign: 'center' }}>
                    <Wrench size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                      {searchTerm ? 'Sin resultados para esta búsqueda.' : 'No hay tickets de mantenimiento registrados.'}
                    </p>
                  </td>
                </tr>
              ) : paginated.map((item, i) => {
                const asset = getAssetDetails(item.assetId);
                return (
                  <tr key={item.id}
                    onClick={() => navigate(`/maintenances/view/${item.id}`)}
                    style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--glass-border)' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.id}</td>
                    <td style={{ padding: '11px 14px', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{asset.name}</div>
                      <div className="code-font" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                        {item.assetId} · SN: {asset.serial || 'N/A'}
                      </div>
                      {item.title && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 3 }}>{item.title}</div>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '0.84rem' }}>{item.type || '--'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span>{item.startDate || '--'}</span>
                      </div>
                      {item.endDate && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: 17 }}>→ {item.endDate}</div>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '0.84rem' }}>
                      <div>{item.assignedTo || <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}</div>
                      {item.provider && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.provider}</div>}
                    </td>
                    <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                      {(hasPermission('maintenances_status') || hasPermission('maintenances_edit')) ? (
                        <select value={item.status} onChange={e => handleStatusChange(item, e.target.value)} style={{
                          padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700,
                          border: 'none', cursor: 'pointer', outline: 'none',
                          background: statusTone(item.status) === 'success' ? 'var(--success-bg)' :
                                     statusTone(item.status) === 'warning' ? 'var(--warning-bg)' :
                                     statusTone(item.status) === 'danger' ? 'var(--danger-bg)' : 'var(--bg-tertiary)',
                          color: statusTone(item.status) === 'success' ? 'var(--success)' :
                                 statusTone(item.status) === 'warning' ? 'var(--warning)' :
                                 statusTone(item.status) === 'danger' ? 'var(--danger)' : 'var(--text-muted)',
                        }}>
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="EN PROGRESO">EN PROGRESO</option>
                          <option value="COMPLETADO">COMPLETADO</option>
                          <option value="CANCELADO">CANCELADO</option>
                        </select>
                      ) : (
                        <Badge tone={statusTone(item.status)} dot>{item.status}</Badge>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        {hasPermission('maintenances_edit') && (
                          <button onClick={() => navigate(`/maintenances/edit/${item.id}`)} title="Editar"
                            style={{ color: 'var(--text-muted)', padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}>
                            <Edit2 size={15} />
                          </button>
                        )}
                        {hasPermission('maintenances_delete') && (
                          <button onClick={() => setConfirmModal({ isOpen: true, idToDelete: item.id })} title="Eliminar"
                            style={{ color: 'var(--danger)', padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '14px 18px', borderTop: '1px solid var(--glass-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Página {currentPage} de {totalPages} ({sorted.length} tickets)
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </Button>
                {getPageNumbers().map(n => (
                  <Button key={n} variant={currentPage === n ? 'primary' : 'ghost'} style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setCurrentPage(n)}>{n}</Button>
                ))}
                <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Mobile cards */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginated.length === 0 ? (
            <Card padded={false} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Wrench size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>No hay tickets de mantenimiento.</p>
            </Card>
          ) : paginated.map(item => {
            const asset = getAssetDetails(item.assetId);
            return (
              <Card key={item.id} padded={false} style={{ padding: '14px 14px 12px', cursor: 'pointer' }}
                onClick={() => navigate(`/maintenances/view/${item.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                      {item.id} · {item.type || 'Sin tipo'}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.25 }}>{asset.name}</div>
                    {item.title && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>{item.title}</div>}
                  </div>
                  <Badge tone={statusTone(item.status)} dot>{item.status}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6, fontSize: '0.78rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Fecha · </span>{item.startDate || '--'}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Asignado · </span>{item.assignedTo || 'N/A'}</div>
                </div>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Ticket"
        message={`¿Estás seguro de eliminar el ticket ${confirmModal.idToDelete}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
      />
    </div>
  );
};

export default MaintenanceList;
