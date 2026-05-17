import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

const NoPermission = ({ message }) => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="glass-panel" style={{ padding: '48px 40px', textAlign: 'center', maxWidth: '440px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '18px',
          background: 'rgba(220,38,38,0.08)', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldOff size={32} style={{ color: 'var(--danger)' }} />
        </div>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Acceso Restringido</h2>
        <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '28px' }}>
          {message || 'No tienes permisos para acceder a esta sección. Contacta al administrador si necesitas acceso.'}
        </p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '10px 28px' }}>
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>
      </div>
    </div>
  );
};

export default NoPermission;
