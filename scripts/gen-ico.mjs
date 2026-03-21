import { writeFileSync } from 'fs';

/** Draw one ICO image size, returns Buffer with DIB header + pixels + mask */
function drawImage(size) {
  const px = new Uint8Array(size * size * 4); // BGRA

  const set = (x, y, r, g, b, a = 255) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = b; px[i+1] = g; px[i+2] = r; px[i+3] = a;
  };

  // Background: #060810
  for (let i = 0; i < size * size; i++) {
    px[i*4]=16; px[i*4+1]=8; px[i*4+2]=6; px[i*4+3]=255;
  }

  const cx = size / 2, cy = size / 2;
  const sc = size / 32;

  // Radar rings (green, dim)
  for (const r of [size*0.37, size*0.22]) {
    for (let a = 0; a < 360; a += 0.8) {
      const rad = a * Math.PI / 180;
      set(cx + r*Math.cos(rad), cy + r*Math.sin(rad), 0, 160, 80, 100);
    }
  }

  // Radar sweep line
  for (let t = 0; t <= 1; t += 0.02) {
    set(cx + size*0.38*t*0.7, cy - size*0.38*t, 0, 229, 160, 180);
  }

  // Fuselage (vertical, centered, slightly left)
  const fx = cx - sc, fw = Math.max(2, sc * 2.5), fh = size * 0.55;
  for (let dy = 0; dy < fh; dy++) {
    for (let dx = 0; dx < fw; dx++) {
      set(cx - fw/2 + dx, cy - fh*0.6 + dy, 224, 240, 232);
    }
  }

  // Wings
  const wy = cy - sc * 2, wspan = size * 0.38, wh = Math.max(2, sc * 2.5);
  for (let dx = 0; dx < wspan; dx++) {
    const h = wh * (1 - dx / wspan * 0.5);
    for (let dy = 0; dy < h; dy++) {
      set(cx - wspan + dx, wy + dy, 178, 223, 219);
      set(cx + dx, wy + dy, 178, 223, 219);
    }
  }

  // Tail fins
  const ty = cy + size * 0.18, ts = size * 0.18;
  for (let dx = 0; dx < ts; dx++) {
    const h = Math.max(1, sc * 1.5 * (1 - dx / ts));
    for (let dy = 0; dy < h; dy++) {
      set(cx - ts + dx, ty + dy, 144, 164, 174);
      set(cx + dx, ty + dy, 144, 164, 174);
    }
  }

  // Cockpit dot (cyan)
  set(cx, cy - size*0.32, 41, 182, 246);
  if (size >= 24) {
    set(cx-1, cy - size*0.32, 41, 182, 246, 180);
    set(cx+1, cy - size*0.32, 41, 182, 246, 180);
  }

  // Green center dot
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    set(cx+dx, cy+dy, 0, 229, 160, 220);
  }

  // Build DIB (bottom-up pixel order)
  const dibHdr = Buffer.alloc(40);
  dibHdr.writeUInt32LE(40, 0);
  dibHdr.writeInt32LE(size, 4);
  dibHdr.writeInt32LE(size * 2, 8); // doubled height = pixels + mask
  dibHdr.writeUInt16LE(1, 12);
  dibHdr.writeUInt16LE(32, 14);
  dibHdr.writeUInt32LE(0, 16);
  dibHdr.writeUInt32LE(size * size * 4, 20);

  const pixBuf = Buffer.alloc(size * size * 4);
  for (let row = 0; row < size; row++) {
    const src = size - 1 - row;
    for (let col = 0; col < size; col++) {
      const si = (src * size + col) * 4;
      const di = (row * size + col) * 4;
      pixBuf[di]   = px[si];   // B
      pixBuf[di+1] = px[si+1]; // G
      pixBuf[di+2] = px[si+2]; // R
      pixBuf[di+3] = px[si+3]; // A
    }
  }

  // AND mask (all zeros = opaque)
  const maskRowBytes = Math.ceil(size / 32) * 4;
  const mask = Buffer.alloc(size * maskRowBytes, 0);

  return Buffer.concat([dibHdr, pixBuf, mask]);
}

function buildIco(sizes) {
  const images = sizes.map(drawImage);
  const n = sizes.length;
  const hdrSize = 6 + n * 16;
  let offset = hdrSize;

  const hdr = Buffer.alloc(6);
  hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(n, 4);

  const dir = Buffer.alloc(n * 16);
  images.forEach((img, i) => {
    const s = sizes[i];
    const b = i * 16;
    dir.writeUInt8(s >= 256 ? 0 : s, b);
    dir.writeUInt8(s >= 256 ? 0 : s, b+1);
    dir.writeUInt8(0, b+2); dir.writeUInt8(0, b+3);
    dir.writeUInt16LE(1, b+4); dir.writeUInt16LE(32, b+6);
    dir.writeUInt32LE(img.length, b+8);
    dir.writeUInt32LE(offset, b+12);
    offset += img.length;
  });

  return Buffer.concat([hdr, dir, ...images]);
}

const outPath = process.argv[2] || 'favicon.ico';
const ico = buildIco([16, 32, 48]);
writeFileSync(outPath, ico);
console.log(`ICO written: ${outPath} (${ico.length} bytes)`);
