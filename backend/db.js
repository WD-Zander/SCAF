import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';
import pg from 'pg';

const __dir = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dir, '.env') });
dotenvConfig({ path: resolve(__dir, '..', '.env') });

// -------------------------------------------------------------
// SCAF CONFIGURACIÓN DE CONEXIÓN A BASE DE DATOS
// Motor: PostgreSQL (Supabase)
// -------------------------------------------------------------

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  min: 2,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => {
  console.error('⚠️ Error en el pool de PostgreSQL:', err.message);
});

pool.on('connect', () => {
  console.log('✅ Conexión exitosa a PostgreSQL (Supabase)');
});

/**
 * Convierte las keys de cada fila a MAYÚSCULAS + original para compatibilidad.
 */
function uppercaseRows(rows) {
  return rows.map((row) => {
    const newRow = {};
    for (const [key, value] of Object.entries(row)) {
      newRow[key.toUpperCase()] = value;
      newRow[key] = value;
    }
    return newRow;
  });
}

async function getPool() {
  return {
    request: () => createRequest(),
    query: async (text, params) => {
      const res = await pool.query(text, params);
      const rows = uppercaseRows(res.rows);
      return {
        recordset: rows,
        recordsets: [rows],
        rowsAffected: [res.rowCount],
      };
    },
  };
}

function createRequest() {
  const inputs = {};
  const req = {
    input(name, typeOrValue, value) {
      const isBitType = typeOrValue === 'BIT' || (typeof typeOrValue === 'string' && typeOrValue.toUpperCase() === 'BIT');
      if (value === undefined) {
        inputs[name] = typeOrValue;
      } else {
        if (isBitType && (value === 1 || value === 0)) {
          inputs[name] = Boolean(value);
        } else {
          inputs[name] = value;
        }
      }
      return req;
    },
    async query(sqlText) {
      const paramNames = [];
      const converted = sqlText.replace(/@(\w+)/g, (match, name) => {
        if (!inputs.hasOwnProperty(name)) return match;
        let idx = paramNames.indexOf(name);
        if (idx === -1) {
          paramNames.push(name);
          idx = paramNames.length - 1;
        }
        return `$${idx + 1}`;
      });
      const values = paramNames.map((n) => inputs[n]);
      const pgSql = adaptSql(converted);

      const res = await pool.query(pgSql, values);
      const rows = uppercaseRows(res.rows);
      return {
        recordset: rows,
        recordsets: [rows],
        rowsAffected: [res.rowCount],
      };
    },
  };
  return req;
}

/**
 * Adapta sintaxis MSSQL → PostgreSQL automáticamente
 */
