import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Box, ClipboardList, Bell, User } from 'lucide-react';
import './Layout.css';

const ITEMS = [
  { to: '/dashboard',            label: 'Inicio',    Icon: LayoutDashboard },
  { to: '/inventory',            label: 'Activos',   Icon: Box },
  { to: '/maintenance/schedule', label: 'Agenda',    Icon: ClipboardList, primary: true },
  { to: '/notifications',        label: 'Alertas',   Icon: Bell, badge: 3 },
  { to: '/profile',              label: 'Perfil',    Icon: User },
];

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
      {ITEMS.map((it) => (
        <NavLink key={it.to} to={it.to} className={({ isActive }) => `mbn-item ${isActive ? 'active' : ''} ${it.primary ? 'primary' : ''}`}>
          <span className="mbn-icon-wrap">
            <it.Icon size={it.primary ? 22 : 20} />
            {it.badge && <span className="mbn-badge">{it.badge}</span>}
          </span>
          <span className="mbn-label">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
