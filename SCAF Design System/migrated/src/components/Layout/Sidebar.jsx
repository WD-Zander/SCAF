import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Box, Wrench, ClipboardList, Users, Settings,
  Database, BookText, ChevronLeft,
} from 'lucide-react';
import './Layout.css';

const SECTIONS = [
  {
    title: null,
    items: [
      { to: '/dashboard', label: 'Dashboard',   Icon: LayoutDashboard },
      { to: '/inventory', label: 'Inventario',  Icon: Box },
    ],
  },
  {
    title: 'Mantenimientos',
    items: [
      { to: '/maintenance/schedule', label: 'Mi Agenda',       Icon: ClipboardList },
      { to: '/maintenance',          label: 'Órdenes (PM)',    Icon: Wrench },
    ],
  },
  {
    title: 'Sistema y Config',
    items: [
      { to: '/users',     label: 'Usuarios',  Icon: Users },
      { to: '/audit',     label: 'Auditoría', Icon: BookText },
      { to: '/settings',  label: 'Ajustes',   Icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onToggle }) {
  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        {open ? (
          <span className="logo-text">SCAF<span className="logo-accent">.</span></span>
        ) : (
          <span className="logo-text logo-accent">S</span>
        )}
        <button className="sidebar-collapse" onClick={onToggle} aria-label="Colapsar menú">
          <ChevronLeft size={16} style={{ transform: open ? 'none' : 'rotate(180deg)', transition: 'transform .2s' }} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {SECTIONS.map((sec, si) => (
          <div key={si} style={{ marginBottom: 14 }}>
            {sec.title && open && (
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                padding: '8px 16px 6px',
              }}>{sec.title}</div>
            )}
            {sec.items.map((it) => (
              <NavLink key={it.to} to={it.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <it.Icon className="nav-icon" size={18} />
                <span className="nav-label">{it.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">CL</div>
          <div className="user-info">
            <span className="user-name">Carlos López</span>
            <span className="user-role">Técnico · Sede Norte</span>
          </div>
        </div>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: 'var(--success)',
              boxShadow: '0 0 0 3px var(--success-bg)', animation: 'pulse 2s infinite',
            }} />
            <span><Database size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />Sincronizado · ahora</span>
          </div>
        )}
      </div>
    </aside>
  );
}
