// Draws Clawd World, the world of the Claude theme, and writes it into themes/claude/:
//   world.png   the backdrop, 1920 x 1080: a 384 x 216 picture with every art pixel 5 x 5 (effects.wallpaper)
//   clawd.png   the sprite sheet at one pixel per art pixel: every Clawd in every look and everything they use (world.file)
//   theme.json  its "world": the sprites, spots, props, herds, events and the night, from the same layout as the picture
//   node tools/clawd-world [--sheet <folder>]   (--sheet also writes a contact sheet of the sprites, 4x, to look at)
// Everything is drawn here, pixel by pixel; parts are after clawd-sidekick, Clawd Tank and claude-clawd (MIT), see THIRD-PARTY.md.
'use strict';
const fs = require('fs'),
  path = require('path');
const { Pic, png, spr } = require('./pic');
const K = require('./clawd');
const T = require('./things');
const P = require('./place');
const OUT = path.join(__dirname, '..', '..', 'themes', 'claude');

// ---- the sheet: every sprite a strip of its frames side by side; a crew sprite has a strip for every look under it ----
const SHEET = [];
function add(name, frames, o) {
  o = o || {};
  const rows = (o.looks ? frames : [frames]).map(fr => fr.map(f => (f instanceof Pic ? f : spr(f, o.pal))));
  const w = Math.max(...rows[0].map(p => p.w)),
    h = Math.max(...rows[0].map(p => p.h));
  // frames of another size: at the bottom left
  const fit = p => {
    if (p.w === w && p.h === h) return p;
    const q = new Pic(w, h);
    q.draw(p, 0, h - p.h);
    return q;
  };
  SHEET.push({
    name,
    rows: rows.map(r => r.map(fit)),
    w,
    h,
    ax: o.ax === undefined ? Math.floor(w / 2) : o.ax,
    ay: o.ay === undefined ? h : o.ay,
  });
}
// a Clawd sprite: every look, frames every `step` ticks, cut to the box all of them use; its anchor is the middle of the feet
const LOOKS = K.CAPS.slice(0, 6);
function crew(name, step, looks) {
  const all = (looks === false ? [null] : LOOKS).map(lk => K.strip(name, lk, step));
  const b = K.bbox([].concat(...all));
  add(
    name,
    all.map(r => r.map(f => K.crop(f, b))),
    { looks: true, ax: K.OX + 8 - b.x0, ay: K.FEET + 1 - b.y0 }
  );
}
// burrowing: the Clawd sinks into a mound of sand and is gone; popping out is the same backwards
function dig(back) {
  const all = LOOKS.map(lk => {
    const out = [0, 3, 5, 7, 9, 12].map((n, i) => {
      const f = K.frame(i ? 'stand' : 'stand', 0, lk),
        g = new Pic(K.CW, K.CH);
      for (let y = 0; y < K.CH; y++) for (let x = 0; x < K.CW; x++) if (y + n <= K.FEET) g.set(x, y + n, f.get(x, y));
      const mound = ['....tTTTTTTt....', '..tTTTTTTTTTTt..', 'tTTtTTTTTTtTTTTt'];
      mound.forEach((r, j) => {
        for (let i = 0; i < 16; i++) if (r[i] !== '.') g.set(K.OX + i, K.FEET - 2 + j, r[i] === 't' ? '#a8835a' : '#d6b07c');
      });
      if (i === 5)
        for (const [dx, dy] of [
          [3, -4],
          [8, -6],
          [11, -3],
          [6, -2],
        ])
          g.set(K.OX + dx, K.FEET + dy, '#cdbfa8');
      return g;
    });
    return back ? out.reverse() : out;
  });
  const b = K.bbox([].concat(...all));
  add(
    back ? 'pop' : 'dig',
    all.map(r => r.map(f => K.crop(f, b))),
    { looks: true, ax: K.OX + 8 - b.x0, ay: K.FEET + 1 - b.y0 }
  );
}

