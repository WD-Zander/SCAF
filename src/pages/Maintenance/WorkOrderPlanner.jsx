import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import {
  ArrowLeft, Calendar, Plus, Trash2, Copy, Save, ChevronLeft, ChevronRight, Check, Filter,
  Search, X, Package
} from 'lucide-react';
import { api } from '../../api';
import SearchableSelect from '../../components/Common/SearchableSelect';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const daysBetween = (a, b) => {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
};

const fmt = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Mini calendario mensual ──────────────────────────────────────
const MiniCalendar = ({ generalTask, subTasks }) => {
  const [current, setCurrent] = useState(() => {
    const ref = generalTask.startDate || new Date().toISOString().split('T')[0];
    const d = new Date(ref + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = current;
  const firstDay = new Date(year, month, 1).getDay();
  const blanks = firstDay === 0 ? 6 : firstDay - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const events = [];

    // General task bar
    if (generalTask.startDate && generalTask.endDate) {
      if (dateStr >= generalTask.startDate && dateStr <= generalTask.endDate) {
        const isFirst = dateStr === generalTask.startDate;
        events.push({ type: 'general', isFirst, label: isFirst ? generalTask.name || 'Tarea General' : null });
      }
    }

    // Sub tasks
    subTasks.forEach((st, idx) => {
      if (st.date === dateStr) {
        events.push({ type: 'sub', label: st.name || `Tarea ${idx+1}`, color: COLORS[idx % COLORS.length] });
      }
    });

    return events;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--glass-border)', background:'var(--bg-secondary)' }}>
        <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700 }}>{monthNames[month]} {year}</h3>
        <div style={{ display:'flex', gap:'6px' }}>
          <button className="btn-secondary" style={{ padding:'6px 8px' }}
            onClick={() => setCurrent(prev => {
              const d = new Date(prev.year, prev.month - 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn-secondary" style={{ padding:'6px 8px' }}
            onClick={() => setCurrent(prev => {
              const d = new Date(prev.year, prev.month + 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'1px', background:'var(--glass-border)' }}>
        {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
          <div key={d} style={{ background:'var(--bg-secondary)', padding:'8px 4px', textAlign:'center', fontSize:'0.72rem', fontWeight:600, color:'var(--text-muted)' }}>{d}</div>
        ))}
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`b${i}`} style={{ background:'var(--bg-primary)', minHeight:'80px' }} />
        ))}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const events = getEventsForDay(day);
          const isToday = dateStr === today;
          const hasGeneral = events.some(e => e.type === 'general');

          return (
            <div key={day} style={{
              background: hasGeneral ? 'rgba(59,130,246,0.06)' : 'var(--bg-primary)',
              minHeight:'80px', padding:'6px',
              borderTop: isToday ? '2px solid var(--accent-primary)' : 'none',
              position:'relative'
            }}>
              <div style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:'22px', height:'22px', borderRadius:'50%',
                background: isToday ? 'var(--accent-primary)' : 'transparent',
                color: isToday ? '#fff' : 'inherit',
                fontWeight: isToday ? 700 : 500,
                fontSize:'0.8rem', marginBottom:'4px'
              }}>{day}</div>

              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                {events.map((ev, eidx) => {
                  if (ev.type === 'general') {
                    return ev.isFirst ? (
                      <div key={eidx} style={{
                        background:'rgba(59,130,246,0.2)', borderLeft:'3px solid #3b82f6',
                        padding:'2px 5px', borderRadius:'0 4px 4px 0',
                        fontSize:'0.68rem', fontWeight:700, color:'#3b82f6',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                      }}>{ev.label}</div>
                    ) : (
                      <div key={eidx} style={{ height:'3px', background:'rgba(59,130,246,0.25)', borderRadius:'2px', margin:'2px 0' }} />
                    );
                  }
                  return (
                    <div key={eidx} style={{
                      background: ev.color + '22', borderLeft:`3px solid ${ev.color}`,
                      padding:'2px 5px', borderRadius:'0 4px 4px 0',
                      fontSize:'0.68rem', fontWeight:600, color: ev.color,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                    }}>{ev.label}</div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div style={{ padding:'12px 20px', borderTop:'1px solid var(--glass-border)', display:'flex', gap:'16px', flexWrap:'wrap', fontSize:'0.75rem', color:'var(--text-muted)' }}>
        <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'2px', background:'rgba(59,130,246,0.3)', border:'2px solid #3b82f6' }} />
          Rango Tarea General
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'2px', background: COLORS[0] + '44', border:`2px solid ${COLORS[0]}` }} />
          Tareas Específicas
        </span>
      </div>
    </div>
  );
};

