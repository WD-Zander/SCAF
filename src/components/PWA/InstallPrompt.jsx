import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

/**
 * InstallPrompt — Banner de instalación PWA
 *
 * Android: captura el evento `beforeinstallprompt` del browser y muestra
 *          nuestro propio banner (más confiable que el banner nativo).
 * iOS:     detecta Safari y muestra instrucciones de "Agregar a inicio".
 * Descartado: se recuerda por 7 días en localStorage.
 * Ya instalada: no aparece si la app corre en standalone.
 */
const DISMISS_KEY = 'scaf_install_dismissed';
const DISMISS_DAYS = 7;

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // No mostrar si ya está instalada como app
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // No mostrar si fue descartado recientemente
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DAYS * 86400000) return;

    // Detectar iOS (Safari no dispara beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Android / Chrome / Edge — capturar evento del browser
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 12px)',
      left: '12px', right: '12px',
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '16px',
      padding: '16px',
      zIndex: 300,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Ícono */}
      <img src="/icons/icon-72x72.png" alt="SCAF"
        style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#e6edf3' }}>
          Instalar SCAF
        </p>
        {isIOS ? (
          <p style={{ margin: '4px 0 12px', fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.5 }}>
            Toca <strong style={{ color: '#e6edf3' }}>Compartir</strong> (
            <span style={{ fontSize: '1rem' }}>⎋</span>) y luego{' '}
            <strong style={{ color: '#e6edf3' }}>"Agregar a inicio"</strong> para instalarla como app.
          </p>
        ) : (
          <>
            <p style={{ margin: '4px 0 12px', fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.5 }}>
              Accede más rápido desde tu pantalla de inicio, sin abrir el navegador.
            </p>
            <button onClick={handleInstall} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: '#2f81f7', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: '0.82rem',
              fontWeight: 600, cursor: 'pointer',
            }}>
              <Download size={14} /> Instalar ahora
            </button>
          </>
        )}
      </div>

      {/* Cerrar */}
      <button onClick={handleDismiss} style={{
        background: '#21262d', border: '1px solid #30363d',
        borderRadius: 8, color: '#8b949e', padding: 6,
        display: 'flex', cursor: 'pointer', flexShrink: 0,
      }}>
        <X size={16} />
      </button>
    </div>
  );
};

export default InstallPrompt;