// ---- every sprite ----
// the crew: [name, every so many ticks]; the ones in a hat of their own have one look
// prettier-ignore
for (const [n, step] of [
  ['stand', 1], ['walk', 1], ['climb', 1], ['wave', 1], ['read', 2], ['think', 1], ['code', 1], ['web', 8], ['arcade', 2], ['wait', 1],
  ['pin', 1], ['panic', 1], ['love', 1], ['cheer', 1], ['oops', 2], ['ask', 1], ['stamp', 2], ['mail', 2], ['tidy', 2], ['eat', 2],
  ['sip', 2], ['stretch', 1], ['clap', 1], ['sleep', 2], ['pongl', 1], ['pongr', 1], ['ropel', 1], ['roper', 1], ['jump', 1],
  ['towerl', 3], ['towerr', 3], ['volleyl', 1], ['volleyr', 1], ['juggle', 1], ['conduct', 1], ['hammer', 1], ['pick', 1], ['sweep', 1],
  ['debug', 2], ['groove', 1], ['eureka', 2], ['dizzy', 1], ['coffee', 2], ['roast', 4], ['water', 1], ['fish', 2], ['carry', 1],
])
  crew(n, step);
crew('build', 1, false);
crew('wizard', 1, false);
dig(false);
dig(true);
// the house's furniture that moves, the game room's equipment, the pals and the meadow's little ones
add('monitor', T.MONITOR, { ax: 0, ay: 0 });
add('terminal', T.TERMINAL, { ax: 0, ay: 0 });
add('leds', T.LEDS, { ax: 0, ay: 0 });
add('invader', T.INVADER, { ax: 0, ay: 0 });
add('globe', T.GLOBE, { ax: 0, ay: 0 });
add('nightwin', T.NIGHTWIN, { ax: 0, ay: 0 });
add('sparrow', T.SPARROW, { ax: 0, ay: 0 });
add('pong', T.PONG, { ax: 10, ay: 10 });
add('rope', T.ROPE, { ax: 18, ay: 19 });
add('tower', T.TOWER, { ax: 14, ay: 12 });
add('volley', T.VOLLEY, { ax: 6 + K.COURT / 2, ay: 24 });
add('picnic', T.PICNIC);
add('tea', T.TEA);
for (const icon of Object.keys(T.ICONS)) add('say-' + icon, T.bubble(icon), { ax: 3, ay: 9 });
add('mini', T.MINI_STAND);
add('mini-walk', T.MINI_WALK);
add('mini-cheer', T.MINI_CHEER);
for (const pal of ['cat', 'owl', 'crab']) {
  const f = T.palPics(pal);
  add(pal, [f[0]]);
  add(pal + '-walk', f);
}
// visitors, weather, the year's decorations
add('ufo', T.UFO, { ay: 4 });
add('deer', T.DEER);
add('fw-a', T.burst('#F5C542', '#E5484D'));
add('fw-b', T.burst('#8ECDF5', '#A98BF5'));
add('fw-c', T.burst('#6EE7A0', '#F6A5B8'));
add('raincloud', T.RAINCLOUD);
add('drop', [['c', 'c', 'C']]);
add('flake', T.FLAKE);
add('leaf', T.LEAF, { pal: { o: '#E07B2E', y: '#E8B33A' } });
add('petal', T.PETAL, { pal: { p: '#F6B6C8' } });
add('confetti', T.CONFETTI, { pal: { r: '#E5484D', y: '#F5C542', b: '#4D8DF6', g: '#4CB363' } });
add('bat', T.BAT, { pal: { k: '#1b1218' } });
add('pumpkin', T.PUMPKIN, { pal: { g: '#4F8A3F', o: '#F08A24', y: '#7a3a10', Y: '#FFD35A' } });
add('fir', T.FIR);
add('lantern', T.LANTERN, { pal: { k: '#2E3138', r: '#D8312F', Y: '#FFD35A', y: '#F2C14E' } });
// the village's things
add('fire', T.FIRE, { pal: T.firePal });
add('heart', [T.HEART]);
add('note', [T.NOTE]);
add('zz', [T.ZZ]);
add('sparkle', T.SPARKLE);
add('bubble', T.BUBBLE);
add('ember', T.EMBER);
add('smoke', T.SMOKE, { pal: T.smokePal });
add('glint', T.GLINT);
add('reeds', T.REEDS);
add('choir', T.CHOIR);
add('swim', T.SWIM);
add('fishjump', T.FISHJ);
add('firefly', T.FIREFLY);
add('star2', T.STAR2);
add('shoot', T.SHOOT);
add('cloud-a', T.CLOUDA);
add('cloud-b', T.CLOUDB);
add('cloud-c', T.CLOUDC);
add('bird', T.BIRD);
add('balloon', T.BALLOON);
add('butterfly', T.BUTTERFLY);
add('lamp-glow', T.GLOW(9, '#ffd27a'));
add('forge-glow', T.GLOW(8, '#ff8a3a'));
add('flasks', T.FLASKS);
add('emitter', T.DOT);
// the tops of the roof and the tower, cut from the land: over the clouds that drift behind them
const OCC = { roof: [128, 97, 142, 26], 'tower-top': [278, 90, 39, 33] };
for (const k in OCC) add(k, P.cut(...OCC[k]), { ax: 0, ay: 0 });

