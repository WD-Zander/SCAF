import { getPool, sql } from '../db.js';
import { logAudit } from '../utils/auditLogger.js';

export const getMaintenancePlans = async (req, res) => {
  try {
    const db = await getPool();

    // Intentar leer con columnas de alcance (ID_CATEGORIA, etc.)
    // Si las columnas aún no existen en la BD, cae al query base sin ellas.
    let plansResult;
    try {
      plansResult = await db.request().query(`
        SELECT
          p.ID as "Id", p.CODIGO as "Code", p.DESCRIPCION as "Description",
          p.SUBFAM as "SubFamily", p.CATEGORIA as "Category", p.FRECUENCIA as "PlanFrequency",
          p.ACTIVO as "IsActive",
          p.ID_CATEGORIA as "CategoryId", p.ID_FAMILIA as "FamilyId", p.FAM_NOMBRE as "FamilyName",
          p.ID_SCOPE as "scopeId", sc.SLUG as scope
        FROM PLAN_MANT p
        LEFT JOIN SCOPE_MANT sc ON p.ID_SCOPE = sc.ID
      `);
    } catch {
      // Fallback: columnas de scope aún no existen
      try {
        plansResult = await db.request().query(`
          SELECT
            ID as "Id", CODIGO as "Code", DESCRIPCION as "Description",
            SUBFAM as "SubFamily", CATEGORIA as "Category", FRECUENCIA as "PlanFrequency",
            ACTIVO as "IsActive",
            ID_CATEGORIA as "CategoryId", ID_FAMILIA as "FamilyId", FAM_NOMBRE as "FamilyName",
            NULL as "scopeId", NULL as scope
          FROM PLAN_MANT
        `);
      } catch {
        plansResult = await db.request().query(`
          SELECT
            ID as "Id", CODIGO as "Code", DESCRIPCION as "Description",
            SUBFAM as "SubFamily", CATEGORIA as "Category", FRECUENCIA as "PlanFrequency",
            ACTIVO as "IsActive",
            NULL as "scopeId", NULL as scope
          FROM PLAN_MANT
        `);
      }
    }

    const tasksResult = await db.request().query(
      'SELECT ID as "Id", ID_PLAN as "PlanId", DESCRIPCION as "TaskDescription", FRECUENCIA as "Frequency" FROM TAREA_PLAN'
    );

    const plans = plansResult.recordset.map(plan => ({
      ...plan,
      tasks: tasksResult.recordset.filter(t => t.PlanId === plan.Id)
    }));

    res.json(plans);
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const batchMaintenancePlans = async (req, res) => {
  try {
    const { plans, tasks } = req.body;
    const db = await getPool();

    if (plans && plans.length > 0) {
      for (const p of plans) {
        // Por cada plan, intentar con columnas de alcance; si fallan, guardar sin ellas.
        // Esto garantiza que TODOS los planes se procesen aunque falte ejecutar la migración SQL.
        try {
          const existingPlan = await db.request()
            .input('id', sql.VarChar, p.Id_plan?.toString())
            .query(`SELECT 1 FROM PLAN_MANT WHERE ID = @id`);

          if (existingPlan.recordset.length === 0) {
            await db.request()
              .input('id', sql.VarChar, p.Id_plan?.toString())
              .input('code', sql.VarChar, p.Codigo_plan)
              .input('desc', sql.NVarChar, p['Descripcion_del _plan'] || p.Descripcion_del_plan || '')
              .input('sub', sql.VarChar, p.Sublinea || '')
              .input('cat', sql.VarChar, p.Categoria || p.Sublinea || '')
              .input('freq', sql.VarChar, p.Frecuencia || 'Mensual')
              .input('catId', sql.VarChar, p.CategoryId || null)
              .input('famId', sql.VarChar, p.FamilyId || null)
              .input('famName', sql.VarChar, p.FamilyName || null)
              .input('pscope', sql.VarChar, p.scope || p.Scope || null)
              .query(`
                INSERT INTO PLAN_MANT (ID, CODIGO, DESCRIPCION, SUBFAM, CATEGORIA, FRECUENCIA, ID_CATEGORIA, ID_FAMILIA, FAM_NOMBRE, ID_SCOPE)
                VALUES (@id, @code, @desc, @sub, @cat, @freq, @catId, @famId, @famName,
                  CASE WHEN @pscope IS NOT NULL THEN (SELECT ID FROM SCOPE_MANT WHERE SLUG=@pscope LIMIT 1) ELSE NULL END)
              `);
          } else {
            await db.request()
              .input('id', sql.VarChar, p.Id_plan?.toString())
              .input('code', sql.VarChar, p.Codigo_plan)
              .input('desc', sql.NVarChar, p['Descripcion_del _plan'] || p.Descripcion_del_plan || '')
              .input('sub', sql.VarChar, p.Sublinea || '')
              .input('cat', sql.VarChar, p.Categoria || p.Sublinea || '')
              .input('freq', sql.VarChar, p.Frecuencia || 'Mensual')
              .input('catId', sql.VarChar, p.CategoryId || null)
              .input('famId', sql.VarChar, p.FamilyId || null)
              .input('famName', sql.VarChar, p.FamilyName || null)
              .input('pscope', sql.VarChar, p.scope || p.Scope || null)
              .query(`
                UPDATE PLAN_MANT SET CODIGO=@code, DESCRIPCION=@desc, SUBFAM=@sub, CATEGORIA=@cat,
                  FRECUENCIA=@freq, ID_CATEGORIA=@catId, ID_FAMILIA=@famId, FAM_NOMBRE=@famName,
                  ID_SCOPE=CASE WHEN @pscope IS NOT NULL THEN (SELECT ID FROM SCOPE_MANT WHERE SLUG=@pscope LIMIT 1) ELSE ID_SCOPE END
                  WHERE ID=@id
              `);
          }
        } catch {
          // Fallback: columnas de scope no existen, insertar/actualizar sin ellas
          const existingPlan = await db.request()
            .input('id', sql.VarChar, p.Id_plan?.toString())
            .query(`SELECT 1 FROM PLAN_MANT WHERE ID = @id`);

          if (existingPlan.recordset.length === 0) {
            await db.request()
              .input('id', sql.VarChar, p.Id_plan?.toString())
              .input('code', sql.VarChar, p.Codigo_plan)
              .input('desc', sql.NVarChar, p['Descripcion_del _plan'] || p.Descripcion_del_plan || '')
              .input('sub', sql.VarChar, p.Sublinea || '')
              .input('cat', sql.VarChar, p.Categoria || p.Sublinea || '')
              .input('freq', sql.VarChar, p.Frecuencia || 'Mensual')
              .query(`
                INSERT INTO PLAN_MANT (ID, CODIGO, DESCRIPCION, SUBFAM, CATEGORIA, FRECUENCIA)
                VALUES (@id, @code, @desc, @sub, @cat, @freq)
              `);
          } else {
            await db.request()
              .input('id', sql.VarChar, p.Id_plan?.toString())
              .input('code', sql.VarChar, p.Codigo_plan)
              .input('desc', sql.NVarChar, p['Descripcion_del _plan'] || p.Descripcion_del_plan || '')
              .input('sub', sql.VarChar, p.Sublinea || '')
              .input('cat', sql.VarChar, p.Categoria || p.Sublinea || '')
              .input('freq', sql.VarChar, p.Frecuencia || 'Mensual')
              .query(`
                UPDATE PLAN_MANT SET CODIGO=@code, DESCRIPCION=@desc, SUBFAM=@sub,
                  CATEGORIA=@cat, FRECUENCIA=@freq WHERE ID=@id
              `);
          }
        }
      }
    }

    if (tasks && tasks.length > 0) {
      for (const [tIdx, t] of tasks.entries()) {
        if (!t['Descripcion del plan de Mmto']) continue;

        // Descripción: acepta variantes del nombre de columna del Excel
        const taskDesc = t.Tarea_del_plan || t['Tarea del Plan de Mmto'] || t['Tarea_del_Plan'] || t.TAREA || '';
        if (!taskDesc.trim()) continue; // Saltar filas sin descripción

        // ID: SIEMPRE generar uno único; nunca permitir NULL
        const taskId = (t.Id_Tarea?.toString()?.trim())
          || `TSK-${Date.now()}-${tIdx}-${Math.floor(Math.random() * 9999)}`;

        const existingTask = await db.request()
          .input('id', sql.VarChar, taskId)
          .query(`SELECT 1 FROM TAREA_PLAN WHERE ID = @id`);

        if (existingTask.recordset.length === 0) {
          await db.request()
            .input('id',  sql.VarChar,  taskId)
            .input('pid', sql.VarChar,  t['Descripcion del plan de Mmto']?.toString())
            .input('td',  sql.NVarChar, taskDesc)
            .input('tf',  sql.VarChar,  t.Frecuencia || 'Mensual')
            .query(`INSERT INTO TAREA_PLAN (ID, ID_PLAN, DESCRIPCION, FRECUENCIA) VALUES (@id, @pid, @td, @tf)`);
        } else {
          await db.request()
            .input('id',  sql.VarChar,  taskId)
            .input('td',  sql.NVarChar, taskDesc)
            .input('tf',  sql.VarChar,  t.Frecuencia || 'Mensual')
            .query(`UPDATE TAREA_PLAN SET DESCRIPCION=@td, FRECUENCIA=@tf WHERE ID=@id`);
        }
      }
    }

    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateMaintenancePlan = async (req, res) => {
  try {
    const { Code, Description, SubFamily, Category, CategoryId, FamilyId, FamilyName, PlanFrequency, scope } = req.body;
    const db = await getPool();

    try {
      await db.request()
        .input('id', sql.VarChar, req.params.id)
        .input('code', sql.VarChar, Code)
        .input('desc', sql.NVarChar, Description)
        .input('sub', sql.VarChar, SubFamily || null)
        .input('cat', sql.VarChar, Category || null)
        .input('pfreq', sql.VarChar, PlanFrequency || 'Mensual')
        .input('catId', sql.VarChar, CategoryId || null)
        .input('famId', sql.VarChar, FamilyId || null)
        .input('famName', sql.VarChar, FamilyName || null)
        .input('scope', sql.VarChar, scope || null)
        .query(`UPDATE PLAN_MANT SET CODIGO=@code, DESCRIPCION=@desc, SUBFAM=@sub, CATEGORIA=@cat, FRECUENCIA=@pfreq,
                ID_CATEGORIA=@catId, ID_FAMILIA=@famId, FAM_NOMBRE=@famName,
                ID_SCOPE=CASE WHEN @scope IS NOT NULL THEN (SELECT ID FROM SCOPE_MANT WHERE SLUG=@scope LIMIT 1) ELSE ID_SCOPE END
                WHERE ID=@id`);
    } catch {
      // Fallback: columnas de scope no existen todavía
      await db.request()
        .input('id', sql.VarChar, req.params.id)
        .input('code', sql.VarChar, Code)
        .input('desc', sql.NVarChar, Description)
        .input('sub', sql.VarChar, SubFamily || null)
        .input('cat', sql.VarChar, Category || null)
        .input('pfreq', sql.VarChar, PlanFrequency || 'Mensual')
        .query(`UPDATE PLAN_MANT SET CODIGO=@code, DESCRIPCION=@desc, SUBFAM=@sub,
                CATEGORIA=@cat, FRECUENCIA=@pfreq WHERE ID=@id`);
    }

    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const deleteMaintenancePlan = async (req, res) => {
  try {
    const db = await getPool();
    const planId = req.params.id;

    // Verificar tickets con trazabilidad irreversible (completados o reprogramados)
    const refs = await db.request().input('id', sql.VarChar, planId).query(`
      SELECT
        (SELECT COUNT(*) FROM TICKET_MANT WHERE ID_PLAN = @id AND BORRADO = 0 AND ESTADO = 'COMPLETADO') as completados,
        (SELECT COUNT(*) FROM TICKET_MANT t
          JOIN REPROGRAMACION r ON r.ID_TICKET = t.ID
          WHERE t.ID_PLAN = @id AND t.BORRADO = 0) as reprogramados,
        (SELECT COUNT(*) FROM TICKET_MANT t
          JOIN TAREA_TICKET tt ON tt.ID_TICKET = t.ID
          WHERE t.ID_PLAN = @id AND t.BORRADO = FALSE AND tt.COMPLETADO = TRUE) as tareasCompletadas
    `);

    const { completados, reprogramados, tareasCompletadas } = refs.recordset[0];

    if (completados > 0) {
      return res.status(409).json({
        error: `Este plan tiene ${completados} mantenimiento(s) completado(s) en el historial. No puede eliminarse; desactívalo si ya no está vigente.`
      });
    }
    if (reprogramados > 0) {
      return res.status(409).json({
        error: `Este plan tiene ${reprogramados} ticket(s) con reprogramaciones registradas. No puede eliminarse para preservar el historial.`
      });
    }
    if (tareasCompletadas > 0) {
      return res.status(409).json({
        error: `Este plan tiene ${tareasCompletadas} tarea(s) completada(s) en sus tickets. No puede eliminarse.`
      });
    }

    // Cascade: soft-delete tickets pendientes vinculados al plan
    await db.request().input('id', sql.VarChar, planId)
      .query(`UPDATE TICKET_MANT SET BORRADO=TRUE WHERE ID_PLAN = @id AND BORRADO = FALSE`);

    // Eliminar ORDEN_TRAB vinculadas al plan
    await db.request().input('id', sql.VarChar, planId)
      .query(`DELETE FROM ORDEN_TRAB WHERE ID_PLAN = @id`);

    // Eliminar tareas del plan y el plan mismo
    await db.request().input('id', sql.VarChar, planId)
      .query('DELETE FROM TAREA_PLAN WHERE ID_PLAN = @id');
    await db.request().input('id', sql.VarChar, planId)
      .query('DELETE FROM PLAN_MANT WHERE ID = @id');

    await logAudit(req, 'DELETE', 'Planes', planId, `Eliminación de plan de mantenimiento con cascade`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const updateMaintenancePlanTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    const db = await getPool();
    const planId = req.params.id;
    await db.request().input('pid', sql.VarChar, planId)
      .query('DELETE FROM TAREA_PLAN WHERE ID_PLAN = @pid');
    if (tasks && tasks.length > 0) {
      await Promise.all(tasks.map((t, idx) =>
        db.request()
          .input('id',  sql.VarChar,  `TSK-${Date.now()}-${idx}-${Math.floor(Math.random()*9999)}`)
          .input('pid', sql.VarChar,  planId)
          .input('td',  sql.NVarChar, t.TaskDescription)
          .input('tf',  sql.VarChar,  t.Frequency || 'Mensual')
          .query('INSERT INTO TAREA_PLAN (ID, ID_PLAN, DESCRIPCION, FRECUENCIA) VALUES (@id, @pid, @td, @tf)')
      ));
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e.message}); }
};

export const generateBatchSchedule = async (req, res) => {
  try {
    const {
      planId,
      assetIds,
      startDate,
      assignedTo,
      mainFrequency = 'Mensual',
      fixedDay = null,
      weekOffset = 0,
      scope = null,
    } = req.body;

    const db = await getPool();
    const [startY, startM] = startDate.split('-').map(Number);
    const cycles = 12;

    const freqMap = { 'mensual': 1, 'bimestral': 2, 'trimestral': 3, 'cuatrimestral': 4, 'semestral': 6, 'anual': 12 };
    const mainInterval = freqMap[mainFrequency.toLowerCase()] || 1;

    const adjustForSunday = (date) => {
      const d = new Date(date);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      return d;
    };

    const getTicketDate = (year, monthIndex, assetIndex) => {
      let date;
      if (fixedDay) {
        date = new Date(year, monthIndex, parseInt(fixedDay));
      } else {
        const assetWeek = assetIndex % 4;
        const dayOfMonth = (assetWeek + 1) * 7;
        date = new Date(year, monthIndex, dayOfMonth);
      }
      return adjustForSunday(date);
    };

    const planRes = await db.request().input('pid', sql.VarChar, planId)
      .query('SELECT ID as Id, DESCRIPCION as Description FROM PLAN_MANT WHERE ID = @pid');
    const plan = planRes.recordset[0];
    if (!plan) throw new Error("Plan no encontrado");

    const allTasksRes = await db.request().input('pid', sql.VarChar, planId)
      .query('SELECT ID as "Id", DESCRIPCION as "TaskDescription", FRECUENCIA as "Frequency" FROM TAREA_PLAN WHERE ID_PLAN = @pid ORDER BY FRECUENCIA');
    const allTasks = allTasksRes.recordset;

    const maxRes = await db.request()
      .query("SELECT ID FROM TICKET_MANT WHERE ID LIKE 'MT-%' ORDER BY ID DESC LIMIT 1");
    let maxId = 0;
    if (maxRes.recordset.length > 0) {
      const match = maxRes.recordset[0].ID.match(/MT-(\d+)/);
      if (match) maxId = parseInt(match[1], 10);
    }

    // Resolver tipoId y userId UNA SOLA VEZ antes del loop
    const tipoRes = await db.request().query(`
      SELECT ID as tipoId FROM TIPO_MANT WHERE NOMBRE LIKE '%Preventivo%' LIMIT 1
    `);
    const tipoId = tipoRes.recordset[0]?.tipoId || null;

    const userRes = await db.request()
      .input('uname', sql.VarChar, assignedTo || null)
      .query(`SELECT ID FROM USUARIO WHERE @uname IS NOT NULL AND NOMBRE = @uname LIMIT 1`);
    const userId = userRes.recordset[0]?.ID || null;

    // Resolver scope del plan o del parámetro
    let scopeId = null;
    try {
      if (scope) {
        const scopeRes = await db.request().input('slug', sql.VarChar, scope)
          .query(`SELECT ID FROM SCOPE_MANT WHERE SLUG = @slug LIMIT 1`);
        scopeId = scopeRes.recordset[0]?.ID || null;
      }
      if (!scopeId) {
        const planScopeRes = await db.request().input('pid', sql.VarChar, planId)
          .query(`SELECT ID_SCOPE FROM PLAN_MANT WHERE ID = @pid LIMIT 1`);
        scopeId = planScopeRes.recordset[0]?.ID_SCOPE || null;
      }
    } catch { /* ID_SCOPE column may not exist yet */ }

    // Recolectar todos los tickets y tareas a insertar
    const ticketRows = [];
    const taskRows   = [];
    let createdCount = 0;

    for (let assetIndex = 0; assetIndex < assetIds.length; assetIndex++) {
      const assetId = assetIds[assetIndex];

      for (let i = 0; i < cycles; i++) {
        if (i % mainInterval !== 0) continue;

        const targetMonthIndex = (startM - 1 + i) % 12;
        const targetYear = startY + Math.floor((startM - 1 + i) / 12);
        const cycleNumber = Math.floor(i / mainInterval) + 1;

        const isGranParada = (i === cycles - mainInterval) || (i + mainInterval >= cycles);

        const tasksToInclude = allTasks.filter(task => {
          if (isGranParada) return true;
          const taskFreq = (task.Frequency || 'Mensual').toLowerCase();
          const taskInterval = freqMap[taskFreq] || 1;
          return (i % taskInterval === 0) || (taskInterval < mainInterval);
        });

        if (tasksToInclude.length === 0) continue;

        const ticketDate = getTicketDate(targetYear, targetMonthIndex, assetIndex);
        const dateStr = `${ticketDate.getFullYear()}-${String(ticketDate.getMonth() + 1).padStart(2, '0')}-${String(ticketDate.getDate()).padStart(2, '0')}`;

        const visitLabel = isGranParada ? `Gran Parada Anual` : `Visita ${cycleNumber}`;
        const mtId = `MT-${String(maxId + 1 + createdCount).padStart(3, '0')}`;

        ticketRows.push({ mtId, assetId, title: `${plan.Description} - ${visitLabel}`, dateStr });

        for (const task of tasksToInclude) {
          const taskLabel = isGranParada && !['mensual','bimestral','trimestral','semestral'].includes((task.Frequency||'').toLowerCase())
            ? `${task.TaskDescription} (${task.Frequency || 'N/A'}) ⭐ Gran Parada`
            : `${task.TaskDescription} (${task.Frequency || 'N/A'})`;
          taskRows.push({ ticketId: mtId, taskDesc: taskLabel });
        }
        createdCount++;
      }
    }

    // Insertar todos los tickets en paralelo (con scope si existe)
    await Promise.all(ticketRows.map(t => {
      const req2 = db.request()
        .input('id',        sql.VarChar, t.mtId)
        .input('assetId',   sql.VarChar, t.assetId)
        .input('title',     sql.VarChar, t.title)
        .input('tipoId',    sql.VarChar, tipoId)
        .input('userId',    sql.VarChar, userId)
        .input('startDate', sql.Date,    t.dateStr)
        .input('planId',    sql.VarChar, planId);

      if (scopeId) {
        req2.input('scopeId', sql.Int, scopeId);
        return req2.query(`
          INSERT INTO TICKET_MANT (ID, ID_ACTIVO, TITULO, ID_TIPO_MANT, ID_ASIGNADO, FECHA_INICIO, ESTADO, ID_PLAN, ID_SCOPE)
          VALUES (@id, @assetId, @title, @tipoId, @userId, @startDate, 'PENDIENTE', @planId, @scopeId)
        `);
      }
      return req2.query(`
        INSERT INTO TICKET_MANT (ID, ID_ACTIVO, TITULO, ID_TIPO_MANT, ID_ASIGNADO, FECHA_INICIO, ESTADO, ID_PLAN)
        VALUES (@id, @assetId, @title, @tipoId, @userId, @startDate, 'PENDIENTE', @planId)
      `);
    }));

    // Insertar todas las tareas en paralelo (tickets ya existen)
    await Promise.all(taskRows.map(t =>
      db.request()
        .input('ticketId', sql.VarChar,  t.ticketId)
        .input('taskDesc', sql.NVarChar, t.taskDesc)
        .query(`INSERT INTO TAREA_TICKET (ID_TICKET, DESCRIPCION) VALUES (@ticketId, @taskDesc)`)
    ));

    await logAudit(req, 'POST', 'Cronograma', planId, `Generación masiva: ${createdCount} tickets para ${assetIds.length} activos.`);
    res.json({ success: true, count: createdCount });
  } catch(e) { res.status(500).json({error: e.message}); }
};