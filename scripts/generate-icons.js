'use strict';
/**
 * stayd. icon generator — run once with: node scripts/generate-icons.js
 * Source: public/logo/stayd-app-icon-512-rounded.png (official brand asset)
 * Outputs:
 *   public/apple-touch-icon.png  512 × 512
 *   public/favicon.ico           32 × 32 (PNG-in-ICO)
 */

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const PUBLIC = path.resolve(__dirname, '..', 'public');
const SOURCE = path.join(PUBLIC, 'logo', 'stayd-app-icon-512-rounded.png');

// ── ICO wrapper — PNG-in-ICO, single 32 × 32 image ───────────────────────────

function pngToIco(pngBuf) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);   // reserved
  header.writeUInt16LE(1, 2);   // type: 1 = ICO
  header.writeUInt16LE(1, 4);   // image count: 1

  const dir = Buffer.alloc(16);
  dir.writeUInt8(32,  0);                       // width  32
  dir.writeUInt8(32,  1);                       // height 32
  dir.writeUInt8(0,   2);                       // colour count (0 = no palette)
  dir.writeUInt8(0,   3);                       // reserved
  dir.writeUInt16LE(1,  4);                     // colour planes
  dir.writeUInt16LE(32, 6);                     // bits per pixel
  dir.writeUInt32LE(pngBuf.length, 8);          // image data size
  dir.writeUInt32LE(6 + 16, 12);               // offset = header(6) + dir(16)

  return Buffer.concat([header, dir, pngBuf]);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const png512 = await sharp(SOURCE).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC, 'apple-touch-icon.png'), png512);
  console.log('✓  public/apple-touch-icon.png  512 × 512');

  const png32 = await sharp(SOURCE)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), pngToIco(png32));
  console.log('✓  public/favicon.ico           32 × 32');
}

main().catch(err => { console.error(err.message); process.exit(1); });
