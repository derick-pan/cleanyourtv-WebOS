// The holidays of Clawd World (tools/clawd-world): what each brings to the village, drawn pixel by pixel. Christmas: lights along the
// eaves, a wreath round the round window, presents under the fir, Santa's sleigh; Halloween: ghosts and cobwebs; Thanksgiving: a
// turkey, the harvest, the feast table; the Lunar New Year (and the Mid-Autumn Festival): red lanterns, a lion dance, firecrackers;
// St Patrick's Day: shamrocks and a pot of gold; Easter: painted eggs; the Fourth of July: red, white and blue fireworks. And the
// dragon, on its perch on the mine's rock: it sits, looks about, roars a jet of flame and stretches its wings.
'use strict';
const { Pic } = require('./pic');

// a dot in a picture, if it is in it
const dot = (p, x, y, c) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x >= 0 && y >= 0 && x < p.w && y < p.h) p.set(x, y, c);
};
const disc = (p, cx, cy, rx, ry, c) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2) <= 1) dot(p, x, y, c);
};
// a colour with an alpha of its own (semi-transparent pixels)
const rgba = (hex, a) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), a];

// ---- the dragon on its perch: sitting, a blink, a look back, the roar (a jet of flame that grows, then smoke), its wings stretched ----
const DG = '#3fa37a',
  Dg = '#2d7a5a',
  Db = '#f2c94c',
  De = '#1e120f',
  Dw = '#7fd1a8';
const PERCH = [
  'sit',
  'sit',
  'blink',
  'sit',
  'back',
  'back',
  'sit',
  'sit',
  'roar1',
  'roar2',
  'roar3',
  'roar4',
  'smoke',
  'sit',
  'wings',
  'wings',
];
function perch(act) {
  const p = new Pic(46, 24);
  // the tail, curled round the rock
  for (let x = 1; x <= 11; x++) dot(p, x, 21 - Math.round(Math.sin((x - 1) * 0.42) * 2.2), Dg);
  dot(p, 1, 19, DG);
  dot(p, 0, 18, DG);
  // a wing stretched up and out, behind the body
  if (act === 'wings')
    for (let j = 0; j <= 10; j++) {
      const y = 10 - j,
        xa = 8 - Math.round(j * 0.5),
        xb = 19 - Math.round(j * 0.2);
      for (let x = xa; x <= xb; x++) dot(p, x, y, x === xa || x === xb || j === 10 ? Dg : Dw);
    }
  // the body, upright, a pale belly
  disc(p, 16, 15.5, 7, 6, DG);
  for (let y = 13; y <= 20; y++)
    for (let x = 15; x <= 20; x++) if (Math.pow((x - 18) / 3, 2) + Math.pow((y - 17) / 4, 2) <= 1) dot(p, x, y, Db);
  // the folded wing on its back
  if (act !== 'wings')
    for (let y = 10; y <= 15; y++) for (let x = 10; x <= 16 - Math.max(0, y - 13); x++) dot(p, x, y, y === 10 || x === 10 ? Dg : Dw);
  // the legs and claws on the rock
  for (const lx of [11, 19]) {
    p.rect(lx, 20, 3, 2, Dg);
    dot(p, lx - 1, 22, Dg);
    dot(p, lx + 3, 22, Dg);
  }
  p.rect(10, 22, 5, 1, Dg);
  p.rect(18, 22, 5, 1, Dg);
  // the neck and the head: up and forward, back over its shoulder, or up high to roar
  const back = act === 'back',
    up = act.indexOf('roar') === 0 || act === 'smoke',
    hx = back ? 13 : 23,
    hy = up ? 2 : 4;
  for (let j = 0; j < 4; j++) p.rect(back ? 15 - j : 20 + j, 11 - j - (up ? 1 : 0), 3, 2, DG);
  p.rect(hx, hy, 7, 5, DG);
  dot(p, hx + (back ? -1 : 7), hy + 2, DG);
  dot(p, hx + (back ? -2 : 8), hy + 2, DG);
  dot(p, hx + (back ? -1 : 7), hy + 3, DG);
  // a horn, an eye (shut to blink)
  dot(p, hx + (back ? 5 : 1), hy - 1, Db);
  dot(p, hx + (back ? 6 : 0), hy - 2, Db);
  if (act === 'blink') p.rect(hx + (back ? 1 : 4), hy + 1, 2, 1, Dg);
  else dot(p, hx + (back ? 1 : 5), hy + 1, De);
  // its mouth open, the flame: a spark, a lick, a jet that widens as it goes (white, yellow, orange, red at the tip), the jet
  // breaking up, then a puff of smoke
  const mx = hx + 9,
    my = hy + 3;
  if (up) dot(p, hx + 7, hy + 4, '#c0392b');
  if (act === 'roar1') dot(p, mx, my, '#ffd35a');
  const L = { roar2: 5, roar3: 13, roar4: 11 }[act];
  if (L)
    for (let i = 0; i <= L; i++) {
      const t = Math.min(2, Math.floor(i / 4)),
        u = i / 13;
      for (let j = -t; j <= t; j++) {
        if (act === 'roar4' && (i + j) % 2) continue;
        dot(p, mx + i, my - i * 0.45 + j, u < 0.2 ? '#fff3c4' : u < 0.45 ? '#ffd35a' : u < 0.75 ? '#ff9a3c' : '#e2493b');
      }
    }
  if (act === 'smoke')
    for (const [dx, dy, c] of [
      [6, -4, '#cdbfa8'],
      [7, -4, '#e8e0d0'],
      [7, -5, '#cdbfa8'],
      [10, -6, '#e8e0d0'],
      [11, -6, '#cdbfa8'],
      [11, -7, '#e8e0d0'],
      [12, -7, '#cdbfa8'],
    ])
      dot(p, mx + dx, my + dy, c);
  return p;
}
const DRAGON_PERCH = PERCH.map(perch);