// ── Componente principal ────────────────────────────────────────
const WorkOrderPlanner = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const { assets, maintenancePlans, assetCategoriesTree, setGlobalAlert, refreshMaintenances, maintenanceTypesTree, employees, getCategoriesForScope, getEntitiesForScope } = useAppContext();

  // Scope: from plan, or from URL ?scope=
  const plan = maintenancePlans.find(p => p.Id === planId);
  const currentScope = plan?.scope || searchParams.get('scope') || 'activo';
  const entityInfo = getEntitiesForScope(currentScope);
  const isAssetScope = entityInfo.type === 'activo';

  const flattenTypes = (nodes) => {
    let types = [];
    for (const node of (nodes || [])) {
      types.push(node);
      if (node.children) types = [...types, ...flattenTypes(node.children)];
    }
    return types;
  };
  const allTypes = flattenTypes(maintenanceTypesTree);

  // Filtrar tipos según contexto:
  // - Con plan (programación) → solo Preventivo
  // - Sin plan (orden directa) → solo Correctivo / Correctivo Programado
  const availableTypes = useMemo(() => {
    if (planId) {
      // Viene de un plan → solo preventivos
      return allTypes.filter(t => t.name.toLowerCase().includes('preventivo'));
    }
    // Orden directa → solo correctivos
    return allTypes.filter(t => t.name.toLowerCase().includes('correctivo'));
  }, [allTypes, planId]);

  // ── Filtrar entidades por scope del módulo + categoría del plan ─────────────
  const filteredEntities = useMemo(() => {
    // Para scopes no-activo, retornar las entidades directamente (areas o habitaciones)
    if (!isAssetScope) return entityInfo.items;

    // Scope tipo activo: filtrar por categorías del scope
    const scopeCategories = getCategoriesForScope(currentScope);
    const scopeCatIds = new Set();
    const collectIds = (nodes) => {
      for (const n of nodes) {
        scopeCatIds.add(n.id);
        if (n.children) collectIds(n.children);
      }
    };
    collectIds(scopeCategories);

    let baseAssets = scopeCatIds.size > 0
      ? assets.filter(a => scopeCatIds.has(a.categoryId || a.CategoryId || '') || scopeCatIds.has(a.sectionId || '') || scopeCatIds.has(a.familyId || '') || scopeCatIds.has(a.subFamilyId || ''))
      : assets;

    // Si hay plan con categoría específica, filtrar más
    if (!plan) return baseAssets;
    const catId = plan.CategoryId;
    const famId = plan.FamilyId;
    if (!catId) return baseAssets;

    // Recopilar todos los IDs descendientes de la categoría del plan
    const planCatIds = new Set([catId]);
    const collectDescendants = (nodes) => {
      for (const n of nodes) {
        if (planCatIds.has(n.id)) {
          // Agregar todos los hijos recursivamente
          const addAll = (children) => {
            for (const c of children) { planCatIds.add(c.id); if (c.children) addAll(c.children); }
          };
          if (n.children) addAll(n.children);
        }
        if (n.children) collectDescendants(n.children);
      }
    };
    collectDescendants(scopeCategories.length > 0 ? scopeCategories : assetCategoriesTree);

    return baseAssets.filter(asset => {
      // Verificar si la categoría, sección, familia o subfamilia del activo coincide con la categoría del plan o sus descendientes
      const assetCat = asset.categoryId || asset.CategoryId || '';
      const assetSec = asset.sectionId || '';
      const assetFam = asset.familyId || '';
      const assetSub = asset.subFamilyId || '';

      const catMatch = planCatIds.has(assetCat) || planCatIds.has(assetSec) || planCatIds.has(assetFam) || planCatIds.has(assetSub)
        || (asset.category || '').toLowerCase().trim() === (plan.Category || '').toLowerCase().trim();

      if (!catMatch) return false;

      if (famId) {
        // La "familia" del plan puede corresponder a familyId O sectionId del activo
        if (asset.familyId === famId || asset.sectionId === famId || asset.subFamilyId === famId) return true;
        const famName = (plan.FamilyName || plan.SubFamily || '').toLowerCase().trim();
        return (asset.family || '').toLowerCase().trim() === famName
          || (asset.sectionName || '').toLowerCase().trim() === famName
          || (asset.subFamily || '').toLowerCase().trim() === famName;
      }
      return true;
    });
  }, [assets, plan, currentScope, getCategoriesForScope, isAssetScope, entityInfo.items, assetCategoriesTree]);

  // El tipo por defecto es el primero de la lista filtrada
  const defaultType = availableTypes[0] || null;

  const [generalTask, setGeneralTask] = useState({
    name: '',
    frequency: '',
    startDate: '',
    endDate: '',
    assetId: '',
    assignedTo: '',
    notes: '',
    typeId: defaultType?.id || '',
    typeName: defaultType?.name || (planId ? 'Preventivo' : 'Correctivo'),
  });

  const [subTasks, setSubTasks] = useState([
    { name: '', date: '', notes: '' }
  ]);

  useEffect(() => {
    if (plan && !generalTask.name) {
      setGeneralTask(prev => ({
        ...prev,
        name: plan.Description || 'Plan General',
        frequency: plan.PlanFrequency || 'Mensual',
        typeId: prev.typeId || (defaultType?.id || ''),
        typeName: prev.typeName || (defaultType?.name || 'Preventivo'),
      }));
      if (plan.tasks && plan.tasks.length > 0) {
        setSubTasks(plan.tasks.map(t => ({
          name: t.TaskDescription,
          date: '',
          notes: ''
        })));
      }
    }
  }, [plan, generalTask.name]);

  const [saving, setSaving] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState(null);
  const [copyTarget, setCopyTarget] = useState('');
  const [showCopyPanel, setShowCopyPanel] = useState(false);

  // Asset search combobox
  const [assetSearch, setAssetSearch] = useState('');
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const assetSearchRef = React.useRef(null);
  const assetDropdownRef = React.useRef(null);

  const selectedAsset = useMemo(() => {
    return filteredEntities.find(a => a.id === generalTask.assetId) || null;
  }, [filteredEntities, generalTask.assetId]);

  const assetSuggestions = useMemo(() => {
    if (!assetSearch.trim()) return filteredEntities;
    const q = assetSearch.toLowerCase();
    return filteredEntities.filter(a =>
      (a.id || '').toLowerCase().includes(q) ||
      (a.name || a.nombre || '').toLowerCase().includes(q) ||
      (a.serial || a.serialNumber || '').toLowerCase().includes(q) ||
      (a.location || a.ubicacion || '').toLowerCase().includes(q) ||
      (a.numero || '').toLowerCase().includes(q) ||
      (a.piso || '').toLowerCase().includes(q)
    );
  }, [filteredEntities, assetSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(e.target)) {
        setAssetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular duración del rango
  const rangeDays = useMemo(() => {
    if (!generalTask.startDate || !generalTask.endDate) return null;
    const d = daysBetween(generalTask.startDate, generalTask.endDate);
    return d >= 0 ? d + 1 : null;
  }, [generalTask.startDate, generalTask.endDate]);

  // Validar que sub-tareas caigan dentro del rango
  const validateSubDate = (date) => {
    if (!generalTask.startDate || !generalTask.endDate || !date) return true;
    return date >= generalTask.startDate && date <= generalTask.endDate;
  };

  const updateSubTask = (idx, field, val) => {
    setSubTasks(prev => prev.map((st, i) => i === idx ? { ...st, [field]: val } : st));
  };

  const addSubTask = () => setSubTasks(prev => [...prev, { name: '', date: '', notes: '' }]);

  const removeSubTask = (idx) => {
    if (subTasks.length > 1) setSubTasks(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Modal Auto-Programar ─────────────────────────────────────────
  const [showAutoModal, setShowAutoModal] = useState(false);
  // taskStartDates: { [taskIndex]: 'YYYY-MM-DD' }
  const [taskStartDates, setTaskStartDates] = useState({});

  const openAutoModal = () => {
    if (!generalTask.startDate || !generalTask.endDate) {
      setGlobalAlert({ isOpen: true, title: 'Atención', message: 'Define primero la Fecha Inicio y Fecha Fin del Plan General.' });
      return;
    }
    if (!plan || !plan.tasks?.length) return;
    // Pre-rellenar con la fecha inicio del plan
    const defaults = {};
    plan.tasks.forEach((_, i) => { defaults[i] = generalTask.startDate; });
    setTaskStartDates(defaults);
    setShowAutoModal(true);
  };

  // Genera todas las ocurrencias de una tarea según su frecuencia
  const generateOccurrences = (taskName, taskFreq, startDateStr, endDateStr) => {
    const freq = (taskFreq || 'mensual').toLowerCase();
    const end = new Date(endDateStr + 'T12:00:00');
    const results = [];
    let current = new Date(startDateStr + 'T12:00:00');

    // Avanza current según la frecuencia
    const advance = (date) => {
      const d = new Date(date);
      if (freq.includes('diari'))         d.setDate(d.getDate() + 1);
      else if (freq.includes('semanal'))  d.setDate(d.getDate() + 7);
      else if (freq.includes('quincenal'))d.setDate(d.getDate() + 15);
      else if (freq.includes('bimestral'))d.setMonth(d.getMonth() + 2);
      else if (freq.includes('trimestral'))d.setMonth(d.getMonth() + 3);
      else if (freq.includes('cuatrimestral'))d.setMonth(d.getMonth() + 4);
      else if (freq.includes('semestral'))d.setMonth(d.getMonth() + 6);
      else if (freq.includes('anual'))    d.setFullYear(d.getFullYear() + 1);
      else                                d.setMonth(d.getMonth() + 1); // mensual por defecto
      return d;
    };

    while (current <= end) {
      results.push({
        name: taskName,
        date: current.toISOString().split('T')[0],
        notes: `Freq: ${taskFreq || 'Mensual'}`
      });
      current = advance(current);
    }
    return results;
  };

  const applyAutoSchedule = () => {
    const newSubTasks = [];
    plan.tasks.forEach((t, i) => {
      const startDate = taskStartDates[i] || generalTask.startDate;
      const occurrences = generateOccurrences(
        t.TaskDescription,
        t.Frequency,
        startDate,
        generalTask.endDate
      );
      newSubTasks.push(...occurrences);
    });
    newSubTasks.sort((a, b) => a.date.localeCompare(b.date));
    setSubTasks(newSubTasks);
    setShowAutoModal(false);
    setGlobalAlert({ isOpen: true, title: '✅ Autoprogramado', message: `Se generaron ${newSubTasks.length} tareas programadas.` });
  };

  // Preview: cuántas ocurrencias generaría cada tarea
  const previewCount = (taskIndex) => {
    const t = plan?.tasks?.[taskIndex];
    if (!t || !taskStartDates[taskIndex] || !generalTask.endDate) return 0;
    return generateOccurrences(t.TaskDescription, t.Frequency, taskStartDates[taskIndex], generalTask.endDate).length;
  };

  // Guardar como orden de trabajo
  const handleSave = async () => {
    if (!generalTask.name || !generalTask.startDate || !generalTask.endDate || !generalTask.assetId) {
      setGlobalAlert({ isOpen: true, title: 'Campos Requeridos', message: `Completa el nombre, fechas y ${entityInfo.label.toLowerCase()} de la tarea general.` });
      return;
    }
    const invalidSub = subTasks.find(st => st.date && !validateSubDate(st.date));
    if (invalidSub) {
      setGlobalAlert({ isOpen: true, title: 'Fecha Inválida', message: `La tarea "${invalidSub.name || 'sin nombre'}" solo puede ser agregada en el rango de Fecha INI y Fecha Fin del plan inicial.` });
      return;
    }
    setSaving(true);
    try {
      // Guardar el Plan General como Work Order
      const mainId = `WO-${Math.floor(Math.random() * 99999)}`;
      const resMain = await api.post('/api/work-orders', {
        id: mainId,
        name: generalTask.name,
        assetId: isAssetScope ? generalTask.assetId : null,
        entityType: entityInfo.type,
        entityId: generalTask.assetId,
        startDate: generalTask.startDate,
        endDate: generalTask.endDate,
        assignedTo: generalTask.assignedTo || '',
        notes: generalTask.notes,
        scope: currentScope
      });

      if (!resMain?.ok) {
        const errData = await resMain?.json();
        throw new Error(`Error guardando Work Order: ${errData?.error || 'Error de red'}`);
      }

      // Crear sub-tickets para cada tarea específica
      // Si no tiene fecha, usar la fecha de inicio del plan general
      const validSubs = subTasks
        .filter(st => st.name)
        .map(st => ({ ...st, date: st.date || generalTask.startDate }));

      if (validSubs.length === 0) {
        // Sin sub-tareas: crear ticket principal para que aparezca en calendario y listas
        const resMain2 = await api.post('/api/maintenances', {
          id: `${mainId}-T1`,
          assetId: isAssetScope ? generalTask.assetId : null,
          entityType: entityInfo.type,
          entityId: generalTask.assetId,
          title: generalTask.name,
          typeId: generalTask.typeId || null,
          type: generalTask.typeName || 'Preventivo',
          provider: '',
          assignedTo: generalTask.assignedTo || '',
          startDate: generalTask.startDate,
          endDate: generalTask.endDate,
          status: 'PENDIENTE',
          description: generalTask.notes || '',
          workOrderId: mainId,
          scope: currentScope
        });
        if (!resMain2?.ok) {
          const errData = await resMain2?.json();
          throw new Error(`Error creando tarea: ${errData?.error || 'Error de red'}`);
        }
      }

      for (let idx = 0; idx < validSubs.length; idx++) {
        const st = validSubs[idx];
        const resSub = await api.post('/api/maintenances', {
          id: `${mainId}-T${idx+1}`,
          assetId: isAssetScope ? generalTask.assetId : null,
          entityType: entityInfo.type,
          entityId: generalTask.assetId,
          title: `${st.name}`,
          typeId: generalTask.typeId || null,
          type: generalTask.typeName || 'Preventivo',
          provider: '',
          assignedTo: generalTask.assignedTo || '',
          startDate: st.date,
          endDate: st.date,
          status: 'PENDIENTE',
          description: `[Sub-tarea de: ${generalTask.name}]\n${st.notes || ''}`,
          singleTask: st.name,
          workOrderId: mainId,
          scope: currentScope
        });

        if (!resSub?.ok) {
            const errData = await resSub?.json();
            throw new Error(`Error en Sub-tarea ${idx+1}: ${errData?.error || 'Error de red'}`);
        }
      }

      await refreshMaintenances();
      setGlobalAlert({ isOpen: true, title: '✅ Orden Creada', message: 'La orden de trabajo y sus sub-tareas fueron guardadas en el calendario.' });
      navigate(`/maintenances/work-orders${currentScope ? `?scope=${currentScope}` : ''}`);
    } catch(e) {
      setGlobalAlert({ isOpen: true, title: 'Error', message: e.message });
    }
    setSaving(false);
  };

  // Guardar plantilla (local)
  const saveTemplate = () => {
    const tpl = {
      name: generalTask.name,
      rangeDays: rangeDays,
      assignedTo: generalTask.assignedTo,
      notes: generalTask.notes,
      subTasks: subTasks.map(st => ({
        name: st.name,
        offsetDays: st.date && generalTask.startDate ? daysBetween(generalTask.startDate, st.date) : 0,
        notes: st.notes
      }))
    };
    setSavedTemplate(tpl);
    setGlobalAlert({ isOpen: true, title: '📋 Plantilla Guardada', message: 'Ahora puedes copiar esta configuración a otro activo.' });
  };

  // Aplicar plantilla a otro activo
  const applyTemplate = () => {
    if (!savedTemplate || !copyTarget || !generalTask.startDate) return;
    const newSubs = savedTemplate.subTasks.map(st => ({
      name: st.name,
      date: addDays(generalTask.startDate, st.offsetDays),
      notes: st.notes
    }));
    const newEnd = rangeDays ? addDays(generalTask.startDate, savedTemplate.rangeDays - 1) : generalTask.endDate;
    setGeneralTask(prev => ({
      ...prev,
      assetId: copyTarget,
      name: savedTemplate.name,
      endDate: newEnd,
      assignedTo: savedTemplate.assignedTo,
      notes: savedTemplate.notes
    }));
    setSubTasks(newSubs);
    setShowCopyPanel(false);
    setGlobalAlert({ isOpen: true, title: '✅ Plantilla Aplicada', message: `Configuración copiada al activo ${copyTarget}. Ajusta las fechas si necesitas.` });
  };

  return (
    <>
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <button className="btn-secondary" onClick={() => navigate('/maintenances')}
          style={{ marginBottom: '12px', display:'flex', alignItems:'center', gap:'6px' }}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h1 style={{ marginBottom: '6px' }}>Planificador de Orden de Trabajo</h1>
        <p className="text-muted">Define una tarea general con su rango de fechas y distribuye las tareas específicas dentro del calendario.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── IZQUIERDA: Formulario ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* Tarea General */}
          <div className="glass-panel" style={{ padding:'24px' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'18px', display:'flex', alignItems:'center', gap:'8px' }}>
              <Calendar size={18} color="var(--accent-primary)" /> Plan General
              {generalTask.frequency && <span style={{ fontSize:'0.85rem', fontWeight:400, color:'var(--text-muted)' }}>({generalTask.frequency})</span>}
            </h2>

            <div className="input-group" style={{ marginBottom:'14px' }}>
              <label>Nombre del Plan *</label>
              <input type="text" className="input-control"
                placeholder="Ej: Mantenimiento Preventivo Secadora S-01"
                value={generalTask.name}
                onChange={e => setGeneralTask(p => ({ ...p, name: e.target.value }))}
                disabled={!!plan} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
              <div className="input-group">
                <label>Fecha Inicio *</label>
                <input type="date" className="input-control"
                  value={generalTask.startDate}
                  onChange={e => setGeneralTask(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Fecha Fin *</label>
                <input type="date" className="input-control"
                  min={generalTask.startDate}
                  value={generalTask.endDate}
                  onChange={e => setGeneralTask(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>

            {rangeDays && (
              <div style={{ padding:'10px 14px', background:'rgba(59,130,246,0.08)', borderRadius:'8px', borderLeft:'3px solid var(--accent-primary)', marginBottom:'14px', fontSize:'0.85rem' }}>
                📅 Duración: <strong>{rangeDays} día{rangeDays !== 1 ? 's' : ''}</strong>
                &nbsp;({fmt(generalTask.startDate)} → {fmt(generalTask.endDate)})
              </div>
            )}

            <div className="input-group" style={{ marginBottom:'14px' }}>
              <label>{entityInfo.label} *</label>
              {/* Badge de alcance del plan */}
              {isAssetScope && plan && (plan.Category || plan.CategoryName) && (
                <div style={{
                  marginBottom: '8px', padding: '6px 12px',
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '6px', fontSize: '0.78rem',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Filter size={13} color="var(--accent-primary)" />
                  <span className="text-muted">Alcance:</span>
                  <strong style={{ color: 'var(--accent-primary)' }}>
                    {plan.Category || plan.CategoryName}
                    {(plan.FamilyName || plan.SubFamily) ? ` → ${plan.FamilyName || plan.SubFamily}` : ''}
                  </strong>
                  <span className="text-muted" style={{ marginLeft: 'auto' }}>
                    {filteredEntities.length} {entityInfo.label.toLowerCase()}{filteredEntities.length !== 1 ? 's' : ''} disponible{filteredEntities.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Searchable asset combobox */}
              <div ref={assetDropdownRef} style={{ position: 'relative' }}>
                {/* Selected asset display / search input */}
                {selectedAsset && !assetDropdownOpen ? (
                  <div
                    onClick={() => { setAssetDropdownOpen(true); setAssetSearch(''); setTimeout(() => assetSearchRef.current?.focus(), 50); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                      background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: 'rgba(59,130,246,0.1)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Package size={18} color="var(--accent-primary)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedAsset.name || selectedAsset.nombre}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: '4px' }}>{selectedAsset.id}</span>
                        {isAssetScope && (selectedAsset.serial || selectedAsset.serialNumber) && <span>S/N: {selectedAsset.serial || selectedAsset.serialNumber}</span>}
                        {!isAssetScope && selectedAsset.ubicacion && <span>{selectedAsset.ubicacion}</span>}
                        {!isAssetScope && selectedAsset.piso && <span>Piso: {selectedAsset.piso}</span>}
                        {!isAssetScope && selectedAsset.numero && <span>#{selectedAsset.numero}</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setGeneralTask(p => ({ ...p, assetId: '' })); setAssetSearch(''); }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '0 14px', borderRadius: '10px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)',
                    boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
                  }}>
                    <Search size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    <input
                      ref={assetSearchRef}
                      type="text"
                      value={assetSearch}
                      onChange={e => { setAssetSearch(e.target.value); setAssetDropdownOpen(true); }}
                      onFocus={() => setAssetDropdownOpen(true)}
                      placeholder={isAssetScope ? "Buscar por nombre, ID o serial..." : `Buscar ${entityInfo.label.toLowerCase()} por nombre, ID...`}
                      style={{
                        flex: 1, border: 'none', background: 'transparent',
                        padding: '11px 0', fontSize: '0.88rem', outline: 'none',
                        color: 'var(--text-main)',
                      }}
                    />
                    {assetSearch && (
                      <button onClick={() => setAssetSearch('')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* Dropdown suggestions */}
                {assetDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    marginTop: '4px', maxHeight: '240px', overflowY: 'auto',
                    background: '#fff', borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                    zIndex: 50,
                  }}>
                    {assetSuggestions.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        No se encontraron {entityInfo.labelPlural.toLowerCase()}
                      </div>
                    ) : (
                      assetSuggestions.map(a => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setGeneralTask(p => ({ ...p, assetId: a.id }));
                            setAssetSearch('');
                            setAssetDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid var(--glass-border)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '6px',
                            background: 'var(--bg-tertiary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Package size={15} color="var(--text-muted)" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {a.name || a.nombre}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
                              <span style={{ fontFamily: 'monospace', background: 'var(--bg-tertiary)', padding: '0 5px', borderRadius: '3px' }}>{a.id}</span>
                              {isAssetScope && (a.serial || a.serialNumber) && <span style={{ opacity: 0.8 }}>S/N: {a.serial || a.serialNumber}</span>}
                              {!isAssetScope && a.numero && <span style={{ opacity: 0.8 }}>#{a.numero}</span>}
                              {(a.area || a.location || a.ubicacion) && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', opacity: 0.8 }}>
                                  <span style={{ color: 'var(--accent-primary)' }}>|</span>
                                  {a.ubicacion || a.area}{(a.ubicacion || a.area) && (a.location || a.piso) ? ' · ' : ''}{a.location || (a.piso ? `Piso ${a.piso}` : '')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {filteredEntities.length === 0 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--warning)', marginTop: '6px' }}>
                  {isAssetScope
                    ? 'No hay activos registrados en este alcance. Verifica las categorías en Inventario.'
                    : `No hay ${entityInfo.labelPlural.toLowerCase()} registradas. Créalas desde la sección Infraestructura.`}
                </p>
              )}
            </div>

            <div className="input-group" style={{ marginBottom:'14px' }}>
              <label>Tipo de Mantenimiento *</label>
              <SearchableSelect
                value={generalTask.typeId}
                onChange={(value, label) => {
                  setGeneralTask(p => ({ ...p, typeId: value, typeName: label || '' }));
                }}
                options={availableTypes.map(t => ({ value: t.id, label: t.name }))}
                placeholder={availableTypes.length === 0 ? '— Sin tipos configurados —' : 'Seleccionar tipo...'}
                disabled={availableTypes.length === 0}
              />
            </div>

            <div className="input-group" style={{ marginBottom:'14px' }}>
              <label>Responsable</label>
              <SearchableSelect
                value={generalTask.assignedTo}
                onChange={(value) => setGeneralTask(p => ({ ...p, assignedTo: value }))}
                options={employees.map(e => ({ value: `${e.nombre} ${e.apellido}`, label: `${e.apellido}, ${e.nombre}` }))}
                placeholder="-- Seleccionar --"
                clearable={true}
              />
            </div>

            <div className="input-group">
              <label>Notas</label>
              <textarea className="input-control" rows={2}
                placeholder="Observaciones generales..."
                value={generalTask.notes}
                onChange={e => setGeneralTask(p => ({ ...p, notes: e.target.value }))}
                style={{ resize:'vertical' }} />
            </div>
          </div>
        </div>

        {/* ── DERECHA: Calendario ── */}
        <div>
          <MiniCalendar generalTask={generalTask} subTasks={subTasks} />
        </div>
      </div>

      {/* ── ABAJO: Tabla full width y Acciones ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
        <div className="glass-panel" style={{ padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:700, margin:0 }}>Planes Específicos</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {plan && plan.tasks && (
                <button className="btn-secondary" style={{ fontSize:'0.8rem', padding:'6px 12px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }} onClick={openAutoModal}>
                  <Calendar size={14} /> Auto-Programar
                </button>
              )}
              <button className="btn-secondary" style={{ fontSize:'0.8rem', padding:'6px 12px' }} onClick={addSubTask}>
                <Plus size={14} /> Agregar Tarea
              </button>
            </div>
          </div>

          {!generalTask.startDate && (
            <p className="text-muted" style={{ fontSize:'0.82rem', textAlign:'center', padding:'12px 0' }}>
              Define primero las fechas de Inicio y Fin del Plan General para validar el rango.
            </p>
          )}

          <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.85rem', margin: 0 }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>Nombre de la Tarea</th>
                  <th style={{ width: '180px' }}>Fecha Programada</th>
                  <th>Nota (Opcional)</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {subTasks.map((st, idx) => {
                  const outOfRange = st.date && !validateSubDate(st.date);
                  return (
                    <tr key={idx} style={{ background: outOfRange ? 'rgba(239,68,68,0.05)' : 'var(--bg-primary)' }}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <input type="text" className="input-control" style={{ background: 'transparent', border: 'none', padding: '4px 0', boxShadow: 'none' }}
                          placeholder="Nombre de la tarea..." value={st.name} onChange={e => updateSubTask(idx, 'name', e.target.value)} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input type="date" className="input-control" style={{ padding: '6px 10px', borderColor: outOfRange ? 'var(--danger)' : 'var(--glass-border)' }}
                          min={generalTask.startDate || undefined} max={generalTask.endDate || undefined}
                          value={st.date} onChange={e => updateSubTask(idx, 'date', e.target.value)} />
                        {outOfRange && <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '4px', lineHeight: 1.2 }}>Fuera de rango (Solo entre {fmt(generalTask.startDate)} y {fmt(generalTask.endDate)})</div>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input type="text" className="input-control" style={{ background: 'transparent', border: 'none', padding: '4px 0', boxShadow: 'none' }}
                          placeholder="Añadir nota..." value={st.notes} onChange={e => updateSubTask(idx, 'notes', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                        <button onClick={() => removeSubTask(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display:'flex', gap:'16px', justifyContent:'flex-end' }}>
          <div style={{ display:'flex', gap:'10px' }}>
            <button className="btn-secondary" onClick={saveTemplate}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'0.85rem' }}>
              <Copy size={16} /> Guardar como Plantilla
            </button>
            <button className="btn-secondary"
              onClick={() => setShowCopyPanel(!showCopyPanel)}
              disabled={!savedTemplate}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'0.85rem',
                opacity: savedTemplate ? 1 : 0.4 }}>
              <Check size={16} /> Copiar a Otro Activo
            </button>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}
            style={{ padding:'12px 32px', display:'flex', alignItems:'center', gap:'8px' }}>
            <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Orden de Trabajo'}
          </button>
        </div>

        {showCopyPanel && savedTemplate && (
          <div className="glass-panel" style={{ padding:'16px', border:'1px solid var(--accent-primary)', maxWidth: '400px', marginLeft: 'auto' }}>
            <p style={{ fontSize:'0.85rem', marginBottom:'10px', fontWeight:600 }}>
              📋 Plantilla: <em>{savedTemplate.name}</em> ({savedTemplate.rangeDays}d, {savedTemplate.subTasks.length} tareas)
            </p>
            <div className="input-group" style={{ marginBottom:'10px' }}>
              <label>Activo Destino</label>
              <SearchableSelect
                value={copyTarget}
                onChange={(value) => setCopyTarget(value)}
                options={filteredEntities.filter(a => a.id !== generalTask.assetId).map(a => ({ value: a.id, label: `${a.id} — ${a.name}` }))}
                placeholder="— Seleccionar —"
                clearable={true}
              />
            </div>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'10px' }}>
              Asegúrate de que la "Fecha Inicio" esté definida para calcular las fechas relativas.
            </p>
            <button className="btn-primary" onClick={applyTemplate} disabled={!copyTarget}
              style={{ width:'100%', justifyContent:'center', display:'flex', alignItems:'center', gap:'6px', padding:'10px' }}>
              <Check size={16} /> Aplicar Plantilla
            </button>
          </div>
        )}
      </div>
    </div>

    {/* ── Modal Auto-Programar ─────────────────────────────────────── */}
    {showAutoModal && plan?.tasks && (
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '680px',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)'
        }}>
          {/* Header */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Auto-Programar Tareas</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Define la fecha de inicio de cada tarea. El sistema generará todas las ocurrencias hasta <strong>{fmt(generalTask.endDate)}</strong> según su frecuencia.
              </p>
            </div>
            <button onClick={() => setShowAutoModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
          </div>

          {/* Body — una fila por tarea del plan */}
          <div style={{ overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {plan.tasks.map((t, i) => {
              const count = previewCount(i);
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto',
                  gap: '12px', alignItems: 'center',
                  padding: '14px 16px', background: 'var(--bg-secondary)',
                  borderRadius: '10px', border: '1px solid var(--glass-border)'
                }}>
                  {/* Info tarea */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {i + 1}. {t.TaskDescription}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', borderRadius: '4px', padding: '1px 7px', fontWeight: 600 }}>
                        {t.Frequency || 'Mensual'}
                      </span>
                      {count > 0 && (
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>→ {count} ocurrencia{count !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Fecha inicio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fecha inicio</label>
                    <input
                      type="date"
                      className="input-control"
                      style={{ padding: '6px 10px', fontSize: '0.85rem', width: '160px' }}
                      min={generalTask.startDate}
                      max={generalTask.endDate}
                      value={taskStartDates[i] || generalTask.startDate}
                      onChange={e => setTaskStartDates(prev => ({ ...prev, [i]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen total */}
          <div style={{ padding: '14px 28px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Calendar size={16} color="var(--accent-primary)" />
            <span className="text-muted">Total de tareas a generar:</span>
            <strong style={{ color: 'var(--accent-primary)', fontSize: '1rem' }}>
              {plan.tasks.reduce((sum, _, i) => sum + previewCount(i), 0)}
            </strong>
            <span className="text-muted">ocurrencias</span>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setShowAutoModal(false)}>Cancelar</button>
            <button
              className="btn-primary"
              onClick={applyAutoSchedule}
              disabled={plan.tasks.reduce((sum, _, i) => sum + previewCount(i), 0) === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Calendar size={16} /> Generar Programa
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default WorkOrderPlanner;
