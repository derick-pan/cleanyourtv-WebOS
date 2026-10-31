// Draws the Claude theme's world, original pixel art made here pixel by pixel, and writes it into themes/claude/:
//   world.png   the backdrop, 1920 x 1080: a 384 x 216 picture with every art pixel 5 x 5 (effects.wallpaper)
//   clawd.png   the sprite sheet at one pixel per art pixel: the Clawds, their poses and tools, props and particles (world.file)
//   theme.json  its "world": the sprites, spots, props and drift, from the same layout as the picture, so they always line up
// The character is a Clawd as in Claude Code's terminal (a block with two eyes, little arms and four legs), drawn for this theme.
//   node tools/clawd-world.js [--sheet <folder>]   (--sheet also writes a contact sheet of the sprites, 5x, to look at)
'use strict';
const fs = require('fs'),
  path = require('path'),
  zlib = require('zlib');
const OUT = path.join(__dirname, '..', 'themes', 'claude');
const W = 384,
  H = 216,
  PX = 5;

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

// ---- the Clawd: a body of 12 x 8 with two eyes, an arm each side and four legs, 16 x 10 in all; drawn facing right ----
function clawd(o) {
  o = o || {};
  const r = [
    '..LLLLLLLLLLLL..',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..SSSSSSSSSSSS..',
  ].map(x => x.split(''));
  const set = (x, y, c) => {
    if (r[y] && x >= 0 && x < 16) r[y][x] = c;
  };
  const eyes = o.eyes || 'right',
    ex = ['right', 'blink', 'wide', 'downr'].indexOf(eyes) >= 0 ? [5, 12] : [4, 11];
  for (const x of ex) {
    if (eyes === 'right' || eyes === 'front') {
      set(x, 2, 'E');
      set(x, 3, 'E');
    } else if (eyes === 'blink' || eyes === 'down' || eyes === 'downr') set(x, 3, 'E');
    else if (eyes === 'happy') {
      set(x, 2, 'E');
      set(x - 1, 3, 'E');
      set(x + 1, 3, 'E');
    } else if (eyes === 'closed') {
      set(x, 3, 'E');
      set(x + 1, 3, 'E');
    } else if (eyes === 'wide') {
      set(x, 1, 'E');
      set(x, 2, 'E');
      set(x, 3, 'E');
    }
  }
  if (o.mouth) for (const [x, y, c] of o.mouth) set(x, y, c || 'E');
  if (o.arms !== 'none') {
    if (o.arms !== 'right') {
      set(0, 4, 'B');
      set(1, 4, 'B');
      set(0, 5, 'S');
      set(1, 5, 'B');
    }
    if (o.arms !== 'left') {
      set(14, 4, 'B');
      set(15, 4, 'B');
      set(14, 5, 'B');
      set(15, 5, 'S');
    }
  }
  const rows = r.map(a => a.join(''));
  const legs = {
    stand: ['...G.G....G.G...', '...G.G....G.G...'],
    a: ['...G..G...G..G..', '...G......G.....'],
    b: ['....G.G....G.G..', '.....G......G...'],
    none: [],
  }[o.legs || 'stand'];
  return rows.concat(legs);
}
// a walk: the body bobs a pixel as the legs swap, front pair and back pair in turn
// prettier-ignore
const WALK = [
  ['................', ...clawd()],
  [...clawd({ legs: 'a' }).slice(0, 8), '...G..G...G..G..', '...G..G...G..G..', '...G......G.....'],
  ['................', ...clawd()],
  [...clawd({ legs: 'b' }).slice(0, 8), '....G.G....G.G..', '....G.G....G.G..', '.....G......G...'],
];
// prettier-ignore
const STAND = [0, 1, 2, 3, 4, 5, 6, 7].map(i => clawd({ eyes: i === 6 ? 'blink' : 'right' }));
// climbing, seen from the back: an arm up on a rung, the legs in turn
// prettier-ignore
const CLIMB0 = [
  'BB..............',
  'BB..............',
  'BBLLLLLLLLLLLL..',
  '.BBBBBBBBBBBBB..',
  '..BBBBBBBBBBBB..',
  '..BBBBBBBBBBBB..',
  '..BBBBBBBBBBBBBB',
  '..BBBBBBBBBBBBBS',
  '..BBBBBBBBBBBB..',
  '..SSSSSSSSSSSS..',
  '...G.G....G.G...',
  '...G.G..........',
];
const CLIMB = [CLIMB0, mirror(CLIMB0)];
// waving: the right arm up, happy eyes
const waveBody = clawd({ eyes: 'happy', arms: 'left' });
const WAVE = [
  over(pad(waveBody, 0, 2, 3, 0), ['BS', 'BB', 'BB', '.B'], 14, 0),
  over(pad(waveBody, 0, 2, 3, 0), ['.BS', 'BBB', 'BB.'], 14, 1),
];

// ---- what the Clawds do at the spots (facing right; a spot can mirror them) ----
const sit = o => clawd(Object.assign({ legs: 'none' }, o));
// reading: sitting behind a big open book, eyes going along the lines; now and then a page turns
// prettier-ignore
const bookRows = ['WWWWWhhWWWWW', 'WwwWWhhWwwWW', 'WWWWWhhWWWWW', 'WwwwWhhWwwwW', 'rrrrrrrrrrrr'];
const reading = eyes => over(pad(sit({ eyes }), 0, 0, 0, 1), bookRows, 2, 4);
const READ = [
  reading('down'),
  reading('down'),
  reading('downr'),
  reading('downr'),
  over(reading('downr'), ['.W.', '.WW', 'WW.'], 7, 1),
  over(reading('down'), ['WW..', '.WW.', '..W.'], 4, 2),
];
// typing on a laptop: eyes on the screen, hands taking turns on the keys
// prettier-ignore
const lap = ['mMMMMMMMMMMm', 'mMMMMMMMMMMm', 'mMMMMWMMMMMm', 'mMMMMMMMMMMm'];
const typing = (l, r) =>
  over(
    over(pad(sit({ eyes: 'front', arms: 'none' }), 0, 0, 0, 1), [...lap, 'kkkkkkkkkkkk'], 2, 4),
    [l ? 'BB' : '..', 'BB', l ? '..' : 'BS'],
    0,
    5
  ).map((row, y) => (y >= 5 && y <= 7 ? row.slice(0, 14) + [r ? 'BB' : '..', 'BB', r ? '..' : 'SB'][y - 5] : row));
const TYPE = [typing(true, false), typing(false, true), typing(true, false), typing(false, false)];
// a game: sitting, the controller held out
const GAME = [
  over(pad(sit({ arms: 'left' }), 0, 4, 1, 0), ['BB.', 'BkkkR', '.kYkk'], 14, 4),
  over(pad(sit({ arms: 'left' }), 0, 4, 1, 0), ['BB..', 'BkkkR', '.kkYk'], 14, 5),
  over(pad(sit({ arms: 'left', eyes: 'wide' }), 0, 4, 1, 0), ['.BB.', 'BkkkR', '.kYkk'], 14, 3),
  over(pad(sit({ arms: 'left' }), 0, 4, 1, 0), ['BB..', 'BkkkR', '.kkYk'], 14, 5),
];
// hammering at the anvil on the right (its top 4 px above the floor, 11 to 17 px right of the feet): up, swing, strike with sparks
const smith = (arm, ay, tool, tx, ty, sparks) => {
  let f = over(pad(clawd({ arms: 'left' }), 2, 10, 6, 0), arm, 16, ay);
  f = over(f, tool, tx, ty);
  return sparks ? over(f, sparks, 20, 4) : f;
};
// prettier-ignore
const UP = ['BB', 'BB', 'BB', 'BS'];
// prettier-ignore
const HAMMER = [
  smith(UP, 7, ['MMMM', 'mmmm', '.H..', '.H..', 'H...', 'H...'], 16, 1),
  smith(UP, 7, ['MMMM', 'mmmm', '.H..', '.H..', 'H...', 'H...'], 16, 1),
  smith(['BBB', 'BBS'], 9, ['....MM', 'HHH.MM', '....MM', '....mm'], 18, 8),
  smith(['BBB', 'BBS'], 10, ['...MMM', 'HHHMMM', '...mmm'], 18, 9, ['Y..W..O', '.O.Y.W.', '..W.Y..', 'O..O..Y']),
  smith(['BBB', 'BBS'], 10, ['...MMM', 'HHHMMM', '...mmm'], 18, 9),
];
// a pickaxe at the rock face on the right
// prettier-ignore
const PICK = [
  smith(UP, 7, ['.mMMMm.', 'M..H..M', '...H...', '..H....', '..H....', '.H.....'], 13, 1),
  smith(UP, 7, ['.mMMMm.', 'M..H..M', '...H...', '..H....', '..H....', '.H.....'], 13, 1),
  smith(['BBB', 'BBS'], 9, ['....M', '....M', 'HHHMM', '....M', '....M'], 18, 7),
  smith(['BBB', 'BBS'], 10, ['....m', 'HHHMM', '...M.', '..M..'], 18, 9, ['..t.T..', '.T..t..', '...T..t', '.t..m..']),
  smith(['BBB', 'BBS'], 10, ['....m', 'HHHMM', '...M.', '..M..'], 18, 9),
];
// asleep under a blanket, breathing
// prettier-ignore
const blanket = ['UUUUUUUUUUUUUUUUUUUUUU', 'UWUUUUWUUUUUWUUUUUWUUU', 'UUUUUWUUUUUWUUUUUUUWUU', 'uuuuuuuuuuuuuuuuuuuuuu'];
const NAP = [
  over(pad(sit({ eyes: 'closed', arms: 'none' }), 8, 0, 1, 0), blanket, 0, 5),
  over(pad(sit({ eyes: 'closed', arms: 'none' }), 8, 0, 1, 0), ['UUUUUUUUUUUUUUUUUUUUUU', ...blanket], 0, 4),
];
// roasting a marshmallow over the fire on the right: it goes golden, then brown
const roast = (m, dy) =>
  over(
    over(pad(sit({ arms: 'left' }), 0, 12, 5, 0), ['BBh', 'BS.'], 14, 9),
    [...m, ...['.......h', '.....h..', '...h....', '.h......', 'h.......']].slice(0),
    15,
    0 + dy
  );
