import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, ClipboardList, Plus, Download, FileText, Calendar, User, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { api } from '../../api';
import ConfirmModal from '../../components/Common/ConfirmModal';

const PAGE_SIZE = 5;

const FormViewRecords = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState({ isOpen: false, id: null });

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const [formRes, recRes] = await Promise.all([
        api.get(`/api/forms/${id}`),
        api.get(`/api/forms/${id}/records`),
      ]);
      if (formRes?.ok) {
        const data = await formRes.json();
        data.campos = data.campos.map(c => ({
          ...c,
          opciones: c.opciones ? (typeof c.opciones === 'string' ? JSON.parse(c.opciones) : c.opciones) : []
        }));
        setForm(data);
      }
      if (recRes?.ok) setRecords(await recRes.json());
      setLoading(false);
    })();
  }, [id]);

  // Filtrado por fecha
  const filtered = useMemo(() => {
    return records.filter(rec => {
      const fecha = rec.fechaCrea?.substring(0, 10) || '';
      if (fechaDesde && fecha < fechaDesde) return false;
      if (fechaHasta && fecha > fechaHasta) return false;
      return true;
    });
  }, [records, fechaDesde, fechaHasta]);

  // Paginacion
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [fechaDesde, fechaHasta]);

  const handleDeleteRecord = async () => {
    await api.delete(`/api/forms/${id}/records/${confirmDel.id}`);
    setRecords(prev => prev.filter(r => r.id !== confirmDel.id));
    setConfirmDel({ isOpen: false, id: null });
  };

  const exportCSV = () => {
    if (!form || !filtered.length) return;
    const sep = ',';
    const cols = form.campos.map(c => c.nombre);
    const header = [...cols, 'Fecha', 'Creado Por'].join(sep);
    const rows = filtered.map(rec => {
      const datos = typeof rec.datos === 'string' ? JSON.parse(rec.datos) : rec.datos;
      return [...cols.map(col => {
        const val = datos[col];
        const str = val == null ? '' : typeof val === 'boolean' ? (val ? 'Si' : 'No') : String(val).replace(/"/g, '""');
        return `"${str}"`;
      }), `"${rec.fechaCrea || ''}"`, `"${rec.creadoPor || ''}"`].join(sep);
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.nombre}_registros.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setFechaDesde(''); setFechaHasta(''); };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }} className="text-muted">Cargando...</div>;
  if (!form) return <div style={{ padding: '60px', textAlign: 'center' }} className="text-muted">Formulario no encontrado.</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn-secondary" onClick={() => navigate('/forms/records')} style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList size={24} className="text-accent" /> {form.nombre}
            </h1>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              {filtered.length} de {records.length} registro{records.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {filtered.length > 0 && (
            <button className="btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={16} /> Exportar CSV
            </button>
          )}
          <button className="btn-primary" onClick={() => navigate(`/forms/fill/${id}`)}>
            <Plus size={16} /> Nuevo Registro
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Filter size={15} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Filtrar por fecha</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Desde</label>
            <input className="input-control" type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ fontSize: '0.85rem', padding: '6px 10px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Hasta</label>
            <input className="input-control" type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ fontSize: '0.85rem', padding: '6px 10px' }} />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button onClick={clearFilters} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
          <p className="text-muted" style={{ marginBottom: '16px' }}>
            {records.length > 0 ? 'No hay registros en el rango seleccionado.' : 'No hay registros aun.'}
          </p>
          {records.length === 0 && (
            <button className="btn-primary" onClick={() => navigate(`/forms/fill/${id}`)}>
              <Plus size={16} /> Crear primer registro
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginated.map((rec, idx) => {
            const datos = typeof rec.datos === 'string' ? JSON.parse(rec.datos) : rec.datos;
            const globalIdx = (page - 1) * PAGE_SIZE + idx + 1;
            return (
              <div key={rec.id} className="glass-panel" style={{ padding: '20px 24px' }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      background: 'var(--accent-primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 700,
                    }}>
                      {globalIdx}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} /> {rec.fechaCrea}
                    </span>
                    {rec.creadoPor && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <User size={13} /> {rec.creadoPor}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmDel({ isOpen: true, id: rec.id })}
                    style={{ color: 'var(--danger)', padding: '6px', borderRadius: '6px' }}
                    className="hover-red"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Card body */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '14px 24px',
                }}>
                  {form.campos.map((c, ci) => {
                    const val = datos[c.nombre];
                    const display = val == null || val === '' ? '—'
                      : typeof val === 'boolean' ? (val ? 'Si' : 'No')
                      : String(val);
                    return (
                      <div key={ci}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                          {c.nombre}
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 500, color: display === '—' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                          {display}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
          <button
            className="btn-secondary"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '7px 12px', opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600,
                  background: p === page ? 'var(--accent-primary)' : 'transparent',
                  color: p === page ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            className="btn-secondary"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '7px 12px', opacity: page === totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDel.isOpen}
        title="Eliminar Registro"
        message="¿Desea eliminar este registro?"
        onConfirm={handleDeleteRecord}
        onCancel={() => setConfirmDel({ isOpen: false, id: null })}
      />

      <style dangerouslySetInnerHTML={{ __html: `.hover-red:hover{background:rgba(220,38,38,0.1)}` }} />
    </div>
  );
};

export default FormViewRecords;
