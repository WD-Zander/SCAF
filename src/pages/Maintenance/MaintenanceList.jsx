import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Wrench, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ConfirmModal from '../../components/Common/ConfirmModal';

const MaintenanceList = () => {
  const { maintenances, setMaintenances, removeMaintenance, updateMaintenance, assets, hasPermission } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null });
  const [expandedId, setExpandedId] = useState(null);

  const getAssetDetails = (assetId) => {
    return assets.find(a => a.id === assetId) || { name: 'Activo no encontrado', serial: '' };
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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

  const handleStatusChange = async (item, newStatus) => {
    try {
      await updateMaintenance({ ...item, status: newStatus });
    } catch(err) {
      console.error(err);
    }
  };

  const sortedAndFilteredMaintenances = useMemo(() => {
    let filtered = maintenances.filter(m => {
        const assetName = getAssetDetails(m.assetId).name.toLowerCase();
        const assetSerial = getAssetDetails(m.assetId).serial?.toLowerCase() || '';
        const searchLow = searchTerm.toLowerCase();
        
        const searchMatch = (
          (m.id?.toLowerCase() || '').includes(searchLow) || 
          (m.assetId?.toLowerCase() || '').includes(searchLow) ||
          assetName.includes(searchLow) ||
          assetSerial.includes(searchLow) ||
          (m.type?.toLowerCase() || '').includes(searchLow) ||
          (m.status?.toLowerCase() || '').includes(searchLow) ||
          (m.provider?.toLowerCase() || '').includes(searchLow) ||
          (m.assignedTo?.toLowerCase() || '').includes(searchLow)
        );
        
        const statusMatch = statusFilter === 'TODOS' || m.status === statusFilter;
        return searchMatch && statusMatch;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle special sorting
      if (sortConfig.key === 'assetName') {
        aVal = getAssetDetails(a.assetId).name;
        bVal = getAssetDetails(b.assetId).name;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [maintenances, searchTerm, statusFilter, sortConfig, assets]);

  // Pagination
  const totalPages = Math.ceil(sortedAndFilteredMaintenances.length / itemsPerPage);
  const paginatedMaintenances = sortedAndFilteredMaintenances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (id) => {
    setConfirmModal({ isOpen: true, idToDelete: id });
  };

  const confirmDelete = () => {
    if (confirmModal.idToDelete) {
      removeMaintenance(confirmModal.idToDelete);
    }
    setConfirmModal({ isOpen: false, idToDelete: null });
  };

  const handleRowClick = (e, id) => {
    if (window.innerWidth <= 1024) {
      setExpandedId(expandedId === id ? null : id);
    } else {
      navigate(`/maintenances/view/${id}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header Area */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Mantenimientos</h1>
          <p className="text-muted">Gestión de tareas de mantenimiento preventivo y correctivo.</p>
        </div>
        {hasPermission('maintenances_create') && (
          <button className="btn-primary" onClick={() => navigate('/maintenances/new')}>
            <Plus size={20} /> REGISTRAR TAREA
          </button>
        )}
      </div>

      {/* Main Panel */}
      <div className="glass-panel">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '250px', maxWidth: '400px', cursor: 'text' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Buscar por TKT, Serie, Activo o Filtro..." 
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            style={{ 
              padding: '10px 16px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--glass-border)',
              background: '#ffffff',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 500,
              minWidth: '180px',
              cursor: 'pointer',
              outline: 'none'
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN PROGRESO">EN PROGRESO</option>
            <option value="COMPLETADO">COMPLETADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>TICKET <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} /></th>
                <th onClick={() => handleSort('assetName')} style={{ cursor: 'pointer' }}>ACTIVO (ID) <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} /></th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>TIPO <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} /></th>
                <th onClick={() => handleSort('startDate')} style={{ cursor: 'pointer' }}>FECHAS <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} /></th>
                <th onClick={() => handleSort('assignedTo')} style={{ cursor: 'pointer' }}>ASIGNADO / PROV <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} /></th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>ESTADO <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} /></th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMaintenances.length > 0 ? (
                paginatedMaintenances.map((item) => {
                  const assetDetails = getAssetDetails(item.assetId);
                  return (
                  <tr 
                    key={item.id} 
                    className={`clickable-row mobile-list-format ${expandedId === item.id ? 'is-expanded' : ''}`} 
                    onClick={(e) => handleRowClick(e, item.id)}
                  >
                    <td data-label="TICKET" className="code-font">{item.id}</td>
                    <td data-label="ACTIVO (ID)">
                      <strong>{assetDetails.name}</strong> <span className="text-muted">({item.assetId})</span>
                      <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                        SN: {assetDetails.serial || 'N/A'}
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>{item.title}</p>
                    </td>
                    <td data-label="TIPO">{item.type}</td>
                    <td data-label="FECHAS">
                      <p>{item.startDate}</p>
                      <p className="text-muted" style={{ fontSize: '0.75rem' }}>{item.endDate ? `hasta ${item.endDate}` : 'Sin cierre'}</p>
                    </td>
                    <td data-label="ASIGNADO / PROV">
                      <p>{item.assignedTo}</p>
                      <p className="text-muted" style={{ fontSize: '0.75rem' }}>{item.provider}</p>
                    </td>
                    <td data-label="ESTADO" onClick={(e) => e.stopPropagation()}>
                      {(hasPermission('maintenances_status') || hasPermission('maintenances_edit')) ? (
                        <select 
                          value={item.status} 
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          style={{
                            background: getStatusBg(item.status),
                            color: getStatusColor(item.status),
                            border: 'none',
                            padding: '6px 20px 6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none',
                            fontFamily: 'Outfit, sans-serif'
                          }}
                        >
                          <option value="PENDIENTE" style={{ background: '#ffffff', color: '#0f172a' }}>PENDIENTE</option>
                          <option value="EN PROGRESO" style={{ background: '#ffffff', color: '#0f172a' }}>EN PROGRESO</option>
                          <option value="COMPLETADO" style={{ background: '#ffffff', color: '#0f172a' }}>COMPLETADO</option>
                          <option value="CANCELADO" style={{ background: '#ffffff', color: '#0f172a' }}>CANCELADO</option>
                        </select>
                      ) : (
                        <span style={{
                          background: getStatusBg(item.status),
                          color: getStatusColor(item.status),
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>{item.status}</span>
                      )}
                    </td>
                    <td data-label="ACCIONES" onClick={(e) => e.stopPropagation()}>
                      <div className="flex-center gap-2">
                        {hasPermission('maintenances_edit') && (
                          <button className="action-btn" onClick={() => navigate(`/maintenances/edit/${item.id}`)} title="Editar"><Edit size={16} /></button>
                        )}
                        {hasPermission('maintenances_delete') && (
                          <button className="action-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteClick(item.id)} title="Eliminar"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }} className="text-muted">
                    <Wrench size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>No hay tareas de mantenimiento registradas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Mostrando página {currentPage} de {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '6px 12px' }} 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    className={currentPage === idx + 1 ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '4px 10px', fontSize: '0.85rem' }}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button 
                className="btn-secondary" 
                style={{ padding: '6px 12px' }} 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Cancelar Mantenimiento"
        message={`¿Estás seguro de que deseas eliminar permanentemente el ticket de mantenimiento ${confirmModal.idToDelete}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
      />
    </div>
  );
};

export default MaintenanceList;
