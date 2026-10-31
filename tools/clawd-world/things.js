// The things of Clawd World (tools/clawd-world): props that play in place, game equipment that keeps time with its players, speech
// bubbles, particles, the little ones of the meadow and the pals, what crosses the sky, the weather and the decorations of the year.
// The game room's equipment, the pals, the sparrow, the deer and the saucer are redrawn after clawd-sidekick by Tunai (MIT); the
// meadow's little ones and the bubbles after claude-clawd by Kien Hoang Trung (MIT). See THIRD-PARTY.md.
'use strict';
const { Pic, rgba, dith, over, down } = require('./pic');
const K = require('./clawd');
const C = K.C;

// ---- the house's furniture that moves (positions are in the backdrop: place.js) ----
// the workshop's monitor: lines of code scrolling up, after clawd-sidekick
const MONITOR = [];
for (let t = 0; t < 16; t += 2) {
  const p = new Pic(10, 6);
  p.rect(0, 0, 10, 6, '#14201B');
  const lengths = [6, 3, 8, 5, 2, 7, 4, 9],
    cols = ['#6EE7A0', '#FFFFFF', '#A98BF5', '#6EE7A0'];
  for (let row = 0; row < 3; row++) {
    const n = (row + t / 2) % 8;
    p.rect(1 + (n % 2), row * 2, lengths[n], 1, cols[n % 4]);
  }
  MONITOR.push(p);
}
// the server room's terminal: a prompt, two lines and a blinking cursor
const TERMINAL = [0, 1].map(on => {
  const p = new Pic(10, 6);
  p.rect(0, 0, 10, 6, '#14201B');
  p.rect(1, 1, 6, 1, '#6EE7A0');
  p.rect(1, 3, 4, 1, '#6EE7A0');
  p.set(1, 5, '#6EE7A0');
  if (on) p.rect(3, 5, 2, 1, '#6EE7A0');
  return p;
});
// the rack's lights blinking: five slots of three
const hash = n => {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
};
const LEDS = [];
for (let f = 0; f < 8; f++) {
  const p = new Pic(5, 13);
  for (let slot = 0; slot < 5; slot++)
    for (let led = 0; led < 3; led++)
      p.set(led * 2, slot * 3, hash(slot * 7 + led + f * 13) % 3 ? ['#6EE7A0', '#F5C542', '#E5484D'][led] : '#8A8F98');
  LEDS.push(p);
}
// the arcade's invader, changing colour and bouncing
const INVADER = [];
for (let t = 0; t < 8; t++) {
  const p = new Pic(8, 6);
  p.rect(0, 0, 8, 6, C.dark);
  const hue = ['#6EE7A0', '#F6A5B8', '#F5C542', '#8ECDF5'][Math.floor(t / 2) % 4];
  ['.#..#.', '######', '#.##.#'].forEach((row, j) => {
    for (let i = 0; i < 6; i++) if (row[i] === '#') p.set(1 + i, 1 + j + (t % 4 < 2 ? 0 : 1), hue);
  });
  INVADER.push(p);
}
// the lookout's globe, turning
const GLOBE = [];
for (let t = 0; t < 16; t += 2) {
  const p = new Pic(7, 6);
  ['..###..', '.#####.', '#######', '#######', '.#####.', '..###..'].forEach((row, j) => {
    for (let i = 0; i < 7; i++) if (row[i] === '#') p.set(i, j, (hash(((i + t / 2) % 8) * 5 + j) & 3) === 0 ? C.green : C.blue);
  });
  GLOBE.push(p);
}
// the lookout's window at night: the moon and twinkling stars (shown from evening to morning)
const NIGHTWIN = [0, 1, 2].map(f => {
  const p = new Pic(26, 9);
  p.rect(0, 0, 26, 9, '#1E2A4A');
  p.rect(0, 0, 26, 3, '#141C33');
  p.rect(21, 1, 3, 3, '#F4E8B0');
  p.set(21, 1, '#141C33');
  p.set(21, 2, '#141C33');
  for (let i = 0; i < 7; i++) if (hash(i * 11 + f) % 3 !== 0) p.set(hash(i * 7 + 3) % 19, 1 + (hash(i * 13 + 5) % 7), '#FFFFFF');
  return p;
});
// a sparrow hopping along the lookout's sill and back, after clawd-sidekick
const SPARROW = [];
for (let k = 0; k < 48; k += 2) {
  const p = new Pic(24, 4),
    left = k >= 24,
    x = left ? 18 - Math.floor(((k - 24) * 18) / 24) : Math.floor((k * 18) / 24),
    rows = ['...b.', 'bbbbo', '.d.d.'],
    hop = k % 4 === 0 ? 0 : 1;
  rows.forEach((r, j) => {
    const line = left ? r.split('').reverse().join('') : r;
    for (let i = 0; i < 5; i++) {
      const c = { b: '#9C6238', o: C.pumpkin, d: C.dark }[line[i]];
      if (c) p.set(x + i, j + hop, c);
    }
  });
  SPARROW.push(p);
}

