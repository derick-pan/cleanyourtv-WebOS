/* ---------- the world (world in a theme, helper/themeschema.js): a little place going on behind Home, drawn from a sprite sheet in
   the theme's folder. The theme describes it as data: strips of frames in the sheet (sprites), props that stay in place and play
   their frames (a fire, a flag, a glint on the water), things that cross the sky (drift), the places where something happens (spots)
   and the crew, characters who walk from spot to spot and do what each spot says, climbing a ladder to a spot upstairs (via) or going
   inside for a while (inside). Spots and props can give off little things that rise, float away or pop (fx: hearts, smoke, sparks).
   Everything moves with transforms and opacity only and in whole art pixels (steps), so pixel art stays crisp and the weak GPU draws
   each piece as a small layer; the frames are CSS animations, so the script only acts when a character starts something new. The crew
   hop when the focus moves and wave when Home comes back; effects.speed 0 leaves each of them standing at a spot. It all stops while
   Home is hidden and sits under the dock, the grid and the menus. ---------- */
var WORLD = (function () {
  var W = null /* the theme's world, as the service resolved it */,
    sig = '',
    gen = 0 /* which apply() a loaded sheet belongs to */,
    token = 0 /* timers of an earlier start do nothing */,
    box = null,
    kf = null /* keyframes in whole art pixels */,
    url = '',
    sheet = '' /* the size of the sheet on screen */,
    rate = 1 /* effects.speed */,
    P = 4 /* screen pixels per art pixel */,
    crew = [],
    spots = [],
    props = [],
    parts = []; /* particles on screen */
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function div(cls, parent) {
    var d = document.createElement('div');
    d.className = cls;
    parent.appendChild(d);
    return d;
  }
  /* fn after s seconds, unless the world was stopped or started again meanwhile */
  function later(fn, s) {
    var t = token;
    setTimeout(function () {
      if (t === token) fn();
    }, s * 1000);
  }
  /* a clip the size of one frame, holding the strip of a sprite's frames side by side */
  function piece(parent) {
    var c = div('wo-c', parent),
      s = div('wo-s', c);
    s.style.backgroundImage = 'url("' + url + '")';
    s.style.backgroundSize = sheet;
    return { clip: c, strip: s, name: '', alt: false };
  }
  /* a sprite in a piece, its anchor at the piece's origin (mirrored around it when face is -1): the frames loop at fps, or play once
     and the last one stays; returns the seconds of one pass */
  function paint(o, name, fps, once, face) {
    var s = W.sprites[name];
    if (!s) return 0;
    var cs = o.clip.style,
      ss = o.strip.style,
      n = s[4],
      fw = s[2] * P;
    if (o.name !== name) {
      o.name = name;
      cs.width = fw + 'px';
      cs.height = s[3] * P + 'px';
      cs.left = -s[5] * P + 'px';
      cs.top = -s[6] * P + 'px';
      cs.transformOrigin = s[5] * P + 'px 0';
      ss.width = fw * n + 'px';
      ss.height = s[3] * P + 'px';
      ss.backgroundPosition = -s[0] * P + 'px ' + -s[1] * P + 'px';
    }
    cs.transform = face < 0 ? 'scaleX(-1)' : '';
    var pass = fps > 0 && rate > 0 ? n / fps / rate : 0;
    if (n < 2 || !pass) ss.animation = 'none';
    else if (once) {
      /* two names for the same keyframes, so playing it again starts it over */
      o.alt = !o.alt;
      ss.animation = 'wo' + n + (o.alt ? 'b ' : ' ') + ((pass * (n - 1)) / n).toFixed(3) + 's steps(' + (n - 1) + ') forwards';
    } else ss.animation = 'wo-run ' + pass.toFixed(3) + 's steps(' + n + ') infinite';
    return pass;
  }
  /* the keyframes that move in whole art pixels: a hop, a bob, particles, and a strip played once (for each number of frames) */
  function frames() {
    var css = '',
      n,
      i,
      k,
      used = {},
      arc = [0, 2, 4, 5, 5, 4, 2, 0];
    for (i = 1; i <= 2; i++) {
      css += '@keyframes wo-hop' + i + '{';
      for (n = 0; n < arc.length; n++) css += Math.round((n * 100) / (arc.length - 1)) + '%{transform:translateY(' + -arc[n] * P + 'px)}';
      css += '}';
    }
    for (n = 1; n <= 8; n++) css += '@keyframes wo-bob' + n + '{to{transform:translateY(' + -n * P + 'px)}}';
    for (k in W.sprites) used[W.sprites[k][4]] = 1;
    for (k in used)
      if (+k > 1) {
        var to = '{to{transform:translateX(' + ((-100 * (k - 1)) / k).toFixed(4) + '%)}}';
        css += '@keyframes wo' + k + to + '@keyframes wo' + k + 'b' + to;
      }
    css +=
      '@keyframes wo-rise{0%{transform:translateY(0);opacity:0}12%{opacity:1}70%{opacity:1}100%{transform:translateY(' +
      -16 * P +
      'px);opacity:0}}' +
      '@keyframes wo-float{0%{transform:translate(0,0);opacity:.85}100%{transform:translate(' +
      6 * P +
      'px,' +
      -24 * P +
      'px);opacity:0}}' +
      '@keyframes wo-sway{50%{transform:translateX(' +
      P +
      'px)}}';
    return css;
  }
  function bob(n) {
    return (
      'wo-bob' + n + ' ' + ((0.9 + 0.35 * n) / rate).toFixed(2) + 's steps(' + n + ') ' + (-rnd(0, 3)).toFixed(2) + 's infinite alternate'
    );
  }

  /* ---- particles (fx): a sprite that rises, floats away or pops where it is, playing its frames once over its life ---- */
  function emit(f, x, y, face) {
    if (!box || parts.length >= 36 || document.hidden) return;
    var s = W.sprites[f.s];
    if (!s) return;
    var life = f.kind === 'float' ? 4 : f.kind === 'pop' ? 1.1 : 2.6,
      t = life / rate,
      px = x + (face < 0 ? -f.dx : f.dx),
      py = y + f.dy;
    if (f.kind === 'pop') {
      px += Math.round(rnd(-5, 5)) * P;
      py += Math.round(rnd(-4, 3)) * P;
    } else px += Math.round(rnd(-1, 1)) * P;
    var a = div('wo wo-f', box),
      m = div('wo-b', a),
      sw = f.kind === 'rise' ? div('wo-b', m) : m,
      o = piece(sw);
    a.style.left = Math.round(px) + 'px';
    a.style.top = Math.round(py) + 'px';
    paint(o, f.s, s[4] / life, true, 1);
    m.style.animation =
      'wo-' +
      f.kind +
      ' ' +
      t.toFixed(2) +
      's ' +
      (f.kind === 'pop' ? 'linear' : 'steps(' + (f.kind === 'float' ? 24 : 16) + ')') +
      ' forwards';
    if (sw !== m) sw.style.animation = 'wo-sway ' + (0.9 / rate).toFixed(2) + 's steps(1) ' + (-rnd(0, 1)).toFixed(2) + 's infinite';
    parts.push(a);
    setTimeout(
      function () {
        var i = parts.indexOf(a);
        if (i >= 0) parts.splice(i, 1);
        if (a.parentNode) a.parentNode.removeChild(a);
      },
      t * 1000 + 60
    );
  }
  /* fn every f.every seconds or so, while keep() says yes */
  function every(f, fn, keep) {
    var tick = function () {
      if (!keep()) return;
      fn();
      later(tick, (f.every * rnd(0.7, 1.3)) / rate);
    };
    later(tick, (f.every * rnd(0.2, 1.1)) / rate);
  }

  /* ---- props: in place, playing their frames; they can bob, pulse (a glow), play only now and then (rest) and give off particles ---- */
  function prop(p) {
    var a = div('wo', box),
      b = div('wo-b', a),
      o = piece(b);
    a.style.left = p.x + 'px';
    a.style.top = p.y + 'px';
    a.style.zIndex = p.front ? 900 : 10;
    paint(o, p.s, p.rest ? 0 : p.fps, false, 1);
    var an = [];
    if (rate > 0 && p.bob) an.push(bob(p.bob));
    if (rate > 0 && p.pulse)
      an.push('wo-pulse ' + (p.pulse / 2 / rate).toFixed(2) + 's ease-in-out ' + (-rnd(0, p.pulse)).toFixed(2) + 's infinite alternate');
    if (an.length) b.style.animation = an.join(',');
    return { p: p, a: a, o: o };
  }
  /* the props' timers: one that plays now and then is hidden between plays */
  function startProps() {
    if (!(rate > 0)) return;
    props.forEach(function (q) {
      var p = q.p;
      if (p.rest) {
        q.a.style.opacity = '0';
        var play = function () {
          q.a.style.opacity = '1';
          var t = paint(q.o, p.s, p.fps, true, 1);
          later(function () {
            q.a.style.opacity = '0';
            later(play, (rnd(0.6, 1.4) * p.rest) / rate);
          }, t);
        };
        later(play, (rnd(0.2, 1) * p.rest) / rate);
      }
      if (p.fx)
        every(
          p.fx,
          function () {
            emit(p.fx, p.x, p.y, 1);
          },
          function () {
            return true;
          }
        );
    });
  }

  /* ---- drift: crossing the screen, then a while out of sight, over and over ---- */
  function drifter(d, i, n) {
    var s = W.sprites[d.s],
      fw = s[2] * P,
      a = div('wo-d', box),
      b = div('wo-b', a),
      o = piece(b);
    paint(o, d.s, d.fps, false, d.dir);
    o.clip.style.left = '0';
    o.clip.style.top = '0';
    o.clip.style.transformOrigin = '50% 50%';
    a.style.width = fw + 'px';
    a.style.top = d.y - s[6] * P + 'px';
    if (!(rate > 0)) {
      a.style.transform = 'translateX(' + Math.round(((i + 0.5) * 1920) / n - fw / 2) + 'px)';
      return;
    }
    var span = 1920 + fw,
      dur = span / (0.6 * d.speed * rate);
    a.style.animation =
      (d.dir < 0 ? 'wo-dl ' : 'wo-dr ') +
      dur.toFixed(1) +
      's steps(' +
      Math.max(1, Math.round(span / P)) +
      ') ' +
      (-rnd(0, dur)).toFixed(1) +
      's infinite';
    if (d.bob) b.style.animation = bob(d.bob);
  }

  /* ---- the crew ---- */
  function slotX(s, k) {
    return s.x + (k - (s.n - 1) / 2) * s.gap;
  }
  function Member() {
    this.a = div('wo wo-m', box);
    this.b = div('wo-b', this.a);
    this.o = piece(this.b);
    this.x = 960;
    this.y = 900;
    this.face = 1;
    this.spot = null;
    this.slot = 0;
    this.last = null;
    this.legs = [];
    this.busy = false /* at its spot, doing what the spot says */;
    this.q = 0;
    this.hops = 0;
    this.hopAt = 0;
  }
  /* its one next step, after s seconds; a newer one replaces it */
  Member.prototype.after = function (s, fn) {
    var self = this,
      q = ++this.q;
    later(function () {
      if (q === self.q) fn.call(self);
    }, s);
  };
  Member.prototype.put = function (x, y, t, n) {
    var st = this.a.style;
    this.x = x;
    this.y = y;
    st.transition = t > 0 ? 'transform ' + t.toFixed(2) + 's steps(' + n + ')' : 'none';
    st.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    st.zIndex = String(100 + Math.round(y / 4));
  };
  Member.prototype.show = function (name, fps, once) {
    return paint(this.o, name || W.crew.stand, fps, once, this.face);
  };
  /* which way it faces at a spot: the spot's way, or towards the others in a spot for several */
  Member.prototype.facing = function (s, k) {
    var mid = (s.n - 1) / 2;
    return s.face || (s.n > 1 && k !== mid ? (k < mid ? 1 : -1) : this.face);
  };
  /* a free place in another spot, by weight; a spot where someone already waits for company counts three times */
  Member.prototype.pick = function () {
    var c = [],
      tot = 0,
      i,
      s,
      k,
      wt,
      r;
    for (i = 0; i < spots.length; i++) {
      s = spots[i];
      k = s.who.indexOf(null);
      if (s === this.spot || s === this.last || !(s.w > 0) || k < 0) continue;
      wt = s.w * (s.n > 1 && k > 0 ? 3 : 1);
      c.push([s, k, wt]);
      tot += wt;
    }
    r = Math.random() * tot;
    for (i = 0; i < c.length; i++) if ((r -= c[i][2]) <= 0) return c[i];
    return c.length ? c[c.length - 1] : null;
  };
  /* the way from where it is to a place: down the ladder of a spot upstairs, out onto the street (crew.lane) and along it, and up the
     ladder of the next one; two spots upstairs on the same floor, and a world without a street, are a straight walk */
  Member.prototype.route = function (s, tx) {
    var c = this.spot,
      ln = W.crew.lane,
      legs = [],
      x = this.x,
      same = !!(c && c.via && s.via && c.via[0] === s.via[0] && c.via[1] === s.via[1] && c.y === s.y);
    if (c && c.via && !same) {
      legs.push([c.via[0], c.y, 0], [c.via[0], c.via[1], 1]);
      x = c.via[0];
    }
    if (ln && !same) {
      var x1 = s.via ? s.via[0] : tx;
      legs.push([Math.min(ln[2], Math.max(ln[1], x)), ln[0], 0], [Math.min(ln[2], Math.max(ln[1], x1)), ln[0], 0]);
    }
    if (s.via && !same) legs.push([s.via[0], s.via[1], 0], [s.via[0], s.y, 1]);
    legs.push([tx, s.y, 0]);
    return legs;
  };
  Member.prototype.next = function () {
    var p = this.pick();
    this.busy = false;
    if (this.spot) this.spot.who[this.slot] = null;
    this.last = this.spot;
    if (!p) {
      this.spot = null;
      this.show(W.crew.stand, 4);
      this.after(rnd(2, 5) / rate, this.next);
      return;
    }
    this.legs = this.route(p[0], slotX(p[0], p[1]));
    this.spot = p[0];
    this.slot = p[1];
    p[0].who[p[1]] = this;
    this.step();
  };
  Member.prototype.step = function () {
    var l = this.legs.shift();
    if (!l) return this.arrive();
    var dx = l[0] - this.x,
      dy = l[1] - this.y,
      d = Math.max(Math.abs(dx), Math.abs(dy));
    if (d < 1) return this.step();
    var t = d / (W.crew.speed * (l[2] ? 0.6 : 1) * rate);
    if (l[2]) this.show(W.crew.climb || W.crew.walk, 6);
    else {
      if (Math.abs(dx) >= 1) this.face = dx > 0 ? 1 : -1;
      this.show(W.crew.walk, (8 * W.crew.speed) / 60);
    }
    this.put(l[0], l[1], t, Math.max(1, Math.round(d / P)));
    this.after(t, this.step);
  };
  Member.prototype.arrive = function () {
    var s = this.spot,
      t = rnd(s.time[0], s.time[1]) / rate;
    this.face = this.facing(s, this.slot);
    this.busy = true;
    if (s.inside) {
      /* what it does at the door (dig in), out of sight for a while, then back (pop out) */
      this.after(s.act ? this.show(s.act, s.fps, true) : 0, function () {
        this.b.classList.add('wo-g');
        this.after(t, function () {
          this.b.classList.remove('wo-g');
          var back = 0.4;
          if (s.back) back = this.show(s.back, s.fps, true);
          else this.show(W.crew.stand, 4);
          this.after(back, this.next);
        });
      });
      return;
    }
    this.show(s.act || W.crew.stand, s.act ? s.fps : 4);
    this.work(s);
    this.after(t, this.next);
  };
  /* the spot's particles while it is there */
  Member.prototype.work = function (s) {
    var self = this;
    if (s.fx && rate > 0)
      every(
        s.fx,
        function () {
          emit(s.fx, self.x, self.y, self.face);
        },
        function () {
          return self.busy && self.spot === s;
        }
      );
  };
  /* the focus moved: one that is walking or standing about hops */
  Member.prototype.hop = function () {
    var now = Date.now();
    if (this.busy || now - this.hopAt < 450) return;
    this.hopAt = now;
    this.hops++;
    this.b.style.animation = 'wo-hop' + (this.hops % 2 ? 1 : 2) + ' ' + (0.42 / rate).toFixed(2) + 's steps(1)';
  };
  /* Home is back: a wave, then back to what it was doing */
  Member.prototype.wave = function () {
    var s = this.spot;
    if (!W.crew.wave || !s || s.inside) return;
    this.show(W.crew.wave, 6);
    this.after(2.4 / rate, function () {
      this.show(s.act || W.crew.stand, s.act ? s.fps : 4);
      this.after(rnd(s.time[0], s.time[1]) / rate, this.next);
    });
  };
  /* everyone at a spot of their own, already doing it: shuffled, or in the order of the spots (still, for a screenshot) */
  function place(still) {
    var i, j, k, s, m;
    var order = spots.slice();
    if (!still)
      order.sort(function () {
        return Math.random() - 0.5;
      });
    for (i = 0; i < spots.length; i++) for (k = 0; k < spots[i].n; k++) spots[i].who[k] = null;
    for (i = 0; i < crew.length; i++) {
      m = crew[i];
      m.q++;
      m.b.classList.remove('wo-g');
      m.b.style.animation = '';
      m.busy = false;
      m.last = null;
      s = null;
      for (j = 0; j < order.length && !s; j++) if (!order[j].inside && order[j].w > 0 && order[j].who.indexOf(null) >= 0) s = order[j];
      if (!s) {
        /* more of them than places: one stands about until a place is free */
        m.spot = null;
        m.put(Math.round(rnd(200, 1700)), W.crew.lane ? W.crew.lane[0] : spots[0].y, 0, 0);
        m.show(W.crew.stand, 4);
        if (rate > 0) m.after(rnd(1, 4) / rate, m.next);
        continue;
      }
      k = s.who.indexOf(null);
      s.who[k] = m;
      m.spot = s;
      m.slot = k;
      m.face = Math.random() < 0.5 ? 1 : -1;
      m.face = m.facing(s, k);
      m.put(slotX(s, k), s.y, 0, 0);
      m.busy = true;
      m.show(s.act || W.crew.stand, s.act ? s.fps : 4);
      if (still || !(rate > 0)) continue;
      m.work(s);
      m.after((rnd(0.25, 1) * rnd(s.time[0], s.time[1])) / rate, m.next);
    }
    if (still || !(rate > 0) || !W.crew.wave) return;
    /* a hello from one or two of them */
    var hi = crew.slice().sort(function () {
      return Math.random() - 0.5;
    });
    for (i = 0; i < Math.min(2, hi.length); i++) hi[i].wave();
  }

  function build() {
    if (!W || box || document.hidden) return;
    box = document.createElement('div');
    box.id = 'world';
    var w = $('wall');
    document.body.insertBefore(box, w ? w.nextSibling : document.body.firstChild);
    kf = document.createElement('style');
    kf.textContent = frames();
    document.head.appendChild(kf);
    props = W.props.map(prop);
    W.drift.forEach(function (d, i) {
      drifter(d, i, W.drift.length);
    });
    spots = W.spots.map(function (s) {
      var o = {};
      for (var k in s) o[k] = s[k];
      o.who = [];
      for (var i = 0; i < s.n; i++) o.who.push(null);
      return o;
    });
    crew = [];
    for (var i = 0; i < W.crew.count && spots.length; i++) crew.push(new Member());
    go(false);
  }
  /* (re)start the timers: the props', and the crew at their spots */
  function go(still) {
    token++;
    parts.forEach(function (a) {
      if (a.parentNode) a.parentNode.removeChild(a);
    });
    parts = [];
    startProps();
    place(still);
  }
  function clear() {
    token++;
    if (box && box.parentNode) box.parentNode.removeChild(box);
    if (kf && kf.parentNode) kf.parentNode.removeChild(kf);
    box = kf = null;
    crew = [];
    spots = [];
    props = [];
    parts = [];
  }
  return {
    /* the theme changed: its world (or none) and its animation speed (effects.speed); the same world again changes nothing */
    apply: function (ww, spd) {
      var s = ww && ww.file ? JSON.stringify(ww) + '|' + spd : '';
      if (s === sig) return;
      sig = s;
      var g = ++gen;
      W = null;
      clear();
      if (!s) return;
      rate = typeof spd === 'number' ? spd : 1;
      var im = new Image(),
        u = API + '/api/theme/world/' + ww.id + '/' + ww.file;
      im.onload = function () {
        if (g !== gen) return;
        W = ww;
        P = ww.px || 4;
        url = u;
        sheet = im.naturalWidth * P + 'px ' + im.naturalHeight * P + 'px';
        build();
      };
      im.src = u;
    },
    /* the focus moved */
    poke: function () {
      if (!box || !(rate > 0)) return;
      for (var i = 0; i < crew.length; i++) crew[i].hop();
    },
    /* for a screenshot (tools/theme-preview.mjs): everyone at the first spots, in order, and staying there */
    still: function () {
      if (box) go(true);
    },
    shown: function () {
      if (!W) return;
      if (!box) build();
      else go(false);
    },
    hidden: function () {
      token++;
      parts.forEach(function (a) {
        if (a.parentNode) a.parentNode.removeChild(a);
      });
      parts = [];
    },
  };
})();
