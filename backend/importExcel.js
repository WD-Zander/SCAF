import 'dotenv/config';
import xlsx from 'xlsx';
import path from 'path';
import { getPool, sql } from './db.js';

async function importData() {
  try {
    const db = await getPool();
    const filePath = path.join(process.cwd(), '../Mantenimiento.xlsx');
    console.log(`Leyendo excel de: ${filePath}`);
    
    const wb = xlsx.readFile(filePath);
    
    // 1. Import Plans
    const plansSheet = wb.Sheets['Plan de Mantenimiento'];
    const plans = xlsx.utils.sheet_to_json(plansSheet);
    
    console.log(`Importando ${plans.length} Planes...`);
    for (const plan of plans) {
      await db.request()
        .input('id', sql.VarChar, plan.Id_plan.toString())
        .input('code', sql.VarChar, plan.Codigo_plan)
        .input('desc', sql.NVarChar, plan['Descripcion_del _plan'])
        .input('sublinea', sql.VarChar, plan.Sublinea)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM MaintenancePlans WHERE Id = @id)
          BEGIN
            INSERT INTO MaintenancePlans (Id, Code, Description, SubFamily) 
            VALUES (@id, @code, @desc, @sublinea)
          END
          ELSE
          BEGIN
            UPDATE MaintenancePlans 
            SET Code=@code, Description=@desc, SubFamily=@sublinea
            WHERE Id=@id
          END
        `);
    }

    // 2. Import Tasks
    const tasksSheet = wb.Sheets['Detalle de Mantenimiento'];
    const tasks = xlsx.utils.sheet_to_json(tasksSheet);
    
    console.log(`Importando ${tasks.length} Tareas...`);
    for (const task of tasks) {
      const planId = task['Descripcion del plan de Mmto']?.toString();
      if (!planId) continue;

      await db.request()
        .input('id', sql.VarChar, task.Id_Tarea.toString())
        .input('planId', sql.VarChar, planId)
        .input('taskDesc', sql.NVarChar, task.Tarea_del_plan)
        .input('freq', sql.VarChar, task.Frecuencia || 'N/A')
        .query(`
          IF NOT EXISTS (SELECT 1 FROM MaintenancePlanTasks WHERE Id = @id)
          BEGIN
            INSERT INTO MaintenancePlanTasks (Id, PlanId, TaskDescription, Frequency) 
            VALUES (@id, @planId, @taskDesc, @freq)
          END
          ELSE
          BEGIN
            UPDATE MaintenancePlanTasks 
            SET TaskDescription=@taskDesc, Frequency=@freq
            WHERE Id=@id
          END
        `);
    }

    console.log("¡Importación de Excel completada exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("Error importando Excel:", error);
    process.exit(1);
  }
}

importData();
