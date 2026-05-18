import React, { useRef, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import {
  UploadCloud, Plus, Calendar, Trash2, Edit2, Activity,
  ArrowUpDown, ClipboardList, Search, ChevronLeft, ChevronRight,
  ChevronDown, ChevronRight as ChevronR, ListChecks,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../api';
import { Button, Badge, Card, Field } from '../../components/UI';
import { useIsMobile } from '../../hooks/useIsMobile';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const ITEMS_PER_PAGE = 20;

const MaintenanceRoutines = () => {
  const { maintenancePlans, setMaintenancePlans, setGlobalAlert, hasPermission, maintenanceScopes, getEntitiesForScope } = useAppContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const scope = searchParams.get('scope');
  const scopeMeta = maintenanceScopes.find(s => s.slug === scope);
  const scopeLabel = scopeMeta?.nombre || '';
  const scopeColor = scopeMeta?.color || 'var(--accent-primary)';
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'Code', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const processedPlans = useMemo(() => {
    let filtered = scope ? maintenancePlans.filter(p => p.scope === scope) : [...maintenancePlans];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.Code || '').toLowerCase().includes(s) ||
        (p.Description || '').toLowerCase().includes(s) ||
        (p.Category || '').toLowerCase().includes(s) ||
        (p.FamilyName || '').toLowerCase().includes(s)
      );
    }
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [maintenancePlans, sortConfig, scope, searchTerm]);

  const totalPages = Math.ceil(processedPlans.length / ITEMS_PER_PAGE);
  const paginatedPlans = processedPlans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const plansSheet = workbook.Sheets['Plan de Mantenimiento'];
      const tasksSheet = workbook.Sheets['Detalle de Mantenimiento'];
      if (!plansSheet || !tasksSheet) throw new Error("Faltan pestañas requeridas.");
      const plans = XLSX.utils.sheet_to_json(plansSheet);
      const tasks = XLSX.utils.sheet_to_json(tasksSheet);
      const response = await api.post('/api/maintenance-plans/batch', { plans, tasks });
      if (response?.ok) {
        setGlobalAlert({ isOpen: true, title: 'Importación exitosa', message: 'Planes importados del Excel correctamente.' });
        const refetch = await api.get('/api/maintenance-plans');
        if (refetch?.ok) setMaintenancePlans(await refetch.json());
      }
    } catch (err) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: err.message });
    }
    setIsUploading(false);
    e.target.value = null;
  };

  const deletePlan = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este Plan y todas sus tareas?')) return;
    try {
      const res = await api.delete(`/api/maintenance-plans/${id}`);
      if (res?.ok) {
        setGlobalAlert({ isOpen: true, title: 'Eliminado', message: 'Plan borrado correctamente.' });
        setMaintenancePlans(maintenancePlans.filter(p => p.Id !== id));
      }
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: 'No se pudo conectar al servidor.' });
    }
  };

  const getPageNumbers = () => {
    const delta = 3;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) range.push(i);
    return range;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6, color: scopeColor }}>{scopeLabel || 'Operaciones'}</div>
          <h1 style={{ margin: 0 }}>Programación de Rutinas</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--text-main)' }}>{processedPlans.length}</strong> plan{processedPlans.length !== 1 ? 'es' : ''} de mantenimiento
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          {hasPermission('maintenances_create') && (
            <>
              <Button variant="secondary" icon={UploadCloud} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? 'Procesando...' : (isMobile ? 'Importar' : 'Importar Excel')}
              </Button>
              <Button variant="secondary" icon={ClipboardList} onClick={() => navigate(`/maintenances/planner${scope ? `?scope=${scope}` : ''}`)}>
                {isMobile ? 'Orden' : 'Nueva Orden de Trabajo'}
              </Button>
              <Button variant="primary" icon={Plus} onClick={() => navigate(`/maintenances/routines/new${scope ? `?scope=${scope}` : ''}`)}>
                {isMobile ? 'Nuevo' : 'Nuevo Plan'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <Card padded={false} style={{ padding: '12px 14px' }}>
        <Field
          icon={Search}
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por código, título, categoría..."
        />
      </Card>

      {/* Desktop table */}
      {!isMobile && (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { label: 'Código', key: 'Code' },
                  { label: 'Título / Descripción', key: 'Description' },
                  { label: 'Categoría', key: 'Category' },
                  { label: 'Tareas', key: null },
                  { label: 'Acciones', key: null },
                ].map((h, i) => (
                  <th key={i} onClick={h.key ? () => handleSort(h.key) : undefined} style={{
                    textAlign: i >= 3 ? 'center' : 'left',
                    fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', padding: '11px 14px',
                    background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)',
                    cursor: h.key ? 'pointer' : 'default',
                  }}>
                    {h.label}
                    {h.key && <ArrowUpDown size={10} style={{ display: 'inline', marginLeft: 4, opacity: 0.5 }} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 60, textAlign: 'center' }}>
                    <Activity size={28} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                      {searchTerm ? 'Sin resultados.' : 'No hay planes. Crea uno nuevo o importa un archivo Excel.'}
                    </p>
                  </td>
                </tr>
              ) : paginatedPlans.map((plan, i) => {
                const planScope = maintenanceScopes.find(s => s.slug === plan.scope);
                const pColor = planScope?.color || 'var(--accent-primary)';
                const catLabel = plan.FamilyName || plan.Category || plan.SubFamily || 'General';
                const isExpanded = expandedPlanId === plan.Id;
                return (
                  <React.Fragment key={plan.Id}>
                    <tr
                      style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 500,
                          padding: '2px 8px', borderRadius: 6, background: 'var(--bg-tertiary)',
                        }}>
                          {plan.Code || '---'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', maxWidth: 320 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{toTitleCase(plan.Description)}</div>
                        {plan.tasks?.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedPlanId(isExpanded ? null : plan.Id); }}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4,
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: '0.76rem', color: 'var(--accent-primary)', fontWeight: 500,
                            }}>
                            <ListChecks size={13} />
                            {isExpanded ? 'Ocultar Checklist' : 'Ver Checklist'}
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronR size={12} />}
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                          background: `${pColor}10`, color: pColor, border: `1px solid ${pColor}25`,
                        }}>
                          {toTitleCase(catLabel)}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                        <strong style={{ fontSize: '0.88rem' }}>{plan.tasks?.length || 0}</strong>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          {hasPermission('maintenances_edit') && (
                            <button onClick={() => navigate(`/maintenances/routines/edit/${plan.Id}`)} title="Editar"
                              style={{ color: 'var(--text-muted)', padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}>
                              <Edit2 size={15} />
                            </button>
                          )}
                          {hasPermission('maintenances_delete') && (
                            <button onClick={() => deletePlan(plan.Id)} title="Eliminar"
                              style={{ color: 'var(--danger)', padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }}>
                              <Trash2 size={15} />
                            </button>
                          )}
                          {hasPermission('maintenances_create') && (
                            <Button variant="primary" style={{ padding: '5px 12px', fontSize: '0.78rem', background: 'var(--success)' }}
                              onClick={() => navigate(`/maintenances/planner/${plan.Id}${scope ? `?scope=${scope}` : ''}`)}>
                              <Calendar size={13} style={{ marginRight: 4 }} /> Programar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded checklist */}
                    {isExpanded && plan.tasks?.length > 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div style={{
                            padding: '12px 20px 16px 52px', background: 'var(--bg-tertiary)',
                            borderBottom: '1px solid var(--glass-border)',
                          }}>
                            {plan.tasks.map((t, idx) => (
                              <div key={idx} style={{
                                display: 'flex', gap: 10, padding: '6px 0',
                                borderBottom: idx < plan.tasks.length - 1 ? '1px solid var(--glass-border)' : 'none',
                              }}>
                                <span style={{ color: pColor, fontWeight: 600, fontSize: '0.82rem', minWidth: 22 }}>{idx + 1}.</span>
                                <span style={{ fontSize: '0.85rem', flex: 1 }}>{toTitleCase(t.TaskDescription)}</span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', flexShrink: 0 }}>{toTitleCase(t.Frequency)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{
              padding: '14px 18px', borderTop: '1px solid var(--glass-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Página {currentPage} de {totalPages} ({processedPlans.length} planes)
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </Button>
                {getPageNumbers().map(n => (
                  <Button key={n} variant={currentPage === n ? 'primary' : 'ghost'} style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setCurrentPage(n)}>{n}</Button>
                ))}
                <Button variant="ghost" style={{ padding: '4px 8px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Mobile cards */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginatedPlans.length === 0 ? (
            <Card padded={false} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Sin planes registrados.</Card>
          ) : paginatedPlans.map(plan => {
            const pScope = maintenanceScopes.find(s => s.slug === plan.scope);
            const pColor = pScope?.color || 'var(--accent-primary)';
            const catLabel = plan.FamilyName || plan.Category || 'General';
            return (
              <Card key={plan.Id} padded={false} style={{ padding: '14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="code-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                      {plan.Code || '---'} · {plan.tasks?.length || 0} tareas
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.25 }}>{toTitleCase(plan.Description)}</div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: 100,
                    background: `${pColor}10`, color: pColor, flexShrink: 0,
                  }}>
                    {toTitleCase(catLabel)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {hasPermission('maintenances_edit') && (
                    <Button variant="ghost" style={{ padding: '5px 8px', fontSize: '0.78rem' }} onClick={() => navigate(`/maintenances/routines/edit/${plan.Id}`)}>
                      <Edit2 size={13} />
                    </Button>
                  )}
                  {hasPermission('maintenances_create') && (
                    <Button variant="primary" style={{ padding: '5px 12px', fontSize: '0.78rem', flex: 1, background: 'var(--success)' }}
                      onClick={() => navigate(`/maintenances/planner/${plan.Id}${scope ? `?scope=${scope}` : ''}`)}>
                      <Calendar size={13} style={{ marginRight: 4 }} /> Programar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
              <Button variant="ghost" style={{ padding: '6px 10px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaintenanceRoutines;
