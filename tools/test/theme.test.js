// Themes (theme.js): the repository's themes/ folder is valid, values are checked and clamped, extends works, a theme is downloaded
// from GitHub (a local stand-in here) when chosen and kept, a bad download is refused, and the service ships none.
const fs = require('fs'),
  path = require('path');
const { root, tmp, ok, call, serve, req, memoryConfig, run } = require('./lib');
const nc = req('netcompat');

run(async () => {
  const themeMod = req('theme'),
    tdir = path.join(root, 'themes');
  const folders = fs.readdirSync(tdir).filter(n => fs.statSync(path.join(tdir, n)).isDirectory());
  ok(folders.length >= 5 && folders.indexOf('classic') >= 0, 'the themes folder holds one folder per theme');
  const known = new Set(themeMod.SCHEMA.map(r => r[0])),
    unknownKeys = [];
  const walk = (o, pre) => {
    for (const k of Object.keys(o)) {
      const key = pre ? pre + '.' + k : k;
      if (key === 'slots' || key === 'world') continue; // checked by themeschema.slots and themeschema.world
      if (o[k] && typeof o[k] === 'object') walk(o[k], key);
      else if (!known.has(key) && ['name', 'author', 'description', 'extends'].indexOf(key) < 0) unknownKeys.push(key);
    }
  };
  let allOk = true;
  const tbad = [];
  for (const id of folders) {
    const fd = path.join(tdir, id);
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(fd, 'theme.json'), 'utf8'));
    } catch (e) {
      allOk = false;
      tbad.push(id + ': theme.json');
      continue;
    }
    const t = themeMod.normalize(raw, id, null, fd);
    walk(raw, '');
    if (!t || (raw.effects && raw.effects.wallpaper && t.v['effects.wallpaper'] !== raw.effects.wallpaper)) {
      allOk = false;
      tbad.push(id + ': theme or wallpaper');
    }
    const pv = ['jpg', 'png', 'webp'].map(x => path.join(fd, 'preview.' + x)).filter(f => fs.existsSync(f))[0];
    if (!pv || !themeMod.imageOk(fs.readFileSync(pv), pv, 600 * 1024)) {
      allOk = false;
      tbad.push(id + ': screenshot (preview.jpg, an image of at most 600 KB)');
    }
  }
  ok(allOk, 'every theme folder has a valid theme.json, its wallpaper and a screenshot' + (tbad.length ? ': ' + tbad.join('; ') : ''));
  ok(unknownKeys.length === 0, 'theme files use only keys of the schema' + (unknownKeys.length ? ': ' + unknownKeys.join(', ') : ''));
  // what the service downloads at most (MAX_THEME)
  const MAX_THEME = require(path.join(root, 'helper', 'themeschema.js')).MAX_THEME,
    tooBig = folders.filter(id => !(fs.statSync(path.join(tdir, id, 'theme.json')).size <= MAX_THEME));
  ok(!tooBig.length, 'every theme.json is within what the service downloads' + (tooBig.length ? ': ' + tooBig.join(', ') : ''));
  ok(
    fs.readFileSync(path.join(tdir, 'index.json'), 'utf8') === require(path.join(root, 'tools', 'theme-index.js')).build(),
    'themes/index.json is up to date (run: node tools/theme-index.js)'
  );
  ok(
    themeMod.SCHEMA.every(r => ['name', 'author', 'description', 'extends'].indexOf(r[0].split('.')[0]) < 0),
    "no setting group shares a name with the theme's own fields (name, author, description, extends)"
  );
  const bad = themeMod.normalize(
    {
      name: 'x'.repeat(500),
      colors: { night: 'red; background:url(//evil)', ink: '#12345', accent: 5 },
      grid: { cols: 99, tileH: -5, radius: 1e9, mode: 'sideways', align: 'middle' },
      type: { scale: '2', font: 'comic' },
      clock: { layout: 'sideways', scale: 50 },
      effects: { glow: 7, speed: NaN, wallpaper: '../../etc/passwd', wallpaperDim: 5 },
      css: 'body{display:none}',
    },
    'evil'
  );
  ok(
    bad.name.length === 40 &&
      bad.v['colors.night'] === '#07080b' &&
      bad.v['colors.ink'] === '#f5f6f8' &&
      bad.v['colors.accent'] === '#f5f6f8',
    'colours must be #rrggbb, anything else falls back'
  );
  ok(
    bad.v['grid.cols'] === 14 &&
      bad.v['grid.tileH'] === 32 &&
      bad.v['grid.radius'] === 100 &&
      bad.v['grid.mode'] === 'below' &&
      bad.v['grid.align'] === 'left' &&
      bad.v['type.scale'] === 1 &&
      bad.v['type.font'] === 'default' &&
      bad.v['clock.layout'] === 'inline' &&
      bad.v['clock.scale'] === 8,
    'numbers are clamped, enums and types are checked'
  );
  ok(
    bad.v['effects.glow'] === 1 &&
      bad.v['effects.speed'] === 1 &&
      bad.v['effects.wallpaper'] === '' &&
      bad.v['effects.wallpaperDim'] === 0.9 &&
      !('css' in bad.v),
    'effects are clamped, a wallpaper path is refused and unknown keys are dropped'
  );
  ok(themeMod.normalize({}, '../x') === null, 'a bad theme id is refused');
  // clock.greeting and dock.tileAlpha: a stacked greeting over the clock and a see-through dock
  const glass = themeMod.resolve(themeMod.normalize({ clock: { layout: 'stack', greeting: true }, dock: { tileAlpha: 0.3 } }, 'glass'));
  ok(
    glass.vars['--greet-d'] === 'block' && glass.vars['--dock-tile-alpha'] === '0.3' && glass.attrs.clock === 'stack',
    'clock.greeting shows the greeting and dock.tileAlpha makes the dock tiles see-through'
  );
  const plain = themeMod.resolve(themeMod.normalize({}, 'plain'));
  ok(
    plain.vars['--greet-d'] === 'none' && plain.vars['--dock-tile-alpha'] === '1',
    'by default there is no greeting and the dock tiles are opaque'
  );
  // dock.tileFrost and dock.tileFrostColor: a tint over the resting tiles, its colour resolved to an rgb triple
  const frost = themeMod.resolve(themeMod.normalize({ dock: { tileFrost: 0.4, tileFrostColor: '#ffffff' } }, 'frost'));
  ok(
    frost.vars['--dock-tile-frost'] === '0.4' && frost.vars['--dock-frost-rgb'] === '255,255,255',
    'dock.tileFrost sets the frost and dock.tileFrostColor becomes its rgb tint'
  );
  ok(plain.vars['--dock-tile-frost'] === '0' && plain.vars['--dock-frost-rgb'] === '255,255,255', 'by default there is no dock-tile frost');
  // slots for cards: checked and clamped, placed like the clock, kept by a theme that extends it, and only in replies of themes with slots
  const slotted = themeMod.normalize(
    {
      slots: [
        { id: 'greeting', anchor: 'top', align: 'left', x: 102, y: 70, w: 900, h: 26, card: 'greeting', grid: 'keep' },
        { id: 'side', align: 'right', w: 99999, card: 'Bad Type!' },
        { id: 'side', align: 'center' },
        { id: '../x' },
        { id: 'mid', align: 'center', anchor: 'bottom', x: 300, y: 40 },
      ],
    },
    'slotted'
  );
  const rs = themeMod.resolve(slotted).slots;
  ok(
    rs.length === 3 &&
      rs[0].l === '102px' &&
      rs[0].t === '70px' &&
      rs[0].w === '900px' &&
      rs[0].card === 'greeting' &&
      rs[0].keep === true &&
      rs[1].r === '96px' &&
      rs[1].w === '1920px' &&
      rs[1].card === '' &&
      rs[1].keep === false &&
      rs[2].l === '50%' &&
      rs[2].b === '40px' &&
      rs[2].tx === 'translateX(-50%)',
    'theme slots are checked, clamped and placed (a duplicate or bad id is dropped)'
  );
  ok(
    themeMod.resolve(themeMod.normalize({ name: 'kid' }, 'kid2', slotted.v)).slots.length === 3 &&
      !('slots' in themeMod.resolve(themeMod.normalize({ slots: [] }, 'none2', slotted.v))) &&
      !('slots' in plain),
    'a theme that extends one with slots keeps them, "slots": [] removes them, and a theme without slots has no slots key'
  );
  const cardsShape = req('cards');
  const cs = cardsShape.sanitize({
    greeting: { type: 'greeting', name: 'Salih', x: { deep: { deeper: 1 } } },
    side: { type: 'ha-entities', entities: ['light.a', { entity: 'sensor.b', name: 'B' }, { nested: { no: 1 } }] },
    'Bad Id': { type: 'greeting' },
    row: { type: 'Not Valid' },
    empty: { type: 'none' },
  });
  ok(
    JSON.stringify(cs) ===
      JSON.stringify({
        greeting: { type: 'greeting', name: 'Salih' },
        side: { type: 'ha-entities', entities: ['light.a', { entity: 'sensor.b', name: 'B' }, {}] },
        empty: { type: 'none' },
      }) && cardsShape.sanitize([]) === undefined,
    'cards from the launcher are checked for shape: slot ids, card types, short option values'
  );
  const tbase = themeMod.normalize({ grid: { cols: 7 }, dock: { count: 6 } }, 'base'),
    tkid = themeMod.normalize({ grid: { cols: 'many' }, bar: { style: 'round' } }, 'kid', tbase.v);
  ok(
    tkid.v['grid.cols'] === 7 && tkid.v['dock.count'] === 6 && tkid.v['bar.style'] === 'round',
    'a theme that extends another keeps its values where its own are missing or invalid'
  );

  // a stand-in for raw.githubusercontent.com: the repository's folder, plus a few themes that are wrong on purpose
  const tWrong = {
    kid: JSON.stringify({ name: 'Kid', extends: 'bloom', bar: { style: 'flat' } }),
    notjson: '{ this is not json',
    huge: JSON.stringify({ name: 'x'.repeat(70000) }),
    badwall: JSON.stringify({ name: 'Bad wallpaper', effects: { wallpaper: 'w.jpg' } }),
    orphan: JSON.stringify({ name: 'Orphan', extends: 'missing-base' }),
    pixkid: JSON.stringify({ name: 'Pixel kid', extends: 'pixel', dock: { count: 4 } }),
    badfont: JSON.stringify({ name: 'Bad typeface', type: { fontFile: 'f.woff2' } }),
    badmascot: JSON.stringify({ name: 'Bad mascot', mascot: { file: 'm.png' } }),
    walker: JSON.stringify({ name: 'Walker', mascot: { file: 'w.png', frames: 2 } }),
    badworld: JSON.stringify({ name: 'Bad world', world: { file: 'w.png', crew: { count: 2 } } }),
  };
  let ghUp = true;
  const ghHits = [];
  const gh = await serve((q, r) => {
    const u = q.url.split('?')[0];
    ghHits.push(u);
    const send = (c, b, t) => {
      r.writeHead(c, { 'content-type': t || 'application/octet-stream' });
      r.end(b);
    };
    if (!ghUp) return q.socket.destroy();
    let m = /^\/themes\/([a-z0-9-]+)\/theme\.json$/.exec(u);
    if (m && tWrong[m[1]]) return send(200, tWrong[m[1]]);
    if (/^\/themes\/badwall\/w\.jpg$/.test(u)) return send(200, Buffer.from('this is not a jpeg at all, just text'));
    if (/^\/themes\/badfont\/f\.woff2$/.test(u)) return send(200, Buffer.from('this is not a font file, only some text'));
    if (/^\/themes\/badmascot\/m\.png$/.test(u)) return send(200, Buffer.from('this is not a png, only some text'));
    if (/^\/themes\/walker\/w\.png$/.test(u)) return send(200, fs.readFileSync(path.join(tdir, 'claude', 'clawd.png')));
    if (/^\/themes\/badworld\/w\.png$/.test(u)) return send(200, Buffer.from('this is not a sprite sheet, only some text'));
    const f = path.join(root, u);
    if (!f.startsWith(tdir + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return send(404, 'no');
    send(200, fs.readFileSync(f));
  });
  const tlocal = path.join(tmp, 'themes-local');
  nc.mkdirp(path.join(tlocal, 'wallpapers'));
  fs.writeFileSync(path.join(tlocal, 'old.json'), '{}');
  fs.writeFileSync(path.join(tlocal, 'wallpapers', 'x.jpg'), 'x');
  process.env.CYTV_THEMES = tlocal;
  process.env.CYTV_THEMES_URL = gh.url + '/themes';
  const th = themeMod.create({ config: memoryConfig(), noStartup: true });
  ok(
    !fs.existsSync(path.join(tlocal, 'old.json')) && !fs.existsSync(path.join(tlocal, 'wallpapers')),
    'the files of the earlier layout (themes shipped with the service) are removed'
  );
  const tcall = (act, body, method) => call(th, '/api/theme/' + act, method || 'POST', body);
  let r = await tcall('list', null, 'GET');
  ok(
    r.j.current.id === 'classic' && r.j.themes.length === folders.length && r.j.themes[0].id === 'classic' && r.j.catalogue.ok === true,
    'the list comes from themes/index.json on GitHub, Classic first'
  );
  const rb = r.j.themes.filter(x => x.id === 'bloom')[0];
  ok(
    rb && rb.installed === false && rb.preview === true && /flower/i.test(rb.description),
    'a theme that is not on the TV is listed with its description and screenshot'
  );
  const rv = th.resolved();
  ok(
    rv.vars['--cols'] === '10' &&
      rv.vars['--tile-h'] === '151px' &&
      rv.vars['--acc'] === '#f5f6f8' &&
      rv.vars['--view-top'] === '300px' &&
      rv.vars['--dock-t'] === '60px' &&
      rv.vars['--grid-t'] === '350px' &&
      rv.cols === 10 &&
      rv.attrs.grid === 'below',
    'Classic is built in and resolves to the original positions'
  );
  const pv = await call(th, '/api/theme/preview/bloom', 'GET');
  ok(pv.code === 200 && Buffer.isBuffer(pv.out) && pv.out.length > 1000, 'the screenshot is fetched from GitHub and served');
  const hitsBefore = ghHits.length;
  await call(th, '/api/theme/preview/bloom', 'GET');
  ok(ghHits.length === hitsBefore, 'a screenshot is kept on the TV and not fetched again');
  r = await tcall('set', { id: 'bloom' });
  ok(
    r.code === 200 && r.j.current.id === 'bloom' && r.j.themes.filter(x => x.id === 'bloom')[0].installed === true,
    'choosing a theme downloads it and applies it'
  );
  ok(
    fs.existsSync(path.join(tlocal, 'bloom', 'theme.json')) && fs.existsSync(path.join(tlocal, 'bloom', 'bloom.jpg')),
    'the theme file and its wallpaper are kept on the TV'
  );
  const bl = th.resolved();
  ok(
    bl.wallpaper &&
      bl.wallpaper.id === 'bloom' &&
      bl.wallpaper.file === 'bloom.jpg' &&
      bl.attrs.grid === 'push' &&
      bl.attrs.galign === 'center' &&
      bl.push &&
      bl.push.up > 0 &&
      bl.dockN === 6 &&
      bl.vars['--dock-t'] !== 'auto' &&
      bl.vars['--dock-b'] === 'auto' &&
      bl.vars['--tile-w'] === '193px',
    'a dock at the bottom with the push layout resolves to a scrolling grid below it, centred'
  );
  r = await tcall('wallpaper/bloom/bloom.jpg', null, 'GET');
  ok(r.code === 200, 'a downloaded wallpaper is served');
  r = await tcall('wallpaper/bloom/other.jpg', null, 'GET');
  ok(r.code === 404, 'a file the theme does not name is not served');
  r = await tcall('wallpaper/..%2f..%2fpasswd', null, 'GET');
  ok(r.code === 404, 'a path is not served as a wallpaper');
  // a theme's own typeface: downloaded with the theme, served from its folder, named first in --font
  ok(
    themeMod.fontOk(Buffer.from('wOF2' + 'x'.repeat(40)), 'a.woff2') &&
      !themeMod.fontOk(Buffer.from('wOF2' + 'x'.repeat(40)), 'a.ttf') &&
      !themeMod.fontOk(Buffer.from('<html>' + 'x'.repeat(40)), 'a.woff2'),
    'a typeface file is checked by its first bytes against its name'
  );
  r = await tcall('set', { id: 'pixel' });
  const px = th.resolved();
  ok(
    r.code === 200 &&
      fs.existsSync(path.join(tlocal, 'pixel', 'pixel.woff2')) &&
      px.font &&
      px.font.id === 'pixel' &&
      px.font.file === 'pixel.woff2' &&
      /^"CYTV Theme Font",/.test(px.vars['--font']),
    "a theme's typeface is downloaded with it and named first in the font"
  );
  r = await tcall('font/pixel/pixel.woff2', null, 'GET');
  ok(r.code === 200, 'the typeface is served');
  r = await tcall('font/pixel/other.woff2', null, 'GET');
  ok(r.code === 404, 'a typeface the theme does not name is not served');
  // the clock's own settings: a typeface for the time only, the date above it, a translucent outlined clock, a dark dock panel
  const big = themeMod.normalize(
    {
      clock: {
        layout: 'above',
        grid: 'hide',
        ampm: false,
        scale: 7,
        weight: 300,
        alpha: 0.4,
        outline: 0.5,
        color: '#ffe8ee',
        fontFile: 'antonio.woff2',
      },
      dock: { panel: 0.4, panelColor: '#1e141c' },
    },
    'cupertino',
    null,
    path.join(tdir, 'cupertino')
  );
  const bg = themeMod.resolve(big);
  ok(
    bg.attrs.clock === 'above' &&
      bg.attrs.clockgrid === 'hide' &&
      bg.ampm === false &&
      bg.vars['--clock-s'] === '7' &&
      bg.vars['--clock-fw'] === '300' &&
      bg.vars['--clock-op'] === '0.4' &&
      bg.vars['--clock-stroke'] === '1.5px rgba(255,232,238,0.5)' &&
      bg.vars['--clock-c'] === '#ffe8ee' &&
      /^"CYTV Clock Font",/.test(bg.vars['--clock-font']) &&
      bg.clockFont &&
      bg.clockFont.file === 'antonio.woff2' &&
      bg.vars['--dock-panel-rgb'] === '30,20,28',
    'a big glass clock with its own typeface, the date above it and a dark dock panel resolve'
  );
  ok(
    !('clockgrid' in plain.attrs) &&
      !('ampm' in plain) &&
      plain.vars['--clock-stroke'] === '0' &&
      plain.vars['--clock-c'] === '#f5f6f8' &&
      !('clockFont' in plain) &&
      plain.vars['--dock-panel-rgb'] === '255,255,255',
    'by default the clock is plain, stays with the grid, uses the text colour and the panel is white'
  );
  r = await tcall('set', { id: 'cupertino' });
  ok(
    r.code === 200 &&
      fs.existsSync(path.join(tlocal, 'cupertino', 'antonio.woff2')) &&
      th.resolved().clockFont &&
      th.resolved().clockFont.id === 'cupertino',
    'a clock typeface is downloaded with the theme'
  );
  r = await tcall('font/cupertino/antonio.woff2', null, 'GET');
  ok(r.code === 200, 'the clock typeface is served');
  // motion and a prompt: a drifting wallpaper, light cycles, a prefix and a cursor on the app name, a pixel-art mascot
  const mv = themeMod.resolve(
    themeMod.normalize(
      {
        shelf: { prefix: '$ ', cursor: true },
        effects: { drift: 0.5, cycles: 1, cyclesHorizon: 660, cyclesColor: '#ff8a3d', speed: 0.5 },
        mascot: { file: 'clawd.png', pixel: true, frames: 11, walk: 5 },
      },
      'claude',
      null,
      path.join(tdir, 'claude')
    )
  );
  ok(
    mv.vars['--name-pre'] === '"$ "' &&
      mv.attrs.cursor === 'on' &&
      mv.vars['--drift'] === '0.5' &&
      mv.vars['--drift-dur'] === '140s' &&
      mv.cycles &&
      mv.cycles.rate === 1 &&
      mv.cycles.horizon === 660 &&
      mv.cycles.colors[1] === '#ff8a3d' &&
      mv.cycles.scene === '' &&
      mv.mascot.pixel === true &&
      mv.mascot.walk === 5,
    'a prompt prefix, a cursor, a drifting wallpaper, light cycles and a pixel mascot resolve'
  );
  const city = themeMod.resolve(themeMod.normalize({ effects: { scene: 'lightcity', beamX: 1230 } }, 'city'));
  ok(
    city.cycles && city.cycles.cycles === 0 && city.cycles.scene === 'lightcity' && city.cycles.beamX === 1230,
    'a light city without riders still resolves its scene and the beam'
  );
  const nomv = themeMod.resolve(themeMod.normalize({ shelf: { prefix: 'a"b', cursor: 'yes' }, effects: { drift: 1, speed: 0 } }, 'nomv'));
  ok(
    nomv.vars['--name-pre'] === '""' &&
      !('cursor' in nomv.attrs) &&
      nomv.vars['--drift'] === '0' &&
      !('cycles' in plain) &&
      plain.vars['--drift'] === '0' &&
      plain.vars['--drift-dur'] === '70s' &&
      plain.vars['--name-pre'] === '""',
    'a prefix with other characters is refused, the cursor needs true, animations off stop the drift, and the defaults have none'
  );
  // a terminal: text tiles with a marker, no dock, one column, a line above the clock and the grid
  const term = themeMod.resolve(
    themeMod.normalize(
      {
        tile: { style: 'text', marker: '> ' },
        dock: { show: false },
        grid: { cols: 1, tileH: 44, prefix: '$ ls apps/' },
        clock: { prefix: '$ date' },
      },
      'term'
    )
  );
  ok(
    term.attrs.tiles === 'text' &&
      term.vars['--tile-pre'] === '"> "' &&
      term.dockN === 0 &&
      term.vars['--dock-d'] === 'none' &&
      term.cols === 1 &&
      term.tileH === 44 &&
      term.vars['--grid-pre'] === '"$ ls apps/"' &&
      term.clockPrefix === '$ date',
    'text tiles, a hidden dock, one column of lines and the prompt lines above the clock and the grid resolve'
  );
  ok(
    !('tiles' in plain.attrs) &&
      !('clockPrefix' in plain) &&
      plain.dockN === 4 &&
      plain.vars['--dock-d'] === 'flex' &&
      plain.vars['--tile-pre'] === '""' &&
      plain.vars['--grid-pre'] === '""',
    'by default the tiles are icons on a dock and a grid without prompt lines'
  );
  r = await tcall('set', { id: 'pixkid' });
  ok(
    r.code === 200 && th.resolved().font && th.resolved().font.id === 'pixel' && th.resolved().dockN === 4,
    'a theme that extends one with a typeface uses that file from its folder'
  );
  r = await tcall('set', { id: 'badfont' });
  ok(r.code !== 200 && !fs.existsSync(path.join(tlocal, 'badfont')), 'a typeface that is not a font is refused and nothing is kept');
  // a mascot (mascot.*): an image in the theme's folder, checked like a wallpaper, downloaded with the theme and served from its folder;
  // only a theme with one has the key in its reply, so the other themes' replies stay as they were
  const mt = themeMod.normalize(
    { mascot: { file: 'clawd.png', frames: 6, walk: 0, count: 9, size: 999, y: 28, speed: 1, flip: false } },
    'claude',
    null,
    path.join(tdir, 'claude')
  );
  const mr = themeMod.resolve(mt);
  ok(
    mr.mascot &&
      mr.mascot.id === 'claude' &&
      mr.mascot.file === 'clawd.png' &&
      mr.mascot.frames === 6 &&
      mr.mascot.walk === 0 &&
      mr.mascot.count === 4 &&
      mr.mascot.size === 240 &&
      mr.mascot.y === 28 &&
      mr.mascot.flip === false,
    'a mascot resolves with its frames, its position and a clamped size'
  );
  ok(
    !('mascot' in plain) && themeMod.normalize({ mascot: { file: 'nope.png' } }, 'nomascot').v['mascot.file'] === '',
    'a theme without a mascot has no mascot key, and a mascot file that is not there is dropped'
  );
  ok(
    themeMod.resolve(themeMod.normalize({ name: 'kid' }, 'claude-kid', mt.v)).mascot.id === 'claude',
    'a theme that extends one with a mascot uses that file from its folder'
  );
  // a world: values are clamped, names that are not sprites are dropped (a prop, a drift or a herd without one is left out), lists are
  // cut to their limits; it needs a sprite sheet that is there, a theme that extends one keeps it, and only a theme with one has the key
  const many = n => Array.apply(null, Array(n)).map(() => ({ s: 'stand', act: 'stand' }));
  const wd = themeMod.normalize(
    {
      world: {
        file: 'clawd.png',
        px: 99,
        sprites: {
          stand: [0, 0, 16, 10, 8],
          walk: [0, 10, 16, 11, 4, 8, 11],
          cap: [0, 30, 16, 10, 4, 8, 10, 99],
          'Bad Name': [1, 2, 3, 4],
          short: [1, 2],
          huge: [1e9, -5, 9999, 0, 99, 99, -3, 0],
        },
        crew: {
          count: 50,
          speed: 1,
          stand: 'stand',
          climb: 'nope',
          wait: 'cap',
          looks: 99,
          bubble: -5,
          lane: [905, 1570, -999],
          chat: { every: [1, 99999], say: ['nope', 'cap'], act: 'nope' },
          hats: [
            { look: 99, when: { d: ['10-31', '10-31'] } },
            { looks: [7, 0, 'x', 9, 11, 12], when: { near: ['easter', -90, -99] } },
            { look: 6, when: { near: ['diwali', 0, 1] } },
          ],
          members: [{ name: 'cap', likes: ['games', 'Bad', 'code'] }, { name: 'nope' }],
          hello: ['cap', 'nope'],
        },
        spots: [
          { x: 9999, y: 860, act: 'walk', time: [30, 2], via: [940, 860], fx: { s: 'stand', kind: 'boom', every: 0 } },
          { act: 'nope', n: 9, acts: ['cap', 'nope', 'walk'], group: 'Bad Group', tag: 'Bad Tag', say: { s: ['nope'] } },
          {
            act: 'cap',
            path: [[1, 2, 'up'], [3], [5000, -5000, 0], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8]],
            group: 'games',
            tag: 'games',
            show: [{ s: 'cap', x: 10, y: 20 }, { s: 'nope' }, { s: 'stand' }, { s: 'stand' }, { s: 'stand' }, { s: 'stand' }],
            say: { s: ['nope', 'cap'], every: 9999 },
            when: { h: [22, 6], d: ['13-01', '01-01'] },
            w: 99,
          },
          'junk',
        ].concat(many(45)),
        props: [
          { s: 'nope' },
          { s: 'stand', front: true, bob: 99, rest: -1, when: { d: ['10-15', '11-01'] }, pan: [-5000, 1], gust: 'cap', fade: 99999 },
          { s: 'stand', pan: [0, 600], gust: 'nope', play: { s: 'cap', every: 0, fps: 99 }, phase: 'moon' },
        ].concat(many(170)),
        drift: [{ s: 'walk', dir: -1, speed: 0, when: { h: [7, 99] }, fade: -5 }, { y: 5 }],
        herds: [
          { count: 99, area: [10, 20, 30, 40], stand: 'cap', acts: ['nope', 'walk'], speed: 0, when: {} },
          { stand: 'nope' },
          {},
          { stand: 'stand' },
          { stand: 'stand' },
          { stand: 'stand' },
        ],
        events: [
          {
            every: [1, 1e9],
            time: [0, 9999],
            call: 99,
            spot: { x: 100, y: 200, n: 3, act: 'cap', when: { w: ['rain', 'Bad', 'snow'] } },
            props: [{ s: 'cap' }, { s: 'nope' }],
            drift: [
              { s: 'walk', perch: { x: -50, y: 9999, s: 'nope', fps: 0, time: [500, 0], fx: { s: 'cap', kind: 'pop' } } },
              { s: 'nope' },
            ],
            when: { h: [12, 14] },
            chance: 5,
            then: 99,
            key: 'red',
            title: '  Fire\nworks and a very long name too  ',
          },
          { chance: -1, then: -9, key: 'purple', title: 7 },
        ],
        shade: [{ color: '#06051a', alpha: 2, when: { h: [0, 5] } }, { color: 'nope', alpha: 0.5 }, { color: '#FFFFFF' }],
        wind: [{ every: [1, 99999], speed: 1, dir: 7, fps: 99, fx: { s: 'cap', kind: 'blow' } }, { when: { w: ['wind'] } }],
        weather: [{ name: 'sun', w: 5000 }, { name: 'Bad Name' }, { name: 'snow', w: 5, when: { d: ['12-01', '02-28'] } }],
        watch: 999,
      },
    },
    'claude',
    null,
    path.join(tdir, 'claude')
  );
  const wr = themeMod.resolve(wd).world;
  ok(
    wr &&
      wr.id === 'claude' &&
      wr.px === 12 &&
      Object.keys(wr.sprites).join() === 'stand,walk,cap,huge' &&
      wr.sprites.stand.join() === '0,0,16,10,8,8,10,1' &&
      wr.sprites.cap.join() === '0,30,16,10,4,8,10,16' &&
      wr.sprites.huge.join() === '4096,0,512,1,32,99,0,1',
    'world sprites are rectangles of the sheet, clamped, with their anchor in the middle of the bottom edge unless given, and their looks'
  );
  ok(
    wr.crew.count === 16 &&
      wr.crew.speed === 10 &&
      wr.crew.walk === 'stand' &&
      wr.crew.climb === '' &&
      wr.crew.wait === 'cap' &&
      wr.crew.looks === 16 &&
      wr.crew.bubble === 0 &&
      wr.crew.lane.join() === '905,-400,1570' &&
      JSON.stringify(wr.crew.chat) === '{"every":[3,3600],"say":["cap"],"act":""}',
    'the crew (walking with the standing picture when there is no walk), its looks, its street and its chats are checked and clamped'
  );
  const s0 = wr.spots[0],
    s1 = wr.spots[1],
    s2 = wr.spots[2];
  ok(
    wr.spots.length === 39 &&
      s0.x === 2320 &&
      s0.time.join() === '2,30' &&
      JSON.stringify(s0.path) === '[[940,860,0],[940,860,1]]' &&
      s0.fx.kind === 'rise' &&
      s0.fx.every === 0.2 &&
      s1.act === '' &&
      s1.n === 6 &&
      s1.acts.join() === 'cap,,walk' &&
      s1.group === '' &&
      s1.say === null &&
      JSON.stringify(s2.path) === '[[1,2,1],[2320,-200,0],[4,4,0],[5,5,0],[6,6,0]]' &&
      s2.group === 'games' &&
      s2.show.length === 3 &&
      s2.show[0].s === 'cap' &&
      s2.show[0].x === 10 &&
      JSON.stringify(s2.say) === '{"s":["cap"],"every":600}' &&
      JSON.stringify(s2.when) === '{"h":[22,6],"d":null,"w":null,"near":null}' &&
      s2.w === 10,
    'spots (at most 40): a way in (path, or via as a ladder), what each place does, a group, props to show, bubbles and hours, clamped and cut'
  );
  ok(
    wr.props.length === 159 &&
      wr.props[0].bob === 8 &&
      wr.props[0].pan.join() === '-1920,10' &&
      wr.props[0].gust === 'cap' &&
      wr.props[1].pan === null &&
      wr.props[1].gust === '' &&
      wr.props[0].fade === 1800 &&
      wr.props[1].fade === 20 &&
      wr.drift[0].fade === 0 &&
      wr.props[0].rest === 0 &&
      wr.props[0].front === true &&
      JSON.stringify(wr.props[0].when) === '{"h":null,"d":[1015,1101],"w":null,"near":null}' &&
      wr.drift.length === 1 &&
      wr.drift[0].speed === 1 &&
      wr.drift[0].dir === -1 &&
      JSON.stringify(wr.drift[0].when) === '{"h":[7,24],"d":null,"w":null,"near":null}',
    'props (at most 160) and drift are checked and clamped, with their hours (when, fade), pan and gust, and what names no sprite is left out'
  );
  const h0 = wr.herds[0],
    e0 = wr.events[0],
    e1 = wr.events[1];
  ok(
    wr.herds.length === 4 &&
      h0.count === 12 &&
      h0.area.join() === '10,20,30,40' &&
      h0.walk === 'cap' &&
      h0.acts.join() === 'walk' &&
      h0.speed === 5 &&
      h0.when === null,
    'herds: at most 8, those without a sprite to stand with left out, clamped'
  );
  ok(
    e0.every.join() === '10,7200' &&
      e0.time.join() === '5,900' &&
      e0.call === 16 &&
      e0.spot.n === 3 &&
      e0.spot.act === 'cap' &&
      e0.props.length === 1 &&
      e0.drift.length === 1 &&
      JSON.stringify(e0.when) === '{"h":[12,14],"d":null,"w":null,"near":null}' &&
      e1.spot === null &&
      e1.every.join() === '120,300' &&
      e1.call === 0,
    'events: how often, how long, how many are called to their spot, their props and drift, clamped'
  );
  ok(
    wr.shade.length === 2 &&
      JSON.stringify(wr.shade[0]) === '{"color":"#06051a","alpha":0.9,"when":{"h":[0,5],"d":null,"w":null,"near":null}}' &&
      wr.shade[1].color === '#ffffff',
    'the tint of the night: a colour (one that is not is left out) and how strong, clamped'
  );
  ok(
    JSON.stringify(wr.wind) ===
      '[{"every":[3,3600],"speed":50,"dir":1,"fps":30,"fx":{"s":"cap","kind":"blow","every":2,"dx":0,"dy":0},"when":null},' +
        '{"every":[20,40],"speed":400,"dir":1,"fps":8,"fx":null,"when":{"h":null,"d":null,"w":["wind"],"near":null}}]' &&
      themeMod.resolve(themeMod.normalize({ world: { file: 'clawd.png' } }, 'claude', null, path.join(tdir, 'claude'))).world.wind
        .length === 0,
    'the wind (one, or a list: the first whose when fits blows): how often, how fast, from which side, its frames a second, what it carries off, clamped'
  );
  // what this world keeps besides: the weather of the days, watch mode, holidays' hats, who the crew are, their hellos; a spot's
  // tag; a prop that plays something now and then, or keeps the date; an event's chance, the one that follows it and its key
  const sp9 = wr.spots[2],
    p2 = wr.props[1];
  ok(
    JSON.stringify(wr.weather) ===
      '[{"name":"sun","w":1000,"when":null},{"name":"snow","w":5,"when":{"h":null,"d":[1201,228],"w":null,"near":null}}]' &&
      wr.watch === 120 &&
      JSON.stringify(wr.crew.hats) ===
        '[{"looks":[15],"when":{"h":null,"d":[1031,1031],"w":null,"near":null}},' +
          '{"looks":[7,1,1,9],"when":{"h":null,"d":null,"w":null,"near":["easter",-60,-60]}},{"looks":[6],"when":null}]' &&
      JSON.stringify(wr.crew.members) === '[{"name":"cap","likes":["games","code"]},{"name":"","likes":[]}]' &&
      wr.crew.hello.join() === 'cap' &&
      sp9.tag === 'games' &&
      wr.spots[1].tag === '' &&
      JSON.stringify(p2.play) === '{"s":"cap","every":2,"fps":30}' &&
      p2.phase === 'moon' &&
      wr.props[0].phase === '' &&
      JSON.stringify(wr.props[0].when.w) === 'null' &&
      JSON.stringify(wr.drift[0].when.w) === 'null' &&
      JSON.stringify(e0.when) === '{"h":[12,14],"d":null,"w":null,"near":null}' &&
      e0.chance === 1 &&
      e0.then === 31 &&
      e0.key === 'red' &&
      e1.chance === 0 &&
      e1.then === -1 &&
      e1.key === '' &&
      JSON.stringify(wr.events[0].spot.when) === '{"h":null,"d":null,"w":["rain","snow"],"near":null}',
    'the weather of the days, watch mode, hats, names and likes, hellos, tags, play and phase, the chance, then and key of an event: clamped'
  );
  // watch mode in whole minutes, at least one (a fraction of a minute would leave Home no time between keys); none, or not a number: off
  const watchOf = v =>
    themeMod.resolve(themeMod.normalize({ world: { file: 'clawd.png', watch: v } }, 'claude', null, path.join(tdir, 'claude'))).world.watch;
  ok(
    [0.001, 1.5, 0, -5, 'x', 999].map(watchOf).join() === '1,1.5,0,0,0,120',
    'watch mode: minutes, at least one (a minute and a half is fine); 0, below or not a number is off'
  );
  // an event's visitor that perches, and a show's name for the menu: clamped, no line breaks, at most 24 letters
  const ev0 = wr.events[0];
  ok(
    JSON.stringify(ev0.drift[0].perch) ===
      '{"x":-50,"y":1280,"s":"walk","fps":0.2,"time":[1,120],"fx":{"s":"cap","kind":"pop","every":2,"dx":0,"dy":0}}' &&
      ev0.drift[0].when === null &&
      wr.events[0].title === 'Fireworks and a very lon' &&
      wr.events[1].title === '',
    "a visitor's perch and a show's name: clamped"
  );
  ok(
    !('world' in plain) &&
      themeMod.normalize({ world: { file: 'nope.png', crew: { count: 3 } } }, 'noworld').v.world === null &&
      themeMod.normalize({ world: { file: '../../etc/passwd' } }, 'evilworld').v.world === null &&
      !('world' in themeMod.resolve(themeMod.normalize({ world: { file: 'nope.png' } }, 'noworld2'))),
    'a theme without a world has no world key, and a world whose sprite sheet is not there is dropped'
  );
  ok(
    themeMod.resolve(themeMod.normalize({ name: 'kid' }, 'claude-kid', wd.v)).world.id === 'claude' &&
      !('world' in themeMod.resolve(themeMod.normalize({ world: null }, 'claude-kid2', wd.v))),
    'a theme that extends one with a world uses its sprite sheet from that folder, and "world": null takes it away'
  );
  r = await tcall('set', { id: 'walker' });
  ok(
    r.code === 200 && fs.existsSync(path.join(tlocal, 'walker', 'w.png')) && th.resolved().mascot && th.resolved().mascot.id === 'walker',
    "a theme's mascot is downloaded with it"
  );
  r = await tcall('mascot/walker/w.png', null, 'GET');
  ok(r.code === 200, 'the mascot is served');
  r = await tcall('mascot/walker/other.png', null, 'GET');
  ok(r.code === 404, 'a file the theme does not name is not served as a mascot');
  // a world (world.*): its sprite sheet is downloaded with the theme, checked like a wallpaper and served from the theme's folder
  r = await tcall('set', { id: 'claude' });
  const cw = th.resolved().world;
  ok(
    r.code === 200 &&
      fs.existsSync(path.join(tlocal, 'claude', 'clawd.png')) &&
      fs.existsSync(path.join(tlocal, 'claude', 'world.png')) &&
      cw &&
      cw.id === 'claude' &&
      cw.file === 'clawd.png' &&
      cw.crew.count > 0,
    "a theme's world is downloaded with it: the sprite sheet and the backdrop"
  );
  r = await tcall('world/claude/clawd.png', null, 'GET');
  ok(r.code === 200 && Buffer.isBuffer(r.out) && r.out.slice(1, 4).toString() === 'PNG', 'the sprite sheet is served');
  r = await tcall('world/claude/world.png', null, 'GET');
  ok(r.code === 404, 'a file the world does not name is not served as its sprite sheet');
  r = await tcall('set', { id: 'badworld' });
  ok(
    r.code === 502 && /sprite sheet/.test(r.j.error) && !fs.existsSync(path.join(tlocal, 'badworld')),
    'a sprite sheet that is not an image is refused and nothing is kept'
  );
  r = await tcall('set', { id: 'badmascot' });
  ok(r.code !== 200 && !fs.existsSync(path.join(tlocal, 'badmascot')), 'a mascot that is not an image is refused and nothing is kept');
  r = await tcall('set', { id: 'kid' });
  ok(
    r.code === 200 &&
      fs.existsSync(path.join(tlocal, 'kid', 'theme.json')) &&
      th.resolved().attrs.bar === 'flat' &&
      th.resolved().attrs.grid === 'push',
    'a theme that extends another one downloads and uses it'
  );
  r = await tcall('set', { id: 'nope' });
  ok(r.code === 400 && /unknown theme/.test(r.j.error), 'a theme that is not on GitHub is refused');
  r = await tcall('set', { id: 'notjson' });
  ok(r.code === 502 && !fs.existsSync(path.join(tlocal, 'notjson')), 'a theme file that is not JSON is refused and nothing is kept');
  r = await tcall('set', { id: 'huge' });
  ok(r.code === 502 && /too large/.test(r.j.error) && !fs.existsSync(path.join(tlocal, 'huge')), 'a theme file over 64 KB is refused');
  r = await tcall('set', { id: 'badwall' });
  ok(
    r.code === 502 && /not an image/.test(r.j.error) && !fs.existsSync(path.join(tlocal, 'badwall')),
    'a wallpaper that is not an image is refused and nothing is kept'
  );
  r = await tcall('set', { id: 'orphan' });
  ok(r.code === 502 && !fs.existsSync(path.join(tlocal, 'orphan', 'theme.json')), 'a theme whose base theme is missing is refused');
  r = await tcall('set', { id: '../x' });
  ok(r.code === 400, 'a bad theme id is refused');
  r = await tcall('set', { accent: 'blue' });
  ok(r.code === 400, 'an accent must be a hex colour');
  r = await tcall('set', { id: 'bloom', accent: '#FF8A3D' });
  ok(
    th.resolved().vars['--acc'] === '#ff8a3d' &&
      th.resolved().vars['--acc-ink'] === '#0b0c10' &&
      th.resolved().vars['--focus'] === '#ff8a3d',
    "an accent overrides the theme's own, with readable text on it"
  );
  r = await tcall('revert');
  ok(r.j.current.id === 'bloom' || r.j.current.id === 'kid', 'revert goes back to the previous theme');
  ghUp = false;
  await th.refreshCatalogue(true);
  r = await tcall('list', null, 'GET');
  ok(
    r.j.catalogue.ok === false && r.j.catalogue.error && r.j.themes.some(x => x.id === 'bloom' && x.installed),
    'GitHub unreachable: the list shows the themes on the TV and says why'
  );
  r = await tcall('set', { id: 'bloom' });
  ok(r.code === 200 && r.j.current.id === 'bloom', 'GitHub unreachable: a downloaded theme can still be chosen');
  r = await tcall('set', { id: 'midnight' });
  ok(
    r.code === 502 && /could not download/.test(r.j.error),
    'GitHub unreachable: a theme that was never downloaded says it could not be downloaded'
  );
  gh.server.close();

  // the documentation table is generated from the schema; the service ships no themes
  const gen = require(path.join(root, 'tools', 'theme-docs.js')),
    docs = fs.readFileSync(path.join(root, 'docs', 'themes.md'), 'utf8');
  ok(docs.indexOf(gen.table()) >= 0, 'docs/themes.md holds the table generated from the schema (run: node tools/theme-docs.js)');
  const noComments = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/#.*$/gm, '');
  ok(
    !/themes/.test(noComments('ipk/build.py')) && !/themes/.test(noComments('scripts/bootstrap.sh')),
    'the package build and the setup do not ship or copy themes'
  );
});
