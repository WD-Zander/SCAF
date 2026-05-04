/**
 * SCAF — Generador de íconos PWA
 * 
 * Cómo usar:
 *   1. Instalar Sharp: npm install sharp --save-dev
 *   2. Colocar tu imagen fuente como: public/icons/source.png (mínimo 512x512 px)
 *   3. Ejecutar: node scripts/generate-icons.js
 * 
 * Genera todos los tamaños requeridos por el manifest.json
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, '../public/icons/source.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  if (!fs.existsSync(SOURCE)) {
    console.error('❌ No se encontró public/icons/source.png');
    console.log('   Coloca tu ícono fuente (512x512 o mayor) como public/icons/source.png');
    process.exit(1);
  }

  console.log('🎨 Generando íconos PWA para SCAF...\n');

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`  ✅ icon-${size}x${size}.png generado`);
  }

  console.log('\n🚀 ¡Todos los íconos generados exitosamente en public/icons/!');
}

generate().catch(console.error);
