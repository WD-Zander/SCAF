import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const SupplierForm = () => {
  const { suppliers, addSupplier, updateSupplier, paymentMethods, hasPermission, setGlobalAlert } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Route guard — runs ONCE on mount only
  useEffect(() => {
    if (isEditMode && !hasPermission('suppliers_edit')) {
      setGlobalAlert({ isOpen: true, title: 'Acceso Denegado', message: 'No tienes permiso para editar proveedores.' });
      navigate('/suppliers');
    }
    if (!isEditMode && !hasPermission('suppliers_create')) {
      setGlobalAlert({ isOpen: true, title: 'Acceso Denegado', message: 'No tienes permiso para crear proveedores.' });
      navigate('/suppliers');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialFormState = { id: '', name: '', contact: '', phone: '', email: '', address: '', rif: '', paymentMethod: '' };
  const [formData, setFormData] = useState(initialFormState);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty && !window.confirm('¿Está seguro de salir? Los cambios no guardados se perderán.')) return;
    navigate('/suppliers');
  };

  useEffect(() => {
    if (isEditMode) {
      const supplierToEdit = suppliers.find(s => s.id === id);
      if (supplierToEdit) {
        setFormData(supplierToEdit);
      } else {
        navigate('/suppliers');
      }
    }
  }, [id, suppliers, isEditMode, navigate]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isEditMode) {
      updateSupplier(formData);
    } else {
      addSupplier(formData);
    }
    setIsDirty(false);
    navigate('/suppliers');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn-secondary"
            onClick={handleCancel}
            style={{ padding: '8px', borderRadius: '50%' }}
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px' }}>{isEditMode ? `Editar Proveedor: ${formData.id}` : 'Registrar Nuevo Proveedor'}</h1>
            <p className="text-muted">Introduce los datos contables y de contacto del proveedor.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel form-container" style={{ overflow: 'hidden' }}>
        <form onSubmit={handleFormSubmit} onInput={() => setIsDirty(true)}>
          <div style={{ padding: '32px 40px' }}>
            
            <div className="form-section">
              <h3 className="form-section-title">Información Principal</h3>
              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Razón Social / Nombre *</label>
                  <input required type="text" className="input-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre de la empresa o proveedor" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>RIF / CUIT / ID Fiscal</label>
                  <input type="text" className="input-control" value={formData.rif} onChange={e => setFormData({...formData, rif: e.target.value})} />
                </div>
              </div>
            </div>
              
            <div className="form-section">
              <h3 className="form-section-title">Contacto corporativo</h3>
              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Persona de Contacto</label>
                  <input type="text" className="input-control" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Teléfono</label>
                  <input type="text" className="input-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Facturación e Impuestos</h3>
              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Correo Electrónico</label>
                  <input type="email" className="input-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Forma de Pago</label>
                  <select className="input-control" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option value="">-- Seleccionar --</option>
                    {paymentMethods.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3 className="form-section-title">Localización</h3>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Dirección Física Corporativa</label>
                <textarea className="input-control" rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
            </div>

          </div>

          <div className="form-footer" style={{ 
            padding: '24px 40px', background: 'var(--bg-primary)', 
            borderTop: '1px solid var(--glass-border)', display: 'flex', 
            justifyContent: 'flex-end', gap: '16px' 
          }}>
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {isEditMode ? <><Edit2 size={18} /> Actualizar Registro</> : <><Plus size={18} /> Guardar Proveedor</>}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default SupplierForm;
