import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Wrench } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

import {
  MapPin, DoorOpen, Box, Building2, Home, Layers, Package,
  Warehouse, Zap, Settings, Star, LayoutGrid, Activity,
  Hammer, ShieldCheck, Thermometer, Droplets, Bolt, Wind
} from 'lucide-react';

const ICON_MAP = {
  MapPin, DoorOpen, Box, Building2, Home, Layers, Package,
  Warehouse, Zap, Settings, Star, LayoutGrid, Activity,
  Hammer, ShieldCheck, Thermometer, Droplets, Bolt, Wind, Wrench,
};

const IconComponent = ({ name, size = 36 }) => {
  const Comp = ICON_MAP[name] || Wrench;
  return <Comp size={size} />;
};

const ScopeGate = ({ title, subtitle, children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { maintenanceScopes } = useAppContext();

  const scope = searchParams.get('scope');

  if (scope) return children;

  const activeScopes = maintenanceScopes.filter(s => s.activo !== false);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <button
          className="btn-secondary"
          onClick={() => navigate(-1)}
          style={{ padding: '8px', borderRadius: '50%', flexShrink: 0 }}
          title="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '1.5rem' }}>{title}</h1>
          <p className="text-muted">{subtitle || 'Selecciona el tipo de mantenimiento.'}</p>
        </div>
      </div>

      {/* Scope cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {activeScopes.map((s) => (
          <div
            key={s.id}
            className="glass-panel"
            onClick={() => setSearchParams({ scope: s.slug })}
            style={{
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              border: `1px solid ${s.color}25`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {/* Color accent bar */}
            <div style={{ height: '3px', background: s.color }} />

            <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: `${s.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color, flexShrink: 0,
              }}>
                <IconComponent name={s.icono} size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px', color: 'var(--text-main)' }}>{s.nombre}</h3>
                <span style={{ fontSize: '0.78rem', color: s.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Abrir <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </div>
        ))}

        {activeScopes.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
            <Wrench size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
            <p className="text-muted">No hay módulos configurados. Ve a <strong>Configurar Módulos</strong> para crearlos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScopeGate;