// ---- Christmas ----
// lights along the eaves of the house: a wire that sags between hooks, a bulb every four pixels, twinkling in turn
const XLIGHTS = [0, 1].map(f => {
  const W = 134,
    p = new Pic(W, 5),
    cols = ['#e5484d', '#4cb363', '#f5c542', '#4d8df6'];
  for (let x = 0; x < W; x++) dot(p, x, Math.round(Math.sin(((x % 17) / 17) * Math.PI) * 1.6), '#2a4a33');
  for (let x = 2, k = 0; x < W; x += 4, k++) {
    const y = Math.round(Math.sin(((x % 17) / 17) * Math.PI) * 1.6) + 1,
      c = cols[k % 4],
      lit = (k + f) % 2 === 0;
    dot(p, x, y, c);
    dot(p, x, y + 1, lit ? c : rgbaDim(c));
    if (lit) dot(p, x, y + 2, rgba(c, 110));
  }
  return p;
});
function rgbaDim(hex) {
  const c = rgba(hex, 255);
  return [Math.round(c[0] * 0.55), Math.round(c[1] * 0.55), Math.round(c[2] * 0.55), 255];
}
// a wreath round the round window in the gable: a ring of fir, red berries, a bow at its foot
const WREATH = (() => {
  const p = new Pic(15, 16);
  for (let y = 0; y < 15; y++)
    for (let x = 0; x < 15; x++) {
      const r = Math.hypot(x - 7, y - 7);
      if (r >= 5 && r <= 7.3) dot(p, x, y, (x + y) % 3 ? '#2e8b57' : '#226b42');
    }
  for (const [x, y] of [
    [2, 4],
    [11, 2],
    [13, 8],
    [1, 10],
    [9, 13],
    [5, 1],
  ])
    dot(p, x, y, '#e2493b');
  // the bow
  for (const [x, y] of [
    [5, 13],
    [6, 12],
    [6, 13],
    [7, 13],
    [8, 12],
    [8, 13],
    [9, 13],
    [6, 14],
    [8, 14],
    [6, 15],
    [8, 15],
  ])
    dot(p, x, y, y === 13 && x === 7 ? '#9a2f2c' : '#e2493b');
  return [p];
})();
// presents under the fir: a red box with a gold ribbon, a blue one with white, a green one with red
const PRESENTS = (() => {
  const p = new Pic(17, 8),
    box = (x, w, h, c, rib) => {
      p.rect(x, 8 - h, w, h, c);
      p.rect(x + Math.floor(w / 2), 8 - h, 1, h, rib);
      p.rect(x, 8 - h + Math.floor(h / 2), w, 1, rib);
      dot(p, x + Math.floor(w / 2) - 1, 8 - h - 1, rib);
      dot(p, x + Math.floor(w / 2) + 1, 8 - h - 1, rib);
    };
  box(0, 6, 6, '#e2493b', '#f5c542');
  box(6, 5, 4, '#4d8df6', '#f6efe4');
  box(11, 6, 5, '#3c9a5f', '#e2493b');
  return [p];
})();
// Santa's sleigh: two reindeer galloping ahead (the first with a red nose), the sleigh with Santa and his sack
function sleigh(f, parked) {
  const p = new Pic(52, 16);
  // the sleigh: red, curled at the front, gold runners
  p.rect(2, 8, 15, 5, '#c8302c');
  p.rect(2, 7, 2, 1, '#c8302c');
  p.rect(15, 6, 3, 3, '#c8302c');
  dot(p, 18, 5, '#c8302c');
  p.rect(1, 14, 18, 1, '#f2c14e');
  dot(p, 19, 13, '#f2c14e');
  dot(p, 0, 13, '#f2c14e');
  for (const x of [4, 14]) dot(p, x, 13, '#f2c14e');
  p.rect(3, 9, 12, 1, '#f2c14e');
  // the sack, Santa: a red coat and hat, a white beard and trim, a waving arm when parked
  disc(p, 5, 5, 3, 3, '#8e5c3b');
  dot(p, 5, 2, '#5e3a25');
  p.rect(9, 3, 5, 5, '#e2493b');
  p.rect(9, 7, 5, 1, '#f6efe4');
  p.rect(10, 0, 4, 2, '#e2493b');
  dot(p, 14, 1, '#f6efe4');
  p.rect(10, 2, 4, 1, '#f6efe4');
  dot(p, 12, 3, '#f2c9a8');
  p.rect(11, 4, 3, 2, '#f6efe4');
  if (parked && f) {
    dot(p, 14, 2, '#e2493b');
    dot(p, 15, 1, '#e2493b');
  } else dot(p, 14, 5, '#e2493b');
  // the harness and the reindeer
  p.rect(18, 8, 16, 1, '#8e5c3b');
  [22, 37].forEach((rx, i) => {
    const legs = parked ? [0, 0, 0, 0] : f ? [1, -1, 1, -1] : [-1, 1, -1, 1];
    p.rect(rx, 7, 9, 4, '#8e5c3b');
    p.rect(rx, 10, 9, 1, '#5e3a25');
    [rx, rx + 2, rx + 6, rx + 8].forEach((lx, k) => {
      dot(p, lx + legs[k], 11, '#5e3a25');
      dot(p, lx + legs[k] * 2, 12, '#5e3a25');
    });
    dot(p, rx - 1, 7, '#8e5c3b');
    p.rect(rx + 8, 4, 2, 3, '#8e5c3b');
    p.rect(rx + 9, 3, 4, 3, '#8e5c3b');
    dot(p, rx + 11, 4, '#1e120f');
    dot(p, rx + 13, 4, i ? '#ff3b30' : '#5e3a25');
    for (const [ax, ay] of [
      [9, 2],
      [9, 1],
      [8, 0],
      [10, 0],
      [11, 2],
      [12, 1],
    ])
      dot(p, rx + ax, ay, '#d6b07c');
  });
  return p;
}
const SLEIGH = [0, 1].map(f => sleigh(f, false)),
  SLEIGH_PARK = [0, 1].map(f => sleigh(f, true));

