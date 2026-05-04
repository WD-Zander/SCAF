import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile.css'   // ← Diseño exclusivo para móvil/tablet PWA
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ── Registro del Service Worker (PWA) ──────────────────────
// Solo se activa en producción (build) para evitar problemas en desarrollo.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('✅ SCAF PWA: Service Worker registrado', reg.scope))
      .catch((err) => console.warn('⚠️ SCAF PWA: Error al registrar SW', err));
  });
}

