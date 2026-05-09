import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../api';

// ─── ORDEN DE CARGA POR DEPENDENCIAS ────────────────────────────────────────
// 1. Estados de Activos   → sin dependencias; requerido por ACTIVO
// 2. Formas de Pago       → sin dependencias; requerido por PROVEEDOR
// 3. Tipos de Mant.       → sin dependencias; requerido por TICKET_MANT
// 4. Organizaciones       → sin dependencias; requerido por ACTIVO
// 5. Categorías           → sin dependencias; requerido por ACTIVO y PLAN_MANT
// 6. Proveedores          → depende de FORMA_PAGO
// 7. Activos              → depende de todos los anteriores
// ────────────────────────────────────────────────────────────────────────────
const MAPPING_STEPS = [
  {
    id: 'assetStatuses',
    name: '1. Estados de Activos',
    endpoint: '/api/files/assetStatuses/batch',
    hint: 'Base para clasificar activos. Cárgalo primero — los activos lo requieren. El NOMBRE es el identificador único; COLOR es opcional (ej: #22c55e).',
    templateData: [
      { 'NOMBRE': 'Activo',           'COLOR': '#22c55e' },
      { 'NOMBRE': 'Inactivo',         'COLOR': '#6b7280' },
      { 'NOMBRE': 'En Revisión',      'COLOR': '#f59e0b' },
      { 'NOMBRE': 'En Mantenimiento', 'COLOR': '#3b82f6' },
      { 'NOMBRE': 'Retirado',         'COLOR': '#ef4444' },
      { 'NOMBRE': 'Dado de Baja',     'COLOR': '#7c3aed' },
    ]
  },
  {
    id: 'paymentMethods',
    name: '2. Formas de Pago',
    endpoint: '/api/files/paymentMethods/batch',
    hint: 'Requerido antes de cargar Proveedores. El NOMBRE es el identificador único — solo usa la columna NOMBRE.',
    templateData: [
      { 'NOMBRE': 'Efectivo'               },
      { 'NOMBRE': 'Transferencia Bancaria' },
      { 'NOMBRE': 'Cheque'                 },
      { 'NOMBRE': 'Crédito 30 días'        },
      { 'NOMBRE': 'Crédito 60 días'        },
    ]
  },
  {
    id: 'maintenanceTypes',
    name: '3. Tipos de Mantenimiento',
    endpoint: '/api/files/maintenanceTypes/batch',
    hint: 'Soporta jerarquía: deja ID_PADRE vacío para tipos raíz, o usa el ID de un tipo padre para crear subtipos. El ID debe ser único.',
    templateData: [
      { 'ID': 'TM-PREV',      'NOMBRE': 'Preventivo',           'ID_PADRE': ''       },
      { 'ID': 'TM-CORR',      'NOMBRE': 'Correctivo',           'ID_PADRE': ''       },
      { 'ID': 'TM-PRED',      'NOMBRE': 'Predictivo',           'ID_PADRE': ''       },
      { 'ID': 'TM-PREV-MEC',  'NOMBRE': 'Preventivo Mecánico',  'ID_PADRE': 'TM-PREV'},
      { 'ID': 'TM-PREV-ELEC', 'NOMBRE': 'Preventivo Eléctrico', 'ID_PADRE': 'TM-PREV'},
    ]
  },
  {
    id: 'organization',
    name: '4. Organizaciones (Sedes y Deptos)',
    endpoint: '/api/files/organization/batch',
    hint: 'Estructura en árbol: Sede (sin padre) → Departamento → Área. Inserta primero los nodos raíz (ID_PADRE vacío), el archivo se procesa respetando ese orden.',
    templateData: [
      { 'ID': 'SEDE-001',  'NOMBRE': 'Sede Principal',     'ID_PADRE': ''         },
      { 'ID': 'DEP-001',   'NOMBRE': 'Sistemas',            'ID_PADRE': 'SEDE-001' },
      { 'ID': 'DEP-002',   'NOMBRE': 'Mantenimiento',       'ID_PADRE': 'SEDE-001' },
      { 'ID': 'DEP-003',   'NOMBRE': 'Administración',      'ID_PADRE': 'SEDE-001' },
      { 'ID': 'AREA-001',  'NOMBRE': 'Sala de Servidores',  'ID_PADRE': 'DEP-001'  },
      { 'ID': 'AREA-002',  'NOMBRE': 'Taller Técnico',      'ID_PADRE': 'DEP-002'  },
    ]
  },
  {
    id: 'categories',
    name: '5. Categorías de Activo',
    endpoint: '/api/files/categories/batch',
    hint: 'Árbol de 3 niveles: Familia → Subfamilia → Ítem. La Subfamilia es el campo clave para vincular activos a Planes de Mantenimiento.',
    templateData: [
      { 'ID': 'CAT-001', 'NOMBRE': 'Equipos IT',       'ID_PADRE': ''        },
      { 'ID': 'CAT-002', 'NOMBRE': 'Cómputo',           'ID_PADRE': 'CAT-001' },
      { 'ID': 'CAT-003', 'NOMBRE': 'Laptops',            'ID_PADRE': 'CAT-002' },
      { 'ID': 'CAT-004', 'NOMBRE': 'Servidores',         'ID_PADRE': 'CAT-002' },
      { 'ID': 'CAT-010', 'NOMBRE': 'Maquinaria',         'ID_PADRE': ''        },
      { 'ID': 'CAT-011', 'NOMBRE': 'Lavandería',         'ID_PADRE': 'CAT-010' },
      { 'ID': 'CAT-012', 'NOMBRE': 'Secadoras Ind.',     'ID_PADRE': 'CAT-011' },
    ]
  },
  {
    id: 'suppliers',
    name: '6. Proveedores',
    endpoint: '/api/suppliers/batch',
    hint: 'Requiere que las Formas de Pago estén cargadas (paso 2). El valor de "Forma de Pago" debe coincidir exactamente con un nombre del paso 2.',
    templateData: [
      {
        'ID':           'PROV-001',
        'Nombre':       'Proveedor Ejemplo S.A.',
        'RIF':          'J-12345678-9',
        'Contacto':     'Juan Pérez',
        'Teléfono':     '+58 212 555-0100',
        'Correo':       'contacto@proveedor.com',
        'Dirección':    'Av. Principal, Edificio Centro, Piso 3',
        'Forma de Pago':'Transferencia Bancaria',
      }
    ]
  },
  {
    id: 'assets',
    name: '7. Activos (Inventario Final)',
    endpoint: '/api/assets/batch',
    hint: 'Carga final — requiere todos los pasos anteriores. "Estado", "Categoría", "Departamento" y "Proveedor" deben coincidir exactamente con los nombres ya cargados.',
    templateData: [
      {
        'ID':                'ACT-001',
        'Nombre del Activo': 'Laptop Dell Inspiron',
        'Marca':             'Dell',
        'Modelo':            'Inspiron 15 3000',
        'Serial':            'SN-DELL-001',
        'Estado':            'Activo',
        'Categoría':         'Laptops',
        'Departamento':      'Sistemas',
        'Ubicación':         'Oficina 2B',
        'Área':              'Sala de Servidores',
        'Proveedor':         'Proveedor Ejemplo S.A.',
        'Custodio':          '',
        'Familia':           'Equipos IT',
        'Subfamilia':        'Cómputo',
        'Fecha Ingreso':     '2024-01-15',
        'Costo Adquisición': 1200.00,
        'Valor Actual':      950.00,
        'Descripción':       'Laptop para uso administrativo',
        'Observaciones':     '',
      }
    ]
  },
  {
    id: 'maintenancePlans',
    name: '8. Planes de Mantenimiento',
    endpoint: '/api/maintenance-plans/batch',
    hint: 'Sube la cabecera de los planes. Requerido: Codigo_plan (o Id_plan), Descripcion_del_plan y Sublinea.',
    templateData: [
      {
        'Codigo_plan': 'PLAN-0002',
        'Descripcion_del_plan': 'Mantenimiento Preventivo Semanal Ascensores',
        'Sublinea': 'Ascensores',
        'Frecuencia': 'Semanal'
      }
    ]
  },
  {
    id: 'maintenanceTasks',
    name: '9. Tareas de Mantenimiento',
    endpoint: '/api/maintenance-plans/batch',
    hint: 'Sube las tareas específicas vinculadas a cada plan. Requerido: IDPLAN (que coincida con el Codigo_plan cargado antes), Tarea_del_plan y Frecuencia.',
    templateData: [
      {
        'IDPLAN': 'PLAN-0002',
        'Tarea_del_plan': 'Achicar Ascensores Todos Los Lunes De Cada Semana',
        'Frecuencia': 'Semanal'
      }
    ]
  }
];