// ---- Halloween ----
// a ghost, its hem waving, see-through
const GHOST = [0, 1, 2].map(f => {
  const p = new Pic(13, 15),
    W = rgba('#f4f1ec', 215),
    w = rgba('#cfc8d8', 215);
  disc(p, 6, 5, 5.5, 5, W);
  p.rect(1, 5, 11, 7, W);
  for (let x = 1; x < 12; x++) {
    const h = 12 + ((x + f) % 3 === 0 ? 2 : (x + f) % 3 === 1 ? 1 : 0);
    for (let y = 12; y < h; y++) dot(p, x, y, W);
  }
  for (let y = 4; y < 12; y++) dot(p, 11, y, w);
  p.rect(4, 4, 1, 2, '#2b2233');
  p.rect(8, 4, 1, 2, '#2b2233');
  p.rect(5, 7, 3, 2, '#2b2233');
  return p;
});
// a cobweb in a corner (top left; mirrored for the other side by drawing it again)
function web(mirror) {
  const p = new Pic(11, 11),
    c = rgba('#d8d4e2', 170);
  const put = (x, y) => dot(p, mirror ? 10 - x : x, y, c);
  for (const [ex, ey] of [
    [10, 0],
    [10, 4],
    [8, 8],
    [4, 10],
    [0, 10],
  ])
    for (let t = 0; t <= 1; t += 0.05) put(ex * t, ey * t);
  for (const r of [4, 7.5])
    for (let a = 0; a <= Math.PI / 2; a += 0.06) put(Math.cos(a) * r * (1 + 0.08 * Math.sin(a * 6)), Math.sin(a) * r);
  return p;
}
const COBWEB = [web(false)],
  COBWEB_R = [web(true)];

