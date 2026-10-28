/* ---------- mascot (mascot.* in a theme): a small character that walks along the bottom of Home. The theme gives a picture (one
   frame, or a strip of frames side by side: a walk cycle, the first frame standing); the launcher moves it with transforms only, so
   the weak GPU draws it as one layer. It walks left and right, rests, hops, spins, dashes, wiggles and peeks from an edge, and hops
   once when the focus moves. The pace follows mascot.speed and effects.speed; either at 0 leaves it standing. It stops while Home is
   hidden (document.hidden) and sits under the menus, toasts and Live TV. ---------- */
var MASCOT = (function () {
  var el = null,
    strip = null,
    m = null /* the theme's mascot: {id, file, frames, size, y, speed, flip} */,
    fw = 0,
    fh = 0 /* one frame on screen, in px */,
    rate = 1 /* mascot.speed x effects.speed */,
    x = 96,
    dir = 1,
    rot = 0,
    y = 0 /* the hop height */,
    frame = 0,
    ftime = 0,
    st = null /* what it is doing: {kind, ...} */,
    raf = 0,
    last = 0,
    token = 0;
  var MIN_X = 24;
  function maxX() {
    return 1920 - fw - 24;
  }
  function els() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'mascot';
    strip = document.createElement('div');
    strip.id = 'mascot-strip';
    el.appendChild(strip);
    document.body.appendChild(el);
    return el;
  }
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
  /* the next thing it does: mostly a walk somewhere, now and then a trick */
  function next(now) {
    var k = pick(['walk', 'walk', 'walk', 'rest', 'rest', 'hop', 'spin', 'dash', 'peek', 'wiggle']);
    if (k === 'walk' || k === 'dash' || k === 'spin') {
      var to = rnd(MIN_X, maxX());
      if (Math.abs(to - x) < 160) to = x + (x < 960 ? 400 : -400);
      to = Math.min(maxX(), Math.max(MIN_X, to));
      st = { kind: k, to: to, v: (k === 'dash' ? 520 : k === 'spin' ? 120 : 150) * rate, start: now };
      dir = to > x ? 1 : -1;
    } else if (k === 'rest') st = { kind: 'rest', start: now, until: now + rnd(1200, 3200) / rate };
    else if (k === 'hop') st = { kind: 'hop', start: now, n: Math.floor(rnd(1, 4)), dur: 420 / rate };
    else if (k === 'wiggle') st = { kind: 'wiggle', start: now, dur: 900 / rate };
    else {
      /* peek: walk off one edge, wait, and come back */
      var edge = x < 960 ? -fw * 0.75 : 1920 - fw * 0.25;
      st = { kind: 'peek', to: edge, back: x < 960 ? MIN_X + 60 : maxX() - 60, v: 150 * rate, phase: 0, start: now };
      dir = edge > x ? 1 : -1;
    }
  }
  /* a step towards `to` at `v` px/s, stepping through the walk frames; true once it is there */
  function walkTo(dt, to, v) {
    var d = to - x,
      step = Math.min(Math.abs(d), v * dt);
    x += d < 0 ? -step : step;
    ftime += dt * (v / 150);
    frame = m.frames > 1 ? 1 + (Math.floor(ftime * 8) % (m.frames - 1)) : 0;
    return Math.abs(to - x) < 0.5;
  }
  function tick(now) {
    raf = 0;
    if (!m || document.hidden || !el) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    rot = 0;
    y = 0;
    if (rate <= 0) {
      frame = 0;
      draw();
      return;
    }
    if (!st) next(now);
    var k = st.kind,
      t = now - st.start;
    if (k === 'walk' || k === 'dash') {
      if (walkTo(dt, st.to, st.v)) st = null;
    } else if (k === 'spin') {
      rot = ((t / 1000) * 360 * rate) % 360;
      if (walkTo(dt, st.to, st.v)) st = null;
      frame = 0;
    } else if (k === 'rest') {
      frame = 0;
      if (now >= st.until) st = null;
    } else if (k === 'hop') {
      var p = (t / st.dur) % 1,
        n = Math.floor(t / st.dur);
      frame = 0;
      y = -Math.sin(p * Math.PI) * fh * 0.55;
      rot = Math.sin(p * Math.PI) * 10 * dir;
      if (n >= st.n) st = null;
    } else if (k === 'wiggle') {
      frame = 0;
      rot = Math.sin((t / st.dur) * Math.PI * 6) * 14;
      if (t >= st.dur) st = null;
    } else if (k === 'peek') {
      if (st.phase === 0) {
        if (walkTo(dt, st.to, st.v)) {
          st.phase = 1;
          st.until = now + rnd(900, 2200) / rate;
        }
      } else if (st.phase === 1) {
        frame = 0;
        if (now >= st.until) {
          st.phase = 2;
          dir = st.back > x ? 1 : -1;
        }
      } else if (walkTo(dt, st.back, st.v)) st = null;
    }
    draw();
    raf = requestAnimationFrame(tick);
  }
  function draw() {
    var base = 1080 - fh - m.y;
    el.style.transform =
      'translate(' + Math.round(x) + 'px,' + Math.round(base + y) + 'px)' + (rot ? ' rotate(' + rot.toFixed(1) + 'deg)' : '');
    var fr = Math.min(frame, m.frames - 1);
    /* mirrored (origin at the box's left edge): the frame lands in the box when it is shifted one frame further */
    strip.style.transform = m.flip && dir < 0 ? 'scaleX(-1) translateX(' + -(fr + 1) * fw + 'px)' : 'translateX(' + -fr * fw + 'px)';
  }
  function start() {
    last = 0;
    if (!raf && m && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  return {
    /* the theme changed: its mascot (or none) and its animation speed (effects.speed) */
    apply: function (mm, spd) {
      var tok = ++token;
      m = null;
      st = null;
      stop();
      if (el) el.classList.remove('on');
      if (!mm || !mm.file) return;
      rate = (typeof spd === 'number' ? spd : 1) * (typeof mm.speed === 'number' ? mm.speed : 1);
      var im = new Image(),
        url = API + '/api/theme/mascot/' + mm.id + '/' + mm.file;
      im.onload = function () {
        if (tok !== token) return;
        var frames = Math.max(1, mm.frames || 1);
        fh = mm.size || 96;
        fw = Math.max(8, Math.round((fh * (im.naturalWidth / frames)) / im.naturalHeight));
        m = { id: mm.id, file: mm.file, frames: frames, size: fh, y: mm.y || 0, speed: mm.speed, flip: mm.flip !== false };
        var e = els();
        e.style.width = fw + 'px';
        e.style.height = fh + 'px';
        strip.style.width = fw * frames + 'px';
        strip.style.height = fh + 'px';
        strip.style.backgroundImage = 'url("' + url + '")';
        x = rate > 0 ? Math.min(maxX(), Math.max(MIN_X, rnd(200, 1600))) : 96;
        dir = 1;
        frame = 0;
        draw();
        e.classList.add('on');
        start();
      };
      im.src = url;
    },
    /* the focus moved: a little hop, unless it is in the middle of a trick */
    poke: function () {
      if (m && rate > 0 && (!st || st.kind === 'walk' || st.kind === 'rest'))
        st = { kind: 'hop', start: performance.now(), n: 1, dur: 360 / rate };
    },
    /* for a screenshot (tools/theme-preview.mjs): standing still at the right, a few seconds */
    still: function () {
      if (!m) return;
      x = Math.min(maxX(), 1480);
      dir = 1;
      frame = 0;
      rot = 0;
      y = 0;
      st = { kind: 'rest', start: performance.now(), until: performance.now() + 8000 };
      draw();
    },
    shown: start,
    hidden: stop,
  };
})();
