import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import ConfirmModal from '../../components/Common/ConfirmModal';

const EmployeesList = () => {
  const { employees, setEmployees, organizationalTree, hasPermission } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

  // Flatten org tree to get all unit names
  const flatOrg = (nodes) => {
    let list = [];
    nodes.forEach(n => { list.push(n); if (n.children) list = [...list, ...flatOrg(n.children)]; });
    return list;
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (
      e.nombre?.toLowerCase().includes(q) ||
      e.apellido?.toLowerCase().includes(q) ||
      e.cedula?.toLowerCase().includes(q) ||
      e.cargo?.toLowerCase().includes(q) ||
      e.departamento?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    await api.delete(`/api/employees/${confirmModal.id}`);
    setEmployees(prev => prev.filter(e => e.id !== confirmModal.id));
    setConfirmModal({ isOpen: false, id: null, name: '' });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users className="text-accent" size={28} /> Empleados
          </h1>
          <p className="text-muted">
            {employees.length > 0 ? `${employees.length} empleados registrados` : 'Gestiona el directorio de empleados.'}
          </p>
        </div>
        {hasPermission('employees') && (
          <button className="btn-primary" onClick={() => navigate('/employees/new')}>
            <Plus size={18} /> Registrar Empleado
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '360px', cursor: 'text' }}>
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o cargo..."
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.9rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(37,99,235,0.05)' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>#</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>NOMBRE COMPLETO</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>CÉDULA</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>CARGO</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>DEPARTAMENTO</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px', textAlign: 'center' }}>
                    <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
                    <p className="text-muted">No se encontraron empleados.</p>
                  </td>
                </tr>
              ) : filtered.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{emp.id}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <p style={{ fontWeight: 600 }}>{emp.apellido}, {emp.nombre}</p>
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.88rem' }}>{emp.cedula}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.88rem' }}>{emp.cargo || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{emp.departamento || '—'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div className="flex-center gap-2" style={{ justifyContent: 'center' }}>
                      {hasPermission('employees') && (
                        <button
                          onClick={() => navigate(`/employees/edit/${emp.id}`)}
                          title="Editar"
                          style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '6px' }}
                          className="hover-gray"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {hasPermission('employees') && (
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, id: emp.id, name: `${emp.nombre} ${emp.apellido}` })}
                          title="Dar de baja"
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
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Dar de Baja Empleado"
        message={`¿Está seguro de dar de baja a ${confirmModal.name}? El empleado quedará inactivo.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
      />

      <style dangerouslySetInnerHTML={{ __html: `.table-row-hover:hover{background:rgba(37,99,235,0.02)}.hover-gray:hover{background:rgba(0,0,0,0.05)}.hover-red:hover{background:rgba(220,38,38,0.1)}` }} />
    </div>
  );
};

export default EmployeesList;
