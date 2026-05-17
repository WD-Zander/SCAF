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
  ExternalLink,
  History
} from 'lucide-react';
import SearchableSelect from '../../components/Common/SearchableSelect';
import Pagination from '../../components/Common/Pagination';

const MaintenanceTimeline = () => {
  const { assets, maintenances, maintenanceScopes, getCategoriesForScope, getEntitiesForScope } = useAppContext();
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [subFamilyFilter, setSubFamilyFilter] = useState('');

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const activeScopes = useMemo(() =>
    (maintenanceScopes || []).filter(s => s.activo !== false),
  [maintenanceScopes]);

  // Resolve scope object and entities
  const selectedScope = activeScopes.find(s => s.slug === scopeFilter);
  const scopeColor = selectedScope?.color || 'var(--accent-primary)';

  // Get the correct entities for the selected scope (assets, areas, rooms, etc.)
  const scopeEntities = useMemo(() => {
    if (!scopeFilter) return { type: 'activo', items: [], label: 'Activo', labelPlural: 'Activos' };
    return getEntitiesForScope(scopeFilter);
  }, [scopeFilter, getEntitiesForScope]);

  // For "activo" type, filter by scope via scopeId on asset
  const scopeFilteredItems = useMemo(() => {
    if (!scopeFilter) return [];
    const items = scopeEntities.items;
    if (scopeEntities.type === 'activo' && selectedScope) {
      return items.filter(a => a.scopeId === selectedScope.id);
    }
    return items;
  }, [scopeFilter, scopeEntities, selectedScope]);

  // Categories for selected scope
  const scopeTree = useMemo(() => {
    if (!scopeFilter) return [];
    return getCategoriesForScope(scopeFilter);
  }, [scopeFilter, getCategoriesForScope]);

  // Root categories (level 1)
  const rootCategories = useMemo(() =>
    scopeTree.map(c => ({ value: c.name, label: c.name })),
  [scopeTree]);

  // Sections (level 2)
  const sections = useMemo(() => {
    if (!categoryFilter) return [];
    const cat = scopeTree.find(c => c.name === categoryFilter);
    return (cat?.children || []).map(s => ({ value: s.name, label: s.name }));
  }, [scopeTree, categoryFilter]);

  // Families (level 3)
  const familiesOpts = useMemo(() => {
    if (!sectionFilter) return [];
    const cat = scopeTree.find(c => c.name === categoryFilter);
    const sec = (cat?.children || []).find(s => s.name === sectionFilter);
    return (sec?.children || []).map(f => ({ value: f.name, label: f.name }));
  }, [scopeTree, categoryFilter, sectionFilter]);

  // SubFamilies (level 4)
  const subFamiliesOpts = useMemo(() => {
    if (!familyFilter) return [];
    const cat = scopeTree.find(c => c.name === categoryFilter);
    const sec = (cat?.children || []).find(s => s.name === sectionFilter);
    const fam = (sec?.children || []).find(f => f.name === familyFilter);
    return (fam?.children || []).map(sf => ({ value: sf.name, label: sf.name }));
  }, [scopeTree, categoryFilter, sectionFilter, familyFilter]);

  // Cascade resets
  const handleScopeChange = (val) => {
    setScopeFilter(val);
    setCategoryFilter('');
    setSectionFilter('');
    setFamilyFilter('');
    setSubFamilyFilter('');
    setCurrentPage(1);
  };

  const handleCategoryChange = (val) => {
    setCategoryFilter(val);
    setSectionFilter('');
    setFamilyFilter('');
    setSubFamilyFilter('');
    setCurrentPage(1);
  };

  const handleSectionChange = (val) => {
    setSectionFilter(val);
    setFamilyFilter('');
    setSubFamilyFilter('');
    setCurrentPage(1);
  };

  const handleFamilyChange = (val) => {
    setFamilyFilter(val);
    setSubFamilyFilter('');
    setCurrentPage(1);
  };

  // Filter maintenances by scope
  const scopedMaintenances = useMemo(() => {
    if (!scopeFilter) return maintenances;
    return maintenances.filter(m => m.scope === scopeFilter);
  }, [maintenances, scopeFilter]);

  // Filter items by search + category chain + must have at least one maintenance
  const filteredItems = useMemo(() => {
    return scopeFilteredItems.filter(item => {
      const id = item.id || '';

      // Only show entities that have at least one maintenance/task scheduled
      const hasMaintenance = scopedMaintenances.some(m => {
        const mEntityId = m.entityId || m.assetId;
        return mEntityId === id;
      });
      if (!hasMaintenance) return false;

      // Generic name/id search — works for assets and infra items
      const name = item.name || item.nombre || '';
      const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase()) || id.toLowerCase?.().includes(searchTerm.toLowerCase());

      // Category filters (for assets)
      const matchesCat = !categoryFilter || item.category === categoryFilter;
      const matchesSec = !sectionFilter || item.sectionName === sectionFilter;
      const matchesFam = !familyFilter || item.family === familyFilter;
      const matchesSub = !subFamilyFilter || item.subFamily === subFamilyFilter;

      // For infra items, match by category name if available
      if (scopeEntities.type !== 'activo') {
        const itemCat = item.categoryName || item.categoria || '';
        const matchesInfraCat = !categoryFilter || itemCat === categoryFilter;
        return matchesSearch && matchesInfraCat;
      }

      return matchesSearch && matchesCat && matchesSec && matchesFam && matchesSub;
    });
  }, [scopeFilteredItems, searchTerm, categoryFilter, sectionFilter, familyFilter, subFamilyFilter, scopeEntities.type, scopedMaintenances]);

  const getMaintenanceInMonth = (entityId, monthIdx) => {
    return scopedMaintenances.filter(m => {
      if (!m.startDate) return false;
      // Match by assetId (for activos) or entityId (for infra items)
      const mEntityId = m.entityId || m.assetId;
      if (mEntityId !== entityId) return false;
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

  const activeFiltersCount = [scopeFilter, categoryFilter, sectionFilter, familyFilter, subFamilyFilter, searchTerm].filter(Boolean).length;
  const hasFilters = scopeFilter; // At minimum, scope must be selected

  const clearAll = () => {
    setScopeFilter('');
    setCategoryFilter('');
    setSectionFilter('');
    setFamilyFilter('');
    setSubFamilyFilter('');
    setSearchTerm('');
  };

  // Determine if current scope is asset-based
  const isAssetScope = scopeEntities.type === 'activo';

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Columns4 className="text-accent" size={32} /> Cronograma Anual
            {selectedScope && <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', background: `${scopeColor}18`, color: scopeColor, fontWeight: 600 }}>{selectedScope.nombre}</span>}
          </h1>
          <p className="text-muted">Vista ejecutiva de la programación preventiva por módulo.</p>
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
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Buscador */}
          <div style={{ margin: 0, minWidth: '200px', flex: '1 1 200px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '38px' }}
                placeholder={`Buscar ${scopeEntities.label?.toLowerCase() || 'activo'} o ID...`}
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Módulo / Scope */}
          <div style={{ margin: 0, minWidth: '180px', flex: '1 1 180px' }}>
            <SearchableSelect
              value={scopeFilter}
              onChange={(value) => handleScopeChange(value)}
              options={activeScopes.map(s => ({ value: s.slug, label: s.nombre }))}
              placeholder="Tipo de Mantenimiento"
              clearable
              color={scopeColor}
            />
          </div>

          {/* Categoría */}
          <div style={{ margin: 0, minWidth: '160px', flex: '1 1 160px' }}>
            <SearchableSelect
              value={categoryFilter}
              onChange={(value) => handleCategoryChange(value)}
              options={rootCategories}
              placeholder="Categoría"
              disabled={!scopeFilter || rootCategories.length === 0}
              clearable
              color={scopeColor}
            />
          </div>

          {/* Sección — only for asset scopes with sections */}
          {isAssetScope && (
            <div style={{ margin: 0, minWidth: '140px', flex: '1 1 140px' }}>
              <SearchableSelect
                value={sectionFilter}
                onChange={(value) => handleSectionChange(value)}
                options={sections}
                placeholder="Sección"
                disabled={sections.length === 0}
                clearable
                color={scopeColor}
              />
            </div>
          )}

          {/* Familia */}
          {isAssetScope && (
            <div style={{ margin: 0, minWidth: '140px', flex: '1 1 140px' }}>
              <SearchableSelect
                value={familyFilter}
                onChange={(value) => handleFamilyChange(value)}
                options={familiesOpts}
                placeholder="Familia"
                disabled={familiesOpts.length === 0}
                clearable
                color={scopeColor}
              />
            </div>
          )}

          {/* SubFamilia */}
          {isAssetScope && (
            <div style={{ margin: 0, minWidth: '140px', flex: '1 1 140px' }}>
              <SearchableSelect
                value={subFamilyFilter}
                onChange={(value) => setSubFamilyFilter(value)}
                options={subFamiliesOpts}
                placeholder="SubFamilia"
                disabled={subFamiliesOpts.length === 0}
                clearable
                color={scopeColor}
              />
            </div>
          )}

          {/* Contador + limpiar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            <span className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} />
              <strong>{filteredItems.length}</strong> {scopeEntities.labelPlural?.toLowerCase() || 'activos'}
              {activeFiltersCount > 0 && <span style={{ background: scopeColor, color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem' }}>{activeFiltersCount}</span>}
            </span>
            {activeFiltersCount > 0 && (
              <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 10px' }} onClick={clearAll}>
                Limpiar
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
                  {scopeEntities.label || 'Activo'} / Equipo
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
                    <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Selecciona un tipo de mantenimiento</p>
                    <p style={{ fontSize: '0.85rem' }}>Elige el módulo y luego filtra por categoría, sección, familia o subfamilia.</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ padding: '60px', textAlign: 'center' }} className="text-muted">
                    No se encontraron {scopeEntities.labelPlural?.toLowerCase() || 'elementos'} con mantenimientos programados.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => {
                  const itemName = item.name || item.nombre || '';
                  const itemId = item.id || '';
                  return (
                    <tr key={itemId} className="hoverable-row">
                      <td style={{ padding: '12px 24px', borderBottom: '1px solid var(--glass-border)', position: 'sticky', left: 0, background: '#fff', zIndex: 9 }}>
                        <div
                          style={{ fontWeight: 600, fontSize: '0.9rem', color: scopeColor, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => isAssetScope ? navigate(`/inventory/history/${itemId}`) : null}
                          title={isAssetScope ? 'Ver historial completo' : itemName}
                        >
                          {isAssetScope && <History size={13} />}
                          {itemName}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{itemId}</div>
                        {isAssetScope && (item.sectionName || item.family || item.subFamily) && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', opacity: 0.75 }}>
                            {[item.sectionName, item.family, item.subFamily].filter(Boolean).join(' › ')}
                          </div>
                        )}
                      </td>
                      {months.map((_, mIdx) => {
                        const mnts = getMaintenanceInMonth(itemId, mIdx);
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {hasFilters && filteredItems.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            label={scopeEntities.labelPlural?.toLowerCase() || 'elementos'}
          />
        )}
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
        {isAssetScope && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginLeft: 'auto' }}>
            <History size={14} color={scopeColor} />
            <span className="text-muted">Clic en el nombre del activo para ver su historial completo</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceTimeline;