// ---- the game room's equipment, keeping time with the players (after clawd-sidekick) ----
// ping-pong: the table between two players 34 px apart, the ball crossing it and back in sixteen ticks
const PONG = [];
for (let k = 0; k < 16; k++) {
  const p = new Pic(22, 10);
  p.rect(1, 3, 18, 1, C.table);
  p.rect(1, 4, 18, 1, C.dark);
  p.rect(9, 0, 1, 3, C.light);
  p.rect(2, 5, 1, 5, C.dark);
  p.rect(17, 5, 1, 5, C.dark);
  p.set(1, 3, C.white);
  p.set(18, 3, C.white);
  const u = (k % 8) / 8,
    from = k < 8 ? 0 : 19,
    to = k < 8 ? 19 : 0;
  p.rect(Math.round(from + (to - from) * u), Math.round(1 - Math.sin(Math.PI * u) * 5) + 0, 2, 2, C.white);
  PONG.push(p);
}
// the jump rope between two turners 52 px apart, its middle swinging over and under the jumper
const ROPE = [];
for (let t = 0; t < 8; t++) {
  const p = new Pic(36, 20),
    mid = [6, 8, 13, 19, 24, 19, 13, 8][t] - 6;
  let last = null;
  for (let x = 0; x <= 35; x++) {
    const u = x / 35,
      y = Math.round(13 + (mid - 13) * 4 * u * (1 - u));
    if (last !== null) for (let yy = last; yy !== y; yy += Math.sign(y - last)) p.set(x, yy, C.red);
    p.set(x, y, C.red);
    last = y;
  }
  ROPE.push(p);
}
// the block tower between two builders 24 px apart: it grows, wobbles and falls, sampled every three ticks
const TOWER = [];
const BLOCKS = [C.red, C.yellow, C.blue, C.green, C.purple, C.pink];
for (let k = 0; k < 48; k += 3) {
  const p = new Pic(28, 12);
  if (k >= 42)
    [
      [1, 11],
      [6, 12],
      [14, 11],
      [20, 12],
      [9, 10],
      [24, 12],
    ].forEach(([x, y], i) => p.rect(x, y - 2, i % 2 === 0 ? 4 : 5, 2, BLOCKS[i]));
  else {
    const n = Math.min(6, Math.floor(k / 6) + 1);
    for (let i = 0; i < n; i++) p.rect(11 + (k >= 36 && i >= 3 ? (k % 2 === 0 ? -1 : 1) * (i - 2) : 0), 10 - i * 2, 6, 2, BLOCKS[i]);
  }
  TOWER.push(p);
}
// the volleyball: the net in the middle of the court and the ball between the players' hands (K.ball)
const VOLLEY = [];
for (let k = 0; k < 24; k++) {
  const p = new Pic(K.COURT + 12, 24),
    b = K.ball(k);
  const nx = 6 + K.COURT / 2;
  p.rect(nx, 9, 1, 15, C.dark);
  p.rect(nx - 1, 9, 3, 1, C.white);
  for (let y = 10; y < 15; y++) {
    p.set(nx - 1, y, y % 2 === 0 ? C.net : C.light);
    p.set(nx + 1, y, y % 2 === 1 ? C.net : C.light);
  }
  // the ball, its top-left from the middle of a player plus 6, at rows from the floor as the players see it
  const bx = 6 + b.x - 1,
    by = 24 - (24 - b.y) + 0;
  p.rect(bx, by - 2, 3, 3, C.white);
  p.set(bx + 1, by - 2, C.yellow);
  p.set(bx, by, C.blue);
  VOLLEY.push(p);
}
// a picnic cloth, red and white, with three lunch boxes; a little tea table with a pot and cake
const PICNIC = (() => {
  const p = new Pic(66, 4);
  for (let x = 0; x < 66; x++) {
    p.set(x, 3, Math.floor(x / 2) % 2 ? C.white : C.red);
    p.set(x, 2, Math.floor(x / 2) % 2 ? C.red : C.white);
  }
  for (const x of [14, 35, 56]) {
    p.rect(x, 0, 4, 2, C.dark);
    p.rect(x + 1, 0, 2, 1, C.white);
    p.set(x + 3, 0, C.yellow);
  }
  return [p];
})();
const TEA = (() => {
  const p = new Pic(9, 7);
  p.rect(0, 3, 9, 1, C.wood);
  p.rect(4, 4, 1, 3, C.wood);
  p.rect(2, 1, 3, 2, C.white);
  p.set(1, 1, C.white);
  p.set(5, 1, C.white);
  p.set(3, 0, C.white);
  p.rect(6, 2, 2, 1, C.pink);
  p.set(7, 1, C.yellow);
  return [p];
})();

