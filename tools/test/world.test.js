// The world of a theme on Home (app/src/js/world.js), run without a browser: a few fake elements, Math.random seeded so a run is the
// same every time, and a clock that the test moves on (the hour of the day with it).
// First the Claude theme's world over an hour of a morning on Halloween: everyone starts at a spot of their own in their own cap, they
// keep to the street, the doors and the ladders, a game's table is only there while all its players are at it, events come and go,
// bubbles are said, the night's things and the tint come at night, the stars wheel slowly under the clouds, gusts of wind sway what
// grows, the focus makes them hop, and nothing moves while Home is hidden.
// Then small worlds made here, one for each rule: a game waits for its players and breaks up together; one game at a time in a room;
// an event calls the crew and stops when Home is hidden; inside spots and spots at some hours; the wind and props that pan; a chat in
// the street; a herd.
const fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const { root, ok, run } = require('./lib');

// ---- just enough of a page: elements with a class, a style (each transform kept), children, an image that loads ----
function El(tag) {
  const self = this;
  this.tagName = tag;
  this.children = [];
  this.parentNode = null;
  this.className = '';
  this.id = '';
  this.moves = [];
  const style = {};
  let tf = '';
  Object.defineProperty(style, 'transform', {
    get: () => tf,
    set: v => {
      tf = v;
      self.moves.push(v);
      if (El.onMove) El.onMove(self, v);
    },
  });
  this.style = style;
  this.classList = {
    add: c => {
      if (!self.classList.contains(c)) self.className = (self.className + ' ' + c).trim();
    },
    remove: c => {
      self.className = self.className
        .split(' ')
        .filter(x => x && x !== c)
        .join(' ');
    },
    contains: c => self.className.split(' ').indexOf(c) >= 0,
  };
}
El.prototype.appendChild = function (c) {
  if (c.parentNode) c.parentNode.removeChild(c);
  c.parentNode = this;
  this.children.push(c);
  return c;
};
El.prototype.removeChild = function (c) {
  const i = this.children.indexOf(c);
  if (i >= 0) this.children.splice(i, 1);
  c.parentNode = null;
  return c;
};
El.prototype.insertBefore = function (c, ref) {
  if (c.parentNode) c.parentNode.removeChild(c);
  const i = ref ? this.children.indexOf(ref) : -1;
  c.parentNode = this;
  if (i < 0) this.children.push(c);
  else this.children.splice(i, 0, c);
  return c;
};
Object.defineProperty(El.prototype, 'nextSibling', {
  get() {
    const p = this.parentNode;
    return p ? p.children[p.children.indexOf(this) + 1] || null : null;
  },
});
Object.defineProperty(El.prototype, 'firstChild', {
  get() {
    return this.children[0] || null;
  },
});
const all = (el, cls, out) => {
  out = out || [];
  for (const c of el.children) {
    if (c.classList.contains(cls)) out.push(c);
    all(c, cls, out);
  }
  return out;
};
// a repeatable Math.random (mulberry32)
function seeded(n) {
  return () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const src = fs.readFileSync(path.join(root, 'app', 'src', 'js', 'world.js'), 'utf8');
// a page with the world script in it, its clock starting at `start` (ms, local time)
function page(seed, start) {
  let now = start;
  const timers = [];
  const add = (at, fn) => {
    let lo = 0,
      hi = timers.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (timers[mid].at <= at) lo = mid + 1;
      else hi = mid;
    }
    timers.splice(lo, 0, { at, fn });
  };
  const body = new El('body'),
    head = new El('head'),
    wall = new El('div');
  wall.id = 'wall';
  body.appendChild(wall);
  const M = Object.create(Math);
  M.random = seeded(seed);
  function D(t) {
    return new Date(t === undefined ? now : t);
  }
  D.now = () => now;
  const sandbox = {
    document: { body, head, hidden: false, createElement: tag => new El(tag) },
    API: 'http://tv',
    $: id => (id === 'wall' ? wall : null),
    Image: function () {
      const im = this;
      im.naturalWidth = 1201;
      im.naturalHeight = 908;
      Object.defineProperty(im, 'src', { set: () => add(now, () => im.onload && im.onload()) });
    },
    setTimeout: (fn, ms) => add(now + (ms || 0), fn),
    Date: D,
    Math: M,
    JSON,
  };
  vm.runInNewContext(src, sandbox, { filename: 'world.js' });
  const pg = {
    WORLD: sandbox.WORLD,
    body,
    head,
    wall,
    timers,
    now: () => now,
    box: () => body.children.filter(c => c.id === 'world')[0],
    // the clock moves on and the timers that are due run in order; each() is called every `step` ms of it
    advance(ms, step, each) {
      const end = now + ms;
      let next = step ? now + step : Infinity;
      for (;;) {
        const due = timers.length && timers[0].at <= end ? timers[0].at : Infinity;
        if (next <= end && next <= due) {
          now = next;
          each();
          next += step;
          continue;
        }
        if (due === Infinity) break;
        const x = timers.shift();
        now = Math.max(now, x.at);
        x.fn();
      }
      now = end;
    },
    // the clock jumps (the TV was in standby): everything that was due runs at the new time
    jump(ms) {
      now += ms;
      pg.advance(0);
    },
  };
  return pg;
}
// what a piece shows: the sprite (and its look) whose place in the sheet its strip is at
function namer(w) {
  const by = {};
  for (const k of Object.keys(w.sprites)) {
    const s = w.sprites[k];
    for (let lk = 0; lk < s[7]; lk++) by[-s[0] * w.px + 'px ' + -(s[1] + lk * s[3]) * w.px + 'px'] = { name: k, look: lk };
  }
  return el => {
    const st = all(el, 'wo-s')[0];
    return (st && by[st.style.backgroundPosition]) || { name: '', look: -1 };
  };
}
const xy = v => {
  const r = /translate\((-?\d+)px,(-?\d+)px\)/.exec(v || '');
  return r ? [+r[1], +r[2]] : null;
};
const places = s => {
  const out = [];
  for (let k = 0; k < s.n; k++) out.push([Math.round(s.x + (k - (s.n - 1) / 2) * s.gap), s.y]);
  return out;
};
const same = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];
const crewOf = b => b.children.filter(c => c.classList.contains('wo-m') && !c.classList.contains('wo-h'));
const minisOf = b => b.children.filter(c => c.classList.contains('wo-h'));
const propsOf = b => b.children.filter(c => c.classList.contains('wo') && !c.classList.contains('wo-m') && !c.classList.contains('wo-f'));
const shown = el => el.style.display !== 'none';
const themes = require(path.join(root, 'helper', 'themeschema.js'));
const claudeDir = path.join(root, 'themes', 'claude');
// a world made here, with the Claude theme's sheet (sprites at made-up places: nothing is drawn)
function made(o) {
  const sprites = {
    stand: [0, 0, 16, 16, 2, 8, 16, 2],
    walk: [0, 40, 16, 16, 4, 8, 16, 2],
    climb: [0, 80, 16, 16, 2, 8, 16],
    wave: [0, 100, 16, 16, 2, 8, 16],
    wait: [0, 120, 16, 16, 2, 8, 16],
    play: [0, 140, 16, 16, 4, 8, 16],
    work: [0, 160, 16, 16, 4, 8, 16],
    dig: [0, 180, 16, 16, 4, 8, 16],
    table: [100, 0, 32, 16, 4, 16, 16],
    banner: [100, 20, 32, 16, 2, 16, 16],
    'say-hi': [100, 40, 8, 8, 1, 4, 8],
    mini: [100, 50, 8, 8, 1, 4, 8],
    'mini-walk': [100, 60, 8, 8, 2, 4, 8],
    gusty: [100, 70, 16, 16, 8, 8, 16],
  };
  const crew = Object.assign(
      { count: 2, speed: 80, stand: 'stand', walk: 'walk', climb: 'climb', wave: 'wave', wait: 'wait', lane: [820, 0, 1920] },
      o.crew
    ),
    raw = { name: 'made', world: Object.assign({ file: 'clawd.png', px: 4, sprites }, o, { crew }) };
  return themes.resolve(themes.normalize(raw, 'made', null, claudeDir)).world;
}
const HALLOWEEN = new Date(2026, 9, 31, 10, 0, 0).getTime();

