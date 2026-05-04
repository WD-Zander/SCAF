import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Wrench,
  CalendarDays,
  ListTodo,
  MoreHorizontal,
  X,
  Users,
  Truck,
  FolderTree,
  Activity,
  Settings,
  Layers,
  CalendarRange
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

/**
 * MobileBottomNav
 * Barra de navegación inferior tipo app nativa para móvil (< 769px).
 * En tablet y escritorio este componente no renderiza nada.
 *
 * Tabs principales: Dashboard · Inventario · Mantenimientos · Agenda · Más
 * "Más" abre un panel deslizante con el resto de módulos.
 */
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

  // Cerrar "Más" al navegar
  useEffect(() => {
    setMoreOpen(false);
  }, [location]);

  // Solo renderizar en móvil
  if (!isMobile) return null;

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      {/* ── Panel "Más" (overlay) ── */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 190,
          }}
        />
      )}

      {/* ── Sheet "Más" (desliza desde abajo) ── */}
      {moreOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
          left: 0, right: 0,
          background: '#161b22',
          borderTop: '1px solid #30363d',
          borderRadius: '20px 20px 0 0',
          zIndex: 195,
          padding: '20px 16px 24px',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Handle */}
          <div style={{
            width: 36, height: 4, background: '#30363d',
            borderRadius: 2, margin: '0 auto 20px',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Más módulos
            </span>
            <button onClick={() => setMoreOpen(false)} style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 8, color: '#8b949e', padding: 6, display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* Grid de módulos extra */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              hasPermission('calendar') && { path: '/calendar', label: 'Calendario', icon: <CalendarRange size={22} /> },
              hasPermission('maintenances_view') && { path: '/maintenances/routines', label: 'Rutinas', icon: <CalendarDays size={22} /> },
              hasPermission('maintenances_view') && { path: '/maintenances/work-orders', label: 'En Marcha', icon: <Layers size={22} /> },
              hasPermission('suppliers_view') && { path: '/suppliers', label: 'Proveedores', icon: <Truck size={22} /> },
              hasPermission('users_view') && { path: '/users', label: 'Usuarios', icon: <Users size={22} /> },
              hasPermission('files') && { path: '/files', label: 'Ficheros', icon: <FolderTree size={22} /> },
              hasPermission('audit') && { path: '/audit', label: 'Auditoría', icon: <Activity size={22} /> },
              hasPermission('settings') && { path: '/settings', label: 'Config.', icon: <Settings size={22} /> },
            ].filter(Boolean).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 8, padding: '14px 8px',
                  background: isActive(item.path) ? 'rgba(47,129,247,0.1)' : '#21262d',
                  border: `1px solid ${isActive(item.path) ? 'rgba(47,129,247,0.3)' : '#30363d'}`,
                  borderRadius: 12, color: isActive(item.path) ? '#2f81f7' : '#8b949e',
                  fontSize: '0.7rem', fontWeight: 600, textDecoration: 'none',
                  fontFamily: 'Sora, sans-serif', letterSpacing: '0.01em',
                  textAlign: 'center', lineHeight: 1.2,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Tab Bar principal ── */}
      <nav className="mobile-bottom-nav">
        {/* Dashboard */}
        <NavLink to="/dashboard" className="mobile-nav-tab" style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <>
              <span className="mobile-nav-icon" style={{ background: isActive ? 'rgba(47,129,247,0.12)' : 'transparent', color: isActive ? '#2f81f7' : '#8b949e' }}>
                <LayoutDashboard size={20} />
              </span>
              <span className="mobile-nav-label" style={{ color: isActive ? '#2f81f7' : '#8b949e' }}>Inicio</span>
            </>
          )}
        </NavLink>

        {/* Inventario */}
        {hasPermission('inventory_view') && (
          <NavLink to="/inventory" className="mobile-nav-tab" style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <>
                <span className="mobile-nav-icon" style={{ background: isActive ? 'rgba(47,129,247,0.12)' : 'transparent', color: isActive ? '#2f81f7' : '#8b949e' }}>
                  <Box size={20} />
                </span>
                <span className="mobile-nav-label" style={{ color: isActive ? '#2f81f7' : '#8b949e' }}>Activos</span>
              </>
            )}
          </NavLink>
        )}

        {/* Mantenimientos */}
        {hasPermission('maintenances_view') && (
          <NavLink to="/maintenances" end className="mobile-nav-tab" style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <>
                <span className="mobile-nav-icon" style={{ background: isActive ? 'rgba(47,129,247,0.12)' : 'transparent', color: isActive ? '#2f81f7' : '#8b949e' }}>
                  <Wrench size={20} />
                </span>
                <span className="mobile-nav-label" style={{ color: isActive ? '#2f81f7' : '#8b949e' }}>Tareas</span>
              </>
            )}
          </NavLink>
        )}

        {/* Mi Agenda */}
        <NavLink to="/maintenances/daily" className="mobile-nav-tab" style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <>
              <span className="mobile-nav-icon" style={{ background: isActive ? 'rgba(47,129,247,0.12)' : 'transparent', color: isActive ? '#2f81f7' : '#8b949e' }}>
                <ListTodo size={20} />
              </span>
              <span className="mobile-nav-label" style={{ color: isActive ? '#2f81f7' : '#8b949e' }}>Agenda</span>
            </>
          )}
        </NavLink>

        {/* Más */}
        <button
          className="mobile-nav-tab"
          onClick={() => setMoreOpen(!moreOpen)}
          style={{ color: moreOpen ? '#2f81f7' : '#8b949e' }}
        >
          <span className="mobile-nav-icon" style={{ background: moreOpen ? 'rgba(47,129,247,0.12)' : 'transparent', color: moreOpen ? '#2f81f7' : '#8b949e' }}>
            <MoreHorizontal size={20} />
          </span>
          <span className="mobile-nav-label">Más</span>
        </button>
      </nav>
    </>
  );
};

export default MobileBottomNav;
