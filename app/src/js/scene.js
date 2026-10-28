/* ---------- the scene (effects.cycles and effects.scene in a theme): a world of light going on behind Home, drawn over the wallpaper
   with transforms and opacity only, so the weak GPU draws each piece as a small layer. The floor is a perspective plane from
   effects.cyclesHorizon (the horizon) to the bottom edge: a point (X, Z) on it, Z the distance, lands at x = 960 + X f / Z,
   y = horizon + f / Z, so a straight line on the floor is a straight line on screen.
   - Light cycles (effects.cycles): riders on the floor that turn at right angles and leave a wall of light behind them along every
     stretch they rode; after a while a rider derezzes and its walls fade. The colours are the accent and effects.cyclesColor.
   - The light city (effects.scene lightcity): Recognizers, the big ships of the Grid, drift across the sky; the portal beam at
     effects.beamX pulses up into the sky; light rains down; and pulses of light sweep the floor towards the horizon.
   The pace follows effects.cycles and effects.speed; speed 0 stops all of it. It stops while Home is hidden and sits under the dock
   and the grid. ---------- */
var SCENE = (function () {
  var box = null,
    c = null /* {rate, horizon, colors, scene, beamX} */,
    f = 440 /* the focal length: the floor at Z = 1 is at the bottom edge */,
    riders = [],
    pulses = [],
    recs = [],
    segs = 0 /* walls of light on screen, all riders together */,
    timer = 0,
    raf = 0,
    last = 0;
  var MAX_SEGS = 44,
    XMAX = 3.6,
    ZMIN = 1.25,
    ZMAX = 9;
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
  function el() {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'scene';
    var w = $('wall');
    if (w && w.nextSibling) document.body.insertBefore(box, w.nextSibling);
    else document.body.insertBefore(box, document.body.firstChild);
    return box;
  }
  function div(cls, parent) {
    var d = document.createElement('div');
    d.className = cls;
    (parent || el()).appendChild(d);
    return d;
  }
  /* a point on the floor to the screen */
  function sx(X, Z) {
    return 960 + (X * f) / Z;
  }
  function sy(Z) {
    return c.horizon + f / Z;
  }
  /* a line of light from one screen point to another: a 1 x 1 px box, moved to the start, turned and scaled to the length and
     the thickness; a second, wider and fainter one underneath is its glow */
  function lay(d, x1, y1, x2, y2, th) {
    var dx = x2 - x1,
      dy = y2 - y1,
      len = Math.max(0.5, Math.sqrt(dx * dx + dy * dy)),
      ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    d.style.transform =
      'translate(' +
      x1.toFixed(1) +
      'px,' +
      y1.toFixed(1) +
      'px) rotate(' +
      ang.toFixed(2) +
      'deg) scale(' +
      len.toFixed(1) +
      ',' +
      th.toFixed(2) +
      ')';
  }

  /* ---- light cycles ---- */
  var DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  function Rider() {
    this.col = pick(c.colors);
    this.X = rnd(-XMAX * 0.8, XMAX * 0.8);
    this.Z = rnd(ZMIN + 0.3, ZMAX * 0.8);
    this.d = pick(DIRS);
    this.born = performance.now();
    this.life = rnd(9000, 20000) / Math.max(0.4, c.rate);
    this.turnAt = performance.now() + rnd(700, 3200) / c.rate;
    this.walls = [];
    this.head = div('cyc');
    this.head.style.background = this.col;
    this.head.style.boxShadow = '0 0 14px ' + this.col + ', 0 0 4px #fff';
    this.start();
    this.place();
  }
  /* a new stretch: a wall of light that grows from here */
  Rider.prototype.start = function () {
    this.x0 = this.X;
    this.z0 = this.Z;
    if (segs >= MAX_SEGS) {
      this.wall = null;
      return;
    }
    var halo = div('seg halo'),
      line = div('seg');
    halo.style.background = this.col;
    line.style.background = this.col;
    this.wall = { line: line, halo: halo };
    this.walls.push(this.wall);
    segs++;
  };
  Rider.prototype.place = function () {
    var s = 1.3 / this.Z,
      x = sx(this.X, this.Z),
      y = sy(this.Z),
      along = this.d[1] === 0;
    this.head.style.width = Math.round((along ? 40 : 14) * s) + 'px';
    this.head.style.height = Math.round((along ? 12 : 26) * s) + 'px';
    this.head.style.transform =
      'translate(' + (x - (along ? 20 : 7) * s).toFixed(1) + 'px,' + (y - (along ? 6 : 13) * s).toFixed(1) + 'px)';
    if (this.wall) {
      var th = Math.max(1.5, 5 / this.Z);
      lay(this.wall.line, sx(this.x0, this.z0), sy(this.z0), x, y, th);
      lay(this.wall.halo, sx(this.x0, this.z0), sy(this.z0) - th, x, y - th, th * 3);
    }
  };
  Rider.prototype.tick = function (now, dt) {
    var v = (this.d[1] === 0 ? 2.4 : 1.9) * c.rate;
    this.X += this.d[0] * v * dt;
    this.Z += this.d[1] * v * dt;
    var out = this.X < -XMAX || this.X > XMAX || this.Z < ZMIN || this.Z > ZMAX;
    if (out || now >= this.turnAt) {
      /* a right-angle turn, away from the edge it reached */
      this.X = Math.min(XMAX, Math.max(-XMAX, this.X));
      this.Z = Math.min(ZMAX, Math.max(ZMIN, this.Z));
      var nd;
      if (this.d[1] === 0)
        nd =
          this.Z > (ZMIN + ZMAX) / 2 && Math.random() < 0.6
            ? [0, -1]
            : this.Z < ZMIN + 1
              ? [0, 1]
              : pick([
                  [0, 1],
                  [0, -1],
                ]);
      else
        nd =
          this.X > 0 && Math.random() < 0.6
            ? [-1, 0]
            : this.X < -XMAX * 0.5
              ? [1, 0]
              : pick([
                  [1, 0],
                  [-1, 0],
                ]);
      this.place();
      this.d = nd;
      this.start();
      this.turnAt = now + rnd(700, 3600) / c.rate;
    }
    this.place();
    return now - this.born > this.life;
  };
  /* derezzed: the rider goes, its walls fade and are taken away */
  Rider.prototype.end = function () {
    if (this.head.parentNode) this.head.parentNode.removeChild(this.head);
    var walls = this.walls;
    for (var i = 0; i < walls.length; i++) {
      walls[i].line.classList.add('fade');
      walls[i].halo.classList.add('fade');
    }
    setTimeout(function () {
      for (var i = 0; i < walls.length; i++) {
        if (walls[i].line.parentNode) walls[i].line.parentNode.removeChild(walls[i].line);
        if (walls[i].halo.parentNode) walls[i].halo.parentNode.removeChild(walls[i].halo);
        segs--;
      }
    }, 2600);
  };

  /* ---- pulses of light sweeping the floor towards the horizon ---- */
  function Pulse() {
    this.Z = ZMIN;
    this.el = div('pulse');
    this.el.style.background = pick(c.colors);
  }
  Pulse.prototype.tick = function (dt) {
    this.Z += (1.6 + this.Z * 0.5) * c.rate * dt;
    if (this.Z > ZMAX * 1.3) return true;
    var y = sy(this.Z),
      th = Math.max(1, 4 / this.Z),
      op = Math.max(0, 0.55 - this.Z * 0.045);
    this.el.style.transform = 'translate(0,' + y.toFixed(1) + 'px) scale(1,' + th.toFixed(2) + ')';
    this.el.style.opacity = op.toFixed(2);
    return false;
  };

  /* ---- Recognizers: the big ships, drawn once as SVG and flown across the sky ---- */
  function recSvg(col) {
    var g = 'fill="none" stroke="' + col + '" stroke-linejoin="round" stroke-linecap="round"';
    return (
      '<svg viewBox="0 0 240 300" width="240" height="300">' +
      '<path d="M20 20 L220 20 L220 290 L172 290 L172 86 L68 86 L68 290 L20 290 Z" fill="#04080e" stroke="' +
      col +
      '" stroke-opacity=".28" stroke-width="12" stroke-linejoin="round"/>' +
      '<path d="M20 20 L220 20 L220 290 L172 290 L172 86 L68 86 L68 290 L20 290 Z" ' +
      g +
      ' stroke-width="3"/>' +
      '<path d="M34 34 L206 34 M34 50 L206 50 M90 64 L150 64" ' +
      g +
      ' stroke-width="2" stroke-opacity=".8"/>' +
      '<rect x="104" y="28" width="32" height="18" fill="' +
      col +
      '"/>' +
      '<path d="M32 110 L56 110 M32 150 L56 150 M32 190 L56 190 M32 230 L56 230 M184 110 L208 110 M184 150 L208 150 M184 190 L208 190 M184 230 L208 230" ' +
      g +
      ' stroke-width="2" stroke-opacity=".7"/>' +
      '<path d="M26 262 L62 262 M178 262 L214 262" ' +
      g +
      ' stroke-width="3"/>' +
      '<rect x="30" y="272" width="28" height="10" fill="' +
      col +
      '" fill-opacity=".8"/><rect x="182" y="272" width="28" height="10" fill="' +
      col +
      '" fill-opacity=".8"/>' +
      '</svg>'
    );
  }
  function Rec(n) {
    this.n = n;
    this.el = div('rec');
    this.col = n === 0 ? c.colors[1] : c.colors[0];
    this.el.innerHTML = recSvg(this.col);
    this.s = n === 0 ? 0.85 : n === 1 ? 0.42 : 0.26;
    this.y0 = n === 0 ? 150 : n === 1 ? 80 : 210;
    this.x = n === 0 ? rnd(200, 900) : n === 1 ? rnd(1100, 1700) : rnd(500, 1300);
    this.dir = n === 1 ? -1 : 1;
    this.v = (n === 0 ? 22 : n === 1 ? 14 : 9) * c.rate;
    this.t = rnd(0, 100);
  }
  Rec.prototype.tick = function (dt) {
    this.t += dt;
    this.x += this.dir * this.v * dt;
    if (this.dir > 0 && this.x > 2200) {
      this.x = -400;
      this.y0 = rnd(60, 240);
    } else if (this.dir < 0 && this.x < -400) {
      this.x = 2200;
      this.y0 = rnd(40, 200);
    }
    var y = this.y0 + Math.sin(this.t * 0.35) * 18,
      rot = Math.sin(this.t * 0.2) * 3;
    this.el.style.transform =
      'translate(' + this.x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + this.s + ')';
  };

  /* ---- the portal beam and the rain of light: CSS animations, set up once ---- */
  function city() {
    var bx = c.beamX,
      top = c.horizon - 40;
    var halo = div('beam halo'),
      beam = div('beam'),
      flare = div('flare');
    halo.style.left = bx - 30 + 'px';
    halo.style.height = top + 'px';
    beam.style.left = bx - 4 + 'px';
    beam.style.height = top + 'px';
    flare.style.left = bx - 90 + 'px';
    flare.style.top = top - 30 + 'px';
    for (var i = 0; i < 14; i++) {
      var r = div('rain');
      r.style.left = Math.round(rnd(0, 1920)) + 'px';
      r.style.height = Math.round(rnd(30, 90)) + 'px';
      r.style.background = pick(c.colors);
      r.style.animationDuration = rnd(3.5, 8).toFixed(1) + 's';
      r.style.animationDelay = (-rnd(0, 8)).toFixed(1) + 's';
    }
    for (var k = 0; k < 3; k++) recs.push(new Rec(k));
  }

  function spawn() {
    timer = 0;
    if (!c || document.hidden) return;
    if (c.cycles > 0 && riders.length < 3) riders.push(new Rider());
    if (c.scene && pulses.length < 2 && Math.random() < 0.7) pulses.push(new Pulse());
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
    timer = setTimeout(spawn, rnd(1500, 5000) / c.rate);
  }
  function tick(now) {
    raf = 0;
    if (!c || document.hidden) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000),
      i;
    last = now;
    for (i = riders.length - 1; i >= 0; i--)
      if (riders[i].tick(now, dt)) {
        riders[i].end();
        riders.splice(i, 1);
      }
    for (i = pulses.length - 1; i >= 0; i--)
      if (pulses[i].tick(dt)) {
        pulses[i].el.parentNode.removeChild(pulses[i].el);
        pulses.splice(i, 1);
      }
    for (i = 0; i < recs.length; i++) recs[i].tick(dt);
    if (riders.length || pulses.length || recs.length) raf = requestAnimationFrame(tick);
  }
  function clear() {
    clearTimeout(timer);
    timer = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    riders = [];
    pulses = [];
    recs = [];
    segs = 0;
    if (box) box.textContent = '';
  }
  function build() {
    if (!c || document.hidden) return;
    el();
    if (c.scene) city();
    timer = setTimeout(spawn, rnd(300, 1200) / c.rate);
  }
  return {
    /* the theme changed: its scene (or none) and its animation speed (effects.speed) */
    apply: function (cc, spd) {
      clear();
      c = null;
      if (!cc || !(spd > 0) || !(cc.cycles > 0 || cc.scene)) return;
      c = {
        rate: Math.max(0.2, cc.cycles || 0.6) * spd,
        cycles: cc.cycles || 0,
        horizon: cc.horizon,
        colors: cc.colors,
        scene: cc.scene || '',
        beamX: cc.beamX || 960,
      };
      f = 1080 - c.horizon;
      build();
    },
    shown: build,
    hidden: clear,
  };
})();
