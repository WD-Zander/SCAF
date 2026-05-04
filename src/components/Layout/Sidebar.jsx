import React from 'react';
import { NavLink } from 'react-router-dom';
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
  PackageOpen
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const Sidebar = ({ isOpen }) => {
  const { currentUser, setCurrentUser, dbConnected } = useAppContext();

  const [expanded, setExpanded] = React.useState({ maintenances: false, settings: false });

  const toggleGroup = (groupId) => {
    setExpanded(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const menuGroups = [
    { id: 'dashboard', path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard className="nav-icon" /> },
    { id: 'inventory', path: '/inventory', name: 'Inventario', icon: <Box className="nav-icon" /> },
    { id: 'movements', path: '/movements', name: 'Movimientos', icon: <PackageOpen className="nav-icon" /> },
    { id: 'calendar', path: '/calendar', name: 'Calendario', icon: <CalendarDays className="nav-icon" /> },
    // { id: 'assignments', path: '/assignments', name: 'Asignaciones', icon: <Users className="nav-icon" /> },
    { 
      id: 'maintenances', name: 'Mantenimientos', icon: <Wrench className="nav-icon" />, 
      isGroup: true,
      children: [
        { id: 'maintenances', path: '/maintenances', name: 'Lista General', icon: <Wrench className="nav-icon" size={14} /> },
        { id: 'maintenances', path: '/maintenances/routines', name: 'Programación', icon: <Activity className="nav-icon" size={14} /> },
        { id: 'maintenances', path: '/maintenances/work-orders', name: 'Planes en Marcha', icon: <Layers className="nav-icon" size={14} /> },
        { id: 'maintenances', path: '/maintenances/timeline', name: 'Cronograma', icon: <Columns4 className="nav-icon" size={14} /> },
        { id: 'maintenances', path: '/maintenances/daily', name: 'Mi Agenda Diaria', icon: <ListTodo className="nav-icon" size={14} /> },
        { id: 'maintenances', path: '/maintenances/rescheduled', name: 'Reprogramados', icon: <CalendarClock className="nav-icon" size={14} /> },
      ]
    },
    { 
      id: 'settings', name: 'Sistema y Config', icon: <Building2 className="nav-icon" />, 
      isGroup: true,
      children: [
        { id: 'suppliers', path: '/suppliers', name: 'Proveedores', icon: <Truck className="nav-icon" size={14} /> },
        { id: 'users', path: '/users', name: 'Usuarios', icon: <Users className="nav-icon" size={14} /> },
        { id: 'files', path: '/files', name: 'Ficheros', icon: <FolderTree className="nav-icon" size={14} /> },
        { id: 'audit', path: '/audit', name: 'Auditoría', icon: <Activity className="nav-icon" size={14} /> },
        { id: 'settings', path: '/settings', name: 'Configuración', icon: <Settings className="nav-icon" size={14} /> },
      ]
    }
  ];

  const hasPermission = (id) => {
    const perms = currentUser.role?.permissions || [];
    if (perms.includes('all')) return true;
    // Direct match (old-style IDs like 'dashboard', 'calendar', 'audit', 'files', 'settings')
    if (perms.includes(id)) return true;
    // Check granular match: if user has ANY perm starting with the module prefix (e.g. 'inventory_view' matches 'inventory')
    return perms.some(p => p.startsWith(id + '_'));
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
                  className={`nav-item`} 
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
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', marginTop: '4px', borderLeft: '1px solid var(--glass-border)', marginLeft: '22px', gap: '4px' }}>
                    {group.children.map(child => hasPermission(child.id) && (
                      <NavLink 
                        to={child.path} 
                        key={child.name}
                        end={child.path === '/maintenances'} // Para evitar que "Lista General" quede activa siempre
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        style={{ padding: '8px 12px', minHeight: '36px' }}
                      >
                        <span className="nav-label" style={{ fontSize: '0.85rem' }}>{child.name}</span>
                      </NavLink>
                    ))}
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
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          justifyContent: isOpen ? 'flex-start' : 'center',
          width: '100%',
          padding: isOpen ? '0 4px' : '0'
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
            fontWeight: 700,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            {dbConnected ? 'SQL Online' : 'SQL Offline'}
          </span>}
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          width: '100%',
          justifyContent: isOpen ? 'flex-start' : 'center'
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
