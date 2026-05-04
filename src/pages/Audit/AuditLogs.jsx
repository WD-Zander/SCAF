import React, { useState, useEffect, useMemo } from 'react';
import { Search, Clock, Activity, ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'Timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/audit')
      .then(res => res?.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching audit logs:", err);
        setLoading(false);
      });
  }, []);

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'info';
    }
  };

  const getActionLabel = (actionType) => {
    switch (actionType) {
      case 'POST': return 'CREACIÓN';
      case 'PUT': return 'MODIFICACIÓN';
      case 'DELETE': return 'BORRADO';
      default: return actionType;
    }
  };

  const processLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      const searchLow = searchTerm.toLowerCase();
      return (log.actionType || '').toLowerCase().includes(searchLow) ||
             (log.entity || '').toLowerCase().includes(searchLow) ||
             (log.description || '').toLowerCase().includes(searchLow) ||
             (log.userName || '').toLowerCase().includes(searchLow) ||
             (log.entityId || '').toLowerCase().includes(searchLow);
    });

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      
      if (sortConfig.key === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [logs, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processLogs.length / itemsPerPage);
  const paginatedLogs = processLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity className="text-muted" /> Trazabilidad Completa
          </h1>
          <p className="text-muted">Registro inalterable de todos los movimientos y autorías del sistema.</p>
        </div>
        <div style={{ padding: '12px 24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>Registros Auditados</p>
          <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{logs.length}</strong>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '400px', cursor: 'text' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Buscar por usuario, módulo o descripción..." 
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }} 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer' }}>
                  FECHA Y HORA <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} />
                </th>
                <th onClick={() => handleSort('userName')} style={{ cursor: 'pointer' }}>
                  USUARIO/AUTOR <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} />
                </th>
                <th onClick={() => handleSort('actionType')} style={{ cursor: 'pointer' }}>
                  ACCIÓN <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} />
                </th>
                <th onClick={() => handleSort('entity')} style={{ cursor: 'pointer' }}>
                  MÓDULO AFECTADO <ArrowUpDown size={12} className="text-muted" style={{ display: 'inline' }} />
                </th>
                <th>TICKET/ID AFECTADO</th>
                <th style={{ width: '35%' }}>DESCRIPCIÓN DEL EVENTO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }} className="text-muted">
                    <p>Cargando memoria auditora...</p>
                  </td>
                </tr>
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="table-row-hover mobile-list-format" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td data-label="FECHA Y HORA" style={{ fontSize: '0.85rem' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px', opacity: 0.5 }} />
                      {formatDate(log.timestamp)}
                    </td>
                    <td data-label="USUARIO/AUTOR">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '4px', borderRadius: '50%' }}>
                          <User size={12} className="text-muted" />
                        </div>
                        <strong>{log.userName}</strong>
                      </div>
                    </td>
                    <td data-label="ACCIÓN">
                      <span className={`badge ${getActionColor(log.actionType)}`} style={{ fontSize: '0.7rem' }}>
                        {getActionLabel(log.actionType)}
                      </span>
                    </td>
                    <td data-label="MÓDULO AFECTADO" style={{ fontWeight: 600 }}>{log.entity}</td>
                    <td data-label="ID AFECTADO" className="code-font" style={{ fontSize: '0.85rem' }}>{log.entityId || '--'}</td>
                    <td data-label="DESCRIPCIÓN" className="text-muted" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                      {log.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }} className="text-muted">
                    <ShieldAlert size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                    <p>No hay eventos de auditoría que coincidan con la búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
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
                {Array.from({ length: totalPages }).map((_, idx) => {
                  // Only show nearby pages logic for long lists
                  if (totalPages > 7) {
                    if (idx !== 0 && idx !== totalPages - 1 && Math.abs(idx + 1 - currentPage) > 2) {
                       if (idx + 1 - currentPage === 3 || currentPage - (idx + 1) === 3) return <span key={idx} className="text-muted">...</span>;
                       return null;
                    }
                  }
                  return (
                    <button
                      key={idx}
                      className={currentPage === idx + 1 ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: '4px 10px', fontSize: '0.85rem' }}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
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
    </div>
  );
};

export default AuditLogs;
