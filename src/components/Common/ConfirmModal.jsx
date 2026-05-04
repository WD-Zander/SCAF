import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", isDanger = true }) => {
  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ padding: '24px 24px 16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: isDanger ? '#fee2e2' : '#e0e7ff', color: isDanger ? '#dc2626' : '#4f46e5' 
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{message}</p>
          </div>
        </div>
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{
            background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
          }}>
            {cancelText}
          </button>
          <button onClick={onConfirm} style={{
            background: isDanger ? '#dc2626' : 'var(--accent-primary)', border: 'none', color: '#fff',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
          }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
