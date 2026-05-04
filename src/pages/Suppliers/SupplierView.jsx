import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const SupplierView = () => {
  const { suppliers } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);

  useEffect(() => {
    const found = suppliers.find(s => s.id === id);
    if (found) {
      setSupplier(found);
    } else {
      navigate('/suppliers');
    }
  }, [id, suppliers, navigate]);

  if (!supplier) return null;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/suppliers')}
            style={{ padding: '8px', borderRadius: '50%' }}
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Ficha del Proveedor: {supplier.id}</h1>
            <p className="text-muted">Perfil de lectura de datos comerciales.</p>
          </div>
        </div>
      </div>

      {/* Main Profile Info */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '16px', 
            background: 'var(--bg-tertiary)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' 
          }}>
            <Truck size={40} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{supplier.name}</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={16} /> RIF: {supplier.rif || 'N/A'}</span>
            </div>
            {supplier.categories && (
              <p style={{ marginTop: '16px', color: 'var(--text-main)', opacity: 0.8 }}><strong>Suministra:</strong> {supplier.categories}</p>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2">
        {/* Contacto */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Datos de Contacto</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Representante Comercial</span> <strong>{supplier.contact || '--'}</strong></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={16} className="text-muted" /> <strong>{supplier.phone || '--'}</strong></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} className="text-muted" /> <strong>{supplier.email || '--'}</strong></div>
          </div>
        </div>

        {/* Administrativo */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Gestión Administrativa</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>Forma de Pago Acordada</span> <strong>{supplier.paymentMethod || '--'}</strong></div>
            <div>
              <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Dirección Fiscal</span> 
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <MapPin size={16} className="text-muted" style={{ marginTop: '2px' }}/>
                <span>{supplier.address || '--'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SupplierView;
