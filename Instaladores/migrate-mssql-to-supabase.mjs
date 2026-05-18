/**
 * SCAF — Migración de SQL Server → Supabase (PostgreSQL)
 *
 * Uso:  node Instaladores/migrate-mssql-to-supabase.mjs
 *
 * Lee todas las tablas desde SQL Server local y las inserta en Supabase.
 * Respeta el orden de FKs (tablas padre primero).
 */

import sql from 'mssql';
import pg from 'pg';

// ══════════════════════════════════════════════════════════════
// CONFIGURACIÓN — Ajusta si es necesario
// ══════════════════════════════════════════════════════════════

const MSSQL_CONFIG = {
  server: '100.122.64.69',
  user: 'sa',
  password: 'Master6034',
  database: 'SCAF',
  port: 1433,
  options: { encrypt: false, trustServerCertificate: true },
  requestTimeout: 120000,
  connectionTimeout: 30000,
};

const PG_CONNECTION = 'postgresql://postgres.vwwriqkjcramhhkyrarz:6526191998Zander**@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

// Orden de tablas (respeta FKs: padres antes que hijos)
const TABLES_IN_ORDER = [
  'CONFIG_EMP',
  'ROL',
  'USUARIO',
  'ESTADO_ACTIVO',
  'FORMA_PAGO',
  'MOTIVO_MOVIMIENTO',
  'FRECUENCIA_PLAN',
  'TIPO_MANT',
  'UNIDAD_ORG',
  'CATEGORIA',
  'SCOPE_MANT',
  'PROVEEDOR',
  'EMPLEADO',
  'ACTIVO',
  'MOVIMIENTO',
  'PLAN_MANT',
  'TAREA_PLAN',
  'ORDEN_TRAB',
  'TICKET_MANT',
  'TAREA_TICKET',
  'REPROGRAMACION',
  'AUDITORIA',
];

// ══════════════════════════════════════════════════════════════