// ---- speech bubbles (after claude-clawd's): a white bubble with a tail, something in it ----
const BUBBLE_ROWS = [
  '.wwwwwwwww.',
  'wWWWWWWWWWw',
  'wWWWWWWWWWw',
  'wWWWWWWWWWw',
  'wWWWWWWWWWw',
  'wWWWWWWWWWw',
  '.wwwwwwwww.',
  '..ww.......',
  '..w........',
];
const ICONS = {
  dots: [
    ['.......', '.......', '.k.....', '.......'],
    ['.......', '.......', '.k.k...', '.......'],
    ['.......', '.......', '.k.k.k.', '.......'],
  ],
  bang: [['...r...', '...r...', '...r...', '...r...'].concat([]), ['...r...', '...r...', '.......', '...r...']],
  ask: [['..rrr..', '....r..', '...r...', '...r...'].slice(0, 3).concat(['.......']), ['..rrr..', '....r..', '...r...', '.......']],
  heart: [
    ['.rr.rr.', '.rrrrr.', '..rrr..', '...r...'],
    ['.pp.pp.', '.ppppp.', '..ppp..', '...p...'],
  ],
  note: [
    ['....kk.', '....k.k', '..kkk..', '..kk...'],
    ['....kk.', '....k.k', '...kk..', '..kkk..'],
  ],
  idea: [
    ['..yyy..', '..yyy..', '..ggg..', '...g...'],
    ['.yyyyy.', '..yyy..', '..ggg..', '...g...'],
  ],
  code: [['.k...k.', 'k.g..k.', '.k.g.k.', '..k....'].map(r => r), ['.k...k.', 'k..g..k', '.k.g.k.', '.......']],
  zz: [
    ['.uuuu..', '...u...', '..u....', '.uuuu..'],
    ['.......', '..uuu..', '...u...', '..uuu..'],
  ],
  star: [
    ['...y...', '.yyyyy.', '..yyy..', '..y.y..'],
    ['...o...', '.ooooo.', '..ooo..', '..o.o..'],
  ],
  ok: [
    ['......g', '.....g.', 'g...g..', '.g.g...'],
    ['......g', '.....g.', 'g...g..', '.ggg...'],
  ],
  coffee: [
    ['..s.s..', '.rrrr..', '.rrrrr.', '.rrrr..'],
    ['...s.s.', '.rrrr..', '.rrrrr.', '.rrrr..'],
  ],
  bug: [
    ['.g...g.', '..ggg..', '.ggggg.', '..ggg..'],
    ['g.....g', '..ggg..', '.ggggg.', 'g.ggg.g'],
  ],
  music: [
    ['.kkkkk.', '.k...k.', 'kk..kk.', 'kk..kk.'],
    ['.kkkkk.', '.k...k.', 'kk..kk.', 'kk..kk.'],
  ],
  sun: [
    ['.y.y.y.', '..yyy..', '.yyyyy.', '..yyy..'],
    ['..y.y..', '.yyyyy.', 'yyyyyyy', '.yyyyy.'],
  ],
  boo: [
    ['..www..', '.wkwkw.', '.wwwww.', '.w.w.w.'],
    ['..www..', '.wkwkw.', '.wwwww.', 'w.w.w..'],
  ],
};
const ICON_PAL = { k: C.dark, r: C.red, p: C.pink, y: C.yellow, g: C.green, u: C.purple, o: C.pumpkin, s: C.light, w: '#E8E4F0' };
function bubble(icon) {
  return ICONS[icon].map(f => {
    const p = new Pic(11, 9);
    BUBBLE_ROWS.forEach((r, y) => {
      for (let x = 0; x < 11; x++) if (r[x] !== '.') p.set(x, y, r[x] === 'w' ? '#B9B4C8' : '#FFFFFF');
    });
    f.forEach((r, y) => {
      for (let x = 0; x < 7; x++) if (r[x] !== '.') p.set(2 + x, 1 + y, ICON_PAL[r[x]]);
    });
    return p;
  });
}

