import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, X, Wrench, Clock, Box } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

const Topbar = ({ toggleSidebar }) => {
  const { tenantName, assets } = useAppContext();
  const navigate = useNavigate();
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Fetch recent maintenance status changes from Audit Logs
  useEffect(() => {
    api.get('/api/audit')
      .then(res => res?.json())
      .then(data => {
        if(Array.isArray(data)) {
           const maintChanges = data.filter(log => log.Entity === 'Mantenimientos' && log.ActionType === 'PUT').slice(0, 5);
           setNotifications(maintChanges);
           
           const lastSeen = parseInt(localStorage.getItem('scaf_last_audit_id')) || 0;
           const unread = maintChanges.filter(log => log.Id > lastSeen).length;
           setUnreadCount(unread);
        }
      })
      .catch(console.error);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = searchQuery.length > 1 
    ? assets.filter(a => a.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (a.serial && a.serial.toLowerCase().includes(searchQuery.toLowerCase())))
    : [];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="tenant-badge">
          <span className="tenant-name">{tenantName}</span>
        </div>
      </div>
      
      <div className="topbar-right">
        {/* GLOBAL SEARCH */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <button className="action-btn" onClick={() => { setShowSearch(!showSearch); setShowNotif(false); }}>
            <Search size={20} />
          </button>
          
          {showSearch && (
            <div style={{
              position: 'absolute', top: '40px', right: 0, width: '300px', background: '#fff', 
              borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', zIndex: 100
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
                <Search size={16} className="text-muted" style={{ marginRight: '8px' }} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Buscar activo por ID, serie o nombre..." 
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {searchQuery.length > 1 ? (
                  searchResults.length > 0 ? searchResults.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => { navigate(`/inventory/view/${a.id}`); setShowSearch(false); setSearchQuery(''); }}
                      style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <Box size={14} className="text-muted" />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.id} • {a.status}</div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No se encontraron resultados</div>
                  )
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Escribe 2 letras o más...</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button 
            className="action-btn" 
            onClick={() => { 
              setShowNotif(!showNotif); 
              setShowSearch(false);
              if (!showNotif) {
                setUnreadCount(0); // Limpiar contador al abrir
                if (notifications.length > 0) {
                  localStorage.setItem('scaf_last_audit_id', notifications[0].Id);
                }
              }
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger)', 
                color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotif && (
            <div style={{
              position: 'absolute', top: '40px', right: 0, width: '320px', background: '#fff', 
              borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', zIndex: 100
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Actualizaciones Recientes</h4>
                <div style={{ background: 'var(--accent-primary)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px' }}>{notifications.length}</div>
              </div>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifications.length > 0 ? notifications.map(log => (
                  <div 
                    key={log.Id} 
                    onClick={() => { navigate(`/maintenances/edit/${log.EntityId}`); setShowNotif(false); }}
                    style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', gap: '12px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', padding: '8px', borderRadius: '8px', height: 'fit-content' }}>
                      <Wrench size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: '1.4' }}>{log.Description}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '6px' }}>
                        <Clock size={10} /> {new Date(log.Timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})} por {log.UserName}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Bell size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                    No hay cambios de estado recientes.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
