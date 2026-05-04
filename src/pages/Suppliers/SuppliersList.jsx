import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Download, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppContext } from '../../context/AppContext';
import ConfirmModal from '../../components/Common/ConfirmModal';

const SuppliersList = () => {
  const { suppliers, removeSupplier, hasPermission } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null });
  const navigate = useNavigate();

  const processSuppliers = useMemo(() => {
    let filtered = suppliers.filter(sup => 
      sup.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sup.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.contact?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [suppliers, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processSuppliers.length / itemsPerPage);
  const paginatedSuppliers = processSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleExportExcel = () => {
    const dataToExport = suppliers.map(s => ({
      'Código ID': s.id,
      'RIF': s.rif,
      'Razón Social': s.name,
      'Contacto': s.contact,
      'Teléfono': s.phone,
      'Email': s.email,
      'Forma de Pago': s.paymentMethod,
      'Dirección': s.address
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');
    XLSX.writeFile(workbook, 'Listado_Proveedores.xlsx');
  };

  const openAddModal = () => {
    navigate('/suppliers/new');
  };

  const openEditModal = (supplier) => {
    navigate(`/suppliers/edit/${supplier.id}`);
  };

  const handleView = (id) => {
    navigate(`/suppliers/view/${id}`);
  };

  const handleDeleteClick = (supplierId) => {
    setConfirmModal({ isOpen: true, idToDelete: supplierId });
  };

  const confirmDelete = () => {
    if (confirmModal.idToDelete) {
      removeSupplier(confirmModal.idToDelete);
    }
    setConfirmModal({ isOpen: false, idToDelete: null });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Proveedores</h1>
          <p className="text-muted">Gestiona el directorio de proveedores de la empresa para la adquisición de activos.</p>
        </div>
        <div className="flex-center gap-2">
          <button className="btn-secondary" onClick={handleExportExcel}>
            <Download size={18} /> Exportar Excel
          </button>
          {hasPermission('suppliers_create') && (
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={18} /> Registrar Proveedor
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="input-group" style={{ margin: 0, maxWidth: '300px' }}>
            <input 
              type="text" 
              className="input-control" 
              placeholder="Buscar por código, nombre o contacto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.05)' }}>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CÓDIGO <ArrowUpDown size={12} style={{ display: 'inline' }} /></th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>PROVEEDOR <ArrowUpDown size={12} style={{ display: 'inline' }} /></th>
                <th className="hide-mobile" onClick={() => handleSort('contact')} style={{ cursor: 'pointer', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CONTACTO <ArrowUpDown size={12} style={{ display: 'inline' }} /></th>
                <th className="hide-mobile" onClick={() => handleSort('phone')} style={{ cursor: 'pointer', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TELÉFONO <ArrowUpDown size={12} style={{ display: 'inline' }} /></th>
                <th className="hide-mobile" onClick={() => handleSort('email')} style={{ cursor: 'pointer', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CORREO <ArrowUpDown size={12} style={{ display: 'inline' }} /></th>
                <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.map(sup => (
                <tr 
                  key={sup.id} 
                  onClick={() => handleView(sup.id)}
                  style={{ borderBottom: '1px solid var(--glass-border)', transition: 'var(--transition)' }} 
                  className="table-row-hover clickable-row mobile-list-format"
                >
                  <td data-label="CÓDIGO" style={{ padding: '16px 20px', fontWeight: 600 }}>{sup.id}</td>
                  <td data-label="PROVEEDOR" style={{ padding: '16px 20px', fontWeight: 600 }}>{sup.name}</td>
                  <td className="hide-mobile" data-label="CONTACTO" style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{sup.contact || '--'}</td>
                  <td className="hide-mobile" data-label="TELÉFONO" style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{sup.phone || '--'}</td>
                  <td className="hide-mobile" data-label="CORREO" style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{sup.email || '--'}</td>
                  <td className="hide-mobile" data-label="ACCIONES" style={{ padding: '16px 20px' }}>
                    <div className="flex-center gap-2" onClick={e => e.stopPropagation()}>
                      {hasPermission('suppliers_edit') && (
                        <button onClick={() => openEditModal(sup)} title="Editar" style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '6px' }} className="hover-gray">
                          <Edit2 size={18} />
                        </button>
                      )}
                      {hasPermission('suppliers_delete') && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(sup.id); }} title="Eliminar" style={{ color: 'var(--danger)', padding: '6px', borderRadius: '6px' }} className="hover-red">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {paginatedSuppliers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p className="text-muted">No se encontraron proveedores.</p>
            </div>
          )}
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
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que deseas eliminar permanentemente al proveedor ${confirmModal.idToDelete}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
      />



      <style dangerouslySetInnerHTML={{__html:`
        .table-row-hover:hover {
          background: rgba(37, 99, 235, 0.02);
        }
        .hover-gray:hover { background: rgba(0,0,0,0.05); }
        .hover-red:hover { background: rgba(220, 38, 38, 0.1); }
      `}} />
    </div>
  );
};

export default SuppliersList;