// the sheet: the strips packed in rows, tallest first; each sprite's place in it
function pack(maxW) {
  const order = SHEET.slice().sort((a, b) => b.h * b.rows.length - a.h * a.rows.length);
  let x = 0,
    y = 0,
    rowH = 0,
    width = 0;
  for (const s of order) {
    const sw = s.w * s.rows[0].length,
      sh = s.h * s.rows.length;
    if (x && x + sw > maxW) {
      y += rowH + 1;
      x = 0;
      rowH = 0;
    }
    s.x = x;
    s.y = y;
    x += sw + 1;
    rowH = Math.max(rowH, sh);
    width = Math.max(width, x);
  }
  const p = new Pic(width, y + rowH);
  for (const s of SHEET) s.rows.forEach((r, j) => r.forEach((f, i) => p.draw(f, s.x + i * s.w, s.y + j * s.h)));
  return p;
}
const atlas = pack(1024);
const sprites = {};
for (const s of SHEET)
  sprites[s.name] = [s.x, s.y, s.w, s.h, s.rows[0].length, s.ax, s.ay].concat(s.rows.length > 1 ? [s.rows.length] : []);

// ---- the world: where the Clawds go and what they do there, in screen pixels ----
const G = P.G,
  S = v => Math.round(v * P.PX);
// the ways in: through the doorway into the house; up the ladder to the upper floor; up the tower's ladder to its balcony
const DOOR = [
  [S(G.door - 7), S(G.street + 4), 0],
  [S(G.door + 3), S(G.street), 0],
];
const UP = DOOR.concat([
  [S(G.ladder), S(G.street), 0],
  [S(G.ladder), S(G.upper), 1],
]);
const TOWER = [
  [S(G.towerLadder), S(G.street + 4), 0],
  [S(G.towerLadder), S(G.street), 0],
  [S(G.towerLadder), S(G.balcony), 1],
];
const say = (s, every) => ({ s: s.map(x => 'say-' + x), every });
const prop = (s, x, y, o) => Object.assign({ s, x: S(x), y: S(y) }, o || {});
const spot = (x, y, o) => Object.assign({ x: S(x), y: S(y) }, o);
const DAY = { h: [7, 21] },
  NIGHT = { h: [21, 6] },
  GF = G.street,
  UF = G.upper;
