# Themes

The themes of CleanYourTV. A theme changes how the home screen looks: colours, the position and size of the clock, buttons, app name,
dock and grid, text, effects and a wallpaper. In the manager app, **Theme** lists them with these screenshots; the TV reads this folder
from GitHub (the `main` branch) and downloads a theme when you choose it. A new theme is available to every TV as soon as it is merged,
without a release.

[![Classic, Midnight, Pixel and Bloom](../docs/screenshots/themes-readme.jpg)](../docs/screenshots/themes-readme.jpg)

| File | What it is |
|---|---|
| `index.json` | The list the TV downloads. Generated: `node tools/theme-index.js`. |
| `<id>/theme.json` | The theme: colours, positions, sizes, effects. Every key is optional. |
| `<id>/preview.jpg` | The screenshot shown in the manager. |
| `<id>/<wallpaper>` | The wallpaper, if the theme uses one. |
| `<id>/<typeface>` | A typeface (`type.fontFile`), if the theme uses one, with its licence file. |
| `<id>/<mascot>` | The mascot's picture (`mascot.file`), if the theme has one: a strip of frames that the launcher walks along the bottom. |
| `<id>/<sprite sheet>` | A world's sprite sheet (`world.file`), if the theme has a world: every frame of its characters, props and particles. |

