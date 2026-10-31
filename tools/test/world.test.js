// The world of a theme on Home (app/src/js/world.js), run without a browser: a few fake elements and a clock that the test moves on.
// With the Claude theme's world: the props, the drift and the crew are drawn, everyone starts at a spot of their own, they walk to
// other spots along the street and up the ladders, hop when the focus moves, wave when Home comes back, stand still while Home is
// hidden and when the theme's animations are off, and the same world applied again is not drawn again.
const fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const { root, ok, run } = require('./lib');

// ---- just enough of a page: elements with a class, a style (each transform kept), children, an image that loads, timers on a clock ----
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

run(async () => {
  const themes = require(path.join(root, 'helper', 'themeschema.js'));
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'themes', 'claude', 'theme.json'), 'utf8'));
  const t = themes.resolve(themes.normalize(raw, 'claude', null, path.join(root, 'themes', 'claude')));
  const w = t.world;
  ok(!!w && w.crew.count > 0 && w.spots.length > 0 && w.props.length > 0, "the Claude theme's world resolves with a crew, spots and props");

  let now = 0,
    timers = [];
  const body = new El('body'),
    head = new El('head'),
    wall = new El('div');
  wall.id = 'wall';
  body.appendChild(wall);
  const document = { body, head, hidden: false, createElement: tag => new El(tag) };
  const sandbox = {
    document,
    API: 'http://tv',
    $: id => (id === 'wall' ? wall : null),
    Image: function () {
      const im = this;
      im.naturalWidth = 309;
      im.naturalHeight = 237;
      Object.defineProperty(im, 'src', {
        set: () => timers.push({ at: now, fn: () => im.onload && im.onload() }),
      });
    },
    setTimeout: (fn, ms) => timers.push({ at: now + (ms || 0), fn }),
    Date: { now: () => now },
    Math,
    JSON,
  };
  // the clock moves on: the timers that are due run, in order
  const advance = ms => {
    const end = now + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      if (!timers.length || timers[0].at > end) break;
      const x = timers.shift();
      now = Math.max(now, x.at);
      x.fn();
    }
    now = end;
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'app', 'src', 'js', 'world.js'), 'utf8'), sandbox, { filename: 'world.js' });
  const WORLD = sandbox.WORLD;
  const box = () => body.children.filter(c => c.id === 'world')[0];

  WORLD.apply(w, 1);
  ok(!box(), 'nothing is drawn before the sprite sheet has loaded');
  advance(1);
  const b = box();
  ok(!!b && body.children.indexOf(b) === body.children.indexOf(wall) + 1, 'the world is drawn right above the wallpaper');
  const crew = all(b, 'wo-m');
  ok(
    crew.length === w.crew.count && all(b, 'wo-d').length === w.drift.length,
    'every member of the crew and everything that drifts is there'
  );
  ok(head.children.length === 1 && /@keyframes wo-hop1/.test(head.children[0].textContent), 'the keyframes in whole art pixels are added');
  const strips = all(b, 'wo-s');
  ok(
    strips.length > crew.length &&
      strips.every(s => /^url\("http:\/\/tv\/api\/theme\/world\/claude\/clawd\.png"\)$/.test(s.style.backgroundImage)),
    'the pieces show the sprite sheet from the service'
  );
  // everyone starts at a place of a spot, each place taken once
  const places = [];
  for (const s of w.spots) for (let k = 0; k < s.n; k++) places.push(Math.round(s.x + (k - (s.n - 1) / 2) * s.gap) + ',' + s.y);
  const at = m => {
    const r = /translate\((-?\d+)px,(-?\d+)px\)/.exec(m.style.transform);
    return r ? r[1] + ',' + r[2] : '';
  };
  const start = crew.map(at);
  ok(
    start.every(p => places.indexOf(p) >= 0) && start.filter((p, i) => start.indexOf(p) === i).length === crew.length,
    'each Clawd starts at a place of its own in a spot'
  );
  ok(
    crew.every(m => /^\d+$/.test(m.style.zIndex)) && all(b, 'wo-f').length === 0,
    'the crew are stacked by how far down they stand, and no particle is there yet'
  );

  // a minute on: they walk from spot to spot along the street, and up a ladder now and then
  crew.forEach(m => (m.moves = []));
  advance(90000);
  const lane = w.crew.lane,
    moved = crew.filter(m => m.moves.length > 1);
  ok(moved.length >= crew.length - 1, 'the crew walk to other spots (' + moved.length + ' of ' + crew.length + ')');
  const onLane = crew.filter(m =>
    m.moves.some(v => {
      const r = /translate\((-?\d+)px,(-?\d+)px\)/.exec(v);
      return r && +r[2] === lane[0] && +r[1] >= lane[1] && +r[1] <= lane[2];
    })
  );
  ok(onLane.length >= crew.length - 1, 'they keep to the street between spots');
  const ladders = w.spots.filter(s => s.via).map(s => s.via[0]),
    climbed = crew.some(m => m.moves.some(v => ladders.some(x => v.indexOf('translate(' + x + 'px,') === 0)));
  ok(climbed, 'they take the ladder to a spot upstairs');
  ok(all(b, 'wo-f').length > 0 && all(b, 'wo-f').length <= 36, 'spots and props give off particles, never more than 36 at a time');
  ok(
    crew.some(m => /^transform [\d.]+s steps\(\d+\)$/.test(m.style.transition)),
    'a walk is a transition in whole art pixels (steps), not a script moving them every frame'
  );

  // the focus moves: one that is walking hops
  WORLD.poke();
  ok(
    crew.some(m => /^wo-hop[12] /.test(m.children[0].style.animation || '')),
    'a Clawd that is walking or standing about hops when the focus moves'
  );

  // Home is hidden: nobody moves, the particles go; Home is back: everyone is at a spot again, and someone waves
  WORLD.hidden();
  ok(all(b, 'wo-f').length === 0, 'the particles go when Home is hidden');
  crew.forEach(m => (m.moves = []));
  advance(60000);
  ok(
    crew.every(m => m.moves.length === 0),
    'nobody moves while Home is hidden'
  );
  WORLD.shown();
  const back = crew.map(at);
  ok(
    back.every(p => places.indexOf(p) >= 0),
    'when Home is back everyone is at a spot again'
  );
  const wv = w.sprites[w.crew.wave],
    wavePos = -wv[0] * w.px + 'px ' + -wv[1] * w.px + 'px';
  ok(crew.filter(m => all(m, 'wo-s')[0].style.backgroundPosition === wavePos).length >= 1, 'one or two of them wave when Home comes back');

  // the same world again: not drawn again; animations off: everyone stands still at a spot
  WORLD.apply(JSON.parse(JSON.stringify(w)), 1);
  advance(1);
  ok(box() === b, 'the same world applied again is left as it is');
  WORLD.apply(w, 0);
  advance(1);
  const still = all(box(), 'wo-m');
  still.forEach(m => (m.moves = []));
  advance(60000);
  ok(
    box() !== b && still.every(m => m.moves.length === 0) && all(box(), 'wo-s').every(s => s.style.animation === 'none'),
    'with the animations off (effects.speed 0) the world is drawn still'
  );
  WORLD.apply(null, 1);
  ok(!box() && head.children.length === 0, 'a theme without a world takes it away');
});
