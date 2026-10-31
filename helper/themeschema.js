// The theme schema: every setting a theme can make (SCHEMA), how a value is checked and clamped (normalize), and how a theme turns into
// what the launcher applies (resolve: CSS variables, a few attributes and numbers). No files are fetched here; theme.js does that.
// docs/themes.md is generated from SCHEMA (tools/theme-docs.js).
const fs = require('fs'),
  path = require('path');

// where downloaded themes are kept: themes/<id>/ next to this file (D/themes on the TV)
const dir = () => process.env.CYTV_THEMES || path.join(__dirname, 'themes');
const DEFAULT_ID = 'classic',
  MAX_WALLPAPER = 1.5 * 1024 * 1024,
  MAX_FONT = 400 * 1024,
  MAX_MASCOT = 256 * 1024,
  MAX_WORLD = 256 * 1024,
  MAX_PREVIEW = 600 * 1024,
  MAX_THEME = 64 * 1024,
  MAX_INDEX = 128 * 1024;
const HEX = /^#[0-9a-f]{6}$/i,
  FILE = /^[\w-]{1,40}\.(?:jpg|png|webp)$/,
  FONT_FILE = /^[\w-]{1,40}\.(?:woff2|woff|ttf|otf)$/,
  ID = /^[a-z0-9-]{1,30}$/,
  PREVIEW_PATH = /^([a-z0-9-]{1,30})\/preview\.(?:jpg|png|webp)$/;
const ACCENTS = [
  ['Theme default', ''],
  ['White', '#f5f6f8'],
  ['Blue', '#4c8dff'],
  ['Teal', '#2ec4b6'],
  ['Green', '#46c37b'],
  ['Yellow', '#f2c94c'],
  ['Orange', '#ff8a3d'],
  ['Red', '#ff5a5f'],
  ['Pink', '#ff6fb5'],
  ['Purple', '#a77bff'],
];
const POS = ['left', 'center', 'right'],
  TOPBOT = ['top', 'bottom'];