// ---- Thanksgiving ----
// a turkey: its fan of tail feathers, a red wattle; it gobbles standing, its legs step as it walks
function turkey(f, walking) {
  const p = new Pic(15, 14),
    fan = ['#e07b2e', '#8e5c3b', '#c8452e', '#f2c14e', '#8e5c3b', '#e07b2e'];
  for (let a = Math.PI * 1.05; a <= Math.PI * 1.95; a += 0.03)
    for (let r = 3; r <= 6.5; r += 0.5)
      dot(p, 5 + Math.cos(a) * r, 8 + Math.sin(a) * r, fan[Math.floor((a - Math.PI) / (Math.PI / 6.2)) % 6]);
  disc(p, 7, 8.5, 4, 3, '#8e5c3b');
  disc(p, 7, 9, 2.5, 1.6, '#6b4527');
  const nod = !walking && f ? 1 : 0;
  p.rect(10, 4 + nod, 2, 4, '#c9a07a');
  p.rect(10, 3 + nod, 3, 2, '#c9a07a');
  dot(p, 11, 3 + nod, '#1e120f');
  dot(p, 13, 4 + nod, '#f2c14e');
  dot(p, 12, 5 + nod, '#e2493b');
  dot(p, 12, 6 + nod, '#e2493b');
  const l = walking ? (f ? [-1, 1] : [1, -1]) : [0, 0];
  for (const [i, lx] of [6, 8].entries()) {
    dot(p, lx, 11, '#e09a2e');
    dot(p, lx + l[i], 12, '#e09a2e');
    dot(p, lx + l[i] - 1, 13, '#e09a2e');
    dot(p, lx + l[i] + 1, 13, '#e09a2e');
  }
  return p;
}
const TURKEY = [0, 1].map(f => turkey(f, false)),
  TURKEY_WALK = [0, 1].map(f => turkey(f, true));