function adaptSql(sqlInput) {
  let s = sqlInput;

  // ── Remover WITH (NOLOCK) ──
  s = s.replace(/\s+WITH\s*\(\s*NOLOCK\s*\)/gi, '');

  // ── GETUTCDATE() / GETDATE() → NOW() ──
  s = s.replace(/GETUTCDATE\s*\(\)/gi, 'NOW()');
  s = s.replace(/GETDATE\s*\(\)/gi, 'NOW()');

  // ── CAST(GETUTCDATE() AS DATE) → CURRENT_DATE ──
  s = s.replace(/CAST\s*\(\s*NOW\(\)\s+AS\s+DATE\s*\)/gi, 'CURRENT_DATE');

  // ── FORMAT(col, 'pattern') → TO_CHAR(col, 'pattern') ──
  // Convertir patrones de fecha MSSQL a PostgreSQL
  s = s.replace(/FORMAT\s*\(([^,]+),\s*'([^']+)'\)/gi, (match, col, fmt) => {
    let pgFmt = fmt
      .replace(/yyyy/g, 'YYYY')
      .replace(/yy/g, 'YY')
      .replace(/MM/g, 'MM')
      .replace(/dd/g, 'DD')
      .replace(/HH/g, 'HH24')
      .replace(/mm/g, 'MI')
      .replace(/ss/g, 'SS');
    return `TO_CHAR(${col}, '${pgFmt}')`;
  });

  // ── DATEADD(unit, N, date) → date + INTERVAL 'N unit' ──
  // Handle nested parentheses (e.g. DATEADD(month, -12, NOW()))
  s = s.replace(/DATEADD\s*\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*((?:[^()]*|\([^()]*\))*)\)/gi, (match, unit, num, dateExpr) => {
    const unitMap = { day: 'days', month: 'months', year: 'years', hour: 'hours', minute: 'minutes', second: 'seconds', week: 'weeks' };
    const pgUnit = unitMap[unit.toLowerCase()] || unit.toLowerCase() + 's';
    return `(${dateExpr.trim()} + INTERVAL '${num} ${pgUnit}')`;
  });

  // ── NVARCHAR(MAX) / VARCHAR(MAX) → TEXT ──
  s = s.replace(/N?VARCHAR\s*\(\s*MAX\s*\)/gi, 'TEXT');

  // ── TOP N → LIMIT N (mover al final) ──
  const topMatch = s.match(/SELECT\s+TOP\s+(\d+)\b/i);
  s = s.replace(/SELECT\s+TOP\s+(\d+)\b/gi, 'SELECT');
  if (topMatch) {
    s = s.replace(/;?\s*$/, ` LIMIT ${topMatch[1]}`);
  }

  // ── OFFSET x ROWS FETCH NEXT y ROWS ONLY → LIMIT y OFFSET x ──
  s = s.replace(/OFFSET\s+(\S+)\s+ROWS\s+FETCH\s+NEXT\s+(\S+)\s+ROWS\s+ONLY/gi, 'LIMIT $2 OFFSET $1');

  // ── ISNULL() → COALESCE() ──
  s = s.replace(/ISNULL\s*\(/gi, 'COALESCE(');

  // ── SCOPE_IDENTITY() → lastval() ──
  s = s.replace(/SCOPE_IDENTITY\s*\(\)/gi, 'lastval()');

  // ── NEWID() → gen_random_uuid() ──
  s = s.replace(/NEWID\s*\(\)/gi, 'gen_random_uuid()');

  // ── LEN() → LENGTH() ──
  s = s.replace(/\bLEN\s*\(/gi, 'LENGTH(');

  // ── Boolean: ACTIVO = 1 → ACTIVO = TRUE ──
  s = s.replace(/\b(ACTIVO|BORRADO|COMPLETADO|ES_PREVENTIVO|PERMITIR_BORRADO|REQUERIDO)\s*=\s*1\b/gi, '$1 = TRUE');
  s = s.replace(/\b(ACTIVO|BORRADO|COMPLETADO|ES_PREVENTIVO|PERMITIR_BORRADO|REQUERIDO)\s*=\s*0\b/gi, '$1 = FALSE');

  // ── String concatenation: '%' + @param + '%' → '%' || $N || '%' ──
  s = s.replace(/'([^']*)'\s*\+\s*(\$\d+)\s*\+\s*'([^']*)'/g, "'$1' || $2 || '$3'");
  // Simpler: 'text' + expr → 'text' || expr
  s = s.replace(/'([^']*)'\s*\+\s*(\S+)/g, "'$1' || $2");
  // expr + 'text' → expr || 'text'
  s = s.replace(/(\$\d+)\s*\+\s*'([^']*)'/g, "$1 || '$2'");

  // ── OUTPUT INSERTED.col → RETURNING col ──
  s = s.replace(/\)\s*OUTPUT\s+INSERTED\.(\w+)/gi, ') RETURNING $1');

  // ── IF NOT EXISTS ... INSERT → INSERT ... ON CONFLICT DO NOTHING ──
  // Patrón: IF NOT EXISTS (SELECT 1 FROM T WHERE ...) INSERT INTO T ...
  s = s.replace(
    /IF\s+NOT\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+(\w+)\s+WHERE\s+([^)]+)\)\s+(INSERT\s+INTO\s+\1\s+[^;]+)/gi,
    '$3 ON CONFLICT DO NOTHING'
  );

  // ── Remover bloques IF ... BEGIN ... END (simplificar) ──
  // Patrón complejo: IF NOT EXISTS (...) BEGIN ... END ELSE BEGIN ... END
  // Estos requieren reescritura manual en controllers

  // ── Auto-quote camelCase aliases so PostgreSQL preserves casing ──
  // Matches: AS/as word (not already quoted) — quotes it if word has mixed case
  s = s.replace(/\b[Aa][Ss]\s+(?!")([A-Za-z_]\w*)/g, (match, alias) => {
    if (/[a-z]/.test(alias) && /[A-Z]/.test(alias)) {
      return match.replace(alias, `"${alias}"`);
    }
    return match;
  });

  return s;
}

// Objeto sql dummy para compatibilidad con imports existentes
const sqlTypes = {
  Int: 'INT', BigInt: 'BIGINT', VarChar: 'VARCHAR', NVarChar: 'NVARCHAR',
  NChar: 'NCHAR', Char: 'CHAR', Text: 'TEXT', Bit: 'BIT',
  Float: 'FLOAT', Real: 'REAL', Decimal: 'DECIMAL', Numeric: 'NUMERIC',
  SmallInt: 'SMALLINT', TinyInt: 'TINYINT', DateTime: 'DATETIME',
  DateTime2: 'DATETIME2', Date: 'DATE', Time: 'TIME', Money: 'MONEY',
  SmallMoney: 'SMALLMONEY', UniqueIdentifier: 'UNIQUEIDENTIFIER',
  Image: 'IMAGE', Binary: 'BINARY', VarBinary: 'VARBINARY', MAX: 'MAX',
};

const sql = new Proxy(sqlTypes, {
  get(target, prop) {
    if (prop in target) {
      const val = target[prop];
      // Permitir usar como función: sql.VarChar(50) o como propiedad: sql.VarChar
      if (typeof val === 'string') {
        const fn = () => val;
        fn.toString = () => val;
        fn[Symbol.toPrimitive] = () => val;
        // Make it work as both property and function
        return new Proxy(fn, {
          get(t, p) {
            if (p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf') return () => val;
            return val;
          },
          apply() { return val; },
        });
      }
      return val;
    }
    return prop;
  },
});

export { getPool, sql };