// ---- the little ones of the meadow (after claude-clawd's subagents), and the pals (after clawd-sidekick's) ----
const MINI = ['.hhhhhh.', '.bebbeb.', 'bbbbbbbb', '.bbbbbb.', '.ssssss.', '..l..l..'];
const MINI_BLINK = ['.hhhhhh.', '.bbbbbb.', 'bbbbbbbb', '.bebbeb.', '.ssssss.', '..l..l..'];
const MINI_PAL = { h: C.highlight, b: C.body, e: C.eye, s: C.shade, l: C.body, u: C.body };
const miniPic = rows => {
  const p = new Pic(8, rows.length);
  rows.forEach((r, y) => {
    for (let x = 0; x < 8; x++) if (r[x] !== '.') p.set(x, y, MINI_PAL[r[x]]);
  });
  return p;
};
const MINI_STAND = [0, 1, 2, 3, 4, 5, 6, 7].map(i => miniPic(i === 5 ? MINI_BLINK : MINI));
const MINI_WALK = [miniPic(MINI), miniPic(['.hhhhhh.', '.bebbeb.', 'bbbbbbbb', '.bbbbbb.', '.ssssss.', '.l....l.'])];
const MINI_CHEER = [
  miniPic(['u......u', '.hhhhhh.', '.bebbeb.', '.bbbbbb.', '.ssssss.', '..l..l..']),
  miniPic(['........', 'uhhhhhhu', '.bebbeb.', '.bbbbbb.', '.ssssss.', '..l..l..']),
];
const PAL_ART = {
  cat: {
    frames: [
      ['.....#.#', '#....#e#', '.#######', '.######.', '.#.#.#.#'],
      ['.....#.#', '#....#e#', '.#######', '.######.', '..#.#.#.'],
    ],
    key: { '#': C.gray, e: C.yellow },
  },
  owl: {
    frames: [
      ['#....#', '######', '#y##y#', '#bbbb#', '.o..o.'],
      ['......', '#....#', '######', '#y##y#', '.oooo.'],
    ],
    key: { '#': '#9C6238', b: C.beige, y: C.yellow, o: C.pumpkin },
  },
  crab: {
    frames: [
      ['.r...r.', 'rr...rr', '.rerer.', 'rrrrrrr', 'r.r.r.r'],
      ['r.....r', '.r...r.', '.rerer.', 'rrrrrrr', '.r.r.r.'],
    ],
    key: { r: C.red, e: C.eye },
  },
};
const palPics = name =>
  PAL_ART[name].frames.map(rows => {
    const p = new Pic(rows[0].length, rows.length);
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) if (PAL_ART[name].key[r[x]]) p.set(x, y, PAL_ART[name].key[r[x]]);
    });
    return p;
  });

