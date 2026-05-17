import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Activity, Clock, User,
  Filter, Calendar, X, Shield
} from 'lucide-react';
import { api } from '../../api';

const ACTION_LABEL = { POST: 'Creacion', PUT: 'Actualizacion', DELETE: 'Eliminacion', RESET: 'Reseteo' };
const ACTION_COLOR = {
  POST: { bg: 'rgba(34,197,94,0.1)', color: '#15803d' },
  PUT: { bg: 'rgba(234,179,8,0.1)', color: '#a16207' },
  DELETE: { bg: 'rgba(220,38,38,0.1)', color: '#b91c1c' },
  RESET: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
};

const PAGE_SIZE = 20;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Opciones para filtros
  const [users, setUsers] = useState([]);
  const [entities, setEntities] = useState([]);

  // Cargar opciones de filtros
  useEffect(() => {
    api.get('/api/audit/users').then(r => r?.json()).then(d => { if (Array.isArray(d)) setUsers(d); }).catch(() => {});
    api.get('/api/audit/entities').then(r => r?.json()).then(d => { if (Array.isArray(d)) setEntities(d); }).catch(() => {});
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', PAGE_SIZE);
    if (search) params.set('search', search);
    if (filterUser) params.set('user', filterUser);
    if (filterAction) params.set('action', filterAction);
    if (filterEntity) params.set('entity', filterEntity);
    if (fechaDesde) params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params.set('fechaHasta', fechaHasta);

    const res = await api.get(`/api/audit?${params.toString()}`);
    if (res?.ok) {
      const data = await res.json();
      setLogs(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    }
    setLoading(false);
  }, [page, search, filterUser, filterAction, filterEntity, fechaDesde, fechaHasta]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset page on filter change
  const applyFilter = (setter, val) => {
    setter(val);
    setPage(1);
  };

  const hasFilters = filterUser || filterAction || filterEntity || fechaDesde || fechaHasta || search;

  const clearFilters = () => {
    setSearch(''); setFilterUser(''); setFilterAction('');
    setFilterEntity(''); setFechaDesde(''); setFechaHasta('');
    setPage(1);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatRelative = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `Hace ${days}d`;
    return formatDate(dateStr);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield className="text-accent" size={28} /> Auditoria
        </h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>
          Registro inmutable de acciones del sistema — <strong style={{ color: 'var(--text-main)' }}>{total}</strong> eventos
        </p>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', minWidth: '200px', cursor: 'text' }}>
            <Search size={15} className="text-muted" />
            <input
              type="text"
              placeholder="Buscar en descripcion..."
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.85rem' }}
              value={search}
              onChange={e => applyFilter(setSearch, e.target.value)}
            />
          </div>

          {/* User filter */}
          <select
            className="input-control"
            style={{ fontSize: '0.85rem', padding: '7px 10px', minWidth: '150px' }}
            value={filterUser}
            onChange={e => applyFilter(setFilterUser, e.target.value)}
          >
            <option value="">Todos los usuarios</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          {/* Action filter */}
          <select
            className="input-control"
            style={{ fontSize: '0.85rem', padding: '7px 10px', minWidth: '140px' }}
            value={filterAction}
            onChange={e => applyFilter(setFilterAction, e.target.value)}
          >
            <option value="">Todas las acciones</option>
            <option value="POST">Creacion</option>
            <option value="PUT">Actualizacion</option>
            <option value="DELETE">Eliminacion</option>
            <option value="RESET">Reseteo</option>
          </select>

          {/* Entity filter */}
          <select
            className="input-control"
            style={{ fontSize: '0.85rem', padding: '7px 10px', minWidth: '140px' }}
            value={filterEntity}
            onChange={e => applyFilter(setFilterEntity, e.target.value)}
          >
            <option value="">Todos los modulos</option>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {/* Date from */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} className="text-muted" />
            <input className="input-control" type="date" value={fechaDesde} onChange={e => applyFilter(setFechaDesde, e.target.value)} style={{ fontSize: '0.85rem', padding: '6px 10px' }} />
          </div>

          {/* Date to */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>a</span>
            <input className="input-control" type="date" value={fechaHasta} onChange={e => applyFilter(setFechaHasta, e.target.value)} style={{ fontSize: '0.85rem', padding: '6px 10px' }} />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Activity size={24} style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
            <p className="text-muted" style={{ marginTop: '10px' }}>Cargando...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Shield size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '12px' }} />
            <p className="text-muted">No hay eventos {hasFilters ? 'con los filtros aplicados' : 'registrados'}.</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => {
              const ac = ACTION_COLOR[log.actionType] || ACTION_COLOR.RESET;
              return (
                <div
                  key={log.id || i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr auto',
                    gap: '14px',
                    padding: '14px 22px',
                    borderBottom: i < logs.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    alignItems: 'center',
                  }}
                  className="table-row-hover"
                >
                  {/* Icon */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ac.bg, color: ac.color, flexShrink: 0,
                  }}>
                    <Activity size={15} />
                  </div>

                  {/* Content */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                      <strong style={{ fontWeight: 600 }}>{log.userName || 'Sistema'}</strong>
                      <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>/</span>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                        background: ac.bg, color: ac.color,
                      }}>
                        {ACTION_LABEL[log.actionType] || log.actionType}
                      </span>
                      <span style={{ fontWeight: 500, marginLeft: '8px' }}>{log.entity}</span>
                      {log.entityId && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace', marginLeft: '6px' }}>#{log.entityId}</span>
                      )}
                    </div>
                    {log.description && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.description}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <Clock size={12} /> {formatRelative(log.timestamp)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7, marginTop: '2px' }}>
                      {formatDate(log.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            padding: '14px 22px', borderTop: '1px solid var(--glass-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Pagina {page} de {totalPages} — {total} eventos
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                className="btn-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 10px', opacity: page === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              {(() => {
                const pages = [];
                let start = Math.max(1, page - 2);
                let end = Math.min(totalPages, start + 4);
                if (end - start < 4) start = Math.max(1, end - 4);
                for (let p = start; p <= end; p++) pages.push(p);
                return pages.map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      background: p === page ? 'var(--accent-primary)' : 'transparent',
                      color: p === page ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {p}
                  </button>
                ));
              })()}
              <button
                className="btn-secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '6px 10px', opacity: page === totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.table-row-hover:hover{background:rgba(37,99,235,0.02)}` }} />
    </div>
  );
};

export default AuditLogs;