const mm = c => ['.......' + c[0] + c[0], '.......' + c[1] + c[1]];
const ROAST = [roast(mm('WW'), 0), roast(mm('Ww'), 1), roast(mm('TT'), 0), roast(mm('ty'), 1)];
// brewing: goggles on, a flask held up and shaken; bubbles rise from it
// prettier-ignore
const goggles = [
  [3, 2, 'k'], [4, 2, 'C'], [5, 2, 'C'], [6, 2, 'k'], [7, 2, 'k'], [8, 2, 'k'], [9, 2, 'k'], [10, 2, 'C'], [11, 2, 'C'], [12, 2, 'k'],
  [4, 3, 'c'], [5, 3, 'C'], [10, 3, 'c'], [11, 3, 'C'],
];
const brewer = () => pad(clawd({ eyes: 'none', arms: 'left', mouth: goggles }), 0, 6, 4, 0);
const BREW = [
  over(brewer(), ['.W..', '.W..', 'WNNW', 'NNNN', 'NnNN', '.NN.', '.BB.', 'BBS.'], 15, 2),
  over(brewer(), ['..W.', '..W.', '.WNW', 'NNNN', 'NNnN', '.NN.', '.BB.', 'BBS.'], 15, 2),
  over(brewer(), ['.W..', '.W..', 'WNNW', 'NnNN', 'NNNN', '.NN.', '.BB.', 'BBS.'], 15, 3),
];
// a wizard: hat on, wand up, a star at its tip
// prettier-ignore
const hat = ['........vV', '.......vVV', '......vVVV', '.....vVYVV', '....vVYYYV', '....vVVYVV', '...vVVVVVV', '..vVVVVVVVV', 'vvvvvvvvvvvvvvv'];
const wizard = (wand, star, at) => {
  let f = over(pad(clawd({ arms: 'left' }), 0, 6, 8, 0), hat, 0, 0);
  f = over(f, wand, 15, 9);
  return over(f, star, at[0], at[1]);
};
const WIZARD = [
  wizard(['....h', '...h.', '..h..', '.h...', 'BB...', 'BS...'], ['.W.', 'WYW', '.W.'], [19, 6]),
  wizard(['....h', '...h.', '..h..', '.h...', 'BB...', 'BS...'], ['Y.W.Y', '.WYW.', 'WYWYW', '.WYW.', 'Y.W.Y'], [18, 5]),
  wizard(['..h', '..h', '.h.', '.h.', 'BB.', 'BS.'], ['.W.', 'WYW', '.W.'], [16, 5]),
  wizard(['.....', '.....', '...hh', '.hh..', 'BB...', 'BS...'], ['.W.', 'WYW', '.W.'], [20, 9]),
];
// conducting the little choir on the right: the baton beats a pattern
const conductor = (arm, baton, at) => over(over(pad(clawd({ arms: 'left' }), 0, 6, 5, 0), arm, 14, 5), baton, at[0], at[1]);
const CONDUCT = [
  conductor(['..', '..', '..', '..', 'BB', 'BS'], ['..W', '.W.', 'W..'], [16, 5]),
  conductor(['..', '..', '..', '..', 'BB', 'BS'], ['WWW'], [16, 9]),
  conductor(['..', '..', '..', '..', '..', 'BB', 'BS'], ['W..', '.W.', '..W'], [16, 11]),
  conductor(['..', '..', 'BB', 'BB', 'BS'], ['W', 'W', 'W'], [15, 2]),
];
// fishing off the end of the pier: the bobber floats, now and then something bites
const angler = (eyes, rod, line, bob) => {
  let f = pad(sit({ eyes, arms: 'left' }), 0, 14, 4, 9);
  f = over(f, ['BB', 'BS'], 14, 8);
  f = over(f, rod, 15, 0);
  for (let y = line[0]; y <= line[1]; y++) f = over(f, ['w'], line[2], y);
  return over(f, bob, line[2] - 1, line[1] + 1);
};
// prettier-ignore
const rod0 = ['............h', '..........hh.', '........hh...', '......hh.....', '....hh.......', '..hh.........', 'hh...........'];
// prettier-ignore
const rod1 = ['.............', '..........hhh', '........hh...', '......hh.....', '....hh.......', '..hh.........', 'hh...........'];
const FISH = [
  angler('right', rod0, [1, 16, 27], ['.R.', '.W.']),
  angler('right', rod0, [1, 16, 27], ['.R.', '.W.']),
  angler('right', rod0, [1, 17, 27], ['.R.', '.W.']),
  angler('right', rod0, [1, 17, 27], ['.R.', '.W.']),
  angler('blink', rod0, [1, 16, 27], ['.R.', '.W.']),
  angler('right', rod0, [1, 17, 27], ['.R.', '.W.']),
  angler('wide', rod1, [2, 18, 27], ['C.C', '.C.']),
  angler('wide', rod1, [2, 18, 27], ['.C.', 'C.C']),
];
// dancing in the meadow: arms up, a bounce, a squat
const dancer = (dy, arms, legs) => {
  const b = clawd({ eyes: 'happy', arms: arms === 'side' ? 'both' : 'none', legs });
  let f = down(pad(b, 0, 0, 3, 0), 0);
  f = down(f, dy);
  if (arms === 'up') f = over(f, ['BB............BB', 'BB............BB', 'SB............BS'], 0, dy);
  return f.slice(0, 13);
};
const DANCE = [dancer(0, 'up', 'stand'), dancer(1, 'side', 'stand'), dancer(-1 + 0, 'up', 'a'), dancer(1, 'side', 'b')];
// watering the flowers on the right
// prettier-ignore
const can = ['..ccc...', '.cCCCc..', 'BcCCCcccc', 'BScCCc...', '..ccc....'];
const waterer = drops => over(over(pad(clawd({ arms: 'left' }), 0, 9, 2, 0), can, 14, 4), drops, 21, 7);
const WATER = [
  waterer(['U..', '...', '.C.', '...', 'U..']),
  waterer(['.C.', 'U..', '...', '.C.', '...']),
  waterer(['...', '.C.', 'U..', '...', 'C..']),
];
// burrowing into the sand (once), and popping out again (the same, backwards)
// prettier-ignore
const mound = ['....tTTTTTTt....', '..tTTTTTTTTTTt..', 'tTTtTTTTTTtTTTTt'];
const DIG = [0, 3, 5, 7, 9, 12].map((n, i) => {
  let f = down(pad(clawd({ eyes: i ? 'wide' : 'right' }), 0, 0, 2, 0), n);
  f = f.map((r, y) => (y >= 10 ? '.'.repeat(16) : r));
  f = over(f, mound, 0, 9);
  return i === 5 ? over(f, ['w.....w..w', '..w.w.....'], 3, 6) : f;
});
const POP = DIG.slice().reverse();

// ---- props and particles ----
// a campfire: hand-drawn flames in four frames, a white-hot heart, yellow, orange and dark red tips
// prettier-ignore
const firePal = { 1: '#7a1f22', 2: '#c2372b', 3: '#ef6a2c', 4: '#ffa63c', 5: '#ffd45e', 6: '#fff3c4' };
// prettier-ignore
const FIRE = [
  [
    '......2.......',
    '......32......',
    '.....232...2..',
    '..2..343..23..',
    '..32.3443.32..',
    '..3323454333..',
    '.23334455433..',
    '.234445554432.',
    '.234455655432.',
    '..3445666543..',
    '..3445666543..',
    '...34566543...',
    '....345543....',
  ],
  [
    '.......2......',
    '......23......',
    '..2...343.....',
    '..32..343..2..',
    '..33.34443.3..',
    '..343345433...',
    '.23344455432..',
    '.234455554432.',
    '.234456655432.',
    '..3445666543..',
    '..3445666543..',
    '...34566543...',
    '....345543....',
  ],
  [
    '.....2........',
    '.....32....2..',
    '....233...23..',
    '..2.343...32..',
    '.23.3443.343..',
    '.33334543443..',
    '.23344554433..',
    '.234445555432.',
    '.234456655432.',
    '..3445666543..',
    '..3445666543..',
    '...34566543...',
    '....345543....',
  ],
  [
    '........2.....',
    '.......23.....',
    '...2...343....',
    '..23..3443.2..',
    '..33.34543.32.',
    '..3433455433..',
    '.23344455433..',
    '.234455554432.',
    '.234456655432.',
    '..3445666543..',
    '..3445666543..',
    '...34566543...',
    '....345543....',
  ],
];
// prettier-ignore
const HEART = ['.PP.PP.', 'PWPPPPP', 'PPPPPPp', '.PPPPp.', '..PPp..', '...p...'];
// prettier-ignore
const NOTE = ['..WWW', '..W.W', '..W..', '..W..', 'WWW..', 'WWW..'];
// prettier-ignore
const ZZ = ['ZZZZ', '..Z.', '.Z..', 'ZZZZ'];
// prettier-ignore
const SPARKLE = [
  ['.....', '.....', '..Y..', '.....', '.....'],
  ['.....', '..Y..', '.YWY.', '..Y..', '.....'],
  ['..Y..', '..W..', 'YWWWY', '..W..', '..Y..'],
  ['.....', '..Y..', '.YWY.', '..Y..', '.....'],
];
// prettier-ignore
const BUBBLE = [['.C.', 'C.C', '.C.'], ['.c.', 'c.W', '.c.']];
// prettier-ignore
const EMBER = [['Y'], ['O']];
// prettier-ignore
const SMOKE = [
  ['.......', '.......', '.......', '..aa...', '.abba..', '..aa...', '.......'],
  ['.......', '.......', '..aab..', '.abbba.', '.abbba.', '..aaa..', '.......'],
  ['.......', '..aaa..', '.abbba.', 'aabbbaa', '.abbba.', '..aa...', '.......'],
  ['.......', '..a.a..', '.a.b.a.', 'a.b.b.a', '.a.a.a.', '..a....', '.......'],
];
const smokePal = { a: '#9d8fae', b: '#c7bdd4' };
// prettier-ignore
const GLINT = [
  ['...WYW...', '.........'],
  ['..W.Y.W..', '....W....'],
  ['.W..O..W.', '.........'],
  ['....Y....', '.........'],
];
const REEDS = [0, 1, 2].map(k => {
  const sway = [0, 1, 0][k],
    sw2 = [1, 0, -1][k];
  const f = Array(14).fill('.'.repeat(10));
  const stalk = (x, top, s) => {
    let r = f;
    r = over(r, ['h', 'H', 'H', 'h'], x + s, top);
    for (let y = top + 4; y < 14; y++) r = over(r, [y < top + 7 && s ? 'N' : 'n'], x + (y < top + 6 ? s : 0), y);
    return r;
  };
  let r = stalk(1, 2, sway);
  r = r.map((x, i) => x);
  const a = stalk(4, 0, sw2);
  r = r.map((row, i) =>
    row
      .split('')
      .map((c, j) => (c !== '.' ? c : a[i][j]))
      .join('')
  );
  const b = stalk(7, 3, sway);
  r = r.map((row, i) =>
    row
      .split('')
      .map((c, j) => (c !== '.' ? c : b[i][j]))
      .join('')
  );
  return over(r, ['n.N..n.N..', 'NnnNnNnnNn'], 0, 12);
});
// prettier-ignore
const FLAG = [
  ['BBBBB...', 'BLLBBBB.', 'BBBBBB..', 'BS......'],
  ['BBBB....', 'BLLBBB..', 'BBBBBBB.', 'BSS.....'],
  ['BBBBBB..', 'BLLBBB..', 'BBBBB...', 'BS......'],
];
// the game on the TV in the game room, in a handheld's four greens: a little one hopping along
const gb = { 1: '#9bbc0f', 2: '#8bac0f', 3: '#306230', 4: '#0f380f' };
// prettier-ignore
const TV = [
  ['1111111111', '1111111111', '1111133111', '1112211111', '1144111111', '4444444444'],
  ['1111111111', '1111113311', '1111111111', '1111221111', '1111441111', '4444444444'],
  ['1111111111', '1111111131', '1111111111', '1111111221', '1111111441', '4444444444'],
  ['1112211111', '1114411111', '1111111111', '1111111111', '1111111111', '4444444444'],
].map(f => f.map(r => r.replace(/[1-4]/g, d => 'abcd'[d - 1])));
const gbPal = { a: gb[1], b: gb[2], c: gb[3], d: gb[4] };
// a terminal on the office wall: a prompt and a blinking cursor
// prettier-ignore
const TERM = [
  ['qqqqqqqqq', 'qOqqqqqqq', 'qqOqqqqqq', 'qOqqWWqqq', 'qqqqqqqqq'],
  ['qqqqqqqqq', 'qOqqqqqqq', 'qqOqqqqqq', 'qOqqqqqqq', 'qqqqqqqqq'],
];
const termPal = { q: '#1d1a26' };
// three little Clawds singing, mouths open in turn
const mini = (open, dy) =>
  down(['.LLLLLL.', '.BEBBEB.', 'BBBBBBBB', open ? '.BBkkBB.' : '.BBBBBB.', '.SSSSSS.', '..G..G..', '........'], dy);
