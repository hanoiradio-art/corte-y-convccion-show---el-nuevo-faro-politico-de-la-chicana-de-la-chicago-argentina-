import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer: width * 4 per row + 1 filter byte per row
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // CRC32 table & function
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing function for Hanoi Radio Icon (Black dark background, emerald circle ring, lightning bolt, record grooves)
function drawHanoiIcon(x, y, w, h, isMaskable) {
  const cx = w / 2;
  const cy = h / 2;
  const rMax = Math.min(w, h) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background
  const bg = [10, 10, 10, 255]; // Deep dark

  // Outer ring (Emerald 500: rgb(16, 185, 129))
  const outerR = isMaskable ? rMax * 0.78 : rMax * 0.92;
  const innerR = outerR * 0.94;

  if (dist <= outerR && dist >= innerR) {
    return [16, 185, 129, 255]; // Neon Emerald border
  }

  // Secondary violet accent ring (Purple 500: rgb(168, 85, 247))
  const vRingOut = outerR * 0.88;
  const vRingIn = vRingOut * 0.96;
  if (dist <= vRingOut && dist >= vRingIn) {
    return [168, 85, 247, 255]; // Violet accent
  }

  // Record center disk (Vinyl circle)
  const vinylR = outerR * 0.82;
  if (dist <= vinylR) {
    // Vinyl groove pattern
    const groove = Math.floor(dist) % 12;
    if (groove === 0 || groove === 1) {
      return [24, 24, 27, 255]; // dark gray groove
    }

    // Center record label circle (Red / Emerald)
    const labelR = vinylR * 0.42;
    if (dist <= labelR) {
      // Center spindle hole
      if (dist <= labelR * 0.18) {
        return [0, 0, 0, 255];
      }

      // Lightning bolt or guitar star in center label
      const nx = (dx / labelR) * 1.2;
      const ny = (dy / labelR) * 1.2;

      // Stylized rock lightning shape:
      // Polygon approximation
      if (
        (nx >= -0.2 && nx <= 0.3 && ny >= -0.7 && ny <= 0.1 && (ny - 2 * nx) <= 0.2) ||
        (nx >= -0.4 && nx <= 0.1 && ny >= -0.1 && ny <= 0.7 && (ny - 2 * nx) >= -0.3)
      ) {
        return [250, 204, 21, 255]; // Yellow lightning
      }

      return [16, 185, 129, 255]; // Emerald core label
    }

    return [18, 18, 18, 255];
  }

  return bg;
}

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawHanoiIcon(x, y, w, h, false)));
// 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawHanoiIcon(x, y, w, h, false)));
// 512x512 maskable (padded safe zone)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawHanoiIcon(x, y, w, h, true)));
// apple-touch-icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawHanoiIcon(x, y, w, h, false)));

console.log('PWA icons created successfully in public/');
