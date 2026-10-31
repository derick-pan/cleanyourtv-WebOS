// The wind and the night sky of Clawd World (tools/clawd-world): what grows sways as a gust goes by (the garden's flowers, tufts of
// grass, flowers of the meadow, the reeds, the stage's bunting, the lily pads), the flag on the house flutters, the pond ripples, a
// petal is carried away, and stars flare now and then. Each swaying thing has a still picture and the frames of a gust going over it
// (from the left: it leans right, back past upright, and stands still again on its first picture).
'use strict';
const { Pic, PAL } = require('./pic');

// how far a gust leans the tops, frame by frame
const GUSTS = [1, 2, 3, 2, 1, 0, -1, 0];

// a plant: stems from the bottom row up, each {x, h, c, base: the colour low down, k: how much it gives, leaf: at that height, head:
// [[dx, dy, colour]] around its top}, drawn leaning `lean` px at the top and less further down
function plant(w, h, stems, lean) {
  const p = new Pic(w, h);
  for (const s of stems) {
    const at = j => s.x + Math.round(lean * (s.k || 1) * Math.pow(j / s.h, 1.5));
    for (let j = 0; j < s.h; j++) p.set(at(j), h - 1 - j, j < 2 && s.base ? s.base : s.c);
    if (s.leaf) p.set(at(s.leaf) - 1, h - 1 - s.leaf, s.c);
    for (const [dx, dy, c] of s.head || []) p.set(at(s.h) + dx, h - 1 - s.h + dy, c);
  }
  return p;
}
// its still picture and the frames of a gust
const swaying = (w, h, stems) => ({ still: [plant(w, h, stems, 0)], gust: GUSTS.map(l => plant(w, h, stems, l)) });

// the garden bed by the pond: six flowers on a row (the bed itself is in the backdrop)
const STEM = '#4f8a3f';
const flower = (x, c, k) => ({
  x,
  h: 6,
  c: STEM,
  k,
  leaf: 3,
  head: [
    [-1, 0, c],
    [0, 0, c],
    [1, 0, c],
    [-1, -1, c],
    [0, -1, c],
    [1, -1, c],
    [0, -2, c],
  ],
});
const GARDEN = swaying(
  23,
  9,
  [
    ['#e2493b', 1],
    ['#f2c94c', 0.8],
    ['#ff86a6', 1.1],
    ['#e2493b', 0.9],
    ['#f2c94c', 1],
    ['#8b67d8', 0.85],
  ].map(([c, k], i) => flower(3 + i * 3, c, k))
);

// tufts of tall grass
const G1 = '#5f8044',
  G2 = '#74a050',
  G3 = '#86b45c',
  G0 = '#476638';
const blades = l => l.map(([x, h, c, k]) => ({ x: x + 2, h, c, base: G0, k: k || 1.3 }));
const TUFTS = [
  blades([
    [0, 4, G1],
    [1, 6, G2],
    [2, 5, G1],
    [3, 7, G3, 1.5],
    [4, 4, G1],
  ]),
  blades([
    [0, 5, G2],
    [1, 3, G1],
    [2, 7, G3, 1.5],
    [3, 5, G2],
    [4, 6, G1, 1.4],
    [5, 3, G1],
  ]),
  blades([
    [0, 6, G1],
    [2, 8, G2, 1.6],
    [3, 5, G1],
    [5, 7, G3, 1.4],
  ]),
].map(b => swaying(11, 9, b));

// flowers of the meadow on tall stems: a daisy, a poppy, a bluebell nodding
const W = PAL.W,
  Y = PAL.Y;
const BLOOMS = [
  [
    {
      x: 3,
      h: 7,
      c: STEM,
      leaf: 3,
      head: [
        [-1, 0, W],
        [1, 0, W],
        [0, -1, W],
        [0, 1, W],
        [0, 0, Y],
      ],
    },
  ],
  [
    {
      x: 3,
      h: 8,
      c: STEM,
      leaf: 4,
      head: [
        [-1, 0, '#e2493b'],
        [0, 0, '#2a1a15'],
        [1, 0, '#e2493b'],
        [-1, -1, '#ff6a5a'],
        [0, -1, '#e2493b'],
        [1, -1, '#e2493b'],
      ],
    },
  ],
  [
    {
      x: 3,
      h: 7,
      c: STEM,
      leaf: 2,
      head: [
        [1, 0, STEM],
        [1, 1, '#8b67d8'],
        [2, 1, '#b49be8'],
        [1, 2, '#8b67d8'],
      ],
    },
  ],
].map(b => swaying(9, 10, b));

// the reeds at the pond's edge: three stalks with brown heads, their tops sway a little all the time and bend in a gust
function reed(leans) {
  const p = new Pic(11, 14);
  [
    [1, 2],
    [4, 0],
    [7, 3],
  ].forEach(([x, top], i) => {
    const L = leans[i],
      at = y => x + Math.round(L * Math.pow((13 - y) / (13 - top), 1.5));
    ['h', 'H', 'H', 'h'].forEach((c, j) => p.set(at(top + j), top + j, PAL[c]));
    for (let y = top + 4; y < 14; y++) p.set(at(y), y, y < top + 7 && L ? PAL.N : PAL.n);
  });
  ['n.N..n.N..', 'NnnNnNnnNn'].forEach((r, j) => {
    for (let x = 0; x < r.length; x++) if (r[x] !== '.') p.set(x, 12 + j, PAL[r[x]]);
  });
  return p;
}
const REEDS = {
  still: [
    [0, 1, 0],
    [1, 0, 1],
    [0, -1, 0],
  ].map(reed),
  gust: [
    [1, 1, 1],
    [2, 2, 1],
    [3, 2, 2],
    [2, 3, 2],
    [1, 2, 1],
    [0, 1, 0],
    [-1, 0, -1],
    [0, 1, 0],
  ].map(reed),
};

