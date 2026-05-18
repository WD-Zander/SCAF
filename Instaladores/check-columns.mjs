import sql from 'mssql';
import pg from 'pg';

const MSSQL_CONFIG = {
  server: '100.122.64.69',
  user: 'sa',
  password: 'Master6034',
  database: 'SCAF',
  port: 1433,
  options: { encrypt: false, trustServerCertificate: true },
};

const PG_CONNECTION = 'postgresql://postgres.vwwriqkjcramhhkyrarz:6526191998Zander**@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

const TABLES = ['ACTIVO', 'PROVEEDOR', 'TAREA_PLAN', 'CONFIG_EMP', 'CATEGORIA'];

async function main() {
  const mssqlPool = await sql.connect(MSSQL_CONFIG);
  const pgPool = new pg.Pool({ connectionString: PG_CONNECTION, ssl: { rejectUnauthorized: false } });

  for (const table of TABLES) {
    console.log(`\n══ ${table} ══`);

    // SQL Server columns
    const msCols = await mssqlPool.request().query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' ORDER BY ORDINAL_POSITION`
    );
    const msColNames = msCols.recordset.map(r => r.COLUMN_NAME);

    // PostgreSQL columns
    const pgCols = await pgPool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = '${table.toLowerCase()}' ORDER BY ordinal_position`
    );
    const pgColNames = pgCols.rows.map(r => r.column_name);

    // Compare
    const msOnly = msColNames.filter(c => !pgColNames.includes(c.toLowerCase()));
    const pgOnly = pgColNames.filter(c => !msColNames.map(m => m.toLowerCase()).includes(c));

    console.log(`  SQL Server (${msColNames.length}): ${msColNames.join(', ')}`);
    console.log(`  Supabase   (${pgColNames.length}): ${pgColNames.join(', ')}`);
    if (msOnly.length) console.log(`  ⚠️ Solo en SQL Server: ${msOnly.join(', ')}`);
    if (pgOnly.length) console.log(`  ⚠️ Solo en Supabase:   ${pgOnly.join(', ')}`);
  }

  await mssqlPool.close();
  await pgPool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
