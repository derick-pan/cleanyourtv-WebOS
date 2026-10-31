// More life in Clawd World (tools/clawd-world): the crew's names in bubbles, ducks and a frog on the pond, the moon in its phase of
// the day, a shed built over the week and a tree that grows through the month, a snowman, grey clouds and puddles for days of
// weather, and the rare ones: a dragon, a golden Clawd, a comet, the northern lights, balloons.
'use strict';
const { Pic, PAL } = require('./pic');
const K = require('./clawd');

// ---- names: a small pixel font, in a bubble like the others (its tail at the bottom left) ----
// prettier-ignore
const FONT = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  E: ['###', '#..', '##.', '#..', '###'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'], M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '.#.'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
};
function nameBubble(text) {
  const glyphs = text.split('').map(c => FONT[c]),
    tw = glyphs.reduce((n, g) => n + g[0].length + 1, -1),
    w = tw + 4,
    p = new Pic(w, 9);
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < w; x++) {
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === 6);
      if (corner) continue;
      p.set(x, y, x === 0 || y === 0 || x === w - 1 || y === 6 ? PAL.w : PAL.W);
    }
  p.set(2, 7, PAL.w);
  p.set(3, 7, PAL.w);
  p.set(2, 8, PAL.w);
  let x0 = 2;
  for (const g of glyphs) {
    g.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '#') p.set(x0 + i, 1 + j, PAL.k);
    });
    x0 += g[0].length + 1;
  }
  return [p];
}

// ---- the pond: a duck paddling (its head green, a white ring), bobbing; diving, tail up; and a frog on a lily pad that hops ----
const DK = { g: '#2e7d4f', y: '#f2c94c', b: '#8a5a3c', w: '#f6efe4', s: '#c9c3b8', t: '#6b6660', r: '#7d9cc6' };
// prettier-ignore
const DUCK = [
  ['......gg..', '.....ggyy.', '.....ww...', 'sssbbbb...', 'tssssbb...', '.ssssss...', 'rr.rr.rrr.'],
  ['......gg..', '.....ggyy.', '.....ww...', 'sssbbbb...', 'tssssbb...', '.ssssss...', '.rr.rr.rr.'],
];
// prettier-ignore
const DUCK_SWIM = [
  ['......gg..', '.....ggyy.', '.....ww...', 'sssbbbb...', 'tssssbb...', '.ssssss...', 'r..r..rr..'],
  ['..........', '......gg..', '.....ggyy.', 'sssswwb...', 'tssssbb...', '.ssssss...', '.r..r..rr.'],
];
// prettier-ignore
const DUCK_DIVE = [
  ['..........', '......gg..', '.....ggyy.', 'sssbbbb...', 'tssssbb...', '.ssssss...', 'rr.rr.rrr.'],
  ['..........', '..........', '..t.......', '.tss......', '.sssbb....', 'rsssbbrr..', '.rrrrr....'],
  ['..........', '..........', '..........', '..t.......', '.tss......', 'rssssrr...', '.rrrrr....'],
  ['..........', '..........', '..........', '..........', '..........', '.r.r.r....', 'r.r.r.r...'],
  ['..........', '......gg..', '.....ggyy.', 'sssbbbb...', 'tssssbb...', '.ssssss...', 'r.r.r.rr..'],
];
const FR = { g: '#4cb363', d: '#2e7a3b', e: '#1e120f', y: '#e6d27a', w: '#ffffff' };
// prettier-ignore
const FROG = [
  ['..........', '..........', '..........', '.ew..ew...', '.gggggg...', 'dgggggggd.', 'dd.gg..dd.'],
  ['..........', '..........', '..........', '.ew..ew...', '.gggggg...', 'dggyyyggd.', 'dd.gg..dd.'],
];
// prettier-ignore
const FROG_HOP = [
  ['..........', '..........', '..........', '..........', '.ew..ew...', 'dgggggggd.', 'dd.gg..dd.'],
  ['..........', '.ew..ew...', '.gggggg...', 'dgggggggd.', '.d.gg..d..', '..........', '..........'],
  ['.ew..ew...', '.gggggg...', 'dgggggggd.', '.d.....d..', '..........', '..........', '..........'],
  ['..........', '.ew..ew...', '.gggggg...', 'dgggggggd.', '.d.gg..d..', '..........', '..........'],
  ['..........', '..........', '..........', '.ew..ew...', '.gggggg...', 'dgggggggd.', 'dd.gg..dd.'],
];

