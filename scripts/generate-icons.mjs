/**
 * 3WM SONIK — PWA icon generator.
 *
 * The VitePWA manifest referenced five icon files that did not exist anywhere in the repo,
 * so the install prompt and home-screen icon were broken. There was also no source logo
 * asset to rasterize from.
 *
 * This script renders `public/icon.svg`'s geometry (three amber level bars on #0D0D0D) at
 * every size the manifest needs, writing PNGs with Node's built-in zlib — no native image
 * dependency, so it runs anywhere `node` does and produces byte-identical output.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const BACKGROUND = [0x0d, 0x0d, 0x0d];
const ACCENT = [0xf5, 0x9e, 0x0b];

/**
 * Bars in the 512x512 design space of public/icon.svg: [x, y, width, height].
 * Kept in sync with that file by hand — it is three rectangles.
 */
const BARS = [
  [140, 196, 44, 120],
  [234, 140, 44, 232],
  [328, 216, 44, 80],
];

const DESIGN_SIZE = 512;
const CORNER_RADIUS = 22;

/** Supersampling factor — enough to keep the rounded bar caps smooth at 32px. */
const SS = 4;

/**
 * True when a point lies inside a rounded rectangle.
 * Corner test uses the distance to the inset corner centre.
 */
function insideRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false;

  const radius = Math.min(r, w / 2, h / 2);
  const left = x + radius;
  const right = x + w - radius;
  const top = y + radius;
  const bottom = y + h - radius;

  // Inside the cross-shaped core: no corner test needed.
  if (px >= left && px <= right) return true;
  if (py >= top && py <= bottom) return true;

  const cx = px < left ? left : right;
  const cy = py < top ? top : bottom;
  return (px - cx) ** 2 + (py - cy) ** 2 <= radius * radius;
}

/**
 * Renders the mark at `size` px.
 * `inset` shrinks the artwork toward the centre, leaving background around it — required for
 * maskable icons, where the platform may crop up to 20% off every edge.
 */
function render(size, inset = 0) {
  const rgba = Buffer.alloc(size * size * 4);
  const scale = size / DESIGN_SIZE;

  // Map design space -> device space, contracted by `inset` about the centre.
  const contract = 1 - inset * 2;
  const offset = size * inset;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Supersample coverage so the rounded caps antialias instead of stair-stepping.
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const dx = x + (sx + 0.5) / SS;
          const dy = y + (sy + 0.5) / SS;

          // Undo the contraction, then convert to design coordinates.
          const ux = (dx - offset) / contract / scale;
          const uy = (dy - offset) / contract / scale;

          for (const [bx, by, bw, bh] of BARS) {
            if (insideRoundedRect(ux, uy, bx, by, bw, bh, CORNER_RADIUS)) {
              hits++;
              break;
            }
          }
        }
      }

      const coverage = hits / (SS * SS);
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        rgba[i + c] = Math.round(BACKGROUND[c] + (ACCENT[c] - BACKGROUND[c]) * coverage);
      }
      rgba[i + 3] = 0xff;
    }
  }

  return rgba;
}

// ==========================================
// Minimal PNG writer (RGBA, 8-bit, no interlace)
// ==========================================

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Each scanline is prefixed with its filter type byte (0 = None).
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * ICO container wrapping a single PNG.
 * Every browser that still reads favicon.ico supports PNG-in-ICO.
 */
function encodeIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size; // width (0 means 256)
  entry[1] = size >= 256 ? 0 : size; // height
  entry[2] = 0; // palette size
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image data size
  entry.writeUInt32LE(header.length + 16, 12); // data offset

  return Buffer.concat([header, entry, png]);
}

// ==========================================
// Outputs — must stay in step with the VitePWA manifest in vite.config.ts
// ==========================================

const TARGETS = [
  { file: 'icon-192x192.png', size: 192, inset: 0 },
  { file: 'icon-512x512.png', size: 512, inset: 0 },
  // Maskable: keep the mark inside the safe zone so platform cropping cannot clip it.
  { file: 'icon-512x512-maskable.png', size: 512, inset: 0.1 },
  { file: 'apple-touch-icon.png', size: 180, inset: 0 },
  { file: 'favicon-32x32.png', size: 32, inset: 0 },
];

mkdirSync(PUBLIC_DIR, { recursive: true });

for (const { file, size, inset } of TARGETS) {
  const png = encodePng(render(size, inset), size);
  writeFileSync(join(PUBLIC_DIR, file), png);
  console.log(`wrote public/${file} (${size}x${size}, ${png.length} bytes)`);
}

// favicon.ico wraps the 32x32 raster.
const favPng = encodePng(render(32, 0), 32);
const ico = encodeIco(favPng, 32);
writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), ico);
console.log(`wrote public/favicon.ico (32x32, ${ico.length} bytes)`);
