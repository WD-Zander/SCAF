import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import {
  ArrowLeft, Calendar, Plus, Trash2, Copy, Save, ChevronLeft, ChevronRight, Check, Filter
} from 'lucide-react';
import { api } from '../../api';

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
  const { assets, maintenancePlans, assetCategoriesTree, setGlobalAlert, refreshMaintenances } = useAppContext();

  const plan = maintenancePlans.find(p => p.Id === planId);

  // ── Filtrar activos por el alcance definido en el plan ─────────────
  // La BD guarda CATEGORIA como nombre de la categoría y SUBFAMILIA como familia
  // El PlanForm guarda CategoryId y FamilyId (IDs del árbol de categorías)
  const filteredAssets = useMemo(() => {
    if (!plan) return assets;

    const catId = plan.CategoryId;
    const famId = plan.FamilyId;

    if (!catId) return assets; // Sin alcance definido → todos los activos

    return assets.filter(asset => {
      // 1. La categoría raíz debe coincidir (por ID siempre que esté disponible)
      const catMatch = asset.categoryId
        ? asset.categoryId === catId
        : (asset.category || '').toLowerCase().trim() === (plan.Category || '').toLowerCase().trim();

      if (!catMatch) return false;

      // 2. Si el plan tiene familia, el activo debe tener ese familyId
      //    Fallback por nombre de texto para activos creados antes de esta versión
      if (famId) {
        if (asset.familyId) return asset.familyId === famId;
        // Fallback: comparar nombre de familia (activos sin ID_FAM en BD aún)
        const famName = (plan.FamilyName || plan.SubFamily || '').toLowerCase().trim();
        return (asset.family || '').toLowerCase().trim() === famName;
      }

      return true;
    });
  }, [assets, plan, assetCategoriesTree]);

  const [generalTask, setGeneralTask] = useState({
    name: '',
    frequency: '',
    startDate: '',
    endDate: '',
    assetId: '',
    assignedTo: '',
    notes: '',
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

  const autoScheduleYear = () => {
    if (!generalTask.startDate) {
      setGlobalAlert({ isOpen: true, title: 'Atención', message: 'Define la Fecha Inicio del Plan General primero.' });
      return;
    }
    
    // Configurar endDate a 1 año menos 1 día
    const start = new Date(generalTask.startDate + 'T12:00:00');
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    
    setGeneralTask(p => ({ ...p, endDate: end.toISOString().split('T')[0] }));

    if (!plan || !plan.tasks) return;

    const newSubTasks = [];
    plan.tasks.forEach(t => {
      const freq = t.Frequency?.toLowerCase() || 'mensual';
      let intervals = 12;
      if (freq.includes('bimestral')) intervals = 6;
      else if (freq.includes('trimestral')) intervals = 4;
      else if (freq.includes('semestral')) intervals = 2;
      else if (freq.includes('anual')) intervals = 1;

      for (let i = 0; i < intervals; i++) {
        const taskDate = new Date(start);
        // Add months based on interval spacing
        taskDate.setMonth(taskDate.getMonth() + (i * (12 / intervals)));
        
        newSubTasks.push({
          name: t.TaskDescription,
          date: taskDate.toISOString().split('T')[0],
          notes: `Freq: ${t.Frequency || 'Mensual'}`
        });
      }
    });

    newSubTasks.sort((a, b) => a.date.localeCompare(b.date));
    setSubTasks(newSubTasks);
    setGlobalAlert({ isOpen: true, title: '✅ Autoprogramado', message: 'Las tareas se han distribuido automáticamente para todo el año.' });
  };

  // Guardar como orden de trabajo
  const handleSave = async () => {
    if (!generalTask.name || !generalTask.startDate || !generalTask.endDate || !generalTask.assetId) {
      setGlobalAlert({ isOpen: true, title: 'Campos Requeridos', message: 'Completa el nombre, fechas y activo de la tarea general.' });
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
        assetId: generalTask.assetId,
        startDate: generalTask.startDate,
        endDate: generalTask.endDate,
        assignedTo: generalTask.assignedTo || '',
        notes: generalTask.notes
      });

      if (!resMain?.ok) {
        const errData = await resMain?.json();
        throw new Error(`Error guardando Work Order: ${errData?.error || 'Error de red'}`);
      }

      // Crear sub-tickets para cada tarea específica directamente
      for (let idx = 0; idx < subTasks.length; idx++) {
        const st = subTasks[idx];
        if (!st.name || !st.date) continue;
        const resSub = await api.post('/api/maintenances', {
          id: `${mainId}-T${idx+1}`,
          assetId: generalTask.assetId,
          title: `${st.name}`,
          type: 'Preventivo',
          provider: '',
          assignedTo: generalTask.assignedTo || '',
          startDate: st.date,
          endDate: st.date,
          status: 'PENDIENTE',
          description: `[Sub-tarea de: ${generalTask.name}]\n${st.notes || ''}`,
          singleTask: st.name,
          workOrderId: mainId
        });

        if (!resSub?.ok) {
            const errData = await resSub?.json();
            throw new Error(`Error en Sub-tarea ${idx+1}: ${errData?.error || 'Error de red'}`);
        }
      }

      await refreshMaintenances();
      setGlobalAlert({ isOpen: true, title: '✅ Orden Creada', message: 'La orden de trabajo y sus sub-tareas fueron guardadas en el calendario.' });
      navigate('/calendar');
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
                onChange={e => setGeneralTask(p => ({ ...p, name: e.target.value }))} />
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
              <label>Activo *</label>
              {/* Badge de alcance del plan */}
              {plan && (plan.Category || plan.CategoryName) && (
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
                    {filteredAssets.length} activo{filteredAssets.length !== 1 ? 's' : ''} disponible{filteredAssets.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <select className="input-control"
                value={generalTask.assetId}
                onChange={e => setGeneralTask(p => ({ ...p, assetId: e.target.value }))}>
                <option value="">— Seleccionar activo —</option>
                {filteredAssets.map(a => (
                  <option key={a.id} value={a.id}>{a.id} — {a.name}</option>
                ))}
              </select>
              {plan && (plan.Category || plan.CategoryName) && filteredAssets.length === 0 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--warning)', marginTop: '6px' }}>
                  ⚠️ No hay activos registrados en este alcance. Verifica las categorías en Inventario.
                </p>
              )}
            </div>

            <div className="input-group" style={{ marginBottom:'14px' }}>
              <label>Responsable</label>
              <input type="text" className="input-control"
                placeholder="Nombre del técnico"
                value={generalTask.assignedTo}
                onChange={e => setGeneralTask(p => ({ ...p, assignedTo: e.target.value }))} />
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
                <button className="btn-secondary" style={{ fontSize:'0.8rem', padding:'6px 12px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }} onClick={autoScheduleYear}>
                  <Calendar size={14} /> Auto-Programar (1 Año)
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
              <select className="input-control" value={copyTarget} onChange={e => setCopyTarget(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {filteredAssets.filter(a => a.id !== generalTask.assetId).map(a => (
                  <option key={a.id} value={a.id}>{a.id} — {a.name}</option>
                ))}
              </select>
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
  );
};

export default WorkOrderPlanner;
