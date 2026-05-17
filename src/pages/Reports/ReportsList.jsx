import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, BarChart3, Play, Database } from 'lucide-react';
import { api } from '../../api';
import { useAppContext } from '../../context/AppContext';
import ConfirmModal from '../../components/Common/ConfirmModal';

const ReportsList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAppContext();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

  const fetchReports = async () => {
    const res = await api.get('/api/reports');
    if (res?.ok) setReports(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    return r.nombre?.toLowerCase().includes(q) || r.descripcion?.toLowerCase().includes(q);
  });

  const handleDelete = async () => {
    await api.delete(`/api/reports/${confirmModal.id}`);
    setReports(prev => prev.filter(r => r.id !== confirmModal.id));
    setConfirmModal({ isOpen: false, id: null, name: '' });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 className="text-accent" size={28} /> Informes
          </h1>
          <p className="text-muted">
            {reports.length > 0 ? `${reports.length} informes guardados` : 'Ejecuta y visualiza informes SQL guardados.'}
          </p>
        </div>
        {hasPermission('reports_create') && (
          <button className="btn-primary" onClick={() => navigate('/reports/new')}>
            <Plus size={18} /> Crear Informe
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '360px', cursor: 'text' }}>
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Buscar informe..."
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.9rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}><p className="text-muted">Cargando...</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(37,99,235,0.05)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>NOMBRE</th>
                  <th style={thStyle}>DESCRIPCION</th>
                  <th style={thStyle}>CREADO</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '60px', textAlign: 'center' }}>
                      <Database size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
                      <p className="text-muted">No hay informes.</p>
                    </td>
                  </tr>
                ) : filtered.map((report, idx) => {
                  const vars = report.variables ? (typeof report.variables === 'string' ? JSON.parse(report.variables) : report.variables) : [];
                  return (
                    <tr key={report.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={tdStyle}>
                        <p style={{ fontWeight: 600 }}>{report.nombre}</p>
                        {vars.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', opacity: 0.7 }}>
                            {vars.length} variable{vars.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '300px' }}>
                        {report.descripcion || '—'}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {report.fechaCrea}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div className="flex-center gap-2" style={{ justifyContent: 'center' }}>
                          {(hasPermission('reports_view') || hasPermission('reports_execute')) && (
                            <button
                              onClick={() => navigate(`/reports/view/${report.id}`)}
                              title="Ejecutar"
                              style={{ color: '#15803d', padding: '6px', borderRadius: '6px' }}
                              className="hover-gray"
                            >
                              <Play size={16} />
                            </button>
                          )}
                          {hasPermission('reports_edit') && (
                            <button
                              onClick={() => navigate(`/reports/edit/${report.id}`)}
                              title="Editar"
                              style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '6px' }}
                              className="hover-gray"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {hasPermission('reports_delete') && (
                            <button
                              onClick={() => setConfirmModal({ isOpen: true, id: report.id, name: report.nombre })}
                              title="Eliminar"
                              style={{ color: 'var(--danger)', padding: '6px', borderRadius: '6px' }}
                              className="hover-red"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Informe"
        message={`¿Desea eliminar el informe "${confirmModal.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
      />

      <style dangerouslySetInnerHTML={{ __html: `.table-row-hover:hover{background:rgba(37,99,235,0.02)}.hover-gray:hover{background:rgba(0,0,0,0.05)}.hover-red:hover{background:rgba(220,38,38,0.1)}` }} />
    </div>
  );
};

const thStyle = { padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 20px', whiteSpace: 'nowrap' };

export default ReportsList;
