import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Download, ArrowUpDown, ChevronLeft, ChevronRight,
  Activity, Clock, User,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import { Button, Badge, Card, Field } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';

const ACTION_LABEL = {
  POST: 'creó',
  PUT: 'actualizó',
  DELETE: 'eliminó',
  RESET: 'reseteó',
};

const ACTION_TONE = {
  POST: 'success',
  PUT: 'warning',
  DELETE: 'danger',
};

const AuditLogs = () => {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
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
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatRelative = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Sistema y Config</div>
          <h1 style={{ margin: 0 }}>Auditoría</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Registro inmutable de acciones · <strong style={{ color: 'var(--text-main)' }}>{logs.length}</strong> eventos registrados
          </p>
        </div>
      </div>

      {/* Search */}
      <Card padded={false} style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Field
              icon={Search}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Usuario, acción, módulo, descripción..."
            />
          </div>
        </div>
      </Card>

      {/* Event list */}
      <Card padded={false} style={{ padding: '4px 0' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Activity size={24} style={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Cargando auditoría...</p>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No hay eventos que coincidan con la búsqueda.
          </div>
        ) : paginatedLogs.map((log, i) => {
          const tone = ACTION_TONE[log.actionType] || 'neutral';
          return (
            <div key={log.id || i} style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '36px 1fr' : '140px 36px 1fr',
              gap: isMobile ? 10 : 14,
              padding: '12px 18px',
              borderBottom: i < paginatedLogs.length - 1 ? '1px solid var(--glass-border)' : 'none',
              alignItems: 'flex-start',
            }}>
              {/* Timestamp (desktop) */}
              {!isMobile && (
                <div className="code-font" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: 4 }}>
                  {formatDate(log.timestamp)}
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: tone === 'success' ? 'var(--success-bg)' : tone === 'warning' ? 'var(--warning-bg)' : tone === 'danger' ? 'var(--danger-bg)' : 'var(--bg-tertiary)',
                color: tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : 'var(--text-muted)',
              }}>
                <Activity size={13} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 600 }}>{log.userName}</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{ACTION_LABEL[log.actionType] || log.actionType}</span>{' '}
                  <span style={{ fontWeight: 500 }}>{log.entity}</span>
                  {log.entityId && (
                    <span className="code-font" style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginLeft: 6 }}>#{log.entityId}</span>
                  )}
                </div>
                {log.description && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: 2, lineHeight: 1.4 }}>{log.description}</div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <Badge tone={tone === 'neutral' ? 'neutral' : tone}>{ACTION_LABEL[log.actionType] ? log.actionType : 'INFO'}</Badge>
                  <span className="code-font" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <Clock size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} />
                    {isMobile ? formatDate(log.timestamp) : formatRelative(log.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            padding: '14px 18px', borderTop: '1px solid var(--glass-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Página {currentPage} de {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = idx + 1;
                } else if (currentPage <= 4) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + idx;
                } else {
                  pageNum = currentPage - 3 + idx;
                }
                return (
                  <Button key={pageNum} variant={currentPage === pageNum ? 'primary' : 'ghost'}
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </Button>
                );
              })}
              <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;
