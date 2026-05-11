import 'dotenv/config';
import xlsx from 'xlsx';
import path from 'path';
import { getPool, sql } from './db.js';

async function importData() {
  try {
    const db = await getPool();
    // Leer desde la raiz del proyecto
    const filePath = path.join(process.cwd(), '../Migracion.xlsx');
    console.log(`Buscando archivo de migración en: ${filePath}`);
    
    const wb = xlsx.readFile(filePath);

    // isTree = true significa que requiere la columna ID_PADRE (para subcategorias y subdepartamentos)
    const importSheet = async (sheetName, tableName, isTree = false) => {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) {
        console.log(`Hoja '${sheetName}' no encontrada, omitiendo...`);
        return;
      }
      const data = xlsx.utils.sheet_to_json(sheet);
      console.log(`Importando ${data.length} registros desde la hoja '${sheetName}' a la tabla ${tableName}...`);
      
      for (const row of data) {
        // Genera un ID si no se proporciona (ej: CAT-1234)
        const id = row['ID'] ? row['ID'].toString() : `${sheetName.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}${Math.floor(Math.random()*1000)}`;
        const name = row['Nombre'] || row['NOMBRE'] || 'Desconocido';
        
        if (isTree) {
           const pid = row['ID_PADRE'] || row['Padre'] || null;
           await db.request()
            .input('id', sql.VarChar, id)
            .input('name', sql.VarChar, name)
            .input('pid', sql.VarChar, pid)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM ${tableName} WHERE ID = @id)
              BEGIN
                INSERT INTO ${tableName} (ID, NOMBRE, ID_PADRE) VALUES (@id, @name, @pid)
              END
              ELSE
              BEGIN
                UPDATE ${tableName} SET NOMBRE=@name, ID_PADRE=@pid WHERE ID=@id
              END
            `);
        } else {
           await db.request()
            .input('id', sql.VarChar, id)
            .input('name', sql.VarChar, name)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM ${tableName} WHERE ID = @id)
              BEGIN
                INSERT INTO ${tableName} (ID, NOMBRE) VALUES (@id, @name)
              END
              ELSE
              BEGIN
                UPDATE ${tableName} SET NOMBRE=@name WHERE ID=@id
              END
            `);
        }
      }
    };

    // Procesar cada hoja correspondiente a un Fichero/Catálogo
    await importSheet('Categorias', 'CATEGORIAS', true);
    await importSheet('Organizaciones', 'ORG', true);
    await importSheet('Tipos_Mantenimiento', 'TIPOS_MANT', false);
    await importSheet('Estados_Activo', 'ESTADOS_ACTIVO', false);
    await importSheet('Formas_Pago', 'FORMAS_PAGO', false);

    console.log("\n✅ ¡Migración de Ficheros (Catálogos) completada exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error importando Excel de Migración:", error);
    process.exit(1);
  }
}

importData();