const trio = (a, b, c) => [0, 1, 2, 3, 4, 5, 6].map(y => a[y] + '..' + b[y] + '..' + c[y]);
const CHOIR = [
  trio(mini(1, 0), mini(0, 1), mini(1, 0)),
  trio(mini(0, 1), mini(1, 0), mini(0, 1)),
  trio(mini(1, 0), mini(1, 1), mini(0, 0)),
  trio(mini(0, 1), mini(0, 0), mini(1, 1)),
];
// little Clawds playing in the meadow, hopping in turn
const MINIS = [0, 1, 2, 3].map(k => {
  const hop = i => (k % 3 === i ? 0 : 2);
  const m = i =>
    down(['.LLLLLL.', i === 1 ? '.BEBBEB.' : '.BEBBEB.', 'BBBBBBBB', '.BBBBBB.', '.SSSSSS.', '..G..G..', '........', '........'], hop(i));
  return [0, 1, 2, 3, 4, 5, 6, 7].map(y => m(0)[y] + '...' + m(1)[y] + '...' + m(2)[y]);
});
// a Clawd swimming in the pond: eyes above the water, rings around it
// prettier-ignore
const SWIM = [
  ['....LLLLLLLL....', '....BBEBBBEB....', '....BBEBBBEB....', '..CCBBBBBBBBCC..', 'CC..cccccccc..CC', '................'],
  ['....LLLLLLLL....', '....BBEBBBEB....', '...CBBEBBBEBC...', '.CC.BBBBBBBB.CC.', 'C...cccccccc...C', '................'],
];
// a fish jumping out of the pond now and then
// prettier-ignore
const FISHJ = [
  ['................', '................', '................', '................', '................', '................', '................', '................', '.......C........', '......C.C.......'],
  ['................', '................', '................', '................', '................', '.........O......', '........OOO.....', '.......YOO......', '......C..C......', '.....C....C.....'],
  ['................', '.......OOO......', '......YOOOOO....', '.........O..O...', '................', '................', '................', '................', '................', '................'],
  ['................', '................', '................', '..........OO....', '.........OOOY...', '.........O.O....', '................', '................', '................', '................'],
  ['................', '................', '................', '................', '................', '................', '.........C.C....', '..........C.....', '........CWCWC...', '.........C.C....'],
  ['................', '................', '................', '................', '................', '................', '................', '.......C...C....', '......C.....C...', '........CCC.....'],
  ['................', '................', '................', '................', '................', '................', '................', '................', '.....c.......c..', '.......ccccc....'],
];
// prettier-ignore
const FIREFLY = [['.y.', 'yYy', '.y.']];
// prettier-ignore
const STAR = [['..W..', '..W..', 'WWWWW', '..W..', '..W..']];
// prettier-ignore
const STAR2 = [['.W.', 'WWW', '.W.']];
// a shooting star, now and then: a bright head and a fading trail, across and down
const SHOOT = [0, 1, 2, 3, 4, 5, 6].map(k => {
  let r = Array(14).fill('.'.repeat(44));
  const hx = 40 - k * 6,
    hy = 1 + k * 2,
    len = k < 5 ? 12 : 12 - (k - 4) * 5;
  for (let i = len - 1; i >= 0; i--) r = over(r, [i === 0 ? 'W' : i < 3 ? 'Y' : i < 7 ? 'Z' : 'z'], hx + i, hy - Math.floor(i / 3));
  return r;
});
// clouds lit from below by the sun that has just gone
const cloud = (w, h, bumps) => {
  const p = new Pic(w, h);
  const cols = ['#5a3d63', '#7e4c6c', '#a65d72', '#d97d74', '#f4a582'];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let inside = false;
      for (const b of bumps) if (Math.pow((x - b[0]) / b[2], 2) + Math.pow((y - b[1]) / b[3], 2) <= 1) inside = true;
      if (!inside) continue;
      // lighter towards the bottom, where the light comes from
      const t = y / (h - 1);
      const k = Math.min(4, Math.floor(t * 4.6 + (dith(x, y, (t * 4.6) % 1) ? 1 : 0) * 0));
      p.set(x, y, cols[Math.min(4, Math.max(0, k))]);
    }
  // the bottom edge bright
  for (let x = 0; x < w; x++)
    for (let y = h - 1; y >= 0; y--)
      if (p.get(x, y)[3]) {
        p.set(x, y, cols[4]);
        break;
      }
  return [p];
};
const CLOUDA = cloud(46, 12, [
  [10, 8, 9, 4],
  [22, 6, 10, 6],
  [33, 7, 9, 5],
  [40, 9, 6, 3],
]);
const CLOUDB = cloud(30, 9, [
  [8, 6, 7, 3],
  [16, 4, 8, 5],
  [24, 6, 6, 3],
]);
const CLOUDC = cloud(58, 14, [
  [10, 10, 9, 4],
  [22, 7, 11, 7],
  [36, 6, 12, 8],
  [48, 9, 9, 5],
]);
// prettier-ignore
const BIRD = [['k.....k', '.k...k.', '..kkk..', '.......'], ['.......', '..kkk..', '.k...k.', 'k.....k']].map(f => f);
// prettier-ignore
const BALLOON = [
  [
    '....BBWWBB....',
    '..BBBWWWWBBB..',
    '.BBBBWWWWBBBB.',
    'BBBBBWWWWBBBBS',
    'BLBBBWWWWBBBBS',
    'BLBBBWWWWBBBBS',
    'BBBBBWWWWBBBBS',
    '.BBBBWWWWBBBS.',
    '..SBBWWWWBBS..',
    '...SSwwwwSS...',
    '....h....h....',
    '.....h..h.....',
    '.....h..h.....',
    '....HHHHHH....',
    '....HEBBEH....',
    '....hhhhhh....',
  ],
];
// prettier-ignore
const BUTTERFLY = [['P.P', 'PkP', '.k.'], ['.P.', '.k.', '.k.']];
const GLOW = (r, col) => {
  const p = new Pic(2 * r + 1, 2 * r + 1),
    c = rgba(col);
  for (let y = 0; y <= 2 * r; y++)
    for (let x = 0; x <= 2 * r; x++) {
      const d = Math.sqrt((x - r) * (x - r) + (y - r) * (y - r)) / r;
      if (d > 1) continue;
      const a = d < 0.35 ? 0.42 : d < 0.65 ? 0.26 : 0.12;
      p.set(x, y, [c[0], c[1], c[2], Math.round(a * 255)]);
    }
  return [p];
};
const DOT = [['.']];

