// The pictures of Clawd World (tools/clawd-world): RGBA pixels, a few ways to draw, PNG files, a fixed sequence of random numbers and
// ordered dithering; sprites from rows of letters.
'use strict';
const zlib = require('zlib');
// ---- pictures: RGBA pixels, a few ways to draw, PNG ----
const rgba = c => {
  if (Array.isArray(c)) return c;
  const n = parseInt(c.slice(1), 16);
  return c.length === 9 ? [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
};
class Pic {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h * 4);
  }
  set(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    const v = rgba(c),
      i = (y * this.w + x) * 4;
    if (v[3] === 255) {
      this.d[i] = v[0];
      this.d[i + 1] = v[1];
      this.d[i + 2] = v[2];
      this.d[i + 3] = 255;
    } else if (v[3] > 0) {
      const a = v[3] / 255;
      for (let k = 0; k < 3; k++) this.d[i + k] = Math.round(this.d[i + k] * (1 - a) + v[k] * a);
      this.d[i + 3] = Math.max(this.d[i + 3], v[3]);
    }
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  }
  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  hline(x0, x1, y, c) {
    for (let i = Math.min(x0, x1); i <= Math.max(x0, x1); i++) this.set(i, y, c);
  }
  vline(x, y0, y1, c) {
    for (let j = Math.min(y0, y1); j <= Math.max(y0, y1); j++) this.set(x, j, c);
  }
  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let k = 0; k <= n; k++) this.set(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c);
  }
  disc(cx, cy, r, c) {
    for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++)
      for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++)
        if ((i - cx) * (i - cx) + (j - cy) * (j - cy) <= r * r) this.set(i, j, c);
  }
  // a polygon, filled row by row (even-odd)
  poly(pts, c) {
    let y0 = Infinity,
      y1 = -Infinity;
    for (const p of pts) {
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let k = 0; k < pts.length; k++) {
        const a = pts[k],
          b = pts[(k + 1) % pts.length];
        if (a[1] <= y + 0.5 !== b[1] <= y + 0.5) xs.push(a[0] + ((y + 0.5 - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
    }
  }
  // another picture on this one (its transparent pixels left out)
  draw(p, x, y) {
    for (let j = 0; j < p.h; j++)
      for (let i = 0; i < p.w; i++) {
        const v = p.get(i, j);
        if (v[3]) this.set(x + i, y + j, v);
      }
  }
  scaled(k) {
    const o = new Pic(this.w * k, this.h * k);
    for (let y = 0; y < o.h; y++)
      for (let x = 0; x < o.w; x++) {
        const i = (y * o.w + x) * 4,
          s = (Math.floor(y / k) * this.w + Math.floor(x / k)) * 4;
        o.d[i] = this.d[s];
        o.d[i + 1] = this.d[s + 1];
        o.d[i + 2] = this.d[s + 2];
        o.d[i + 3] = this.d[s + 3];
      }
    return o;
  }
}
const CRC = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c >>> 0;
}
const crc = b => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4),
    td = Buffer.concat([Buffer.from(type, 'latin1'), data]),
    c = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
// a PNG: RGB, or RGBA when alpha; each row with the filter (none, sub or up) that leaves the smallest sum
function png(p, alpha) {
  const bpp = alpha ? 4 : 3,
    stride = p.w * bpp,
    rows = [];
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < p.h; y++) {
    const row = Buffer.alloc(stride);
    for (let x = 0; x < p.w; x++) for (let k = 0; k < bpp; k++) row[x * bpp + k] = p.d[(y * p.w + x) * 4 + k];
    const cands = [0, 1, 2].map(f => {
      const o = Buffer.alloc(stride + 1);
      o[0] = f;
      for (let i = 0; i < stride; i++) o[i + 1] = (row[i] - (f === 1 ? (i >= bpp ? row[i - bpp] : 0) : f === 2 ? prev[i] : 0)) & 255;
      let s = 0;
      for (let i = 1; i < o.length; i++) s += o[i] < 128 ? o[i] : 256 - o[i];
      return [s, o];
    });
    cands.sort((a, b) => a[0] - b[0]);
    rows.push(cands[0][1]);
    prev = row;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(p.w, 0);
  ihdr.writeUInt32BE(p.h, 4);
  ihdr[8] = 8;
  ihdr[9] = alpha ? 6 : 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
// a fixed sequence of random numbers, so the picture comes out the same every time
let seed = 7;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
// ordered dithering: is this pixel on, for a share t of on pixels?
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (x, y, t) => t > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

// ---- sprites, from rows of letters ----
const PAL = {
  B: '#d97757', // Clawd
  L: '#ec9a74',
  S: '#b55e42',
  G: '#94472f',
  E: '#1e120f',
  K: '#1b1218',
  k: '#3b2f3f',
  W: '#f6efe4',
  w: '#cdbfa8',
  Y: '#ffd35a',
  y: '#e09a2e',
  O: '#ff9a3c',
  R: '#e2493b',
  r: '#9a2f2c',
  P: '#ff86a6',
  p: '#d4527a',
  U: '#5a9be6',
  u: '#355fa3',
  C: '#9fe6f2',
  c: '#4fb3c8',
  N: '#74c46c',
  n: '#3f8a4a',
  V: '#8b67d8',
  v: '#5a3f9e',
  M: '#a49eb4',
  m: '#625c72',
  H: '#8e5c3b',
  h: '#5e3a25',
  T: '#d6b07c',
  t: '#a8835a',
  Z: '#c9b8f0',
  z: '#8f7cc0',
};
function spr(rows, extra) {
  const pal = Object.assign({}, PAL, extra || {}),
    p = new Pic(Math.max(...rows.map(r => r.length)), rows.length);
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) if (r[x] !== '.' && r[x] !== ' ') p.set(x, y, pal[r[x]] || '#ff00ff');
  });
  return p;
}
const mirror = rows => rows.map(r => r.split('').reverse().join(''));
// a frame grid shifted down by n rows (and cut to the same height)
const down = (rows, n) => rows.map((_, y) => (y - n >= 0 && y - n < rows.length ? rows[y - n] : '.'.repeat(rows[0].length)));
const pad = (rows, l, r, t, b) => {
  const w = rows[0].length + l + r,
    e = '.'.repeat(w);
  return [...Array(t).fill(e), ...rows.map(x => '.'.repeat(l) + x + '.'.repeat(r)), ...Array(b).fill(e)];
};
// put rows of letters over others at (x, y); '.' leaves what is under it
const over = (base, top, x, y) =>
  base.map((r, j) => {
    const t = top[j - y];
    if (t === undefined) return r;
    const a = r.split('');
    for (let i = 0; i < t.length; i++) if (t[i] !== '.' && x + i >= 0 && x + i < a.length) a[x + i] = t[i];
    return a.join('');
  });

const reseed = n => {
  seed = n;
};
module.exports = { Pic, png, rgba, rand, ri, reseed, dith, BAYER, spr, PAL, mirror, down, pad, over };
