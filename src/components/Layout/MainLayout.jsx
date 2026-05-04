import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';
import OfflineBanner from '../PWA/OfflineBanner';
import InstallPrompt from '../PWA/InstallPrompt';
import UpdateToast from '../PWA/UpdateToast';
import './Layout.css';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const location = useLocation();

  useEffect(() => {
    // Auto-close sidebar on mobile when navigating
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [location]);

  return (
    <div className="layout-container">
      {/* Toast de nueva versión — siempre visible, centrado arriba */}
      <UpdateToast />

      {/* Mobile Overlay (solo escritorio/tablet con sidebar abierto) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <Sidebar isOpen={sidebarOpen} />

      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Banner de sin-conexión — se inserta entre topbar y contenido */}
        <OfflineBanner />

        <main className="page-content animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Barra de navegación inferior — solo visible en móvil (< 769px) */}
      <MobileBottomNav />

      {/* Banner de instalación PWA — sobre el bottom nav */}
      <InstallPrompt />
    </div>
  );
};

export default MainLayout;
