import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Check, ArrowLeft, Calendar, Activity, Star, Zap } from 'lucide-react';
import { api } from '../../api';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const FREQ_MAP = { 'mensual': 1, 'bimestral': 2, 'trimestral': 3, 'cuatrimestral': 4, 'semestral': 6, 'anual': 12 };
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const FREQ_COLORS = {
  'Mensual':      { bg: 'rgba(59, 130, 246, 0.15)', dot: '#3b82f6' },
  'Bimestral':    { bg: 'rgba(168, 85, 247, 0.15)', dot: '#a855f7' },
  'Trimestral':   { bg: 'rgba(249, 115, 22, 0.15)', dot: '#f97316' },
  'Semestral':    { bg: 'rgba(20, 184, 166, 0.15)', dot: '#14b8a6' },
  'Anual':        { bg: 'rgba(234, 179, 8, 0.20)',  dot: '#eab308' },
};

const ScheduleForm = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { maintenancePlans, assets, assetCategoriesTree, refreshMaintenances, currentUser, setGlobalAlert, getCategoriesForScope, maintenanceScopes } = useAppContext();

  const plan = maintenancePlans.find(p => p.Id === planId);

  const [scheduleData, setScheduleData] = useState({
    assetIds: [],
    startDate: '',
    assignedTo: currentUser.name,
    mainFrequency: '',
    fixedDay: '',
    loadBalancing: true,
  });
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

  const planCategory = plan?.Category || plan?.SubFamily || '';
  const mainFreq = scheduleData.mainFrequency || plan?.PlanFrequency || 'Mensual';
  const mainInterval = FREQ_MAP[mainFreq.toLowerCase()] || 1;

  // ── Filtro de activos por scope del plan + categoría/familia ──
  const eligibleAssets = useMemo(() => {
    if (!plan) return assets;

    const catId   = plan.CategoryId;
    const famId   = plan.FamilyId;
    const catName = (plan.Category || '').toLowerCase().trim();
    const famName = (plan.FamilyName || plan.SubFamily || '').toLowerCase().trim();
    const planScope = plan.scope || searchParams.get('scope') || 'activo';

    // 1) Filtrar por scope: solo activos cuya categoría raíz pertenece al módulo del plan
    const scopeCategories = getCategoriesForScope(planScope);
    const scopeCatIds = new Set();
    const collectIds = (nodes) => {
      for (const n of nodes) {
        scopeCatIds.add(n.id);
        if (n.children) collectIds(n.children);
      }
    };
    collectIds(scopeCategories);

    let baseAssets = scopeCatIds.size > 0
      ? assets.filter(a => {
          const aCatId = a.categoryId || a.CategoryId || '';
          return scopeCatIds.has(aCatId);
        })
      : assets;

    // 2) Filtrar más por categoría/familia específica del plan (si tiene)
    if (!catId && !catName) return baseAssets;

    // IDs de la categoría raíz + hijos directos
    const planCatIds = new Set();
    if (catId) {
      planCatIds.add(catId);
      const root = assetCategoriesTree.find(c => c.id === catId);
      if (root?.children) root.children.forEach(c => planCatIds.add(c.id));
    }

    return baseAssets.filter(asset => {
      const assetCatId   = asset.categoryId || asset.CategoryId || '';
      const assetCatName = (asset.category || '').toLowerCase().trim();
      const assetFamName = (asset.subFamily || asset.subfamily || '').toLowerCase().trim();

      if (catId && assetCatId) {
        if (famId) return assetCatId === famId;
        return planCatIds.has(assetCatId);
      }

      if (famName) return assetCatName === catName && assetFamName === famName;
      return assetCatName === catName;
    });
  }, [assets, plan, assetCategoriesTree, getCategoriesForScope]);

  // Calcular la distribución de tareas por mes (para la matriz visual)
  const taskMatrix = useMemo(() => {
    if (!plan?.tasks) return [];
    return plan.tasks.map(task => {
      const taskInterval = FREQ_MAP[(task.Frequency || 'Mensual').toLowerCase()] || 1;
      return {
        ...task,
        monthHits: [...Array(12)].map((_, i) => {
          // El mes solo existe si hay un ticket según frecuencia principal
          const hasTicket = i % mainInterval === 0;
          if (!hasTicket) return null; // sin ticket este mes

          const isGranParada = i + mainInterval >= 12;
          if (isGranParada) return 'gran-parada';

          // ¿La tarea toca este ciclo?
          const taskDue = i % taskInterval === 0;
          const taskAlwaysIncluded = taskInterval < mainInterval;
          return (taskDue || taskAlwaysIncluded) ? 'included' : 'skipped';
        })
      };
    });
  }, [plan, mainInterval]);

  // Resumen: cuántos tickets se generarán
  const ticketPreview = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 12; i++) {
      if (i % mainInterval === 0) count++;
    }
    return count;
  }, [mainInterval]);

  const handleSubmit = async () => {
    if (scheduleData.assetIds.length === 0 || !scheduleData.startDate) {
      setGlobalAlert({ isOpen: true, title: 'Campos Requeridos', message: 'Selecciona al menos un activo y una fecha de inicio.' });
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/api/maintenance-plans/generate-batch-schedule', {
        planId: plan.Id,
        assetIds: scheduleData.assetIds,
        startDate: scheduleData.startDate,
        assignedTo: scheduleData.assignedTo,
        mainFrequency: mainFreq,
        fixedDay: scheduleData.loadBalancing ? null : (scheduleData.fixedDay || null),
        scope: plan.scope || 'activo',
      });

      if (response?.ok) {
        const result = await response.json();
        await refreshMaintenances();
        setIsDirty(false);
        setGlobalAlert({ isOpen: true, title: '✅ Cronograma Generado', message: `Se han creado ${result.count} tickets programados con la lógica de frecuencias mixtas.` });
        navigate('/maintenances/timeline');
      } else {
        const err = await response?.json();
        throw new Error(err?.error || 'Error en el servidor');
      }
    } catch(e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
    setSaving(false);
  };

  const toggleAssetSelection = (id) => {
    setIsDirty(true);
    setScheduleData(prev => {
      const isSelected = prev.assetIds.includes(id);
      if (isSelected) return { ...prev, assetIds: prev.assetIds.filter(aid => aid !== id) };
      return { ...prev, assetIds: [...prev.assetIds, id] };
    });
  };

  const selectAll = () => setScheduleData(prev => ({ ...prev, assetIds: eligibleAssets.map(a => a.id) }));

  if (!plan) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center' }}>
        <p className="text-muted">Plan no encontrado.</p>
        <button className="btn-secondary" onClick={() => navigate('/maintenances/routines')} style={{ marginTop: '16px' }}><ArrowLeft size={18} /> Regresar</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <button className="btn-secondary" onClick={handleCancel} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={18} /> Volver a Programación
        </button>
        <h1 style={{ marginBottom: '8px' }}>Generar Cronograma Automático</h1>
        <p className="text-muted">Programación inteligente basada en frecuencias mixtas — Lógica Plan.pdf aplicada.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>

        {/* ─── IZQUIERDA: Plan Base ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Plan Info */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="var(--accent-primary)" /> Protocolo Base
            </h2>
            <div style={{ marginBottom: '12px' }}>
              <span className="badge code-font" style={{ marginRight: '8px' }}>{plan.Code}</span>
              <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>{toTitleCase(planCategory)}</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>{toTitleCase(plan.Description)}</p>

            {/* Leyenda de frecuencias */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {Object.entries(FREQ_COLORS).map(([freq, clr]) => (
                <span key={freq} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '100px', background: clr.bg, fontSize: '0.75rem', fontWeight: 600, color: clr.dot }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: clr.dot, display: 'inline-block' }}></span>
                  {freq}
                </span>
              ))}
            </div>

            {/* Lista de tareas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {plan.tasks?.map((task, idx) => {
                const clr = FREQ_COLORS[task.Frequency] || FREQ_COLORS['Mensual'];
                return (
                  <div key={idx} style={{ background: clr.bg, padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ color: clr.dot, fontWeight: 700, minWidth: '18px' }}>{idx + 1}.</span>
                      <span>{toTitleCase(task.TaskDescription)}</span>
                    </div>
                    <span style={{ color: clr.dot, fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{task.Frequency}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activos */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            {/* Badge de alcance del plan */}
            {planCategory && (
              <div style={{
                marginBottom: '12px', padding: '8px 12px',
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '8px', fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>📂 Alcance:</span>
                <span>
                  <strong>{plan?.Category || planCategory}</strong>
                  {(plan?.FamilyName || plan?.SubFamily) && plan?.FamilyName !== plan?.Category
                    ? <> → <strong>{plan.FamilyName || plan.SubFamily}</strong></>
                    : null}
                </span>
                <span className="text-muted" style={{ marginLeft: 'auto' }}>
                  {eligibleAssets.length} activo{eligibleAssets.length !== 1 ? 's' : ''} disponible{eligibleAssets.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Activos Objetivo ({scheduleData.assetIds.length} / {eligibleAssets.length})</label>
              <button className="text-accent" style={{ fontSize: '0.8rem', fontWeight: 600 }} onClick={selectAll}>Seleccionar Todos</button>
            </div>
            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '10px', background: 'var(--bg-primary)' }}>
              {eligibleAssets.length === 0 && (
                <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>No hay activos en la categoría <strong>{planCategory}</strong>.</div>
              )}
              {eligibleAssets.map((a, aIdx) => (
                <div key={a.id} onClick={() => toggleAssetSelection(a.id)}
                  style={{
                    padding: '10px 14px', borderBottom: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    background: scheduleData.assetIds.includes(a.id) ? 'rgba(30, 64, 175, 0.1)' : 'transparent',
                    transition: 'all 0.15s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--accent-primary)', background: scheduleData.assetIds.includes(a.id) ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {scheduleData.assetIds.includes(a.id) && <Check size={12} color="#fff" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.id}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.name}</div>
                    </div>
                  </div>
                  {/* Semana asignada por nivelación */}
                  <span className="badge" style={{ fontSize: '0.7rem' }}>
                    {scheduleData.loadBalancing ? `Sem. ${(aIdx % 4) + 1}` : (a.location || 'N/A')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── DERECHA: Configuración + Matriz ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Config */}
          <div className="glass-panel" style={{ padding: '28px' }} onInput={() => setIsDirty(true)}>
            <h2 style={{ fontSize: '1rem', marginBottom: '20px', fontWeight: 700 }}>Configuración del Cronograma</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="input-group">
                <label>Fecha de Inicio del Ciclo</label>
                <input type="date" className="input-control" value={scheduleData.startDate} onChange={e => setScheduleData({ ...scheduleData, startDate: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Frecuencia de Visita (Rutina Principal)</label>
                <select className="input-control" value={mainFreq} onChange={e => setScheduleData({ ...scheduleData, mainFrequency: e.target.value })}>
                  <option value="Mensual">Mensual — 12 visitas/año</option>
                  <option value="Bimestral">Bimestral — 6 visitas/año</option>
                  <option value="Trimestral">Trimestral — 4 visitas/año</option>
                  <option value="Semestral">Semestral — 2 visitas/año</option>
                  <option value="Anual">Anual — 1 visita/año (Gran Parada)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="input-group">
                <label>Técnico Responsable</label>
                <input type="text" className="input-control" value={scheduleData.assignedTo} onChange={e => setScheduleData({ ...scheduleData, assignedTo: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Día Fijo del Mes (opcional)</label>
                <input type="number" className="input-control" min="1" max="28" placeholder="Ej: 15 = día 15 de c/mes"
                  value={scheduleData.fixedDay} onChange={e => setScheduleData({ ...scheduleData, fixedDay: e.target.value })}
                  disabled={scheduleData.loadBalancing} />
              </div>
            </div>

            {/* Toggle Nivelación de Carga */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '10px', cursor: 'pointer' }}
              onClick={() => setScheduleData(prev => ({ ...prev, loadBalancing: !prev.loadBalancing }))}>
              <div style={{ width: '40px', height: '22px', borderRadius: '100px', background: scheduleData.loadBalancing ? 'var(--success)' : 'var(--bg-primary)', border: '1px solid var(--glass-border)', position: 'relative', transition: 'all 0.2s' }}>
                <div style={{ position: 'absolute', top: '3px', left: scheduleData.loadBalancing ? '20px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'all 0.2s' }}></div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Nivelación de Carga por Semanas</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Distribuye los activos en distintas semanas del mes (evita acumulación de trabajo)</div>
              </div>
            </div>

            {/* Resumen generación */}
            <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', borderLeft: '4px solid var(--accent-primary)', display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Zap size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontWeight: 700 }}>{ticketPreview} ticket(s) por activo × {scheduleData.assetIds.length} activo(s) = <span style={{ color: 'var(--accent-primary)' }}>{ticketPreview * scheduleData.assetIds.length} tickets totales</span></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>El último ticket del año será la <strong>Gran Parada Anual</strong> (incluye todas las tareas).</div>
              </div>
            </div>
          </div>

          {/* Matriz de distribución */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--accent-primary)" /> Matriz de Distribución — 12 Meses
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid var(--glass-border)', minWidth: '160px', fontWeight: 700 }}>Tarea</th>
                    {MONTH_NAMES.map((mn, i) => {
                      const hasTicket = i % mainInterval === 0;
                      const isGP = hasTicket && i + mainInterval >= 12;
                      return (
                        <th key={i} style={{
                          padding: '6px 4px', textAlign: 'center',
                          borderBottom: '1px solid var(--glass-border)',
                          minWidth: '36px',
                          background: isGP ? 'rgba(234, 179, 8, 0.15)' : hasTicket ? 'rgba(59,130,246,0.06)' : 'transparent',
                          color: isGP ? '#eab308' : hasTicket ? 'var(--text-main)' : 'var(--text-muted)',
                          fontWeight: hasTicket ? 700 : 400
                        }}>
                          {mn}
                          {isGP && <div style={{ fontSize: '0.6rem' }}>⭐</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {taskMatrix.map((task, tidx) => {
                    const clr = FREQ_COLORS[task.Frequency] || FREQ_COLORS['Mensual'];
                    return (
                      <tr key={tidx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 500, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: clr.dot, marginRight: '6px', verticalAlign: 'middle' }}></span>
                          {task.TaskDescription}
                        </td>
                        {task.monthHits.map((hit, midx) => (
                          <td key={midx} style={{ padding: '7px 4px', textAlign: 'center', background: hit === 'gran-parada' ? 'rgba(234,179,8,0.12)' : hit === 'included' ? clr.bg : 'transparent' }}>
                            {hit === 'gran-parada' && <Star size={12} color="#eab308" style={{ verticalAlign: 'middle' }} />}
                            {hit === 'included' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: clr.dot, margin: '0 auto' }}></div>}
                            {hit === 'skipped' && <span style={{ opacity: 0.15, fontSize: '0.7rem' }}>—</span>}
                            {hit === null && <span style={{ opacity: 0.08, fontSize: '0.7rem' }}>·</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>⭐ = Gran Parada Anual (todas las tareas)</span>
              <span>● = Tarea programada en esa visita</span>
              <span>— = Tarea no aplica ese mes</span>
              <span>· = Sin visita programada</span>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={handleCancel}>Cancelar</button>
            <button className="btn-primary" style={{ background: 'var(--success)', padding: '12px 36px' }} onClick={handleSubmit} disabled={saving || scheduleData.assetIds.length === 0}>
              <Check size={20} /> {saving ? 'Generando...' : 'Procesar Cronograma'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm;