// ---- visitors and the weather ----
// a flying saucer, its lights blinking (after clawd-sidekick's), with a beam now and then
const UFO = [0, 1].map(f => {
  const p = new Pic(17, 12);
  p.rect(6, 0, 5, 2, '#5EE6F0');
  p.rect(5, 1, 7, 1, '#9FF0F8');
  p.rect(1, 2, 15, 2, '#6B7385');
  p.rect(0, 3, 17, 1, '#4A5160');
  for (let i = 0; i < 4; i++) p.set(2 + i * 4, 3, (i + f) % 2 ? C.yellow : C.magenta);
  for (let y = 4; y < 12; y++)
    for (let x = 7 - (y - 4) / 2; x <= 9 + (y - 4) / 2; x++) if (dith(x, y, f ? 0.3 : 0.18)) p.set(x, y, [200, 255, 220, 140]);
  return p;
});
// a deer peeking out from behind a bush on the hill, then gone (after clawd-sidekick's)
const DEER = [];
for (let k = 0; k < 48; k += 3) {
  const p = new Pic(14, 12),
    off = k < 12 || k >= 36 ? 6 : k < 16 ? 16 - k + 1 : k >= 32 ? k - 31 : 0;
  if (off < 6) {
    const ears = k % 8 === 0 ? ['.a..a.', 'a....a'] : ['a....a', '.a..a.'];
    [...ears, '.hhhh.', 'hehheh', '.hhhh.', '..nn..'].forEach((r, j) => {
      for (let i = 0; i < 6; i++) {
        const c = { a: '#6B4A2E', h: '#9C6238', e: C.eye, n: C.dark }[r[i]];
        if (c && 1 + off + j < 7) p.set(4 + i, 1 + off + j, c);
      }
    });
  }
  p.rect(1, 6, 12, 1, '#22522C');
  p.rect(0, 7, 14, 5, '#2E6B3A');
  for (const x of [2, 6, 10]) p.set(x, 8, '#22522C');
  DEER.push(p);
}
// fireworks: a burst that opens, sparkles and fades (two colours)
const burst = (c1, c2) => {
  const out = [];
  for (let f = 0; f < 8; f++) {
    const p = new Pic(21, 21),
      r = [1, 3, 5, 7, 8, 9, 9, 10][f];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2,
        x = Math.round(10 + Math.cos(a) * r),
        y = Math.round(10 + Math.sin(a) * r);
      if (f < 6 || (f === 6 && i % 2) || (f === 7 && i % 3 === 0)) p.set(x, y, f < 3 ? '#FFFFFF' : i % 2 ? c1 : c2);
      if (f >= 2 && f < 6) p.set(Math.round(10 + Math.cos(a) * (r - 2)), Math.round(10 + Math.sin(a) * (r - 2)), i % 2 ? c2 : c1);
    }
    if (f === 0) p.rect(10, 10, 1, 1, '#FFFFFF');
    out.push(p);
  }
  return out;
};
// a dark rain cloud, rain, snow, leaves and petals, confetti
const RAINCLOUD = (() => {
  const p = new Pic(40, 12);
  for (const [cx, cy, rx, ry] of [
    [9, 7, 8, 4],
    [20, 5, 10, 5],
    [31, 7, 8, 4],
  ])
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 40; x++)
        if (Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2) <= 1) p.set(x, y, y > 8 ? '#3B3F55' : y > 5 ? '#55597A' : '#6E7396');
  return [p];
})();
const DROP = [[['c'], ['c'], ['C']].map(r => r[0])];
const FLAKE = [
  ['.W.', 'WWW', '.W.'],
  ['W.W', '.W.', 'W.W'],
];
const LEAF = [
  ['oo.', '.yo'],
  ['.o.', 'oyo'],
];
const PETAL = [
  ['pp', '.p'],
  ['p.', 'pp'],
];
const CONFETTI = [
  ['r', 'y'],
  ['b', 'g'],
];
const BAT = [
  ['k.....k', 'kk.k.kk', '.kkkkk.', '..k.k..'],
  ['.......', '..kkk..', 'kkkkkkk', 'k.k.k.k'],
];
// Halloween: a jack-o'-lantern, its face flickering; Christmas: a little fir with lights; the new year: a lantern
const PUMPKIN = [0, 1].map(f => [
  '...g....',
  '.ooooo..',
  'ooOooOoo'.replace(/O/g, f ? 'Y' : 'y'),
  'oooYoooo'.replace(/Y/g, f ? 'Y' : 'y'),
  'oYyYyYoo'.replace(/Y/g, f ? 'Y' : 'y'),
  '.oooooo.',
]);
const FIR = [0, 1].map(f => {
  const p = new Pic(13, 17);
  for (let row = 0; row < 14; row++) {
    const w = 1 + Math.floor(row * 0.45);
    for (let x = 6 - w; x <= 6 + w; x++) p.set(x, row + 1, row % 4 === 3 ? '#226B42' : '#2E8B57');
  }
  p.set(6, 0, C.gold);
  p.rect(5, 15, 3, 2, '#6B4A2E');
  [
    [5, 4],
    [7, 6],
    [4, 8],
    [8, 9],
    [6, 11],
    [3, 12],
    [9, 13],
  ].forEach(([x, y], i) => p.set(x, y, (i + f) % 2 ? C.red : C.yellow));
  return p;
});
const LANTERN = [0, 1].map(f => ['..k..', '.rrr.', 'rrYrr', 'rrrrr', '.rrr.', f ? '..y..' : '...y.']);

