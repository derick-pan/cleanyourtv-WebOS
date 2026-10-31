/* ---------- the world (world in a theme, helper/themeschema.js): a little place going on behind Home, drawn from a sprite sheet in
   the theme's folder. The theme describes it as data: strips of frames in the sheet (sprites, with a look of each for every member of
   the crew), props that stay in place and play their frames (a fire, a flag, a glint on the water), things that cross the sky (drift),
   the places where something happens (spots), a crew of characters who walk from spot to spot along a street and do what each spot
   says (in at a door, up the stairs or a ladder, inside for a while), herds of little ones who wander about an area and play, events
   that come now and then (a match, a party, a visitor) and a tint for the night. Some things only happen at some hours or on some days
   (when). Characters say things in bubbles, meet in the street for a chat, hop when the focus moves and wave when Home comes back.
   Everything moves with transforms and opacity only and in whole art pixels (steps), so pixel art stays crisp and the weak GPU draws
   each piece as a small layer; the frames are CSS animations, so the script only acts when someone starts something new. effects.speed
   0 leaves everyone standing at a spot. It stops while Home is hidden and stands still under the open grid. ---------- */
var WORLD = (function () {
  var W = null /* the theme's world, as the service resolved it */,
    sig = '',
    gen = 0 /* which apply() a loaded sheet belongs to */,
    token = 0 /* timers of an earlier start do nothing */,
    box = null,
    kf = null /* keyframes in whole art pixels */,
    shadeEl = null,
    url = '',
    sheet = '' /* the size of the sheet on screen */,
    rate = 1 /* effects.speed */,
    P = 4 /* screen pixels per art pixel */,
    crew = [],
    spots = [],
    props = [],
    drifts = [],
    minis = [],
    parts = [] /* particles on screen */,
    live = null; /* the event going on */
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(l) {
    return l[Math.floor(Math.random() * l.length)];
  }
  function div(cls, parent) {
    var d = document.createElement('div');
    d.className = cls;
    parent.appendChild(d);
    return d;
  }
  function drop(e) {
    if (e && e.parentNode) e.parentNode.removeChild(e);
  }
  /* fn after s seconds, unless the world was stopped or started again meanwhile */
  function later(fn, s) {
    var t = token;
    setTimeout(function () {
      if (t === token) fn();
    }, s * 1000);
  }
  /* is it the hour and the day for it (when: {h: [from, to], d: [from, to]}, both across midnight or New Year when needed)? */
  function active(w) {
    if (!w) return true;
    var t = new Date(Date.now()),
      h = t.getHours(),
      d = (t.getMonth() + 1) * 100 + t.getDate();
    if (w.h && !(w.h[0] <= w.h[1] ? h >= w.h[0] && h < w.h[1] : h >= w.h[0] || h < w.h[1])) return false;
    return !w.d || (w.d[0] <= w.d[1] ? d >= w.d[0] && d <= w.d[1] : d >= w.d[0] || d <= w.d[1]);
  }
  /* a clip the size of one frame, holding the strip of a sprite's frames side by side */
  function piece(parent) {
    var c = div('wo-c', parent),
      s = div('wo-s', c);
    s.style.backgroundImage = 'url("' + url + '")';
    s.style.backgroundSize = sheet;
    return { clip: c, strip: s, name: '', look: 0, alt: false };
  }
  /* a sprite in a piece, its anchor at the piece's origin (mirrored around it when face is -1), in look `look` when the sprite has one
     (a strip under it): the frames loop at fps, or play once and the last one stays; returns the seconds of one pass */
  function paint(o, name, fps, once, face, look, sync) {
    var s = W.sprites[name];
    if (!s) return 0;
    var cs = o.clip.style,
      ss = o.strip.style,
      n = s[4],
      fw = s[2] * P,
      lk = look > 0 && look < s[7] ? look : 0;
    if (o.name !== name || o.look !== lk) {
      o.name = name;
      o.look = lk;
      cs.width = fw + 'px';
      cs.height = s[3] * P + 'px';
      cs.left = -s[5] * P + 'px';
      cs.top = -s[6] * P + 'px';
      cs.transformOrigin = s[5] * P + 'px 0';
      ss.width = fw * n + 'px';
      ss.height = s[3] * P + 'px';
      ss.backgroundPosition = -s[0] * P + 'px ' + -(s[1] + lk * s[3]) * P + 'px';
    }
    cs.transform = face < 0 ? 'scaleX(-1)' : '';
    var pass = fps > 0 && rate > 0 ? n / fps / rate : 0;
    if (n < 2 || !pass) ss.animation = 'none';
    else if (once) {
      /* two names for the same keyframes, so playing it again starts it over */
      o.alt = !o.alt;
      ss.animation = 'wo' + n + (o.alt ? 'b ' : ' ') + ((pass * (n - 1)) / n).toFixed(3) + 's steps(' + (n - 1) + ') forwards';
    } else
      ss.animation =
        'wo-run ' + pass.toFixed(3) + 's steps(' + n + ') ' + (sync ? (-((Date.now() / 1000) % pass)).toFixed(3) + 's ' : '') + 'infinite';
    return pass;
  }
  /* the keyframes that move in whole art pixels: a hop, a bob, particles, and a strip played once (for each number of frames) */
  function frames() {
    var css = '',
      n,
      i,
      k,
      used = {},
      arc = [0, 2, 4, 5, 5, 4, 2, 0],
      say = '{0%{transform:translateY(' + 2 * P + 'px);opacity:0}15%,85%{transform:translateY(0);opacity:1}100%{opacity:0}}';
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
      '@keyframes wo-fall{0%{transform:translateY(0);opacity:0}8%{opacity:1}80%{opacity:1}100%{transform:translateY(' +
      40 * P +
      'px);opacity:0}}' +
      '@keyframes wo-sway{50%{transform:translateX(' +
      P +
      'px)}}' +
      '@keyframes wo-say1' +
      say +
      '@keyframes wo-say2' +
      say;
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
    var life = f.kind === 'float' ? 4 : f.kind === 'pop' ? 1.1 : f.kind === 'fall' ? 5 : 2.6,
      t = life / rate,
      px = x + (face < 0 ? -f.dx : f.dx),
      py = y + f.dy;
    if (f.kind === 'pop') {
      px += Math.round(rnd(-5, 5)) * P;
      py += Math.round(rnd(-4, 3)) * P;
    } else px += Math.round(rnd(-1, 1)) * P;
    var a = div('wo wo-f', box),
      m = div('wo-b', a),
      sw = f.kind === 'rise' || f.kind === 'fall' ? div('wo-b', m) : m,
      o = piece(sw);
    a.style.left = Math.round(px) + 'px';
    a.style.top = Math.round(py) + 'px';
    paint(o, f.s, s[4] / life, true, 1, 0);
    m.style.animation =
      'wo-' +
      f.kind +
      ' ' +
      t.toFixed(2) +
      's ' +
      (f.kind === 'pop' ? 'linear' : 'steps(' + (f.kind === 'rise' ? 16 : f.kind === 'fall' ? 40 : 24) + ')') +
      ' forwards';
    if (sw !== m) sw.style.animation = 'wo-sway ' + (0.9 / rate).toFixed(2) + 's steps(1) ' + (-rnd(0, 1)).toFixed(2) + 's infinite';
    parts.push(a);
    setTimeout(
      function () {
        var i = parts.indexOf(a);
        if (i >= 0) parts.splice(i, 1);
        drop(a);
      },
      t * 1000 + 60
    );
  }
  /* fn every so many seconds or so, while keep() says yes */
  function every(sec, fn, keep) {
    var tick = function () {
      if (!keep()) return;
      fn();
      later(tick, (sec * rnd(0.7, 1.3)) / rate);
    };
    later(tick, (sec * rnd(0.2, 1.1)) / rate);
  }

  /* ---- props: in place, playing their frames; they can bob, pulse (a glow), play only now and then (rest), give off particles, sit
     under everything else (under) or in front of the crew (front), and show only at their hours (when) ---- */
  function prop(p) {
    var a = div('wo', box),
      b = div('wo-b', a),
      o = piece(b);
    a.style.left = p.x + 'px';
    a.style.top = p.y + 'px';
    a.style.zIndex = p.front ? 900 : p.under ? 4 : 10;
    paint(o, p.s, p.rest ? 0 : p.fps, false, 1, 0, true);
    var an = [];
    if (rate > 0 && p.bob) an.push(bob(p.bob));
    if (rate > 0 && p.pulse)
      an.push('wo-pulse ' + (p.pulse / 2 / rate).toFixed(2) + 's ease-in-out ' + (-rnd(0, p.pulse)).toFixed(2) + 's infinite alternate');
    if (an.length) b.style.animation = an.join(',');
    return { p: p, a: a, b: b, o: o, on: true };
  }
  /* a prop's timers: one that plays now and then is out of sight between plays; particles while it is shown */
  function startProp(q) {
    var p = q.p;
    if (!(rate > 0)) return;
    if (p.rest) {
      q.a.style.opacity = '0';
      var play = function () {
        if (q.on) {
          q.a.style.opacity = '1';
          var t = paint(q.o, p.s, p.fps, true, 1, 0);
          later(function () {
            q.a.style.opacity = '0';
            later(play, (rnd(0.6, 1.4) * p.rest) / rate);
          }, t);
        } else later(play, p.rest / rate);
      };
      later(play, (rnd(0.2, 1) * p.rest) / rate);
    }
    if (p.fx)
      every(
        p.fx.every,
        function () {
          emit(p.fx, p.x, p.y, 1);
        },
        function () {
          return q.on && !!q.a.parentNode;
        }
      );
  }

  /* ---- drift: crossing the screen, then a while out of sight, over and over ---- */
  function drifter(d, i, n) {
    var s = W.sprites[d.s],
      fw = s[2] * P,
      a = div('wo-d', box),
      b = div('wo-b', a),
      o = piece(b);
    paint(o, d.s, d.fps, false, d.dir, 0);
    o.clip.style.left = '0';
    o.clip.style.top = '0';
    o.clip.style.transformOrigin = '50% 50%';
    a.style.width = fw + 'px';
    a.style.top = d.y - s[6] * P + 'px';
    if (!(rate > 0)) {
      a.style.transform = 'translateX(' + Math.round(((i + 0.5) * 1920) / n - fw / 2) + 'px)';
      return { d: d, a: a };
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
    return { d: d, a: a };
  }

  /* ---- a character: a box moved with transitions, a wrapper that hops and fades, the sprite, and a bubble over its head ---- */
  function Body(cls) {
    this.a = div('wo wo-m' + (cls ? ' ' + cls : ''), box);
    this.b = div('wo-b', this.a);
    this.o = piece(this.b);
    this.x = 960;
    this.y = 900;
    this.face = 1;
    this.look = 0;
    this.q = 0;
    this.hops = 0;
    this.hopAt = 0;
    this.bub = null;
  }
  /* its one next step, after s seconds; a newer one replaces it */
  Body.prototype.after = function (s, fn) {
    var self = this,
      q = ++this.q;
    later(function () {
      if (q === self.q) fn.call(self);
    }, s);
  };
  Body.prototype.put = function (x, y, t, n) {
    var st = this.a.style;
    this.x = x;
    this.y = y;
    st.transition = t > 0 ? 'transform ' + t.toFixed(2) + 's steps(' + n + ')' : 'none';
    st.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    st.zIndex = String(100 + Math.round(y / 4));
  };
  /* a walk to (x, y) in whole art pixels; returns the seconds it takes */
  Body.prototype.walk = function (x, y, speed, name, fps) {
    var dx = x - this.x,
      d = Math.max(Math.abs(dx), Math.abs(y - this.y));
    if (d < 1) return 0;
    var t = d / (speed * rate);
    if (Math.abs(dx) >= 1) this.face = dx > 0 ? 1 : -1;
    this.show(name, fps);
    this.put(x, y, t, Math.max(1, Math.round(d / P)));
    return t;
  };
  Body.prototype.show = function (name, fps, once, sync) {
    return paint(this.o, name, fps, once, this.face, this.look, sync);
  };
  Body.prototype.hop = function () {
    var now = Date.now();
    if (now - this.hopAt < 450) return;
    this.hopAt = now;
    this.hops++;
    this.b.style.animation = 'wo-hop' + (this.hops % 2 ? 1 : 2) + ' ' + (0.42 / rate).toFixed(2) + 's steps(1)';
  };
  /* a speech bubble over its head for a while */
  Body.prototype.say = function (name) {
    if (!W.sprites[name] || !(rate > 0)) return;
    if (!this.bub) {
      this.bub = div('wo-q', this.a);
      this.bubO = piece(this.bub);
    }
    var h = this.bubH || W.crew.bubble;
    this.bub.style.top = -h + 'px';
    paint(this.bubO, name, 4, false, 1, 0);
    /* two names for the same keyframes, so a new bubble starts over */
    this.bubN = (this.bubN || 0) + 1;
    this.bub.style.animation = 'wo-say' + ((this.bubN % 2) + 1) + ' ' + (2.4 / rate).toFixed(2) + 's linear forwards';
  };

  /* ---- the crew ---- */
  function slotX(s, k) {
    return s.x + (k - (s.n - 1) / 2) * s.gap;
  }
  function Member(i) {
    Body.call(this, '');
    this.look = i % W.crew.looks;
    this.spot = null;
    this.slot = 0;
    this.last = null;
    this.legs = [];
    this.busy = false /* at its spot, doing what the spot says */;
  }
  Member.prototype = Object.create(Body.prototype);
  /* which way it faces at a spot: the spot's way, or towards the others in a spot for several */
  Member.prototype.facing = function (s, k) {
    var mid = (s.n - 1) / 2;
    return s.face || (s.n > 1 && k !== mid ? (k < mid ? 1 : -1) : this.face);
  };
  /* a free place in another spot open at this hour, by weight; a spot where someone already waits for company counts three times, and
     the spot of an event going on five times; first, an event that still wants some */
  Member.prototype.pick = function () {
    var c = [],
      tot = 0,
      i,
      s,
      k,
      wt,
      r;
    /* an event that called more than were free when it began takes the next ones who are free */
    if (live && live.want > 0 && live.spot && this.spot !== live.spot) {
      k = live.spot.who.indexOf(null);
      if (k >= 0) {
        live.want--;
        return [live.spot, k];
      }
    }
    for (i = 0; i < spots.length; i++) {
      s = spots[i];
      k = s.who.indexOf(null);
      if (s === this.spot || s === this.last || !(s.w > 0) || k < 0 || !active(s.when) || taken(s)) continue;
      wt = s.w * (s.n > 1 && k > 0 ? 3 : 1) * (s.event ? 5 : 1);
      c.push([s, k, wt]);
      tot += wt;
    }
    r = Math.random() * tot;
    for (i = 0; i < c.length; i++) if ((r -= c[i][2]) <= 0) return c[i];
    return c.length ? c[c.length - 1] : null;
  };
  /* another spot of its group is in use (one game at a time in a room) */
  function taken(s) {
    if (!s.group) return false;
    for (var i = 0; i < spots.length; i++) {
      var o = spots[i];
      if (o !== s && o.group === s.group && o.who.some(Boolean)) return true;
    }
    return false;
  }
  /* every place of a spot is taken by one who is there */
  function there(s) {
    return s.who.every(function (m) {
      return m && m.busy && m.spot === s;
    });
  }
  /* how long one stays at a spot: its time, and at a spot for several at least 45 seconds while the others are on their way */
  function stay(s) {
    var t = rnd(s.time[0], s.time[1]) / rate;
    return s.n > 1 && !there(s) ? Math.max(t, 45 / rate) : t;
  }
  /* what one does at its place of a spot: the spot's act, or at a game (a spot with props) the crew's wait until the others are there */
  function doing(m, s) {
    var act = actOf(s, m.slot);
    if (s.show && s.show.length && !there(s)) m.show(W.crew.wait || W.crew.stand, 4);
    else m.show(act || W.crew.stand, act ? s.fps : 4, false, true);
  }
  /* a spot's props (the table, the rope, the ball) are shown while every place is taken by one who is there; when the last one comes
     they all start together and play for the spot's time, and when a game breaks up the others go too (quiet: no timers) */
  function showing(s, quiet) {
    if (!box) return;
    var full = there(s),
      game = s.show && s.show.length;
    if (full && s.n > 1 && !s.full)
      s.who.forEach(function (m) {
        doing(m, s);
        if (!quiet) m.after(rnd(s.time[0], s.time[1]) / rate, m.next);
      });
    else if (!full && s.full && game && !quiet)
      s.who.forEach(function (m) {
        if (m && m.busy && m.spot === s) {
          doing(m, s);
          m.after(rnd(0.5, 2.5) / rate, m.next);
        }
      });
    s.full = full;
    if (!game) return;
    if (full && !s.on) {
      s.on = s.show.map(function (p) {
        var q = prop(p);
        q.a.classList.add('wo-in');
        startProp(q);
        return q;
      });
    } else if (!full && s.on) {
      s.on.forEach(function (q) {
        q.on = false;
        drop(q.a);
      });
      s.on = null;
    }
  }
  /* the way from where it is to a place: back along its spot's path to the last point the two paths share, or out onto the street
     (crew.lane) and along it, then in along the next spot's path (doors, stairs: [x, y, climb]); without a street, straight across.
     The last point they share is left out when the ways on both sides of it are on its level: from room to room of a floor, straight */
  Member.prototype.route = function (s, tx) {
    var A = this.spot ? this.spot.path : [],
      B = s.path,
      ln = W.crew.lane,
      legs = [],
      k = 0,
      i;
    while (k < A.length && k < B.length && A[k][0] === B[k][0] && A[k][1] === B[k][1]) k++;
    var skip = k > 0 && (k === A.length || !A[k][2]) && (k === B.length || !B[k][2]) ? 1 : 0;
    for (i = A.length - 1; i >= Math.max(0, k - 1 + skip); i--) legs.push([A[i][0], A[i][1], i === A.length - 1 ? 0 : A[i + 1][2]]);
    if (!k && ln) {
      var x = legs.length ? legs[legs.length - 1][0] : this.x,
        x1 = B.length ? B[0][0] : tx;
      legs.push([Math.min(ln[2], Math.max(ln[1], x)), ln[0], A.length ? A[0][2] : 0], [Math.min(ln[2], Math.max(ln[1], x1)), ln[0], 0]);
    }
    for (i = k; i < B.length; i++) legs.push(B[i]);
    legs.push([tx, s.y, 0]);
    return legs;
  };
  Member.prototype.leave = function () {
    var s = this.spot;
    this.busy = false;
    this.b.classList.remove('wo-g');
    this.carry = s && s.carry ? s.carry : '';
    if (s && s.who) s.who[this.slot] = null;
    if (s) showing(s);
    this.last = s && !s.meet ? s : this.last;
  };
  Member.prototype.next = function () {
    var p = this.pick();
    this.leave();
    if (!p) {
      this.spot = null;
      this.show(W.crew.stand, 4);
      this.after(rnd(2, 5) / rate, this.next);
      return;
    }
    this.go(p[0], p[1]);
  };
  Member.prototype.go = function (s, k) {
    this.legs = this.route(s, slotX(s, k));
    this.spot = s;
    this.slot = k;
    if (s.who) s.who[k] = this;
    this.step();
  };
  Member.prototype.step = function () {
    var l = this.legs.shift();
    if (!l) {
      this.carry = '';
      return this.arrive();
    }
    var climb = l[2] && W.crew.climb,
      t = this.walk(l[0], l[1], W.crew.speed * (l[2] ? 0.6 : 1), climb || this.carry || W.crew.walk, climb ? 6 : (8 * W.crew.speed) / 60);
    this.after(t, this.step);
  };
  /* what it does at its place of a spot */
  function actOf(s, k) {
    return (s.acts && s.acts[k]) || s.act;
  }
  Member.prototype.arrive = function () {
    var s = this.spot,
      act = actOf(s, this.slot),
      t = rnd(s.time[0], s.time[1]) / rate;
    if (s.meet) return s.meet.here(this);
    this.face = this.facing(s, this.slot);
    this.busy = true;
    if (s.inside) {
      /* what it does at the door (dig in), out of sight for a while, then back (pop out) */
      this.after(act ? this.show(act, s.fps, true) : 0, function () {
        var self = this;
        this.b.classList.add('wo-g');
        /* once it has faded, its frames stop until it comes out */
        later(function () {
          if (self.b.classList.contains('wo-g')) self.o.strip.style.animation = 'none';
        }, 0.6);
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
    doing(this, s);
    this.work(s);
    this.after(stay(s), this.next);
    showing(s);
  };
  /* the spot's particles and bubbles while it is there */
  Member.prototype.work = function (s) {
    var self = this,
      here = function () {
        return self.busy && self.spot === s;
      };
    if (!(rate > 0)) return;
    if (s.fx)
      every(
        s.fx.every,
        function () {
          emit(s.fx, self.x, self.y, self.face);
        },
        here
      );
    if (s.say)
      every(
        s.say.every,
        function () {
          self.say(pick(s.say.s));
        },
        here
      );
  };
  /* the focus moved: one that is walking or standing about hops */
  Member.prototype.poke = function () {
    if (!this.busy) this.hop();
  };
  /* Home is back: a wave, then back to what it was doing */
  Member.prototype.wave = function () {
    var s = this.spot;
    if (!W.crew.wave || !s || s.inside || s.meet) return;
    this.show(W.crew.wave, 6);
    this.after(2.4 / rate, function () {
      doing(this, s);
      this.after(stay(s), this.next);
    });
  };
  /* two of them meet in the street: each walks to its side of the middle, and when both are there they talk in turn */
  function meet(a, b) {
    var ln = W.crew.lane,
      y = ln ? ln[0] : Math.round((a.y + b.y) / 2),
      mid = Math.round((a.x + b.x) / 2),
      g = 10 * P,
      m = { n: 0, a: a, b: b };
    if (ln) mid = Math.min(ln[2] - g, Math.max(ln[1] + g, mid));
    m.here = function (who) {
      who.face = who === a ? (b.x >= a.x ? 1 : -1) : a.x >= b.x ? 1 : -1;
      who.show(W.crew.stand, 4);
      who.busy = true;
      if (++m.n < 2) {
        who.after(20 / rate, who.next);
        return;
      }
      talk(m);
    };
    [a, b].forEach(function (who, i) {
      var x = mid + (who.x <= (i ? a.x : b.x) ? -g : g);
      who.leave();
      who.go({ x: x, y: y, path: [], n: 1, gap: 0, time: [3, 3], meet: m, who: [null] }, 0);
    });
  }
  function talk(m) {
    var c = W.crew.chat,
      t = 0.3;
    for (var i = 0; i < 4; i++)
      (function (who, at) {
        later(function () {
          if (who.spot && who.spot.meet === m) who.say(pick(c.say));
        }, at / rate);
      })(i % 2 ? m.b : m.a, (t += i ? 1.3 : 0));
    var end = 5.6;
    if (c.act) {
      later(function () {
        [m.a, m.b].forEach(function (who) {
          if (who.spot && who.spot.meet === m) who.show(c.act, 6);
        });
      }, end / rate);
      end += 2.4;
    }
    m.a.after(end / rate, m.a.next);
    m.b.after(end / rate, m.b.next);
  }
  function chatter() {
    var c = W.crew.chat;
    if (!c || !(rate > 0)) return;
    later(
      function () {
        var free = crew.filter(function (m) {
          return m.busy && m.spot && !m.spot.inside && !m.spot.meet && !m.spot.event;
        });
        if (free.length >= 2) {
          var a = pick(free);
          free.splice(free.indexOf(a), 1);
          meet(a, pick(free));
        }
        chatter();
      },
      rnd(c.every[0], c.every[1]) / rate
    );
  }

  /* ---- herds: little ones that wander their area, hop, play and keep each other company ---- */
  function Mini(h) {
    Body.call(this, 'wo-h');
    this.h = h;
    this.bubH = 12 * P;
  }
  Mini.prototype = Object.create(Body.prototype);
  Mini.prototype.point = function () {
    var a = this.h.area;
    return [Math.round(rnd(a[0], a[2])), Math.round(rnd(a[1], a[3]))];
  };
  Mini.prototype.next = function () {
    var h = this.h,
      r = Math.random();
    if (r < 0.5) {
      var p = this.point();
      this.after(this.walk(p[0], p[1], h.speed, h.walk, 8), function () {
        this.show(h.stand, 4);
        this.after(rnd(0.6, 2.5) / rate, this.next);
      });
    } else if (r < 0.65) {
      this.show(h.stand, 4);
      this.hop();
      this.after(rnd(0.6, 1.6) / rate, this.next);
    } else if (r < 0.85 && h.acts.length) {
      this.show(pick(h.acts), 6);
      this.after(rnd(2, 5) / rate, this.next);
    } else {
      /* play with another: up close, face to face, particles between them */
      var o = pick(minis);
      if (o === this || o.h !== h) return this.after(0.5 / rate, this.next);
      var x = o.x + (this.x < o.x ? -12 : 12) * P;
      this.after(this.walk(x, o.y, h.speed, h.walk, 8), function () {
        this.face = o.x > this.x ? 1 : -1;
        this.show(h.acts[0] || h.stand, 6);
        if (h.fx) emit(h.fx, Math.round((this.x + o.x) / 2), this.y, 1);
        this.after(rnd(1.5, 3) / rate, this.next);
      });
    }
  };
  function herds() {
    minis.forEach(function (m) {
      drop(m.a);
    });
    minis = [];
    W.herds.forEach(function (h) {
      for (var i = 0; i < h.count; i++) {
        var m = new Mini(h),
          p = m.point();
        m.put(p[0], p[1], 0, 0);
        m.face = Math.random() < 0.5 ? 1 : -1;
        m.show(h.stand, 4);
        minis.push(m);
      }
    });
  }

  /* ---- events: now and then something happens for a while: its props and drift appear, its spot opens, some are called to it;
     one at a time, each a while (every) after it was last over ---- */
  function events() {
    if (rate > 0) W.events.forEach(wait);
  }
  function wait(e) {
    later(
      function () {
        if (!live && active(e.when)) start(e);
        else wait(e);
      },
      rnd(e.every[0], e.every[1]) / rate
    );
  }
  function start(e) {
    var ev = { e: e, props: [], drift: [], spot: null };
    live = ev;
    e.props.forEach(function (p) {
      var q = prop(p);
      q.a.classList.add('wo-in');
      ev.props.push(q);
      startProp(q);
    });
    e.drift.forEach(function (d, i) {
      ev.drift.push(drifter(d, i, e.drift.length).a);
    });
    if (e.spot) {
      var s = clone(e.spot);
      s.event = ev;
      ev.spot = s;
      spots.push(s);
      /* the ones called: whoever is at a spot (not on the way, inside or in a chat), nearest the spot first; the others it wants come
         when they are free (pick) */
      var called = crew
        .filter(function (m) {
          return m.busy && m.spot && !m.spot.inside && !m.spot.meet;
        })
        .sort(function (a, b) {
          return Math.abs(a.x - s.x) - Math.abs(b.x - s.x);
        })
        .slice(0, Math.min(e.call, s.n));
      /* places from left to right as they stand, so nobody crosses another's way */
      called
        .sort(function (a, b) {
          return a.x - b.x;
        })
        .forEach(function (m, k) {
          m.leave();
          m.go(s, k);
        });
      ev.want = Math.min(e.call, s.n) - called.length;
    }
    later(
      function () {
        end(ev);
      },
      rnd(e.time[0], e.time[1]) / rate
    );
  }
  function end(ev) {
    if (live === ev) live = null;
    wait(ev.e);
    /* its props, its drift and its spot's props fade */
    var s = ev.spot,
      gone = ev.drift.slice();
    ev.props.concat((s && s.on) || []).forEach(function (q) {
      q.on = false;
      gone.push(q.a);
    });
    gone.forEach(function (a) {
      a.classList.add('wo-out');
    });
    setTimeout(function () {
      gone.forEach(drop);
    }, 900);
    if (!s) return;
    s.on = null;
    spots.splice(spots.indexOf(s), 1);
    s.who.forEach(function (m) {
      if (m && m.spot === s) m.after(rnd(0, 1.5) / rate, m.next);
    });
  }

  /* ---- what depends on the hour and the day: props and drift shown or not, herds out or in, the tint of the night ---- */
  function hours() {
    props.forEach(function (q) {
      var on = active(q.p.when);
      if (on !== q.on) {
        q.on = on;
        q.a.style.display = on ? '' : 'none';
      }
    });
    drifts.forEach(function (x) {
      x.a.style.display = active(x.d.when) ? '' : 'none';
    });
    minis.forEach(function (m) {
      m.a.style.display = active(m.h.when) ? '' : 'none';
    });
    var sh = null;
    W.shade.forEach(function (x) {
      if (!sh && active(x.when)) sh = x;
    });
    if (sh) shadeEl.style.backgroundColor = sh.color;
    shadeEl.style.opacity = sh ? String(sh.alpha) : '0';
  }
  function clock() {
    later(function () {
      hours();
      clock();
    }, 60);
  }

  /* everyone at a spot of their own, already doing it: shuffled, or in the order of the spots (still, for a screenshot) */
  function place(still) {
    var i, j, k, s, m;
    var order = spots.slice();
    if (!still)
      order.sort(function () {
        return Math.random() - 0.5;
      });
    for (i = 0; i < spots.length; i++) {
      s = spots[i];
      for (k = 0; k < s.n; k++) s.who[k] = null;
      if (s.on)
        s.on.forEach(function (q) {
          drop(q.a);
        });
      s.on = null;
      s.full = false;
    }
    for (i = 0; i < crew.length; i++) {
      m = crew[i];
      m.q++;
      m.b.classList.remove('wo-g');
      m.b.style.animation = '';
      if (m.bub) m.bub.style.animation = '';
      m.busy = false;
      m.last = null;
      s = null;
      for (j = 0; j < order.length && !s; j++) {
        var c = order[j];
        if (!c.inside && c.w > 0 && c.who.indexOf(null) >= 0 && active(c.when) && !taken(c)) s = c;
      }
      if (!s) {
        /* more of them than places: one stands about in the street until a place is free */
        var ln = W.crew.lane;
        m.spot = null;
        m.put(Math.round(ln ? rnd(ln[1], ln[2]) : rnd(200, 1700)), ln ? ln[0] : spots[0].y, 0, 0);
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
      if (still || !(rate > 0)) continue;
      m.work(s);
      m.after((rnd(0.25, 1) * rnd(s.time[0], s.time[1])) / rate, m.next);
    }
    /* what each does there, and the games' props where all the players are there */
    for (i = 0; i < crew.length; i++) if (crew[i].busy) doing(crew[i], crew[i].spot);
    for (i = 0; i < spots.length; i++) showing(spots[i], still || !(rate > 0));
    minis.forEach(function (mm, i) {
      mm.q++;
      if (still) {
        var a = mm.h.area,
          n = mm.h.count;
        mm.put(Math.round(a[0] + ((i % n) + 0.5) * ((a[2] - a[0]) / n)), Math.round((a[1] + a[3]) / 2), 0, 0);
      } else if (rate > 0) mm.after(rnd(0.2, 2), mm.next);
    });
    if (still || !(rate > 0) || !W.crew.wave) return;
    /* a hello from one or two of them */
    var hi = crew.slice().sort(function () {
      return Math.random() - 0.5;
    });
    for (i = 0; i < Math.min(2, hi.length); i++) hi[i].wave();
  }

  function clone(s) {
    var o = {};
    for (var k in s) o[k] = s[k];
    o.on = null;
    o.full = false;
    o.who = [];
    for (var i = 0; i < s.n; i++) o.who.push(null);
    return o;
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
    shadeEl = div('wo-sh', box);
    props = W.props.map(prop);
    drifts = W.drift.map(function (d, i) {
      return drifter(d, i, W.drift.length);
    });
    spots = W.spots.map(clone);
    crew = [];
    for (var i = 0; i < W.crew.count && spots.length; i++) crew.push(new Member(i));
    herds();
    go(false);
  }
  /* (re)start the timers: the props', the crew at their spots, the herds, the chats, the events and the clock */
  function go(still) {
    if (live) end(live);
    live = null;
    token++;
    parts.forEach(drop);
    parts = [];
    hours();
    props.forEach(startProp);
    place(still);
    if (still) return;
    chatter();
    events();
    clock();
  }
  function clear() {
    token++;
    drop(box);
    drop(kf);
    box = kf = shadeEl = null;
    crew = [];
    spots = [];
    props = [];
    drifts = [];
    minis = [];
    parts = [];
    live = null;
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
      for (var i = 0; i < crew.length; i++) crew[i].poke();
      for (i = 0; i < minis.length; i++) if (Math.random() < 0.5) minis[i].hop();
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
      if (live) end(live);
      token++;
      parts.forEach(drop);
      parts = [];
    },
  };
})();
