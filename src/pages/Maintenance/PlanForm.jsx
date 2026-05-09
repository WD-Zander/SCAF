import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Check, ArrowLeft, Plus, X, ChevronDown } from 'lucide-react';
import { api } from '../../api';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const PlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { maintenancePlans, setMaintenancePlans, assetCategoriesTree, planFrequencies, setGlobalAlert, maintenanceScopes, getCategoriesForScope } = useAppContext();
  // Inherit scope from the routines page URL (passed via navigate state or searchParams)
  const inheritedScope = searchParams.get('scope') || null;
  const isEditing = Boolean(id);

  // Frecuencia por defecto: la primera de la BD o 'Mensual' como fallback
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

  // ── Derivar árbol de categorías desde el contexto ──────────────────
  // Si hay inheritedScope, filtra solo categorías raíz de ese módulo
  const rootCategories = useMemo(() => {
    if (inheritedScope) return getCategoriesForScope(inheritedScope);
    return assetCategoriesTree;
  }, [assetCategoriesTree, inheritedScope, getCategoriesForScope]);

  // Familias: children del nodo raíz seleccionado
  const families = useMemo(() => {
    if (!formData.CategoryId) return [];
    const selectedCat = assetCategoriesTree.find(c => c.id === formData.CategoryId);
    return selectedCat?.children || [];
  }, [assetCategoriesTree, formData.CategoryId]);

  // ── Auto-generate code & preload on edit ──────────────────────────
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
      // Auto-fill next code
      let maxNum = 0;
      for (const p of maintenancePlans) {
        const match = (p.Code || '').match(/^PLAN-(\d+)$/i);
        if (match) { const n = parseInt(match[1], 10); if (n > maxNum) maxNum = n; }
      }
      setFormData(prev => ({ ...prev, Code: `PLAN-${String(maxNum + 1).padStart(3, '0')}` }));
    }
  }, [id, maintenancePlans]);

  // ── Handlers de selección de categoría en cascada ─────────────────
  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    const selectedCat = rootCategories.find(c => c.id === selectedId);
    // Auto-derive scope from category's scopeId
    let autoScope = formData.scope;
    if (selectedCat?.scopeId) {
      const scopeObj = maintenanceScopes.find(s => s.id === selectedCat.scopeId);
      if (scopeObj) autoScope = scopeObj.slug;
    }
    setFormData(prev => ({
      ...prev,
      CategoryId: selectedId,
      CategoryName: selectedCat?.name || '',
      FamilyId: '',
      FamilyName: '',
      scope: autoScope
    }));
  };

  const handleFamilyChange = (e) => {
    const selectedId = e.target.value;
    const selectedFam = families.find(c => c.id === selectedId);
    setFormData(prev => ({
      ...prev,
      FamilyId: selectedId,
      FamilyName: selectedFam?.name || ''
    }));
  };

  const handleSubmit = async () => {
    if (!formData.Code || !formData.Description) {
      setGlobalAlert({ isOpen: true, title: 'Validación', message: 'Código y descripción son obligatorios.' });
      return;
    }
    setSaving(true);
    try {
      // Scope label: si hay familia la usamos, sino la categoría raíz
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

      // Refetch plans
      const refetch = await api.get('/api/maintenance-plans');
      if (refetch?.ok) setMaintenancePlans(await refetch.json());
      setIsDirty(false);
      navigate('/maintenances/routines');
    } catch (e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: 'No se pudo guardar: ' + e.message });
    }
    setSaving(false);
  };

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
          <select
            className="input-control"
            value={formData.scope || ''}
            onChange={e => { setFormData(prev => ({ ...prev, scope: e.target.value })); setIsDirty(true); }}
          >
            <option value="">— Sin módulo específico —</option>
            {maintenanceScopes.filter(s => s.activo !== false).map(s => (
              <option key={s.id} value={s.slug}>{s.nombre}</option>
            ))}
          </select>
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
            <select
              className="input-control"
              value={formData.PlanFrequency}
              onChange={e => setFormData({ ...formData, PlanFrequency: e.target.value })}
            >
              {planFrequencies.length > 0
                ? planFrequencies.filter(f => f.active !== false).map(f => (
                    <option key={f.id} value={f.name}>
                      {f.name}{f.description ? ` — ${f.description}` : ''}
                    </option>
                  ))
                : <option value={formData.PlanFrequency}>{formData.PlanFrequency}</option>
              }
            </select>
          </div>
        </div>

        {/* ── ALCANCE EN CASCADA ─────────────────────────────── */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Alcance del Plan (Categoría y Familia)
          </label>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '12px' }}>
            Selecciona la categoría de inventario que abarca este plan. Solo los activos de esa categoría/familia aparecerán al programar la orden de trabajo.
          </p>
          <div className="form-grid-2">
            {/* Nivel 1 — Categoría Raíz */}
            <div className="input-group">
              <label>Categoría *</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="input-control"
                  value={formData.CategoryId}
                  onChange={handleCategoryChange}
                  style={{ paddingRight: '36px', appearance: 'none' }}
                >
                  <option value="">— Seleccionar Categoría —</option>
                  {rootCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
              {formData.CategoryName && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  ✔ Categoría: <strong>{formData.CategoryName}</strong>
                </span>
              )}
            </div>

            {/* Nivel 2 — Familia (Hijo de Categoría) */}
            <div className="input-group">
              <label>Familia / Subfamilia</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="input-control"
                  value={formData.FamilyId}
                  onChange={handleFamilyChange}
                  disabled={!formData.CategoryId || families.length === 0}
                  style={{
                    paddingRight: '36px',
                    appearance: 'none',
                    opacity: (!formData.CategoryId || families.length === 0) ? 0.5 : 1
                  }}
                >
                  <option value="">
                    {!formData.CategoryId
                      ? '— Primero selecciona Categoría —'
                      : families.length === 0
                        ? '— Sin familias disponibles —'
                        : '— Todas las familias —'}
                  </option>
                  {families.map(fam => (
                    <option key={fam.id} value={fam.id}>{fam.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
              {formData.FamilyName && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  ✔ Familia: <strong>{formData.FamilyName}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Badge de alcance actual */}
          {formData.CategoryName && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>📂 Alcance:</span>
              <span>
                <strong>{formData.CategoryName}</strong>
                {formData.FamilyName && <> → <strong>{formData.FamilyName}</strong></>}
              </span>
              <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>
                Solo se mostrarán activos de este scope al programar
              </span>
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
                <select
                  className="input-control"
                  style={{ background: 'var(--bg-primary)' }}
                  value={task.Frequency}
                  onChange={e => {
                    const t = [...tasks]; t[index].Frequency = e.target.value; setTasks(t);
                  }}
                >
                  {planFrequencies.length > 0
                    ? planFrequencies.filter(f => f.active !== false).map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))
                    : <option value={task.Frequency}>{task.Frequency}</option>
                  }
                </select>
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