const spots = [
  // the screenshot shows the first ones (still mode puts the crew there in this order)
  spot(210, GF, { act: 'code', fps: 8, time: [10, 22], path: DOOR, say: say(['code', 'ok', 'bug', 'coffee'], 7) }),
  spot(G.smith, GF, { act: 'hammer', face: 1, fps: 8, time: [8, 16] }),
  spot(276, G.balcony, {
    act: 'wizard',
    face: -1,
    fps: 8,
    path: TOWER,
    time: [8, 16],
    fx: { s: 'sparkle', kind: 'pop', every: 0.6, dx: S(14), dy: -S(15) },
  }),
  spot(182, UF, {
    n: 2,
    gap: S(34),
    acts: ['pongl', 'pongr'],
    fps: 8,
    path: UP,
    group: 'games',
    time: [14, 28],
    show: [prop('pong', 182, UF)],
  }),
  spot(344, G.pier[2], { act: 'fish', face: 1, fps: 4, time: [14, 30], say: say(['dots', 'heart', 'bang'], 9) }),
  spot(162, 203, {
    n: 2,
    gap: S(18),
    act: 'groove',
    fps: 8,
    time: [8, 16],
    fx: { s: 'heart', kind: 'rise', every: 1.4, dx: 0, dy: -S(15) },
  }),
  spot(161, GF, { n: 2, gap: S(19), act: 'read', fps: 4, path: DOOR, time: [10, 22], say: say(['idea', 'dots', 'star'], 9) }),
  spot(80, G.stage[2], { act: 'conduct', face: 1, fps: 8, time: [10, 20] }),
  // the house: the library, the workshop, the server room below; the game room and the lookout above
  spot(160, GF, { act: 'tidy', fps: 4, path: DOOR, time: [5, 9], w: 0.5 }),
  spot(189, GF, { act: 'pin', fps: 4, path: DOOR, time: [5, 10], w: 0.6 }),
  spot(198, GF, { act: 'mail', fps: 4, face: 1, path: DOOR, time: [4, 8], w: 0.4 }),
  spot(231, GF, { act: 'code', fps: 8, path: DOOR, time: [8, 18], say: say(['code', 'ok', 'bang'], 8) }),
  spot(245, GF, { act: 'debug', fps: 4, face: 1, path: DOOR, time: [6, 12], say: say(['bug', 'ok', 'ask'], 6) }),
  spot(164, UF, { act: 'arcade', fps: 4, face: 1, path: UP, group: 'games', time: [10, 20], say: say(['star', 'bang'], 8) }),
  spot(182, UF, {
    n: 3,
    gap: S(26),
    acts: ['ropel', 'jump', 'roper'],
    fps: 8,
    path: UP,
    group: 'games',
    time: [10, 20],
    show: [prop('rope', 182, UF)],
  }),
  spot(222 - 40, UF, {
    n: 2,
    gap: S(24),
    acts: ['towerl', 'towerr'],
    fps: 8 / 3,
    path: UP,
    group: 'games',
    time: [12, 18],
    show: [prop('tower', 182, UF, { fps: 8 / 3 })],
  }),
  spot(182, UF, { n: 4, gap: S(18), act: 'sleep', fps: 4, path: UP, group: 'games', time: [120, 300], w: 9, when: { h: [22, 7] } }),
  spot(236, UF, { act: 'web', fps: 1, path: UP, time: [8, 16], say: say(['sun', 'idea', 'star'], 8) }),
  // the village: the forge, the mine, the tower, the pond, the stage, the meadow, the fire, the garden, the sand
  spot(70, 175, { act: 'pick', face: -1, fps: 8, time: [6, 12], carry: 'carry' }),
  spot(G.mine, GF, { inside: true, time: [8, 20], carry: 'carry' }),
  spot(299, GF, { act: 'eureka', face: 1, fps: 4, time: [8, 16], fx: { s: 'bubble', kind: 'rise', every: 1.1, dx: S(9), dy: -S(12) } }),
  spot(G.fire[0], G.fire[1] - 1, { n: 2, gap: S(30), act: 'roast', fps: 2, time: [12, 24] }),
  spot(285, 204, { act: 'water', face: 1, fps: 8, time: [8, 14] }),
  spot(124, 182, { act: 'juggle', fps: 8, time: [6, 12], w: 0.7, say: say(['star'], 6) }),
  spot(100, 183, { act: 'sweep', face: 1, fps: 8, time: [6, 12], w: 0.6 }),
  spot(48, 182, { act: 'build', face: 1, fps: 8, time: [6, 12], w: 0.6 }),
  spot(140, 205, { act: 'dizzy', fps: 8, time: [3, 6], w: 0.3 }),
  spot(118, 181, { act: 'coffee', fps: 4, time: [5, 10], w: 0.5, say: say(['coffee', 'sun'], 5) }),
  spot(29, 201, { inside: true, act: 'dig', back: 'pop', fps: 8, time: [10, 30] }),
  spot(-20, 181, { inside: true, time: [8, 24], w: 0.6 }),
];
const props = [
  ...Object.keys(OCC).map(k => prop(k, OCC[k][0], OCC[k][1])),
  // the house: the screen's code, the terminal, the rack, the arcade, the globe, the window at night, a sparrow on the sill by day
  prop('monitor', 205, GF - 15, { fps: 4 }),
  prop('terminal', 226, GF - 14, { fps: 2 }),
  prop('leds', 242, GF - 17, { fps: 4 }),
  prop('invader', 145, UF - 16, { fps: 4 }),
  prop('globe', 237, UF - 9, { fps: 4 }),
  prop('nightwin', 227, UF - 19, { fps: 1, when: NIGHT }),
  prop('sparrow', 229, UF - 13, { fps: 6, when: { h: [7, 18] } }),
  prop('lamp-glow', G.door - 2, GF - 7, { pulse: 3.4, when: { h: [18, 7] } }),
  prop('lamp-glow', 158, GF - 1, { pulse: 4, when: { h: [18, 7] } }),
  // the village
  prop('fire', G.fire[0], G.fire[1], { fps: 8, front: true, fx: { s: 'ember', kind: 'rise', every: 0.45, dx: 0, dy: -S(12) } }),
  prop('forge-glow', 88.5, 170, { pulse: 1.4 }),
  prop('lamp-glow', G.lamp, 152, { pulse: 3.2 }),
  prop('flasks', 311, 165, { fps: 3 }),
  prop('choir', 106, G.stage[2], { fps: 3, fx: { s: 'note', kind: 'rise', every: 1.5, dx: 0, dy: -S(8) } }),
  prop('reeds', 372, 178, { fps: 1.5 }),
  prop('reeds', 383, 181, { fps: 1.2 }),
  ...[
    [344, 186, 4],
    [342, 194, 3],
    [347, 202, 5],
    [343, 210, 3.5],
  ].map(g => prop('glint', g[0], g[1], { fps: g[2] })),
  prop('swim', 366, 205, { fps: 2, bob: 1 }),
  prop('fishjump', 377, 197, { fps: 8, rest: 9 }),
  prop('butterfly', 184, 195, { fps: 6, bob: 2, when: DAY }),
  prop('butterfly', 306, 193, { fps: 5, bob: 2, when: DAY }),
  ...[
    [118, 186, 2.6],
    [240, 182, 3.2],
    [322, 169, 2.2],
    [60, 188, 3.6],
    [196, 186, 2.9],
    [354, 191, 2.4],
    [228, 200, 3],
  ].map(f => prop('firefly', f[0], f[1], { pulse: f[2], bob: 1, when: { h: [19, 6] } })),
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
  prop('emitter', 233.5, 98, { fx: { s: 'smoke', kind: 'float', every: 2.3, dx: 0, dy: 0 } }),
  prop('emitter', 38, 163, { fx: { s: 'sparkle', kind: 'pop', every: 1.8, dx: 0, dy: 0 } }),
  // the year: Halloween's pumpkins and bats, Christmas's fir and snow, the lanterns of the new year, leaves in autumn, petals in spring
  prop('pumpkin', G.door - 10, GF, { fps: 3, when: { d: ['10-15', '11-01'] } }),
  prop('pumpkin', 66, G.stage[2], { fps: 2, when: { d: ['10-15', '11-01'] } }),
  prop('pumpkin', 300, 205, { fps: 2.5, when: { d: ['10-15', '11-01'] } }),
  prop('fir', G.door - 12, GF, { fps: 1.5, when: { d: ['12-01', '12-31'] } }),
  prop('lantern', 150, UF - 25, { fps: 1, bob: 1, when: { d: ['01-20', '02-20'] } }),
  prop('lantern', 248, UF - 25, { fps: 1, bob: 1, when: { d: ['01-20', '02-20'] } }),
  ...[30, 110, 190, 270, 350].map(x =>
    prop('emitter', x, 112, { fx: { s: 'flake', kind: 'fall', every: 1.6, dx: 0, dy: 0 }, when: { d: ['12-01', '02-28'] } })
  ),
  ...[60, 160, 260].map(x =>
    prop('emitter', x, 140, { fx: { s: 'leaf', kind: 'fall', every: 2.4, dx: 0, dy: 0 }, when: { d: ['09-22', '11-30'] } })
  ),
  ...[80, 200, 320].map(x =>
    prop('emitter', x, 140, { fx: { s: 'petal', kind: 'fall', every: 2.6, dx: 0, dy: 0 }, when: { d: ['03-20', '05-31'] } })
  ),
];
const drift = [
  { s: 'cloud-c', y: S(109), speed: 7, dir: 1 },
  { s: 'cloud-a', y: S(103), speed: 9, dir: -1 },
  { s: 'cloud-b', y: S(98), speed: 6, dir: 1 },
  { s: 'balloon', y: S(110), speed: 11, dir: -1, bob: 2, when: DAY },
  { s: 'bird', y: S(99), speed: 38, dir: -1, fps: 5, bob: 1, when: DAY },
  { s: 'bird', y: S(104), speed: 33, dir: 1, fps: 6, bob: 1, when: DAY },
  { s: 'bat', y: S(100), speed: 40, dir: 1, fps: 6, bob: 2, when: { h: [18, 6], d: ['10-15', '11-01'] } },
  { s: 'bat', y: S(106), speed: 34, dir: -1, fps: 7, bob: 2, when: { h: [18, 6], d: ['10-15', '11-01'] } },
];
// the meadow's little ones (claude-clawd's subagents) and the pals (clawd-sidekick's), wandering about
const herds = [
  {
    count: 5,
    area: [S(124), S(197), S(236), S(212)],
    stand: 'mini',
    walk: 'mini-walk',
    acts: ['mini-cheer'],
    speed: 30,
    fx: { s: 'heart', kind: 'rise', every: 3, dx: 0, dy: -S(9) },
  },
  { count: 1, area: [S(96), S(178), S(306), S(185)], stand: 'cat', walk: 'cat-walk', speed: 24, when: DAY },
  { count: 1, area: [S(14), S(196), S(44), S(204)], stand: 'crab', walk: 'crab-walk', speed: 14 },
  { count: 1, area: [S(96), S(178), S(306), S(185)], stand: 'owl', walk: 'owl-walk', speed: 18, when: NIGHT },
];
// what happens now and then
const MEADOW = [190, 205];
const events = [
  // a game of volleyball in the meadow (clawd-sidekick's), by day
  {
    every: [90, 240],
    time: [40, 80],
    call: 2,
    when: { h: [8, 22] },
    spot: spot(MEADOW[0], MEADOW[1], {
      n: 2,
      gap: S(K.COURT),
      acts: ['volleyl', 'volleyr'],
      fps: 8,
      time: [600, 600],
      show: [prop('volley', MEADOW[0], MEADOW[1])],
    }),
  },
  // lunch on a picnic cloth at noon, tea at three (clawd-sidekick's crew keeps those hours)
  {
    every: [30, 90],
    time: [90, 180],
    call: 3,
    when: { h: [12, 14] },
    props: [prop('picnic', 182, 210)],
    spot: spot(182, 209, { n: 3, gap: S(21), act: 'eat', fps: 4, time: [600, 600] }),
  },
  {
    every: [30, 90],
    time: [60, 120],
    call: 2,
    when: { h: [15, 17] },
    props: [prop('tea', 182, 207)],
    spot: spot(182, 207, { n: 2, gap: S(22), act: 'sip', fps: 4, time: [600, 600] }),
  },
  // a party on the stage in the evening: fireworks and confetti
  {
    every: [300, 700],
    time: [40, 70],
    call: 4,
    when: { h: [18, 24] },
    props: [
      prop('fw-a', 90, 118, { fps: 8, rest: 3 }),
      prop('fw-b', 200, 112, { fps: 8, rest: 4 }),
      prop('fw-c', 300, 120, { fps: 8, rest: 3.5 }),
      ...[70, 100, 130].map(x => prop('emitter', x, 165, { fx: { s: 'confetti', kind: 'fall', every: 0.5, dx: 0, dy: 0 } })),
    ],
    spot: spot(94, G.stage[2], { n: 4, gap: S(14), acts: ['groove', 'cheer', 'groove', 'cheer'], fps: 8, time: [600, 600] }),
  },
  // a juggling show on the stage, two clapping
  {
    every: [200, 500],
    time: [30, 50],
    call: 3,
    when: { h: [9, 23] },
    spot: spot(92, G.stage[2], { n: 3, gap: S(17), acts: ['clap', 'juggle', 'clap'], fps: 8, time: [600, 600] }),
  },
  // a shower: a rain cloud, rain, and everyone runs inside
  {
    every: [700, 1600],
    time: [40, 70],
    call: 8,
    props: [
      prop('raincloud', 110, 118, { bob: 1 }),
      prop('raincloud', 260, 114, { bob: 1 }),
      ...[40, 90, 140, 190, 240, 290, 340].map(x =>
        prop('emitter', x, 150, { fx: { s: 'drop', kind: 'fall', every: 0.35, dx: 0, dy: 0 } })
      ),
    ],
    spot: spot(G.door + 3, GF, { n: 8, gap: 0, inside: true, path: DOOR, time: [600, 600] }),
  },
  // a flying saucer at night, and a crowd pointing at it
  {
    every: [600, 1500],
    time: [24, 36],
    call: 3,
    when: { h: [21, 5] },
    drift: [{ s: 'ufo', y: S(100), speed: 70, dir: 1, fps: 2 }],
    spot: spot(200, 205, { n: 3, gap: S(20), acts: ['wait', 'panic', 'ask'], fps: 8, time: [600, 600] }),
  },
  // a shower of shooting stars at night, wishes made
  {
    every: [400, 900],
    time: [30, 45],
    call: 3,
    when: { h: [21, 5] },
    props: [60, 150, 240, 330].map((x, i) => prop('shoot', x, 30 + (i % 2) * 18, { fps: 12, rest: 3 + i })),
    spot: spot(200, 206, { n: 3, gap: S(20), act: 'love', fps: 8, time: [600, 600] }),
  },
  // a deer comes to look from the bushes on the hill, by day
  { every: [300, 900], time: [24, 36], when: DAY, props: [prop('deer', 330, 172, { fps: 8 / 3 })] },
  // the server room overheats: panic, and someone with a magnifying glass
  {
    every: [900, 2000],
    time: [16, 26],
    call: 2,
    props: [prop('emitter', 246, GF - 18, { fx: { s: 'smoke', kind: 'float', every: 0.6, dx: 0, dy: 0 } })],
    spot: spot(238, GF, { n: 2, gap: S(14), acts: ['panic', 'debug'], fps: 8, path: DOOR, time: [600, 600] }),
  },
];
const world = {
  file: 'clawd.png',
  px: P.PX,
  sprites,
  crew: {
    count: 8,
    speed: 70,
    stand: 'stand',
    walk: 'walk',
    climb: 'climb',
    wave: 'wave',
    wait: 'wait',
    looks: LOOKS.length,
    bubble: S(14),
    lane: [S(G.lane), S(-30), S(314)],
    chat: {
      every: [12, 30],
      say: ['say-dots', 'say-heart', 'say-idea', 'say-ask', 'say-bang', 'say-note', 'say-star', 'say-coffee'],
      act: 'clap',
    },
  },
  spots,
  props,
  drift,
  herds,
  events,
  shade: [
    { color: '#06051a', alpha: 0.5, when: { h: [0, 5] } },
    { color: '#0b0a26', alpha: 0.38, when: { h: [21, 24] } },
    { color: '#1a1030', alpha: 0.18, when: { h: [5, 7] } },
  ],
};
// JSON as the other themes write it (one space), but a list of numbers and a little object on one line
function fmt(v, ind) {
  const pad = ' '.repeat(ind);
  if (Array.isArray(v)) {
    if (v.every(x => typeof x !== 'object' || (Array.isArray(x) && x.every(y => typeof y !== 'object'))))
      return JSON.stringify(v).replace(/,/g, ', ');
    return '[\n' + v.map(x => pad + ' ' + fmt(x, ind + 1)).join(',\n') + '\n' + pad + ']';
  }
  if (v && typeof v === 'object') {
    const flat = JSON.stringify(v);
    if (ind >= 3 && flat.length < 150) return flat.replace(/":/g, '": ').replace(/,"/g, ', "');
    return (
      '{\n' +
      Object.keys(v)
        .map(k => pad + ' ' + JSON.stringify(k) + ': ' + fmt(v[k], ind + 1))
        .join(',\n') +
      '\n' +
      pad +
      '}'
    );
  }
  return JSON.stringify(v);
}
function contact(dir) {
  const k = 3;
  let h = 10,
    w = 0;
  for (const s of SHEET) {
    h += (s.h * Math.min(2, s.rows.length) + 3) * k;
    w = Math.max(w, Math.min(12, s.rows[0].length) * (s.w + 2) * k);
  }
  const p = new Pic(w + 20, h + 10);
  p.rect(0, 0, p.w, p.h, '#3a3045');
  let y = 10;
  for (const s of SHEET) {
    s.rows.slice(0, 2).forEach((r, j) =>
      r.slice(0, 12).forEach((f, i) => {
        p.rect(10 + i * (s.w + 2) * k, y + j * s.h * k, s.w * k, s.h * k, '#4a405a');
        p.draw(f.scaled(k), 10 + i * (s.w + 2) * k, y + j * s.h * k);
      })
    );
    y += (s.h * Math.min(2, s.rows.length) + 3) * k;
  }
  fs.writeFileSync(path.join(dir, 'contact.png'), png(p, false));
}
if (require.main === module) {
  fs.writeFileSync(path.join(OUT, 'world.png'), png(P.backdrop().scaled(P.PX), false));
  const buf = png(atlas, true);
  fs.writeFileSync(path.join(OUT, 'clawd.png'), buf);
  const tf = path.join(OUT, 'theme.json'),
    t = JSON.parse(fs.readFileSync(tf, 'utf8'));
  t.effects = Object.assign(t.effects || {}, { wallpaper: 'world.png' });
  t.world = world;
  const json = fmt(t, 0) + '\n';
  fs.writeFileSync(tf, json);
  const i = process.argv.indexOf('--sheet');
  if (i > 0) contact(process.argv[i + 1]);
  console.log(
    'world.png, clawd.png (' +
      atlas.w +
      ' x ' +
      atlas.h +
      ', ' +
      Object.keys(sprites).length +
      ' sprites, ' +
      Math.round(buf.length / 1024) +
      ' KB) and theme.json (' +
      Math.round(json.length / 1024) +
      ' KB) written'
  );
}
