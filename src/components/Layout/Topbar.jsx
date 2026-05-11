import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, X, Wrench, Clock, Box } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';
import './Layout.css';

export default function Topbar({ toggleSidebar }) {
  const { tenantName, assets } = useAppContext();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    api.get('/api/audit')
      .then(res => res?.json())
      .then(data => {
        if (Array.isArray(data)) {
          const maintChanges = data.filter(log => log.Entity === 'Mantenimientos' && log.ActionType === 'PUT').slice(0, 5);
          setNotifications(maintChanges);
          const lastSeen = parseInt(localStorage.getItem('scaf_last_audit_id')) || 0;
          setUnreadCount(maintChanges.filter(log => log.Id > lastSeen).length);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = searchQuery.length > 1
    ? assets.filter(a =>
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serial && a.serial.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="toggle-btn" onClick={toggleSidebar} aria-label="Menú">
          <Menu size={20} />
        </button>
        <span className="tenant-badge">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
          {tenantName}
        </span>
      </div>

      <div className="topbar-right">
        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <button className="action-btn" onClick={() => { setShowSearch(s => !s); setShowNotif(false); }} aria-label="Buscar">
            {showSearch ? <X size={18} /> : <Search size={18} />}
          </button>

          {showSearch && (
            <div style={popoverStyle(300)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 10px', borderBottom: '1px solid var(--glass-border)' }}>
                <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  autoFocus type="text"
                  placeholder="Buscar activo por ID, serie o nombre..."
                  style={{
                    width: '100%', border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: 'inherit', fontSize: '0.85rem',
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto', marginTop: 6 }}>
                {searchQuery.length > 1 ? (
                  searchResults.length > 0 ? searchResults.map(a => (
                    <div key={a.id}
                      onClick={() => { navigate(`/inventory/view/${a.id}`); setShowSearch(false); setSearchQuery(''); }}
                      style={{
                        padding: '10px 4px', display: 'flex', alignItems: 'center', gap: 8,
                        cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Box size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{a.name}</div>
                        <div className="code-font" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.id} · {a.status}</div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Sin resultados</div>
                  )
                ) : (
                  <div style={{ padding: 14, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Escribe 2+ caracteres...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="action-btn" onClick={() => {
            setShowNotif(n => !n);
            setShowSearch(false);
            if (!showNotif) {
              setUnreadCount(0);
              if (notifications.length > 0) localStorage.setItem('scaf_last_audit_id', notifications[0].Id);
            }
          }} aria-label="Notificaciones">
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {showNotif && (
            <div style={popoverStyle(340)}>
              <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Notificaciones
                <span style={{
                  background: 'var(--accent-primary)', color: '#fff',
                  fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                }}>{notifications.length}</span>
              </div>
              {notifications.length > 0 ? notifications.map(log => (
                <div key={log.Id}
                  onClick={() => { navigate(`/maintenances/edit/${log.EntityId}`); setShowNotif(false); }}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 0',
                    borderTop: '1px solid var(--glass-border)', cursor: 'pointer',
                  }}>
                  <span style={{
                    width: 30, height: 30, flexShrink: 0, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--warning-bg)', color: 'var(--warning)',
                  }}><Wrench size={14} /></span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.4 }}>{log.Description}</div>
                    <div className="code-font" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      <Clock size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} />
                      {new Date(log.Timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {log.UserName}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <Bell size={20} style={{ opacity: 0.3, marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
                  Sin notificaciones recientes.
                </div>
              )}
            </div>
          )}
        </div>
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