// the flasks on the lab's bench, bubbling
// prettier-ignore
const FLASKS = [
  ['..W.....W...', '..W....WPW..', '.WNW...WPW.W', 'WNNNW..PPPWUW', 'WNnNW.WPPPWUW', '.WWW..WWWWWUW'],
  ['..W.....W...', '..W....WPW..', '.WNW...WPPW.W', 'WNnNW..PPPWUW', 'WNNNW.WPPPWUW', '.WWW..WWWWWUW'],
  ['..W.....W...', '..W....WPW..', '.WnW...WPW.W', 'WNNNW..PPPWUW', 'WNNNW.WPPPWUW', '.WWW..WWWWWUW'],
];
// ---- the backdrop: the sky, then the land on a layer of its own (the tops of buildings and trees are cut from it, so the clouds
// pass behind them) ----
// the places that the picture and the theme's spots share, in art pixels
const G = {
  street: 172 /* the back edge of the street, where buildings stand */,
  front: 187 /* its front edge */,
  upper: 148 /* the house's upper floor */,
  ladder: 188 /* the ladder between the floors */,
  sun: [344, 121],
  moon: [168, 22],
  mine: 17,
  forge: [76, 126],
  anvil: 117 /* the left end of the anvil's top */,
  smith: 106,
  lamp: 130,
  house: [138, 240],
  desk: [158, 174],
  tower: [284, 310],
  balcony: 140,
  towerLadder: 280,
  fire: [262, 190],
  pier: [312, 352, 175],
  stage: [62, 122, 197],
  water: 182 /* the pond's surface under the pier */,
};
const sky = new Pic(W, H),
  land = new Pic(W, H);
const SKY = [
  [0, '#130f25'],
  [26, '#19132f'],
  [44, '#221937'],
  [58, '#2d1f3d'],
  [70, '#3d2443'],
  [80, '#512a49'],
  [89, '#6a304d'],
  [97, '#88384f'],
  [104, '#a84450'],
  [110, '#c4584f'],
  [115, '#db7152'],
  [120, '#eb8d57'],
  [126, '#f4a964'],
];
function skyAt(x, y) {
  // nearer the sun the sky is a little further down the gradient (warmer)
  const d = Math.hypot(x - G.sun[0], (y - G.sun[1]) * 1.6),
    yy = y + Math.max(0, 1 - d / 120) * 16;
  let k = 0;
  while (k < SKY.length - 2 && yy >= SKY[k + 1][0]) k++;
  const [y0, c0] = SKY[k],
    [y1, c1] = SKY[k + 1];
  // flat bands, dithered only in the last few rows before the next colour
  const z = Math.min(5, (y1 - y0) / 2),
    t = Math.min(1, Math.max(0, (yy - (y1 - z)) / z));
  return dith(x, y, t) ? c1 : c0;
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sky.set(x, y, skyAt(x, y));
// stars, thinner towards the horizon; a few bigger ones
seed = 11;
for (let i = 0; i < 150; i++) {
  const x = ri(0, W - 1),
    y = Math.floor(Math.pow(rand(), 1.6) * 92);
  if (Math.hypot(x - G.moon[0], y - G.moon[1]) < 14) continue;
  sky.set(x, y, rand() < 0.3 ? '#efe4d2' : rand() < 0.5 ? '#a796c6' : '#7d6c9e');
}
for (const [x, y] of [
  [226, 8],
  [120, 42],
  [300, 36],
  [58, 70],
  [356, 74],
  [252, 58],
]) {
  sky.set(x, y, '#f6efe4');
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    sky.set(x + dx, y + dy, '#9d8dc0');
}
// the moon, a crescent with a soft halo in steps
for (let r = 12; r > 7; r -= 2) sky.disc(G.moon[0], G.moon[1], r, [246, 233, 204, 14]);
sky.disc(G.moon[0], G.moon[1], 7, '#f6e9cc');
sky.disc(G.moon[0] + 1, G.moon[1], 6, '#fff7e4');
for (let y = G.moon[1] - 8; y <= G.moon[1] + 8; y++)
  for (let x = G.moon[0] - 8; x <= G.moon[0] + 8; x++)
    if (Math.hypot(x - G.moon[0] - 4, y - G.moon[1] + 2) <= 6.2 && Math.hypot(x - G.moon[0], y - G.moon[1]) <= 7.5)
      sky.set(x, y, skyAt(x, y));
// the sun, just going down behind the far hills, with rings of glow
for (let r = 26; r > 15; r -= 3) sky.disc(G.sun[0], G.sun[1], r, [255, 196, 120, 26]);
sky.disc(G.sun[0], G.sun[1], 14, '#ffc98a');
sky.disc(G.sun[0], G.sun[1], 12, '#ffdca8');
sky.disc(G.sun[0] + 1, G.sun[1] - 1, 9, '#ffe9c4');

// a ridge line: straight between the points, roughened a little
function ridge(pts, rough) {
  const out = [];
  for (let x = 0; x < W; x++) {
    let k = 0;
    while (k < pts.length - 2 && x >= pts[k + 1][0]) k++;
    const [x0, y0] = pts[k],
      [x1, y1] = pts[k + 1];
    out.push(Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0) + (rough ? Math.round((rand() - 0.5) * rough) : 0)));
  }
  return out;
}
// mountains: the slopes that face the sun (on the right) catch a rim of light
function mountains(r, base, rim, rim2, haze) {
  for (let x = 0; x < W; x++) {
    for (let y = r[x]; y < G.street; y++) {
      let c = base;
      if (haze && y > r[x] + 6) c = dith(x, y, Math.min(1, (y - r[x] - 6) / 18) * 0.5) ? haze : base;
      land.set(x, y, c);
    }
    const lit = x + 1 < W && r[x + 1] > r[x];
    if (lit) {
      land.set(x, r[x], rim);
      land.set(x, r[x] + 1, rim2);
    } else land.set(x, r[x], rim2);
  }
}
seed = 3;
mountains(
  ridge(
    [
      [0, 108],
      [26, 100],
      [52, 109],
      [86, 97],
      [118, 108],
      [150, 102],
      [190, 112],
      [224, 98],
      [258, 108],
      [286, 103],
      [318, 116],
      [362, 106],
      [384, 110],
    ],
    2
  ),
  '#4a2c51',
  '#a0566a',
  '#6c3a5d',
  '#583257'
);
mountains(
  ridge(
    [
      [0, 120],
      [40, 113],
      [80, 121],
      [120, 116],
      [160, 124],
      [200, 117],
      [240, 125],
      [270, 119],
      [300, 126],
      [330, 121],
      [384, 124],
    ],
    1
  ),
  '#33294a',
  '#7a4a64',
  '#4a3556',
  '#3b2d4e'
);
// rolling hills in front, dusky green, a row of little trees on them
seed = 5;
const hillTop = ridge(
  [
    [0, 132],
    [30, 127],
    [70, 133],
    [110, 128],
    [150, 134],
    [190, 129],
    [230, 135],
    [270, 130],
    [310, 134],
    [350, 128],
    [384, 131],
  ],
  0
);
for (let x = 0; x < W; x++) {
  for (let y = hillTop[x]; y < G.street; y++) land.set(x, y, y < hillTop[x] + 2 ? '#3d4a46' : dith(x, y, 0.15) ? '#2a3436' : '#2e3a3a');
}
for (let x = 2; x < W; x += ri(5, 9)) {
  const h = ri(4, 8),
    t = hillTop[x];
  for (let j = 0; j < h; j++) {
    const w = Math.floor(((j + 1) * 3) / h);
    land.hline(x - w, x + w, t - h + j + 1, j < 1 ? '#3e4a44' : '#25302f');
  }
}
// the bank behind the street: grass in the evening, darker low down
seed = 9;
const bank = ridge(
  [
    [0, 150],
    [60, 146],
    [120, 150],
    [180, 147],
    [240, 151],
    [300, 146],
    [384, 149],
  ],
  1
);
for (let x = 0; x < W; x++)
  for (let y = bank[x]; y < G.street; y++) {
    const t = (y - bank[x]) / (G.street - bank[x]);
    land.set(x, y, y === bank[x] ? '#5d7449' : dith(x, y, t * 0.8) ? '#344a2e' : '#3f5636');
  }
// the street: packed earth with pebbles, a shadow along the back
for (let y = G.street; y < G.front; y++)
  for (let x = 0; x < W; x++) {
    let c = y === G.street ? '#6a4c38' : y === G.street + 1 ? '#86634a' : '#a07a58';
    if (y > G.street + 1 && rand() < 0.06) c = rand() < 0.5 ? '#8a6648' : '#bb9670';
    if (y === G.front - 1) c = '#7c5c44';
    land.set(x, y, c);
  }
// the meadow in front: grass that darkens towards the bottom, tufts
for (let y = G.front; y < H; y++)
  for (let x = 0; x < W; x++) {
    const t = (y - G.front) / (H - G.front);
    let c = dith(x, y, t * 0.9) ? '#3b5530' : '#476638';
    if (y === G.front) c = '#5f8044';
    land.set(x, y, c);
  }
