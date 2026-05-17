import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, FileText, ClipboardList, Eye } from 'lucide-react';
import { api } from '../../api';
import { useAppContext } from '../../context/AppContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import Pagination from '../../components/Common/Pagination';

const FormsList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAppContext();
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

  const fetchForms = async () => {
    const res = await api.get('/api/forms');
    if (res?.ok) {
      setForms(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => { fetchForms(); }, []);

  const filtered = useMemo(() => forms.filter(f => {
    const q = search.toLowerCase();
    return f.nombre?.toLowerCase().includes(q) || f.descripcion?.toLowerCase().includes(q);
  }), [forms, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDelete = async () => {
    await api.delete(`/api/forms/${confirmModal.id}`);
    setForms(prev => prev.filter(f => f.id !== confirmModal.id));
    setConfirmModal({ isOpen: false, id: null, name: '' });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList className="text-accent" size={28} /> Formularios
          </h1>
          <p className="text-muted">
            {forms.length > 0
              ? `${forms.length} formularios creados`
              : 'Crea y gestiona formularios personalizados.'}
          </p>
        </div>
        {hasPermission('forms_create') && (
          <button className="btn-primary" onClick={() => navigate('/forms/new')}>
            <Plus size={18} /> Nuevo Formulario
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '360px', cursor: 'text' }}>
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Buscar formulario..."
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.9rem' }}
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p className="text-muted">Cargando...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(37,99,235,0.05)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>NOMBRE</th>
                  <th style={thStyle}>DESCRIPCION</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>CAMPOS</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>REGISTROS</th>
                  <th style={thStyle}>CREADO</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '60px', textAlign: 'center' }}>
                      <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
                      <p className="text-muted">No se encontraron formularios.</p>
                    </td>
                  </tr>
                ) : paginatedItems.map((form, idx) => (
                  <tr key={form.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                    <td style={tdStyle}>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td style={tdStyle}>
                      <p style={{ fontWeight: 600 }}>{form.nombre}</p>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '260px' }}>
                      {form.descripcion || '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600
                      }}>
                        {form.totalCampos}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        background: 'rgba(34,197,94,0.1)', color: '#15803d',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600
                      }}>
                        {form.totalRegistros}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {form.fechaCrea}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div className="flex-center gap-2" style={{ justifyContent: 'center' }}>
                        {hasPermission('forms_fill') && (
                          <button
                            onClick={() => navigate(`/forms/fill/${form.id}`)}
                            title="Llenar formulario"
                            style={{ color: '#15803d', padding: '6px', borderRadius: '6px' }}
                            className="hover-gray"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {hasPermission('forms_edit') && (
                          <button
                            onClick={() => navigate(`/forms/edit/${form.id}`)}
                            title="Editar"
                            style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '6px' }}
                            className="hover-gray"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {hasPermission('forms_delete') && (
                          <button
                            onClick={() => setConfirmModal({ isOpen: true, id: form.id, name: form.nombre })}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          label="formularios"
        />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar Formulario"
        message={`¿Está seguro de eliminar el formulario "${confirmModal.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
      />

      <style dangerouslySetInnerHTML={{ __html: `.table-row-hover:hover{background:rgba(37,99,235,0.02)}.hover-gray:hover{background:rgba(0,0,0,0.05)}.hover-red:hover{background:rgba(220,38,38,0.1)}` }} />
    </div>
  );
};

const thStyle = { padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 };
const tdStyle = { padding: '14px 20px' };

export default FormsList;
