/* ---------- mascots (mascot.* in a theme): small characters that walk along the bottom of Home. The theme gives a picture: a
   strip of frames side by side, the first mascot.walk of them a walk cycle (the first one standing), and after those up to six poses
   in this order: wave, happy, sleepy, surprised, dizzy, thinking (a theme may give fewer; the standing frame stands in). The launcher
   moves each of the mascot.count characters with transforms only, so the weak GPU draws them as a few small layers. They walk left
   and right, rest, nap, wave, think, hop, spin, dash, dance, wiggle and peek from an edge, and hop once when the focus moves. The pace
   follows mascot.speed and effects.speed; either at 0 leaves them standing. They stop while Home is hidden (document.hidden) and sit
   under the menus, toasts and Live TV. ---------- */
var MASCOT = (function () {
  var m = null /* the theme's mascot: {id, file, frames, walk, count, size, y, speed, flip} */,
    url = '',
    rate = 1 /* mascot.speed x effects.speed */,
    kids = [] /* one object per character on screen */,
    raf = 0,
    last = 0,
    token = 0;
  var MIN_X = 24;
  var POSE = { wave: 0, happy: 1, sleepy: 2, surprised: 3, dizzy: 4, think: 5 };
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
  /* the frame of a pose, or the standing frame when the strip has no such pose */
  function pose(name) {
    var i = m.walk + POSE[name];
    return i < m.frames ? i : 0;
  }

  /* one character: its box (clipping one frame), its strip, and what it is doing */
  function Kid(n) {
    this.n = n;
    this.el = document.createElement('div');
    this.el.className = 'mascot';
    this.strip = document.createElement('div');
    this.strip.className = 'mascot-strip' + (m.pixel ? ' px' : '');
    this.el.appendChild(this.strip);
    document.body.appendChild(this.el);
    this.x = 96;
    this.dir = 1;
    this.rot = 0;
    this.y = 0;
    this.sc = 1;
    this.frame = 0;
    this.ftime = 0;
    this.st = null;
  }
  Kid.prototype.size = function (fw, fh) {
    /* each next character a little smaller, so a group reads as different characters */
    var k = Math.max(0.7, 1 - this.n * 0.12);
    this.fw = Math.round(fw * k);
    this.fh = Math.round(fh * k);
    this.el.style.width = this.fw + 'px';
    this.el.style.height = this.fh + 'px';
    this.strip.style.width = this.fw * m.frames + 'px';
    this.strip.style.height = this.fh + 'px';
    this.strip.style.backgroundImage = 'url("' + url + '")';
  };
  Kid.prototype.maxX = function () {
    return 1920 - this.fw - 24;
  };
  /* the next thing it does: mostly a walk somewhere, now and then a trick or a pose */
  Kid.prototype.next = function (now) {
    var k = pick([
      'walk',
      'walk',
      'walk',
      'walk',
      'rest',
      'rest',
      'nap',
      'wave',
      'think',
      'hop',
      'spin',
      'dash',
      'dance',
      'peek',
      'wiggle',
    ]);
    var x = this.x;
    if (k === 'walk' || k === 'dash' || k === 'spin') {
      var to = rnd(MIN_X, this.maxX());
      if (Math.abs(to - x) < 160) to = x + (x < 960 ? 400 : -400);
      to = Math.min(this.maxX(), Math.max(MIN_X, to));
      this.st = { kind: k, to: to, v: (k === 'dash' ? 520 : k === 'spin' ? 120 : 150) * rate, start: now };
      this.dir = to > x ? 1 : -1;
    } else if (k === 'rest') this.st = { kind: 'rest', start: now, dur: rnd(1200, 3200) / rate, pose: pick([0, 0, pose('happy')]) };
    else if (k === 'nap') this.st = { kind: 'nap', start: now, dur: rnd(3000, 6000) / rate };
    else if (k === 'wave') this.st = { kind: 'wave', start: now, dur: rnd(1200, 2200) / rate };
    else if (k === 'think') this.st = { kind: 'think', start: now, dur: rnd(2000, 4000) / rate };
    else if (k === 'hop') this.st = { kind: 'hop', start: now, n: Math.floor(rnd(1, 4)), dur: 420 / rate };
    else if (k === 'dance') this.st = { kind: 'dance', start: now, dur: rnd(1600, 3000) / rate };
    else if (k === 'wiggle') this.st = { kind: 'wiggle', start: now, dur: 900 / rate };
    else {
      /* peek: walk off one edge, wait, and come back */
      var edge = x < 960 ? -this.fw * 0.75 : 1920 - this.fw * 0.25;
      this.st = { kind: 'peek', to: edge, back: x < 960 ? MIN_X + 60 : this.maxX() - 60, v: 150 * rate, phase: 0, start: now };
      this.dir = edge > x ? 1 : -1;
    }
  };
  /* a step towards `to` at `v` px/s, stepping through the walk frames; true once it is there */
  Kid.prototype.walkTo = function (dt, to, v) {
    var d = to - this.x,
      step = Math.min(Math.abs(d), v * dt);
    this.x += d < 0 ? -step : step;
    this.ftime += dt * (v / 150);
    this.frame = m.walk > 1 ? 1 + (Math.floor(this.ftime * 8) % (m.walk - 1)) : 0;
    return Math.abs(to - this.x) < 0.5;
  };
  Kid.prototype.tick = function (now, dt) {
    this.rot = 0;
    this.y = 0;
    this.sc = 1;
    if (!this.st) this.next(now);
    var st = this.st,
      k = st.kind,
      t = now - st.start,
      p;
    if (k === 'walk' || k === 'dash') {
      if (this.walkTo(dt, st.to, st.v)) this.st = null;
    } else if (k === 'spin') {
      this.rot = ((t / 1000) * 360 * rate) % 360;
      if (this.walkTo(dt, st.to, st.v)) this.st = null;
      this.frame = pose('dizzy');
    } else if (k === 'rest') {
      this.frame = st.pose;
      if (t >= st.dur) this.st = null;
    } else if (k === 'nap') {
      /* asleep: slow breathing */
      this.frame = pose('sleepy');
      this.sc = 1 + Math.sin((t / 1000) * Math.PI * 0.8) * 0.03;
      if (t >= st.dur) this.st = null;
    } else if (k === 'wave') {
      this.frame = pose('wave');
      this.rot = Math.sin((t / 1000) * Math.PI * 4) * 6;
      if (t >= st.dur) this.st = null;
    } else if (k === 'think') {
      /* like the thinking spinner: a slow sway and a breath */
      this.frame = pose('think');
      this.rot = Math.sin((t / 1000) * Math.PI * 0.9) * 9;
      this.sc = 1 + Math.sin((t / 1000) * Math.PI * 1.6) * 0.05;
      if (t >= st.dur) this.st = null;
    } else if (k === 'hop') {
      p = (t / st.dur) % 1;
      this.frame = pose('surprised');
      this.y = -Math.sin(p * Math.PI) * this.fh * 0.55;
      this.rot = Math.sin(p * Math.PI) * 10 * this.dir;
      if (Math.floor(t / st.dur) >= st.n) this.st = null;
    } else if (k === 'dance') {
      /* a bounce from foot to foot, tilting each way */
      p = (t / 420) * rate;
      this.frame = pose('happy');
      this.rot = Math.sin(p * Math.PI) * 14;
      this.y = -Math.abs(Math.sin(p * Math.PI)) * this.fh * 0.18;
      if (t >= st.dur) this.st = null;
    } else if (k === 'wiggle') {
      this.frame = pose('happy');
      this.rot = Math.sin((t / st.dur) * Math.PI * 6) * 14;
      if (t >= st.dur) this.st = null;
    } else if (k === 'peek') {
      if (st.phase === 0) {
        if (this.walkTo(dt, st.to, st.v)) {
          st.phase = 1;
          st.until = now + rnd(900, 2200) / rate;
        }
      } else if (st.phase === 1) {
        this.frame = 0;
        if (now >= st.until) {
          st.phase = 2;
          this.dir = st.back > this.x ? 1 : -1;
        }
      } else if (this.walkTo(dt, st.back, st.v)) this.st = null;
    }
    this.draw();
  };
  Kid.prototype.draw = function () {
    var base = 1080 - this.fh - m.y;
    this.el.style.transform =
      'translate(' +
      Math.round(this.x) +
      'px,' +
      Math.round(base + this.y) +
      'px)' +
      (this.rot ? ' rotate(' + this.rot.toFixed(1) + 'deg)' : '') +
      (this.sc !== 1 ? ' scale(' + this.sc.toFixed(3) + ')' : '');
    var fr = Math.min(this.frame, m.frames - 1);
    /* mirrored (origin at the box's left edge): the frame lands in the box when it is shifted one frame further */
    this.strip.style.transform =
      m.flip && this.dir < 0 ? 'scaleX(-1) translateX(' + -(fr + 1) * this.fw + 'px)' : 'translateX(' + -fr * this.fw + 'px)';
  };
  /* the focus moved: a little hop, unless it is in the middle of a trick or asleep */
  Kid.prototype.poke = function () {
    var st = this.st;
    if (!st || st.kind === 'walk' || (st.kind === 'rest' && st.pose === 0))
      this.st = { kind: 'hop', start: performance.now(), n: 1, dur: 360 / rate };
  };

  function tick(now) {
    raf = 0;
    if (!m || document.hidden) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    for (var i = 0; i < kids.length; i++) {
      if (rate <= 0) {
        kids[i].frame = 0;
        kids[i].draw();
      } else kids[i].tick(now, dt);
    }
    if (rate > 0) raf = requestAnimationFrame(tick);
  }
  function start() {
    last = 0;
    if (!raf && m && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function clear() {
    for (var i = 0; i < kids.length; i++) kids[i].el.parentNode.removeChild(kids[i].el);
    kids = [];
  }
  return {
    /* the theme changed: its mascot (or none) and its animation speed (effects.speed) */
    apply: function (mm, spd) {
      var tok = ++token;
      m = null;
      stop();
      clear();
      if (!mm || !mm.file) return;
      rate = (typeof spd === 'number' ? spd : 1) * (typeof mm.speed === 'number' ? mm.speed : 1);
      var im = new Image();
      url = API + '/api/theme/mascot/' + mm.id + '/' + mm.file;
      im.onload = function () {
        if (tok !== token) return;
        var frames = Math.max(1, mm.frames || 1),
          walk = Math.min(frames, Math.max(1, mm.walk || frames)),
          fh = mm.size || 96,
          fw = Math.max(8, Math.round((fh * (im.naturalWidth / frames)) / im.naturalHeight));
        m = { id: mm.id, file: mm.file, frames: frames, walk: walk, y: mm.y || 0, flip: mm.flip !== false, pixel: !!mm.pixel };
        var n = Math.min(4, Math.max(1, mm.count || 1));
        for (var i = 0; i < n; i++) {
          var kid = new Kid(i);
          kid.size(fw, fh);
          kid.x = rate > 0 ? Math.min(kid.maxX(), Math.max(MIN_X, rnd(120, 1700))) : 96 + i * (fw + 40);
          kid.draw();
          kid.el.classList.add('on');
          kids.push(kid);
        }
        start();
      };
      im.src = url;
    },
    /* the focus moved: the characters hop */
    poke: function () {
      if (!m || rate <= 0) return;
      for (var i = 0; i < kids.length; i++) kids[i].poke();
    },
    /* for a screenshot (tools/theme-preview.mjs): standing in a row at the right, a few seconds */
    still: function () {
      if (!m) return;
      var x = 1480;
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i];
        k.x = Math.min(k.maxX(), x);
        x += k.fw + 24;
        k.dir = 1;
        k.frame = i === 1 ? pose('wave') : i === 2 ? pose('happy') : 0;
        k.rot = 0;
        k.y = 0;
        k.sc = 1;
        k.st = { kind: 'rest', start: performance.now(), dur: 8000, pose: k.frame };
        k.draw();
      }
    },
    shown: start,
    hidden: stop,
  };
})();
