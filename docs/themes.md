# Themes

A theme changes how the home screen looks: colours, the size of tiles and text, the number of columns, the clock, the ambient glow,
the speed of animations and a wallpaper. Themes apply to the launcher's home screen (dock, top shelf, grid, top buttons and menus).
Live TV, the Inputs picker and the notification cards keep their own look.

In the launcher, **Customise** > **Theme** lists the themes; choosing one applies it at once (a theme that is not on the TV yet is
downloaded first). **Go back to the previous theme** is at the bottom of the list. **Customise** > **Accent colour** sets the colour of
the focus ring and of the highlighted button or menu row, on top of any theme. The theme list shows the highlighted theme's
screenshot and description. The Inputs picker and the Live TV banner and guide follow the theme's colours, accent and typeface too.
Your own photos can replace a theme's background: see [Wallpapers](wallpapers.md).

## Where the themes come from

Themes are not part of the service. They are read from the [`themes/`](https://github.com/lasharor/cleanyourtv-WebOS/tree/main/themes)
folder of the GitHub repository (the `main` branch):

- The service downloads `themes/index.json` (the list) when you open **Theme**.
- Choosing a theme downloads its `theme.json` and its wallpaper to the TV (`/media/developer/cleanyourtv/themes/<id>/`) and keeps them,
  so it keeps working offline. Choosing it again downloads the latest version. If GitHub cannot be reached, the list shows the themes
  that are already on the TV and says why.
- **Classic** is built into the service and always works.
- A theme is data only (values, images): the service checks every value, limits the file sizes (theme 64 KB, wallpaper 1.5 MB,
  screenshot 600 KB, mascot and sprite sheet 256 KB) and checks that the images are images. There is no script or CSS in a theme.

## The themes

| Theme | What it is |
|---|---|
| Classic | The original look: near-black, white focus, ten columns. The default. |
| Midnight | Deep blue with a wallpaper and a blue focus. |
| OLED black | Pure black and no ambient glow, so unlit pixels stay off. |
| Warm | Brown and amber, with the glow in the accent colour and a wallpaper. |
| Compact | Twelve columns of smaller tiles: more apps on screen. |
| Large print | Eight columns of big tiles and larger text. |
| Still | No animation and a quiet glow. |
| Bloom | A flower wallpaper with the dock in a glass panel at the bottom. Down moves the dock up and the apps appear below it, centred. It has slots for cards. |
| Horizon | A row of seven square apps along the bottom of a dusk landscape, the clock on the left and the buttons on the right at the top. Down moves the row up and shows all apps below it. It has slots for cards. |
| Pixel | Pixel art: a blocky typeface, square tiles and buttons, a yellow focus box and a sunset over a lake drawn in big pixels. Moves without animation, like an old console. |
| Lock Screen | A phone-style lock screen: a greeting and a big clock top left, and a small, translucent dock low in the corner over a calm blue landscape, so the picture fills the screen. Down moves the dock up and shows all apps below it. Turn Wallpapers on for your own photos. It has slots for cards (Customise > Cards): the greeting is one. |
| Cupertino | A living-room lock screen in the manner of Apple's TV: a huge thin glass clock in the sky over a night lake, the date above it, one round button, and a smoked-glass dock of square icons along the bottom. Down shows all apps. |
| The Grid | The world of the Grid, going on behind Home: light cycles racing the floor and turning, their walls of light fading when they derezz, Recognizers drifting across the sky, the portal beam pulsing up from the city and light raining down. Glass tiles edged in light stand on the floor. Down opens the apps. |
| Claude | Clawd World: a pixel village at dusk under the dock, where eight little Clawds (Claude Code's mascot) in caps of their own go from spot to spot: in at the door and up the ladder of their house to read, code, debug and play pong, jump rope or the block tower in the game room upstairs; out to hammer at the Code Forge, mine tokens, cast spells from the wizard's tower, fish, conduct a choir, dance, roast marshmallows and burrow away. Each has a name (Byte, Pixel, Moss, Nova, Spark, Sunny, Mochi, Tink) and a favourite kind of spot, and says the other's name when two meet in the street; little ones play in the meadow, ducks paddle on the pond and a frog hops off its lily pad. They keep a routine at their own hours (stretches together, marshmallows round the campfire, a picnic, tea) and now and then something happens: volleyball, a party with fireworks, a juggling show, a flying saucer, and rarely a dragon that lands on the mine's rock and roars a jet of flame, a golden Clawd, a comet, the northern lights on a winter night or a balloon festival. Day turns to dusk and night: a blue sky with the sun high by day, the sunset at dusk and dawn, a deep sky full of stars at night with the moon in its real phase. Every day has its own weather, the same all day and mostly sunny: clouds, wind, rain with showers and a rainbow after, a morning of fog, snow in winter (and nearly always at Christmas). The year turns: blossom in spring, red trees in autumn, snow and a snowman in winter, and the holidays come round: Halloween all October (witch hats, pumpkins, cobwebs, ghosts at night), Thanksgiving and Christmas both in November (pilgrims' and Santa hats in turn, a turkey, the harvest, a feast), Christmas all December (Santa hats, lights along the eaves, a wreath, presents under the fir, Santa's sleigh landing on the roof at night), New Year's Eve rockets, the Lunar New Year (red lanterns, red caps, a lion dance, firecrackers), Valentine's week, St Patrick's Day (a rainbow with a pot of gold), Easter (bunny ears, an egg hunt), the Fourth of July (fireworks) and the Mid-Autumn Festival (lanterns, tea under the full moon); a shed is built over the week and a sapling grows over the month. Gusts of wind sway the flowers, the grass and the reeds, and the stars twinkle and wheel slowly overhead. The Shows button (or a coloured key: red fireworks, green a shower, yellow a dance party, blue a snow flurry) starts a show, the dragon among them, and after a minute and a half without a key the apps fade away and the world has the screen (watch mode). A greeting and the clock in the sky, the app's name big over a row of six apps; Down opens all apps over the village. It is a world (see below). |
| Terminal | Just a terminal: green phosphor text on black in a monospace typeface, the time as the output of `date`, the apps listed one per line under `ls`, the focused line in inverse video, a prompt with a blinking cursor, and scanlines behind it all. |

![Classic, Compact, Large print and Midnight](screenshots/themes-1.jpg)

![OLED black, Still, Warm and Classic with an orange accent](screenshots/themes-2.jpg)

![Bloom: the home screen and the app grid opened with Down](screenshots/themes-3.jpg)

![Horizon: the home screen and all apps shown with Down](screenshots/themes-4.jpg)

![Pixel: the home screen and the Customise menu](screenshots/themes-5.jpg)

The pictures are the launcher page rendered in a browser with each theme.

## Contributing a theme

Themes live in the repository, so a new one is a pull request:

1. Copy a folder from [`themes/`](https://github.com/lasharor/cleanyourtv-WebOS/tree/main/themes), for example `classic`, to `themes/<id>/`.
   The id is lower-case letters, digits and `-`.
2. Edit `theme.json`; the rest keeps its default, or the value of the theme named in `"extends"`.
3. Add `preview.jpg`: a screenshot of the home screen with your theme (16:9, about 800 px wide, at most 600 KB).
4. If it uses a wallpaper, add the image to the same folder (`.jpg`, `.png` or `.webp`, at most 1.5 MB, 1920 x 1080) and name it in
   `effects.wallpaper`. A typeface goes in the folder too, named in `type.fontFile`, with its licence file. A wallpaper or typeface
   must be your own work or under a licence that allows redistribution; say which in the pull request.
5. Run `node tools/theme-index.js` to update `themes/index.json`, then `node tools/test.js theme`: it checks every theme folder against the
   schema, that the screenshot is there, and that the index is up to date.
6. Open the pull request. Once it is merged into `main`, every TV can download the theme; no release is needed.

When you add a setting to the engine, add one row to `SCHEMA` in `helper/themeschema.js`, read its variable in the launcher's CSS (`app/src/css/`, then `node tools/build-pages.js`), and run
`node tools/theme-docs.js` to regenerate the table below.

## Making a theme with an AI assistant

An assistant such as Claude can write a theme from a description ("a calm blue theme with big tiles and the dock at the bottom"). Give it a
checkout of the repository (or these files) and the rules below.

**What it needs to read**
- The table of settings further down this page (or `SCHEMA` in `helper/themeschema.js`, the source of that table): every key, its range and its default.
- `themes/classic/theme.json` and one existing theme that is close to the goal, for example `themes/bloom/theme.json`.
- `themes/README.md` for the folder layout.

**Rules**
- A theme is data only: `themes/<id>/theme.json` with keys from the table, nothing else. No CSS, no script, no URLs. Unknown keys and
  out-of-range values are ignored or clamped, so a value that is not in the table has no effect.
- Positions and sizes are pixels on a 1920 x 1080 canvas. Keep the clock and the buttons at least 60 px from the screen edges (TVs can
  crop the picture), and make sure the dock fits: `dock.count` x `dock.w` plus the gaps must be at most the screen width (a panel adds
  `dock.panelPad` on each side).
- Text must stay readable: about 4.5 : 1 between `colors.ink` and the surfaces it sits on, and a visible focus ring. The text colour on the
  accent is chosen automatically.
- The TV's graphics chip is weak: no blurred or animated wallpapers, one static image at most, 1920 x 1080, at most 1.5 MB (`.jpg`,
  `.png` or `.webp`), kept in the theme's folder and named in `effects.wallpaper`. Prefer the dock and grid settings over tricks.
- A wallpaper must be original (drawn or generated for the theme) or under a licence that allows redistribution. Do not copy other
  people's artwork, screenshots or logos, and do not use brand names or trademarks in a theme.
- Use `"extends"` to start from another theme and list only what changes. Do not rename a setting group: `name`, `author`, `description` and
  `extends` are the theme's own fields.

**Steps**
1. Create `themes/<id>/theme.json` (and the wallpaper, if any).
2. Look at it: `node tools/theme-preview.mjs <id> --out /tmp/preview` renders the home screen with made-up apps in headless Chrome and writes
   `rest.png` (home), `grid.png` (the focus moved down into the apps) and `menu.png` (a menu). It needs Node.js 22 or newer and Chrome. Open
   the images, fix what looks wrong (overlapping parts, unreadable text, clipped tiles) and render again.
3. When it looks right, `node tools/theme-preview.mjs <id> --write` also writes `themes/<id>/preview.jpg` (needs `ffmpeg`), the screenshot the TV shows.
   A theme's world is shown still for it, at half past seven in the evening of a summer day (28 June 2026, a Sunday at full moon) whatever
   the date.
4. `node tools/theme-index.js` updates `themes/index.json`; `node tools/test.js theme` checks every theme folder, the screenshot and the index.
5. Commit and open a pull request; say where the wallpaper comes from.

**A prompt to start with**

> Create a theme for CleanYourTV. Read the settings table in `docs/themes.md`, `themes/classic/theme.json` and `themes/bloom/theme.json`.
> The theme: *describe the look and the layout you want*. Write `themes/<id>/theme.json` using only keys from the table (data only; ranges
> are enforced), generate an original wallpaper if it needs one (1920 x 1080, under 1.5 MB, saved in the theme's folder), render it with
> `node tools/theme-preview.mjs <id> --out /tmp/preview`, look at `rest.png`, `grid.png` and `menu.png`, fix problems and render again, then
> run `node tools/theme-preview.mjs <id> --write`, `node tools/theme-index.js` and `node tools/test.js theme`. Keep text readable and the
> wallpaper my own work.

## Theme files

A theme is `themes/<id>/theme.json` in the repository. Every key is optional.
A missing or invalid value keeps the value of the theme named in `"extends"`, or the default, which is the original look, so a
theme lists only what it changes. Positions and sizes are in pixels on a 1920 x 1080 canvas.

```json
{
  "name": "Midnight",
  "author": "CleanYourTV",
  "description": "Deep blue with a soft wallpaper and a blue focus.",
  "extends": "classic",
  "colors": { "night": "#060a18", "panel": "#101830", "ink": "#eaf0ff", "accent": "#7aa2ff" },
  "effects": { "glow": 0.8, "wallpaper": "midnight.jpg", "wallpaperDim": 0.25 }
}
```

### What a theme can set

Every part of the home screen has its own position and size, so themes can arrange the screen differently, not only recolour it:
the **clock** (which can also be huge, thin, translucent and outlined like glass, with its own typeface, the date above it and no AM/PM),
the top **buttons** (`bar`), the large app **name**, the **dock** (on a white or a dark glass panel) and the **grid**. Each can be anchored to the top
or bottom edge and aligned left, centre or right, with an offset. A dock at the bottom turns the grid into an overlay that opens
when the focus moves down into it (Back or Up closes it); a dock at the top leaves the grid below it, scrolling. A theme can also
bring a **mascot**: a small picture that walks along the bottom of the screen (see [A mascot](#a-mascot) below), or a whole **world**: a
little place with characters going about their business behind Home, drawn from a sprite sheet (see [A world](#a-world) below).

<!-- schema:start -->
| Key | Values | Default | |
|---|---|---|---|
| **colors** | | | |
| `colors.night` | `#rrggbb` | `#07080b` | Page background. |
| `colors.panel` | `#rrggbb` | `#14161b` | Toast background; menu rows are a lighter mix of it. |
| `colors.ink` | `#rrggbb` | `#f5f6f8` | Text. |
| `colors.accent` | `#rrggbb` | `#f5f6f8` | Highlight: the focused button and menu row and, unless `colors.focus` is set, the focus ring. |
| `colors.focus` | `#rrggbb` or empty | empty | Focus ring colour; empty uses the accent. |
| `colors.pill` | `#rrggbb` | `#ffffff` | Colour of the translucent top buttons, with `surface.pillAlpha`. |
| **surface** | | | |
| `surface.pillAlpha` | 0 to 0.6 | `0.09` | Opacity of the top buttons. |
| `surface.pillRing` | 0 to 0.8 | `0.1` | Opacity of the thin outline of the top buttons. |
| `surface.pillRadius` | 0 to 60 | `32` | Corner radius of the top buttons (pill style only). |
| `surface.menuAlpha` | 0.5 to 1 | `0.97` | Opacity of the dark layer behind menus. |
| `surface.rowRadius` | 0 to 50 | `30` | Corner radius of menu rows. |
| **type** | | | |
| `type.font` | `default`, `serif`, `mono` | `default` | The typeface: the TV's own, a serif or a monospace. |
| `type.fontFile` | a file name | none | A typeface of the theme: a file in the theme's folder, `.woff2`, `.woff`, `.ttf` or `.otf`, at most 400 KB, used for all text. Characters it lacks come from `type.font`. Its licence must allow redistribution; put the licence file in the folder too. |
| `type.scale` | 0.8 to 1.3 | `1` | Scale of the text of buttons, menus and tiles. |
| **clock** | | | |
| `clock.show` | `true` or `false` | `true` | Show the clock. |
| `clock.date` | `true` or `false` | `true` | Show the date beside or under the time. |
| `clock.greeting` | `true` or `false` | `false` | Show a greeting (Good morning / afternoon / evening, in the language) in capitals above the time. Needs the stacked layout. |
| `clock.layout` | `inline`, `stack`, `above` | `inline` | `inline`: the date beside the time; `stack`: under it; `above`: over it (a big centred clock with the date on top). |
| `clock.anchor` | `top`, `bottom` | `top` | Which screen edge `clock.y` counts from. |
| `clock.align` | `left`, `center`, `right` | `left` | Which side `clock.x` counts from; `center` centres it. |
| `clock.x` | 0 to 900 | `96` | Distance from that side, in px (on a 1920 x 1080 canvas). Not used when centred. |
| `clock.y` | 0 to 900 | `54` | Distance from the top or bottom edge, in px. |
| `clock.scale` | 0.6 to 8 | `1` | Scale of the time (1 is 56 px; 7 fills a third of the screen). |
| `clock.ampm` | `true` or `false` | `true` | Show AM/PM (or the language's equivalent) after a 12-hour time; off, a lock-screen clock shows the digits only. |
| `clock.grid` | `keep`, `hide` | `keep` | `hide`: the clock fades out while the app grid is open (for a big clock the tiles would cover). |
| `clock.prefix` | text, up to 8 characters | none | Up to sixteen plain characters on a line above the time, a little dimmer, like the command that printed it: `$ date`. |
| `clock.weight` | 100 to 900 | `600` | Weight of the time: 200 thin, 400 regular, 600 semi-bold, 800 heavy (what the typeface has). |
| `clock.alpha` | 0.1 to 1 | `1` | Opacity of the time; below 1 the picture shows through the digits, like glass. |
| `clock.outline` | 0 to 1 | `0` | Opacity of a thin outline around the digits (a rim on a glass clock); 0 for none. |
| `clock.color` | `#rrggbb` or empty | empty | Colour of the time; empty uses the text colour. |
| `clock.fontFile` | a file name | none | A typeface for the time only: a font file in the theme's folder, like `type.fontFile` (same limits and licence rule); the rest of the text keeps the theme's font. |
| `clock.dateScale` | 0.6 to 2 | `1` | Scale of the date. |
| **bar** | | | |
| `bar.show` | `true` or `false` | `true` | Show the top buttons (Inputs, Settings, Customise, ...). |
| `bar.style` | `pill`, `round`, `flat` | `pill` | `pill`: icon and label on a rounded button; `round`: icon only in a circle; `flat`: no background. |
| `bar.labels` | `auto`, `show`, `hide` | `auto` | Button labels: `auto` shows them except in the `round` style. |
| `bar.anchor` | `top`, `bottom` | `top` | Which screen edge `bar.y` counts from. |
| `bar.align` | `left`, `center`, `right` | `right` | Which side `bar.x` counts from. |
| `bar.x` | 0 to 900 | `96` | Distance from that side, in px. Not used when centred. |
| `bar.y` | 0 to 900 | `54` | Distance from the top or bottom edge, in px. |
| `bar.size` | 40 to 100 | `64` | Height of a button, in px. |
| `bar.gap` | 4 to 40 | `16` | Space between buttons, in px. |
| **shelf** | | | |
| `shelf.show` | `true` or `false` | `true` | Show the large name of the focused app. |
| `shelf.align` | `left`, `center`, `right` | `left` | Text alignment of the name. |
| `shelf.x` | 0 to 900 | `96` | Margin on both sides, in px. |
| `shelf.y` | 0 to 900 | `150` | Distance from the top edge, in px. |
| `shelf.scale` | 0.4 to 1.6 | `1` | Scale of the name. |
| `shelf.prefix` | text, up to 8 characters | none | Up to eight plain characters before the name, a little dimmer, like a prompt: `$ `, `> `, `~ `. |
| `shelf.cursor` | `true` or `false` | `false` | A blinking block after the name, like a terminal cursor. |
| **dock** | | | |
| `dock.anchor` | `top`, `bottom` | `top` | Which screen edge `dock.y` counts from. |
| `dock.align` | `left`, `center`, `right` | `left` | Which side `dock.x` counts from; `center` centres the dock. |
| `dock.x` | 0 to 900 | `96` | Distance from that side, in px. Not used when centred. |
| `dock.y` | px, 0 to 1000 | empty | Distance from the top or bottom edge, in px. Empty: 360 from the top, 68 from the bottom. |
| `dock.show` | `true` or `false` | `true` | Show the dock; off, every app is in the grid (a list of all apps, as in a terminal). |
| `dock.count` | 3 to 8 | `4` | Apps in the dock. |
| `dock.w` | 120 to 500 | `408` | Width of a dock tile, in px. |
| `dock.h` | 100 to 300 | `230` | Height of a dock tile, in px. |
| `dock.gap` | 8 to 60 | `32` | Space between dock tiles, in px. |
| `dock.radius` | 0 to 80 | `36` | Corner radius of dock tiles. |
| `dock.panel` | 0 to 0.6 | `0` | Opacity of a translucent panel behind the dock tiles; 0 for none. |
| `dock.panelPad` | 0 to 60 | `24` | Space between the panel and the tiles, in px. |
| `dock.panelColor` | `#rrggbb` | `#ffffff` | Colour of the panel behind the dock (`dock.panel`): white for frosted glass, a dark colour for smoked glass. |
| `dock.tileAlpha` | 0 to 1 | `1` | Opacity of the dock tile background; below 1 lets the wallpaper show through the tiles. |
| `dock.tileFrost` | 0 to 1 | `0` | Frost over the resting (unfocused) dock tiles and their icons; 0 for none. Calms loud tile colours without leaving a floating icon square, because the tile and its icon dim together. The focused tile keeps its full colour. |
| `dock.tileFrostColor` | `#rrggbb` | `#ffffff` | Tint of the dock-tile frost (`dock.tileFrost`): a light colour for a glassy frost, a dark one to deepen the tiles. |
| `dock.lift` | 0 to 40 | `10` | How far the focused dock tile rises, in px. |
| `dock.focusScale` | 1 to 1.3 | `1.05` | Scale of the focused dock tile. |
| **grid** | | | |
| `grid.mode` | `below`, `push`, `overlay` | `below` | `below`: the grid sits under the dock and scrolls (a dock at the bottom behaves as `push`); `push`: the grid sits under the dock out of sight, and when the focus moves down into it the dock moves up to `grid.dockUp` and the grid appears below it; `overlay`: the grid opens over the screen above the dock. |
| `grid.dockUp` | 0 to 700 | `220` | `push` mode: where the dock stops, counted from the top of the screen, while the grid has the focus, in px. |
| `grid.align` | `left`, `center` | `left` | `center` centres every row of tiles, also a last row that is not full. |
| `grid.cols` | 1 to 14 | `10` | Columns; 1 lists the apps one under the other. |
| `grid.tileH` | 32 to 240 | `151` | Height of a tile, in px; the width follows from the columns. A line of text needs about 44. |
| `grid.prefix` | text, up to 8 characters | none | Up to sixteen plain characters on a line just above the grid, a little dimmer, like the command that listed the apps: `$ ls apps/`. |
| `grid.gapX` | 6 to 60 | `24` | Horizontal space between tiles, in px. |
| `grid.gapY` | 6 to 60 | `26` | Vertical space between tiles, in px. |
| `grid.radius` | 0 to 100 | `34` | Corner radius of tiles. |
| `grid.x` | 0 to 900 | `96` | Distance of the grid from the left edge, in px. |
| `grid.width` | 600 to 1920 | `1728` | Width of the grid, in px. |
| `grid.y` | px, 0 to 1000 | empty | Distance of the grid from the top edge, in px. Empty: under the dock, or 290 for an overlay. |
| `grid.clipTop` | 0 to 600 | `300` | Where scrolled rows disappear at the top, in px (`below` mode). |
| `grid.focusScale` | 1 to 1.4 | `1.12` | Scale of the focused tile. |
| `grid.overlayDim` | 0 to 1 | `0.95` | Opacity of the layer behind the overlay grid. |
| `grid.overlayH` | 200 to 900 | `510` | Visible height of the overlay grid before it scrolls, in px. |
| **tile** | | | |
| `tile.style` | `icon`, `text` | `icon` | `icon`: the app's icon on a coloured tile; `text`: only its name, in a line of text with no background, the focused one in the accent colour (inverse video), as in a terminal. |
| `tile.marker` | text, up to 8 characters | none | Text tiles: up to eight characters before the focused name, for example `> `; the other names keep the space, so they line up. |
| `tile.gloss` | 0 to 1 | `0` | A light highlight on every tile. |
| `tile.border` | 0 to 0.6 | `0` | Opacity of a thin outline on every tile. |
| `tile.ringWidth` | 0 to 10 | `4` | Width of the focus ring, in px; 0 for none. |
| `tile.ringOffset` | 0 to 14 | `4` | Space between a tile and its focus ring, in px. |
| **effects** | | | |
| `effects.glow` | 0 to 1 | `1` | Strength of the ambient glow at the top. |
| `effects.glowColor` | `app`, `accent` | `app` | `app`: taken from the focused icon; `accent`: the accent colour. |
| `effects.speed` | 0 to 2 | `1` | Animation speed multiplier; 0 switches the animations off. |
| `effects.wallpaper` | a file name | none | A file name in `themes/wallpapers/`: `.jpg`, `.png` or `.webp`, at most 1.5 MB; drawn at 1920 x 1080. |
| `effects.wallpaperDim` | 0 to 0.9 | `0.4` | How far the wallpaper is darkened with the background colour. |
| `effects.drift` | 0 to 1 | `0` | A slow drift of the wallpaper: over about a minute it zooms in a little and glides, then back, like a lock screen; 1 is a tenth of the picture. Transform only. `effects.speed` sets the pace. |
| `effects.cycles` | 0 to 1 | `0` | Light cycles: riders on the floor of the picture, between `effects.cyclesHorizon` and the bottom, that turn at right angles and leave a wall of light along every stretch they rode, until they derezz and the walls fade; 1 is fast and many, 0.3 slow and few. Transform only. |
| `effects.cyclesHorizon` | 0 to 1000 | `640` | Where the floor starts, from the top edge, in px: a rider far away passes just below it, small and slow. |
| `effects.cyclesColor` | `#rrggbb` | `#ff8a3d` | The second colour of the riders; the first is the accent. |
| `effects.scene` | `none`, `lightcity` | `none` | `lightcity`: a world of light going on behind Home: Recognizers (big ships) drift across the sky, the portal beam at `effects.beamX` pulses up from the horizon, light rains down and pulses of light sweep the floor to the horizon. Transform and opacity only. |
| `effects.beamX` | 0 to 1920 | `960` | Where the portal beam of `effects.scene` stands, from the left edge, in px. |
| **mascot** | | | |
| `mascot.file` | a file name | none | A small character that walks along the bottom of Home: a `.png`, `.webp` or `.jpg` in the theme's folder, at most 256 KB. One picture, or a strip of `mascot.frames` pictures of the same size side by side (a walk cycle, the first one standing). The launcher moves it with transforms only. |
| `mascot.frames` | 1 to 16 | `1` | Pictures in the strip, left to right. |
| `mascot.walk` | 0 to 16 | `0` | How many of them, from the left, are the walk cycle (the first standing); the rest are poses in this order: wave, happy, sleepy, surprised, dizzy, thinking. 0: all of them walk. |
| `mascot.count` | 1 to 4 | `1` | How many of the character walk about, each a little smaller than the one before. |
| `mascot.size` | 32 to 240 | `96` | Height of the mascot on screen, in px. |
| `mascot.y` | 0 to 900 | `36` | Distance of its feet from the bottom edge, in px. |
| `mascot.speed` | 0 to 2 | `1` | How fast it walks and how often it plays; 0 keeps it standing still. `effects.speed` 0 stops it too. |
| `mascot.flip` | `true` or `false` | `true` | Mirror the picture when it walks to the left (draw it facing right). |
| `mascot.pixel` | `true` or `false` | `false` | Pixel art: the picture is scaled without smoothing, so its pixels stay crisp. |
<!-- schema:end -->

### Slots for cards

A theme can mark places where **cards** go: small widgets the user chooses in **Customise** > **Cards** (greeting, weather,
text and Home Assistant cards). A theme without slots shows no cards and has no Cards row in Customise. Slots are a
list in `theme.json`:

```json
"slots": [
  { "id": "greeting", "anchor": "top", "align": "left", "x": 102, "y": 70, "w": 900, "h": 26, "card": "greeting", "grid": "keep" },
  { "id": "side", "anchor": "top", "align": "right", "x": 96, "y": 170, "w": 520, "h": 520 }
]
```

| Key | Values | What it does |
|---|---|---|
| `id` | lower-case letters, digits and `-` | The name of the place. Use `greeting` (above the clock), `clock-side` (beside the clock), `side` (a column on the right) or `row` (above the dock) where they fit: the card a user chose stays when they switch to another theme with the same slot, and these four have a name in every language. |
| `anchor`, `align`, `x`, `y` | as for the clock | Where the slot's box is, counted from that side of the 1920 x 1080 screen; `x` is not used when centred. |
| `w`, `h` | px | The size of the box. |
| `card` | a card type, for example `greeting` | What the slot shows until the user chooses something else. Without it the slot starts empty. |
| `grid` | `keep` or `hide` | `keep` leaves the card on screen while the app grid is open; by default it fades out then. |

At most eight slots; values out of range are clamped and a slot with a bad or repeated `id` is left out. A theme that extends another
keeps its slots unless it has its own `"slots"` (an empty list removes them). In a right-to-left language the slots are mirrored
like the rest of the screen.

### A mascot

A theme can have a mascot: a small character that walks along the bottom of Home, like the little Claudes of the Claude theme. The
theme only gives a picture; the launcher does the walking (`app/src/js/mascot.js`), with transforms only, so the TV draws each one as a
small layer. They walk left and right, rest, nap, wave, think (a slow sway and a breath, like the thinking spinner), hop, spin, dash,
dance, wiggle and peek from an edge, and hop once when the focus moves. They stay under the menus, the toasts and Live TV, and stop
while Home is not on screen.

```json
"mascot": { "file": "claude-walk.png", "frames": 12, "walk": 6, "count": 3, "size": 104, "y": 28, "speed": 1, "flip": true }
```

- `mascot.file` is a `.png`, `.webp` or `.jpg` in the theme's folder, at most 256 KB, downloaded with the theme like a wallpaper. A PNG
  with transparency looks best.
- The picture is a strip of `mascot.frames` frames of the same size side by side. The first `mascot.walk` of them are the walk cycle
  (the first one standing, played at eight frames a second while it walks); the frames after those are poses, in this order: waving,
  happy, sleepy, surprised, dizzy, thinking. A theme may give fewer poses, or none: the standing frame stands in. Draw the character
  facing right; with `mascot.flip` it is mirrored when it walks left.
- `mascot.count` puts up to four of the character on screen, each a little smaller than the one before. `mascot.pixel` keeps the pixels
  of pixel art crisp (no smoothing when the picture is scaled).
- `mascot.size` is its height on screen and `mascot.y` the distance of its feet from the bottom edge. `mascot.speed` scales how fast they
  walk and how often they do something; 0 keeps them standing, and so does `effects.speed` 0.

### A world

A theme can bring a little world that goes on behind Home, like Clawd World in the Claude theme: props that stay in place and play
their frames (a campfire, a glint on the water, a choir), things that cross the sky (clouds, birds, a balloon), and a **crew** of
characters who walk from **spot** to spot and do what each spot says there (hammer at an anvil, read, fish), in at a door, up a ladder
to a room upstairs, or out of sight for a while (into a mine, under the sand). They say things in speech bubbles, meet in the street
for a chat, and play games together: a game waits for its players and brings out its table, rope or ball when they are all there. Herds
of little ones wander about a meadow. Now and then an **event** comes (a match, a picnic, a party with fireworks, a shower that sends
everyone indoors, a visitor), and some things only happen at some hours, on some days or in some weather (`when`): the night, lunch,
Halloween, a day of rain. What comes and goes with the hours fades in and out (`fade`), so a theme can lay a sky of the day and another
of the night over its backdrop and the day turns into night. Every day has its own **weather**, picked from the date (not the real
weather outside): the same all day and on every TV. Gusts of wind cross the scene and what grows sways as they pass, and a sky of stars
can wheel slowly overhead (`pan`). Spots and props can give off particles that rise, float away, pop, fall or blow away (hearts, notes,
smoke, sparks, rain, snow, petals). The crew can have names and favourite kinds of spot, and wear a hat on holidays; a prop can show
the moon's phase or the day of the week or the month (a moon, a shed built over the week). Rare events come only by their `chance`, one
can follow another (a rainbow after a shower), the ones with a `title` are shows in a **Shows** menu on Home and the coloured keys of
the remote start the ones that have a `key`; a visitor can land a while on its way (the dragon on the rock), the crew can wear the hats
of a holiday in turn, and a holiday can follow a feast that moves from year to year (the Lunar New Year, Easter). The theme gives the
pictures and says where things are; the launcher does the rest (`app/src/js/world.js`).

Everything is drawn from one **sprite sheet**, a picture in the theme's folder that holds every frame of every sprite, scaled up `px`
times without smoothing so pixel art stays crisp. Usually the static part of the place (the buildings, the ground) is the wallpaper,
drawn at the same scale, and the world puts the moving parts on it. It moves with transforms and opacity only and in whole art pixels,
and the frames are CSS animations, so the TV's GPU draws each piece as a small layer and the script only acts when a character starts
something new. The crew hop when the focus moves, and two of them wave when Home comes back or an app opens. With `watch`, the clock,
the buttons and the apps fade away after that many minutes without a key and the world has the screen (watch mode, see [the
launcher](launcher.md#keys)). The world sits under the dock, the grid and the menus; under the open grid its animations pause behind
the grid's dark layer, and with `effects.speed` 0 each character just stands at a spot. While Home is hidden (an app is open) or Live
TV plays, the world is taken out of the page, so it costs the TV nothing, not even memory on its GPU, and an event going on ends.

A TV that cannot keep up loses nothing it needs: a few seconds after Home shows, the world times the TV's frames, and only when many
come late does it shed what is least seen, a step at a time, timing them again after each. First it keeps fewer particles at a time
(18 instead of 36), lets no petals blow and flares half as often; then fewer still (8), the sky holds still, glows stop pulsing and
nothing flares. A TV that keeps up sheds nothing. The step is written to the service's log (`perf world level 1 ...`, see
`tools/perf-tv.sh`).

```json
"world": {
  "file": "clawd.png",
  "px": 5,
  "watch": 3,
  "sprites": { "stand": [65, 182, 16, 10, 8, 8, 10, 6], "walk": [0, 182, 16, 11, 4, 8, 11, 6], "pong": [0, 120, 40, 12, 16, 20, 12], "fire": [65, 155, 14, 13, 4] },
  "crew": {
    "count": 8, "speed": 70, "stand": "stand", "walk": "walk", "climb": "climb", "wave": "wave", "wait": "wait", "looks": 6, "bubble": 70,
    "lane": [905, -150, 1570],
    "chat": { "every": [12, 30], "say": ["say-dots", "say-heart"], "act": "clap" },
    "hats": [{ "look": 6, "when": { "d": ["10-24", "10-31"] } }],
    "members": [{ "name": "name-byte", "likes": ["code"] }, { "name": "name-moss", "likes": ["outdoors"] }],
    "hello": ["say-heart", "say-sun"]
  },
  "spots": [
    { "x": 1050, "y": 860, "act": "code", "fps": 8, "tag": "code", "path": [[670, 880, 0], [720, 860, 0]], "say": { "s": ["say-code", "say-bug"], "every": 7 } },
    { "x": 910, "y": 735, "n": 2, "gap": 170, "acts": ["pongl", "pongr"], "fps": 8, "group": "games", "time": [14, 28],
      "path": [[670, 880, 0], [720, 860, 0], [1265, 860, 0], [1265, 735, 1]], "show": [{ "s": "pong", "x": 910, "y": 735 }] }
  ],
  "props": [
    { "s": "sky-day", "x": 0, "y": 0, "under": true, "when": { "h": [7, 18] }, "fade": 300 },
    { "s": "starfield", "x": 0, "y": 0, "under": true, "pan": [-240, 480], "when": { "h": [18, 7] }, "fade": 240 },
    { "s": "fire", "x": 1310, "y": 950, "fps": 8, "front": true },
    { "s": "reeds", "x": 1860, "y": 890, "fps": 1.5, "gust": "reeds-gust" },
    { "s": "pumpkin", "x": 655, "y": 860, "when": { "d": ["10-15", "11-01"] } },
    { "s": "moon", "x": 840, "y": 110, "under": true, "phase": "moon", "when": { "h": [18, 7] } },
    { "s": "frog", "x": 1650, "y": 1030, "play": { "s": "frog-hop", "every": 16, "fps": 8 } },
    { "s": "puddle", "x": 460, "y": 930, "fps": 3, "when": { "w": ["rain"] }, "fade": 120 }
  ],
  "drift": [{ "s": "cloud-a", "y": 515, "speed": 9, "dir": -1 }],
  "herds": [{ "count": 5, "area": [620, 985, 1180, 1060], "stand": "mini", "walk": "mini-walk", "acts": ["mini-cheer"], "speed": 30 }],
  "events": [{ "every": [90, 240], "time": [40, 80], "call": 2, "when": { "h": [8, 22] },
               "spot": { "x": 950, "y": 1025, "n": 2, "gap": 190, "acts": ["volleyl", "volleyr"], "fps": 8, "time": [600, 600], "show": [{ "s": "volley", "x": 950, "y": 1025 }] } },
             { "every": [1200, 3600], "chance": 0.25, "time": [40, 46], "when": { "h": [9, 17] }, "drift": [{ "s": "golden", "y": 905, "speed": 56, "fps": 8 }] },
             { "chance": 0, "key": "red", "time": [40, 70], "props": [{ "s": "fw-a", "x": 450, "y": 590, "fps": 8, "rest": 3 }] }],
  "shade": [{ "color": "#0b0a26", "alpha": 0.38, "when": { "h": [21, 24] } }],
  "weather": [{ "name": "sun", "w": 64 }, { "name": "rain", "w": 9, "when": { "d": ["03-01", "11-30"] } }, { "name": "snow", "w": 30, "when": { "d": ["12-01", "02-29"] } }],
  "wind": [{ "every": [4, 9], "speed": 560, "fps": 12, "when": { "w": ["wind"] } },
           { "every": [14, 36], "speed": 460, "fps": 10, "fx": { "s": "blossom", "kind": "blow", "dy": -25 } }]
}
```

| Key | Values | What it does |
|---|---|---|
| `file` | a file name | The sprite sheet: a `.png` (with transparency), `.webp` or `.jpg` in the theme's folder, at most 256 KB, downloaded with the theme. Without it, or when it is not an image, the theme has no world. |
| `px` | 1 to 12 | How many screen pixels an art pixel of the sheet is (default 4). |
| `watch` | 0, or 1 to 120 minutes | Watch mode: after that many minutes without a key or a move of the pointer on Home (no menu open, the grid closed, no Live TV) the clock, the buttons and the apps fade away and the world has the screen; a key or a move of the pointer brings them back. 0 (the default): never. |
| `sprites` | name: `[x, y, w, h, frames, ax, ay, looks]` | A strip of `frames` frames, each `w` x `h`, side by side in the sheet from `x`, `y` (art pixels). `ax`, `ay` is the point of a frame that stands on a place (its feet); it defaults to the middle of the bottom edge and may be below the frame (someone sitting behind a desk). `looks` (1 to 16) strips of the same size may follow under it, one for each look of the crew (a cap of another colour). Names are lower-case letters, digits and `-`. Draw characters facing right. |
| `crew` | below | The characters. |
| `spots` | a list | The places where something happens, below. |
| `props` | a list: `s`, `x`, `y`, `fps`, `pulse`, `bob`, `front`, `under`, `rest`, `fx`, `when`, `fade`, `pan`, `gust` | A sprite that stays at `x`, `y` (its anchor) and plays its frames at `fps`. `pulse` (seconds) lets it glow and fade, `bob` moves it up and down that many art pixels, `rest` (seconds) shows it only now and then (a fish jumping), `front` puts it in front of the crew (a fire they pass behind), `under` under everything else of the world (the drift and the tint too: a sky), `fx` gives off particles, `when` shows it only at some hours or on some days, fading in and out over `fade` seconds (default 20). `pan` `[px, seconds]` drifts it slowly that far and back, one px at a time, each way in that time (the stars wheeling); every prop with the same `pan` keeps with the others, by the clock. `gust` is a sprite it plays once when a gust of wind passes over it (`wind`), then it goes back to its own frames. `play` `{s, every, fps}` plays sprite `s` once about every `every` seconds (a frog hopping off its lily pad), then its own frames again. `phase` shows one of its frames by the date instead of playing them: `moon` the moon's phase (the first frame the new moon, the middle one full), `month` the day of the month (a sapling growing), `week` the day of the week, Monday first (a shed being built). |
| `drift` | a list: `s`, `y`, `speed`, `dir`, `fps`, `bob`, `when`, `fade`, `perch` | A sprite that crosses the screen at `y` (its anchor), `speed` px/s, left to right (`dir` 1) or the other way (-1, mirrored), then stays out of sight for a while and comes again. An event's drift can have a `perch` `{x, y, s, fps, time, fx}`: it flies in from its edge to `x`, `y`, shows sprite `s` there for `time` `[min, max]` seconds turned to the middle of the screen, giving off `fx`, then flies on and out at the other side (the dragon on the mine's rock, Santa's sleigh on the roof). |
| `herds` | a list: `count`, `area`, `stand`, `walk`, `acts`, `speed`, `fx`, `when` | Up to 8 groups of little ones (1 to 12 each) that wander about `area` `[x0, y0, x1, y1]`, stand, hop, do one of `acts` now and then, and play in pairs with `fx` between them. A herd without a `stand` sprite is left out. |
| `events` | a list, below | What comes now and then. |
| `shade` | a list: `color`, `alpha`, `when` | A tint over the backdrop (the night, a grey day): the first whose `when` fits, `alpha` 0 to 0.9 strong. It comes and goes slowly. |
| `weather` | a list: `name`, `w`, `when` | The weathers a day can have (up to 12): each day one of those whose days (`when` `d`) fit, by weight `w` (0 to 1000, default 1), picked from the date, so it is the same all day and on every TV, and not the weather outside. The same name can come twice, for more weight on some days (snow at Christmas). Props, drift, spots, events, the tint and the wind can then keep to some weathers (`when` `w`). |
| `wind` | `every` `[min, max]` seconds, `speed` px/s, `dir`, `fps`, `fx`, `when` | Now and then a gust crosses the screen from the left (`dir` 1) or the right (-1, the `gust` sprites mirrored), and every prop with a `gust` plays it at `fps` as it passes, so what grows sways in a wave. `fx` comes off some of them (a petal, `kind` `blow`: carried away the way the wind goes). It can be a list of up to 4: the first whose `when` fits blows (a windy day's gusts first, the usual ones last). |

The crew:

| Key | Values | What it does |
|---|---|---|
| `count`, `speed` | 0 to 16, px/s | How many there are and how fast they walk. |
| `stand`, `walk`, `climb`, `wave`, `wait` | sprites | Standing (a few frames with a blink), walking, climbing a ladder, waving, and waiting at a game for the other players. Without `walk` they walk with `stand`. |
| `looks` | 1 to 16 | How many looks there are: member 1 has the first, member 2 the second, and so on round; a sprite without a strip for a look shows its first. |
| `bubble` | px | How high over their feet a speech bubble shows. |
| `lane` | `[y, from x, to x]` | A street they keep to between spots: out onto it, along it, then in to the next spot; without it they walk straight across. |
| `chat` | `every` `[min, max]` seconds, `say` sprites, `act` | Now and then two of those at a spot meet in the street, face each other and talk in turn (bubbles picked from `say`), then do `act` together. |
| `hats` | a list: `look` or `looks`, `when` | Up to 12 looks everyone wears on some days instead of their own (a hat for a holiday): the first whose `when` fits. `look` (1 to 15) is which strip of each sprite they wear, counted like the looks from 0: with 6 everyday looks, the hats are 6 and on. `looks` (up to 4) are worn in turn, one each round the crew (pilgrims' and Santa hats in November). |
| `members` | a list: `name`, `likes` | Who they are, in order: `name` a sprite (a bubble with a name) each says first to the other when two meet, `likes` up to 6 tags of spots it goes to three times as often. |
| `hello` | sprites | What the two who wave say when Home comes back or an app opens (a bubble picked from these). |

A spot:

| Key | Values | What it does |
|---|---|---|
| `x`, `y` | px | Where a character stands there (the anchor of its sprite). |
| `act`, `acts`, `fps` | a sprite, a list, frames a second | What it does there; without `act` it stands. `acts` gives each place of a spot for several its own (two turn a rope, one jumps). |
| `face` | `1`, `-1` or `0` | Facing right or left (mirrored); `0`: the way it came, or towards the others in a spot for several. |
| `time` | `[min, max]` seconds | How long it stays. |
| `n`, `gap` | 1 to 6, px | Places for several side by side, `gap` apart. A spot where one already waits draws company, and the first one there waits at least 45 seconds for the others. |
| `show` | a list of props (up to 4) | Shown while every place is taken by one who is there: the table of a game, the rope, the ball. Until then the players wait (`crew.wait`); when the last one comes they all start together and play for `time`, and when one leaves, the others go too. |
| `group` | a name | Spots of a group are used one at a time (the games of one room). |
| `path` | up to 6 `[x, y, climb]` | The way in from the street: through a doorway, along a floor, up a ladder (`climb` 1: it climbs to that point). To another spot it goes back along its path as far as the two share it (from room to room of a floor, straight across), then in along the other's. `via` `[x, y]` is short for the foot of a ladder: in there, then up to the spot's height. |
| `inside`, `back` | `true`, a sprite | It goes out of sight there for `time` (a door, a mine): `act` plays once before, `back` once after (dig in, pop out). A spot off the edge of the screen with `inside` is a way out of the world and back. |
| `carry` | a sprite | What it walks with from there to its next spot (a cart from the mine). |
| `say` | `s` sprites, `every` seconds | A speech bubble now and then while someone is there, picked from `s`. |
| `w` | 0 to 10 | How often it is chosen (default 1; 0 never). |
| `tag` | a name | The kind of spot (code, games, outdoors), for those who like it (`crew.members`). |
| `when` | below | Only at some hours or on some days. |
| `fx` | `s`, `kind`, `every`, `dx`, `dy` | Particles while someone is there: sprite `s`, `rise` (up, swaying), `float` (up and away, like smoke), `pop` (appears around and fades), `fall` (down, swaying: rain, snow, leaves) or `blow` (carried sideways and up, the way the wind or the character faces), one every `every` seconds, from `dx`, `dy` px off the anchor (`dx` mirrored with the character). |

An event: one at a time, each `every` `[min, max]` seconds (10 to 7200) after it was last over, when its `when` fits. For `time`
`[min, max]` seconds (5 to 900) its `props` fade in and its `drift` crosses the sky, and its `spot` (a spot as above, with its own
`show`) is open: `call` of the crew who are at a spot come to it, the nearest first, and more come as they are free; a spot whose
`time` is longer than the event's keeps them there until it is over. Then everything fades and they go back about their business.
Its drift comes in from the edge of the screen, and its props fade in and out over their `fade` (a rainbow slowly; under 1: at once).
`chance` (0 to 1, default 1) is how likely it comes each time it is due: a rare sighting has a small one, and one with 0 never comes by
itself. `then` is the index of the event that comes when it is over (when that one's `when` fits): a rainbow after a shower. `key`
(`red`, `green`, `yellow` or `blue`) starts it at once with that coloured key of the remote on Home, whatever its `when`, ending one
that is going on; the clock, the buttons and the apps fade away while it lasts, so it can use the whole sky. An event with a `title`
(up to 24 letters) is a show in the **Shows** menu, a button the top row of Home gets when the world has any: chosen there, it starts the
same way, for remotes without the coloured keys. A drift of an event can land on its way (`perch`, in the table above).

`when` is `{"h": [from, to], "d": ["MM-DD", "MM-DD"], "w": [weathers], "near": [feast, from, to]}`, any of them: from the hour `from`
up to `to` (24 is midnight; `[22, 7]` is the night, across midnight), from the first day to the last (`["12-20", "01-06"]` goes across
New Year), on a day of one of those weathers (`weather`), and from `from` days before or after a feast that moves from year to year up
to `to` (`["lunar", -2, 15]`: two days before the Lunar New Year to the Lantern Festival). The feasts are `lunar` (the Lunar New Year:
the day of the new moon from 21 January to 19 February in China), `easter` (Western Easter Sunday), `midautumn` (the Mid-Autumn Festival:
the 15th day of the moon that begins from 25 August to 23 September) and `thanksgiving` (the fourth Thursday of November). It is
checked every minute; a prop or a drift fades in or out over its `fade` seconds and is out of the page once it is gone, a little one of a
herd over 8.

At most 256 sprites, 40 spots, 160 props, 24 drifts, 8 herds and 32 events; numbers are clamped to their range, and a name that is not a
sprite is left out (and so is a prop, a drift or a herd without one). A theme that extends another keeps its world unless it has its
own `"world"` (`null` takes it away). `node tools/clawd-world` draws the Claude theme's backdrop and sprite sheet from code and writes
its `"world"` from the same layout, so the spots always line up with the picture: a way to make one.

### A terminal, or any screen of text

Tiles can be lines of text instead of icons: `tile.style` `text` shows only each app's name, with no background, the focused line in
the accent colour like inverse video, and `tile.marker` a few characters before the focused name (`> `). With `dock.show` off every
app is in the grid, and `grid.cols` 1 with a `grid.tileH` of about 44 lists them one under the other; the grid scrolls as usual.
`grid.prefix` puts a dim line just above the list (`$ ls apps/`), `clock.prefix` one above the time (`$ date`), `shelf.prefix` one
before the focused app's name (`$ open `) and `shelf.cursor` a blinking block after it. The Terminal theme is all of this with a
monospace typeface (`type.font` `mono`) and flat buttons.

### Motion

Beyond the focus animations, a theme can set the screen in motion, always with transforms only so that the TV's GPU keeps up:

- `effects.drift` lets the wallpaper drift: over about a minute (`effects.speed` sets the pace) it zooms in a little and glides, then
  back, as a phone's lock screen does.
- `effects.cycles` puts light cycles on the floor of the picture (`app/src/js/scene.js`): the floor is a perspective plane from
  `effects.cyclesHorizon` down to the bottom edge, and the riders race across it in the accent colour or `effects.cyclesColor`,
  turning at right angles and leaving a wall of light along every stretch they rode, smaller and slower the further away, until they
  derezz and their walls fade.
- `effects.scene` `lightcity` adds the rest of a world of light: Recognizers (the big ships) drifting across the sky, the portal beam
  at `effects.beamX` pulsing up from the horizon, light raining down and pulses of light sweeping the floor to the horizon.
- A mascot (above) walks about, and a world (above) goes on behind Home; `shelf.cursor` blinks after the app's name.

`effects.speed` 0 stops all of it.

A theme file holds values only. The service checks every value against the table and clamps numbers to their range; there is no CSS
and no script, and a wallpaper, a mascot or a world's sprite sheet is accepted only as a plain file name from the theme's folder that is
also a real image of the right type. Anything else is ignored. The launcher draws the wallpaper once and nothing blurs or filters it,
because the TV's GPU is weak.

From a shell on the TV:

```sh
curl localhost:8765/api/theme/list
curl -X POST localhost:8765/api/theme/set -d '{"id":"midnight","accent":"#ff8a3d"}'   # downloads the theme if it is not on the TV
curl -X POST localhost:8765/api/theme/revert
```
