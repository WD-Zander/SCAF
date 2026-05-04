import { getPool, sql } from '../backend/db.js';

async function test() {
    try {
        const db = await getPool();
        const mainId = 'WO-DELETE-TEST';
        const assetId = (await db.request().query('SELECT TOP 1 ID FROM ACTIVOS')).recordset[0].ID;
        
        await db.request()
          .input('id', sql.VarChar, mainId)
          .input('name', sql.VarChar, 'Test Delete Plan')
          .input('assetId', sql.VarChar, assetId)
          .input('start', sql.Date, new Date())
          .input('end', sql.Date, new Date())
          .input('assigned', sql.VarChar, '')
          .input('notes', sql.NVarChar, '')
          .query(`
            INSERT INTO ORDENES_TRAB (ID, NOM_PLAN, ID_ACT, FEC_INI, FEC_FIN, ID_ASIG, NOTAS)
            VALUES (@id, @name, @assetId, @start, @end, NULL, @notes)
          `);

        const id = `${mainId}-T1`;
        await db.request()
          .input('id', sql.VarChar, id)
          .input('assetId', sql.VarChar, assetId)
          .input('title', sql.VarChar, 'Test Task')
          .input('typeId', sql.VarChar, null)
          .input('type', sql.VarChar, 'Preventivo')
          .input('providerId', sql.VarChar, null)
          .input('provider', sql.VarChar, '')
          .input('assignedTo', sql.VarChar, '')
          .input('startDate', sql.Date, new Date())
          .input('endDate', sql.Date, new Date())
          .input('status', sql.VarChar, 'PENDIENTE')
          .input('cost', sql.Decimal, 0)
          .input('desc', sql.NVarChar, '')
          .input('planId', sql.VarChar, null)
          .input('workOrderId', sql.VarChar, mainId)
          .query(`
            INSERT INTO TICKETS (ID, ID_ACT, TITULO, ID_TIPO, ID_PROV, ID_ASIG, FEC_INI, FEC_FIN, ESTADO, COSTO, DESCRIP, ID_PLAN, ID_OT)
            VALUES (@id, @assetId, @title,
              COALESCE(@typeId, COALESCE(
                (SELECT TOP 1 ID FROM TIPOS_MANT WHERE NOMBRE LIKE '%' + @type + '%'),
                (SELECT TOP 1 ID FROM TIPOS_MANT)
              )),
              COALESCE(@providerId, (SELECT TOP 1 ID FROM PROVEEDOR WHERE @provider != '' AND NOMBRE = @provider)),
              (SELECT TOP 1 ID FROM USUARIOS WHERE @assignedTo IS NOT NULL AND @assignedTo != '' AND NOMBRE = @assignedTo),
              @startDate, @endDate, @status, @cost, @desc, @planId, @workOrderId)
          `);
          
        await db.request().input('ticketId', sql.VarChar, id).query(`
            INSERT INTO TAREAS_TICK (ID, ID_TICKET, TAREA) VALUES (NEWID(), @ticketId, 'Subtarea dummy')
        `);
          
        console.log("Mock data inserted successfully.");
        
        // Simulating the delete logic from workOrders.controller.js
        const woId = mainId;
        await db.request().input('id', sql.VarChar, woId)
          .query(`DELETE FROM TAREAS_TICK WHERE ID_TICKET IN (SELECT ID FROM TICKETS WHERE ID_OT = @id)`);
          
        await db.request().input('id', sql.VarChar, woId)
          .query(`DELETE FROM REPROGRAMACIONES WHERE ID_TICKET IN (SELECT ID FROM TICKETS WHERE ID_OT = @id)`);

        await db.request().input('id', sql.VarChar, woId)
          .query(`DELETE FROM TICKETS WHERE ID_OT = @id`);

        await db.request().input('id', sql.VarChar, woId)
          .query(`DELETE FROM ORDENES_TRAB WHERE ID = @id`);
          
        console.log("Mock data deleted physically successfully.");
        
    } catch (e) {
        console.error("Test error:", e);
    } process.exit(0);
}
test();