for (let i = 0; i < 160; i++) {
  const x = ri(0, W - 1),
    y = ri(G.front + 2, H - 2);
  land.set(x, y, '#628a47');
  land.set(x - 1, y + 1, '#628a47');
  land.set(x + 1, y + 1, '#628a47');
}
// ---- the buildings ----
const bricks = (x0, y0, x1, y1, base, mortar, h) => {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const row = Math.floor((y - y0) / (h || 3)),
        joint = (y - y0) % (h || 3) === (h || 3) - 1 || (x - x0 + (row % 2) * 3) % 6 === 0;
      land.set(x, y, joint ? mortar : base);
    }
};
// the Token Mine: a rock outcrop with a timbered way in, rails out of it and a cart heaped with glowing tokens
seed = 21;
const rockPts = [
  [0, 116],
  [8, 112],
  [20, 110],
  [32, 114],
  [42, 122],
  [50, 134],
  [56, 148],
  [60, 164],
  [62, 172],
  [0, 172],
];
land.poly(rockPts, '#584e66');
for (let y = 108; y < G.street; y++) {
  let xr = -1;
  for (let x = 0; x < 70; x++) if (land.get(x, y)[0] === 0x58 && land.get(x, y)[2] === 0x66) xr = x;
  for (let x = 0; x <= xr; x++) {
    const v = land.get(x, y);
    if (!(v[0] === 0x58 && v[2] === 0x66)) continue;
    let c = '#584e66';
    if (xr - x < 3) c = '#7d7290';
    else if (xr - x < 6 && dith(x, y, 0.5)) c = '#6a6080';
    else if (x < 14 && dith(x, y, 0.4)) c = '#4a4158';
    if (rand() < 0.05) c = '#41394f';
    land.set(x, y, c);
  }
}
for (let i = 0; i < 9; i++) {
  // cracks
  let x = ri(4, 50),
    y = ri(118, 166);
  for (let k = 0; k < ri(3, 6); k++) {
    land.set(x, y, '#3a3346');
    x += ri(-1, 1);
    y += 1;
  }
}
for (let x = 2; x < 44; x += ri(2, 5)) {
  // grass on top
  let y = 0;
  while (y < G.street && !(land.get(x, y)[3] && land.get(x, y)[2] < 0xb0 && land.get(x, y)[0] < 0x90 && y > 100)) y++;
  land.set(x, y - 1, '#5d7449');
  land.set(x, y, '#4a6338');
  if (rand() < 0.5) land.set(x + 1, y - 1, '#5d7449');
}
// boulders in the rock face: a lighter top right (the sun is that way), a dark rim low left
const inRock = (x, y) => {
  const v = land.get(x, y);
  return !!v && v[3] && v[0] >= 0x41 && v[0] <= 0x7d && v[2] >= 0x4f && v[2] <= 0x90 && v[1] < 0x80;
};
for (const [cx, cy, rx, ry] of [
  [14, 124, 6, 4],
  [30, 120, 7, 4],
  [42, 132, 5, 4],
  [24, 136, 8, 5],
  [8, 142, 6, 5],
  [46, 146, 5, 4],
  [36, 150, 6, 4],
  [52, 158, 4, 4],
  [40, 160, 4, 3],
]) {
  for (let y = cy - ry; y <= cy + ry; y++)
    for (let x = cx - rx; x <= cx + rx; x++) {
      const d = Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2);
      if (d > 1 || !inRock(x, y)) continue;
      const tr = x - cx - (y - cy) > rx * 0.5;
      land.set(x, y, d > 0.72 ? (x - cx + (y - cy) > 0 ? '#3e3650' : '#6a6080') : tr ? '#776d8c' : '#605670');
    }
}
// a sign by the way in: a token, a spark like the one on Claude's tokens
land.rect(44, 141, 2, 12, '#5e3a25');
land.rect(39, 136, 12, 7, '#8e5c3b');
land.hline(39, 50, 136, '#a8744c');
land.hline(39, 50, 142, '#5e3a25');
for (const [dx, dy] of [
  [0, 0],
  [-1, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [0, -2],
  [0, 2],
  [-2, 0],
  [2, 0],
])
  land.set(45 + dx, 139 + dy, '#ff9a3c');
land.set(45, 139, '#ffd35a');
// the way in: dark, under a timber frame, a lantern hanging from it
land.poly(
  [
    [9, 172],
    [9, 155],
    [12, 151],
    [17, 149],
    [22, 151],
    [25, 155],
    [25, 172],
  ],
  '#120c14'
);
land.poly(
  [
    [11, 172],
    [11, 156],
    [14, 153],
    [17, 152],
    [20, 153],
    [23, 156],
    [23, 172],
  ],
  '#0a070c'
);
land.rect(7, 150, 3, 22, '#7a4a30');
land.rect(25, 150, 3, 22, '#7a4a30');
land.vline(7, 150, 171, '#5e3a25');
land.vline(25, 150, 171, '#5e3a25');
land.rect(5, 147, 25, 3, '#8e5c3b');
land.hline(5, 29, 149, '#5e3a25');
land.vline(17, 150, 151, '#3a3040');
land.rect(16, 152, 3, 4, '#3a3040');
land.rect(17, 153, 1, 2, '#ffd35a');
// rails out along the street, and the cart
for (let x = 10; x <= 66; x += 4) land.vline(x, 175, 180, '#5e3a25');
land.hline(12, 66, 176, '#a49eb4');
land.hline(12, 66, 179, '#a49eb4');
land.hline(12, 66, 177, '#625c72');
land.hline(12, 66, 180, '#625c72');
land.poly(
  [
    [30, 165],
    [47, 165],
    [45, 175],
    [32, 175],
  ],
  '#6e6478'
);
land.hline(30, 47, 165, '#8a8098');
land.hline(32, 45, 174, '#4a4256');
for (const x of [33, 38, 43]) land.set(x, 169, '#4a4256');
for (const [x, y] of [
  [33, 162],
  [35, 161],
  [38, 160],
  [41, 161],
  [43, 162],
  [36, 163],
  [40, 163],
  [44, 164],
  [32, 164],
  [38, 162],
]) {
  land.rect(x, y, 2, 2, '#ff9a3c');
  land.set(x, y, '#ffd35a');
}
land.set(38, 159, '#fff2b8');
land.disc(34.5, 176.5, 2, '#2a2230');
land.disc(42.5, 176.5, 2, '#2a2230');
land.set(34, 176, '#625c72');
land.set(42, 176, '#625c72');

// the Code Forge: an open smithy with a glowing furnace, a chimney and the anvil out front
const F0 = G.forge[0],
  F1 = G.forge[1];
bricks(F0 + 2, 141, F1 - 2, 167, '#3d2329', '#2a171c');
land.rect(F0, 167, F1 - F0 + 1, 5, '#6e6478');
land.hline(F0, F1, 167, '#8a8098');
land.poly(
  [
    [F0 - 5, 142],
    [101, 127],
    [F1 + 5, 142],
  ],
  '#4a4460'
);
for (let y = 129; y < 142; y += 3)
  for (let x = F0 - 6; x <= F1 + 6; x++) if (land.get(x, y)[0] === 0x4a && land.get(x, y)[1] === 0x44) land.set(x, y, '#3a3550');
for (let y = 127; y < 142; y++)
  for (let x = 101; x <= F1 + 5; x++) if (land.get(x, y)[0] === 0x4a && land.get(x, y)[1] === 0x44) land.set(x, y, '#5c5478');
land.line(F0 - 5, 142, 101, 127, '#2c2840');
land.line(101, 127, F1 + 5, 142, '#7a6f9a');
land.hline(F0 - 5, F1 + 5, 142, '#2c2840');
land.rect(F0, 142, 2, 25, '#6a4028');
land.rect(F1 - 1, 142, 2, 25, '#6a4028');
bricks(82, 114, 89, 140, '#8a4a3a', '#6a3428');
land.rect(81, 112, 10, 2, '#5a3028');
// the furnace, its mouth aglow
land.poly(
  [
    [80, 167],
    [80, 152],
    [84, 148],
    [93, 148],
    [97, 152],
    [97, 167],
  ],
  '#5d5468'
);
land.poly(
  [
    [84, 166],
    [84, 157],
    [86, 155],
    [91, 155],
    [93, 157],
    [93, 166],
  ],
  '#ff7a2a'
);
land.rect(86, 159, 6, 7, '#ffb444');
land.rect(87, 161, 4, 5, '#ffe08a');
land.hline(80, 97, 152, '#7b7186');
// tools on the back wall
land.vline(106, 153, 161, '#8e5c3b');
land.rect(104, 152, 5, 2, '#a49eb4');
land.vline(111, 154, 162, '#8e5c3b');
land.rect(110, 153, 3, 2, '#a49eb4');
land.line(114, 153, 117, 162, '#625c72');
land.line(117, 153, 114, 162, '#625c72');
land.hline(102, 120, 163, '#6a4028');
// its sign under the eaves: </>
land.vline(101, 143, 144, '#3a2418');
land.vline(111, 143, 144, '#3a2418');
land.rect(98, 145, 17, 7, '#8e5c3b');
land.hline(98, 114, 145, '#a8744c');
land.hline(98, 114, 151, '#5e3a25');
for (const [x, y] of [
  [102, 148],
  [103, 147],
  [103, 149],
  [104, 146],
  [104, 150],
  [107, 150],
  [108, 149],
  [108, 148],
  [109, 147],
  [109, 146],
  [113, 148],
  [112, 147],
  [112, 149],
  [111, 146],
  [111, 150],
])
  land.set(x - 1, y, '#f6efe4');
// the anvil: its top 4 px above the street, from the smith's feet + 11; dark iron with a bright face and a horn
const A = G.anvil;
land.hline(A - 1, A + 7, 168, '#d2cbe0');
land.hline(A + 8, A + 10, 168, '#a49eb4');
land.set(A + 11, 168, '#8a8098');
land.hline(A - 1, A + 9, 169, '#4a4458');
land.hline(A + 1, A + 5, 170, '#2e2a3a');
land.hline(A, A + 6, 171, '#2e2a3a');
land.hline(A - 2, A + 8, 172, '#3a2418');
// a lamp post between the forge and the house
land.rect(G.lamp, 146, 2, 26, '#3a3040');
land.rect(G.lamp - 1, 170, 4, 2, '#3a3040');
land.rect(G.lamp - 2, 139, 6, 7, '#2b2433');
land.rect(G.lamp - 1, 140, 4, 5, '#ffd27a');
land.rect(G.lamp, 141, 2, 3, '#fff0c0');
land.hline(G.lamp - 3, G.lamp + 4, 138, '#2b2433');

// the Clawds' house, open at the front like a doll's house: the office and the game room below, the study and the bedroom above,
// a ladder between the floors, a terracotta roof
const X0 = G.house[0],
  X1 = G.house[1],
  U = G.upper,
  L = G.ladder;
// walls of the four rooms
const room = (x0, y0, x1, y1, a, b, f) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) land.set(x, y, f(x, y) ? b : a);
};
room(X0 + 3, 151, L - 3, G.street - 1, '#dcc49e', '#cfb48a', (x, y) => (x - X0) % 5 === 0);
room(L + 3, 151, X1 - 3, G.street - 1, '#a998c6', '#9c8aba', (x, y) => (x + y) % 6 === 0);
room(X0 + 3, 126, L - 3, U - 1, '#c9a47c', '#bd966c', (x, y) => y % 4 === 0 && x % 2 === 0);
room(L + 3, 126, X1 - 3, U - 1, '#a3b6d2', '#b8c8e0', (x, y) => x % 7 === 3 && y % 6 === 2);
// wainscot in the office, skirting elsewhere
land.rect(X0 + 3, 165, L - X0 - 5, 6, '#a0704a');
land.hline(X0 + 3, L - 3, 165, '#b88660');
land.hline(L + 3, X1 - 3, 170, '#6a4028');
land.hline(X0 + 3, L - 3, U - 1, '#6a4028');
land.hline(L + 3, X1 - 3, U - 1, '#6a4028');
// the frame: outer walls, the floor between the storeys, the ceiling, the middle wall with doorways
land.rect(X0, 124, 3, 48, '#6a4028');
land.rect(X1 - 2, 124, 3, 48, '#6a4028');
land.vline(X0, 124, 171, '#4a2c1c');
land.vline(X1, 124, 171, '#4a2c1c');
land.rect(X0, U, X1 - X0 + 1, 3, '#8e5c3b');
land.hline(X0, X1, U + 2, '#5e3a25');
land.rect(X0, 122, X1 - X0 + 1, 3, '#6a4028');
land.rect(L - 2, 126, 5, 9, '#6a4028');
land.rect(L - 2, 151, 5, 7, '#6a4028');
// floors
land.hline(X0 + 3, X1 - 3, G.street - 1, '#8e5c3b');
land.hline(X0, X1, G.street, '#5e3a25');
// the ladder through a hatch in the upper floor
land.rect(L - 2, U, 5, 3, '#3a2418');
for (const x of [L - 2, L + 2]) land.vline(x, U - 4, G.street - 1, '#a8744c');
for (let y = U - 2; y < G.street; y += 3) land.hline(L - 1, L + 1, y, '#8e5c3b');
// the office: a terminal on the wall, a desk with a front panel, a plant
land.rect(144, 152, 13, 9, '#3a3040');
land.rect(145, 153, 11, 7, '#1d1a26');
land.rect(G.desk[0], 164, G.desk[1] - G.desk[0] + 1, 2, '#a8744c');
land.rect(G.desk[0] + 1, 166, G.desk[1] - G.desk[0] - 1, 5, '#6a4028');
land.hline(G.desk[0] + 1, G.desk[1] - 1, 168, '#5e3a25');
land.rect(178, 166, 5, 5, '#b55e42');
land.hline(178, 182, 166, '#d97757');
for (const [x, y] of [
  [178, 163],
  [180, 161],
  [182, 163],
  [179, 164],
  [181, 164],
  [180, 163],
  [177, 162],
  [183, 162],
  [180, 159],
])
  land.set(x, y, '#5a9a4a');
