import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Users,
  Settings,
  Building2,
  Truck,
  FolderTree,
  Wrench,
  Activity,
  CalendarDays,
  ListTodo,
  Columns4,
  Layers,
  CalendarClock,
  PackageOpen,
  UserCheck,
  MapPin, DoorOpen, Home, Package,
  Warehouse, Zap, Star, LayoutGrid,
  Hammer, ShieldCheck, Thermometer, Droplets, Bolt, Wind,
  ClipboardList, ChevronRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const ICON_MAP = {
  MapPin, DoorOpen, Box, Building2, Home, Layers, Package,
  Warehouse, Zap, Settings, Star, LayoutGrid, Activity,
  Hammer, ShieldCheck, Thermometer, Droplets, Bolt, Wind, Wrench,
};

const ScopeIcon = ({ name, size = 14 }) => {
  const Comp = ICON_MAP[name] || Wrench;
  return <Comp size={size} />;
};

const Sidebar = ({ isOpen }) => {
  const { currentUser, dbConnected, maintenanceScopes } = useAppContext();
  const location = useLocation();

  const [expanded, setExpanded] = React.useState({ maintenances: false, settings: false });
  const [expandedScopes, setExpandedScopes] = React.useState({});

  const toggleGroup = (groupId) => {
    setExpanded(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleScope = (slug) => {
    setExpandedScopes(prev => {
      // If already open, close it; otherwise close all and open this one
      if (prev[slug]) return { ...prev, [slug]: false };
      const reset = {};
      Object.keys(prev).forEach(k => reset[k] = false);
      return { ...reset, [slug]: true };
    });
  };

  // Check if a scope's sub-module is currently active
  const isScopeChildActive = (slug, path) => {
    const searchParams = new URLSearchParams(location.search);
    const currentScope = searchParams.get('scope');
    return location.pathname === path && currentScope === slug;
  };

  const isScopeActive = (slug) => {
    const searchParams = new URLSearchParams(location.search);
    const currentScope = searchParams.get('scope');
    // Active if we're on the list page for this scope OR any sub-module with this scope
    if (location.pathname === `/maintenances/list/${slug}`) return true;
    if (currentScope === slug) return true;
    return false;
  };

  const activeScopes = useMemo(() => {
    return (maintenanceScopes || []).filter(s => s.activo !== false);
  }, [maintenanceScopes]);

  const menuGroups = [
    { id: 'dashboard', path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard className="nav-icon" /> },
    { id: 'inventory', path: '/inventory', name: 'Inventario', icon: <Box className="nav-icon" /> },
    { id: 'movements', path: '/movements', name: 'Movimientos', icon: <PackageOpen className="nav-icon" /> },
    { id: 'calendar', path: '/calendar', name: 'Calendario', icon: <CalendarDays className="nav-icon" /> },
    {
      id: 'maintenances', name: 'Operaciones', icon: <Wrench className="nav-icon" />,
      isGroup: true,
      hasScopeChildren: true,
    },
    {
      id: 'settings', name: 'Sistema y Config', icon: <Building2 className="nav-icon" />,
      isGroup: true,
      children: [
        { id: 'suppliers', path: '/suppliers', name: 'Proveedores', icon: <Truck className="nav-icon" size={14} /> },
        { id: 'employees', path: '/employees', name: 'Empleados', icon: <UserCheck className="nav-icon" size={14} /> },
        { id: 'users', path: '/users', name: 'Usuarios', icon: <Users className="nav-icon" size={14} /> },
        { id: 'files', path: '/files', name: 'Ficheros', icon: <FolderTree className="nav-icon" size={14} /> },
        { id: 'audit', path: '/audit', name: 'Auditoría', icon: <Activity className="nav-icon" size={14} /> },
        { id: 'settings', path: '/settings', name: 'Configuración', icon: <Settings className="nav-icon" size={14} /> },
      ]
    }
  ];

  const scopeSubModules = [
    { suffix: 'list',         name: 'Lista General',    icon: <ClipboardList size={13} /> },
    { suffix: 'routines',     name: 'Programación',     icon: <Activity size={13} /> },
    { suffix: 'work-orders',  name: 'Planes en Marcha', icon: <Layers size={13} /> },
    { suffix: 'timeline',     name: 'Cronograma',       icon: <Columns4 size={13} /> },
    { suffix: 'daily',        name: 'Mi Agenda Diaria', icon: <ListTodo size={13} /> },
    { suffix: 'rescheduled',  name: 'Reprogramados',    icon: <CalendarClock size={13} /> },
  ];

  const hasPermission = (id) => {
    const perms = currentUser.role?.permissions || [];
    if (perms.includes('all')) return true;
    if (perms.includes(id)) return true;
    return perms.some(p => p.startsWith(id + '_'));
  };

  const renderScopeChildren = () => {
    return (
      <>
        {/* Dynamic scope sub-groups */}
        {activeScopes.map(scope => {
          const isScopeOpen = expandedScopes[scope.slug];
          const isActive = isScopeActive(scope.slug);

          return (
            <div key={scope.slug}>
              {/* Scope header — clickable to expand */}
              <div
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => toggleScope(scope.slug)}
                style={{
                  cursor: 'pointer',
                  padding: '7px 10px',
                  minHeight: '32px',
                  borderRadius: '6px',
                  gap: '8px',
                }}
              >
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: scope.color, flexShrink: 0,
                }} />
                <span className="nav-label" style={{ fontSize: '0.82rem', flex: 1 }}>{scope.nombre}</span>
                <ChevronRight size={12} style={{
                  transition: 'transform 0.2s',
                  transform: isScopeOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  opacity: 0.5,
                  flexShrink: 0,
                }} />
              </div>

              {/* Scope sub-modules */}
              {isScopeOpen && (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  paddingLeft: '14px', marginLeft: '12px',
                  borderLeft: `2px solid ${scope.color}40`,
                  gap: '1px', marginTop: '2px', marginBottom: '4px',
                }}>
                  {scopeSubModules.map(mod => {
                    // "list" goes to /maintenances/list/:slug, others go to /maintenances/:suffix?scope=slug
                    const path = mod.suffix === 'list'
                      ? `/maintenances/list/${scope.slug}`
                      : `/maintenances/${mod.suffix}?scope=${scope.slug}`;

                    const isChildActive = mod.suffix === 'list'
                      ? location.pathname === `/maintenances/list/${scope.slug}`
                      : isScopeChildActive(scope.slug, `/maintenances/${mod.suffix}`);

                    return (
                      <NavLink
                        to={path}
                        key={mod.suffix}
                        className={`nav-item ${isChildActive ? 'active' : ''}`}
                        style={{
                          padding: '5px 10px',
                          minHeight: '28px',
                          borderRadius: '5px',
                          fontSize: '0.78rem',
                          gap: '7px',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span style={{ opacity: 0.6 }}>{mod.icon}</span>
                        <span className="nav-label" style={{ fontSize: '0.78rem' }}>{mod.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Separator */}
        {activeScopes.length > 0 && (
          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '6px 12px 6px 0' }} />
        )}

        {/* Config link */}
        <NavLink
          to="/maintenances"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={{ padding: '7px 10px', minHeight: '32px', borderRadius: '6px', gap: '8px' }}
        >
          <Settings size={13} style={{ opacity: 0.6 }} />
          <span className="nav-label" style={{ fontSize: '0.82rem' }}>Configurar Módulos</span>
        </NavLink>
      </>
    );
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo-text">
          {isOpen ? <><span className="logo-accent">SC</span>AF</> : <span className="logo-accent">S</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuGroups.map((group) => {
          if (!hasPermission(group.id)) return null;

          if (group.isGroup) {
            const isGroupOpen = expanded[group.id];
            return (
              <div key={group.name}>
                <div
                  className="nav-item"
                  style={{ cursor: 'pointer', opacity: 0.8 }}
                  onClick={() => toggleGroup(group.id)}
                >
                  {group.icon}
                  {isOpen && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span className="nav-label" style={{ fontWeight: 600 }}>{group.name}</span>
                      <span style={{ transform: isGroupOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', fontSize: '0.8rem' }}>▶</span>
                    </div>
                  )}
                </div>
                {isOpen && isGroupOpen && (
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    paddingLeft: '16px', marginTop: '4px',
                    borderLeft: '1px solid var(--glass-border)', marginLeft: '22px',
                    gap: '2px',
                  }}>
                    {group.hasScopeChildren
                      ? renderScopeChildren()
                      : group.children?.map(child => {
                          if (!hasPermission(child.id)) return null;
                          return (
                            <NavLink
                              to={child.path}
                              key={child.path}
                              end={child.matchExact === true}
                              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                              style={{ padding: '7px 12px', minHeight: '34px', borderRadius: '6px' }}
                            >
                              <span className="nav-label" style={{ fontSize: '0.83rem' }}>{child.name}</span>
                            </NavLink>
                          );
                        })
                    }
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              to={group.path}
              key={group.name}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {group.icon}
              <span className="nav-label">{group.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          justifyContent: isOpen ? 'flex-start' : 'center',
          width: '100%', padding: isOpen ? '0 4px' : '0'
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: dbConnected ? '#22c55e' : '#ef4444',
            boxShadow: dbConnected ? '0 0 10px #22c55e' : '0 0 10px #ef4444',
            flexShrink: 0
          }} title={dbConnected ? "Conectado a SQL Server" : "Desconectado de SQL Server"}></div>
          {isOpen && <span style={{
            fontSize: '0.7rem',
            color: dbConnected ? '#22c55e' : '#ef4444',
            fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase'
          }}>
            {dbConnected ? 'SQL Online' : 'SQL Offline'}
          </span>}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          width: '100%', justifyContent: isOpen ? 'flex-start' : 'center'
        }}>
          <div className="avatar">{currentUser.avatar}</div>
          {isOpen && (
            <div className="user-info">
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </div>
              <div className="user-role">{currentUser.role?.name || 'Usuario'}</div>
            </div>
          )}
        </div>

        {isOpen && (
          <button
            className="btn-secondary"
            style={{ width: '100%', marginTop: '12px', padding: '6px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
            onClick={() => {
              localStorage.removeItem('scaf_token');
              localStorage.removeItem('scaf_user');
              window.location.href = '/login';
            }}
          >
            Cerrar Sesión
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
