import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Search } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const MaintenanceForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { maintenances, addMaintenance, updateMaintenance, assets, suppliers, currentUser, maintenanceTypesTree, hasPermission, setGlobalAlert, employees, maintenanceScopes, assetCategoriesTree } = useAppContext();

  const flattenTypes = (nodes) => {
    let types = [];
    nodes.forEach(node => {
      types.push({ id: node.id, name: node.name });
      if (node.children) types = [...types, ...flattenTypes(node.children)];
    });
    return types;
  };
  const availableTypes = flattenTypes(maintenanceTypesTree);

  const isEdit = !!id;

  // Route guard — runs ONCE on mount only
  useEffect(() => {
    if (isEdit && !hasPermission('maintenances_edit')) {
      setGlobalAlert({ isOpen: true, title: 'Acceso Denegado', message: 'No tienes permiso para editar mantenimientos.' });
      navigate('/maintenances');
    }
    if (!isEdit && !hasPermission('maintenances_create')) {
      setGlobalAlert({ isOpen: true, title: 'Acceso Denegado', message: 'No tienes permiso para crear mantenimientos.' });
      navigate('/maintenances');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Para la creación directa (no desde Planificador), el tipo por defecto es "Correctivo"
  const defaultType = availableTypes.find(t => t.name.toLowerCase().includes('correctivo')) || availableTypes[0] || null;

  const defaultScope = location.state?.scope || 'activo';

  const [formData, setFormData] = useState({
    title: '',
    typeId: defaultType ? defaultType.id : '',
    type: defaultType ? defaultType.name : 'Correctivo',
    assetId: '',
    providerId: '',
    provider: 'Interno',
    assignedTo: '',
    startDate: '',
    endDate: '',
    status: 'PENDIENTE',
    cost: '',
    description: '',
    planId: '',
    scope: defaultScope
  });

  // Control de reprogramación
  const [originalDates, setOriginalDates] = useState({ startDate: '', endDate: '' });
  const [reprogramReason, setReprogramReason] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty && !window.confirm('¿Está seguro de salir? Los cambios no guardados se perderán.')) return;
    navigate(-1);
  };
  const datesChanged = isEdit && (
    formData.startDate !== originalDates.startDate ||
    formData.endDate !== originalDates.endDate
  );

  const [assetSearch, setAssetSearch] = useState('');
  const [suggestedPlan, setSuggestedPlan] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const existing = maintenances.find(m => m.id === id);
      if (existing) {
        setFormData(existing);
        setAssetSearch(existing.assetId);
        setOriginalDates({ startDate: existing.startDate || '', endDate: existing.endDate || '' });
      } else {
        navigate('/maintenances');
      }
    } else {
      // Default Assignee based on current user
      setFormData(prev => ({ ...prev, assignedTo: currentUser.name }));
    }
  }, [id, maintenances, navigate, isEdit, currentUser.name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Resolve scope slug from asset's root category
  const getScopeFromAsset = (asset) => {
    const catId = asset.categoryId || asset.CategoryId;
    if (!catId) return null;
    // Walk up to root: find which root category contains this catId
    for (const root of assetCategoriesTree) {
      if (root.id === catId || (root.children || []).some(c => c.id === catId)) {
        if (root.scopeId) {
          const scopeObj = maintenanceScopes.find(s => s.id === root.scopeId);
          return scopeObj?.slug || null;
        }
      }
    }
    return null;
  };

  const handleAssetSelect = (a) => {
    const autoScope = getScopeFromAsset(a) || formData.scope;
    setFormData(prev => ({...prev, assetId: a.id, scope: autoScope}));
    setAssetSearch(a.id);

    // Auto-sugest plan if exists based on subFamily
    if (a.subFamily && maintenancePlans) {
      const match = maintenancePlans.find(p => p.subFamily?.toLowerCase() === a.subFamily?.toLowerCase());
      if (match) {
        setSuggestedPlan(match);
        setFormData(prev => ({...prev, planId: match.id}));
      } else {
        setSuggestedPlan(null);
        setFormData(prev => ({...prev, planId: ''}));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEdit && datesChanged && !reprogramReason.trim()) {
      setGlobalAlert({ isOpen: true, title: 'Motivo Requerido', message: 'Debes ingresar el motivo de la reprogramación al cambiar las fechas.' });
      return;
    }
    if (isEdit) {
      await updateMaintenance({ ...formData, id, reprogramReason: datesChanged ? reprogramReason : undefined });
    } else {
      await addMaintenance(formData);
    }
    setIsDirty(false);
    // Navigate back to the scoped list if we came from one
    if (formData.scope) {
      navigate(`/maintenances/list/${formData.scope}`);
    } else {
      navigate('/maintenances');
    }
  };

  // Filter assets by scope first, then by search term
  const scopeFilteredAssets = defaultScope && defaultScope !== 'activo'
    ? assets.filter(a => {
        const scopeSlug = getScopeFromAsset(a);
        return scopeSlug === defaultScope || !scopeSlug; // include unscoped assets too
      })
    : assets;

  const filteredAssets = scopeFilteredAssets.filter(a =>
    a.id.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    (a.serial && a.serial.toLowerCase().includes(assetSearch.toLowerCase()))
  ).slice(0, 5);
  
  // Extracting maintenance plans to context
  const { maintenancePlans } = useAppContext();

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="button" className="btn-secondary" onClick={handleCancel} style={{ padding: '8px', borderRadius: '50%' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ marginBottom: '0' }}>{isEdit ? `Editar Tarea: ${id}` : 'Registrar Mantenimiento'}</h1>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} onInput={() => setIsDirty(true)}>
          
          <div className="form-section">
             <div className="form-section-title">Ticket de Servicio</div>
             <div className="form-grid-2">
               <div className="input-group">
                 <label>Título / Descriptivo</label>
                 <input className="input-control" type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Ej. Cambio de bujías" />
               </div>
               <div className="input-group">
                 <label>Tipo de Mantenimiento</label>
                 <select className="input-control" value={formData.typeId || ''} onChange={e => {
                   const t = availableTypes.find(t => t.id === e.target.value);
                   setFormData(prev => ({...prev, typeId: e.target.value, type: t?.name || ''}));
                 }} required>
                   {availableTypes.map(t => (
                     <option key={t.id} value={t.id}>{t.name}</option>
                   ))}
                   {availableTypes.length === 0 && <option value="">Generico</option>}
                 </select>
               </div>
             </div>
             <div className="form-grid-2">
               <div className="input-group">
                 <label>Módulo / Categoría</label>
                 <select className="input-control" name="scope" value={formData.scope || 'activo'} onChange={handleChange} required>
                   {maintenanceScopes.filter(s => s.activo !== false).map(s => (
                     <option key={s.id} value={s.slug}>{s.nombre}</option>
                   ))}
                   {maintenanceScopes.length === 0 && (
                     <>
                       <option value="activo">Mantenimiento de Activo</option>
                       <option value="area">Mantenimiento de Área</option>
                       <option value="habitacion">Mantenimiento de Habitación</option>
                     </>
                   )}
                 </select>
               </div>
             </div>
          </div>

          <div className="form-section">
             <div className="form-section-title">Vinculación de Activo</div>
             <div className="form-grid">
               <div className="input-group">
                 <label>Activo Objetivo (Busca por código o nombre)</label>
                 <div style={{ display: 'flex', gap: '10px' }}>
                   <div style={{ position: 'relative', flex: 1 }}>
                     <input 
                       className="input-control code-font" 
                       type="text" 
                       value={assetSearch} 
                       onChange={(e) => {
                         setAssetSearch(e.target.value);
                         setFormData(prev => ({...prev, assetId: '', planId: ''})); // reset real selection if they type
                         setSuggestedPlan(null);
                       }}
                       placeholder="ACT-00X..." 
                     />
                     {!formData.assetId && assetSearch.length > 1 && (
                       <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 10, marginTop: '4px', padding: '8px' }}>
                         {filteredAssets.map(a => (
                           <div 
                             key={a.id}
                             onClick={() => handleAssetSelect(a)}
                             className="clickable-row"
                             style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: '4px' }}
                           >
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="code-font">{a.id}</span>
                                <span className="text-muted">{a.name}</span>
                              </div>
                              {a.serial && <span className="text-muted code-font" style={{ fontSize: '0.8rem' }}>SN: {a.serial}</span>}
                           </div>
                         ))}
                         {filteredAssets.length === 0 && <div className="text-muted" style={{ padding: '8px' }}>No hay resultados</div>}
                       </div>
                     )}
                   </div>
                   {formData.assetId && (
                     <div style={{ padding: '12px 16px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}>
                       <Check size={18} /> Vinculado
                     </div>
                   )}
                 </div>
               </div>
             </div>
             
             {/* Suggested Plan Alert */}
             {!isEdit && suggestedPlan && (
               <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid var(--accent-light)', borderRadius: 'var(--radius-md)' }}>
                 <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                   <div style={{ color: 'var(--accent-primary)', marginTop: '2px' }}><Check size={20} /></div>
                   <div>
                     <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-main)' }}>Protocolo Automático Detectado</strong>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                       Como este activo es de tipo <strong>{suggestedPlan.subFamily}</strong>, se le asignará el plan de mantenimiento: <br/>
                       <strong className="code-font">{suggestedPlan.code}</strong> - {suggestedPlan.description} <br/>
                       <em>Se generará automáticamete una lista de {suggestedPlan.tasks?.length || 0} tareas para que el técnico las revise.</em>
                     </p>
                   </div>
                 </div>
               </div>
             )}
          </div>

          <div className="form-section">
             <div className="form-section-title">Responsabilidades y Estado</div>
             <div className="form-grid-3">
               <div className="input-group">
                 <label>Estado Trabajo (Semáforo)</label>
                 <select className="input-control" name="status" value={formData.status} onChange={handleChange} required>
                   <option value="PENDIENTE">🔴 Pendiente</option>
                   <option value="EN PROGRESO">🟡 En Progreso</option>
                   <option value="COMPLETADO">🟢 Completado</option>
                   <option value="CANCELADO">⚫ Cancelado</option>
                 </select>
               </div>
               <div className="input-group">
                 <label>Técnico / Persona a Cargo</label>
                 <select className="input-control" name="assignedTo" value={formData.assignedTo} onChange={handleChange} required>
                   <option value="">-- Seleccionar --</option>
                   {employees.map(e => (
                     <option key={e.id} value={`${e.nombre} ${e.apellido}`}>{e.apellido}, {e.nombre}</option>
                   ))}
                 </select>
               </div>
               <div className="input-group">
                 <label>Proveedor Contratado (Opcional)</label>
                 <select className="input-control" value={formData.providerId || ''} onChange={e => {
                   const s = suppliers.find(s => s.id === e.target.value);
                   setFormData(prev => ({...prev, providerId: e.target.value || null, provider: s?.name || 'Interno'}));
                 }}>
                   <option value="">Personal Interno</option>
                   {suppliers.map(s => (
                     <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                   ))}
                 </select>
               </div>
             </div>
             
             <div className="form-grid-3">
                <div className="input-group">
                 <label>Fecha de Inicio</label>
                 <input className="input-control" type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
               </div>
               <div className="input-group">
                 <label>Fecha Estimada/Real de Fin</label>
                 <input className="input-control" type="date" name="endDate" min={formData.startDate || undefined} value={formData.endDate} onChange={handleChange} />
               </div>
               <div className="input-group">
                 <label>Inversión Estimada ($)</label>
                 <input className="input-control" type="number" step="0.01" name="cost" value={formData.cost} onChange={handleChange} placeholder="0.00" />
               </div>
             </div>
          </div>

          {/* Motivo de reprogramación — aparece solo en edición si cambia alguna fecha */}
          {isEdit && datesChanged && (
            <div className="form-section" style={{ border: '1px solid var(--warning)', borderRadius: '10px', padding: '20px', background: 'rgba(234,179,8,0.05)' }}>
              <div className="form-section-title" style={{ color: 'var(--warning)' }}>⚠ Reprogramación Detectada</div>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                Has modificado la(s) fecha(s) de este mantenimiento. Debes indicar el motivo obligatoriamente. Quedará registrado en el historial de reprogramaciones.
              </p>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Motivo de Reprogramación *</label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={reprogramReason}
                  onChange={e => setReprogramReason(e.target.value)}
                  placeholder="Ej: Falta de repuestos, equipo en uso crítico, cambio de prioridad..."
                  style={{ borderColor: !reprogramReason.trim() ? 'var(--danger)' : 'var(--glass-border)' }}
                />
              </div>
            </div>
          )}

          <div className="form-section">
            <div className="input-group">
              <label>Observaciones / Detalle Técnico</label>
              <textarea className="input-control" name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="..." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
            <button type="button" className="btn-secondary" onClick={handleCancel}>CANCELAR</button>
            <button type="submit" className="btn-primary" disabled={!formData.assetId}>
               <Check size={18} /> {isEdit ? 'GUARDAR CAMBIOS' : 'CREAR TICKET'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;
