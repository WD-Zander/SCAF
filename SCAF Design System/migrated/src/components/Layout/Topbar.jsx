import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, X, Wrench, Clock, Box } from 'lucide-react';
import './Layout.css';

const NOTIFS = [
  { Icon: Wrench, tone: 'warning', title: 'PM-204 vence hoy',   body: 'Compresor Atlas Copco GA-90 · 08:00', when: 'hace 12 min' },
  { Icon: Clock,  tone: 'neutral', title: 'Tarea reprogramada', body: 'PM-162 movido a 15 May',               when: 'ayer' },
  { Icon: Box,    tone: 'success', title: 'Activo creado',      body: 'ACT-0114 · Servidor Proliant DL380',   when: 'hace 3h' },
];

export default function Topbar({ onMenu }) {
  const [search, setSearch] = useState(false);
  const [notifs, setNotifs] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setSearch(false); setNotifs(false); } };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="topbar" ref={ref}>
      <div className="topbar-left">
        <button className="toggle-btn" onClick={onMenu} aria-label="Menú"><Menu size={20} /></button>
        <span className="tenant-badge">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
          Tenant · Acme S.A. — Sede Norte
        </span>
      </div>

      <div className="topbar-right" style={{ position: 'relative' }}>
        <button className="action-btn" onClick={() => { setSearch(s => !s); setNotifs(false); }} aria-label="Buscar">
          {search ? <X size={18} /> : <Search size={18} />}
        </button>
        <button className="action-btn" onClick={() => { setNotifs(n => !n); setSearch(false); }} aria-label="Notificaciones">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>
        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.78rem' }}>CL</div>

        {search && (
          <div style={popoverStyle(280)}>
            <input autoFocus type="text" placeholder="Buscar activo, PM, usuario…" style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
              fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none',
            }} />
            <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Atajos: <kbd style={kbd}>↑↓</kbd> navegar · <kbd style={kbd}>Enter</kbd> abrir · <kbd style={kbd}>Esc</kbd> cerrar
            </div>
          </div>
        )}

        {notifs && (
          <div style={popoverStyle(340)}>
            <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: 10 }}>Notificaciones</div>
            {NOTIFS.map((n, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '10px 0',
                borderTop: i > 0 ? '1px solid var(--glass-border)' : 'none',
              }}>
                <span style={{
                  width: 30, height: 30, flexShrink: 0, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: n.tone === 'warning' ? 'var(--warning-bg)' : n.tone === 'success' ? 'var(--success-bg)' : 'var(--bg-tertiary)',
                  color:      n.tone === 'warning' ? 'var(--warning)'    : n.tone === 'success' ? 'var(--success)'    : 'var(--text-muted)',
                }}><n.Icon size={14} /></span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{n.body}</div>
                  <div className="code-font" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.when}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

const popoverStyle = (w) => ({
  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
  width: w, maxWidth: 'calc(100vw - 32px)', padding: 14,
  background: '#fff', border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-md)', boxShadow: '0 12px 36px -8px rgba(0,0,0,.12)',
  zIndex: 200,
});

const kbd = {
  fontFamily: 'var(--font-mono)', fontSize: '0.66rem',
  padding: '2px 5px', background: 'var(--bg-tertiary)',
  border: '1px solid var(--glass-border)', borderRadius: 4,
};
