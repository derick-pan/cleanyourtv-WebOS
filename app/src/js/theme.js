/* ---------- theme: the service resolves the chosen theme (manager > Theme) into CSS variables and a few numbers ---------- */
var TH0 = {
    cols: 10,
    tileH: 151,
    gapY: 26,
    gt: 350,
    viewH: 780,
    dockN: 4,
    overlay: false,
    push: null,
    overlayH: 510,
    glow: '',
    slots: [],
    ampm: true,
  },
  TH = TH0,
  themeKeys = [],
  themeAttrs = ['data-bar', 'data-labels', 'data-clock', 'data-clockgrid', 'data-grid', 'data-galign', 'data-cursor', 'data-tiles'],
  GR = 2; /* the first row of the grid in `rows`: after the top row and the dock, or right after the top row without a dock */
function applyTheme(t) {
  var st = document.documentElement.style,
    b = document.body,
    k,
    ampm = TH.ampm;
  for (k = 0; k < themeKeys.length; k++) st.removeProperty(themeKeys[k]);
  themeKeys = [];
  for (k = 0; k < themeAttrs.length; k++) b.removeAttribute(themeAttrs[k]);
  b.classList.remove('grid-open');
  if (!t || !t.vars) {
    TH = TH0;
    MASCOT.apply(null, 1);
    SCENE.apply(null, 1);
    WORLD.apply(null, 1);
    $('wall').classList.remove('drift');
    return;
  }
  for (k in t.vars) {
    st.setProperty(k, t.vars[k]);
    themeKeys.push(k);
  }
  /* a centred box is placed from the right in a right-to-left language (rtl.css), so it moves the other way to its centre */
  ['clock', 'bar', 'dock'].forEach(function (n) {
    if (t.vars['--' + n + '-tx'] === 'translateX(-50%)') {
      st.setProperty('--' + n + '-txr', 'translateX(50%)');
      themeKeys.push('--' + n + '-txr');
    }
  });
  /* a theme's own typefaces (all text, and the clock's), served from its folder; the family names are in --font and --clock-font */
  var fs = $('tfont'),
    f = t.font,
    cf = t.clockFont,
    css =
      (f ? '@font-face{font-family:"CYTV Theme Font";src:url("' + API + '/api/theme/font/' + f.id + '/' + f.file + '")}' : '') +
      (cf ? '@font-face{font-family:"CYTV Clock Font";src:url("' + API + '/api/theme/font/' + cf.id + '/' + cf.file + '")}' : '');
  if (!fs) {
    fs = document.createElement('style');
    fs.id = 'tfont';
    document.head.appendChild(fs);
  }
  if (fs.textContent !== css) fs.textContent = css;
  var w = t.wallpaper;
  if (w) {
    var d = 'rgba(' + t.nightRgb + ',' + w.dim + ')';
    st.setProperty('--wall', 'linear-gradient(' + d + ',' + d + '),url("' + API + '/api/theme/wallpaper/' + w.id + '/' + w.file + '")');
    themeKeys.push('--wall');
  }
  for (k in t.attrs) b.setAttribute('data-' + k, t.attrs[k]);
  /* a theme's mascot (mascot.js), light cycles (scene.js) and world (world.js): still when the theme's animations are off; the
     wallpaper drifts (effects.drift) on its own layer */
  MASCOT.apply(t.mascot || null, +t.vars['--spd'] || 0);
  SCENE.apply(t.cycles || null, +t.vars['--spd'] || 0);
  WORLD.apply(t.world || null, +t.vars['--spd'] || 0);
  $('wall').classList.toggle('drift', +t.vars['--drift'] > 0);
  /* a line above the clock (clock.prefix), like the command that printed the time */
  $('cpre').textContent = t.clockPrefix || '';
  b.classList.toggle('cpre', !!t.clockPrefix);
  TH = {
    cols: t.cols || 10,
    tileH: t.tileH || 151,
    gapY: t.gapY || 26,
    gt: t.gt || 350,
    viewH: t.viewH || 780,
    dockN: typeof t.dockN === 'number' ? t.dockN : 4,
    overlay: !!t.overlay,
    push: t.push || null,
    overlayH: t.overlayH || 510,
    glow: t.glowRgb || '',
    slots: t.slots || [],
    ampm: t.ampm !== false,
  };
  /* the clock is redrawn at once when the theme drops or shows the AM/PM (input.js), not at its next minute */
  if (TH.ampm !== ampm) tick();
}

function setFocus(nr, nc, first) {
  var old = rows[r] && rows[r][c];
  if (old) old.classList.remove('f');
  r = nr;
  c = Math.min(nc, rows[r].length - 1);
  var e = rows[r][c];
  e.classList.add('f');
  var a = e._a,
    nm = a ? a.title : e._o ? barLabel(e._o) : '',
    n = $('name');
  if (n.textContent !== nm) n.textContent = nm;
  if (first) glowNow(e);
  else {
    glowSoon(e);
    MASCOT.poke();
    WORLD.poke();
  }
  var sh = 0;
  if (TH.push) {
    /* the grid sits under the dock: focusing it scrolls everything up (the dock stops at its 'up' position) and the grid fades in */
    document.body.classList.toggle('grid-open', r >= GR);
    var ps = 0;
    if (r >= GR) {
      var bot = TH.push.gridTop - TH.push.up + (r - GR) * (TH.tileH + TH.gapY) + TH.tileH,
        ex = Math.max(0, bot - (1080 - 60));
      ps = -(TH.push.up + ex);
    }
    $('scroll').style.transform = ps ? 'translateY(' + ps + 'px)' : '';
    $('grid').style.transform = '';
    return;
  }
  if (TH.overlay) {
    /* the grid is an overlay above the dock: it opens when the focus goes down into it and scrolls on its own */
    document.body.classList.toggle('grid-open', r >= GR);
    var gs = 0;
    if (r >= GR) gs = Math.min(0, TH.overlayH - ((r - GR) * (TH.tileH + TH.gapY) + TH.tileH + 24));
    $('grid').style.transform = gs ? 'translateY(' + gs + 'px)' : '';
    $('scroll').style.transform = '';
    return;
  }
  $('grid').style.transform = '';
  if (r >= GR) {
    var gr = rows.length - GR,
      gt = TH.gt;
    sh = Math.min(0, Math.max(50 - (gt + (r - GR) * (TH.tileH + TH.gapY)), TH.viewH - 54 - (gt + gr * TH.tileH + (gr - 1) * TH.gapY)));
  } /* row height + gap from the theme: no layout reads */
  $('scroll').style.transform = sh ? 'translateY(' + sh + 'px)' : '';
}
function mapCol(from, to, col) {
  return from > 1 ? Math.round((col * (to - 1)) / (from - 1)) : 0;
}
function posOf(e) {
  for (var i = 0; i < rows.length; i++) {
    var j = rows[i].indexOf(e);
    if (j >= 0) return [i, j];
  }
  return null;
}