// ---- the moon in each of its eight phases (new, waxing crescent, first quarter, ... waning crescent), lit on the right while it
// waxes; a soft halo as bright as it is lit. And its glow, for a prop that breathes round it ----
function moonPhase(k, n) {
  const R = 7,
    S = 12,
    p = new Pic(2 * S + 1, 2 * S + 1),
    f = k / n,
    c = Math.cos(2 * Math.PI * f),
    lit = (1 - c) / 2;
  for (let y = -S; y <= S; y++)
    for (let x = -S; x <= S; x++) {
      const d = Math.hypot(x, y);
      if (d <= R + 0.5) {
        const half = Math.sqrt(Math.max(0, R * R - y * y)) || 1,
          u = x / half,
          on = f < 0.5 ? u > c : u < -c;
        if (on) p.set(S + x, S + y, d > R - 1.2 ? '#f6e9cc' : '#fff7e4');
      } else if (d <= 12 && lit > 0.05) {
        const nr = (d <= 12) + (d <= 10) + (d <= 8),
          a = Math.round(255 * (1 - Math.pow(1 - (14 * lit) / 255, nr))),
          i = ((S + y) * p.w + S + x) * 4;
        p.d[i] = 246;
        p.d[i + 1] = 233;
        p.d[i + 2] = 204;
        p.d[i + 3] = a;
      }
    }
  return p;
}
const MOON = [0, 1, 2, 3, 4, 5, 6, 7].map(k => moonPhase(k, 8));
function moonGlow(k, n, r) {
  const p = new Pic(2 * r + 1, 2 * r + 1),
    lit = (1 - Math.cos((2 * Math.PI * k) / n)) / 2;
  for (let y = 0; y <= 2 * r; y++)
    for (let x = 0; x <= 2 * r; x++) {
      const d = Math.hypot(x - r, y - r) / r;
      if (d < 0.45 || d > 1) continue;
      const i = (y * p.w + x) * 4;
      p.d[i] = 246;
      p.d[i + 1] = 233;
      p.d[i + 2] = 204;
      p.d[i + 3] = Math.round((d < 0.7 ? 0.1 : 0.05) * 255 * lit);
    }
  return p;
}
const MOON_GLOW = [0, 1, 2, 3, 4, 5, 6, 7].map(k => moonGlow(k, 8, 13));

// ---- a shed built over the week, Monday to Sunday: stakes and planks, the floor and posts, the frame, walls half up, the walls, the
// roof, and on Sunday the door, a window and a flag ----
const SH = { w: '#a8744c', W: '#c48e5e', d: '#5e3a25', r: '#c4623f', R: '#e98a5e', g: '#9fe6f2', f: '#d97757', s: '#d6b07c', k: '#3a2a22' };
function shed(day) {
  const p = new Pic(14, 16),
    put = (x, y, c) => p.set(x, y, SH[c]);
  const base = 15;
  if (day === 0) {
    for (const x of [1, 12]) for (let y = 11; y <= base; y++) put(x, y, 'd');
    for (let x = 4; x < 11; x++) {
      put(x, base, 'w');
      put(x + 1, base - 1, 'W');
    }
    return p;
  }
  for (let x = 0; x < 14; x++) put(x, base, 'd');
  const top = day >= 2 ? 6 : 11;
  for (const x of day >= 2 ? [1, 12] : [1, 12]) for (let y = top; y < base; y++) put(x, y, 'd');
  if (day >= 2) for (let x = 1; x <= 12; x++) put(x, top, 'd');
  if (day >= 3) {
    const wall = day >= 4 ? top + 1 : 10;
    for (let y = wall; y < base; y++) for (let x = 2; x <= 11; x++) put(x, y, (y - wall) % 3 === 2 ? 'W' : 'w');
  }
  if (day >= 5)
    for (let j = 0; j < 5; j++)
      for (let x = j - 1; x <= 14 - j; x++) {
        if (x < 0 || x > 13) continue;
        put(x, top - 1 - j, j === 4 || x === j - 1 || x === 14 - j ? 'R' : 'r');
      }
  if (day >= 6) {
    for (let y = 10; y < base; y++) for (let x = 3; x <= 5; x++) put(x, y, 'k');
    put(5, 12, 's');
    for (let y = 9; y <= 11; y++) for (let x = 8; x <= 10; x++) put(x, y, y === 9 || x === 8 ? 'd' : 'g');
    for (let y = 0; y < 3; y++) put(6, top - 6 - y, 'd');
    put(7, top - 8, 'f');
    put(8, top - 8, 'f');
    put(7, top - 7, 'f');
  }
  return p;
}
const SHED = [0, 1, 2, 3, 4, 5, 6].map(shed);

