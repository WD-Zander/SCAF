const { getPool, sql } = require('../backend/db.js');

async function reseed() {
  try {
    const p = await getPool();
    const plansRes = await p.request().query('SELECT Id, Code FROM MaintenancePlans');
    const plans = plansRes.recordset;

    let idx = 1;
    for (const plan of plans) {
      if (!plan.Id.startsWith('PLAN-')) {
        const newId = `PLAN-${idx}`;
        console.log(`Relinking ${plan.Id} -> ${newId}`);
        await p.request().query(`
          UPDATE MaintenancePlans SET Id = '${newId}' WHERE Id = '${plan.Id}';
          UPDATE MaintenancePlanTasks SET PlanId = '${newId}' WHERE PlanId = '${plan.Id}';
          UPDATE MaintenanceTicketTasks SET PlanId = '${newId}' WHERE PlanId = '${plan.Id}';
          UPDATE Maintenances SET PlanId = '${newId}' WHERE PlanId = '${plan.Id}';
        `);
      }
      idx++;
    }
    
    // Add Category column if not exists
    await p.request().query(`
        IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'Category' AND Object_ID = Object_ID(N'MaintenancePlans'))
        BEGIN
            ALTER TABLE MaintenancePlans ADD Category VARCHAR(100) NULL;
        END
    `);

    console.log("Reseed and Category alter complete!");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
reseed();
