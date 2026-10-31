// The place of Clawd World (tools/clawd-world): the backdrop, a 384 x 216 picture drawn pixel by pixel. The sky is a layer of its
// own and the land another, so the tops of the roof and the tower can be cut from the land as props the clouds pass behind; the stars
// and the moon are a layer of their own too (STARFIELD), a little wider than the picture, that wheels slowly to and fro over the sky.
// What sways in the wind (the garden's flowers, the bunting, the lily pads) is left out: those are props (wind.js). `G` holds the
// places the picture and the theme's spots share. The house is after clawd-sidekick by Tunai (MIT): its five rooms, their colours
// and furniture, redrawn on two floors.
'use strict';
const { Pic, ri, rand, reseed, dith } = require('./pic');
const W = 384,
  H = 216,
  PX = 5;
// ---- the backdrop: the sky, then the land on a layer of its own (the tops of buildings and trees are cut from it, so the clouds
// pass behind them) ----
// the places that the picture and the theme's spots share, in art pixels
const G = {
  street: 172 /* the back edge of the street, where buildings stand; the house's ground floor */,
  front: 187 /* its front edge */,
  lane: 181 /* where the crew walk along the street */,
  upper: 147 /* the house's upper floor */,
  sun: [344, 121],
  moon: [168, 22],
  mine: 17,
  forge: [76, 126],
  anvil: 117 /* the left end of the anvil's top */,
  smith: 106,
  lamp: 131,
  house: [140, 258],
  door: 141 /* the doorway in the house's left wall */,
  ladder: 253 /* the ladder from the server room up to the lookout */,
  tower: [284, 310],
  balcony: 140,
  towerLadder: 280,
  fire: [262, 192],
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
// a sky's colour: bands down the gradient `stops`, and nearer the sun ([x, y, how far, how much]) a little further down it (warmer at
// dusk, paler by day)
function skyAt(x, y, stops, sun) {
  stops = stops || SKY;
  sun = sun === undefined ? [G.sun[0], G.sun[1], 120, 16] : sun;
  const yy = sun ? y + Math.max(0, 1 - Math.hypot(x - sun[0], (y - sun[1]) * 1.6) / sun[2]) * sun[3] : y;
  let k = 0;
  while (k < stops.length - 2 && yy >= stops[k + 1][0]) k++;
  const [y0, c0] = stops[k],
    [y1, c1] = stops[k + 1];
  // flat bands, dithered only in the last few rows before the next colour
  const z = Math.min(5, (y1 - y0) / 2),
    t = Math.min(1, Math.max(0, (yy - (y1 - z)) / z));
  return dith(x, y, t) ? c1 : c0;
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sky.set(x, y, skyAt(x, y));
// ---- the night sky over it all: the stars and the moon, on a layer PAN art pixels wider than the picture that pans PAN to the left
// and back (the prop "starfield"); where it starts, it lines up with the picture. The bright stars (BIG) twinkle as props that pan
// with it; others flare now and then where they are (TWINKLES) ----
const PAN = 48,
  STARS_H = 96,
  BIG = [
    [226, 8],
    [120, 42],
    [300, 36],
    [58, 70],
    [356, 74],
    [252, 58],
    [402, 24],
    [418, 62],
  ];
const STARFIELD = new Pic(W + PAN, STARS_H);
// a pixel as it is (with its own alpha, not blended with what is under it)
const raw = (p, x, y, c) => {
  const i = (y * p.w + x) * 4;
  for (let k = 0; k < 4; k++) p.d[i + k] = c[k];
};
// stars, thinner towards the horizon, none near the moon
reseed(11);
for (let i = 0; i < 170; i++) {
  const x = ri(0, W + PAN - 1),
    y = Math.floor(Math.pow(rand(), 1.6) * 92);
  if (Math.hypot(x - G.moon[0], y - G.moon[1]) < 14) continue;
  STARFIELD.set(x, y, rand() < 0.3 ? '#efe4d2' : rand() < 0.5 ? '#a796c6' : '#7d6c9e');
}
for (const [x, y] of BIG) {
  STARFIELD.set(x, y, '#f6efe4');
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    STARFIELD.set(x + dx, y + dy, '#9d8dc0');
}
// the moon, a crescent in a soft halo of three faint rings
for (let y = G.moon[1] - 12; y <= G.moon[1] + 12; y++)
  for (let x = G.moon[0] - 12; x <= G.moon[0] + 12; x++) {
    const d = Math.hypot(x - G.moon[0], y - G.moon[1]),
      n = (d <= 12) + (d <= 10) + (d <= 8);
    if (n) raw(STARFIELD, x, y, [246, 233, 204, Math.round(255 * (1 - Math.pow(1 - 14 / 255, n)))]);
  }
STARFIELD.disc(G.moon[0], G.moon[1], 7, '#f6e9cc');
STARFIELD.disc(G.moon[0] + 1, G.moon[1], 6, '#fff7e4');
for (let y = G.moon[1] - 8; y <= G.moon[1] + 8; y++)
  for (let x = G.moon[0] - 8; x <= G.moon[0] + 8; x++)
    if (Math.hypot(x - G.moon[0] - 4, y - G.moon[1] + 2) <= 6.2 && Math.hypot(x - G.moon[0], y - G.moon[1]) <= 7.5)
      raw(STARFIELD, x, y, [0, 0, 0, 0]);
// stars that flare now and then, where they are (not where the moon passes, nor on a bright star)
reseed(13);
const TWINKLES = [];
while (TWINKLES.length < 14) {
  const x = ri(4, W - 4),
    y = 2 + Math.floor(Math.pow(rand(), 1.4) * 82);
  if (x > 104 && x < 188 && y > 4 && y < 42) continue;
  if (BIG.concat(TWINKLES).some(([bx, by]) => Math.abs(bx - x) < 8 && Math.abs(by - y) < 8)) continue;
  TWINKLES.push([x, y]);
}
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
// ---- the scenery behind the village: two ridges of mountains, rolling hills with little trees, the grassy bank behind the street.
// Their shapes are worked out once; they are drawn in the light of dusk on the land, and again by day and by night for the sky of
// those hours (SKIES) ----
reseed(3);
const FAR = ridge(
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
);
const NEAR = ridge(
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
);
reseed(5);
const HILL = ridge(
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
const TREES = [];
for (let x = 2; x < W; x += ri(5, 9)) TREES.push([x, ri(4, 8)]);
reseed(9);
const BANK = ridge(
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
// the colours of the scenery at an hour: each ridge [base, its lit rim, the rim's foot, haze low down], the hills [top, shade, base],
// the trees [top, body], the bank [top, shade, base]
const DUSK = {
  far: ['#4a2c51', '#a0566a', '#6c3a5d', '#583257'],
  near: ['#33294a', '#7a4a64', '#4a3556', '#3b2d4e'],
  hill: ['#3d4a46', '#2a3436', '#2e3a3a'],
  tree: ['#3e4a44', '#25302f'],
  bank: ['#5d7449', '#344a2e', '#3f5636'],
};
// mountains: the slopes that face the sun (on the right) catch a rim of light
function mountains(p, r, [base, rim, rim2, haze]) {
  for (let x = 0; x < W; x++) {
    for (let y = r[x]; y < G.street; y++) {
      let c = base;
      if (haze && y > r[x] + 6) c = dith(x, y, Math.min(1, (y - r[x] - 6) / 18) * 0.5) ? haze : base;
      p.set(x, y, c);
    }
    const lit = x + 1 < W && r[x + 1] > r[x];
    if (lit) {
      p.set(x, r[x], rim);
      p.set(x, r[x] + 1, rim2);
    } else p.set(x, r[x], rim2);
  }
}
function scenery(p, c) {
  mountains(p, FAR, c.far);
  mountains(p, NEAR, c.near);
  // rolling hills in front, a row of little trees on them
  for (let x = 0; x < W; x++)
    for (let y = HILL[x]; y < G.street; y++) p.set(x, y, y < HILL[x] + 2 ? c.hill[0] : dith(x, y, 0.15) ? c.hill[1] : c.hill[2]);
  for (const [x, h] of TREES) {
    const t = HILL[x];
    for (let j = 0; j < h; j++) {
      const w = Math.floor(((j + 1) * 3) / h);
      p.hline(x - w, x + w, t - h + j + 1, j < 1 ? c.tree[0] : c.tree[1]);
    }
  }
  // the bank behind the street: grass, darker low down
  for (let x = 0; x < W; x++)
    for (let y = BANK[x]; y < G.street; y++) {
      const t = (y - BANK[x]) / (G.street - BANK[x]);
      p.set(x, y, y === BANK[x] ? c.bank[0] : dith(x, y, t * 0.8) ? c.bank[1] : c.bank[2]);
    }
}
scenery(land, DUSK);
// what the scenery left (where a building stands later, the land is something else)
const SCENERY = new Pic(W, H);
SCENERY.d.set(land.d);
// the street: packed earth with pebbles, a shadow along the back
for (let y = G.street; y < G.front; y++)
  for (let x = 0; x < W; x++) {
    let c = y === G.street ? '#6a4c38' : y === G.street + 1 ? '#86634a' : '#a07a58';
    if (y > G.street + 1 && rand() < 0.06) c = rand() < 0.5 ? '#8a6648' : '#bb9670';
    if (y === G.front - 1) c = '#7c5c44';
    land.set(x, y, c);
  }
// the meadow in front: grass that darkens towards the bottom, tufts; in the colours of an hour [shade, base, the front edge, tufts]
const TUFTS = [];
for (let i = 0; i < 160; i++) TUFTS.push([ri(0, W - 1), ri(G.front + 2, H - 2)]);
function meadow(p, c) {
  for (let y = G.front; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = (y - G.front) / (H - G.front);
      p.set(x, y, y === G.front ? c[2] : dith(x, y, t * 0.9) ? c[0] : c[1]);
    }
  for (const [x, y] of TUFTS) {
    p.set(x, y, c[3]);
    p.set(x - 1, y + 1, c[3]);
    p.set(x + 1, y + 1, c[3]);
  }
}
meadow(land, ['#3b5530', '#476638', '#5f8044', '#628a47']);
// what the meadow left (where the stage, a bed or the pond lies later, the land is something else)
const MEADOW = new Pic(W, H);
MEADOW.d.set(land.d);
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
reseed(21);
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

// the Clawds' house, after clawd-sidekick's: two floors of rooms open at the front. Below, the library, the workshop and the server
// room; above, the game room and the lookout; a doorway from the street in the left wall and a ladder up at the right; the inner
// walls are posts from the ceiling, so the rooms open into each other. A terracotta roof over it all.
const SK = {
  roofEdge: '#4A2616',
  beam: '#5E3420',
  wall: '#F3E3C3',
  wallLine: '#E6D2AC',
  wallBlue: '#E4ECF2',
  wallBlueLine: '#D3DEE7',
  wallSlate: '#3B4250',
  wallSlateLine: '#343A47',
  wallSky: '#DDF0F7',
  wallSkyLine: '#CBE6F0',
  wallLilac: '#EADCF5',
  wallLilacLine: '#DCCAEC',
  wains: '#6E4630',
  wainsDark: '#8C5A3C',
  floorHi: '#C07A48',
  floor: '#A8693F',
  floorDark: '#6B3A22',
  wood: '#7A4A2E',
  woodLight: '#9C6238',
  red: '#E5484D',
  blue: '#4D8DF6',
  green: '#4CB363',
  yellow: '#F5C542',
  purple: '#A98BF5',
  beige: '#D9CBB0',
  cork: '#B07A44',
  dark: '#2E3138',
  steel: '#3A3F47',
  gray: '#8A8F98',
  light: '#C9CDD3',
  white: '#FFFFFF',
  screen: '#14201B',
  code: '#6EE7A0',
  arcade: '#5B3FA8',
  sky: '#8ECDF5',
  pageNear: '#FCE7A6',
  duskTop: '#E8836B',
  duskMid: '#F2A65A',
  duskLow: '#F6C77A',
  sunset: '#F0703C',
  shade: '#B4553A',
};
const HX0 = G.house[0],
  HX1 = G.house[1];
// a floor of rooms: the wall and its stripes, the wainscot, the floor (its top row the floor's surface, `fy`)
function storey(fy, rooms) {
  const top = fy - 22;
  for (const r of rooms) {
    land.rect(r[0], top, r[1], 15, r[2]);
    for (let lx = r[0] + 4; lx < r[0] + r[1]; lx += 12) land.rect(lx, top, 1, 15, r[3]);
  }
  land.rect(HX0, fy - 7, HX1 - HX0 + 1, 7, SK.wains);
  land.hline(HX0, HX1, fy - 7, SK.wainsDark);
  land.hline(HX0 - 1, HX1 + 1, fy, SK.floorHi);
  land.hline(HX0 - 1, HX1 + 1, fy + 1, SK.floor);
  for (let x = HX0 + 3; x < HX1; x += 11) land.set(x, fy + 1, SK.floorDark);
  land.hline(HX0 - 1, HX1 + 1, fy + 2, SK.floorDark);
  // the posts between rooms, hanging from the ceiling
  for (const r of rooms.slice(1)) {
    land.rect(r[0] - 2, top, 2, 10, SK.wood);
    land.rect(r[0] - 3, top + 9, 4, 1, SK.beam);
  }
}
const GF = G.street,
  UF = G.upper;
// below: the library (142..177), the workshop (180..219), the server room (222..256)
storey(GF, [
  [142, 36, SK.wall, SK.wallLine],
  [180, 40, SK.wallBlue, SK.wallBlueLine],
  [222, 35, SK.wallSlate, SK.wallSlateLine],
]);
// above: the game room (142..219) and the lookout (222..256)
storey(UF, [
  [142, 78, SK.wallLilac, SK.wallLilacLine],
  [222, 35, SK.wallSky, SK.wallSkyLine],
]);
// the outer walls, the beams under the roof and between the floors
land.rect(HX0, UF - 25, 2, 50, SK.wood);
land.rect(HX1 - 1, UF - 25, 2, 50, SK.wood);
land.rect(HX0 - 1, UF - 25, HX1 - HX0 + 3, 1, SK.roofEdge);
land.rect(HX0 - 1, UF - 24, HX1 - HX0 + 3, 2, SK.beam);
// the doorway in the left wall: an open door folded against the wall outside, a step, a lamp over it
land.rect(HX0, GF - 13, 2, 13, SK.wainsDark);
land.rect(HX0 - 6, GF - 13, 5, 13, '#7A4A2E');
land.rect(HX0 - 6, GF - 13, 5, 1, '#9C6238');
land.set(HX0 - 2, GF - 7, SK.yellow);
land.rect(HX0 - 8, GF - 1, 9, 1, '#7b7186');
land.rect(HX0 - 3, GF - 17, 3, 2, SK.yellow);
land.set(HX0 - 2, GF - 18, SK.dark);
// the library: two racks of books, a reading lamp
reseed(71);
for (const sx of [143, 165]) {
  land.rect(sx, GF - 20, 12, 20, SK.wood);
  for (const shelf of [GF - 20, GF - 15, GF - 10, GF - 5]) {
    land.rect(sx + 1, shelf + 1, 10, 4, SK.woodLight);
    for (let bx = sx + 1; bx < sx + 11; ) {
      const w = ri(1, 2),
        tall = ri(3, 4);
      land.rect(
        bx,
        shelf + 5 - tall,
        Math.min(w, sx + 11 - bx),
        tall,
        [SK.red, SK.blue, SK.green, SK.yellow, SK.purple, SK.beige][ri(0, 5)]
      );
      bx += w + (ri(0, 2) === 0 ? 1 : 0);
    }
  }
}
land.rect(157, GF - 11, 3, 1, SK.yellow);
land.rect(156, GF - 10, 5, 1, SK.yellow);
land.rect(158, GF - 9, 1, 9, SK.gray);
land.rect(156, GF - 1, 5, 1, SK.dark);
// the workshop: the notice board with notes, the calendar, the desk and its screen (the code scrolls: a prop), a plant
land.rect(182, GF - 21, 15, 9, SK.wood);
land.rect(183, GF - 20, 13, 7, SK.cork);
[
  [184, GF - 19, SK.green],
  [187, GF - 18, SK.yellow],
  [190, GF - 19, SK.pageNear],
  [193, GF - 17, SK.green],
  [185, GF - 16, SK.yellow],
].forEach(([x, y, c]) => {
  land.rect(x, y, 2, 2, c);
  land.set(x, y, SK.red);
});
land.rect(199, GF - 22, 7, 2, SK.red);
land.rect(199, GF - 20, 7, 6, SK.white);
land.rect(200, GF - 18, 2, 1, SK.dark);
land.rect(203, GF - 18, 2, 1, SK.dark);
land.rect(200, GF - 16, 5, 1, SK.light);
land.rect(202, GF - 7, 17, 2, SK.woodLight);
land.rect(203, GF - 5, 1, 5, SK.wood);
land.rect(217, GF - 5, 1, 5, SK.wood);
land.rect(204, GF - 16, 12, 8, SK.dark);
land.rect(205, GF - 15, 10, 6, SK.screen);
land.rect(209, GF - 8, 2, 1, SK.dark);
land.rect(181, GF - 4, 4, 4, SK.shade);
land.rect(180, GF - 7, 6, 3, SK.green);
land.set(182, GF - 8, SK.green);
// the server room: the terminal on its table (its cursor blinks: a prop), the rack of servers (its lights blink: a prop), the ladder
land.rect(223, GF - 6, 15, 2, SK.woodLight);
land.rect(224, GF - 4, 1, 4, SK.wood);
land.rect(236, GF - 4, 1, 4, SK.wood);
land.rect(225, GF - 15, 12, 9, SK.beige);
land.rect(226, GF - 14, 10, 6, SK.screen);
land.rect(240, GF - 19, 11, 19, SK.steel);
for (let s = 0; s < 5; s++) land.rect(241, GF - 17 + s * 3, 9, 2, SK.dark);
for (const x of [G.ladder - 2, G.ladder + 2]) land.vline(x, UF - 3, GF - 1, '#a8744c');
for (let y = UF - 1; y < GF; y += 3) land.hline(G.ladder - 1, G.ladder + 1, y, '#8e5c3b');
land.rect(G.ladder - 2, UF, 5, 3, '#3a2418');
// the game room: the arcade cabinet (its invader: a prop), the bunting, a mat rolled up
land.rect(144, UF - 18, 10, 18, SK.arcade);
land.rect(145, UF - 16, 8, 6, SK.dark);
land.rect(144, UF - 9, 10, 2, SK.steel);
land.set(146, UF - 10, SK.red);
land.set(150, UF - 9, SK.yellow);
land.set(152, UF - 9, SK.sky);
for (let x = 157; x < 216; x += 5) {
  const c = [SK.red, SK.yellow, SK.blue, SK.green][((x - 157) / 5) % 4];
  land.rect(x, UF - 21, 3, 1, c);
  land.set(x + 1, UF - 20, c);
}
// the lookout: the window on the sky (night: a prop over it), a globe on a stand
land.rect(226, UF - 20, 28, 11, SK.wood);
land.rect(227, UF - 19, 26, 3, SK.duskTop);
land.rect(227, UF - 16, 26, 3, SK.duskMid);
land.rect(227, UF - 13, 26, 3, SK.duskLow);
land.rect(247, UF - 14, 4, 2, SK.sunset);
land.rect(248, UF - 15, 2, 1, SK.sunset);
land.rect(239, UF - 19, 1, 9, SK.wood);
land.rect(227, UF - 15, 26, 1, SK.wood);
land.rect(240, UF - 3, 1, 2, SK.gray);
land.rect(238, UF - 1, 5, 1, SK.wood);
// the roof: terracotta tiles in rows, lit on the right slope, a round attic window and a chimney
const peak = [199, 99];
land.poly([[HX0 - 8, UF - 25], peak, [HX1 + 8, UF - 25]], '#c4623f');
for (let y = peak[1]; y < UF - 25; y++)
  for (let x = HX0 - 9; x <= HX1 + 9; x++) {
    const v = land.get(x, y);
    if (!(v && v[0] === 0xc4 && v[1] === 0x62)) continue;
    const row = (y - peak[1]) % 3,
      right = x > peak[0];
    let c = right ? '#d06a45' : '#b5593a';
    if (row === 2) c = right ? '#a8502f' : '#934528';
    else if (row === 1 && (x + Math.floor((y - peak[1]) / 3) * 2) % 4 === 0) c = right ? '#bb5c3a' : '#a24e33';
    land.set(x, y, c);
  }
land.line(HX0 - 8, UF - 25, peak[0], peak[1], '#7a3a26');
land.line(peak[0], peak[1], HX1 + 8, UF - 25, '#e98a5e');
land.disc(peak[0], 111, 3.5, '#5e3a25');
land.disc(peak[0], 111, 2.5, '#ffd27a');
land.hline(peak[0] - 2, peak[0] + 2, 111, '#5e3a25');
land.vline(peak[0], 109, 113, '#5e3a25');
bricks(230, 101, 237, 113, '#8a4a3a', '#6a3428');
land.rect(229, 99, 10, 2, '#5a3028');

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

// the pond: the sun on the water, a sandy shore, and a pier out over it
const P0 = 316;
// its water in the colours of an hour (for the skies of the day and the night): [deep, deeper, the far edge, flecks]
function pondWater(p, c) {
  for (let y = 177; y < H; y++)
    for (let x = P0; x < W; x++) {
      const edge = P0 + 10 - Math.round((y - 176) * 0.55) + Math.round(Math.sin(y * 0.7) * 1.2);
      if (x < edge) continue;
      const t = (y - 176) / (H - 176);
      let col = dith(x, y, t) ? c[1] : c[0];
      if (y === 177) col = c[2];
      else if ((x * 13 + y * 7) % 29 === 0) col = c[3];
      p.set(x, y, col);
    }
}
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
reseed(61);
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
// what the water left (where the pier stands later, the land is something else)
const WATER = new Pic(W, H);
WATER.d.set(land.d);
// (the lily pads on it are props that drift in the wind: wind.js)
// the pier
const [PR0, PR1, PRY] = G.pier;
for (const x of [PR0 + 8, PR0 + 22, PR1 - 3]) land.rect(x, PRY + 2, 2, 9, '#4a2c1c');
land.rect(PR0, PRY - 1, PR1 - PR0 + 1, 3, '#a8744c');
for (let x = PR0; x <= PR1; x++) land.set(x, PRY + 1, x % 4 === 0 ? '#5e3a25' : '#7a4a30');
land.hline(PR0, PR1, PRY - 1, '#c48e5e');

// the stage for the little choir, its posts for the bunting
const [S0, S1, SY] = G.stage;
land.rect(S0, SY, S1 - S0 + 1, 2, '#b07a4c');
land.rect(S0, SY + 2, S1 - S0 + 1, 6, '#6a4028');
for (let x = S0; x <= S1; x += 6) land.vline(x, SY + 2, SY + 7, '#5e3a25');
land.hline(S0, S1, SY + 7, '#4a2c1c');
for (const x of [S0, S1]) land.rect(x, SY - 22, 2, 22, '#6a4028');
// (the bunting between the posts is a prop that lifts in the wind: wind.js)
// the burrow: a sandy patch with a hole
reseed(41);
for (let y = 194; y < 206; y++)
  for (let x = 12; x < 48; x++) {
    if (Math.pow((x - 29) / 17, 2) + Math.pow((y - 200) / 5.5, 2) > 1) continue;
    land.set(x, y, rand() < 0.12 ? '#b4925f' : '#cfae7d');
  }
land.rect(27, 199, 5, 2, '#3a2a22');
land.hline(26, 32, 198, '#a8835a');
// the garden bed by the pond (its flowers are a prop that sways in the wind: wind.js)
land.rect(286, 203, 30, 4, '#5a3a2a');
for (let x = 287; x < 316; x += 3) land.set(x, 204, '#3e281c');
// flowers all over the meadow
reseed(51);
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

// ---- the hours: the backdrop is dusk (and dawn); by day and by night a sky of their own lies over it, with the scenery in their
// light, and the pond's water. Each is only where the backdrop shows the sky, the scenery or the water as they were drawn, so the
// buildings in front stay as they are. The stars and the moon (STARFIELD) come out over the night's sky and the dusk's ----
const DAY = {
  sky: [
    [0, '#2b5596'],
    [22, '#3263a9'],
    [42, '#3a72b8'],
    [60, '#4884c5'],
    [76, '#5a97d1'],
    [90, '#72abdc'],
    [102, '#8fc0e6'],
    [114, '#b0d5f0'],
    [124, '#cde5f6'],
  ],
  sun: [326, 36],
  scenery: {
    far: ['#6d85ab', '#b9cbe4', '#8ea4c6', '#7d95ba'],
    near: ['#577092', '#a2b6d1', '#6f88a9', '#627b9b'],
    hill: ['#78a35e', '#4f7c45', '#5c8b4f'],
    tree: ['#6a9a55', '#3f6d3b'],
    bank: ['#8ab868', '#5a8546', '#6a9752'],
  },
  water: ['#4a8ed1', '#3e7ec3', '#a7d4f3', '#78ade0'],
  meadow: ['#4f7f3d', '#5c8c45', '#7aa95a', '#76a952'],
};
const NIGHT = {
  sky: [
    [0, '#090a1e'],
    [28, '#0c0f27'],
    [50, '#111431'],
    [70, '#16183b'],
    [88, '#1c1d45'],
    [102, '#24224f'],
    [114, '#2d2857'],
    [124, '#352e5f'],
  ],
  sun: null,
  scenery: {
    far: ['#241e40', '#4b4078', '#302856', '#29234b'],
    near: ['#1b1733', '#3c3464', '#262046', '#201c3c'],
    hill: ['#202a34', '#151d25', '#1a222b'],
    tree: ['#22302f', '#121a1c'],
    bank: ['#2c3d2f', '#19241c', '#203024'],
  },
  water: ['#18234a', '#141d3f', '#2a3b66', '#34497c'],
  meadow: ['#1a2a1b', '#213322', '#2c4229', '#2c4529'],
};
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
// an hour's sky (down to the street) and ground (the meadow and the pond's water, from the row under the pond's far edge), as sprites
function skyOf(h) {
  const sun = h.sun;
  const air = new Pic(W, G.street);
  for (let y = 0; y < G.street; y++) for (let x = 0; x < W; x++) air.set(x, y, skyAt(x, y, h.sky, sun ? [sun[0], sun[1], 70, 18] : null));
  if (sun) {
    // the sun high up, in a soft glow
    for (let r = 20; r > 9; r -= 3) air.disc(sun[0], sun[1], r, [255, 248, 214, 34]);
    air.disc(sun[0], sun[1], 8, '#fff1c2');
    air.disc(sun[0], sun[1], 6, '#fffbe6');
  }
  const scen = new Pic(W, H);
  scenery(scen, h.scenery);
  const top = new Pic(W, G.street);
  for (let y = 0; y < G.street; y++)
    for (let x = 0; x < W; x++) {
      const l = land.get(x, y);
      if (!l[3]) top.set(x, y, air.get(x, y));
      else if (same(l, SCENERY.get(x, y))) top.set(x, y, scen.get(x, y));
    }
  const wat = new Pic(W, H),
    mea = new Pic(W, H);
  pondWater(wat, h.water);
  meadow(mea, h.meadow);
  const ground = new Pic(W, H - 177);
  for (let y = 177; y < H; y++)
    for (let x = 0; x < W; x++) {
      const l = land.get(x, y),
        w = wat.get(x, y);
      if (w[3] && same(l, WATER.get(x, y))) ground.set(x, y - 177, w);
      else if (y >= G.front && same(l, MEADOW.get(x, y))) ground.set(x, y - 177, mea.get(x, y));
    }
  return { sky: top, ground };
}
const SKIES = { day: skyOf(DAY), night: skyOf(NIGHT), ground: 177 };

// a part of the land as a sprite: the buildings in it (where the land is empty or only the scenery, it stays transparent, so the
// clouds pass in front of the mountains and behind the roof, and the sky of each hour shows round it)
function cut(x, y, w, h) {
  const p = new Pic(w, h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const l = land.get(x + i, y + j);
      if (!same(l, SCENERY.get(x + i, y + j))) p.set(i, j, l);
    }
  return [p];
}
function backdrop() {
  const bg = new Pic(W, H);
  bg.draw(sky, 0, 0);
  bg.draw(land, 0, 0);
  return bg;
}
module.exports = { G, W, H, PX, sky, land, cut, backdrop, STARFIELD, PAN, BIG, TWINKLES, SKIES };