// the game room: a TV on a low cabinet, a rug, posters
land.rect(220, 164, 15, 7, '#6a4028');
land.hline(220, 234, 164, '#8e5c3b');
land.rect(222, 153, 12, 10, '#2a2230');
land.rect(223, 154, 10, 6, '#0f380f');
land.rect(227, 162, 2, 2, '#2a2230');
land.rect(194, 170, 26, 1, '#c26a7a');
land.rect(196, 154, 7, 9, '#f2c94c');
land.rect(197, 155, 5, 7, '#ff9a3c');
land.rect(206, 153, 6, 8, '#74c46c');
land.rect(207, 154, 4, 3, '#9fe6f2');
// the study: shelves of books, a lamp, a rug
land.rect(142, 127, 15, 20, '#5e3a25');
seed = 31;
for (let sy = 128; sy < 146; sy += 6) {
  for (let x = 143; x < 156; x++) {
    const h = ri(3, 5);
    land.vline(x, sy + 5 - h, sy + 4, ['#c4623f', '#5a9be6', '#74c46c', '#ffd35a', '#8b67d8', '#e9dfd0', '#d4527a'][ri(0, 6)]);
  }
  land.hline(142, 156, sy + 5, '#8e5c3b');
}
land.vline(182, 132, 146, '#3a3040');
land.rect(180, 129, 5, 3, '#ffd27a');
land.hline(179, 185, 128, '#c4623f');
land.rect(162, U - 1, 16, 1, '#5a8a9a');
// the bedroom: a window on the night, the bed (its blanket the same as the sleeper's), a little plush Clawd on a shelf
land.rect(194, 129, 11, 10, '#5e3a25');
land.rect(195, 130, 9, 8, '#1f1b44');
land.set(197, 132, '#f6efe4');
land.set(201, 134, '#a796c6');
land.hline(195, 203, 134, '#5e3a25');
land.vline(199, 130, 137, '#5e3a25');
const bed = [208, 236];
land.rect(bed[1] - 2, 134, 3, 14, '#6a4028');
land.rect(bed[0], 145, bed[1] - bed[0], 3, '#5e3a25');
land.rect(bed[0], 144, bed[1] - bed[0] - 2, 1, '#e9dfd0');
land.rect(bed[1] - 8, 137, 6, 3, '#f6efe4');
spr(blanket, {}).d && land.draw(spr(blanket), bed[0], 140);
land.rect(212, 130, 10, 1, '#6a4028');
land.draw(spr(['.LLLL.', 'BEBBEB', '.SSSS.']), 214, 127);
// the roof: terracotta tiles in rows, lit on the right slope, a round attic window and a chimney
const peak = [189, 99];
land.poly([[X0 - 7, 124], peak, [X1 + 7, 124]], '#c4623f');
for (let y = peak[1]; y < 124; y++)
  for (let x = X0 - 8; x <= X1 + 8; x++) {
    const v = land.get(x, y);
    if (!(v && v[0] === 0xc4 && v[1] === 0x62)) continue;
    const row = (y - peak[1]) % 3,
      right = x > peak[0];
    let c = right ? '#d06a45' : '#b5593a';
    if (row === 2) c = right ? '#a8502f' : '#934528';
    else if (row === 1 && (x + Math.floor((y - peak[1]) / 3) * 2) % 4 === 0) c = right ? '#bb5c3a' : '#a24e33';
    land.set(x, y, c);
  }
land.line(X0 - 7, 124, peak[0], peak[1], '#7a3a26');
land.line(peak[0], peak[1], X1 + 7, 124, '#e98a5e');
land.hline(X0 - 8, X1 + 8, 124, '#4a2c1c');
land.hline(X0 - 8, X1 + 8, 125, '#5e3a25');
land.disc(189, 114, 3.5, '#5e3a25');
land.disc(189, 114, 2.5, '#ffd27a');
land.hline(187, 191, 114, '#5e3a25');
land.vline(189, 112, 116, '#5e3a25');
bricks(219, 101, 226, 113, '#8a4a3a', '#6a3428');
land.rect(218, 99, 10, 2, '#5a3028');

// a big tree between the house and the tower
const tree = (cx, by, top, blobs) => {
  land.rect(cx - 2, top + 20, 5, by - top - 20, '#5e3a25');
  land.vline(cx - 2, top + 20, by - 1, '#4a2c1c');
  land.vline(cx + 2, top + 20, by - 1, '#7a4a30');
  for (const [x, y, r, c] of blobs) land.disc(cx + x, top + y, r, c);
};
tree(262, G.street, 104, [
  [-14, 22, 9, '#2c4630'],
  [12, 22, 10, '#2c4630'],
  [0, 14, 12, '#35553a'],
  [-8, 10, 8, '#3d6242'],
  [8, 8, 8, '#3d6242'],
  [12, 16, 6, '#4a7448'],
  [3, 4, 5, '#4a7448'],
  [15, 11, 3, '#6a8a4c'],
  [-13, 20, 4, '#3d6242'],
]);

// the wizard's tower: round, lit from the right, a hat for a roof, a balcony on the left and the lab's door below
const T0 = G.tower[0],
  T1 = G.tower[1];
for (let y = 118; y < G.street; y++)
  for (let x = T0; x <= T1; x++) {
    const t = (x - T0) / (T1 - T0),
      row = Math.floor((y - 118) / 4),
      joint = (y - 118) % 4 === 3 || (x + (row % 2) * 3) % 7 === 0;
    let c = t < 0.15 ? '#463e52' : t < 0.6 ? '#615872' : t < 0.88 ? '#7c7290' : '#9a8fae';
    if (joint) c = t < 0.15 ? '#3a3346' : t < 0.6 ? '#4f475f' : t < 0.88 ? '#665d78' : '#7f7594';
    land.set(x, y, c);
  }
land.poly(
  [
    [T0 - 4, 119],
    [298, 92],
    [T1 + 4, 119],
  ],
  '#4a3a8a'
);
for (let y = 92; y < 120; y++)
  for (let x = T0 - 5; x <= T1 + 5; x++) {
    const v = land.get(x, y);
    if (!(v && v[0] === 0x4a && v[1] === 0x3a)) continue;
    land.set(x, y, x > 298 + (y - 92) * 0.15 ? '#6b55b8' : '#4a3a8a');
  }
land.hline(T0 - 4, T1 + 4, 119, '#2e2458');
land.hline(T0 - 3, T1 + 3, 118, '#f2c94c');
land.line(T0 - 4, 119, 298, 92, '#352a6a');
land.line(298, 92, T1 + 4, 119, '#8d78d8');
for (const [x, y] of [
  [293, 108],
  [303, 112],
  [297, 101],
]) {
  land.set(x, y, '#f2c94c');
  land.set(x + 1, y, '#f2c94c');
}
land.rect(296, 124, 5, 8, '#2a2240');
land.rect(297, 125, 3, 6, '#ffd27a');
land.set(298, 124, '#2a2240');
// the balcony and its ladder
land.rect(268, G.balcony, 17, 2, '#8e5c3b');
land.hline(268, 284, G.balcony + 2, '#5e3a25');
land.hline(268, 284, G.balcony - 5, '#6a4028');
for (let x = 268; x <= 284; x += 3) land.vline(x, G.balcony - 4, G.balcony - 1, '#6a4028');
land.line(270, G.balcony + 3, 275, G.balcony + 8, '#5e3a25');
for (const x of [G.towerLadder - 2, G.towerLadder + 2]) land.vline(x, G.balcony + 2, G.street - 1, '#a8744c');
for (let y = G.balcony + 4; y < G.street; y += 3) land.hline(G.towerLadder - 1, G.towerLadder + 1, y, '#8e5c3b');
// the lab: a door with a warm light, a bench of flasks beside it
land.poly(
  [
    [292, 172],
    [292, 159],
    [294, 156],
    [298, 155],
    [302, 156],
    [304, 159],
    [304, 172],
  ],
  '#3a2a30'
);
land.poly(
  [
    [293, 172],
    [293, 160],
    [295, 157],
    [298, 156],
    [301, 157],
    [303, 160],
    [303, 172],
  ],
  '#f0b060'
);
land.rect(294, 163, 9, 9, '#e09a50');
land.rect(306, 165, 11, 2, '#8e5c3b');
land.vline(307, 167, 171, '#5e3a25');
land.vline(315, 167, 171, '#5e3a25');