// the harvest by the stage: a bale of hay, a sheaf of corn, a pumpkin and a squash
const HARVEST = (() => {
  const p = new Pic(24, 15);
  p.rect(2, 8, 14, 7, '#d9b45a');
  for (let x = 2; x < 16; x += 3) p.rect(x, 8, 1, 7, '#b8923c');
  p.rect(2, 10, 14, 1, '#8e6a2a');
  p.rect(2, 13, 14, 1, '#8e6a2a');
  for (const [x, lean] of [
    [17, 1],
    [19, 0],
    [21, -1],
  ])
    for (let y = 0; y < 15; y++) {
      const xx = x + Math.round(((14 - y) / 14) * lean);
      dot(p, xx, y, y < 5 ? '#c9a24a' : '#9a8a3a');
      if (y > 3 && y < 9 && y % 2) dot(p, xx + 1, y, '#f2c14e');
    }
  disc(p, 5, 6, 3, 2.2, '#f08a24');
  dot(p, 5, 3, '#4f8a3f');
  disc(p, 11, 6.5, 2, 1.6, '#e8c86a');
  return [p];
})();
// the feast table: a cloth, a roast turkey, pies, corn, plates, two candles
const FEAST = [0, 1].map(f => {
  const p = new Pic(62, 13);
  p.rect(0, 6, 62, 3, '#f6efe4');
  p.rect(0, 9, 62, 1, '#cdbfa8');
  for (let x = 0; x < 62; x += 6) dot(p, x, 9, '#e2493b');
  p.rect(2, 10, 2, 3, '#7a4a2e');
  p.rect(58, 10, 2, 3, '#7a4a2e');
  // the roast
  disc(p, 31, 4, 5, 2.6, '#a8642a');
  disc(p, 31, 3.4, 3.4, 1.4, '#c98a46');
  dot(p, 26, 5, '#f6efe4');
  dot(p, 36, 5, '#f6efe4');
  p.rect(25, 6, 13, 1, '#cdbfa8');
  // pies, corn, plates, candles
  for (const x of [12, 46]) {
    disc(p, x, 5, 3, 1.2, '#e09a2e');
    dot(p, x - 1, 4, '#f2c14e');
  }
  for (const x of [20, 41]) p.rect(x, 4, 3, 2, '#f2c14e');
  for (const x of [6, 17, 52, 57]) p.rect(x, 5, 3, 1, '#d6d9de');
  for (const x of [23, 39]) {
    p.rect(x, 2, 1, 4, '#f6efe4');
    dot(p, x, 1, f ? '#ffd35a' : '#ff9a3c');
    if (f) dot(p, x, 0, rgba('#ffd35a', 120));
  }
  return p;
});

