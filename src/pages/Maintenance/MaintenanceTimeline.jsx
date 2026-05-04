import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Columns4, 
  Filter,
  Download,
  Search,
  ExternalLink
} from 'lucide-react';

const MaintenanceTimeline = () => {
  const { assets, maintenances } = useAppContext();
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = !categoryFilter || a.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [assets, searchTerm, categoryFilter]);

  const categories = [...new Set(assets.map(a => a.category).filter(Boolean))];

  const getMaintenanceInMonth = (assetId, monthIdx) => {
    return maintenances.filter(m => {
      if (!m.startDate || m.assetId !== assetId) return false;
      const parts = m.startDate.split('-');
      const mYear = parseInt(parts[0], 10);
      const mMonth = parseInt(parts[1], 10) - 1;
      return mYear === year && mMonth === monthIdx;
    });
  };

  const getStatusColor = (status) => {
    if (status === 'COMPLETADO') return '#22c55e';
    if (status === 'EN PROGRESO') return '#eab308';
    return '#ef4444'; // PENDIENTE
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Columns4 className="text-accent" size={32} /> Cronograma Anual
          </h1>
          <p className="text-muted">Vista ejecutiva de la programación preventiva de activos.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
            <button className="btn-secondary" style={{ border: 'none', background: 'transparent' }} onClick={() => setYear(year - 1)}>
              <ChevronLeft size={20} />
            </button>
            <div style={{ padding: '8px 20px', fontWeight: 700, fontSize: '1.1rem', alignSelf: 'center' }}>{year}</div>
            <button className="btn-secondary" style={{ border: 'none', background: 'transparent' }} onClick={() => setYear(year + 1)}>
              <ChevronRight size={20} />
            </button>
          </div>
          <button className="btn-primary" onClick={() => window.print()}>
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-group" style={{ margin: 0, minWidth: '250px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              style={{ paddingLeft: '40px' }} 
              placeholder="Buscar activo o ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="input-group" style={{ margin: 0, minWidth: '200px' }}>
          <select className="input-control" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">Todas las Categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="text-muted" style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>
          <Filter size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Mostrando {filteredAssets.length} activos
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
        <div style={{ minWidth: '1200px' }}>
          {/* Timeline Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid var(--glass-border)', width: '250px', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                  Activo / Equipo
                </th>
                {months.map((m, idx) => (
                  <th key={m} style={{ padding: '16px 8px', textAlign: 'center', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {m.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ padding: '60px', textAlign: 'center' }} className="text-muted">
                    No se encontraron activos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="hoverable-row">
                    <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--glass-border)', position: 'sticky', left: 0, background: '#fff', zIndex: 9 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{asset.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{asset.id}</div>
                    </td>
                    {months.map((_, mIdx) => {
                      const mnts = getMaintenanceInMonth(asset.id, mIdx);
                      return (
                        <td key={mIdx} style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)', borderLeft: '1px solid var(--glass-border)', minHeight: '60px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {mnts.map(m => (
                              <div 
                                key={m.id}
                                onClick={() => navigate(`/maintenances/view/${m.id}`)}
                                style={{ 
                                  background: getStatusColor(m.status),
                                  color: '#fff',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  transition: 'transform 0.1s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                title={`${m.id}: ${m.title}`}
                              >
                                <ExternalLink size={10} /> {m.id}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', gap: '24px', padding: '24px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Leyenda:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#22c55e' }}></div> Completado
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#eab308' }}></div> En Progreso
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }}></div> Pendiente / Vencido
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTimeline;
