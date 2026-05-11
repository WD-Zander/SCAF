import path from 'path';
import xlsx from 'xlsx';

const generateTemplate = () => {
  const wb = xlsx.utils.book_new();

  // 1. Categorias
  const catData = [
    { ID: 'CAT-001', NOMBRE: 'Equipos de Cómputo', ID_PADRE: '' },
    { ID: 'CAT-002', NOMBRE: 'Laptops', ID_PADRE: 'CAT-001' },
    { ID: 'CAT-003', NOMBRE: 'Servidores', ID_PADRE: 'CAT-001' },
    { ID: 'CAT-004', NOMBRE: 'Equipos Industriales', ID_PADRE: '' },
  ];
  const wsCat = xlsx.utils.json_to_sheet(catData);
  xlsx.utils.book_append_sheet(wb, wsCat, 'Categorias');

  // 2. Organizaciones
  const orgData = [
    { ID: 'ORG-001', NOMBRE: 'Sede Principal', ID_PADRE: '' },
    { ID: 'ORG-002', NOMBRE: 'Departamento de TI', ID_PADRE: 'ORG-001' },
    { ID: 'ORG-003', NOMBRE: 'Planta de Ensamblaje', ID_PADRE: '' },
  ];
  const wsOrg = xlsx.utils.json_to_sheet(orgData);
  xlsx.utils.book_append_sheet(wb, wsOrg, 'Organizaciones');

  // 3. Tipos_Mantenimiento
  const tmData = [
    { NOMBRE: 'Preventivo' },
    { NOMBRE: 'Correctivo' },
    { NOMBRE: 'Predictivo' },
    { NOMBRE: 'Inspección de Rutina' },
  ];
  const wsTm = xlsx.utils.json_to_sheet(tmData);
  xlsx.utils.book_append_sheet(wb, wsTm, 'Tipos_Mantenimiento');

  // 4. Estados_Activo
  const eaData = [
    { NOMBRE: 'ACTIVO' },
    { NOMBRE: 'EN MANTENIMIENTO' },
    { NOMBRE: 'INACTIVO / DE BAJA' },
    { NOMBRE: 'EN REPARACIÓN' },
  ];
  const wsEa = xlsx.utils.json_to_sheet(eaData);
  xlsx.utils.book_append_sheet(wb, wsEa, 'Estados_Activo');

  // 5. Formas_Pago
  const fpData = [
    { NOMBRE: 'Transferencia Bancaria' },
    { NOMBRE: 'Cheque' },
    { NOMBRE: 'Crédito a 30 días' },
    { NOMBRE: 'Efectivo' },
  ];
  const wsFp = xlsx.utils.json_to_sheet(fpData);
  xlsx.utils.book_append_sheet(wb, wsFp, 'Formas_Pago');

  // Guardar archivo
  const targetPath = path.join(process.cwd(), '../Migracion.xlsx');
  xlsx.writeFile(wb, targetPath);
  console.log(`Plantilla creada exitosamente en: ${targetPath}`);
};

generateTemplate();