// ---- the Lunar New Year and the Mid-Autumn Festival ----
// red lanterns along the eaves, swaying, gold tassels
const LANTERNS = [0, 1].map(f => {
  const W = 134,
    p = new Pic(W, 13);
  for (let x = 0; x < W; x++) dot(p, x, Math.round(Math.sin(((x % 22) / 22) * Math.PI) * 2), '#3b2f3f');
  for (let x = 11, k = 0; x < W - 4; x += 22, k++) {
    const y0 = Math.round(Math.sin(((x % 22) / 22) * Math.PI) * 2) + 1,
      sw = (k + f) % 2 ? 1 : 0;
    dot(p, x, y0, '#3b2f3f');
    p.rect(x - 2 + sw, y0 + 1, 5, 1, '#f2c14e');
    disc(p, x + sw, y0 + 5, 3.5, 3.2, '#d8312f');
    p.rect(x - 1 + sw, y0 + 4, 3, 3, '#ff6b4a');
    dot(p, x + sw, y0 + 5, '#ffd35a');
    p.rect(x - 2 + sw, y0 + 8, 5, 1, '#f2c14e');
    dot(p, x + sw, y0 + 9, '#f2c14e');
    dot(p, x + sw + (f ? 1 : -1) * 0, y0 + 10, '#f2c14e');
    dot(p, x + sw + (f ? 1 : 0), y0 + 11, '#e09a2e');
  }
  return p;
});
// a lion dance: the lion's head (red and gold, big eyes, a white beard), its cloth over two dancers whose legs step
const LION = [0, 1, 2, 3].map(f => {
  const p = new Pic(34, 20),
    bob = [0, -1, 0, 1][f];
  // the cloth: red with gold scales and a white fringe, the tail tuft
  for (let x = 2; x < 22; x++) {
    const top = 6 + Math.round(Math.sin((x + f * 2) * 0.5) * 0.8);
    for (let y = top; y < 14; y++) dot(p, x, y, (x + y) % 4 === 0 ? '#f2c14e' : '#d8312f');
    dot(p, x, 14, x % 2 ? '#f6efe4' : '#e8e0d0');
  }
  for (let y = 4; y < 9; y++) dot(p, 1, y, y % 2 ? '#f2c14e' : '#e8e0d0');
  dot(p, 0, 4, '#f2c14e');
  // the dancers' legs, Clawd orange, stepping
  const step = f % 2;
  for (const [lx, i] of [
    [5, 0],
    [9, 1],
    [15, 0],
    [19, 1],
  ]) {
    const up = (i + step) % 2;
    p.rect(lx, 15, 2, up ? 3 : 4, '#d97757');
    dot(p, lx, up ? 18 : 19, '#b4553a');
  }
  // the head
  const hy = 2 + bob;
  p.rect(21, hy + 1, 12, 10, '#e2493b');
  p.rect(21, hy, 12, 2, '#f2c14e');
  dot(p, 22, hy - 1, '#f2c14e');
  dot(p, 31, hy - 1, '#f2c14e');
  p.rect(24, hy + 3, 3, 3, '#f6efe4');
  p.rect(29, hy + 3, 3, 3, '#f6efe4');
  dot(p, 25 + (f > 1 ? 1 : 0), hy + 4, '#1e120f');
  dot(p, 30 + (f > 1 ? 1 : 0), hy + 4, '#1e120f');
  p.rect(23, hy + 7, 9, 2, '#f2c14e');
  p.rect(24, hy + 9, 7, 2, f % 2 ? '#9a2f2c' : '#f6efe4');
  for (let x = 21; x < 33; x += 2) dot(p, x, hy + 11, '#f6efe4');
  dot(p, 33, hy + 5, '#f2c14e');
  return p;
});
// a firecracker popping: a flash, then sparks flying out
const CRACKER = [
  ['.Y.', 'YRY', '.Y.'],
  ['Y.Y', '.W.', 'Y.Y'],
];

// ---- St Patrick's Day, Easter, the Fourth of July ----
const SHAMROCK = [['.N.N.', 'NNNNN', '.NNN.', 'NNnNN', '..n..', '.n...']];
const GOLD = [0, 1].map(f => [
  f ? '...W......' : '..........',
  '..Y.YY.Y..',
  '.YYYYYYYY.',
  'KKKKKKKKKK',
  '.KkKKKKKK.',
  '.KKKKKKKK.',
  '..KKKKKK..',
]);
const EGGS = [
  ['.P.', 'WWW', 'PPP', '.P.'],
  ['.U.', 'YYY', 'UUU', '.U.'],
  ['.Y.', 'PPP', 'YYY', '.Y.'],
  ['.N.', 'WWW', 'NNN', '.N.'],
].map(e => [e]);

module.exports = {
  DRAGON_PERCH,
  XLIGHTS,
  WREATH,
  PRESENTS,
  SLEIGH,
  SLEIGH_PARK,
  GHOST,
  COBWEB,
  COBWEB_R,
  TURKEY,
  TURKEY_WALK,
  HARVEST,
  FEAST,
  LANTERNS,
  LION,
  CRACKER,
  SHAMROCK,
  GOLD,
  EGGS,
};