const pgPool = new pg.Pool({
  connectionString: PG_CONNECTION,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SCAF — Migración SQL Server → Supabase');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Conectar a SQL Server
  console.log('🔌 Conectando a SQL Server...');
  const mssqlPool = await sql.connect(MSSQL_CONFIG);
  console.log('✅ SQL Server conectado.\n');

  // 2. Conectar a PostgreSQL
  console.log('🔌 Conectando a Supabase (PostgreSQL)...');
  const pgClient = await pgPool.connect();
  console.log('✅ Supabase conectado.\n');

  let totalRows = 0;
  const errors = [];

  // Fix schema: convertir columnas INT/SMALLINT a BOOLEAN donde corresponda
  console.log('🔧 Ajustando schema (boolean columns, nullable FKs)...\n');
  const boolFixes = [
    { table: 'config_emp', col: 'permitir_borrado' },
    { table: 'estado_activo', col: 'activo' },
    { table: 'forma_pago', col: 'activo' },
    { table: 'motivo_movimiento', col: 'activo' },
    { table: 'frecuencia_plan', col: 'activo' },
    { table: 'scope_mant', col: 'activo' },
    { table: 'proveedor', col: 'activo' },
    { table: 'empleado', col: 'activo' },
    { table: 'activo', col: 'borrado' },
    { table: 'plan_mant', col: 'activo' },
    { table: 'tarea_plan', col: 'activo' },
    { table: 'ticket_mant', col: 'borrado' },
    { table: 'ticket_mant', col: 'completado' },
    { table: 'ticket_mant', col: 'es_preventivo' },
    { table: 'tarea_ticket', col: 'completado' },
    { table: 'movimiento', col: 'activo' },
  ];
  for (const { table, col } of boolFixes) {
    try {
      const check = await pgClient.query(
        `SELECT data_type FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`, [table, col]
      );
      if (check.rows.length && check.rows[0].data_type !== 'boolean') {
        await pgClient.query(`ALTER TABLE ${table} ALTER COLUMN ${col} TYPE boolean USING (${col}::int::boolean)`);
        console.log(`  ✅ ${table}.${col} → boolean`);
      }
    } catch {}
  }
  // Hacer id_activo nullable
  try { await pgClient.query('ALTER TABLE orden_trab ALTER COLUMN id_activo DROP NOT NULL'); } catch {}
  try { await pgClient.query('ALTER TABLE ticket_mant ALTER COLUMN id_activo DROP NOT NULL'); } catch {}

  // Deshabilitar triggers y constraints para poder limpiar e insertar sin problemas
  console.log('\n🔓 Deshabilitando constraints FK...\n');
  for (const table of TABLES_IN_ORDER) {
    try {
      await pgClient.query(`ALTER TABLE ${table.toLowerCase()} DISABLE TRIGGER ALL`);
    } catch {}
  }

  // Limpiar todas las tablas en orden inverso (hijos primero)
  console.log('🗑️  Limpiando tablas destino...\n');
  for (const table of [...TABLES_IN_ORDER].reverse()) {
    try {
      await pgClient.query(`DELETE FROM ${table.toLowerCase()}`);
    } catch {}
  }

  for (const table of TABLES_IN_ORDER) {
    try {
      // Leer de SQL Server
      const result = await mssqlPool.request().query(`SELECT * FROM ${table}`);
      const rows = result.recordset;

      if (!rows.length) {
        console.log(`  ⏭️  ${table.padEnd(20)} — vacía (0 filas)`);
        continue;
      }

      // Obtener columnas que existen en Supabase
      const pgColsRes = await pgClient.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table.toLowerCase()}'`
      );
      const pgColMap = {};
      for (const r of pgColsRes.rows) pgColMap[r.column_name] = r.data_type;
      // Solo usar columnas que existen en ambas BDs
      const columns = Object.keys(rows[0]).filter(c => c.toLowerCase() in pgColMap);
      // Set de columnas boolean en Supabase
      const boolCols = new Set(Object.entries(pgColMap).filter(([, t]) => t === 'boolean').map(([c]) => c));

      // Insertar en lotes de 100
      const BATCH_SIZE = 100;
      let inserted = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        // Construir INSERT con múltiples VALUES
        const valueClauses = [];
        const params = [];
        let paramIdx = 1;

        for (const row of batch) {
          const placeholders = [];
          for (const col of columns) {
            let val = row[col];
            // Convertir BIT a boolean SOLO si la columna destino es boolean
            if (boolCols.has(col.toLowerCase())) {
              val = val === true || val === 1 ? true : false;
            }
            // Convertir Date objects
            if (val instanceof Date) val = val.toISOString();
            params.push(val);
            placeholders.push(`$${paramIdx++}`);
          }
          valueClauses.push(`(${placeholders.join(', ')})`);
        }

        const colNames = columns.map(c => `"${c.toLowerCase()}"`).join(', ');
        const insertSql = `INSERT INTO ${table.toLowerCase()} (${colNames}) VALUES ${valueClauses.join(', ')} ON CONFLICT DO NOTHING`;

        try {
          await pgClient.query(insertSql, params);
          inserted += batch.length;
        } catch (batchErr) {
          // Si falla el lote, intentar uno por uno
          for (const row of batch) {
            const singleParams = [];
            const singlePlaceholders = [];
            let sIdx = 1;
            for (const col of columns) {
              let val = row[col];
              if (val === true || val === 1) val = true;
              else if (val === false || val === 0 && typeof row[col] !== 'number') val = false;
              if (val instanceof Date) val = val.toISOString();
              singleParams.push(val);
              singlePlaceholders.push(`$${sIdx++}`);
            }
            const singleSql = `INSERT INTO ${table.toLowerCase()} (${colNames}) VALUES (${singlePlaceholders.join(', ')}) ON CONFLICT DO NOTHING`;
            try {
              await pgClient.query(singleSql, singleParams);
              inserted++;
            } catch (rowErr) {
              // Registrar error pero continuar (max 3 por tabla)
              const tableErrors = errors.filter(e => e.table === table);
              if (tableErrors.length < 3) {
                errors.push({ table, msg: rowErr.message, sample: JSON.stringify(row).slice(0, 150) });
              }
            }
          }
        }
      }

      totalRows += inserted;
      console.log(`  ✅ ${table.padEnd(20)} — ${inserted}/${rows.length} filas migradas`);

    } catch (tableErr) {
      console.log(`  ❌ ${table.padEnd(20)} — ERROR: ${tableErr.message}`);
      errors.push({ table, msg: tableErr.message });
    }
  }

  // Re-habilitar triggers/constraints
  console.log('\n🔒 Re-habilitando constraints FK...');
  for (const table of TABLES_IN_ORDER) {
    try {
      await pgClient.query(`ALTER TABLE ${table.toLowerCase()} ENABLE TRIGGER ALL`);
    } catch {}
  }

  // Resumen
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Total migrado: ${totalRows} filas`);
  if (errors.length) {
    console.log(`\n  ⚠️  ${errors.length} error(es):`);
    for (const e of errors) {
      console.log(`    - ${e.table}: ${e.msg}`);
      if (e.sample) console.log(`      Ejemplo: ${e.sample}`);
    }
  } else {
    console.log('  🎉 Sin errores. Migración completa.');
  }
  console.log('═══════════════════════════════════════════════\n');

  // Cerrar conexiones
  pgClient.release();
  await pgPool.end();
  await mssqlPool.close();
  process.exit(0);
}

main().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
