/* ---------- scene effects (effects.cycles in a theme): light cycles that race across the floor of the wallpaper, each drawing a
   line of light behind it that fades once the rider is gone. A cycle is two elements moved with transforms only (the head slides,
   the trail is a 1 px line scaled in X), so the weak GPU draws each as a small layer. They pass between effects.cyclesHorizon and
   the bottom edge, smaller and slower the further away, in the accent colour or effects.cyclesColor. The pace follows effects.cycles
   and effects.speed; either at 0 stops them. They stop while Home is hidden and sit under the dock and the grid. ---------- */
var SCENE = (function () {
  var box = null,
    c = null /* {rate, horizon, colors} */,
    live = [] /* the cycles on screen */,
    timer = 0,
    raf = 0,
    last = 0;
  function rnd(a, b) {
    return a + Math.random() * (b - a);
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
  /* a new rider at a random depth, from one side to the other */
  function spawn() {
    timer = 0;
    if (!c || document.hidden) return;
    if (live.length < 3) {
      var u = rnd(0.12, 1),
        y = c.horizon + (1080 - c.horizon) * Math.pow(u, 1.6),
        s = 0.25 + u * 1.1,
        dir = Math.random() < 0.5 ? 1 : -1,
        col = c.colors[Math.floor(Math.random() * c.colors.length)],
        head = document.createElement('div'),
        trail = document.createElement('div');
      head.className = 'cyc';
      trail.className = 'cyct';
      head.style.width = Math.round(34 * s) + 'px';
      head.style.height = Math.round(9 * s) + 'px';
      head.style.background = col;
      head.style.boxShadow = '0 0 ' + Math.round(14 * s) + 'px ' + col;
      trail.style.height = Math.max(2, Math.round(3 * s)) + 'px';
      trail.style.background = col;
      trail.style.boxShadow = '0 0 ' + Math.round(8 * s) + 'px ' + col;
      var x0 = dir > 0 ? -80 : 2000;
      el().appendChild(trail);
      el().appendChild(head);
      live.push({ head: head, trail: trail, x: x0, x0: x0, y: y, dir: dir, v: (380 + 520 * u) * c.rate, w: 34 * s, gone: 0 });
      draw(live[live.length - 1]);
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    }
    timer = setTimeout(spawn, rnd(1400, 5200) / c.rate);
  }
  function draw(r) {
    r.head.style.transform = 'translate(' + Math.round(r.x) + 'px,' + Math.round(r.y) + 'px)';
    var len = Math.max(1, Math.abs(r.x - r.x0));
    r.trail.style.transform =
      'translate(' + Math.round(r.x0) + 'px,' + Math.round(r.y) + 'px) scaleX(' + (r.dir > 0 ? len : -len).toFixed(1) + ')';
  }
  function tick(now) {
    raf = 0;
    if (!c || document.hidden) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    for (var i = live.length - 1; i >= 0; i--) {
      var r = live[i];
      if (!r.gone) {
        r.x += r.dir * r.v * dt;
        draw(r);
        if (r.x < -120 || r.x > 2040) {
          /* off the screen: the trail stays a moment, then fades and goes */
          r.gone = now;
          r.head.parentNode.removeChild(r.head);
          r.trail.classList.add('fade');
        }
      } else if (now - r.gone > 2600) {
        r.trail.parentNode.removeChild(r.trail);
        live.splice(i, 1);
      }
    }
    if (live.length) raf = requestAnimationFrame(tick);
  }
  function clear() {
    clearTimeout(timer);
    timer = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    for (var i = 0; i < live.length; i++) {
      if (live[i].head.parentNode) live[i].head.parentNode.removeChild(live[i].head);
      if (live[i].trail.parentNode) live[i].trail.parentNode.removeChild(live[i].trail);
    }
    live = [];
  }
  function start() {
    if (c && !timer && !document.hidden) timer = setTimeout(spawn, rnd(400, 1500) / c.rate);
  }
  return {
    /* the theme changed: its cycles (or none) and its animation speed (effects.speed) */
    apply: function (cc, spd) {
      clear();
      c = null;
      if (!cc || !(cc.rate > 0) || !(spd > 0)) return;
      c = { rate: cc.rate * spd, horizon: cc.horizon, colors: cc.colors };
      start();
    },
    shown: start,
    hidden: clear,
  };
})();
