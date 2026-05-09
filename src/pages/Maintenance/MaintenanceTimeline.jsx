import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Columns4,
  Filter,
  Download,
  Search,
  ExternalLink,
  History
} from 'lucide-react';

const MaintenanceTimeline = () => {
  const { assets, maintenances, maintenanceScopes } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scope = searchParams.get('scope');
  const scopeLabel = maintenanceScopes.find(s => s.slug === scope)?.nombre || '';
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [subFamilyFilter, setSubFamilyFilter] = useState('');

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Opciones de filtros derivadas de los activos
  const categories = useMemo(() => (
    [...new Set(assets.map(a => a.category).filter(Boolean))].sort()
  ), [assets]);

  const families = useMemo(() => {
    if (!categoryFilter) return [...new Set(assets.map(a => a.family).filter(Boolean))].sort();
    return [...new Set(
      assets.filter(a => a.category === categoryFilter).map(a => a.family).filter(Boolean)
    )].sort();
  }, [assets, categoryFilter]);

  const subFamilies = useMemo(() => {
    const base = categoryFilter ? assets.filter(a => a.category === categoryFilter) : assets;
    const withFam = familyFilter ? base.filter(a => a.family === familyFilter) : base;
    return [...new Set(withFam.map(a => a.subFamily).filter(Boolean))].sort();
  }, [assets, categoryFilter, familyFilter]);

  // Resetear familia/subfamilia cuando cambia categoría
  const handleCategoryChange = (val) => {
    setCategoryFilter(val);
    setFamilyFilter('');
    setSubFamilyFilter('');
  };

  const handleFamilyChange = (val) => {
    setFamilyFilter(val);
    setSubFamilyFilter('');
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = !categoryFilter || a.category === categoryFilter;
      const matchesFam = !familyFilter || a.family === familyFilter;
      const matchesSub = !subFamilyFilter || a.subFamily === subFamilyFilter;
      return matchesSearch && matchesCat && matchesFam && matchesSub;
    });
  }, [assets, searchTerm, categoryFilter, familyFilter, subFamilyFilter]);

  const scopedMaintenances = useMemo(() => {
    if (!scope) return maintenances;
    return maintenances.filter(m => m.scope === scope);
  }, [maintenances, scope]);

  const getMaintenanceInMonth = (assetId, monthIdx) => {
    return scopedMaintenances.filter(m => {
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
    return '#ef4444';
  };

  const activeFiltersCount = [categoryFilter, familyFilter, subFamilyFilter, searchTerm].filter(Boolean).length;
  const hasFilters = activeFiltersCount > 0;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Columns4 className="text-accent" size={32} /> Cronograma Anual
            {scopeLabel && <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', background: 'var(--accent-light)', color: 'var(--accent-primary)', fontWeight: 600 }}>{scopeLabel}</span>}
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

      {/* Panel de Filtros */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Buscador */}
          <div className="input-group" style={{ margin: 0, minWidth: '240px', flex: '1 1 240px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Buscar activo o ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="input-group" style={{ margin: 0, minWidth: '180px', flex: '1 1 180px' }}>
            <select className="input-control" value={categoryFilter} onChange={e => handleCategoryChange(e.target.value)}>
              <option value="">Todas las Categorías</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Familia */}
          <div className="input-group" style={{ margin: 0, minWidth: '160px', flex: '1 1 160px' }}>
            <select
              className="input-control"
              value={familyFilter}
              onChange={e => handleFamilyChange(e.target.value)}
              disabled={families.length === 0}
            >
              <option value="">Todas las Familias</option>
              {families.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* SubFamilia */}
          <div className="input-group" style={{ margin: 0, minWidth: '160px', flex: '1 1 160px' }}>
            <select
              className="input-control"
              value={subFamilyFilter}
              onChange={e => setSubFamilyFilter(e.target.value)}
              disabled={subFamilies.length === 0}
            >
              <option value="">Todas las SubFamilias</option>
              {subFamilies.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Contador + limpiar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            <span className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} />
              Mostrando <strong>{filteredAssets.length}</strong> activos
              {activeFiltersCount > 0 && <span style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem' }}>{activeFiltersCount}</span>}
            </span>
            {activeFiltersCount > 0 && (
              <button
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                onClick={() => { setCategoryFilter(''); setFamilyFilter(''); setSubFamilyFilter(''); setSearchTerm(''); }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla anual */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
        <div style={{ minWidth: '1200px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid var(--glass-border)', width: '260px', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                  Activo / Equipo
                </th>
                {months.map((m) => (
                  <th key={m} style={{ padding: '16px 8px', textAlign: 'center', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {m.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!hasFilters ? (
                <tr>
                  <td colSpan="13" style={{ padding: '80px 20px', textAlign: 'center' }} className="text-muted">
                    <Filter size={36} style={{ opacity: 0.2, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Aplica un filtro para ver el cronograma</p>
                    <p style={{ fontSize: '0.85rem' }}>Usa los filtros de arriba para buscar por nombre, categoría, familia o subfamilia.</p>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ padding: '60px', textAlign: 'center' }} className="text-muted">
                    No se encontraron activos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="hoverable-row">
                    <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--glass-border)', position: 'sticky', left: 0, background: '#fff', zIndex: 9 }}>
                      <div
                        style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => navigate(`/inventory/history/${asset.id}`)}
                        title="Ver historial completo del activo"
                      >
                        <History size={13} />
                        {asset.name}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{asset.id}</div>
                      {(asset.family || asset.subFamily) && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', opacity: 0.75 }}>
                          {[asset.family, asset.subFamily].filter(Boolean).join(' › ')}
                        </div>
                      )}
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

      {/* Leyenda */}
      <div style={{ marginTop: '32px', display: 'flex', gap: '24px', padding: '24px', background: 'var(--bg-tertiary)', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginLeft: 'auto' }}>
          <History size={14} color="var(--accent-primary)" />
          <span className="text-muted">Clic en el nombre del activo para ver su historial completo</span>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTimeline;
