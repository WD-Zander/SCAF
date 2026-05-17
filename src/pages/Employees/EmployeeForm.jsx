import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import SearchableSelect from '../../components/Common/SearchableSelect';
import { api } from '../../api';

const EmployeeForm = () => {
  const { employees, setEmployees, refreshEmployees, organizationalTree, setGlobalAlert } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', cedula: '', cargo: '', deptoId: '', activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Flatten org tree for the department dropdown
  const flatOrg = (nodes, depth = 0) => {
    let list = [];
    nodes.forEach(n => {
      list.push({ id: n.id, name: '  '.repeat(depth) + n.name });
      if (n.children?.length) list = [...list, ...flatOrg(n.children, depth + 1)];
    });
    return list;
  };
  const deptOptions = flatOrg(organizationalTree);

  useEffect(() => {
    if (isEdit) {
      const found = employees.find(e => String(e.id) === id);
      if (found) {
        setFormData({
          nombre: found.nombre || '',
          apellido: found.apellido || '',
          cedula: found.cedula || '',
          cargo: found.cargo || '',
          deptoId: found.deptoId || '',
          activo: found.activo !== false,
        });
      } else {
        navigate('/employees');
      }
    }
  }, [id, employees, isEdit, navigate]);

  useEffect(() => {
    const handler = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty && !window.confirm('¿Está seguro de salir? Los cambios no guardados se perderán.')) return;
    navigate('/employees');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.put(`/api/employees/${id}`, formData);
        if (!res?.ok) {
          const err = await res.json().catch(() => ({}));
          setGlobalAlert({ isOpen: true, title: 'Error', message: err.error || 'No se pudo actualizar.' });
          return;
        }
      } else {
        const res = await api.post('/api/employees', formData);
        if (!res?.ok) {
          const err = await res.json().catch(() => ({}));
          setGlobalAlert({ isOpen: true, title: 'Error', message: err.error || 'No se pudo crear.' });
          return;
        }
      }
      setIsDirty(false);
      await refreshEmployees();
      navigate('/employees');
    } catch (err) {
      setGlobalAlert({ isOpen: true, title: 'Error de Conexión', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-secondary" onClick={handleCancel} style={{ padding: '8px', borderRadius: '50%' }} title="Volver">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={24} className="text-accent" />
              {isEdit ? 'Editar Empleado' : 'Registrar Empleado'}
            </h1>
            <p className="text-muted">Datos personales y de asignación organizativa.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <form onSubmit={handleSubmit} onInput={() => setIsDirty(true)}>
          <div style={{ padding: '32px 40px' }}>

            <div className="form-section">
              <h3 className="form-section-title">Datos Personales</h3>
              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Nombre *</label>
                  <input required type="text" className="input-control" value={formData.nombre}
                    onChange={e => setFormData(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Apellido *</label>
                  <input required type="text" className="input-control" value={formData.apellido}
                    onChange={e => setFormData(f => ({ ...f, apellido: e.target.value }))}
                    placeholder="Apellido" />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Cédula / Documento de Identidad *</label>
                <input required type="text" className="input-control" value={formData.cedula}
                  onChange={e => setFormData(f => ({ ...f, cedula: e.target.value }))}
                  placeholder="Ej. V-12345678" />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Cargo y Departamento</h3>
              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Cargo / Puesto</label>
                  <input type="text" className="input-control" value={formData.cargo}
                    onChange={e => setFormData(f => ({ ...f, cargo: e.target.value }))}
                    placeholder="Ej. Técnico de Mantenimiento" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Departamento (Unidad Org.)</label>
                  <SearchableSelect
                    value={formData.deptoId}
                    onChange={(value) => setFormData(f => ({ ...f, deptoId: value }))}
                    options={deptOptions.map(d => ({ value: d.id, label: d.name }))}
                    placeholder="-- Sin asignar --"
                    clearable
                  />
                </div>
              </div>
            </div>

            {isEdit && (
              <div className="form-section">
                <h3 className="form-section-title">Estado</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.activo}
                    onChange={e => setFormData(f => ({ ...f, activo: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }} />
                  <span>Empleado activo</span>
                </label>
              </div>
            )}
          </div>

          <div className="form-footer" style={{
            padding: '24px 40px', background: 'var(--bg-primary)',
            borderTop: '1px solid var(--glass-border)', display: 'flex',
            justifyContent: 'flex-end', gap: '16px'
          }}>
            <button type="button" className="btn-secondary" onClick={handleCancel}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Check size={18} /> {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
