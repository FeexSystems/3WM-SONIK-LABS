#!/usr/bin/env node
/**
 * 3WM SONIK — Image Optimizer
 * Converts public/images/*.jpg (700-820k) → WebP ~150k + optimizes originals
 * Uses sharp (installed as devDep). Run: npm run optimize:images
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, '../public/images');

async function optimize() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp not installed — run npm install -D sharp');
    process.exit(1);
  }

  if (!fs.existsSync(imagesDir)) {
    console.log('No public/images directory');
    return;
  }

  const files = fs.readdirSync(imagesDir).filter(f => /\.(jpe?g|png)$/i.test(f));
  console.log(`Found ${files.length} images in ${imagesDir}`);

  for (const file of files) {
    const inputPath = path.join(imagesDir, file);
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const statBefore = fs.statSync(inputPath).size;

    // 1. Optimize original JPEG (quality 75, mozjpeg)
    try {
      const buffer = await sharp(inputPath).jpeg({ quality: 75, mozjpeg: true }).toBuffer();
      if (buffer.length < statBefore) {
        fs.writeFileSync(inputPath, buffer);
        console.log(`✓ Optimized ${file}: ${(statBefore/1024).toFixed(0)}k → ${(buffer.length/1024).toFixed(0)}k`);
      }
    } catch (e) {
      console.warn(`! Failed to optimize ${file}:`, e.message);
    }

    // 2. Generate WebP alongside (quality 75, effort 4)
    const webpPath = path.join(imagesDir, `${base}.webp`);
    try {
      await sharp(inputPath).webp({ quality: 75, effort: 4 }).toFile(webpPath);
      const webpSize = fs.statSync(webpPath).size;
      console.log(`✓ WebP ${base}.webp: ${(webpSize/1024).toFixed(0)}k`);
    } catch (e) {
      console.warn(`! Failed WebP ${file}:`, e.message);
    }

    // 3. Generate AVIF for modern browsers (quality 60)
    const avifPath = path.join(imagesDir, `${base}.avif`);
    try {
      await sharp(inputPath).avif({ quality: 60, effort: 4 }).toFile(avifPath);
      const avifSize = fs.statSync(avifPath).size;
      console.log(`✓ AVIF ${base}.avif: ${(avifSize/1024).toFixed(0)}k`);
    } catch (e) {
      // AVIF may not be supported in older sharp — skip
    }
  }

  console.log('Done. Update <img> tags to use <picture> with webp/avif sources.');
}

optimize().catch(e => { console.error(e); process.exit(1); });
