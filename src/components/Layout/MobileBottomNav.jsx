import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Box, Wrench, ListTodo, MoreHorizontal, X,
  Users, Truck, FolderTree, Activity, Settings, Layers,
  CalendarRange, CalendarDays,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './Layout.css';

const MobileBottomNav = () => {
  const { hasPermission } = useAppContext();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [location]);

  if (!isMobile) return null;

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      {/* Overlay */}
      {moreOpen && (
        <div onClick={() => setMoreOpen(false)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          zIndex: 190,
        }} />
      )}

      {/* "More" sheet */}
      {moreOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
          left: 0, right: 0,
          background: '#fff', borderTop: '1px solid var(--glass-border)',
          borderRadius: '16px 16px 0 0', zIndex: 195,
          padding: '16px 14px 20px',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.08)',
        }}>
          <div style={{ width: 32, height: 3, background: 'var(--glass-border)', borderRadius: 2, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Más módulos</span>
            <button onClick={() => setMoreOpen(false)} style={{
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', padding: 5, display: 'flex', cursor: 'pointer',
            }}><X size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              hasPermission('calendar_view') && { path: '/calendar', label: 'Calendario', Icon: CalendarRange },
              hasPermission('maintenances_view') && { path: '/maintenances/routines', label: 'Rutinas', Icon: CalendarDays },
              hasPermission('maintenances_view') && { path: '/maintenances/work-orders', label: 'En Marcha', Icon: Layers },
              hasPermission('suppliers_view') && { path: '/suppliers', label: 'Proveedores', Icon: Truck },
              hasPermission('users_view') && { path: '/users', label: 'Usuarios', Icon: Users },
              hasPermission('files_view') && { path: '/files', label: 'Ficheros', Icon: FolderTree },
              hasPermission('audit_view') && { path: '/audit', label: 'Auditoría', Icon: Activity },
              hasPermission('settings_view') && { path: '/settings', label: 'Config.', Icon: Settings },
            ].filter(Boolean).map(item => (
              <NavLink key={item.path} to={item.path} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '12px 8px',
                background: isActive(item.path) ? 'var(--accent-light)' : 'var(--bg-secondary)',
                border: `1px solid ${isActive(item.path) ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '0.68rem', fontWeight: 600, textDecoration: 'none', textAlign: 'center',
              }}>
                <item.Icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
        <NavLink to="/dashboard" className={({ isActive: a }) => `mbn-item ${a ? 'active' : ''}`}>
          <span className="mbn-icon-wrap"><LayoutDashboard size={20} /></span>
          <span className="mbn-label">Inicio</span>
        </NavLink>

        {hasPermission('inventory_view') && (
          <NavLink to="/inventory" className={({ isActive: a }) => `mbn-item ${a ? 'active' : ''}`}>
            <span className="mbn-icon-wrap"><Box size={20} /></span>
            <span className="mbn-label">Activos</span>
          </NavLink>
        )}

        {hasPermission('maintenances_view') && (
          <NavLink to="/maintenances" end className={({ isActive: a }) => `mbn-item ${a ? 'active' : ''} primary`}>
            <span className="mbn-icon-wrap"><Wrench size={22} /></span>
            <span className="mbn-label">Mant.</span>
          </NavLink>
        )}

        <NavLink to="/maintenances/daily" className={({ isActive: a }) => `mbn-item ${a ? 'active' : ''}`}>
          <span className="mbn-icon-wrap"><ListTodo size={20} /></span>
          <span className="mbn-label">Agenda</span>
        </NavLink>

        <button className={`mbn-item ${moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen(o => !o)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <span className="mbn-icon-wrap"><MoreHorizontal size={20} /></span>
          <span className="mbn-label">Más</span>
        </button>
      </nav>
    </>
  );
};

export default MobileBottomNav;
