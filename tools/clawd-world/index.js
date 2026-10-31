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
const WD = require('./wind');
const L = require('./life');
const P = require('./place');
const HO = require('./holidays');
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
const LOOKS = K.CAPS.slice(0, 6),
  // after the everyday looks, the hats of the holidays (crew.hats): Halloween's, Christmas's, New Year's
  HATS = ['witch', 'santa', 'party', 'pilgrim', 'lunar', 'bunny'],
  ALL = LOOKS.concat(HATS);
function crew(name, step, looks) {
  const all = (looks === false ? [null] : ALL).map(lk => K.strip(name, lk, step));
  const b = K.bbox([].concat(...all));
  add(
    name,
    all.map(r => r.map(f => K.crop(f, b))),
    { looks: true, ax: K.OX + 8 - b.x0, ay: K.FEET + 1 - b.y0 }
  );
}
// burrowing: the Clawd sinks into a mound of sand and is gone; popping out is the same backwards
function dig(back) {
  const all = ALL.map(lk => {
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
add('reeds', WD.REEDS.still);
add('reeds-gust', WD.REEDS.gust);
add('choir', T.CHOIR);
add('swim', T.SWIM);
add('fishjump', T.FISHJ);
add('firefly', T.FIREFLY);
add('star2', T.STAR2);
add('shoot', T.SHOOT);
add('cloud-a', T.CLOUDA);
add('cloud-b', T.CLOUDB);
add('cloud-c', T.CLOUDC);
'abc'.split('').forEach((k, i) => add('cloud-d' + k, T.DAYCLOUDS[i]));
// the hours: the sky (with the scenery) and the ground (the meadow, the pond) by day and by night, over the backdrop, which is dusk
for (const k of ['day', 'night']) {
  add('sky-' + k, [P.SKIES[k].sky], { ax: 0, ay: 0 });
  add('ground-' + k, [P.SKIES[k].ground], { ax: 0, ay: 0 });
}
add('bird', T.BIRD);
add('balloon', T.BALLOON);
add('balloon-b', T.BALLOON, { pal: { B: '#4d8df6', L: '#8ab4f8', S: '#2f5fa8', G: '#24497f' } });
add('balloon-c', T.BALLOON, { pal: { B: '#4cb363', L: '#8ad49a', S: '#2e8b57', G: '#1f6b43' } });
'abc'.split('').forEach((k, i) => add('cloud-g' + k, T.GREYCLOUDS[i]));
// ---- more life (life.js): the crew's names, the pond's ducks and frog, the moon's phases, what grows and is built, the rare ones ----
const NAMES = ['BYTE', 'PIXEL', 'MOSS', 'NOVA', 'SPARK', 'SUNNY', 'MOCHI', 'TINK'];
NAMES.forEach(n => add('name-' + n.toLowerCase(), L.nameBubble(n), { ax: 3, ay: 9 }));
add('duck', L.DUCK, { pal: L.DK });
add('duck-swim', L.DUCK_SWIM, { pal: L.DK });
add('duck-dive', L.DUCK_DIVE, { pal: L.DK });
add('frog', L.FROG, { pal: L.FR });
add('frog-hop', L.FROG_HOP, { pal: L.FR });
add('shed', L.SHED);
add('sapling', L.SAPLING);
add('snowman', L.SNOWMAN, { pal: L.snowPal });
add('puddle', L.PUDDLE, { pal: L.puddlePal });
add('dragon', L.DRAGON);
add('golden', L.GOLDEN);
add('comet', L.COMET);
add('aurora', L.AURORA, { ax: 0, ay: 0 });
L.MIST.forEach((m, i) => add('mist-' + 'abc'[i], [m]));
// the holidays (holidays.js), and the dragon on its perch
add('dragon-perch', HO.DRAGON_PERCH, { ax: 16, ay: 23 });
add('xlights', HO.XLIGHTS, { ax: 0, ay: 0 });
add('wreath', HO.WREATH, { ax: 7, ay: 7 });
add('presents', HO.PRESENTS);
add('sleigh', HO.SLEIGH);
add('sleigh-park', HO.SLEIGH_PARK);
add('ghost', HO.GHOST);
add('cobweb', HO.COBWEB, { ax: 0, ay: 0 });
add('cobweb-r', HO.COBWEB_R, { ax: 10, ay: 0 });
add('turkey', HO.TURKEY);
add('turkey-walk', HO.TURKEY_WALK);
add('harvest', HO.HARVEST);
add('feast', HO.FEAST);
add('lanterns', HO.LANTERNS, { ax: 0, ay: 0 });
add('lion', HO.LION);
add('cracker', HO.CRACKER);
add('shamrock', HO.SHAMROCK);
add('gold', HO.GOLD);
HO.EGGS.forEach((e, i) => add('egg-' + 'abcd'[i], e));
add('fw-d', T.burst('#E5484D', '#F6EFE4'));
add('fw-e', T.burst('#4D8DF6', '#F6EFE4'));
L.ROCKETS.forEach((r, i) => add('rocket-' + 'abc'[i], r));
// the year and the weather over the land (place.js): snow, the trees of autumn and spring, fog, a rainbow
const SE = P.SEASONS;
add('snow-ground', [SE.snow.ground.pic], { ax: 0, ay: 0 });
add('snow-caps', [SE.snow.caps.pic], { ax: 0, ay: 0 });
for (const k of ['autumn', 'spring', 'fog', 'overcast', 'rainbow']) add(k, [SE[k].pic], { ax: 0, ay: 0 });
add('butterfly', T.BUTTERFLY);
add('lamp-glow', T.GLOW(9, '#ffd27a'));
add('forge-glow', T.GLOW(8, '#ff8a3a'));
add('flasks', T.FLASKS);
add('emitter', T.DOT);
// the night sky: the stars and the moon on their layer, the moon's glow, a star that flares
add('starfield', [P.STARFIELD], { ax: 0, ay: 0 });
add('moon-glow', L.MOON_GLOW, { ax: 13, ay: 13 });
add('moon', L.MOON, { ax: 12, ay: 12 });
add('twinkle', WD.TWINKLE);
// the wind: what sways as a gust goes over it (still, and the gust's frames: the same size and anchor), the flag on the house, the
// pond's ripples and a petal carried away
const sway = (name, x, o) => {
  add(name, x.still, o);
  add(name + '-gust', x.gust, o);
};
sway('garden', WD.GARDEN, { ax: 0, ay: 9 });
'abc'.split('').forEach((k, i) => {
  sway('tuft-' + k, WD.TUFTS[i]);
  sway('bloom-' + k, WD.BLOOMS[i]);
});
sway('flag', WD.FLAG, { ax: 0, ay: 7 });
sway('bunting', WD.BUNTING, { ax: 0, ay: 0 });
[3, 2.5, 2].forEach((r, i) => sway('pad-' + 'abc'[i], WD.PADS[i], { ax: Math.ceil(r) + 1, ay: Math.ceil(r) + 2 }));
add('ripple', WD.RIPPLE, { pal: WD.ripplePal });
add('blossom', WD.BLOSSOM);
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
// [x, y, w, h, frames, ax, ay, looks], without what is the default at its end (the anchor in the middle of the bottom edge, one look)
for (const s of SHEET) {
  const r = [s.x, s.y, s.w, s.h, s.rows[0].length, s.ax, s.ay, s.rows.length],
    def = [, , , , , Math.floor(s.w / 2), s.h, 1];
  while (r.length > 5 && r[r.length - 1] === def[r.length - 1]) r.pop();
  sprites[s.name] = r;
}

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
// the sky wheels: PAN art pixels to the left over 8 minutes, and back
const SKY = [-S(P.PAN), 480];
// the hours of the day: the day's sky from 7 to 6 in the evening, the night's from 9 to 5; dusk and dawn are the backdrop's own, and
// the stars are out from 6 in the evening to 7 in the morning
// winter, the green months, the fair days a butterfly flies
const WINTER = { d: ['12-01', '02-29'] },
  GREEN = { d: ['03-01', '11-30'] },
  FLUTTER = { h: [7, 21], d: ['03-15', '10-31'], w: ['sun', 'cloud', 'wind'] };
const DAYTIME = { h: [7, 18] },
  NIGHTTIME = { h: [21, 5] },
  STARRY = { h: [18, 7] };
// the holidays: Halloween all October; November Thanksgiving and Christmas both; Christmas all December (its lights, fir and wreath
// from November to Twelfth Night); New Year's Eve and Day; the Lunar New Year (two days before it to the Lantern Festival), Valentine's
// week, St Patrick's, Easter week, the Fourth of July, the Mid-Autumn Festival
const HALLOWEEN = { d: ['10-01', '10-31'] },
  NOVEMBER = { d: ['11-01', '11-30'] },
  XMAS = { d: ['12-01', '12-31'] },
  XMAS_DECO = { d: ['11-01', '01-06'] },
  NEWYEAR = { d: ['12-31', '01-01'] },
  LUNAR = { near: ['lunar', -2, 15] },
  VALENTINE = { d: ['02-07', '02-14'] },
  PATRICK = { d: ['03-14', '03-17'] },
  EASTER = { near: ['easter', -6, 1] },
  JULY4 = { d: ['07-01', '07-04'] },
  MIDAUTUMN = { near: ['midautumn', -2, 1] };
// a grey day (clouds, rain, snow: the sky veiled, grey clouds) and a fair one (white clouds by day)
const GREY = ['cloud', 'rain', 'snow'],
  FAIR = { h: [7, 18], w: ['sun', 'cloud', 'wind'] },
  MISTY = { h: [6, 12], w: ['fog'] };
const DAY = { h: [7, 21] },
  NIGHT = { h: [21, 6] },
  GF = G.street,
  UF = G.upper;
const spots = [
  // the screenshot shows the first ones (still mode puts the crew there in this order)
  spot(210, GF, { act: 'code', fps: 8, time: [10, 22], path: DOOR, tag: 'code', say: say(['code', 'ok', 'bug', 'coffee'], 7) }),
  spot(G.smith, GF, { act: 'hammer', face: 1, fps: 8, time: [8, 16], tag: 'craft' }),
  spot(276, G.balcony, {
    act: 'wizard',
    face: -1,
    fps: 8,
    path: TOWER,
    time: [8, 16],
    tag: 'magic',
    fx: { s: 'sparkle', kind: 'pop', every: 0.6, dx: S(14), dy: -S(15) },
  }),
  spot(182, UF, {
    n: 2,
    gap: S(34),
    acts: ['pongl', 'pongr'],
    fps: 8,
    path: UP,
    group: 'games',
    tag: 'games',
    time: [14, 28],
    show: [prop('pong', 182, UF)],
  }),
  spot(344, G.pier[2], { act: 'fish', face: 1, fps: 4, time: [14, 30], tag: 'outdoors', say: say(['dots', 'heart', 'bang'], 9) }),
  spot(162, 203, {
    n: 2,
    gap: S(18),
    act: 'groove',
    fps: 8,
    time: [8, 16],
    tag: 'show',
    fx: { s: 'heart', kind: 'rise', every: 1.4, dx: 0, dy: -S(15) },
  }),
  spot(161, GF, { n: 2, gap: S(19), act: 'read', fps: 4, path: DOOR, time: [10, 22], tag: 'cozy', say: say(['idea', 'dots', 'star'], 9) }),
  spot(80, G.stage[2], { act: 'conduct', face: 1, fps: 8, time: [10, 20], tag: 'show' }),
  // the house: the library, the workshop, the server room below; the game room and the lookout above
  spot(160, GF, { act: 'tidy', fps: 4, path: DOOR, time: [5, 9], w: 0.5, tag: 'cozy' }),
  spot(189, GF, { act: 'pin', fps: 4, path: DOOR, time: [5, 10], w: 0.6, tag: 'code' }),
  spot(198, GF, { act: 'mail', fps: 4, face: 1, path: DOOR, time: [4, 8], w: 0.4, tag: 'cozy' }),
  spot(231, GF, { act: 'code', fps: 8, path: DOOR, time: [8, 18], tag: 'code', say: say(['code', 'ok', 'bang'], 8) }),
  spot(245, GF, { act: 'debug', fps: 4, face: 1, path: DOOR, time: [6, 12], tag: 'code', say: say(['bug', 'ok', 'ask'], 6) }),
  spot(164, UF, { act: 'arcade', fps: 4, face: 1, path: UP, group: 'games', tag: 'games', time: [10, 20], say: say(['star', 'bang'], 8) }),
  spot(182, UF, {
    n: 3,
    gap: S(26),
    acts: ['ropel', 'jump', 'roper'],
    fps: 8,
    path: UP,
    group: 'games',
    tag: 'games',
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
    tag: 'games',
    time: [12, 18],
    show: [prop('tower', 182, UF, { fps: 8 / 3 })],
  }),
  spot(182, UF, {
    n: 4,
    gap: S(18),
    act: 'sleep',
    fps: 4,
    path: UP,
    group: 'games',
    tag: 'cozy',
    time: [120, 300],
    w: 9,
    when: { h: [22, 7] },
  }),
  spot(236, UF, {
    n: 2,
    gap: S(14),
    act: 'sleep',
    fps: 4,
    path: UP,
    group: 'lookout',
    tag: 'cozy',
    time: [120, 300],
    w: 9,
    when: { h: [22, 7] },
  }),
  spot(236, UF, { act: 'web', fps: 1, path: UP, group: 'lookout', tag: 'magic', time: [8, 16], say: say(['sun', 'idea', 'star'], 8) }),
  // the village: the forge, the mine, the tower, the pond, the stage, the meadow, the fire, the garden, the sand
  spot(70, 175, { act: 'pick', face: -1, fps: 8, time: [6, 12], carry: 'carry', tag: 'craft' }),
  spot(G.mine, GF, { inside: true, time: [8, 20], carry: 'carry', tag: 'craft' }),
  spot(299, GF, {
    act: 'eureka',
    face: 1,
    fps: 4,
    time: [8, 16],
    tag: 'magic',
    fx: { s: 'bubble', kind: 'rise', every: 1.1, dx: S(9), dy: -S(12) },
  }),
  spot(G.fire[0], G.fire[1] - 1, { n: 2, gap: S(30), act: 'roast', fps: 2, time: [12, 24], tag: 'outdoors' }),
  spot(285, 204, { act: 'water', face: 1, fps: 8, time: [8, 14], tag: 'outdoors' }),
  spot(124, 182, { act: 'juggle', fps: 8, time: [6, 12], w: 0.7, tag: 'show', say: say(['star'], 6) }),
  spot(100, 183, { act: 'sweep', face: 1, fps: 8, time: [6, 12], w: 0.6, tag: 'craft' }),
  // the builder at the shed that goes up over the week
  spot(41, 200, { act: 'build', face: 1, fps: 8, time: [8, 16], w: 0.8, tag: 'craft' }),
  spot(140, 205, { act: 'dizzy', fps: 8, time: [3, 6], w: 0.3, tag: 'show' }),
  spot(118, 181, { act: 'coffee', fps: 4, time: [5, 10], w: 0.5, tag: 'cozy', say: say(['coffee', 'sun'], 5) }),
  spot(29, 201, { inside: true, act: 'dig', back: 'pop', fps: 8, time: [10, 30], tag: 'outdoors' }),
  spot(-20, 181, { inside: true, time: [8, 24], w: 0.6 }),
];
const props = [
  // the day's sky with the sun high and the land in daylight, the night's deep one; each fades in and out over five minutes
  prop('sky-day', 0, 0, { under: true, when: DAYTIME, fade: 300 }),
  prop('ground-day', 0, P.SKIES.ground, { under: true, when: DAYTIME, fade: 300 }),
  prop('sky-night', 0, 0, { under: true, when: NIGHTTIME, fade: 300 }),
  prop('ground-night', 0, P.SKIES.ground, { under: true, when: NIGHTTIME, fade: 300 }),
  // the year over the land: snow in winter, the trees red in autumn and in blossom in spring (by day); a bank of fog some mornings
  prop('snow-ground', SE.snow.ground.x, SE.snow.ground.y, { under: true, when: WINTER, fade: 600 }),
  prop('autumn', SE.autumn.x, SE.autumn.y, { under: true, when: { h: [5, 21], d: ['09-22', '11-30'] }, fade: 300 }),
  prop('spring', SE.spring.x, SE.spring.y, { under: true, when: { h: [5, 21], d: ['03-20', '05-31'] }, fade: 300 }),
  prop('overcast', SE.overcast.x, SE.overcast.y, { under: true, when: { h: [6, 20], w: GREY }, fade: 300 }),
  prop('fog', SE.fog.x, SE.fog.y, { under: true, when: MISTY, fade: 900 }),
  ...Object.keys(OCC).map(k => prop(k, OCC[k][0], OCC[k][1])),
  prop('snow-caps', SE.snow.caps.x, SE.snow.caps.y, { when: WINTER, fade: 600 }),
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
  prop('reeds', 372, 178, { fps: 1.5, gust: 'reeds-gust' }),
  prop('reeds', 383, 181, { fps: 1.2, gust: 'reeds-gust' }),
  ...[
    [344, 186, 4],
    [342, 194, 3],
    [347, 202, 5],
    [343, 210, 3.5],
  ].map(g => prop('glint', g[0], g[1], { fps: g[2], when: { h: [7, 21] } })),
  prop('swim', 366, 205, { fps: 2, bob: 1 }),
  prop('fishjump', 377, 197, { fps: 8, rest: 9 }),
  prop('butterfly', 184, 195, { fps: 6, bob: 2, when: FLUTTER }),
  prop('butterfly', 306, 193, { fps: 5, bob: 2, when: FLUTTER }),
  ...[
    [118, 186, 2.6],
    [240, 182, 3.2],
    [322, 169, 2.2],
    [60, 188, 3.6],
    [196, 186, 2.9],
    [354, 191, 2.4],
    [228, 200, 3],
  ].map(f => prop('firefly', f[0], f[1], { pulse: f[2], bob: 1, when: { h: [19, 6], d: ['04-15', '10-15'] } })),
  // the night sky, under the clouds: the stars and the moon wheel slowly to and fro, the bright stars twinkling as they go and a glow
  // breathing round the moon; other stars flare now and then, and a star shoots across
  prop('starfield', 0, 0, { under: true, pan: SKY, when: STARRY, fade: 240 }),
  prop('moon-glow', G.moon[0], G.moon[1], { under: true, pan: SKY, pulse: 6, phase: 'moon', when: STARRY, fade: 240 }),
  prop('moon', G.moon[0], G.moon[1], { under: true, pan: SKY, phase: 'moon', when: STARRY, fade: 240 }),
  ...P.BIG.map(([x, y], i) =>
    prop('star2', x, y + 2, { under: true, pan: SKY, pulse: [3, 2.4, 3.8, 2.8, 3.3, 2.2, 3.5, 2.6][i], when: STARRY, fade: 240 })
  ),
  ...P.TWINKLES.map(([x, y], i) => prop('twinkle', x, y + 3, { under: true, fps: 8, rest: 4 + (i % 5) * 1.4, when: STARRY })),
  prop('shoot', 140, 40, { fps: 12, rest: 35, under: true, when: STARRY }),
  // the wind: the flag on the house's roof, the bunting over the stage, the garden's flowers, tufts of grass and flowers in the meadow, the
  // lily pads; and rings spreading on the pond now and then
  prop('flag', 199, 99, { fps: 4, gust: 'flag-gust' }),
  prop('bunting', G.stage[0], G.stage[2] - 22, { gust: 'bunting-gust' }),
  prop('garden', 297, 204, { gust: 'garden-gust', when: GREEN }),
  ...[
    [8, 213],
    [44, 214],
    [57, 214],
    [130, 214],
    [151, 193],
    [175, 215],
    [214, 193],
    [247, 214],
    [251, 201],
    [281, 214],
    [296, 214],
  ].map(([x, y], i) => prop('tuft-' + 'abc'[i % 3], x, y, { gust: 'tuft-' + 'abc'[i % 3] + '-gust' })),
  ...[
    [22, 192],
    [100, 213],
    [128, 191],
    [196, 214],
    [231, 205],
    [268, 212],
  ].map(([x, y], i) => prop('bloom-' + 'abc'[i % 3], x, y, { gust: 'bloom-' + 'abc'[i % 3] + '-gust', when: GREEN })),
  ...[
    [370, 196],
    [330, 206],
    [378, 210],
  ].map(([x, y], i) => prop('pad-' + 'abc'[i], x, y, { gust: 'pad-' + 'abc'[i] + '-gust' })),
  ...[
    [334, 197, 7],
    [358, 212, 9],
    [372, 189, 11],
  ].map(([x, y, r]) => prop('ripple', x, y, { fps: 5, rest: r })),
  // a frog on a lily pad that hops now and then; a shed that goes up over the week, a tree that grows through the month; a snowman in
  // winter; puddles in the street on a day of rain
  prop('frog', 330, 206, { fps: 1.5, play: { s: 'frog-hop', every: 16, fps: 8 } }),
  prop('shed', 54, 200, { phase: 'week' }),
  prop('sapling', 240, 214, { phase: 'month' }),
  prop('snowman', 132, 214, { fps: 0.5, when: { d: ['12-08', '02-20'] }, fade: 60 }),
  ...[92, 222, 296].map((x, i) => prop('puddle', x, 186, { fps: 3 + i, when: { w: ['rain'] }, fade: 120 })),
  prop('emitter', 85.5, 111, { fx: { s: 'smoke', kind: 'float', every: 1.7, dx: 0, dy: 0 } }),
  prop('emitter', 233.5, 98, { fx: { s: 'smoke', kind: 'float', every: 2.3, dx: 0, dy: 0 } }),
  prop('emitter', 38, 163, { fx: { s: 'sparkle', kind: 'pop', every: 1.8, dx: 0, dy: 0 } }),
  // the year: Halloween's pumpkins and cobwebs; Thanksgiving's harvest; Christmas's lights along the eaves, a wreath round the round
  // window, the fir and presents under it; red lanterns along the eaves at the Lunar New Year and the Mid-Autumn Festival, and
  // firecrackers; hearts on Valentine's; shamrocks on St Patrick's; painted eggs at Easter; leaves in autumn, petals in spring
  prop('pumpkin', G.door - 10, GF, { fps: 3, when: HALLOWEEN }),
  prop('pumpkin', 66, G.stage[2], { fps: 2, when: HALLOWEEN }),
  prop('pumpkin', 300, 205, { fps: 2.5, when: HALLOWEEN }),
  prop('cobweb', 141, UF - 22, { when: HALLOWEEN }),
  prop('cobweb-r', 259, UF - 22, { when: HALLOWEEN }),
  prop('cobweb', 77, 134, { when: HALLOWEEN }),
  prop('harvest', 138, 206, { when: NOVEMBER }),
  prop('xlights', 133, 123, { fps: 1.2, when: XMAS_DECO }),
  prop('wreath', 200, 112, { when: XMAS_DECO }),
  prop('fir', G.door - 12, GF, { fps: 1.5, when: XMAS_DECO }),
  prop('presents', G.door - 12, GF, { when: XMAS }),
  prop('lanterns', 133, 123, { fps: 0.8, when: LUNAR }),
  prop('lanterns', 133, 123, { fps: 0.8, when: MIDAUTUMN }),
  ...[150, 250].map(x => prop('emitter', x, 166, { fx: { s: 'cracker', kind: 'pop', every: 2.2, dx: 0, dy: 0 }, when: LUNAR })),
  ...[170, 232, 300].map(x => prop('emitter', x, 150, { fx: { s: 'heart', kind: 'rise', every: 2.5, dx: 0, dy: 0 }, when: VALENTINE })),
  ...[
    [104, 210],
    [160, 202],
    [226, 211],
    [262, 204],
    [318, 210],
  ].map(([x, y]) => prop('shamrock', x, y, { when: PATRICK })),
  ...[
    [96, 209, 'a'],
    [128, 203, 'b'],
    [168, 212, 'c'],
    [205, 201, 'd'],
    [236, 210, 'a'],
    [276, 203, 'c'],
    [300, 212, 'b'],
    [320, 202, 'd'],
  ].map(([x, y, k]) => prop('egg-' + k, x, y, { when: EASTER })),
  ...[30, 110, 190, 270, 350].map(x =>
    prop('emitter', x, 112, { fx: { s: 'flake', kind: 'fall', every: 1.6, dx: 0, dy: 0 }, when: { w: ['snow'] } })
  ),
  ...[60, 160, 260].map(x =>
    prop('emitter', x, 140, { fx: { s: 'leaf', kind: 'fall', every: 2.4, dx: 0, dy: 0 }, when: { d: ['09-22', '11-30'] } })
  ),
  ...[80, 200, 320].map(x =>
    prop('emitter', x, 140, { fx: { s: 'petal', kind: 'fall', every: 2.6, dx: 0, dy: 0 }, when: { d: ['03-20', '05-31'] } })
  ),
];
const drift = [
  // clouds lit pink from below from dusk to dawn (dimmed by the night's tint), white by day
  { s: 'cloud-c', y: S(109), speed: 7, dir: 1, when: STARRY, fade: 120 },
  { s: 'cloud-a', y: S(103), speed: 9, dir: -1, when: STARRY, fade: 120 },
  { s: 'cloud-b', y: S(98), speed: 6, dir: 1, when: STARRY, fade: 120 },
  { s: 'cloud-dc', y: S(106), speed: 8, dir: 1, when: FAIR, fade: 120 },
  { s: 'cloud-da', y: S(100), speed: 10, dir: -1, when: FAIR, fade: 120 },
  { s: 'cloud-db', y: S(95), speed: 6, dir: 1, when: FAIR, fade: 120 },
  { s: 'balloon', y: S(110), speed: 11, dir: -1, bob: 2, when: { h: [7, 21], w: ['sun', 'cloud', 'wind'] } },
  // wisps of mist drifting over the mountains on a morning of fog, behind the roof and the tower
  { s: 'mist-a', y: S(118), speed: 9, dir: 1, when: MISTY, fade: 900 },
  { s: 'mist-b', y: S(111), speed: 7, dir: -1, when: MISTY, fade: 900 },
  { s: 'mist-c', y: S(123), speed: 11, dir: -1, when: MISTY, fade: 900 },
  // grey clouds on a grey day
  { s: 'cloud-ga', y: S(97), speed: 5, dir: 1, when: { h: [6, 20], w: GREY }, fade: 300 },
  { s: 'cloud-gb', y: S(104), speed: 7, dir: -1, when: { h: [6, 20], w: GREY }, fade: 300 },
  { s: 'cloud-gc', y: S(92), speed: 4, dir: 1, when: { h: [6, 20], w: GREY }, fade: 300 },
  { s: 'bird', y: S(99), speed: 38, dir: -1, fps: 5, bob: 1, when: DAY },
  { s: 'bird', y: S(104), speed: 33, dir: 1, fps: 6, bob: 1, when: DAY },
  { s: 'bat', y: S(100), speed: 40, dir: 1, fps: 6, bob: 2, when: { h: [18, 6], d: HALLOWEEN.d } },
  { s: 'bat', y: S(106), speed: 34, dir: -1, fps: 7, bob: 2, when: { h: [18, 6], d: HALLOWEEN.d } },
  // Halloween's ghosts, floating by at night
  { s: 'ghost', y: S(140), speed: 14, dir: 1, fps: 3, bob: 3, when: { h: [19, 6], d: HALLOWEEN.d } },
  { s: 'ghost', y: S(160), speed: 11, dir: -1, fps: 3, bob: 3, when: { h: [19, 6], d: HALLOWEEN.d } },
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
  // two ducks paddling about the pond, diving now and then
  { count: 2, area: [S(336), S(192), S(378), S(212)], stand: 'duck', walk: 'duck-swim', acts: ['duck-dive'], speed: 10 },
  // a turkey strutting about the meadow in November
  { count: 1, area: [S(150), S(200), S(230), S(212)], stand: 'turkey', walk: 'turkey-walk', speed: 16, when: NOVEMBER },
];
// what happens now and then
const MEADOW = [190, 205];
// a shower: rain clouds, rain, and everyone runs inside (followed by the rainbow)
const SHOWER = o =>
  Object.assign(
    {
      every: [700, 1600],
      time: [40, 70],
      call: 8,
      rain: true,
      props: [
        prop('raincloud', 110, 118, { bob: 1 }),
        prop('raincloud', 260, 114, { bob: 1 }),
        ...[40, 115, 190, 265, 340].map(x => prop('emitter', x, 150, { fx: { s: 'drop', kind: 'fall', every: 0.28, dx: 0, dy: 0 } })),
      ],
      spot: spot(G.door + 3, GF, { n: 8, gap: 0, inside: true, path: DOOR, time: [600, 600] }),
    },
    o
  );
const events = [
  // a game of volleyball in the meadow (clawd-sidekick's), by day
  {
    every: [150, 420],
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
  // lunch on a picnic cloth, tea for two (any time of the day: a world of its own keeps its own hours)
  {
    every: [1200, 3600],
    time: [90, 180],
    call: 3,
    when: { h: [9, 20] },
    props: [prop('picnic', 182, 210)],
    spot: spot(182, 209, { n: 3, gap: S(21), act: 'eat', fps: 4, time: [600, 600] }),
  },
  {
    every: [1200, 3600],
    time: [60, 120],
    call: 2,
    when: { h: [9, 22] },
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
  // a shower: rain clouds, rain, and everyone runs inside (often on a day of rain, and on any day by the green key); after it, by
  // day, a rainbow
  SHOWER({ every: [90, 300], when: { w: ['rain'] }, key: 'green', title: 'Rain shower' }),
  // a flying saucer at night, and a crowd pointing at it
  {
    every: [900, 2400],
    time: [24, 36],
    call: 3,
    when: { h: [21, 5] },
    title: 'Flying saucer',
    drift: [{ s: 'ufo', y: S(100), speed: 70, dir: 1, fps: 2 }],
    spot: spot(200, 205, { n: 3, gap: S(20), acts: ['wait', 'panic', 'ask'], fps: 8, time: [600, 600] }),
  },
  // a shower of shooting stars at night, wishes made
  {
    every: [600, 1500],
    time: [30, 45],
    call: 3,
    when: { h: [21, 5] },
    props: [60, 150, 240, 330].map((x, i) => prop('shoot', x, 30 + (i % 2) * 18, { fps: 12, rest: 3 + i, under: true })),
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
  // ---- their routine, at any hour: stretches and coffee in the meadow, marshmallows round the campfire, songs and stories ----
  {
    every: [1200, 3600],
    time: [120, 240],
    call: 6,
    when: { h: [6, 23] },
    spot: spot(MEADOW[0], MEADOW[1], {
      n: 6,
      gap: S(16),
      acts: ['stretch', 'stretch', 'sip', 'stretch', 'coffee', 'stretch'],
      fps: 4,
      time: [900, 900],
      say: say(['sun', 'coffee', 'heart'], 8),
    }),
  },
  {
    every: [1200, 3600],
    time: [240, 420],
    call: 6,
    spot: spot(G.fire[0], G.fire[1] - 1, {
      n: 6,
      gap: S(12),
      acts: ['roast', 'clap', 'roast', 'sip', 'roast', 'clap'],
      fps: 4,
      time: [900, 900],
      say: say(['note', 'heart', 'star', 'idea'], 7),
    }),
  },
  // ---- rare ones: a dragon at dusk, a golden Clawd by day, the northern lights on a winter night, a comet, a festival of balloons ----
  {
    every: [900, 2400],
    chance: 0.15,
    time: [46, 54],
    call: 3,
    title: 'Dragon',
    when: { h: [7, 23] },
    drift: [
      {
        s: 'dragon',
        y: S(106),
        speed: 80,
        dir: -1,
        fps: 6,
        bob: 2,
        // it lands on top of the mine's rock, sits, looks about, roars a jet of flame, stretches, and flies off
        perch: {
          x: S(24),
          y: S(111),
          s: 'dragon-perch',
          fps: 5,
          time: [9, 12],
          fx: { s: 'ember', kind: 'rise', every: 1.4, dx: S(20), dy: -S(19) },
        },
      },
    ],
    spot: spot(95, 208, { n: 3, gap: S(16), acts: ['wait', 'panic', 'love'], fps: 8, time: [600, 600] }),
  },
  {
    every: [1200, 3600],
    chance: 0.25,
    time: [40, 46],
    call: 4,
    when: { h: [7, 21] },
    title: 'Golden Clawd',
    drift: [{ s: 'golden', y: S(G.lane), speed: 150, dir: 1, fps: 10 }],
    spot: spot(160, 191, { n: 4, gap: S(16), acts: ['cheer', 'love', 'clap', 'cheer'], fps: 8, time: [600, 600] }),
  },
  {
    every: [900, 2400],
    chance: 0.12,
    time: [180, 300],
    when: { h: [21, 4], d: ['11-01', '03-15'] },
    props: [prop('aurora', 70, 4, { under: true, fps: 1, fade: 30 })],
  },
  {
    every: [1800, 5400],
    chance: 0.15,
    time: [300, 320],
    when: { h: [21, 5] },
    drift: [{ s: 'comet', y: S(35), speed: 7, dir: -1, fps: 3 }],
  },
  {
    every: [1800, 4800],
    chance: 0.3,
    time: [110, 120],
    when: { h: [9, 17], w: ['sun'] },
    title: 'Balloon festival',
    drift: [
      { s: 'balloon', y: S(100), speed: 22, dir: 1, bob: 2 },
      { s: 'balloon-b', y: S(108), speed: 26, dir: 1, bob: 2 },
      { s: 'balloon-c', y: S(112), speed: 18, dir: 1, bob: 2 },
      { s: 'balloon-b', y: S(104), speed: 30, dir: 1, bob: 1 },
    ],
  },
  // ---- the holidays' ----
  // Christmas nights: Santa's sleigh comes by, lands on the roof a moment (Santa waves) and flies on
  {
    every: [1200, 3600],
    time: [36, 46],
    call: 4,
    when: { h: [18, 6], d: XMAS.d },
    drift: [
      {
        s: 'sleigh',
        y: S(104),
        speed: 110,
        dir: 1,
        fps: 6,
        bob: 1,
        perch: { x: S(240), y: S(115), s: 'sleigh-park', fps: 2, time: [7, 10] },
      },
    ],
    spot: spot(MEADOW[0], MEADOW[1], { n: 4, gap: S(18), acts: ['love', 'cheer', 'love', 'clap'], fps: 8, time: [600, 600] }),
  },
  // Thanksgiving: the feast at the long table in the meadow, everyone round it (November)
  {
    every: [1200, 3600],
    time: [120, 200],
    call: 6,
    when: { h: [9, 22], d: NOVEMBER.d },
    props: [prop('feast', 190, 214, { fps: 1.5, front: true })],
    spot: spot(190, 206, { n: 6, gap: S(9), act: 'eat', fps: 4, time: [600, 600], say: say(['heart', 'star'], 6) }),
  },
  // New Year's Eve: rockets at midnight and the crowd counting down
  {
    every: [120, 300],
    time: [60, 90],
    call: 6,
    when: { h: [22, 2], d: NEWYEAR.d },
    props: [
      [60, 106, 'a', 2.2],
      [150, 112, 'b', 2.6],
      [250, 108, 'c', 2.4],
      [350, 118, 'a', 2.8],
    ].map(([x, y, k, rest]) => prop('rocket-' + k, x, y, { fps: 12, rest, fade: 0 })),
    spot: spot(MEADOW[0], MEADOW[1], {
      n: 6,
      gap: S(16),
      acts: ['cheer', 'love', 'clap', 'cheer', 'love', 'clap'],
      fps: 8,
      time: [600, 600],
    }),
  },
  // the Lunar New Year: a lion dances down the street to drums, firecrackers pop
  {
    every: [900, 2400],
    time: [70, 90],
    call: 5,
    when: { h: [8, 22], near: LUNAR.near },
    drift: [{ s: 'lion', y: S(185), speed: 26, dir: 1, fps: 6 }],
    props: [120, 170, 220, 270].map(x => prop('emitter', x, 168, { fx: { s: 'cracker', kind: 'pop', every: 0.5, dx: 0, dy: 0 } })),
    spot: spot(170, 207, { n: 5, gap: S(14), acts: ['cheer', 'clap', 'cheer', 'clap', 'cheer'], fps: 8, time: [600, 600] }),
  },
  // St Patrick's Day: a rainbow with a pot of gold at its end
  {
    every: [900, 2400],
    time: [60, 90],
    call: 3,
    when: { h: [8, 18], d: PATRICK.d },
    props: [prop('rainbow', SE.rainbow.x, SE.rainbow.y, { under: true, fade: 6 }), prop('gold', 323, 152, { fps: 1.5 })],
    spot: spot(300, 207, { n: 3, gap: S(16), acts: ['cheer', 'love', 'cheer'], fps: 8, time: [600, 600] }),
  },
  // Easter: an egg hunt in the meadow
  {
    every: [900, 2400],
    time: [60, 120],
    call: 4,
    when: { h: [8, 19], near: EASTER.near },
    spot: spot(MEADOW[0], 208, {
      n: 4,
      gap: S(34),
      acts: ['cheer', 'love', 'clap', 'cheer'],
      fps: 8,
      time: [600, 600],
      say: say(['heart', 'star'], 5),
    }),
  },
  // the Fourth of July: red, white and blue fireworks at night
  {
    every: [180, 420],
    time: [60, 90],
    call: 5,
    when: { h: [21, 24], d: JULY4.d },
    props: [
      prop('fw-d', 70, 116, { fps: 8, rest: 2.2 }),
      prop('fw-e', 150, 108, { fps: 8, rest: 2.6 }),
      prop('fw-d', 250, 112, { fps: 8, rest: 2.4 }),
      prop('fw-e', 330, 118, { fps: 8, rest: 2.9 }),
      prop('fw-a', 200, 104, { fps: 8, rest: 3.3 }),
    ],
    spot: spot(MEADOW[0], MEADOW[1], { n: 5, gap: S(18), acts: ['love', 'cheer', 'clap', 'cheer', 'love'], fps: 8, time: [600, 600] }),
  },
  // the Mid-Autumn Festival: tea under the full moon in the meadow, the lanterns lit
  {
    every: [900, 2400],
    time: [120, 240],
    call: 4,
    when: { h: [19, 24], near: MIDAUTUMN.near },
    props: [prop('tea', 190, 207)],
    spot: spot(190, 207, { n: 4, gap: S(22), acts: ['sip', 'love', 'sip', 'love'], fps: 4, time: [600, 600] }),
  },
  // ---- the coloured keys of the remote: red, fireworks with everyone watching from the meadow; yellow, a dance party on the stage;
  // blue, a flurry of snow (green is the shower, above) ----
  {
    every: [600, 600],
    chance: 0,
    key: 'red',
    title: 'Fireworks',
    time: [40, 60],
    call: 6,
    // rockets rise from just over the rooftops and burst high in the sky (the apps are out of the way while it lasts)
    props: [
      [40, 104, 'a', 2],
      [85, 104, 'c', 2.4],
      [120, 120, 'b', 2.2],
      [160, 109, 'c', 1.9],
      [240, 110, 'a', 2.5],
      [300, 88, 'b', 2.1],
      [345, 124, 'a', 2.3],
      [372, 116, 'c', 2.6],
    ].map(([x, y, k, rest]) => prop('rocket-' + k, x, y, { fps: 12, rest, fade: 0 })),
    spot: spot(MEADOW[0], MEADOW[1], {
      n: 6,
      gap: S(16),
      acts: ['love', 'cheer', 'clap', 'love', 'cheer', 'clap'],
      fps: 8,
      time: [600, 600],
      say: say(['star', 'heart', 'bang'], 4),
    }),
  },
  {
    every: [600, 600],
    chance: 0,
    key: 'yellow',
    title: 'Dance party',
    time: [40, 60],
    call: 6,
    props: [70, 100, 130].map(x => prop('emitter', x, 165, { fx: { s: 'confetti', kind: 'fall', every: 0.45, dx: 0, dy: 0 } })),
    spot: spot(92, G.stage[2], {
      n: 6,
      gap: S(10),
      acts: ['groove', 'cheer', 'groove', 'groove', 'cheer', 'groove'],
      fps: 8,
      time: [600, 600],
      say: say(['note', 'heart'], 4),
    }),
  },
  {
    every: [600, 600],
    chance: 0,
    key: 'blue',
    title: 'Snow flurry',
    time: [40, 60],
    call: 5,
    props: [30, 90, 150, 210, 270, 330].map(x => prop('emitter', x, 112, { fx: { s: 'flake', kind: 'fall', every: 0.5, dx: 0, dy: 0 } })),
    spot: spot(MEADOW[0], MEADOW[1], { n: 5, gap: S(18), acts: ['love', 'cheer', 'love', 'cheer', 'love'], fps: 8, time: [600, 600] }),
  },
  // after a shower (by day): a rainbow behind the village
  {
    every: [600, 600],
    chance: 0,
    time: [90, 150],
    when: { h: [7, 18] },
    props: [prop('rainbow', SE.rainbow.x, SE.rainbow.y, { under: true, fade: 10 })],
  },
];
// the showers say which one follows them: the rainbow, the last
events.forEach(e => {
  if (e.rain) {
    delete e.rain;
    e.then = events.length - 1;
  }
});
const world = {
  file: 'clawd.png',
  px: P.PX,
  // after a minute and a half on Home without a key, only the village
  watch: 1.5,
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
    // the holidays' hats (looks after the six caps): a witch's for Halloween week, Santa's in December, a party hat at New Year
    // the holidays' hats (the looks after the six everyday ones: witch, Santa, party, pilgrim, the Lunar New Year's, bunny ears), the
    // first that fits: Santa's all December, party hats on New Year's Day, pilgrims' and Santa's in turn in November, the witch's all
    // October; on Valentine's week red caps, on St Patrick's green ones, on the Fourth of July red and blue in turn
    hats: [
      { look: LOOKS.length + 1, when: XMAS },
      { look: LOOKS.length + 2, when: { d: ['01-01', '01-01'] } },
      { looks: [LOOKS.length + 3, LOOKS.length + 1], when: NOVEMBER },
      { look: LOOKS.length, when: HALLOWEEN },
      { look: LOOKS.length + 4, when: LUNAR },
      { look: LOOKS.length + 5, when: EASTER },
      { look: 4, when: VALENTINE },
      { look: 2, when: PATRICK },
      { looks: [4, 1], when: JULY4 },
    ],
    // the eight and what each likes best: Byte codes, Pixel games, Moss is outdoors, Nova at magic, Spark makes things, Sunny shows
    // off, Mochi is cosy, Tink tinkers
    members: [
      { name: 'name-byte', likes: ['code'] },
      { name: 'name-pixel', likes: ['games'] },
      { name: 'name-moss', likes: ['outdoors'] },
      { name: 'name-nova', likes: ['magic'] },
      { name: 'name-spark', likes: ['craft'] },
      { name: 'name-sunny', likes: ['show'] },
      { name: 'name-mochi', likes: ['cozy'] },
      { name: 'name-tink', likes: ['craft', 'games'] },
    ],
    hello: ['say-heart', 'say-star', 'say-sun'],
  },
  spots,
  props,
  drift,
  herds,
  events,
  shade: [
    // a grey day: a little dimmer
    { color: '#4a5266', alpha: 0.16, when: { h: [7, 18], w: ['cloud', 'rain', 'fog', 'snow'] } },
    { color: '#06051a', alpha: 0.5, when: { h: [0, 5] } },
    { color: '#0b0a26', alpha: 0.38, when: { h: [21, 24] } },
    { color: '#1a1030', alpha: 0.18, when: { h: [5, 7] } },
  ],
  // the weather of the day, the same all day: mostly fair; clouds, wind, rain or fog now and then, snow often in winter
  weather: [
    { name: 'sun', w: 64 },
    { name: 'cloud', w: 12 },
    { name: 'wind', w: 9 },
    { name: 'rain', w: 9, when: { d: ['03-01', '11-30'] } },
    { name: 'fog', w: 6 },
    { name: 'snow', w: 30, when: { d: ['12-01', '02-29'] } },
    // and a white Christmas, nearly always
    { name: 'snow', w: 900, when: { d: ['12-24', '12-25'] } },
  ],
  // a gust from the left every 14 to 36 seconds (every few on a windy day), across the screen in about five, petals carried off
  wind: [
    { every: [4, 9], speed: 560, dir: 1, fps: 12, fx: { s: 'blossom', kind: 'blow', every: 1, dx: 0, dy: -S(5) }, when: { w: ['wind'] } },
    { every: [14, 36], speed: 460, dir: 1, fps: 10, fx: { s: 'blossom', kind: 'blow', every: 1, dx: 0, dy: -S(5) } },
  ],
};
// JSON as the other themes write it (one space), but a list of numbers and a little object on one line, as tight as JSON goes; the
// world itself one entry a line and nothing it does not need (it is big: the theme stays under 32 KB, what services before 64 KB take)
function fmt(v, ind) {
  const pad = ' '.repeat(ind);
  if (Array.isArray(v)) {
    if (v.every(x => typeof x !== 'object' || (Array.isArray(x) && x.every(y => typeof y !== 'object')))) return JSON.stringify(v);
    return '[\n' + v.map(x => pad + ' ' + fmt(x, ind + 1)).join(',\n') + '\n' + pad + ']';
  }
  if (v && typeof v === 'object') {
    const flat = JSON.stringify(v);
    if (ind >= 3 && flat.length < 150) return flat;
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
// the world without what is its default anyway (no shift of a particle, a drift to the right, the every of the wind's particles)
function lean(w) {
  const fx = f => {
    if (!f) return;
    if (f.dx === 0) delete f.dx;
    if (f.dy === 0) delete f.dy;
  };
  const props = l => (l || []).forEach(p => fx(p.fx));
  props(w.props);
  w.spots.forEach(s => {
    fx(s.fx);
    props(s.show);
  });
  w.drift.forEach(d => d.dir === 1 && delete d.dir);
  w.herds.forEach(h => fx(h.fx));
  w.events.forEach(e => {
    props(e.props);
    (e.drift || []).forEach(d => d.dir === 1 && delete d.dir);
    if (e.spot) {
      fx(e.spot.fx);
      props(e.spot.show);
    }
  });
  w.wind.forEach(x => {
    fx(x.fx);
    delete x.fx.every;
    if (x.dir === 1) delete x.dir;
  });
  // one that comes only after another or by its key is never due
  w.events.forEach(e => e.chance === 0 && delete e.every);
  return w;
}
function fmtWorld(w) {
  return (
    '{\n' +
    Object.keys(w)
      .map(k => {
        const v = w[k];
        if (k === 'sprites')
          return (
            '"sprites":{\n' +
            Object.keys(v)
              .map(n => JSON.stringify(n) + ':' + JSON.stringify(v[n]))
              .join(',\n') +
            '\n}'
          );
        if (Array.isArray(v) && v.length > 1 && v[0] && typeof v[0] === 'object')
          return JSON.stringify(k) + ':[\n' + v.map(x => JSON.stringify(x)).join(',\n') + '\n]';
        return JSON.stringify(k) + ':' + JSON.stringify(v);
      })
      .join(',\n') +
    '\n}'
  );
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
  t.world = 0;
  const json = fmt(t, 0).replace(/"world": 0/, '"world": ' + fmtWorld(lean(world))) + '\n';
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