const ImportMappings = () => {
  const { setGlobalAlert, refreshFiles, refreshSuppliers, refreshAssets } = useAppContext();
  const [completedSteps, setCompletedSteps] = useState([]);
  const fileInputRef = useRef(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStepRef = useRef(MAPPING_STEPS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadTemplate = (step) => {
    const worksheet = XLSX.utils.json_to_sheet(step.templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, `Plantilla_${step.id}.xlsx`);
  };

  const processExcel = (file, step) => {
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          setGlobalAlert({ isOpen: true, title: 'Aviso', message: 'El archivo Excel está vacío.'});
          setIsLoading(false);
          return;
        }

        let payload;
        if (step.id === 'assets') {
          payload = {
            assets: json.map(row => {
              const assetId = (row['ID'] || row['Código ID'] || `ACT-IMP-${Math.floor(Math.random()*10000)}`).toString().trim();
              const rawName = (row['Nombre del Activo'] || row['NOMBRE'] || 'ACTIVO SIN NOMBRE').toString().trim();

              let serialVal = (row['Serial'] || row['SERIAL'] || '').toString().trim();
              if (!serialVal || ['por identificar','n/a','s/n',''].includes(serialVal.toLowerCase())) {
                serialVal = `S/N-${assetId}`;
              }

              const parseDate = (v) => {
                if (!v) return new Date().toISOString().split('T')[0];
                // Excel puede dar número de serie de fecha
                if (typeof v === 'number') {
                  const d = new Date(Math.round((v - 25569) * 86400 * 1000));
                  return d.toISOString().split('T')[0];
                }
                return v.toString().trim() || new Date().toISOString().split('T')[0];
              };

              return {
                id:              assetId,
                name:            rawName.substring(0, 148),
                serial:          serialVal,
                brand:           (row['Marca']   || row['MARCA']   || '').toString().trim(),
                model:           (row['Modelo']  || row['MODELO']  || '').toString().trim(),
                status:          (row['Estado']  || row['ESTADO']  || 'Activo').toString().trim(),
                description:     (row['Descripción'] || row['DESCRIPCION'] || (rawName.length > 148 ? rawName : '')).toString().trim(),
                observations:    (row['Observaciones'] || row['OBS'] || '').toString().trim(),
                category:        (row['Categoría'] || row['CATEGORIA'] || '').toString().trim(),
                department:      (row['Departamento'] || row['DEPARTAMENTO'] || '').toString().trim(),
                location:        (row['Ubicación']    || row['UBICACION']    || '').toString().trim(),
                area:            (row['Área']         || row['AREA']         || '').toString().trim(),
                supplier:        (row['Proveedor']    || row['PROVEEDOR']    || '').toString().trim(),
                assignedTo:      (row['Custodio']     || row['CUSTODIO']     || '').toString().trim(),
                family:          (row['Familia']      || row['FAMILIA']      || '').toString().trim(),
                subFamily:       (row['Subfamilia']   || row['SUBFAM']       || '').toString().trim(),
                entryDate:       parseDate(row['Fecha Ingreso'] || row['FECHA_INGRESO']),
                acquisitionCost: parseFloat(row['Costo Adquisición'] || row['COSTO_ADQUIS'] || 0) || 0,
                currentValue:    parseFloat(row['Valor Actual']      || row['VALOR_ACTUAL']  || 0) || 0,
              };
            }).filter(a => a.id)
          };
        } else if (['assetStatuses', 'paymentMethods'].includes(step.id)) {
          // ESTADO_ACTIVO y FORMA_PAGO: ID = NOMBRE en el nuevo esquema
          payload = {
            items: json.map(row => {
              const nombre = (row['NOMBRE'] || row['Nombre'] || '').toString().trim();
              const color  = (row['COLOR']  || row['Color']  || '').toString().trim();
              const item = { NOMBRE: nombre };
              if (color) item.COLOR = color;
              return item;
            }).filter(r => r.NOMBRE)
          };
        } else if (step.id === 'suppliers') {
          payload = {
            suppliers: json.map((row, i) => ({
              id:            (row['ID']           || row['Código ID']   || `PROV-IMP-${i+1}`).toString().trim(),
              name:          (row['Nombre']        || row['NOMBRE']      || '').toString().trim(),
              rif:           (row['RIF']           || row['Rif']         || '').toString().trim() || null,
              contact:       (row['Contacto']      || row['CONTACTO']    || '').toString().trim(),
              phone:         (row['Teléfono']      || row['TEL']         || '').toString().trim(),
              email:         (row['Correo']        || row['CORREO']      || '').toString().trim(),
              address:       (row['Dirección']     || row['DIR']         || '').toString().trim(),
              paymentMethod: (row['Forma de Pago'] || row['ID_FORMA_PAGO']|| '').toString().trim() || null,
            })).filter(s => s.name)
          };
        } else if (step.id === 'maintenancePlans') {
          payload = {
            plans: json.map(row => ({
              ...row,
              Codigo_plan: row['Codigo_plan'] || row['Id_plan'] || row['IDPLAN'],
              Id_plan: row['Codigo_plan'] || row['Id_plan'] || row['IDPLAN']
            }))
          };
        } else if (step.id === 'maintenanceTasks') {
          payload = {
            tasks: json.map(row => ({
              ...row,
              'Descripcion del plan de Mmto': row['IDPLAN'] || row['Descripcion del plan de Mmto'] || row['Codigo_plan']
            }))
          };
        } else {
          payload = { items: json };
        }

        const res = await api.post(step.endpoint, payload);

        if (res?.ok) {
           const resData = await res.json();
           setGlobalAlert({ isOpen: true, title: 'Éxito', message: `✅ ${resData.count || json.length} registros cargados correctamente.`});
           if (step.id === 'assets') refreshAssets();
           else if (step.id === 'suppliers') refreshSuppliers();
           else refreshFiles();
           if (!completedSteps.includes(step.id)) {
             setCompletedSteps([...completedSteps, step.id]);
             if (activeStepIndex < MAPPING_STEPS.length - 1) {
               setActiveStepIndex(activeStepIndex + 1);
             }
           }
        } else {
           let errMsg = `Error HTTP ${res?.status || 'desconocido'}`;
           try {
             const errObj = await res?.json();
             errMsg = errObj?.error || errMsg;
           } catch(e) {
             const text = await res?.text();
             errMsg = `El servidor rechazó la carga (probablemente el archivo es muy pesado o el formato es incorrecto). Detalle: ${(text || '').substring(0, 100)}`;
           }
           setGlobalAlert({ isOpen: true, title: 'Error del Servidor', message: errMsg });
        }
      } catch (err) {
        console.error(err);
        setGlobalAlert({ isOpen: true, title: 'Error Inesperado', message: 'Fallo al leer el archivo Excel o error de red.'});
      }
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
         <h2 style={{ marginBottom: '8px' }}>Mappings de Importación (Asistente de Migración)</h2>
         <p className="text-muted">
           Sigue el orden numerado para garantizar la integridad referencial. Cada paso depende del anterior: los Activos requieren Estados, Categorías, Organizaciones y Proveedores previamente cargados.
         </p>
         
         {isLoading && (
           <div style={{ marginTop: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '16px', border: '1px solid var(--accent-primary)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-primary)' }}>
               <Loader2 size={20} className="spinner" />
               <strong>Cargando y procesando datos masivos... Por favor no cierre la ventana.</strong>
             </div>
             <div style={{ marginTop: '12px', height: '6px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
               <div style={{ height: '100%', background: 'var(--accent-primary)', width: '50%', animation: 'pulse 1.5s infinite' }}></div>
             </div>
           </div>
         )}
      </div>

      <input 
        type="file" 
        accept=".xlsx, .xls" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={(e) => processExcel(e.target.files[0], activeStepRef.current)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {MAPPING_STEPS.map((step, index) => {
           const isCompleted = completedSteps.includes(step.id);
           const isActive = index === activeStepIndex;

           return (
             <div 
               key={step.id} 
               style={{ 
                 display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                 padding: '20px 24px', 
                 border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                 borderRadius: '12px',
                 background: isActive ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-secondary)',
                 transition: 'all 0.3s ease'
               }}
             >
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 {isCompleted ? <CheckCircle size={28} color="var(--success)" /> : <Circle size={28} color={isActive ? "var(--accent-primary)" : "var(--text-muted)"} />}
                 <div>
                   <span style={{ fontWeight: isActive ? 600 : 500, fontSize: '1.1rem', color: isActive ? 'var(--accent-primary)' : 'var(--text-main)' }}>{step.name}</span>
                   {isActive && step.hint && (
                     <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '600px' }}>{step.hint}</p>
                   )}
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button 
                   className="btn-secondary" 
                   disabled={isLoading}
                   onClick={() => handleDownloadTemplate(step)}
                 >
                   <Download size={18} /> Ejemplo XLS
                 </button>
                 <button 
                   className="btn-primary" 
                   disabled={isLoading}
                   onClick={() => { activeStepRef.current = step; setActiveStepIndex(index); fileInputRef.current?.click(); }}
                 >
                   {isActive && isLoading ? <Loader2 size={18} className="spinner"/> : <Upload size={18} />} Cargar Mapping
                 </button>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default ImportMappings;
