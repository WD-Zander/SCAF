/**
 * SCAF — Generador de iOS Splash Screens + Todos los íconos PWA
 *
 * Genera:
 *  - public/icons/icon-{size}x{size}.png  (Android + Safari)
 *  - public/splash/splash-{w}x{h}.png     (iOS Splash Screens)
 *
 * Cómo usar:
 *   1. npm install sharp --save-dev
 *   2. Poner ícono fuente en: public/icons/source.png (mínimo 512x512)
 *   3. node scripts/generate-pwa-assets.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE   = path.join(__dirname, '../public/icons/source.png');
const ICON_DIR  = path.join(__dirname, '../public/icons');
const SPLASH_DIR = path.join(__dirname, '../public/splash');

// ── Tamaños de ícono requeridos ──────────────────────────────────
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ── Splash screens requeridos por iOS ────────────────────────────
// Fondo: azul oscuro carbón SCAF  (#0d1117)
const SPLASH_SCREENS = [
  { w: 750,  h: 1334, label: 'iPhone SE / 8' },
  { w: 1125, h: 2436, label: 'iPhone X / XS / 11 Pro' },
  { w: 1170, h: 2532, label: 'iPhone 12 / 13 / 14' },
  { w: 1179, h: 2556, label: 'iPhone 15 Pro / 16' },
  { w: 1242, h: 2688, label: 'iPhone XS Max / 11 Pro Max' },
  { w: 1284, h: 2778, label: 'iPhone 14 Plus / 13 Pro Max' },
  { w: 1290, h: 2796, label: 'iPhone 15 Plus / 16 Plus' },
  { w: 1536, h: 2048, label: 'iPad mini / Air (portrait)' },
  { w: 1668, h: 2388, label: 'iPad Pro 11" (portrait)' },
  { w: 2048, h: 2732, label: 'iPad Pro 12.9" (portrait)' },
];

// ── Color de fondo del splash ────────────────────────────────────
const BG = { r: 13, g: 17, b: 23, alpha: 1 }; // #0d1117

async function run() {
  if (!fs.existsSync(SOURCE)) {
    console.error('❌ No se encontró public/icons/source.png');
    process.exit(1);
  }

  [ICON_DIR, SPLASH_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

  console.log('🎨 Generando íconos PWA...\n');
  for (const size of ICON_SIZES) {
    const out = path.join(ICON_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: BG })
      .png()
      .toFile(out);
    console.log(`  ✅ icon-${size}x${size}.png`);
  }

  console.log('\n🖼️  Generando iOS Splash Screens...\n');
  // Logo centrado al 30% del ancho del splash
  const srcMeta = await sharp(SOURCE).metadata();
  
  for (const { w, h, label } of SPLASH_SCREENS) {
    const logoSize = Math.round(Math.min(w, h) * 0.28);
    const logoLeft = Math.round((w - logoSize) / 2);
    const logoTop  = Math.round((h - logoSize) / 2);

    const logoBuffer = await sharp(SOURCE)
      .resize(logoSize, logoSize, { fit: 'contain', background: { ...BG } })
      .png()
      .toBuffer();

    const out = path.join(SPLASH_DIR, `splash-${w}x${h}.png`);
    await sharp({
      create: { width: w, height: h, channels: 4, background: BG }
    })
      .composite([{ input: logoBuffer, left: logoLeft, top: logoTop }])
      .png()
      .toFile(out);

    console.log(`  ✅ splash-${w}x${h}.png  (${label})`);
  }

  console.log('\n🚀 ¡Todos los assets PWA generados exitosamente!');
  console.log(`   📁 Íconos:  public/icons/`);
  console.log(`   📁 Splash:  public/splash/`);
}

run().catch(console.error);