// ---- a tree that grows through the month: a mound with a seed, a sprout, two leaves, a sapling, a young tree, and a tree in fruit ----
const TR = { b: '#6b4a2e', B: '#8a5a3c', g: '#4cb363', G: '#2e8b57', l: '#74c46c', m: '#a8835a', r: '#e5484d' };
function tree(stage) {
  const p = new Pic(15, 20),
    put = (x, y, c) => p.set(x, y, TR[c]),
    foot = 19;
  for (let x = 4; x <= 10; x++) put(x, foot, 'm');
  for (let x = 5; x <= 9; x++) put(x, foot - 1, 'm');
  if (stage === 0) {
    put(7, foot - 2, 'B');
    return p;
  }
  const h = [0, 3, 5, 9, 13, 16][stage];
  for (let y = foot - 1 - h; y < foot - 1; y++) put(7, y, stage >= 3 ? 'b' : 'g');
  if (stage === 1) put(8, foot - 4, 'l');
  if (stage === 2) {
    put(6, foot - 6, 'l');
    put(8, foot - 6, 'l');
    put(5, foot - 6, 'g');
    put(9, foot - 6, 'g');
  }
  if (stage >= 3) {
    const r = [0, 0, 0, 3, 5, 6][stage],
      cy = foot - 1 - h + 1;
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y * 1.3 <= r * r + 1) put(7 + x, cy + y, x + y < -1 ? 'l' : (x * 7 + y * 3) % 5 === 0 ? 'G' : 'g');
    if (stage === 5)
      for (const [x, y] of [
        [-3, 1],
        [2, -2],
        [4, 2],
        [-1, 3],
        [0, -4],
      ])
        put(7 + x, cy + y, 'r');
  }
  return p;
}
const SAPLING = [0, 1, 2, 3, 4, 5].map(tree);

// ---- a snowman in winter, his scarf blowing ----
// prettier-ignore
const SNOWMAN = [
  ['...kkk...', '...kkk...', '..kkkkk..', '..WWWWW..', '.WWkWkWW.', '.WWWoWWW.', '..WWWWW..', '.rrrrrrr.', '..WrWWWW.',
   '.WWWWWWW.', 'WWWWkWWWW', 'WWWWWWWWW', 'WWWWkWWWW', '.WWWWWWW.', '..wwwww..'],
  ['...kkk...', '...kkk...', '..kkkkk..', '..WWWWW..', '.WWkWkWW.', '.WWWoWWW.', '..WWWWW..', '.rrrrrrrr', '..WWrWWW.',
   '.WWWWWWW.', 'WWWWkWWWW', 'WWWWWWWWW', 'WWWWkWWWW', '.WWWWWWW.', '..wwwww..'],
];
const snowPal = { k: '#2a2a2a', W: '#f4f8fc', w: '#cdd8e4', o: '#f08a24', r: '#e5484d' };

// ---- days of weather: grey clouds; a puddle on the street, rings spreading in it ----
// prettier-ignore
const PUDDLE = [
  ['..aaaaaa..', '.abbbbbba.', 'abbbbbbbba', '.abbbbbba.'],
  ['..aaaaaa..', '.abbcbbba.', 'abbbbbbbba', '.abbbbbba.'],
  ['..aaaaaa..', '.abcbcbba.', 'abbbcbbbba', '.abbbbbba.'],
  ['..aaaaaa..', '.acbbbcba.', 'abbbbbbbba', '.abcbbbba.'],
];
const puddlePal = { a: '#8a7a6a', b: '#6f86a6', c: '#b9d0e8' };