// the campfire in front: a ring of stones, logs to sit on either side
const FX = G.fire[0],
  FY = G.fire[1];
for (const [x, y] of [
  [FX - 8, FY],
  [FX - 6, FY + 2],
  [FX - 2, FY + 3],
  [FX + 2, FY + 3],
  [FX + 6, FY + 2],
  [FX + 8, FY],
]) {
  land.rect(x - 1, y - 1, 3, 2, '#7b7186');
  land.set(x - 1, y, '#5d5468');
}
land.line(FX - 5, FY, FX + 4, FY - 2, '#6a4028');
land.line(FX - 4, FY - 2, FX + 5, FY, '#5e3a25');
for (const sx of [FX - 21, FX + 11]) {
  land.rect(sx, FY - 1, 11, 3, '#8e5c3b');
  land.hline(sx, sx + 10, FY - 1, '#a8744c');
  land.hline(sx, sx + 10, FY + 1, '#5e3a25');
  land.rect(sx + (sx < FX ? 0 : 9), FY - 1, 2, 3, '#d6b07c');
}

// the pond: the sun on the water, a sandy shore, lily pads, and a pier out over it
const P0 = 316;
for (let y = 176; y < H; y++)
  for (let x = P0; x < W; x++) {
    const edge = P0 + 10 - Math.round((y - 176) * 0.55) + Math.round(Math.sin(y * 0.7) * 1.2);
    if (x < edge - 3) continue;
    if (x < edge) {
      land.set(x, y, x === edge - 1 ? '#8a7356' : '#c9a77a');
      continue;
    }
    const t = (y - 176) / (H - 176);
    let c = dith(x, y, t) ? '#27385c' : '#30456c';
    if (y === 176) c = '#a8835a';
    else if (y === 177) c = '#56719a';
    else if ((x * 13 + y * 7) % 29 === 0) c = '#4f6f98';
    land.set(x, y, c);
  }
// the sun's path: broken streaks under the sun, wider and further apart nearer us
seed = 61;
for (let y = 179; y < H; y += ri(1, 2)) {
  const t = (y - 179) / (H - 179),
    w = Math.round(2 + t * 9 + rand() * 3),
    x0 = Math.round(G.sun[0] - w / 2 + (rand() - 0.5) * (2 + t * 6));
  if (rand() < 0.25) continue;
  for (let x = x0; x < x0 + w; x++) {
    const v = land.get(x, y);
    if (!v || v[0] > 0x60) continue;
    const mid = Math.abs(x - (x0 + w / 2)) < w / 4;
    land.set(x, y, mid && t < 0.6 ? '#ffd9a0' : mid ? '#f8b878' : '#e8905e');
  }
}
for (const [x, y, r] of [
  [370, 196, 3],
  [330, 206, 2.5],
  [378, 210, 2],
]) {
  land.disc(x, y, r, '#3f7a4a');
  land.set(x + Math.round(r), y, '#2a4166');
  land.set(x - 1, y - 1, '#5a9a5a');
}
land.rect(369, 194, 2, 2, '#ff86a6');
land.set(369, 194, '#ffd0dc');
// the pier
const [PR0, PR1, PRY] = G.pier;
for (const x of [PR0 + 8, PR0 + 22, PR1 - 3]) land.rect(x, PRY + 2, 2, 9, '#4a2c1c');
land.rect(PR0, PRY - 1, PR1 - PR0 + 1, 3, '#a8744c');
for (let x = PR0; x <= PR1; x++) land.set(x, PRY + 1, x % 4 === 0 ? '#5e3a25' : '#7a4a30');
land.hline(PR0, PR1, PRY - 1, '#c48e5e');

// the stage for the little choir, with bunting
const [S0, S1, SY] = G.stage;
land.rect(S0, SY, S1 - S0 + 1, 2, '#b07a4c');
land.rect(S0, SY + 2, S1 - S0 + 1, 6, '#6a4028');
for (let x = S0; x <= S1; x += 6) land.vline(x, SY + 2, SY + 7, '#5e3a25');
land.hline(S0, S1, SY + 7, '#4a2c1c');
for (const x of [S0, S1]) land.rect(x, SY - 22, 2, 22, '#6a4028');
for (let x = S0 + 2; x < S1; x++) {
  const y = SY - 21 + Math.round(Math.sin(((x - S0) / (S1 - S0)) * Math.PI) * 5);
  land.set(x, y, '#3a2a22');
  if ((x - S0) % 6 === 3) {
    const c = ['#d97757', '#f2c94c', '#9fe6f2', '#ff86a6'][Math.floor((x - S0) / 6) % 4];
    land.set(x, y + 1, c);
    land.set(x - 1, y + 1, c);
    land.set(x + 1, y + 1, c);
    land.set(x, y + 2, c);
  }
}
// the burrow: a sandy patch with a hole
seed = 41;
for (let y = 194; y < 206; y++)
  for (let x = 12; x < 48; x++) {
    if (Math.pow((x - 29) / 17, 2) + Math.pow((y - 200) / 5.5, 2) > 1) continue;
    land.set(x, y, rand() < 0.12 ? '#b4925f' : '#cfae7d');
  }