Every setting, with its range and default, is in the [Themes page of the documentation](https://lasharor.github.io/cleanyourtv-WebOS/themes/).

## Make your own

A step-by-step guide, including how to make one with an AI assistant, is on the [Themes page](https://lasharor.github.io/cleanyourtv-WebOS/themes/#making-a-theme-with-an-ai-assistant). The short version:

1. Copy a folder, for example `classic/`, to `<id>/` (lower-case letters, digits and `-`).
2. Change only what you want to change in `theme.json`. A missing value keeps the default, or the value of the theme named in `"extends"`.
3. Put a screenshot of the result in `preview.jpg` (16:9, about 800 px wide, at most 600 KB). `node tools/theme-preview.mjs <id> --write` makes it.
4. If it uses a wallpaper, put a `.jpg`, `.png` or `.webp` (at most 1.5 MB, 1920 x 1080) in the folder and name it in `effects.wallpaper`.
5. Run `node tools/theme-index.js`, then `node tools/test.js theme`.
6. Open a pull request. A wallpaper or typeface must be your own work or under a licence that allows redistribution; say which,
   and put a typeface's licence file in the folder.

## The themes

### Classic

The original look: near-black, white focus, ten columns.

[![Classic](classic/preview.jpg)](classic/preview.jpg)

Folder: [`classic/`](classic/)

### Bloom

A flower wallpaper with the dock in a glass panel at the bottom. Down moves the dock up and the apps appear below it, centred.

[![Bloom](bloom/preview.jpg)](bloom/preview.jpg)

Folder: [`bloom/`](bloom/)

### Lock Screen

A phone-style lock screen: a greeting and a big clock top left, and a small, translucent dock low in the corner over a calm blue landscape, so the picture fills the screen. Down moves the dock up and shows all apps below it. Turn Wallpapers on in Customise for your own photos behind it. It has slots for cards (Customise > Cards): the greeting is one.

[![Lock Screen](lockscreen/preview.jpg)](lockscreen/preview.jpg)

Folder: [`lockscreen/`](lockscreen/)

### Horizon

A row of seven square apps along the bottom of a dusk landscape, the clock on the left and the buttons on the right at the top. Down moves the row up and shows all apps below it.

[![Horizon](horizon/preview.jpg)](horizon/preview.jpg)

Folder: [`horizon/`](horizon/)

### Pixel

Pixel art: a blocky typeface, square tiles and buttons, a yellow focus box and a sunset over a lake drawn in big pixels. Moves without animation, like an old console.

The typeface is Pixelify Sans (weight 500, Latin, unmodified), in the folder as `pixel.woff2` under the SIL Open Font License 1.1
(`OFL.txt`); the wallpaper was drawn for this theme.

[![Pixel](pixel/preview.jpg)](pixel/preview.jpg)

Folder: [`pixel/`](pixel/)

### Compact

Twelve columns of smaller tiles: more apps on screen.

[![Compact](compact/preview.jpg)](compact/preview.jpg)

Folder: [`compact/`](compact/)

### Large print

Eight columns of big tiles and bigger text, easier to read from the sofa.

[![Large print](large/preview.jpg)](large/preview.jpg)

Folder: [`large/`](large/)

### Midnight

Deep blue with a soft wallpaper and a blue focus.

[![Midnight](midnight/preview.jpg)](midnight/preview.jpg)

Folder: [`midnight/`](midnight/)

### OLED black

Pure black, no ambient glow: unlit pixels stay off.

[![OLED black](oled/preview.jpg)](oled/preview.jpg)

Folder: [`oled/`](oled/)

### Still

No animation and a quiet glow, for anyone who prefers a calm screen.

[![Still](still/preview.jpg)](still/preview.jpg)

Folder: [`still/`](still/)

### Warm

Brown and amber with the glow in the accent colour.

[![Warm](warm/preview.jpg)](warm/preview.jpg)

Folder: [`warm/`](warm/)

### Cupertino

A living-room lock screen in the manner of Apple's TV, after the Night look of [couch-tv](https://github.com/seagey/couch-tv): a huge,
thin, translucent clock with a light rim in the sky over a night lake, the date above it, one round button top right, and a smoked-glass
dock of square icons along the bottom with a white ring on the focused one. Down moves the dock up and shows all apps below it; the
clock fades out meanwhile. The scene, `night.jpg`, is couch-tv's `scene-night.jpg`, made for couch-tv with an image model from text only
(not a real place) and released for any use (its `backgrounds/CREDITS.md`); it drifts slowly, as theirs does (`effects.drift`). The
clock's typeface is Antonio (weight 300, Latin, unmodified), `antonio.woff2`, under the SIL Open Font License 1.1 (`OFL.txt`); the rest
of the text keeps the TV's font.

[![Cupertino](cupertino/preview.jpg)](cupertino/preview.jpg)

Folder: [`cupertino/`](cupertino/)

### The Grid

The world of the Grid, in the spirit of the 2010 light-cycle film, going on behind Home: light cycles race the floor in cyan and
orange, near and far, turning at right angles and leaving walls of light along every stretch until they derezz and the walls fade
(`effects.cycles`); Recognizers, the big ships, drift across the sky; the portal beam pulses up from the city into the clouds; light
rains down and pulses of light sweep the floor (`effects.scene` `lightcity`). The backdrop, drawn for this theme, is the city: a
monumental dark structure edged in orange with a bright gate at its foot, towers with light strips tapering into the haze, clouds lit
from below and a wet floor that mirrors it all. Six smoked-glass tiles edged in light stand on the floor, the focused one with a thin
light-blue ring; the buttons are outlined boxes and the glow is cyan. Down moves the row up and shows all apps below it.

### Terminal

Just a terminal, no launcher to see: green phosphor text on black in a monospace typeface. `$ date` prints the time and the date,
`$ open ` is followed by the focused app's name and a blinking block cursor, and under `$ ls apps/` every app is a line of its own,
the focused one in inverse video with a `> ` marker (`tile.style` text, `dock.show` off, one column). The top buttons are plain words,
the menus have square rows, and behind it all are scanlines, faint character columns and the soft curve of a tube, drawn for this
theme (`terminal.png`).

[![The Grid](the-grid/preview.jpg)](the-grid/preview.jpg)

Folder: [`the-grid/`](the-grid/)

### Claude

Clawd World: a pixel village at dusk where the little Clawds of Claude Code live, going on under the apps (a world, `world` in
`theme.json`; see the [Themes page](https://lasharor.github.io/cleanyourtv-WebOS/themes/#a-world)). The greeting, the clock and the
buttons sit in a night sky with a crescent moon, the focused app's name is big above a row of six apps, and the sun is going down
behind the hills. Eight Clawds walk the village street from spot to spot and get on with things: hammering at the anvil of the Code
Forge (`</>` over its door), swinging a pickaxe at the Token Mine or going into it past a cart heaped with glowing tokens, typing at a
laptop and reading in their cutaway house, playing a game in front of the TV two at a time, napping upstairs (with z's), casting spells
from the wizard's tower in a pointed hat, brewing potions in goggles at the lab door, fishing off the pier, conducting a choir of little
ones on the stage, dancing in the meadow with hearts between them, roasting marshmallows by the campfire, watering the flowers, and
burrowing into the sand to pop up again later (after Clawd Tank), or wandering off the edge of the world and back. They climb the
ladders to the rooms upstairs and to the tower's balcony, hop when you move the focus and wave when you come back to Home. Around them
the fire crackles and throws embers, smoke rises from the chimneys, a fish jumps, a Clawd swims in the pond, fireflies blink, stars
twinkle, clouds, birds and a balloon drift past behind the roofs, and now and then a star shoots across the sky. Down opens all the apps
over the village, which stands still under them.

It is inspired by the Clawd projects people have made (Clawd Tank's aquarium, the house of clawd-sidekick, the meadow of claude-clawd,
ClaudeVille's Code Forge, Token Mine and Research Lab, the states that Clawd Tank shows: reading, typing, building, the wizard and the
conductor) but takes no code or art from them. Everything was drawn for this theme pixel by pixel by `tools/clawd-world.js`, which
writes `world.png` (the backdrop, 384 x 216 art pixels at five times), `clawd.png` (the sprite sheet) and the `"world"` of `theme.json`
from the same layout. The character is Clawd, the mascot in Claude Code's terminal (a block with two eyes, little arms and four legs;
Anthropic's character), redrawn in pixels for this theme.

[![Claude](claude/preview.jpg)](claude/preview.jpg)

Folder: [`claude/`](claude/)
