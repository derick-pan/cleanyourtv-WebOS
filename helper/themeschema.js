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
  MAX_PREVIEW = 600 * 1024,
  MAX_THEME = 32 * 1024,
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
    'Light cycles: riders that race across the floor of the picture between `effects.cyclesHorizon` and the bottom, each leaving a line of light that fades behind it; 1 is often, 0.3 now and then. Transform only.',
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
  // only a theme with light cycles has this key (the same reason); the launcher runs them (app/src/js/scene.js)
  if (v['effects.cycles'] > 0)
    out.cycles = { rate: v['effects.cycles'], horizon: v['effects.cyclesHorizon'], colors: [A, v['effects.cyclesColor']] };
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
};