run(async () => {
  // ================= the Claude theme's world =================
  const raw = JSON.parse(fs.readFileSync(path.join(claudeDir, 'theme.json'), 'utf8'));
  const w = themes.resolve(themes.normalize(raw, 'claude', null, claudeDir)).world;
  ok(
    !!w && w.crew.count === 8 && w.crew.looks === 6 && !!w.crew.lane && !!w.crew.chat && w.spots.length >= 25 && w.props.length >= 50,
    "the Claude theme's world resolves: a crew of 8 in 6 caps, a street, chats, its spots and props"
  );
  ok(w.herds.length === 4 && w.events.length >= 8 && w.shade.length === 3, 'and its herds, events and the tint of the night');
  const name = namer(w);
  const pg = page(7, HALLOWEEN);
  pg.WORLD.apply(w, 1);
  ok(!pg.box(), 'nothing is drawn before the sprite sheet has loaded');
  pg.advance(1);
  const b = pg.box();
  ok(!!b && pg.body.children.indexOf(b) === pg.body.children.indexOf(pg.wall) + 1, 'the world is drawn right above the wallpaper');
  ok(
    pg.head.children.length === 1 && /@keyframes wo-hop1/.test(pg.head.children[0].textContent),
    'the keyframes in whole art pixels are added'
  );
  ok(
    all(b, 'wo-s').every(s => /^url\("http:\/\/tv\/api\/theme\/world\/claude\/clawd\.png"\)$/.test(s.style.backgroundImage)),
    'the pieces show the sprite sheet from the service'
  );
  const crew = crewOf(b),
    minis = minisOf(b);
  ok(
    crew.length === 8 && minis.length === w.herds.reduce((n, h) => n + h.count, 0) && all(b, 'wo-d').length === w.drift.length,
    'every member of the crew, every little one of the herds and everything that drifts is there'
  );
  ok(
    crew.every((m, i) => {
      const n = name(m);
      return n.name && (w.sprites[n.name][7] > 1 ? n.look === i % 6 : n.look === 0);
    }),
    'each Clawd shows its own look (cap) of what it does'
  );
  // everyone starts at a place of its own in a spot that is open at ten in the morning: not inside, not the dormitory (22 to 7)
  const open = w.spots.filter(s => !s.inside && !(s.when && s.when.h && 10 < s.when.h[0] && 10 >= s.when.h[1])),
    openPlaces = [].concat.apply([], open.map(places)),
    start = crew.map(m => xy(m.style.transform));
  ok(
    start.every(p => openPlaces.some(q => same(p, q))) && start.every((p, i) => start.findIndex(q => same(p, q)) === i),
    'each Clawd starts at a place of its own in a spot open at this hour'
  );
  ok(
    crew.every(m => /^\d+$/.test(m.style.zIndex)) && all(b, 'wo-f').length === 0,
    'the crew are stacked by how far down they stand, and no particle is there yet'
  );
  // Halloween at ten in the morning: the pumpkins and the day's things, not the night's, Christmas's or the new year's; no tint
  const vis = n =>
    propsOf(b)
      .filter(e => name(e).name === n)
      .map(shown);
  ok(vis('pumpkin').length === 3 && vis('pumpkin').every(Boolean), 'the pumpkins are out on Halloween');
  ok(
    vis('fir').every(v => !v) && vis('lantern').every(v => !v) && vis('nightwin').every(v => !v) && vis('firefly').every(v => !v),
    'the fir (December), the lanterns (new year), the night window and the fireflies are not'
  );
  ok(
    vis('sparrow').every(Boolean) && vis('butterfly').length === 2 && vis('butterfly').every(Boolean),
    'the sparrow and the butterflies are'
  );
  const mini = n => minis.filter(m => name(m).name === n || name(m).name === n + '-walk');
  ok(mini('cat').every(shown) && mini('owl').every(m => !shown(m)), 'the cat is out by day, the owl is not');
  const shade = b.children.filter(c => c.classList.contains('wo-sh'))[0];
  ok(!!shade && shade.style.opacity === '0', 'no tint by day');

  // the night sky wheels slowly: the starfield, the moon's glow and the bright stars drift together, one px at a time, under the clouds
  const pans = propsOf(b).filter(e => /^wo-pan/.test(e.style.animation || '')),
    firstDrift = b.children.indexOf(all(b, 'wo-d')[0]);
  ok(
    pans.length === w.props.filter(p => p.pan).length &&
      pans.some(e => name(e).name === 'starfield') &&
      pans.every(e => e.style.animation === pans[0].style.animation) &&
      /^wo-pan-240 480\.000s steps\(240\) -[\d.]+s infinite alternate$/.test(pans[0].style.animation),
    'the stars, the moon and the bright stars drift together, one px at a time, to and fro (' + pans.length + ' props)'
  );
  ok(
    pans.every(e => String(e.style.zIndex) === '0' && b.children.indexOf(e) < firstDrift),
    'the sky is under everything else of the world: under the clouds that drift over it'
  );
  const gusty = propsOf(b).filter(e => {
    const n = name(e).name;
    return w.props.some(p => p.s === n && p.gust);
  });
  ok(gusty.length >= 20, 'what sways in the wind is there: the flowers, the grass, the reeds, the flag, the bunting, the lily pads');

  // ---- an hour of the morning, looked at every half second ----
  const lane = w.crew.lane,
    allSpots = w.spots.concat(w.events.filter(e => e.spot).map(e => e.spot)),
    ways = [].concat.apply(
      [],
      allSpots.map(s => s.path.concat(places(s)))
    ),
    games = w.spots.filter(s => s.show.length);
  let off = [],
    climbs = 0,
    badClimbs = 0,
    maxParts = 0,
    maxTimers = 0,
    tableWrong = 0,
    waitWrong = 0,
    tables = {},
    seen = {},
    bubbles = 0,
    inside = 0,
    miniOut = 0;
  let sways = 0,
    swayed = new Set();
  const last = new Map(),
    said = new Map();
  El.onMove = (el, v) => {
    if (crew.indexOf(el) < 0) return;
    const p = xy(v),
      q = last.get(el),
      n = name(el).name;
    last.set(el, p);
    seen[n] = 1;
    if (!p) return;
    const onLane = p[1] === lane[0] && p[0] >= lane[1] && p[0] <= lane[2];
    if (!onLane && !ways.some(r => same(r, p))) off.push(v);
    if (n === w.crew.climb && q) {
      climbs++;
      if (q[0] !== p[0]) badClimbs++;
    }
  };
  crew.forEach(m => last.set(m, xy(m.style.transform)));
  pg.advance(3600 * 1000, 500, () => {
    maxParts = Math.max(maxParts, all(b, 'wo-f').length);
    maxTimers = Math.max(maxTimers, pg.timers.length);
    const ps = propsOf(b);
    for (const e of ps) seen['prop:' + name(e).name] = 1;
    for (const m of crew) {
      if (m.children[0].classList.contains('wo-g')) inside++;
      seen[name(m).name] = 1;
    }
    // a new bubble: its animation starts over under the other name
    for (const q of all(b, 'wo-q'))
      if (/^wo-say[12] /.test(q.style.animation || '') && /^say-/.test(name(q).name) && said.get(q) !== q.style.animation) {
        said.set(q, q.style.animation);
        bubbles++;
      }
    // a game's table, rope or tower is there only while every player is at its place, playing
    for (const s of games) {
      const pr = s.show[0],
        on = ps.some(e => name(e).name === pr.s && e.style.left === pr.x + 'px' && e.style.top === pr.y + 'px'),
        pl = places(s);
      if (on) tables[pr.s] = (tables[pr.s] || 0) + 1;
      pl.forEach((p, k) => {
        const there = crew.filter(m => same(xy(m.style.transform), p) && [w.crew.walk, w.crew.climb, 'carry'].indexOf(name(m).name) < 0);
        if (on && !(there.length === 1 && [s.acts[k] || s.act, w.crew.wave].indexOf(name(there[0]).name) >= 0)) tableWrong++;
        if (!on && there.some(m => name(m).name !== w.crew.wait && name(m).name !== w.crew.wave)) waitWrong++;
      });
    }
    // a gust: what sways shows its gust's frames for a moment, then its own again
    for (const e of gusty) {
      const n = name(e).name,
        on = /-gust$/.test(n);
      if (on && !swayed.has(e)) sways++;
      if (on) swayed.add(e);
      else swayed.delete(e);
    }
    for (const m of minis) {
      const h = w.herds.filter(x => name(m).name.indexOf(x.stand) === 0)[0],
        p = xy(m.style.transform),
        g = 12 * w.px;
      if (h && p && (p[0] < h.area[0] - g || p[0] > h.area[2] + g || p[1] < h.area[1] || p[1] > h.area[3])) miniOut++;
    }
  });
  El.onMove = null;
  ok(
    !off.length,
    'they keep to the street, the ways in (doors, ladders) and the places of the spots' + (off.length ? ': ' + off.slice(0, 3) : '')
  );
  ok(climbs > 0 && !badClimbs, 'they climb the ladders upstairs and onto the tower, straight up and down (' + climbs + ' climbs)');
  ok(seen.carry && inside > 0, 'they go into the mine and come back with a cart');
  ok(
    Object.keys(tables).length >= 2,
    'they play the games upstairs, with the table, the rope or the tower out (' + Object.keys(tables) + ')'
  );
  ok(!tableWrong, "a game's table is there only while all its players are at it, playing (" + tableWrong + ' times not)');
  ok(!waitWrong, 'a player at a game waits (crew.wait) until the others are there (' + waitWrong + ' times not)');
  ok(bubbles > 100, 'they say things in bubbles (' + bubbles + ' in an hour)');
  ok(seen['prop:volley'] || seen['prop:raincloud'] || seen['prop:deer'], 'an event comes in an hour: volleyball, a shower or a deer');
  ok(maxParts > 0 && maxParts <= 36, 'spots and props give off particles, never more than 36 at a time (' + maxParts + ')');
  ok(maxTimers < 400, 'the timers do not pile up (' + maxTimers + ' at most)');
  ok(!miniOut, 'the little ones keep to their areas');
  ok(
    sways > gusty.length * 40 && gusty.every(e => !/-gust$/.test(name(e).name) || swayed.has(e)),
    'gusts of wind come every half minute or so and everything that grows sways (' + sways + ' sways in an hour)'
  );
  ok(
    crew.some(m => /^transform [\d.]+s steps\(\d+\)$/.test(m.style.transition)),
    'a walk is a transition in whole art pixels (steps), not a script moving them every frame'
  );

  // the focus moves: one that is walking hops
  const isWalking = m => name(m).name === w.crew.walk && !m.children[0].classList.contains('wo-g');
  let walking = crew.filter(isWalking);
  for (let i = 0; i < 60 && !walking.length; i++) {
    pg.advance(500);
    walking = crew.filter(isWalking);
  }
  pg.WORLD.poke();
  ok(
    walking.length > 0 && walking.every(m => /^wo-hop[12] /.test(m.children[0].style.animation || '')),
    'a Clawd that is walking hops when the focus moves'
  );

  // at eleven at night: the fireflies, the night window, the owl, the bats of Halloween and the tint; no sparrow, no cat
  pg.jump(new Date(2026, 9, 31, 23, 0, 0).getTime() - pg.now());
  pg.advance(61000);
  ok(
    vis('firefly').every(Boolean) && vis('nightwin').every(Boolean) && vis('sparrow').every(v => !v),
    'the fireflies and the night window at night'
  );
  ok(mini('owl').every(shown) && mini('cat').every(m => !shown(m)), 'the owl is out at night, the cat is in');
  const bats = all(b, 'wo-d').filter(d => name(d).name === 'bat');
  ok(bats.length === 2 && bats.every(shown), 'bats fly at night on Halloween');
  ok(shade.style.opacity === '0.38' && shade.style.backgroundColor === '#0b0a26', 'the night tints the backdrop');

  // Home is hidden: nobody moves, the particles go; Home is back: everyone is at a spot again, and someone waves
  pg.WORLD.hidden();
  ok(all(b, 'wo-f').length === 0, 'the particles go when Home is hidden');
  crew.concat(minis).forEach(m => (m.moves = []));
  pg.advance(600000);
  ok(
    crew.concat(minis).every(m => m.moves.length === 0),
    'nobody moves while Home is hidden'
  );
  pg.WORLD.shown();
  const back = crew.map(m => xy(m.style.transform)),
    allPlaces = [].concat.apply([], w.spots.map(places));
  ok(
    back.every(p => allPlaces.some(q => same(p, q))),
    'when Home is back everyone is at a spot again'
  );
  ok(crew.filter(m => name(m).name === w.crew.wave).length >= 1, 'one or two of them wave when Home comes back');

  // the same world again: not drawn again; animations off: everyone stands still at a spot
  pg.WORLD.apply(JSON.parse(JSON.stringify(w)), 1);
  pg.advance(1);
  ok(pg.box() === b, 'the same world applied again is left as it is');
  pg.WORLD.apply(w, 0);
  pg.advance(1);
  const still = crewOf(pg.box());
  still.forEach(m => (m.moves = []));
  pg.advance(60000);
  ok(
    pg.box() !== b && still.every(m => m.moves.length === 0) && all(pg.box(), 'wo-s').every(s => s.style.animation === 'none'),
    'with the animations off (effects.speed 0) the world is drawn still'
  );
  pg.WORLD.apply(null, 1);
  ok(!pg.box() && pg.head.children.length === 0, 'a theme without a world takes it away');

  // still (the preview's screenshot): the first spots in order, a game with its table
  const pv = page(3, HALLOWEEN);
  pv.WORLD.apply(w, 1);
  pv.advance(1);
  pv.WORLD.still();
  const pvCrew = crewOf(pv.box()).map(m => xy(m.style.transform)),
    first = [].concat.apply([], w.spots.slice(0, 7).map(places)).slice(0, 8);
  ok(
    pvCrew.every((p, i) => same(p, first[i])),
    'still: the crew at the first spots, in order'
  );
  ok(
    propsOf(pv.box()).some(e => name(e).name === w.spots[3].show[0].s),
    'still: the game among them has its table out'
  );

  // ================= small worlds, one for each rule =================
  // a game for two with a table: one who comes first waits, the table comes with the second, they play the spot's time and leave together
  {
    const gw = made({
      spots: [
        { x: 960, y: 800, n: 2, gap: 120, acts: ['play', 'play'], fps: 8, time: [20, 30], show: [{ s: 'table', x: 960, y: 800 }] },
        { x: 300, y: 800, act: 'work', time: [4, 8] },
        { x: 1600, y: 800, act: 'work', time: [4, 8] },
        { x: 1300, y: 800, act: 'work', time: [4, 8] },
      ],
      herds: [{ count: 3, area: [100, 700, 500, 780], stand: 'mini', walk: 'mini-walk', speed: 40 }],
    });
    const nm = namer(gw),
      g = page(11, HALLOWEEN);
    g.WORLD.apply(gw, 1);
    g.advance(1);
    const gb = g.box(),
      gc = crewOf(gb),
      pl = places(gw.spots[0]);
    let on = false,
      since = 0,
      shortest = 1e9,
      ups = 0,
      wrong = 0,
      waited = 0,
      gone = -1,
      lingered = 0;
    g.advance(1800 * 1000, 250, () => {
      const t = propsOf(gb).filter(e => nm(e).name === 'table'),
        at = gc.map(m => pl.findIndex(p => same(xy(m.style.transform), p))),
        standing = gc.filter((m, i) => at[i] >= 0 && ['walk', 'climb'].indexOf(nm(m).name) < 0);
      if (t.length > 1) wrong++;
      if (t.length && !on) {
        on = true;
        ups++;
        since = g.now();
      } else if (!t.length && on) {
        on = false;
        shortest = Math.min(shortest, g.now() - since);
        gone = g.now();
      }
      if (on && !(standing.length === 2 && standing.every(m => ['play', 'wave'].indexOf(nm(m).name) >= 0))) wrong++;
      if (!on && standing.some(m => nm(m).name !== 'wait' && nm(m).name !== 'wave')) wrong++;
      if (!on && standing.length === 1) waited++;
      if (!on && gone >= 0 && g.now() - gone > 3500 && g.now() - gone < 4000 && standing.length) lingered++;
    });
    ok(ups >= 5, 'a game for two: the table comes out when both players are there (' + ups + ' games in half an hour)');
    ok(!wrong, 'the table is there only while both are at it, playing; one there alone waits (crew.wait)');
    ok(waited > 0, 'the first one there waits for the other');
    ok(shortest >= 19000, 'they play at least the spot’s time once both are there (' + Math.round(shortest / 1000) + ' s at least)');
    ok(!lingered, 'when one leaves the game, the other goes too');
    const gm = minisOf(gb);
    ok(gm.length === 3 && gm.every(m => m.moves.length > 3), 'the little ones of a herd wander about');
  }
  // one game at a time in a room (group): never someone at both
  {
    const rw = made({
      crew: { count: 3 },
      spots: [
        { x: 500, y: 800, act: 'play', group: 'room', time: [4, 8] },
        { x: 800, y: 800, act: 'play', group: 'room', time: [4, 8] },
        { x: 1200, y: 800, act: 'work', time: [4, 8] },
        { x: 1500, y: 800, act: 'work', time: [4, 8] },
      ],
    });
    const r = page(5, HALLOWEEN);
    let both = 0,
      used = [0, 0];
    r.WORLD.apply(rw, 1);
    r.advance(1);
    const rc = crewOf(r.box());
    const count = () => {
      const at = [0, 1].map(i => rc.some(m => same(xy(m.style.transform), [rw.spots[i].x, 800])));
      if (at[0] && at[1]) both++;
      if (at[0]) used[0]++;
      if (at[1]) used[1]++;
    };
    count();
    r.advance(1200 * 1000, 250, count);
    ok(!both && used[0] > 0 && used[1] > 0, 'spots of a group are used one at a time (both used, never together)');
  }
  // a house: a doorway from the street and a ladder inside; from room to room of a floor they go straight, through the doorway only
  // to and from the street
  {
    const DOOR = [
        [400, 840, 0],
        [450, 800, 0],
      ],
      UP = DOOR.concat([
        [700, 800, 0],
        [700, 600, 1],
      ]);
    const hw = made({
      crew: { count: 3 },
      spots: [
        { x: 550, y: 800, act: 'work', path: DOOR, time: [3, 6] },
        { x: 640, y: 800, act: 'work', path: DOOR, time: [3, 6] },
        { x: 600, y: 600, act: 'work', path: UP, time: [3, 6] },
        { x: 500, y: 600, act: 'work', path: UP, time: [3, 6] },
        { x: 1500, y: 820, act: 'work', time: [3, 6] },
        { x: 1200, y: 820, act: 'work', time: [3, 6] },
      ],
    });
    const h = page(21, HALLOWEEN);
    h.WORLD.apply(hw, 1);
    h.advance(1);
    const hc = crewOf(h.box());
    hc.forEach(m => (m.moves = []));
    h.advance(1800 * 1000);
    let through = 0,
      detour = 0,
      climbs = 0;
    for (const m of hc) {
      const ps = m.moves.map(xy);
      ps.forEach((p, i) => {
        if (same(p, [450, 800])) {
          if (same(ps[i - 1], [400, 840]) || same(ps[i + 1], [400, 840])) through++;
          else detour++;
        }
        if (same(p, [700, 600]) && ps[i - 1] && ps[i - 1][0] === 700) climbs++;
      });
    }
    ok(through > 10 && climbs > 5, 'a house: in and out through the doorway, up and down the ladder (' + through + ', ' + climbs + ')');
    ok(!detour, 'from room to room of a floor, and down the ladder to a room, straight: not back by the doorway (' + detour + ' times)');
  }
  // an event: its banner comes, it calls the crew to its spot, it ends; Home hidden while it goes on: it ends and nobody goes on
  {
    const ew = made({
      crew: { count: 3 },
      spots: [
        { x: 300, y: 800, act: 'work', time: [40, 60] },
        { x: 1000, y: 800, act: 'work', time: [40, 60] },
        { x: 1700, y: 800, act: 'work', time: [40, 60] },
      ],
      events: [
        {
          every: [10, 10],
          time: [20, 20],
          call: 3,
          props: [{ s: 'banner', x: 960, y: 300 }],
          spot: { x: 960, y: 900, n: 3, gap: 80, act: 'play', time: [600, 600] },
        },
      ],
    });
    const nm = namer(ew),
      e = page(9, HALLOWEEN);
    e.WORLD.apply(ew, 1);
    e.advance(1);
    const eb = e.box(),
      ec = crewOf(eb),
      ep = places(ew.events[0].spot);
    const banner = () => propsOf(eb).filter(x => nm(x).name === 'banner');
    e.advance(10500);
    ok(banner().length === 1 && banner()[0].classList.contains('wo-in'), 'an event comes: its banner fades in');
    e.advance(12000);
    ok(
      ec.every(m => ep.some(p => same(xy(m.style.transform), p)) && nm(m).name === 'play'),
      'everyone it calls comes to its spot and does what it says'
    );
    e.advance(9000);
    ok(!banner().length, 'when it is over its banner goes');
    e.advance(2000);
    ok(
      ec.every(m => !ep.some(p => same(xy(m.style.transform), p))),
      'and they go back to their spots'
    );
    // the next one, and Home is hidden while it goes on
    e.advance(15000);
    ok(banner().length === 1, 'the next event comes');
    e.WORLD.hidden();
    ec.forEach(m => (m.moves = []));
    e.advance(600000);
    ok(ec.every(m => m.moves.length === 0) && !banner().length, 'Home hidden during an event: it ends, and nobody goes on walking');
    e.WORLD.shown();
    ok(
      ec.every(m => ew.spots.some(s => same(xy(m.style.transform), [s.x, s.y]))) && !banner().length,
      'Home back: everyone at a spot again'
    );
  }
  // inside: in at a door and out of sight a while, then back; a spot at some hours only (when)
  {
    const iw = made({
      crew: { count: 1 },
      spots: [
        { x: 1500, y: 800, act: 'work', time: [4, 6] },
        { x: 300, y: 800, inside: true, act: 'dig', back: 'dig', fps: 8, time: [5, 5] },
        { x: 900, y: 800, act: 'play', time: [4, 6], when: { h: [22, 6] } },
      ],
    });
    const i = page(13, HALLOWEEN);
    i.WORLD.apply(iw, 1);
    i.advance(1);
    const m = crewOf(i.box())[0];
    let hid = 0,
      out = 0,
      night = 0;
    i.advance(600 * 1000, 250, () => {
      const g = m.children[0].classList.contains('wo-g');
      if (g) hid++;
      else if (hid) out++;
      if (same(xy(m.style.transform), [900, 800])) night++;
    });
    ok(hid > 0 && out > 0, 'an inside spot: in, out of sight for a while, then back out');
    ok(!night, 'a spot of the night (when) is not used in the morning');
    i.jump(new Date(2026, 9, 31, 23, 0, 0).getTime() - i.now());
    i.advance(600 * 1000, 250, () => {
      if (same(xy(m.style.transform), [900, 800])) night++;
    });
    ok(night > 0, 'and it is at night');
  }
  // the wind: a gust from the left reaches a prop on the left before one on the right, each sways once and is still again, some give
  // off what the wind carries; Home hidden: no gusts, and Home back: all still. Props that pan keep together, and stay put for a
  // screenshot
  {
    const ww = made({
      crew: { count: 1 },
      spots: [{ x: 960, y: 800, act: 'work', time: [600, 600] }],
      props: [
        { s: 'table', x: 100, y: 900, gust: 'gusty' },
        { s: 'table', x: 1500, y: 900, gust: 'gusty' },
        { s: 'mini', x: 200, y: 100, under: true, pan: [-240, 480] },
        { s: 'mini', x: 400, y: 100, under: true, pan: [-240, 480] },
      ],
      wind: { every: [10, 10], speed: 500, fps: 10, fx: { s: 'say-hi', kind: 'blow' } },
    });
    const nm = namer(ww),
      g = page(23, HALLOWEEN);
    g.WORLD.apply(ww, 1);
    g.advance(1);
    const gb = g.box(),
      [A, B, S1, S2] = propsOf(gb),
      at = () => [nm(A).name, nm(B).name].join();
    const seen = [];
    g.advance(9800);
    seen.push(at());
    g.advance(1300); // 11.1 s: the gust is at the left one (10 s + (100 + 400) / 500)
    seen.push(at());
    g.advance(900); // 12.0 s
    seen.push(at());
    g.advance(2000); // 14.0 s: at the right one (10 s + (1500 + 400) / 500)
    seen.push(at());
    g.advance(800); // 14.8 s
    seen.push(at());
    ok(
      seen.join(' | ') === 'table,table | gusty,table | table,table | table,gusty | table,table',
      'a gust from the left sways the prop on the left, then the one on the right, each once (' + seen.join(' | ') + ')'
    );
    let blown = 0;
    g.advance(90000, 100, () => {
      blown = Math.max(blown, all(gb, 'wo-f').filter(f => /^wo-blow /.test(f.children[0].style.animation || '')).length);
    });
    ok(blown > 0, 'some give off what the wind carries away, blown the way it goes');
    // hidden as a gust passes the left one: no more gusts until Home is back, and then everything is still
    g.advance(((g.now() - HALLOWEEN) % 10000 > 0 ? 10000 - ((g.now() - HALLOWEEN - 1) % 10000) : 0) + 1200);
    const mid = at();
    g.WORLD.hidden();
    let swayed = 0;
    g.advance(60000, 100, () => {
      if (nm(B).name === 'gusty') swayed++;
    });
    g.WORLD.shown();
    ok(mid === 'gusty,table' && !swayed && at() === 'table,table', 'Home hidden: no gusts; Home back: all still again');
    ok(
      [S1, S2].every(e => /^wo-pan-240 480\.000s steps\(240\) -[\d.]+s infinite alternate$/.test(e.style.animation)) &&
        S1.style.animation === S2.style.animation &&
        String(S1.style.zIndex) === '0',
      'props that pan as far as long drift together, by the clock'
    );
    g.WORLD.still();
    ok(S1.style.animation === 'none' && S2.style.animation === 'none', 'still (a screenshot): they stay where they start');
  }
  // a chat: two meet in the street, face each other and talk in turn (bubbles), then clap
  {
    const cw = made({
      crew: { chat: { every: [5, 5], say: ['say-hi'], act: 'play' } },
      spots: [
        { x: 300, y: 700, act: 'work', time: [120, 120] },
        { x: 1600, y: 700, act: 'work', time: [120, 120] },
      ],
    });
    const nm = namer(cw),
      c = page(17, HALLOWEEN);
    c.WORLD.apply(cw, 1);
    c.advance(1);
    const cc = crewOf(c.box());
    let met = false,
      talked = 0,
      acted = false;
    c.advance(40000, 100, () => {
      const p = cc.map(m => xy(m.style.transform));
      if (
        p[0] &&
        p[1] &&
        p[0][1] === 820 &&
        p[1][1] === 820 &&
        Math.abs(p[0][0] - p[1][0]) === 80 &&
        cc.every(m => nm(m).name === 'stand')
      ) {
        const l = p[0][0] < p[1][0] ? 0 : 1;
        if (cc[l].children[0].children[0].style.transform === '' && cc[1 - l].children[0].children[0].style.transform === 'scaleX(-1)')
          met = true;
      }
      talked = Math.max(talked, all(c.box(), 'wo-q').filter(q => /^wo-say[12] /.test(q.style.animation || '')).length);
      if (cc.every(m => nm(m).name === 'play')) acted = true;
    });
    ok(met, 'a chat: two meet in the street, side by side, facing each other');
    ok(talked === 2, 'they talk in turn, a bubble over each');
    ok(acted, 'and do the chat’s act together at the end');
  }
});
