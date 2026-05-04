import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * OfflineBanner — Franja de alerta de conectividad
 *
 * Aparece arriba del contenido cuando el dispositivo pierde la red.
 * Muestra un flash verde breve al recuperarla y luego desaparece.
 */
const OfflineBanner = () => {
  const [online, setOnline]     = useState(navigator.onLine);
  const [showBack, setShowBack] = useState(false); // flash "conexión restaurada"

  useEffect(() => {
    const handleOffline = () => {
      setOnline(false);
      setShowBack(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setShowBack(true);
      // Ocultar el flash verde después de 3 segundos
      setTimeout(() => setShowBack(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  // Todo bien y sin flash pendiente → no renderizar nada
  if (online && !showBack) return null;

  const isOffline = !online;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '8px 16px',
      fontSize: '0.82rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
      background: isOffline ? '#b91c1c' : '#15803d',
      color: '#fff',
      transition: 'background 0.3s ease',
      animation: 'slideDown 0.3s ease',
    }}>
      {isOffline ? (
        <>
          <WifiOff size={14} />
          Sin conexión — mostrando datos en caché
        </>
      ) : (
        <>
          <Wifi size={14} />
          Conexión restaurada
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default OfflineBanner;