// [key, type, range or choices, default, what it does]. Types: color (#rrggbb), color? (a colour, or null for "the accent"), num, int
// (range [lo, hi]), enum (choices), bool, auto (an int range, or null for "worked out from the other values"), file (a wallpaper or font
// file name, checked apart from the rest), text (a short string of plain characters, the spec is the pattern it must match).
const SCHEMA = [
  ['colors.night', 'color', null, '#07080b', 'Page background.'],
  ['colors.panel', 'color', null, '#14161b', 'Toast background; menu rows are a lighter mix of it.'],
  ['colors.ink', 'color', null, '#f5f6f8', 'Text.'],
  [
    'colors.accent',
    'color',
    null,
    '#f5f6f8',
    'Highlight: the focused button and menu row and, unless `colors.focus` is set, the focus ring.',
  ],
  ['colors.focus', 'color?', null, null, 'Focus ring colour; empty uses the accent.'],
  ['colors.pill', 'color', null, '#ffffff', 'Colour of the translucent top buttons, with `surface.pillAlpha`.'],
  ['surface.pillAlpha', 'num', [0, 0.6], 0.09, 'Opacity of the top buttons.'],
  ['surface.pillRing', 'num', [0, 0.8], 0.1, 'Opacity of the thin outline of the top buttons.'],
  ['surface.pillRadius', 'int', [0, 60], 32, 'Corner radius of the top buttons (pill style only).'],
  ['surface.menuAlpha', 'num', [0.5, 1], 0.97, 'Opacity of the dark layer behind menus.'],
  ['surface.rowRadius', 'int', [0, 50], 30, 'Corner radius of menu rows.'],
  ['type.font', 'enum', ['default', 'serif', 'mono'], 'default', "The typeface: the TV's own, a serif or a monospace."],
  [
    'type.fontFile',
    'file',
    null,
    '',
    "A typeface of the theme: a file in the theme's folder, `.woff2`, `.woff`, `.ttf` or `.otf`, at most 400 KB, used for all text. Characters it lacks come from `type.font`. Its licence must allow redistribution; put the licence file in the folder too.",
  ],
  ['type.scale', 'num', [0.8, 1.3], 1, 'Scale of the text of buttons, menus and tiles.'],
  ['clock.show', 'bool', null, true, 'Show the clock.'],
  ['clock.date', 'bool', null, true, 'Show the date beside or under the time.'],
  [
    'clock.greeting',
    'bool',
    null,
    false,
    'Show a greeting (Good morning / afternoon / evening, in the language) in capitals above the time. Needs the stacked layout.',
  ],
  [
    'clock.layout',
    'enum',
    ['inline', 'stack', 'above'],
    'inline',
    '`inline`: the date beside the time; `stack`: under it; `above`: over it (a big centred clock with the date on top).',
  ],
  ['clock.anchor', 'enum', TOPBOT, 'top', 'Which screen edge `clock.y` counts from.'],
  ['clock.align', 'enum', POS, 'left', 'Which side `clock.x` counts from; `center` centres it.'],
  ['clock.x', 'int', [0, 900], 96, 'Distance from that side, in px (on a 1920 x 1080 canvas). Not used when centred.'],
  ['clock.y', 'int', [0, 900], 54, 'Distance from the top or bottom edge, in px.'],
  ['clock.scale', 'num', [0.6, 8], 1, 'Scale of the time (1 is 56 px; 7 fills a third of the screen).'],
  [
    'clock.ampm',
    'bool',
    null,
    true,
    "Show AM/PM (or the language's equivalent) after a 12-hour time; off, a lock-screen clock shows the digits only.",
  ],
  [
    'clock.grid',
    'enum',
    ['keep', 'hide'],
    'keep',
    '`hide`: the clock fades out while the app grid is open (for a big clock the tiles would cover).',
  ],
  [
    'clock.prefix',
    'text',
    /^[\w $>#:~%./-]{0,16}$/,
    '',
    'Up to sixteen plain characters on a line above the time, a little dimmer, like the command that printed it: `$ date`.',
  ],
  ['clock.weight', 'int', [100, 900], 600, 'Weight of the time: 200 thin, 400 regular, 600 semi-bold, 800 heavy (what the typeface has).'],
  ['clock.alpha', 'num', [0.1, 1], 1, 'Opacity of the time; below 1 the picture shows through the digits, like glass.'],
  ['clock.outline', 'num', [0, 1], 0, 'Opacity of a thin outline around the digits (a rim on a glass clock); 0 for none.'],
  ['clock.color', 'color?', null, null, 'Colour of the time; empty uses the text colour.'],
  [
    'clock.fontFile',
    'file',
    null,
    '',
    "A typeface for the time only: a font file in the theme's folder, like `type.fontFile` (same limits and licence rule); the rest of the text keeps the theme's font.",
  ],
  ['clock.dateScale', 'num', [0.6, 2], 1, 'Scale of the date.'],
  ['bar.show', 'bool', null, true, 'Show the top buttons (Inputs, Settings, Customise, ...).'],
  [
    'bar.style',
    'enum',
    ['pill', 'round', 'flat'],
    'pill',
    '`pill`: icon and label on a rounded button; `round`: icon only in a circle; `flat`: no background.',
  ],
  ['bar.labels', 'enum', ['auto', 'show', 'hide'], 'auto', 'Button labels: `auto` shows them except in the `round` style.'],
  ['bar.anchor', 'enum', TOPBOT, 'top', 'Which screen edge `bar.y` counts from.'],
  ['bar.align', 'enum', POS, 'right', 'Which side `bar.x` counts from.'],
  ['bar.x', 'int', [0, 900], 96, 'Distance from that side, in px. Not used when centred.'],
  ['bar.y', 'int', [0, 900], 54, 'Distance from the top or bottom edge, in px.'],
  ['bar.size', 'int', [40, 100], 64, 'Height of a button, in px.'],
  ['bar.gap', 'int', [4, 40], 16, 'Space between buttons, in px.'],
  ['shelf.show', 'bool', null, true, 'Show the large name of the focused app.'],
  ['shelf.align', 'enum', POS, 'left', 'Text alignment of the name.'],
  ['shelf.x', 'int', [0, 900], 96, 'Margin on both sides, in px.'],
  ['shelf.y', 'int', [0, 900], 150, 'Distance from the top edge, in px.'],
  ['shelf.scale', 'num', [0.4, 1.6], 1, 'Scale of the name.'],
  [
    'shelf.prefix',
    'text',
    /^[\w $>#:~%./-]{0,8}$/,
    '',
    'Up to eight plain characters before the name, a little dimmer, like a prompt: `$ `, `> `, `~ `.',
  ],
  ['shelf.cursor', 'bool', null, false, 'A blinking block after the name, like a terminal cursor.'],
  ['dock.anchor', 'enum', TOPBOT, 'top', 'Which screen edge `dock.y` counts from.'],
  ['dock.align', 'enum', POS, 'left', 'Which side `dock.x` counts from; `center` centres the dock.'],
  ['dock.x', 'int', [0, 900], 96, 'Distance from that side, in px. Not used when centred.'],
  ['dock.y', 'auto', [0, 1000], null, 'Distance from the top or bottom edge, in px. Empty: 360 from the top, 68 from the bottom.'],
  ['dock.show', 'bool', null, true, 'Show the dock; off, every app is in the grid (a list of all apps, as in a terminal).'],
  ['dock.count', 'int', [3, 8], 4, 'Apps in the dock.'],
  ['dock.w', 'int', [120, 500], 408, 'Width of a dock tile, in px.'],
  ['dock.h', 'int', [100, 300], 230, 'Height of a dock tile, in px.'],
  ['dock.gap', 'int', [8, 60], 32, 'Space between dock tiles, in px.'],
  ['dock.radius', 'int', [0, 80], 36, 'Corner radius of dock tiles.'],
  ['dock.panel', 'num', [0, 0.6], 0, 'Opacity of a translucent panel behind the dock tiles; 0 for none.'],
  ['dock.panelPad', 'int', [0, 60], 24, 'Space between the panel and the tiles, in px.'],
  [
    'dock.panelColor',
    'color',
    null,
    '#ffffff',
    'Colour of the panel behind the dock (`dock.panel`): white for frosted glass, a dark colour for smoked glass.',
  ],
  ['dock.tileAlpha', 'num', [0, 1], 1, 'Opacity of the dock tile background; below 1 lets the wallpaper show through the tiles.'],
  [
    'dock.tileFrost',
    'num',
    [0, 1],
    0,
    'Frost over the resting (unfocused) dock tiles and their icons; 0 for none. Calms loud tile colours without leaving a floating icon square, because the tile and its icon dim together. The focused tile keeps its full colour.',
  ],
  [
    'dock.tileFrostColor',
    'color',
    null,
    '#ffffff',
    'Tint of the dock-tile frost (`dock.tileFrost`): a light colour for a glassy frost, a dark one to deepen the tiles.',
  ],
  ['dock.lift', 'int', [0, 40], 10, 'How far the focused dock tile rises, in px.'],
  ['dock.focusScale', 'num', [1, 1.3], 1.05, 'Scale of the focused dock tile.'],
  [
    'grid.mode',
    'enum',
    ['below', 'push', 'overlay'],
    'below',
    '`below`: the grid sits under the dock and scrolls (a dock at the bottom behaves as `push`); `push`: the grid sits under the dock out of sight, and when the focus moves down into it the dock moves up to `grid.dockUp` and the grid appears below it; `overlay`: the grid opens over the screen above the dock.',
  ],
  [
    'grid.dockUp',
    'int',
    [0, 700],
    220,
    '`push` mode: where the dock stops, counted from the top of the screen, while the grid has the focus, in px.',
  ],
  ['grid.align', 'enum', ['left', 'center'], 'left', '`center` centres every row of tiles, also a last row that is not full.'],
  ['grid.cols', 'int', [1, 14], 10, 'Columns; 1 lists the apps one under the other.'],
  ['grid.tileH', 'int', [32, 240], 151, 'Height of a tile, in px; the width follows from the columns. A line of text needs about 44.'],
  [
    'grid.prefix',
    'text',
    /^[\w $>#:~%./-]{0,16}$/,
    '',
    'Up to sixteen plain characters on a line just above the grid, a little dimmer, like the command that listed the apps: `$ ls apps/`.',
  ],
  ['grid.gapX', 'int', [6, 60], 24, 'Horizontal space between tiles, in px.'],
  ['grid.gapY', 'int', [6, 60], 26, 'Vertical space between tiles, in px.'],
  ['grid.radius', 'int', [0, 100], 34, 'Corner radius of tiles.'],
  ['grid.x', 'int', [0, 900], 96, 'Distance of the grid from the left edge, in px.'],
  ['grid.width', 'int', [600, 1920], 1728, 'Width of the grid, in px.'],
  ['grid.y', 'auto', [0, 1000], null, 'Distance of the grid from the top edge, in px. Empty: under the dock, or 290 for an overlay.'],
  ['grid.clipTop', 'int', [0, 600], 300, 'Where scrolled rows disappear at the top, in px (`below` mode).'],
  ['grid.focusScale', 'num', [1, 1.4], 1.12, 'Scale of the focused tile.'],
  ['grid.overlayDim', 'num', [0, 1], 0.95, 'Opacity of the layer behind the overlay grid.'],
  ['grid.overlayH', 'int', [200, 900], 510, 'Visible height of the overlay grid before it scrolls, in px.'],
  [
    'tile.style',
    'enum',
    ['icon', 'text'],
    'icon',
    "`icon`: the app's icon on a coloured tile; `text`: only its name, in a line of text with no background, the focused one in the accent colour (inverse video), as in a terminal.",
  ],
  [
    'tile.marker',
    'text',
    /^[\w $>#:~%./-]{0,8}$/,
    '',
    'Text tiles: up to eight characters before the focused name, for example `> `; the other names keep the space, so they line up.',
  ],
  ['tile.gloss', 'num', [0, 1], 0, 'A light highlight on every tile.'],
  ['tile.border', 'num', [0, 0.6], 0, 'Opacity of a thin outline on every tile.'],
  ['tile.ringWidth', 'int', [0, 10], 4, 'Width of the focus ring, in px; 0 for none.'],
  ['tile.ringOffset', 'int', [0, 14], 4, 'Space between a tile and its focus ring, in px.'],
  ['effects.glow', 'num', [0, 1], 1, 'Strength of the ambient glow at the top.'],
  ['effects.glowColor', 'enum', ['app', 'accent'], 'app', '`app`: taken from the focused icon; `accent`: the accent colour.'],
  ['effects.speed', 'num', [0, 2], 1, 'Animation speed multiplier; 0 switches the animations off.'],
  [
    'effects.wallpaper',
    'file',
    null,
    '',
    'A file name in `themes/wallpapers/`: `.jpg`, `.png` or `.webp`, at most 1.5 MB; drawn at 1920 x 1080.',
  ],
  ['effects.wallpaperDim', 'num', [0, 0.9], 0.4, 'How far the wallpaper is darkened with the background colour.'],
  [
    'effects.drift',
    'num',
    [0, 1],
    0,
    'A slow drift of the wallpaper: over about a minute it zooms in a little and glides, then back, like a lock screen; 1 is a tenth of the picture. Transform only. `effects.speed` sets the pace.',
  ],
  [
    'effects.cycles',
    'num',
    [0, 1],
    0,
    'Light cycles: riders on the floor of the picture, between `effects.cyclesHorizon` and the bottom, that turn at right angles and leave a wall of light along every stretch they rode, until they derezz and the walls fade; 1 is fast and many, 0.3 slow and few. Transform only.',
  ],
  [
    'effects.cyclesHorizon',
    'int',
    [0, 1000],
    640,
    'Where the floor starts, from the top edge, in px: a rider far away passes just below it, small and slow.',
  ],
  ['effects.cyclesColor', 'color', null, '#ff8a3d', 'The second colour of the riders; the first is the accent.'],
  [
    'effects.scene',
    'enum',
    ['none', 'lightcity'],
    'none',
    '`lightcity`: a world of light going on behind Home: Recognizers (big ships) drift across the sky, the portal beam at `effects.beamX` pulses up from the horizon, light rains down and pulses of light sweep the floor to the horizon. Transform and opacity only.',
  ],
  ['effects.beamX', 'int', [0, 1920], 960, 'Where the portal beam of `effects.scene` stands, from the left edge, in px.'],
  [
    'mascot.file',
    'file',
    null,
    '',
    "A small character that walks along the bottom of Home: a `.png`, `.webp` or `.jpg` in the theme's folder, at most 256 KB. One picture, or a strip of `mascot.frames` pictures of the same size side by side (a walk cycle, the first one standing). The launcher moves it with transforms only.",
  ],
  ['mascot.frames', 'int', [1, 16], 1, 'Pictures in the strip, left to right.'],
  [
    'mascot.walk',
    'int',
    [0, 16],
    0,
    'How many of them, from the left, are the walk cycle (the first standing); the rest are poses in this order: wave, happy, sleepy, surprised, dizzy, thinking. 0: all of them walk.',
  ],
  ['mascot.count', 'int', [1, 4], 1, 'How many of the character walk about, each a little smaller than the one before.'],
  ['mascot.size', 'int', [32, 240], 96, 'Height of the mascot on screen, in px.'],
  ['mascot.y', 'int', [0, 900], 36, 'Distance of its feet from the bottom edge, in px.'],
  [
    'mascot.speed',
    'num',
    [0, 2],
    1,
    'How fast it walks and how often it plays; 0 keeps it standing still. `effects.speed` 0 stops it too.',
  ],
  ['mascot.flip', 'bool', null, true, 'Mirror the picture when it walks to the left (draw it facing right).'],
  ['mascot.pixel', 'bool', null, false, 'Pixel art: the picture is scaled without smoothing, so its pixels stay crisp.'],
];
const DEFAULTS = {};
for (const r of SCHEMA) DEFAULTS[r[0]] = r[3];

const hex = v => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : undefined);
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = c => '#' + c.map(x => ('0' + Math.round(Math.min(255, Math.max(0, x))).toString(16)).slice(-2)).join('');
const mix = (a, b, t) => {
  const x = rgb(a),
    y = rgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
const lum = h => {
  const c = rgb(h).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const getPath = (o, p) => p.split('.').reduce((x, k) => (x && typeof x === 'object' ? x[k] : undefined), o);
// the checked value for a row, or undefined when the raw value is missing or invalid
function check(row, v) {
  const type = row[1],
    spec = row[2];
  if (v === undefined) return undefined;
  if (type === 'color') return hex(v);
  if (type === 'color?') return v === '' || v === null ? null : hex(v);
  if (type === 'bool') return typeof v === 'boolean' ? v : undefined;
  if (type === 'enum') return spec.indexOf(v) >= 0 ? v : undefined;
  if (type === 'text') return typeof v === 'string' && spec.test(v) ? v : undefined;
  if (type === 'num' || type === 'int' || type === 'auto') {
    if (type === 'auto' && (v === null || v === '')) return null;
    if (typeof v !== 'number' || !isFinite(v)) return undefined;
    const c = Math.min(spec[1], Math.max(spec[0], v));
    return type === 'num' ? c : Math.round(c);
  }
  return undefined;
}
// is this buffer an image of the type its file name says?
function imageOk(b, name, max) {
  if (!b || b.length < 12 || b.length > max) return false;
  return (
    (/\.jpg$/.test(name) && b[0] === 0xff && b[1] === 0xd8) ||
    (/\.png$/.test(name) && b.slice(1, 4).toString() === 'PNG') ||
    (/\.webp$/.test(name) && b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP')
  );
}
// is this buffer a font of a kind its file name says (WOFF2, WOFF, TrueType or OpenType)?
function fontOk(b, name) {
  if (!b || b.length < 12 || b.length > MAX_FONT) return false;
  const m = b.slice(0, 4).toString('latin1');
  return (
    (/\.woff2$/.test(name) && m === 'wOF2') ||
    (/\.woff$/.test(name) && m === 'wOFF') ||
    (/\.(?:ttf|otf)$/.test(name) && (m === '\u0000\u0001\u0000\u0000' || m === 'true' || m === 'OTTO'))
  );
}
const fontType = n => (/\.woff2$/.test(n) ? 'font/woff2' : /\.woff$/.test(n) ? 'font/woff' : /\.otf$/.test(n) ? 'font/otf' : 'font/ttf');
const imageType = n => (/\.jpg$/.test(n) ? 'image/jpeg' : /\.png$/.test(n) ? 'image/png' : 'image/webp');
const sniff = b =>
  b.length > 12 && b[0] === 0xff && b[1] === 0xd8
    ? 'jpg'
    : b.length > 12 && b.slice(1, 4).toString() === 'PNG'
      ? 'png'
      : b.length > 12 && b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP'
        ? 'webp'
        : '';

// A theme: its description and a flat map of every SCHEMA key; `base` is the values of the theme it extends (or the defaults). A wallpaper
// is accepted when the file is in `wallDir` (default: the theme's folder on the TV) and is an image of the right type.
function normalize(raw, id, base, wallDir) {
  if (!raw || typeof raw !== 'object' || !ID.test(id)) return null;
  const v = Object.assign({}, base || DEFAULTS);
  for (const row of SCHEMA) {
    if (row[1] === 'file') continue;
    const c = check(row, getPath(raw, row[0]));
    if (c !== undefined) v[/** @type {string} */ (row[0])] = c;
  }
  const w = getPath(raw, 'effects.wallpaper');
  if (typeof w === 'string' && FILE.test(w)) {
    try {
      const b = fs.readFileSync(path.join(wallDir || path.join(dir(), id), w));
      if (imageOk(b, w, MAX_WALLPAPER)) v['effects.wallpaper'] = w;
    } catch (_) {}
  } else if (w === '') v['effects.wallpaper'] = '';
  // a typeface: kept with the id of the theme whose folder holds it, so a theme that extends this one uses the same file
  const f = getPath(raw, 'type.fontFile');
  if (typeof f === 'string' && FONT_FILE.test(f)) {
    try {
      if (fontOk(fs.readFileSync(path.join(wallDir || path.join(dir(), id), f)), f)) {
        v['type.fontFile'] = f;
        v.fontTheme = id;
      }
    } catch (_) {}
  } else if (f === '') v['type.fontFile'] = '';
  // the clock's own typeface, kept the same way
  const cf = getPath(raw, 'clock.fontFile');
  if (typeof cf === 'string' && FONT_FILE.test(cf)) {
    try {
      if (fontOk(fs.readFileSync(path.join(wallDir || path.join(dir(), id), cf)), cf)) {
        v['clock.fontFile'] = cf;
        v.clockFontTheme = id;
      }
    } catch (_) {}
  } else if (cf === '') v['clock.fontFile'] = '';
  // a mascot: a small image, kept with the id of the theme whose folder holds it, like a typeface
  const m = getPath(raw, 'mascot.file');
  if (typeof m === 'string' && FILE.test(m)) {
    try {
      if (imageOk(fs.readFileSync(path.join(wallDir || path.join(dir(), id), m)), m, MAX_MASCOT)) {
        v['mascot.file'] = m;
        v.mascotTheme = id;
      }
    } catch (_) {}
  } else if (m === '') v['mascot.file'] = '';
  // slots for cards: a list in the theme (not in SCHEMA, which holds single values); a theme without "slots" keeps its base's
  if (raw.slots !== undefined) v.slots = slots(raw.slots);
  // a world: its sprite sheet is kept with the id of the theme whose folder holds it, like a mascot; a theme without "world" keeps its
  // base's, and one whose sheet is missing or not an image has none
  if (raw.world !== undefined) {
    const wo = world(raw.world);
    v.world = null;
    v.worldTheme = '';
    if (wo && FILE.test(wo.file)) {
      try {
        if (imageOk(fs.readFileSync(path.join(wallDir || path.join(dir(), id), wo.file)), wo.file, MAX_WORLD)) {
          v.world = wo;
          v.worldTheme = id;
        }
      } catch (_) {}
    }
  }
  return {
    id,
    name: String(raw.name || id).slice(0, 40),
    author: String(raw.author || '').slice(0, 60),
    description: String(raw.description || '').slice(0, 160),
    v,
  };
}

// Slots: where cards (small widgets, helper/cards.js) can go in this theme. "slots" is a list of
//   {id, anchor: top|bottom, align: left|center|right, x, y, w, h, card, grid: keep|hide}
// id names the place (greeting, clock-side, side, row are the usual ones, so a card stays when the theme changes); x and y place the
// slot's box like the clock's (x is not used when centred), w and h are its size; card is the card type it shows until the user picks
// another; grid: keep leaves it on screen while the app grid is open (default: hidden then). Values are clamped like SCHEMA's.
const SLOT_ID = /^[a-z][a-z0-9-]{0,19}$/,
  MAX_SLOTS = 8;
function slots(list) {
  if (!Array.isArray(list)) return [];
  const num = (n, lo, hi, d) => (typeof n === 'number' && isFinite(n) ? Math.round(Math.min(hi, Math.max(lo, n))) : d);
  const out = [];
  for (const o of list) {
    if (out.length >= MAX_SLOTS) break;
    if (!o || typeof o !== 'object' || !SLOT_ID.test(o.id) || out.some(x => x.id === o.id)) continue;
    out.push({
      id: o.id,
      anchor: TOPBOT.indexOf(o.anchor) >= 0 ? o.anchor : 'top',
      align: POS.indexOf(o.align) >= 0 ? o.align : 'left',
      x: num(o.x, 0, 1900, 96),
      y: num(o.y, 0, 1060, 96),
      w: num(o.w, 60, 1920, 400),
      h: num(o.h, 30, 1080, 120),
      card: typeof o.card === 'string' && /^[a-z][a-z0-9-]{0,30}$/.test(o.card) ? o.card : '',
      keep: o.grid === 'keep',
    });
  }
  return out;
}

// A world: a little place going on behind Home (app/src/js/world.js), drawn from a sprite sheet in the theme's folder. "world" is an
// object in the theme (not in SCHEMA, which holds single values):
//   {file, px, watch, sprites: {name: [x, y, w, h, frames, ax, ay, looks]},
//    crew: {count, speed, stand, walk, climb, wave, wait, looks, bubble, lane: [y, x0, x1], chat: {every: [min, max], say: [names], act},
//           hats: [{look, when}], members: [{name, likes: [tags]}], hello: [names]},
//    spots: [{x, y, act, acts: [names], fps, face, time: [min, max], n, gap, path: [[x, y, climb]], via: [x, y], inside, back, carry,
//             w, fx, say, show: [props], group, tag, when}],
//    props: [{s, x, y, fps, pulse, bob, front, under, rest, fx, when, fade, pan: [px, seconds], gust, play: {s, every, fps}, phase}],
//    drift: [{s, y, speed, dir, fps, bob, when, fade}],
//    herds: [{count, area: [x0, y0, x1, y1], stand, walk, acts: [names], speed, fx, when}],
//    events: [{every: [min, max], time: [min, max], chance, call, spot, props, drift, when, then, key}], shade: [{color, alpha, when}],
//    weather: [{name, w, when}], wind: [{every: [min, max], speed, dir, fps, fx, when}] (or one)}
// with fx {s, kind: rise|float|pop|fall|blow, every, dx, dy}, say {s: [names], every} and when {h: [from, to], d: ['MM-DD', 'MM-DD'],
// w: [weathers]}. A sprite
// is a strip of `frames` frames of w x h art pixels side by side in the sheet, (ax, ay) the point of a frame that stands on a place, in
// it or below it (default: the middle of its bottom edge); `looks` strips of the same size may follow under it, one per look of the
// crew (a cap of another colour). px is how many screen pixels an art pixel is. Places are in px on the 1920 x 1080 canvas. Numbers
// are clamped, a name that is not a sprite is dropped (a prop, a drift or a herd without one is left out) and the lists are cut to
// their limits, so a world can only arrange its own pictures.
const SPRITE = /^[a-z][a-z0-9-]{0,23}$/,
  MAX_SPRITES = 256,
  MAX_SPOTS = 40,
  MAX_PROPS = 160,
  MAX_DRIFT = 24,
  MAX_HERDS = 8,
  MAX_EVENTS = 32,
  NAME = /^[a-z][a-z0-9-]{0,15}$/,
  KEYS = ['red', 'green', 'yellow', 'blue'],
  PHASES = ['moon', 'month', 'week'],
  FX_KINDS = ['rise', 'float', 'pop', 'fall', 'blow'];
function world(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const int = (n, lo, hi, d) => (typeof n === 'number' && isFinite(n) ? Math.round(Math.min(hi, Math.max(lo, n))) : d);
  const num = (n, lo, hi, d) => (typeof n === 'number' && isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d);
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : null);
  const list = (l, max) => (Array.isArray(l) ? l.slice(0, max).filter(obj) : []);
  const range = (t, lo, hi, a, b) => {
    t = Array.isArray(t) ? t : [];
    const x = num(t[0], lo, hi, a),
      y = num(t[1], lo, hi, Math.max(x, b));
    return [Math.min(x, y), Math.max(x, y)];
  };
  const sprites = {};
  const so = obj(o.sprites) || {};
  for (const k of Object.keys(so).slice(0, MAX_SPRITES)) {
    const r = so[k];
    if (!SPRITE.test(k) || !Array.isArray(r) || r.length < 4) continue;
    const w = int(r[2], 1, 512, 1),
      h = int(r[3], 1, 512, 1);
    sprites[k] = [
      int(r[0], 0, 4096, 0),
      int(r[1], 0, 4096, 0),
      w,
      h,
      int(r[4], 1, 32, 1),
      int(r[5], 0, w, Math.floor(w / 2)),
      int(r[6], 0, 512, h),
      int(r[7], 1, 16, 1),
    ];
  }
  const sp = n => (typeof n === 'string' && Object.prototype.hasOwnProperty.call(sprites, n) ? n : '');
  const sps = (l, max) => (Array.isArray(l) ? l.slice(0, max).map(sp).filter(Boolean) : []);
  const X = n => int(n, -400, 2320, 960),
    Y = n => int(n, -200, 1280, 900);
  const fx = f => {
    const s = f && obj(f) ? sp(f.s) : '';
    if (!s) return null;
    return {
      s,
      kind: FX_KINDS.indexOf(f.kind) >= 0 ? f.kind : 'rise',
      every: num(f.every, 0.2, 60, 2),
      dx: int(f.dx, -400, 400, 0),
      dy: int(f.dy, -400, 400, 0),
    };
  };
  // speech bubbles now and then: sprites, one every so many seconds
  const say = v => {
    const s = obj(v) ? sps(v.s, 12) : [];
    return s.length ? { s, every: num(v.every, 1, 600, 8) } : null;
  };
  // from one hour to another (across midnight when the first is later) and/or between two days of the year ('MM-DD', across New Year)
  const md = v => (typeof v === 'string' && /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v) ? +v.slice(0, 2) * 100 + +v.slice(3) : 0);
  // names (of a weather, a group, a tag): lower-case letters, digits and -
  const names = (l, max) => (Array.isArray(l) ? l.slice(0, max).filter(x => typeof x === 'string' && NAME.test(x)) : []);
  // ... and/or in some weathers of the day (w: names from `weather`)
  const when = v => {
    const w = obj(v);
    if (!w) return null;
    const h = Array.isArray(w.h) && w.h.length === 2 ? [int(w.h[0], 0, 24, 0), int(w.h[1], 0, 24, 24)] : null,
      d = Array.isArray(w.d) && w.d.length === 2 && md(w.d[0]) && md(w.d[1]) ? [md(w.d[0]), md(w.d[1])] : null,
      ws = names(w.w, 8);
    return h || d || ws.length ? { h, d, w: ws.length ? ws : null } : null;
  };
  const c = obj(o.crew) || {},
    stand = sp(c.stand),
    ch = obj(c.chat);
  const crew = {
    count: stand ? int(c.count, 0, 16, 0) : 0,
    speed: num(c.speed, 10, 400, 60),
    stand,
    walk: sp(c.walk) || stand,
    climb: sp(c.climb),
    wave: sp(c.wave),
    // what one does at a game (a spot with props to show) until the other players are there
    wait: sp(c.wait),
    // how many looks each member can have (a sprite's strips under it), and how high over their feet a speech bubble shows
    looks: int(c.looks, 1, 16, 1),
    bubble: int(c.bubble, 0, 400, 80),
    // a street they keep to between spots: [y, from x, to x]; without one they walk straight across
    lane:
      Array.isArray(c.lane) && c.lane.length === 3
        ? [Y(c.lane[0]), Math.min(X(c.lane[1]), X(c.lane[2])), Math.max(X(c.lane[1]), X(c.lane[2]))]
        : null,
    // now and then two of them meet on the street and talk (bubbles in turn), then do `act` together
    chat: ch && sps(ch.say, 12).length ? { every: range(ch.every, 3, 3600, 20, 60), say: sps(ch.say, 12), act: sp(ch.act) } : null,
    // looks worn by everyone on some days (a hat for a holiday: a strip of each sprite, like a look), the first that fits
    hats: list(c.hats, 6).map(e => ({ look: int(e.look, 1, 15, 1), when: when(e.when) })),
    // who they are, one after the other: a name (a sprite, said when two meet) and the tags of the spots they like best
    members: list(c.members, 16).map(e => ({ name: sp(e.name), likes: names(e.likes, 6) })),
    // what they say when they wave hello or goodbye
    hello: sps(c.hello, 8),
  };
  const prop = e => ({
    s: sp(e.s),
    x: X(e.x),
    y: Y(e.y),
    fps: num(e.fps, 0.2, 30, 6),
    pulse: num(e.pulse, 0, 60, 0),
    bob: int(e.bob, 0, 8, 0),
    front: e.front === true,
    under: e.under === true,
    rest: num(e.rest, 0, 600, 0),
    fx: fx(e.fx),
    when: when(e.when),
    // a slow drift to and fro, [px, seconds one way], one px at a time (the stars wheeling); props with the same pan keep together
    pan: Array.isArray(e.pan) && int(e.pan[0], -1920, 1920, 0) ? [int(e.pan[0], -1920, 1920, 0), num(e.pan[1], 10, 7200, 600)] : null,
    // what it plays once when a gust of wind passes over it (wind)
    gust: sp(e.gust),
    // seconds it takes to fade in or out when its hours (when) come or go
    fade: num(e.fade, 0, 1800, 20),
    // now and then (every seconds or so) it plays sprite s once at fps, then goes back to its own frames (a frog that hops)
    play: obj(e.play) && sp(e.play.s) ? { s: sp(e.play.s), every: num(e.play.every, 2, 3600, 20), fps: num(e.play.fps, 0.2, 30, 8) } : null,
    // it shows the frame the date says instead of playing them: the moon's phase, the day of the month, the day of the week
    phase: PHASES.indexOf(e.phase) >= 0 ? e.phase : '',
  });
  // a spot: where a character goes and what it does there; `path` is the way in from the street (a door, stairs: [x, y, climb])
  const spot = e => {
    const path = (Array.isArray(e.path) ? e.path.slice(0, 6) : [])
      .filter(p => Array.isArray(p) && p.length >= 2)
      .map(p => [X(p[0]), Y(p[1]), p[2] ? 1 : 0]);
    if (!path.length && Array.isArray(e.via) && e.via.length === 2) path.push([X(e.via[0]), Y(e.via[1]), 0], [X(e.via[0]), Y(e.y), 1]);
    return {
      x: X(e.x),
      y: Y(e.y),
      act: sp(e.act),
      // what each place does, for a spot where they do different things (two turn a rope, one jumps)
      acts: (Array.isArray(e.acts) ? e.acts.slice(0, 6) : []).map(sp),
      fps: num(e.fps, 0.2, 30, 6),
      face: e.face === -1 || e.face === 1 ? e.face : 0,
      time: range(e.time, 1, 1800, 6, 14),
      n: int(e.n, 1, 6, 1),
      gap: int(e.gap, 0, 600, 0),
      path,
      inside: e.inside === true,
      back: sp(e.back),
      // what it walks away with (a crate from the mine) until its next spot
      carry: sp(e.carry),
      w: num(e.w, 0, 10, 1),
      fx: fx(e.fx),
      say: say(e.say),
      // props shown while every place of the spot is taken (the table, the rope, the ball of a game)
      show: list(e.show, 4)
        .map(prop)
        .filter(p => p.s),
      // a name shared by spots of which only one can be in use at a time (the games of a room)
      group: typeof e.group === 'string' && NAME.test(e.group) ? e.group : '',
      // what kind of place it is, for the crew's likes
      tag: typeof e.tag === 'string' && NAME.test(e.tag) ? e.tag : '',
      when: when(e.when),
    };
  };
  const drifter = e => ({
    s: sp(e.s),
    y: Y(e.y),
    speed: num(e.speed, 1, 600, 20),
    dir: e.dir === -1 ? -1 : 1,
    fps: num(e.fps, 0.2, 30, 6),
    bob: int(e.bob, 0, 8, 0),
    when: when(e.when),
    fade: num(e.fade, 0, 1800, 20),
  });
  const spots = list(o.spots, MAX_SPOTS).map(spot);
  const props = list(o.props, MAX_PROPS)
    .map(prop)
    .filter(p => p.s);
  const drift = list(o.drift, MAX_DRIFT)
    .map(drifter)
    .filter(d => d.s);
  // herds: little ones that wander about an area, hop, play and keep each other company
  const herds = list(o.herds, MAX_HERDS)
    .map(e => {
      const a = Array.isArray(e.area) ? e.area : [];
      return {
        count: int(e.count, 1, 12, 3),
        area: [X(a[0]), Y(a[1]), X(a[2]), Y(a[3])],
        stand: sp(e.stand),
        walk: sp(e.walk) || sp(e.stand),
        acts: sps(e.acts, 8),
        speed: num(e.speed, 5, 400, 40),
        fx: fx(e.fx),
        when: when(e.when),
      };
    })
    .filter(h => h.stand);
  // events: now and then something happens for a while: things appear, a spot opens and some of the crew are called to it
  const events = list(o.events, MAX_EVENTS).map(e => ({
    every: range(e.every, 10, 7200, 120, 300),
    time: range(e.time, 5, 900, 30, 60),
    call: int(e.call, 0, 16, 0),
    spot: obj(e.spot) ? spot(e.spot) : null,
    props: list(e.props, 12)
      .map(prop)
      .filter(p => p.s),
    drift: list(e.drift, 6)
      .map(drifter)
      .filter(d => d.s),
    when: when(e.when),
    // the chance it comes when it is due (0: only after another one or by its key)
    chance: num(e.chance, 0, 1, 1),
    // the event (by its place in the list) that follows it when it is over, if that one's hours fit (a rainbow after the rain)
    then: int(e.then, -1, MAX_EVENTS - 1, -1),
    // a coloured key of the remote that starts it on Home
    key: KEYS.indexOf(e.key) >= 0 ? e.key : '',
  }));
  // a tint over the backdrop at some hours (night): a colour and how strong
  const shade = list(o.shade, 4)
    .map(e => ({ color: hex(e.color) || '', alpha: num(e.alpha, 0, 0.9, 0.4), when: when(e.when) }))
    .filter(x => x.color);
  // the wind: now and then a gust crosses the screen from the left (dir 1) or the right (-1) at speed px/s; the props with a gust sprite
  // play it at fps as it passes, and fx comes off some of them. A list: the first whose when fits blows (windier on a windy day)
  const wind = (Array.isArray(o.wind) ? list(o.wind, 4) : obj(o.wind) ? [o.wind] : []).map(wo => ({
    every: range(wo.every, 3, 3600, 20, 40),
    speed: num(wo.speed, 50, 4000, 400),
    dir: wo.dir === -1 ? -1 : 1,
    fps: num(wo.fps, 1, 30, 8),
    fx: fx(wo.fx),
    when: when(wo.when),
  }));
  // the weather of the day: each calendar day one of these (whose days fit), by weight, the same all day (a weight up to 1000, so a
  // few days can all but have one: snow at Christmas)
  const weather = list(o.weather, 12)
    .map(e => ({ name: typeof e.name === 'string' && NAME.test(e.name) ? e.name : '', w: num(e.w, 0, 1000, 1), when: when(e.when) }))
    .filter(e => e.name);
  return {
    file: typeof o.file === 'string' ? o.file : '',
    px: int(o.px, 1, 12, 4),
    // whole minutes on Home without a key before only the world is shown (0: never; at least 1, or Home could not be used)
    watch: o.watch > 0 ? int(o.watch, 1, 120, 0) : 0,
    sprites,
    crew,
    spots,
    props,
    drift,
    herds,
    events,
    shade,
    wind,
    weather,
  };
}

// What the launcher applies: CSS variables, attributes for the few layouts that need more than a variable, and the numbers its scrolling needs.
const px = n => n + 'px';
function place(anchor, align, x, y) {
  // the four edges and the transform of a box anchored to a side, a corner or the centre
  const o = { l: 'auto', r: 'auto', t: 'auto', b: 'auto', tx: 'none' };
  if (align === 'left') o.l = px(x);
  else if (align === 'right') o.r = px(x);
  else {
    // centred: x is a distance from a side, so it does not apply
    o.l = '50%';
    o.tx = 'translateX(-50%)';
  }
  if (anchor === 'top') o.t = px(y);
  else o.b = px(y);
  return o;
}
function resolve(t, accent) {
  const v = t.v,
    A = hex(accent) || v['colors.accent'],
    night = rgb(v['colors.night']),
    ink = rgb(v['colors.ink']),
    pill = rgb(v['colors.pill']);
  const dockBottom = v['dock.anchor'] === 'bottom',
    mode = v['grid.mode'] === 'overlay' ? 'overlay' : v['grid.mode'] === 'push' || dockBottom ? 'push' : 'below',
    overlay = mode === 'overlay',
    push = mode === 'push';
  const panel = v['dock.panel'] > 0,
    pad = panel ? v['dock.panelPad'] : 0,
    dockH = v['dock.h'] + 2 * pad;
  const dockY = v['dock.y'] !== null ? v['dock.y'] : dockBottom ? 68 : 360;
  const dockTop = dockBottom ? 1080 - dockY - dockH : dockY; // where the dock's top is when the grid has no focus
  const viewTop = overlay ? 0 : Math.min(v['grid.clipTop'], push ? Math.min(dockTop, v['grid.dockUp']) : dockY);
  const gridY = v['grid.y'] !== null ? v['grid.y'] : overlay ? 290 : dockTop + dockH + 60;
  const dock =
    dockBottom && overlay
      ? place('bottom', v['dock.align'], v['dock.x'], dockY)
      : place('top', v['dock.align'], v['dock.x'], dockTop - viewTop);
  const clock = place(v['clock.anchor'], v['clock.align'], v['clock.x'], v['clock.y']),
    bar = place(v['bar.anchor'], v['bar.align'], v['bar.x'], v['bar.y']);
  const labels = v['bar.labels'] === 'auto' ? (v['bar.style'] === 'round' ? 'hide' : 'show') : v['bar.labels'];
  const FONT = {
    default: '"LG Smart UI","Helvetica Neue",Helvetica,Arial,sans-serif',
    serif: 'Georgia,"Times New Roman",Times,serif',
    mono: 'Menlo,Consolas,"DejaVu Sans Mono",monospace',
  };
  const vars = {
    '--night': v['colors.night'],
    '--night-rgb': night.join(','),
    '--panel': v['colors.panel'],
    '--panel2': mix(v['colors.panel'], v['colors.ink'], 0.06),
    '--ink': v['colors.ink'],
    '--ink2': 'rgba(' + ink.join(',') + ',.62)',
    '--ink3': 'rgba(' + ink.join(',') + ',.88)',
    '--acc': A,
    '--acc-ink': lum(A) > 0.35 ? '#0b0c10' : '#ffffff',
    '--focus': v['colors.focus'] || A,
    '--font': (v['type.fontFile'] ? '"CYTV Theme Font",' : '') + FONT[v['type.font']],
    '--fs': String(v['type.scale']),
    '--pill-bg': 'rgba(' + pill.join(',') + ',' + v['surface.pillAlpha'] + ')',
    '--pill-ring': 'rgba(' + pill.join(',') + ',' + v['surface.pillRing'] + ')',
    '--pill-r': v['bar.style'] === 'round' ? '50%' : px(v['surface.pillRadius']),
    '--pill-h': px(v['bar.size']),
    '--bar-gap': px(v['bar.gap']),
    '--menu-bg': 'rgba(' + night.join(',') + ',' + v['surface.menuAlpha'] + ')',
    '--row-r': px(v['surface.rowRadius']),
    '--clock-l': clock.l,
    '--clock-r': clock.r,
    '--clock-t': clock.t,
    '--clock-b': clock.b,
    '--clock-tx': clock.tx,
    '--clock-ai': { left: 'flex-start', center: 'center', right: 'flex-end' }[v['clock.align']],
    '--clock-s': String(v['clock.scale']),
    '--clock-fw': String(v['clock.weight']),
    '--clock-op': String(v['clock.alpha']),
    '--clock-stroke':
      v['clock.outline'] > 0 ? '1.5px rgba(' + rgb(v['clock.color'] || v['colors.ink']).join(',') + ',' + v['clock.outline'] + ')' : '0',
    '--clock-c': v['clock.color'] || v['colors.ink'],
    '--clock-font': (v['clock.fontFile'] ? '"CYTV Clock Font",' : v['type.fontFile'] ? '"CYTV Theme Font",' : '') + FONT[v['type.font']],
    '--date-s': String(v['clock.dateScale']),
    '--clock-d': v['clock.show'] ? 'flex' : 'none',
    '--date-d': v['clock.date'] ? 'block' : 'none',
    '--greet-d': v['clock.greeting'] ? 'block' : 'none',
    '--bar-l': bar.l,
    '--bar-r': bar.r,
    '--bar-t': bar.t,
    '--bar-b': bar.b,
    '--bar-tx': bar.tx,
    '--bar-d': v['bar.show'] ? 'flex' : 'none',
    '--name-d': v['shelf.show'] ? 'block' : 'none',
    '--name-x': px(v['shelf.x']),
    '--name-y': px(v['shelf.y']),
    '--name-a': v['shelf.align'],
    '--name-s': String(v['shelf.scale']),
    '--name-pre': '"' + v['shelf.prefix'] + '"',
    '--view-top': px(viewTop),
    '--dock-l': dock.l,
    '--dock-r': dock.r,
    '--dock-t': dock.t,
    '--dock-b': dock.b,
    '--dock-tx': dock.tx,
    '--dock-w': px(v['dock.w']),
    '--dock-h': px(v['dock.h']),
    '--dock-gap': px(v['dock.gap']),
    '--dock-rad': px(v['dock.radius']),
    '--dock-panel': String(v['dock.panel']),
    '--dock-panel-rgb': rgb(v['dock.panelColor']).join(','),
    '--dock-tile-alpha': String(v['dock.tileAlpha']),
    '--dock-tile-frost': String(v['dock.tileFrost']),
    '--dock-frost-rgb': rgb(v['dock.tileFrostColor']).join(','),
    '--dock-pad': px(pad),
    '--dock-lift': px(-v['dock.lift']),
    '--dock-fs': String(v['dock.focusScale']),
    '--dock-d': v['dock.show'] ? 'flex' : 'none',
    '--cols': String(v['grid.cols']),
    '--tile-h': px(v['grid.tileH']),
    '--gap-x': px(v['grid.gapX']),
    '--gap-y': px(v['grid.gapY']),
    '--tile-r': px(v['grid.radius']),
    '--grid-l': px(v['grid.x']),
    '--grid-w': px(v['grid.width']),
    '--grid-t': px(gridY - viewTop),
    '--tile-w': px(Math.floor((v['grid.width'] - (v['grid.cols'] - 1) * v['grid.gapX']) / v['grid.cols'])),
    '--grid-fs': String(v['grid.focusScale']),
    '--grid-pre': '"' + v['grid.prefix'] + '"',
    '--ov-dim': String(v['grid.overlayDim']),
    '--gloss': String(v['tile.gloss']),
    '--tile-border': String(v['tile.border']),
    '--ring-w': px(v['tile.ringWidth']),
    '--ring-off': px(v['tile.ringOffset']),
    '--tile-pre': '"' + v['tile.marker'] + '"',
    '--glow-op': String(v['effects.glow']),
    '--spd': String(v['effects.speed']),
    '--drift': String(v['effects.speed'] > 0 ? v['effects.drift'] : 0),
    '--drift-dur': Math.round(70 / (v['effects.speed'] || 1)) + 's',
  };
  const w = v['effects.wallpaper'];
  const out = {
    id: t.id,
    name: t.name,
    vars,
    attrs: { bar: v['bar.style'], labels, clock: v['clock.layout'], grid: mode, galign: v['grid.align'] },
    cols: v['grid.cols'],
    tileH: v['grid.tileH'],
    gapY: v['grid.gapY'],
    gt: gridY - viewTop,
    viewH: 1080 - viewTop,
    dockN: v['dock.show'] ? v['dock.count'] : 0,
    overlay,
    push: push ? { up: Math.max(0, dockTop - v['grid.dockUp']), gridTop: gridY } : null,
    overlayH: v['grid.overlayH'],
    glowRgb: v['effects.glowColor'] === 'accent' ? rgb(A).join(',') : '',
    nightRgb: night.join(','),
    wallpaper: w ? { id: t.id, file: w, dim: v['effects.wallpaperDim'] } : null,
  };
  // only a theme that hides its clock behind the grid has this attribute, or drops the AM/PM (the same reason)
  if (v['clock.grid'] === 'hide') out.attrs.clockgrid = 'hide';
  if (v['shelf.cursor']) out.attrs.cursor = 'on';
  if (v['tile.style'] === 'text') out.attrs.tiles = 'text';
  // only a theme with a line above the clock has this key (the same reason); the launcher writes it into the clock
  if (v['clock.prefix']) out.clockPrefix = v['clock.prefix'];
  // only a theme with light cycles or a scene has this key (the same reason); the launcher runs them (app/src/js/scene.js)
  if (v['effects.cycles'] > 0 || v['effects.scene'] !== 'none')
    out.cycles = {
      rate: v['effects.cycles'],
      cycles: v['effects.cycles'],
      horizon: v['effects.cyclesHorizon'],
      colors: [A, v['effects.cyclesColor']],
      scene: v['effects.scene'] === 'none' ? '' : v['effects.scene'],
      beamX: v['effects.beamX'],
    };
  if (!v['clock.ampm']) out.ampm = false;
  // only a theme with slots has this key (the same reason)
  if (v.slots && v.slots.length)
    out.slots = v.slots.map(sl => {
      const o = place(sl.anchor, sl.align, sl.x, sl.y);
      return {
        id: sl.id,
        align: sl.align,
        l: o.l,
        r: o.r,
        t: o.t,
        b: o.b,
        tx: o.tx,
        w: px(sl.w),
        h: px(sl.h),
        card: sl.card,
        keep: sl.keep,
      };
    });
  // only a theme with a typeface has this key, so the replies for the other themes stay as they were
  if (v['type.fontFile']) out.font = { id: v.fontTheme || t.id, file: v['type.fontFile'] };
  if (v['clock.fontFile']) out.clockFont = { id: v.clockFontTheme || t.id, file: v['clock.fontFile'] };
  // only a theme with a mascot has this key (the same reason); the launcher animates it (app/src/js/mascot.js)
  if (v['mascot.file'])
    out.mascot = {
      id: v.mascotTheme || t.id,
      file: v['mascot.file'],
      frames: v['mascot.frames'],
      walk: v['mascot.walk'],
      count: v['mascot.count'],
      size: v['mascot.size'],
      y: v['mascot.y'],
      speed: v['mascot.speed'],
      flip: v['mascot.flip'],
      pixel: v['mascot.pixel'],
    };
  // only a theme with a world has this key (the same reason); the launcher runs it (app/src/js/world.js)
  if (v.world && v.world.file) out.world = Object.assign({ id: v.worldTheme || t.id }, v.world);
  return out;
}

module.exports = {
  ACCENTS,
  DEFAULTS,
  DEFAULT_ID,
  FILE,
  FONT_FILE,
  HEX,
  ID,
  MAX_FONT,
  MAX_INDEX,
  MAX_MASCOT,
  MAX_PREVIEW,
  MAX_THEME,
  MAX_WALLPAPER,
  MAX_WORLD,
  POS,
  PREVIEW_PATH,
  SCHEMA,
  SLOT_ID,
  TOPBOT,
  check,
  dir,
  fontOk,
  fontType,
  getPath,
  hex,
  imageOk,
  imageType,
  lum,
  mix,
  normalize,
  place,
  px,
  resolve,
  rgb,
  slots,
  sniff,
  toHex,
  world,
};
