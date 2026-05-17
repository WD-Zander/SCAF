import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Check, ArrowLeft, Plus, X, Folder, Box } from 'lucide-react';
import { api } from '../../api';
import SearchableSelect from '../../components/Common/SearchableSelect';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const PlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { maintenancePlans, setMaintenancePlans, assetCategoriesTree, planFrequencies, setGlobalAlert, maintenanceScopes, getCategoriesForScope, getEntitiesForScope } = useAppContext();
  const inheritedScope = searchParams.get('scope') || null;
  const isEditing = Boolean(id);

  const defaultFreq = (freqs) => freqs?.find(f => f.active !== false)?.name || 'Mensual';

  const [formData, setFormData] = useState({
    Code: '',
    CategoryId: '',
    CategoryName: '',
    FamilyId: '',
    FamilyName: '',
    Description: '',
    PlanFrequency: 'Mensual',
    scope: inheritedScope || ''
  });
  const [tasks, setTasks] = useState([{ TaskDescription: '', Frequency: 'Mensual' }]);
  const [saving, setSaving] = useState(false);
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

  // ── Determinar si el scope actual es tipo activo ────────────────
  const currentScopeObj = useMemo(() =>
    maintenanceScopes.find(s => s.slug === formData.scope)
  , [maintenanceScopes, formData.scope]);

  const isAssetScope = useMemo(() => {
    if (!currentScopeObj) return true;
    return (currentScopeObj.tipoEntidad || 'activo') === 'activo';
  }, [currentScopeObj]);

  const entityInfo = useMemo(() => {
    if (!formData.scope) return null;
    return getEntitiesForScope(formData.scope);
  }, [formData.scope, getEntitiesForScope]);

  // ── Categorías filtradas por scope ──
  const rootCategories = useMemo(() => {
    if (formData.scope) return getCategoriesForScope(formData.scope);
    return assetCategoriesTree;
  }, [assetCategoriesTree, formData.scope, getCategoriesForScope]);

  const families = useMemo(() => {
    if (!formData.CategoryId) return [];
    const allCats = formData.scope ? getCategoriesForScope(formData.scope) : assetCategoriesTree;
    const selectedCat = allCats.find(c => c.id === formData.CategoryId) ||
                        assetCategoriesTree.find(c => c.id === formData.CategoryId);
    return selectedCat?.children || [];
  }, [assetCategoriesTree, formData.CategoryId, formData.scope, getCategoriesForScope]);

  // ── Opciones para searchable selects ────────────────────────────
  const categoryOptions = useMemo(() =>
    rootCategories.map(c => ({ value: c.id, label: c.name }))
  , [rootCategories]);

  const familyOptions = useMemo(() =>
    families.map(f => ({ value: f.id, label: f.name }))
  , [families]);

  // ── Auto-generate code & preload on edit ────────────────────────
  useEffect(() => {
    if (isEditing) {
      const plan = maintenancePlans.find(p => p.Id === id);
      if (plan) {
        setFormData({
          Code: plan.Code,
          CategoryId: plan.CategoryId || '',
          CategoryName: plan.Category || plan.SubFamily || '',
          FamilyId: plan.FamilyId || '',
          FamilyName: plan.FamilyName || '',
          Description: plan.Description,
          PlanFrequency: plan.PlanFrequency || 'Mensual',
          scope: plan.scope || inheritedScope || ''
        });
        setTasks(
          plan.tasks?.length > 0
            ? plan.tasks.map(t => ({ TaskDescription: t.TaskDescription, Frequency: t.Frequency }))
            : [{ TaskDescription: '', Frequency: 'Mensual' }]
        );
      }
    } else {
      let maxNum = 0;
      for (const p of maintenancePlans) {
        const match = (p.Code || '').match(/^PLAN-(\d+)$/i);
        if (match) { const n = parseInt(match[1], 10); if (n > maxNum) maxNum = n; }
      }
      setFormData(prev => ({ ...prev, Code: `PLAN-${String(maxNum + 1).padStart(3, '0')}` }));
    }
  }, [id, maintenancePlans]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleScopeChange = (e) => {
    const newScope = e.target.value;
    setFormData(prev => ({
      ...prev,
      scope: newScope,
      CategoryId: '',
      CategoryName: '',
      FamilyId: '',
      FamilyName: '',
    }));
    setIsDirty(true);
  };

  const handleCategoryChange = (val, label) => {
    const selectedCat = rootCategories.find(c => c.id === val);
    let autoScope = formData.scope;
    if (selectedCat?.scopeId) {
      const scopeObj = maintenanceScopes.find(s => s.id === selectedCat.scopeId);
      if (scopeObj) autoScope = scopeObj.slug;
    }
    setFormData(prev => ({
      ...prev,
      CategoryId: val,
      CategoryName: label,
      FamilyId: '',
      FamilyName: '',
      scope: autoScope
    }));
  };

  const handleFamilyChange = (val, label) => {
    setFormData(prev => ({
      ...prev,
      FamilyId: val,
      FamilyName: label
    }));
  };

  const handleSubmit = async () => {
    if (!formData.Code || !formData.Description) {
      setGlobalAlert({ isOpen: true, title: 'Validación', message: 'Código y descripción son obligatorios.' });
      return;
    }
    setSaving(true);
    try {
      const scopeLabel = formData.FamilyName || formData.CategoryName || '';

      if (isEditing) {
        await api.put(`/api/maintenance-plans/${id}`, {
          Code: formData.Code,
          Description: formData.Description,
          SubFamily: scopeLabel,
          Category: formData.CategoryName,
          CategoryId: formData.CategoryId,
          FamilyId: formData.FamilyId,
          FamilyName: formData.FamilyName,
          PlanFrequency: formData.PlanFrequency,
          scope: formData.scope || null
        });
        const cleanTasks = tasks.filter(t => t.TaskDescription.trim());
        await api.put(`/api/maintenance-plans/${id}/tasks`, { tasks: cleanTasks });
        setGlobalAlert({ isOpen: true, title: 'Plan Actualizado', message: 'Los cambios fueron guardados en SQL.' });
      } else {
        const planId = `PLAN-${Date.now()}`;
        const payloadPlan = {
          Id_plan: planId,
          Codigo_plan: formData.Code,
          'Descripcion_del _plan': formData.Description,
          Sublinea: scopeLabel,
          Categoria: formData.CategoryName,
          CategoryId: formData.CategoryId,
          FamilyId: formData.FamilyId,
          FamilyName: formData.FamilyName,
          Frecuencia: formData.PlanFrequency || 'Mensual',
          scope: formData.scope || null,
          Scope: formData.scope || null
        };
        const payloadTasks = tasks.filter(t => t.TaskDescription.trim()).map((t, idx) => ({
          Id_Tarea: `TSK-${Date.now()}-${idx}`,
          'Descripcion del plan de Mmto': planId,
          Tarea_del_plan: t.TaskDescription,
          Frecuencia: t.Frequency
        }));

        const res = await api.post('/api/maintenance-plans/batch', { plans: [payloadPlan], tasks: payloadTasks });

        if (!res?.ok) {
          const errData = await res?.json();
          throw new Error(errData?.error || 'Error interno de SQL Server');
        }

        setGlobalAlert({ isOpen: true, title: 'Plan Registrado', message: 'Nuevo protocolo guardado exitosamente.' });
      }

      const refetch = await api.get('/api/maintenance-plans');
      if (refetch?.ok) setMaintenancePlans(await refetch.json());
      setIsDirty(false);
      navigate('/maintenances/routines');
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: 'No se pudo guardar: ' + e.message });
    }
    setSaving(false);
  };

  // ── Scope badge color ──────────────────────────────────────────
  const scopeColor = currentScopeObj?.color || 'var(--accent-primary)';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <button
            className="btn-secondary"
            onClick={handleCancel}
            style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={18} /> Volver a Programación
          </button>
          <h1 style={{ marginBottom: '8px' }}>
            {isEditing ? 'Editar Plan de Mantenimiento' : 'Crear Plan de Mantenimiento'}
          </h1>
          <p className="text-muted">
            {isEditing ? `Modificando protocolo ${formData.Code}` : 'Define un nuevo protocolo con sus tareas operativas.'}
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }} onInput={() => setIsDirty(true)}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
          Información del Protocolo
        </h2>

        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label>Módulo de Mantenimiento</label>
          <SearchableSelect
            value={formData.scope || ''}
            onChange={(val) => handleScopeChange({ target: { value: val } })}
            options={maintenanceScopes.filter(s => s.activo !== false).map(s => ({ value: s.slug, label: s.nombre }))}
            placeholder="— Sin módulo específico —"
            label="Módulo"
          />
        </div>

        <div className="form-grid-2">
          <div className="input-group">
            <label>Código Maestro *</label>
            <input
              type="text"
              className="input-control"
              value={formData.Code}
              onChange={e => setFormData({ ...formData, Code: e.target.value })}
              placeholder="PLAN-001"
            />
          </div>
          <div className="input-group">
            <label>Frecuencia Global del Plan</label>
            <SearchableSelect
              value={formData.PlanFrequency}
              onChange={(val) => setFormData(prev => ({ ...prev, PlanFrequency: val }))}
              options={planFrequencies.length > 0
                ? planFrequencies.filter(f => f.active !== false).map(f => ({ value: f.name, label: f.name, sub: f.description || undefined }))
                : [{ value: formData.PlanFrequency, label: formData.PlanFrequency }]
              }
              placeholder="Seleccionar frecuencia..."
              label="Frecuencia"
              clearable={false}
            />
          </div>
        </div>

        {/* ── ALCANCE EN CASCADA ─────────────────────────────────────── */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Alcance del Plan
          </label>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '12px' }}>
            {isAssetScope
              ? 'Selecciona la categoría de inventario que abarca este plan. Solo los activos de esa categoría/familia aparecerán al programar.'
              : `Selecciona el alcance para ${entityInfo?.labelPlural || 'las entidades'} de este módulo.`
            }
          </p>

          <div className="form-grid-2">
            <div className="input-group">
              <label>{isAssetScope ? 'Categoría' : 'Grupo / Clasificación'}</label>
              <SearchableSelect
                value={formData.CategoryId}
                onChange={handleCategoryChange}
                options={categoryOptions}
                placeholder={categoryOptions.length === 0
                  ? (formData.scope ? `No hay categorías para este módulo` : 'Selecciona un módulo primero')
                  : `Buscar ${isAssetScope ? 'categoría' : 'grupo'}...`
                }
                label={isAssetScope ? 'Categoría' : 'Grupo'}
                icon={Folder}
                disabled={categoryOptions.length === 0}
              />
              {formData.CategoryName && (
                <span style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={13} /> {formData.CategoryName}
                </span>
              )}
              {!isAssetScope && categoryOptions.length === 0 && formData.scope && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Puedes crear categorías para este módulo desde Configurar Módulos
                </span>
              )}
            </div>

            <div className="input-group">
              <label>{isAssetScope ? 'Familia / Subfamilia' : 'Subcategoría'}</label>
              <SearchableSelect
                value={formData.FamilyId}
                onChange={handleFamilyChange}
                options={familyOptions}
                placeholder={!formData.CategoryId
                  ? `Primero selecciona ${isAssetScope ? 'categoría' : 'grupo'}`
                  : familyOptions.length === 0
                    ? `Sin ${isAssetScope ? 'familias' : 'subcategorías'} disponibles`
                    : `Buscar ${isAssetScope ? 'familia' : 'subcategoría'}...`
                }
                label={isAssetScope ? 'Familia' : 'Subcategoría'}
                disabled={!formData.CategoryId || familyOptions.length === 0}
                icon={Box}
              />
              {formData.FamilyName && (
                <span style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={13} /> {formData.FamilyName}
                </span>
              )}
            </div>
          </div>

          {/* Badge de alcance actual */}
          {(formData.CategoryName || formData.scope) && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              background: `${scopeColor}0d`,
              border: `1px solid ${scopeColor}30`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: scopeColor, fontWeight: 700 }}>Alcance:</span>
              <span>
                {currentScopeObj?.nombre && <>{currentScopeObj.nombre} &rarr; </>}
                {formData.CategoryName ? <strong>{formData.CategoryName}</strong> : <span className="text-muted">Sin categoría</span>}
                {formData.FamilyName && <> &rarr; <strong>{formData.FamilyName}</strong></>}
              </span>
              {!isAssetScope && entityInfo && (
                <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>
                  {entityInfo.items?.length || 0} {entityInfo.labelPlural?.toLowerCase()} disponibles
                </span>
              )}
            </div>
          )}
        </div>

        <div className="input-group">
          <label>Titulo / Descripción de la Rutina *</label>
          <input
            type="text"
            className="input-control"
            value={formData.Description}
            onChange={e => setFormData({ ...formData, Description: e.target.value })}
            placeholder="Ej: Mantenimiento Preventivo Mensual"
          />
        </div>

        {/* ── CHECKLIST DE TAREAS ─────────────────────────────────────── */}
        <h2 style={{ fontSize: '1.1rem', marginTop: '32px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} color="var(--accent-primary)" /> Checklist Detallado (Pasos Automáticos)
        </h2>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
          Define cada tarea y su frecuencia. El sistema generará los tickets automáticamente solo cuando las tareas correspondan al mes del ciclo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map((task, index) => (
            <div
              key={index}
              className="glass-panel"
              style={{
                display: 'flex', gap: '12px', alignItems: 'center',
                padding: '12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <span className="text-muted" style={{ minWidth: '28px', fontWeight: 600, textAlign: 'center' }}>{index + 1}</span>
              <input
                type="text"
                className="input-control"
                style={{ flex: 3, background: 'var(--bg-primary)' }}
                placeholder="Descripción de tarea..."
                value={task.TaskDescription}
                onChange={e => {
                  const t = [...tasks]; t[index].TaskDescription = e.target.value; setTasks(t);
                }}
              />
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  value={task.Frequency}
                  onChange={(val) => {
                    const t = [...tasks]; t[index].Frequency = val; setTasks(t);
                  }}
                  options={planFrequencies.length > 0
                    ? planFrequencies.filter(f => f.active !== false).map(f => ({ value: f.name, label: f.name }))
                    : [{ value: task.Frequency, label: task.Frequency }]
                  }
                  placeholder="Frecuencia"
                  clearable={false}
                />
              </div>
              <button
                className="btn-secondary"
                style={{ padding: '8px', color: 'var(--danger)', border: 'none', background: 'transparent' }}
                onClick={() => { if (tasks.length > 1) setTasks(tasks.filter((_, i) => i !== index)); }}
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary"
            style={{ alignSelf: 'flex-start', fontSize: '0.85rem', marginTop: '8px' }}
            onClick={() => setTasks([...tasks, { TaskDescription: '', Frequency: defaultFreq(planFrequencies) }])}
          >
            <Plus size={16} /> Agregar Tarea
          </button>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
          <button className="btn-secondary" onClick={handleCancel}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            <Check size={18} /> {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Protocolo')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanForm;