// ---- the old village's things: the fire, the glints, the reeds, the choir, the pond, the sky ----
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

module.exports = {
  MONITOR,
  TERMINAL,
  LEDS,
  INVADER,
  GLOBE,
  NIGHTWIN,
  SPARROW,
  PONG,
  ROPE,
  TOWER,
  VOLLEY,
  PICNIC,
  TEA,
  ICONS,
  bubble,
  MINI_STAND,
  MINI_WALK,
  MINI_CHEER,
  palPics,
  UFO,
  DEER,
  burst,
  RAINCLOUD,
  DROP,
  FLAKE,
  LEAF,
  PETAL,
  CONFETTI,
  BAT,
  PUMPKIN,
  FIR,
  LANTERN,
  FIRE,
  firePal,
  HEART,
  NOTE,
  ZZ,
  SPARKLE,
  BUBBLE,
  EMBER,
  SMOKE,
  smokePal,
  GLINT,
  TV,
  gbPal,
  TERM,
  termPal,
  CHOIR,
  SWIM,
  FISHJ,
  FIREFLY,
  STAR,
  STAR2,
  SHOOT,
  CLOUDA,
  CLOUDB,
  CLOUDC,
  BIRD,
  BALLOON,
  BUTTERFLY,
  GLOW,
  DOT,
  FLASKS,
};
