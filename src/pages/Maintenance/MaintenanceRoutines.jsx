import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { UploadCloud, Plus, Calendar, Trash2, Edit2, Activity, AlignLeft, ArrowUpDown, ClipboardList } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../api';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const MaintenanceRoutines = () => {
  const { maintenancePlans, setMaintenancePlans, setGlobalAlert, hasPermission } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'Id', direction: 'asc' });
  const [expandedId, setExpandedId] = useState(null);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const processedPlans = useMemo(() => {
    let sorted = [...maintenancePlans];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [maintenancePlans, sortConfig]);

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
        setGlobalAlert({ isOpen: true, title: 'Éxito', message: 'Planes importados del Excel correctamente.' });
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

  const handleRowClick = (id) => {
    if (window.innerWidth <= 1024) {
      setExpandedId(expandedId === id ? null : id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Programación de Rutinas</h1>
          <p className="text-muted">Protocolos de mantenimiento agrupados por categoría de activos.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {hasPermission('maintenances_create') && (
            <button className="btn-secondary" onClick={() => navigate('/maintenances/planner')}
              style={{ display:'flex', alignItems:'center', gap:'6px', borderColor:'var(--accent-primary)', color:'var(--accent-primary)' }}>
              <ClipboardList size={20} /> Nueva Orden de Trabajo
            </button>
          )}
          {hasPermission('maintenances_create') && (
            <button className="btn-primary" onClick={() => navigate('/maintenances/routines/new')}>
              <Plus size={20} /> Nuevo Plan
            </button>
          )}
          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          {hasPermission('maintenances_create') && (
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <UploadCloud size={20} /> {isUploading ? 'Procesando...' : 'Importar Excel'}
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('Code')} style={{ cursor: 'pointer' }}>Código <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('Description')} style={{ cursor: 'pointer' }}>Título / Descripción <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('Category')} style={{ cursor: 'pointer' }}>Categoría <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} /></th>
              <th style={{ textAlign: 'center' }}>Tareas</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {maintenancePlans.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted" style={{ padding: '60px' }}>
                  No hay protocolos en el catálogo.<br />Crea uno nuevo o importa un archivo Excel.
                </td>
              </tr>
            ) : (
              processedPlans.map(plan => (
                <tr 
                  key={plan.Id} 
                  className={`hoverable-row mobile-list-format ${expandedId === plan.Id ? 'is-expanded' : ''}`}
                  onClick={() => handleRowClick(plan.Id)}
                >
                  <td data-label="CÓDIGO">
                    <span className="badge code-font" style={{ background: 'var(--bg-tertiary)' }}>{plan.Code || '---'}</span>
                  </td>
                  <td data-label="TÍTULO" style={{ maxWidth: '280px' }}>
                    <div style={{ fontWeight: 600 }}>{toTitleCase(plan.Description)}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px', cursor: 'pointer', color: 'var(--accent-primary)' }} onClick={() => setViewingPlan(viewingPlan?.Id === plan.Id ? null : plan)}>
                      <AlignLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      {viewingPlan?.Id === plan.Id ? 'Ocultar Checklist' : 'Ver Checklist'}
                    </div>
                    {/* Inline expandable checklist */}
                    {viewingPlan?.Id === plan.Id && plan.tasks?.length > 0 && (
                      <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.85rem', width: '100%' }}>
                        {plan.tasks.map((t, idx) => (
                          <div key={idx} style={{ padding: '4px 0', display: 'flex', gap: '8px' }}>
                            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{idx + 1}.</span>
                            <span>{toTitleCase(t.TaskDescription)}</span>
                            <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{toTitleCase(t.Frequency)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-label="CATEGORÍA">
                    <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                      {toTitleCase(plan.Category || plan.SubFamily || 'General')}
                    </span>
                  </td>
                  <td data-label="TAREAS" style={{ textAlign: 'center' }}>
                    <strong>{plan.tasks?.length || 0}</strong>
                  </td>
                  <td data-label="ACCIONES" style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                    <div className="flex-center gap-2" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {hasPermission('maintenances_edit') && (
                        <button className="btn-secondary" style={{ padding: '8px' }} onClick={() => navigate(`/maintenances/routines/edit/${plan.Id}`)} title="Editar Plan">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {hasPermission('maintenances_delete') && (
                        <button className="btn-secondary" style={{ padding: '8px', color: 'var(--danger)' }} onClick={() => deletePlan(plan.Id)} title="Eliminar Plan">
                          <Trash2 size={16} />
                        </button>
                      )}
                      {hasPermission('maintenances_create') && (
                        <button className="btn-primary" style={{ background: 'var(--success)', padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => navigate(`/maintenances/planner/${plan.Id}`)}>
                          <Calendar size={16} /> Programar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceRoutines;
