'use strict';
/**
 * AXIS icon generator — run once with: node scripts/generate-icons.js
 * Outputs:
 *   public/apple-touch-icon.png  512 × 512
 *   public/favicon.ico           32 × 32 (PNG-in-ICO)
 *
 * Design spec (AXIS brandbook v1.0):
 *   Background  #0F0F0F  border-radius 114 px (at 512 px)
 *   Typeface    Inter 900 (fetched from Google Fonts) → 'Arial Black' fallback
 *   Text        "AXIS"  white  wide tracking  centred  max 60% canvas width
 *   Dot         #22C55E  ⌀ 20 px  directly left of "A"  aligned to cap midline
 */

const sharp  = require('sharp');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const PUBLIC = path.resolve(__dirname, '..', 'public');

// ── HTTP helper (follows redirects) ──────────────────────────────────────────

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpGet(res.headers.location, headers).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error('HTTP timeout')));
  });
}

// ── Download Inter 900 subset (only A X I S) ─────────────────────────────────

async function tryGetInter900() {
  try {
    // Request a subset containing only the glyphs we need
    const cssUrl =
      'https://fonts.googleapis.com/css2?family=Inter:wght@900&display=block&text=AXIS';
    const css = (await httpGet(cssUrl, {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    })).toString('utf8');

    // Extract URL from src: url(...) format('woff2') blocks
    const urls = [...css.matchAll(/url\(([^)]+)\)\s*format\(['"]?woff2['"]?\)/g)]
      .map(m => m[1].replace(/['"]/g, ''));

    if (!urls.length) throw new Error('no woff2 URL in Google Fonts response');

    const fontBuf = await httpGet(urls[urls.length - 1]);
    return fontBuf.toString('base64');
  } catch (err) {
    process.stdout.write(`(skipped Inter: ${err.message})  `);
    return null;
  }
}

// ── SVG template ─────────────────────────────────────────────────────────────
//
//  Canvas: 512 × 512
//
//  text-anchor="middle" at x=256 → text always horizontally centred.
//  letter-spacing="16" = 0.16 em (spec: ≥ 0.15 em).
//  Natural advance of "AXIS" in Inter 900 at 100 px ≈ 226 px (measured).
//  With letter-spacing 16 × 4 = +64 px → total ≈ 290 px = 56.6 % ✓ (≤ 60 %)
//
//  BASELINE_Y = 292  ← caps visually centred at y = 256
//    Inter 900 cap-height ≈ 71 px;  baseline = 256 + 71/2 ≈ 292
//
//  DOT: r = 10 (⌀ 20 px)
//    Visible left edge of "A" ≈ 256 − 145 = 111
//    cx = 116 (dot right) + gap 6 px → visible "A" ink at 122; cx = 106, cy = 256

function buildSVG(interB64) {
  const fontDefs = interB64
    ? `<defs><style>@font-face{font-family:'Inter';font-style:normal;font-weight:900;` +
      `src:url('data:font/woff2;base64,${interB64}') format('woff2');}</style></defs>`
    : '';
  const ff = interB64
    ? "'Inter'"
    : "'Arial Black', Arial, sans-serif";

  return `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">\
${fontDefs}
  <rect width="512" height="512" rx="114" ry="114" fill="#0F0F0F"/>
  <circle cx="106" cy="256" r="10" fill="#22C55E"/>
  <text
    x="256"
    y="292"
    font-family="${ff}"
    font-weight="900"
    font-size="100"
    fill="#FFFFFF"
    text-anchor="middle"
    letter-spacing="16">AXIS</text>
</svg>`;
}

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
  process.stdout.write('Fetching Inter 900 from Google Fonts … ');
  const interB64 = await tryGetInter900();
  console.log(interB64 ? 'OK  (Inter 900 embedded)' : 'fallback: Arial Black');

  const svg = buildSVG(interB64);

  // 512 × 512 — apple-touch-icon.png
  const png512 = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC, 'apple-touch-icon.png'), png512);
  console.log('✓  public/apple-touch-icon.png  512 × 512');

  // 32 × 32 — favicon.ico
  const png32 = await sharp(png512)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), pngToIco(png32));
  console.log('✓  public/favicon.ico           32 × 32');
}

main().catch(err => { console.error(err.message); process.exit(1); });