// the flag on the peak of the house's roof: a pennant in the Clawd's orange on a short pole, waving a little, streaming out in a gust
function flag(phase, amp) {
  const p = new Pic(9, 7);
  for (let y = 0; y < 7; y++) p.set(0, y, '#3a2a22');
  p.set(0, 0, '#f2c94c');
  for (let c = 1; c <= 7; c++) {
    const mid = 2 + Math.round(amp * Math.sin(phase + c * 0.9)) * (c > 1 ? 1 : 0),
      half = c <= 2 ? 1 : c <= 4 ? 0.5 : 0;
    for (let y = Math.round(mid - half); y <= Math.round(mid + half); y++)
      p.set(c, y, c === 7 ? '#b55e42' : y === Math.round(mid - half) ? '#ec9a74' : '#d97757');
  }
  return p;
}
const FLAG = { still: [0, 2.1, 4.2].map(ph => flag(ph, 0.6)), gust: [0, 1, 2, 3, 4, 5, 6, 7].map(k => flag(k * 0.8, 1)) };

// the bunting over the stage, between its posts: a string sagging between them, little flags hanging from it; in a gust it lifts and
// the flags fly out
const BUNT = ['#d97757', '#f2c94c', '#9fe6f2', '#ff86a6'];
function bunting(sag, fly) {
  const p = new Pic(61, 12);
  for (let x = 2; x < 60; x++) {
    const y = 1 + Math.round(Math.sin((x / 60) * Math.PI) * sag);
    p.set(x, y, '#3a2a22');
    if (x % 6 === 3) {
      const c = BUNT[Math.floor(x / 6) % 4];
      p.set(x - 1, y + 1, c);
      p.set(x, y + 1, c);
      p.set(x + 1, y + 1, c);
      p.set(x + fly, y + 2, c);
    }
  }
  return p;
}
const BUNTING = {
  still: [bunting(5, 0)],
  gust: [
    [5, 1],
    [4, 1],
    [3, 1],
    [3, 1],
    [4, 1],
    [5, 0],
    [6, 0],
    [5, 0],
  ].map(([s, f]) => bunting(s, f)),
};

// lily pads on the pond, one with a flower; a gust sets them drifting a pixel and back
function pad(r, bloom, dx) {
  const n = Math.ceil(r),
    p = new Pic(2 * n + 3, 2 * n + 3),
    cx = n + 1 + dx,
    cy = n + 2;
  p.disc(cx, cy, r, '#3f7a4a');
  p.set(cx + Math.round(r), cy, '#2a4166');
  p.set(cx - 1, cy - 1, '#5a9a5a');
  if (bloom) {
    p.rect(cx - 1, cy - 2, 2, 2, '#ff86a6');
    p.set(cx - 1, cy - 2, '#ffd0dc');
  }
  return p;
}
const PADS = [
  [3, true],
  [2.5, false],
  [2, false],
].map(([r, b]) => ({ still: [pad(r, b, 0)], gust: [0, 1, 1, 1, 0, 0, 0, 0].map(d => pad(r, b, d)) }));

// a ring spreading on the water where something touched it
// prettier-ignore
const RIPPLE = [
  ['.........', '....a....', '.........'],
  ['....a....', '...a.a...', '....a....'],
  ['...aaa...', '..a...a..', '...aaa...'],
  ['..bbbbb..', '.b.....b.', '..bbbbb..'],
  ['.ccccccc.', 'c.......c', '.ccccccc.'],
];
const ripplePal = { a: '#7d9cc6', b: '#5f7fac', c: '#4b6994' };

// a petal the wind carries off, turning over
// prettier-ignore
const BLOSSOM = [['P.', '.W'], ['.P', 'W.'], ['W.', '.P'], ['.W', 'P.']];

// a star that flares now and then: brighter, a little cross of light, and back
const tw = (c, a1, a2) => {
  const p = new Pic(5, 5);
  if (a2)
    for (const [x, y] of [
      [0, 2],
      [4, 2],
      [2, 0],
      [2, 4],
    ])
      p.set(x, y, a2);
  if (a1)
    for (const [x, y] of [
      [1, 2],
      [3, 2],
      [2, 1],
      [2, 3],
    ])
      p.set(x, y, a1);
  p.set(2, 2, c);
  return p;
};
const TWINKLE = [
  tw('#a796c6'),
  tw('#f6efe4'),
  tw('#ffffff', '#c9b8f0'),
  tw('#ffffff', '#f6efe4', '#8f7cc0'),
  tw('#ffffff', '#c9b8f0'),
  tw('#f6efe4'),
  tw('#a796c6'),
];

// the moon's glow: a soft ring around it that swells and fades (the middle is left clear, so the crescent stays crisp)
function moonGlow(r) {
  const p = new Pic(2 * r + 1, 2 * r + 1);
  for (let y = 0; y <= 2 * r; y++)
    for (let x = 0; x <= 2 * r; x++) {
      const d = Math.hypot(x - r, y - r) / r;
      if (d < 0.45 || d > 1) continue;
      const a = d < 0.7 ? 0.1 : 0.05,
        i = (y * p.w + x) * 4;
      p.d[i] = 246;
      p.d[i + 1] = 233;
      p.d[i + 2] = 204;
      p.d[i + 3] = Math.round(a * 255);
    }
  return [p];
}

module.exports = { GUSTS, plant, GARDEN, TUFTS, BLOOMS, REEDS, FLAG, BUNTING, PADS, RIPPLE, ripplePal, BLOSSOM, TWINKLE, moonGlow };
