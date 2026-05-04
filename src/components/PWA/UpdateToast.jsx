import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * UpdateToast — Notifica al usuario cuando hay una nueva versión del SW disponible.
 *
 * Cuando Vite genera un nuevo build, el Service Worker nuevo queda en estado
 * "waiting". Este componente detecta ese estado y ofrece actualizar con un clic,
 * sin perder nada.
 */
const UpdateToast = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [show, setShow]                   = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkRegistration = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      // Ya hay un SW esperando al cargar la página
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setShow(true);
      }

      // Detectar actualizaciones futuras durante la sesión
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShow(true);
          }
        });
      });
    };

    checkRegistration();

    // Recargar automáticamente cuando el SW nuevo tome el control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage('SKIP_WAITING');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: '#161b22',
      border: '1px solid #2f81f7',
      borderRadius: '14px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'slideDown 0.35s cubic-bezier(0.16,1,0.3,1)',
      minWidth: '280px',
      maxWidth: '90vw',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#e6edf3' }}>
          Nueva versión disponible
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#8b949e' }}>
          Actualiza para tener las últimas mejoras.
        </p>
      </div>
      <button onClick={handleUpdate} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', background: '#2f81f7', color: '#fff',
        border: 'none', borderRadius: 8, fontSize: '0.82rem',
        fontWeight: 600, cursor: 'pointer', flexShrink: 0,
      }}>
        <RefreshCw size={13} /> Actualizar
      </button>
      <button onClick={() => setShow(false)} style={{
        background: 'none', border: 'none', color: '#8b949e',
        cursor: 'pointer', display: 'flex', padding: 4, flexShrink: 0,
      }}>
        <X size={16} />
      </button>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default UpdateToast;