land.rect(27, 199, 5, 2, '#3a2a22');
land.hline(26, 32, 198, '#a8835a');
// the garden bed by the pond, flowers along it
land.rect(286, 203, 30, 4, '#5a3a2a');
for (let x = 287; x < 316; x += 3) land.set(x, 204, '#3e281c');
for (const [x, c] of [
  [300, '#e2493b'],
  [303, '#f2c94c'],
  [306, '#ff86a6'],
  [309, '#e2493b'],
  [312, '#f2c94c'],
  [315, '#8b67d8'],
]) {
  land.vline(x, 198, 203, '#4f8a3f');
  land.set(x - 1, 200, '#4f8a3f');
  land.rect(x - 1, 196, 3, 2, c);
  land.set(x, 195, c);
}
// flowers all over the meadow
seed = 51;
for (let i = 0; i < 120; i++) {
  const x = ri(2, 314),
    y = ri(G.front + 3, H - 4);
  if (x > 10 && x < 50 && y > 192 && y < 207) continue;
  if (x > S0 - 2 && x < S1 + 2 && y < SY + 9) continue;
  const c = ['#ff86a6', '#f6efe4', '#ffd35a', '#b49be8', '#ff9a3c', '#f6efe4'][ri(0, 5)];
  land.set(x, y, c);
  if (rand() < 0.4) {
    land.set(x, y + 1, '#3f6a34');
    land.set(x - 1, y, c);
  }
}
// ---- the sheet: every sprite a strip of its frames side by side, the strips packed in rows ----
const SHEET = [];
function sprite(name, frames, o) {
  o = o || {};
  const pics = frames.map(f => (f instanceof Pic ? f : spr(f, o.pal)));
  const w = Math.max(...pics.map(p => p.w)),
    h = Math.max(...pics.map(p => p.h));
  // frames of other sizes: aligned at the bottom left
  const fr = pics.map(p => {
    if (p.w === w && p.h === h) return p;
    const q = new Pic(w, h);
    q.draw(p, 0, h - p.h);
    return q;
  });
  SHEET.push({ name, fr, w, h, ax: o.ax === undefined ? Math.floor(w / 2) : o.ax, ay: o.ay === undefined ? h : o.ay });
}
sprite('stand', STAND, { ax: 8 });
sprite('walk', WALK, { ax: 8 });
sprite('climb', CLIMB, { ax: 8 });
sprite('wave', WAVE, { ax: 8 });
sprite('read', READ, { ax: 8 });
sprite('type', TYPE, { ax: 8 });
sprite('game', GAME, { ax: 8 });
sprite('hammer', HAMMER, { ax: 10 });
sprite('pick', PICK, { ax: 10 });
sprite('nap', NAP, { ax: 16 });
sprite('roast', ROAST, { ax: 8 });
sprite('brew', BREW, { ax: 8 });
sprite('wizard', WIZARD, { ax: 8 });
sprite('conduct', CONDUCT, { ax: 8 });
sprite('fish', FISH, { ax: 8, ay: 12 });
sprite('dance', DANCE, { ax: 8 });
sprite('water', WATER, { ax: 8 });
sprite('dig', DIG, { ax: 8 });
sprite('pop', POP, { ax: 8 });
sprite('fire', FIRE, { pal: firePal });
sprite('heart', [HEART]);
sprite('note', [NOTE]);
sprite('zz', [ZZ]);
sprite('sparkle', SPARKLE);
sprite('bubble', BUBBLE);
sprite('ember', EMBER);
sprite('smoke', SMOKE, { pal: smokePal });
sprite('glint', GLINT);
sprite('reeds', REEDS);
sprite('flag', FLAG, { ax: 0 });
sprite('tv', TV, { pal: gbPal });
sprite('term', TERM, { pal: termPal });
sprite('choir', CHOIR);
sprite('minis', MINIS);
sprite('swim', SWIM);
sprite('fishjump', FISHJ);
sprite('firefly', FIREFLY);
sprite('star', STAR);
sprite('star2', STAR2);
sprite('shoot', SHOOT);
sprite('cloud-a', CLOUDA);
sprite('cloud-b', CLOUDB);
sprite('cloud-c', CLOUDC);
sprite('bird', BIRD);
sprite('balloon', BALLOON);
sprite('butterfly', BUTTERFLY);
sprite('flasks', FLASKS);
sprite('lamp-glow', GLOW(9, '#ffd27a'));
sprite('forge-glow', GLOW(8, '#ff8a3a'));
sprite('emitter', DOT);
// the tops of the roof, the tower and the tree, cut from the land: props over the clouds that drift behind them
const cut = (x, y, w, h) => {
  const p = new Pic(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.set(i, j, land.get(x + i, y + j));
  return [p];
};
const OCC = { roof: [130, 97, 119, 27], 'tower-top': [278, 90, 39, 33], 'tree-top': [238, 100, 52, 23] };
for (const k in OCC) sprite(k, cut(...OCC[k]), { ax: 0, ay: 0 });

function pack(maxW) {
  const order = SHEET.slice().sort((a, b) => b.h - a.h);
  let x = 0,
    y = 0,
    rowH = 0,
    width = 0;
  for (const s of order) {
    const sw = s.w * s.fr.length;
    if (x && x + sw > maxW) {
      y += rowH + 1;
      x = 0;
      rowH = 0;
    }
    s.x = x;
    s.y = y;
    x += sw + 1;
    rowH = Math.max(rowH, s.h);
    width = Math.max(width, x);
  }
  const p = new Pic(width, y + rowH);
  for (const s of SHEET) s.fr.forEach((f, i) => p.draw(f, s.x + i * s.w, s.y));
  return p;
}
const atlas = pack(256);
const sprites = {};
for (const s of SHEET) sprites[s.name] = [s.x, s.y, s.w, s.h, s.fr.length, s.ax, s.ay];

function contact(dir) {
  // every strip at 5x on a dark ground, one under the other
  const k = 5,
    gapY = 4;
  let h = 0,
    w = 0;
  for (const s of SHEET) {
    h += (s.h + gapY) * k;
    w = Math.max(w, s.fr.length * (s.w + 3) * k);
  }
  const p = new Pic(w + 20, h + 20);
  p.rect(0, 0, p.w, p.h, '#3a3045');
  let y = 10;
  for (const s of SHEET) {
    s.fr.forEach((f, i) => {
      const sc = f.scaled(k),
        x0 = 10 + i * (s.w + 3) * k;
      p.rect(x0, y, s.w * k, s.h * k, '#4a405a');
      p.draw(sc, x0, y);
    });
    y += (s.h + gapY) * k;
  }
  fs.writeFileSync(path.join(dir, 'contact.png'), png(p, false));
}
// ---- the theme's world: where the Clawds go and what they do there, the props and what drifts by, in screen pixels ----
const S = v => Math.round(v * PX),
  at = (x, y) => [S(x), S(y)];
const upstairs = at(G.ladder, G.street);
const spots = [
  { x: S(G.smith), y: S(G.street), act: 'hammer', face: 1, fps: 5, time: [8, 16] },
  { x: S(166), y: S(G.street), act: 'type', fps: 4, time: [10, 20] },
  { x: S(168), y: S(G.upper), act: 'read', fps: 2, via: upstairs, time: [10, 22] },
  {
    x: S(276),
    y: S(G.balcony),
    act: 'wizard',
    face: -1,
    fps: 4,
    via: at(G.towerLadder, G.street),
    time: [8, 16],
    fx: { s: 'sparkle', kind: 'pop', every: 0.6, dx: S(14), dy: -S(15) },
  },
  { x: S(344), y: S(G.pier[2]), act: 'fish', face: 1, fps: 2, time: [14, 30] },
  {
    x: S(162),
    y: S(203),
    n: 2,
    gap: S(18),
    act: 'dance',
    fps: 5,
    time: [8, 16],
    fx: { s: 'heart', kind: 'rise', every: 1.4, dx: 0, dy: -S(15) },
  },
  { x: S(80), y: S(G.stage[2]), act: 'conduct', face: 1, fps: 3, time: [10, 20] },
  { x: S(G.fire[0]), y: S(G.fire[1] - 1), n: 2, gap: S(30), act: 'roast', fps: 0.8, time: [12, 24] },
  { x: S(206), y: S(G.street), n: 2, gap: S(12), act: 'game', face: 1, fps: 3, time: [10, 22] },
  {
    x: S(299),
    y: S(G.street),
    act: 'brew',
    face: 1,
    fps: 3,
    time: [8, 16],
    fx: { s: 'bubble', kind: 'rise', every: 1.1, dx: S(9), dy: -S(12) },
  },
  {
    x: S(224),
    y: S(G.upper),
    act: 'nap',
    fps: 1,
    via: upstairs,
    time: [12, 26],
    fx: { s: 'zz', kind: 'rise', every: 2.2, dx: S(4), dy: -S(12) },
  },
  { x: S(70), y: S(175), act: 'pick', face: -1, fps: 5, time: [6, 12] },
  { x: S(285), y: S(204), act: 'water', face: 1, fps: 5, time: [8, 14] },
  { x: S(G.mine), y: S(G.street), inside: true, time: [8, 20] },
  { x: S(29), y: S(201), inside: true, act: 'dig', back: 'pop', fps: 8, time: [10, 30] },
  { x: S(-20), y: S(181), inside: true, time: [8, 24], w: 0.6 },
  { x: S(124), y: S(181), time: [3, 7], w: 0.6 },
];
const prop = (s, x, y, o) => Object.assign({ s, x: S(x), y: S(y) }, o || {});
const props = [
  ...Object.keys(OCC).map(k => prop(k, OCC[k][0], OCC[k][1])),
  prop('fire', G.fire[0], G.fire[1], { fps: 8, front: true, fx: { s: 'ember', kind: 'rise', every: 0.45, dx: 0, dy: -S(12) } }),
  prop('forge-glow', 88.5, 170, { pulse: 1.4 }),
  prop('lamp-glow', 131, 152, { pulse: 3.2 }),
  prop('term', 151, 159, { fps: 1.6 }),
  prop('tv', 228, 160, { fps: 3 }),
  prop('flasks', 311, 165, { fps: 3 }),
  prop('choir', 106, G.stage[2], { fps: 3, fx: { s: 'note', kind: 'rise', every: 1.5, dx: 0, dy: -S(8) } }),
  prop('minis', 214, 206, { fps: 4, fx: { s: 'heart', kind: 'rise', every: 3.2, dx: 0, dy: -S(9) } }),
  prop('reeds', 372, 178, { fps: 1.5 }),
  prop('reeds', 383, 181, { fps: 1.2 }),
  prop('glint', 344, 186, { fps: 4 }),
  prop('glint', 342, 194, { fps: 3 }),
  prop('glint', 347, 202, { fps: 5 }),
  prop('glint', 343, 210, { fps: 3.5 }),
  prop('swim', 366, 205, { fps: 2, bob: 1 }),
  prop('fishjump', 377, 197, { fps: 8, rest: 9 }),
  prop('butterfly', 184, 195, { fps: 6, bob: 2 }),
  prop('butterfly', 306, 193, { fps: 5, bob: 2 }),
  ...[
    [118, 186, 2.6],
    [240, 182, 3.2],
    [322, 169, 2.2],
    [60, 188, 3.6],
    [196, 186, 2.9],
    [354, 191, 2.4],
  ].map(f => prop('firefly', f[0], f[1], { pulse: f[2], bob: 1 })),
  ...[
    [226, 10, 3],
    [120, 44, 2.4],
    [300, 38, 3.8],
    [58, 72, 2.8],
    [356, 76, 3.3],
    [252, 60, 2.2],
  ].map(f => prop('star2', f[0], f[1], { pulse: f[2] })),
  prop('shoot', 140, 40, { fps: 12, rest: 35 }),
  prop('emitter', 85.5, 111, { fx: { s: 'smoke', kind: 'float', every: 1.7, dx: 0, dy: 0 } }),
  prop('emitter', 222.5, 98, { fx: { s: 'smoke', kind: 'float', every: 2.3, dx: 0, dy: 0 } }),
  prop('emitter', 38, 163, { fx: { s: 'sparkle', kind: 'pop', every: 1.8, dx: 0, dy: 0 } }),
];
const drift = [
  { s: 'cloud-c', y: S(109), speed: 7, dir: 1 },
  { s: 'cloud-a', y: S(103), speed: 9, dir: -1 },
  { s: 'cloud-b', y: S(98), speed: 6, dir: 1 },
  { s: 'balloon', y: S(110), speed: 11, dir: -1, bob: 2 },
  { s: 'bird', y: S(99), speed: 38, dir: -1, fps: 5, bob: 1 },
  { s: 'bird', y: S(104), speed: 33, dir: 1, fps: 6, bob: 1 },
];
const world = {
  file: 'clawd.png',
  px: PX,
  sprites,
  crew: { count: 8, speed: 70, stand: 'stand', walk: 'walk', climb: 'climb', wave: 'wave', lane: [S(181), S(-30), S(314)] },
  spots,
  props,
  drift,
};
// JSON as the other themes write it (one space), but a list of numbers and a little object on one line
function fmt(v, ind) {
  const pad = ' '.repeat(ind);
  if (Array.isArray(v)) {
    if (v.every(x => typeof x !== 'object')) return JSON.stringify(v).replace(/,/g, ', ');
    return '[\n' + v.map(x => pad + ' ' + fmt(x, ind + 1)).join(',\n') + '\n' + pad + ']';
  }
  if (v && typeof v === 'object') {
    const ks = Object.keys(v),
      flat = JSON.stringify(v);
    if (ind >= 3 && flat.length < 160) return flat.replace(/":/g, '": ').replace(/,"/g, ', "');
    return '{\n' + ks.map(k => pad + ' ' + JSON.stringify(k) + ': ' + fmt(v[k], ind + 1)).join(',\n') + '\n' + pad + '}';
  }
  return JSON.stringify(v);
}
if (require.main === module) {
  const bg = new Pic(W, H);
  bg.draw(sky, 0, 0);
  bg.draw(land, 0, 0);
  fs.writeFileSync(path.join(OUT, 'world.png'), png(bg.scaled(PX), false));
  fs.writeFileSync(path.join(OUT, 'clawd.png'), png(atlas, true));
  const tf = path.join(OUT, 'theme.json'),
    t = JSON.parse(fs.readFileSync(tf, 'utf8'));
  t.effects = Object.assign(t.effects || {}, { wallpaper: 'world.png' });
  delete t.mascot;
  t.world = world;
  fs.writeFileSync(tf, fmt(t, 0) + '\n');
  const i = process.argv.indexOf('--sheet');
  if (i > 0) contact(process.argv[i + 1]);
  console.log(
    'world.png, clawd.png (' + atlas.w + ' x ' + atlas.h + ', ' + Object.keys(sprites).length + ' sprites) and theme.json written'
  );
}