// ---- the rare ones ----
// a dragon, friendly, flapping across the sky at dusk (its wing up, level, down, level), a puff of smoke now and then
function dragon(k) {
  const p = new Pic(34, 18),
    G = '#3fa37a',
    g = '#2d7a5a',
    b = '#f2c94c',
    e = '#1e120f',
    w = '#7fd1a8';
  // the wing first, so the body is over it when it beats down
  const tipY = [1, 4, 15, 4][k],
    tipX = 16,
    y0 = 8,
    steps = Math.abs(tipY - y0);
  for (let j = 0; j <= steps; j++) {
    const y = y0 + (tipY < y0 ? -j : j),
      t = j / Math.max(1, steps),
      xa = Math.round(12 + (tipX - 12) * t),
      xb = Math.round(21 + (tipX - 21) * t);
    for (let x = xa; x <= xb; x++) p.set(x, y, x === xa || x === xb || j === steps ? g : w);
  }
  // the body and the tail, waving a little
  for (let x = 4; x < 24; x++) {
    const y = 9 + Math.round(Math.sin((x - 4) * 0.35 + k) * 0.8);
    p.set(x, y, G);
    p.set(x, y + 1, x > 8 && x < 22 ? b : G);
    if (x > 9 && x < 21) p.set(x, y - 1, G);
  }
  for (let x = 0; x < 5; x++) p.set(x, 8 + Math.round(Math.sin(x * 0.7 + k) * 1.2), g);
  p.set(0, 7, G);
  // the head, a horn, an eye
  for (let y = 6; y <= 10; y++) for (let x = 24; x <= 29; x++) if (!(y === 6 && x > 27)) p.set(x, y, G);
  p.set(30, 9, G);
  p.set(31, 9, G);
  p.set(27, 7, e);
  p.set(25, 5, b);
  p.set(26, 4, b);
  if (k === 2) {
    p.set(33, 8, '#cdbfa8');
    p.set(32, 7, '#e8e0d0');
  }
  return p;
}
const DRAGON = [0, 1, 2, 3].map(dragon);
// a golden Clawd walking along the street, sparkling
function golden() {
  const gold = { '#d97757': '#f2c14e', '#ee9a78': '#ffe9a0', '#b4553a': '#c99a2e' },
    frames = K.strip('walk', null, 1).map(f => K.crop(f, K.bbox(K.strip('walk', null, 1))));
  return frames.map((f, k) => {
    const p = new Pic(f.w + 4, f.h + 3);
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++) {
        const v = f.get(x, y);
        if (!v[3]) continue;
        const hex =
          '#' +
          v
            .slice(0, 3)
            .map(c => ('0' + c.toString(16)).slice(-2))
            .join('');
        p.set(x + 2, y + 3, gold[hex.toLowerCase()] || hex);
      }
    for (const [x, y] of [
      [
        [0, 1],
        [p.w - 2, 4],
      ],
      [
        [1, 6],
        [p.w - 1, 0],
      ],
      [
        [0, 3],
        [p.w - 1, 7],
      ],
      [
        [2, 0],
        [p.w - 3, 5],
      ],
    ][k % 4])
      p.set(x, y, '#fff7d0');
    return p;
  });
}
const GOLDEN = golden();
// a comet, its tail flickering
// prettier-ignore
const COMET = [
  ['.............................WY', '.....................zzZZZWWYYW', '...........zzzZZZZWWWWWWYY.....', 'zzzZZZZZZWW....................'],
  ['.............................WY', '...................zzzZZZZWWYYW', '.........zzzzZZZZZWWWWWWYY.....', '..zzzZZZZWW....................'],
];
// the northern lights: curtains of green and teal, bright at their foot, fading up, swaying
function aurora(k) {
  const W = 220,
    H = 34,
    p = new Pic(W, H);
  for (let x = 0; x < W; x++) {
    const foot = 26 + Math.round(Math.sin(x * 0.045 + k * 0.9) * 4 + Math.sin(x * 0.13 + k) * 1.5),
      tall = 14 + Math.round(Math.sin(x * 0.08 + k * 1.3) * 6);
    for (let y = foot - tall; y <= foot; y++) {
      if (y < 0 || y >= H) continue;
      const t = (foot - y) / tall,
        a = Math.round((1 - t) * 120 * (0.6 + 0.4 * Math.sin(x * 0.21 + k * 2))),
        i = (y * W + x) * 4;
      if (a < 10) continue;
      const c = t < 0.25 ? [120, 240, 170] : t < 0.6 ? [70, 210, 160] : [90, 160, 220];
      p.d[i] = c[0];
      p.d[i + 1] = c[1];
      p.d[i + 2] = c[2];
      p.d[i + 3] = a;
    }
  }
  return p;
}
const AURORA = [0, 1, 2].map(aurora);
// a wisp of mist (a morning of fog): a long thin band, thickest in the middle, frayed towards its ends, in steps of alpha
function mist(w, h, k) {
  const p = new Pic(w, h);
  for (let x = 0; x < w; x++) {
    const end = Math.min(1, x / (w * 0.3), (w - 1 - x) / (w * 0.3)),
      mid = (h - 1) / 2 + Math.sin(x * 0.07 + k) * 0.8,
      half = (h / 2) * (0.5 + 0.5 * end) * (0.85 + 0.15 * Math.sin(x * 0.19 + k * 2));
    for (let y = 0; y < h; y++) {
      const t = Math.abs(y - mid) / half,
        a = t < 1 ? Math.min(255, Math.round(((1 - t * t) * end * 150) / 16) * 16) : 0,
        i = (y * w + x) * 4;
      if (a < 16) continue;
      p.d[i] = 232;
      p.d[i + 1] = 236;
      p.d[i + 2] = 242;
      p.d[i + 3] = a;
    }
  }
  return p;
}
const MIST = [
  [160, 8, 1],
  [120, 6, 3],
  [190, 9, 5],
].map(([w, h, k]) => mist(w, h, k));

module.exports = {
  nameBubble,
  DUCK,
  DUCK_SWIM,
  DUCK_DIVE,
  DK,
  FROG,
  FROG_HOP,
  FR,
  MOON,
  MOON_GLOW,
  SHED,
  SAPLING,
  SNOWMAN,
  snowPal,
  PUDDLE,
  puddlePal,
  DRAGON,
  GOLDEN,
  COMET,
  AURORA,
  MIST,
};
