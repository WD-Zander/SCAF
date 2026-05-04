import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X } from 'lucide-react';

const AlertModal = ({ isOpen, title, message, onClose, buttonText = "Entendido" }) => {
  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ padding: '24px 24px 16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: '#fee2e2', color: '#dc2626' 
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}>{title}</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>{message}</p>
          </div>
        </div>
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: '#0f172a', border: 'none', color: '#fff',
            padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', width: '100%'
          }}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AlertModal;
