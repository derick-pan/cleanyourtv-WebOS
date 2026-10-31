# Third-party components

CleanYourTV for LG webOS is MIT licensed (see `LICENSE`). The package also contains the following unmodified
third-party files. They are separate programs that our service starts; none of our code is linked with them.

## inputhook (Input key)

The files in `third-party/inputhook/` (installed to `/media/developer/cleanyourtv/inputhook/` on the TV) are taken
unchanged from the release `org.webosbrew.inputhook` 1.5.1 of
[Simon34545/lginputhook](https://github.com/Simon34545/lginputhook) (package SHA-256
`604d556a932ec60cee1f041b144aa03d3b49043212568d4cc5bd5854c7ac88ec`). They inject a small hook into LG's input
process so a remote button can run a command; we use it for the Input button.

| File | What it is | License | Source |
|---|---|---|---|
| `ezinject` | process injector | Zlib (`LICENSE-ezinject-Zlib.txt`) | [smx-smx/ezinject](https://github.com/smx-smx/ezinject) |
| `libinputhookpp.so` | the hook library (it statically contains frida-gum) | GPL-3.0 (`LICENSE-inputhookpp-GPL-3.0.txt`) | [sundermann/inputhookpp](https://github.com/sundermann/inputhookpp) |
| lginputhook (the app is not shipped; its key ids and config format are used) | button remapper | BSD-3-Clause (`LICENSE-lginputhook-BSD-3-Clause.txt`) | [Simon34545/lginputhook](https://github.com/Simon34545/lginputhook) |

File hashes are in `third-party/inputhook/SHA256SUMS`.

**GPL-3.0 notice for `libinputhookpp.so`.** The file is distributed here unmodified, in the form it has in the
inputhook 1.5.1 release. Its corresponding source code is the `inputhookpp` project linked above (with frida-gum, whose
license is in the frida-gum project). Anyone who received this package can ask for that source from this repository's
issue tracker, and we will provide it. The GPL-3.0 text is in `LICENSE-inputhookpp-GPL-3.0.txt`. This applies to
that library only, not to the rest of this project.

## Voice (optional download)

Nothing below is shipped in the package; the manager app downloads it on request (see the Voice page of the documentation) and
`voice/cytv-asr` (MIT, source in `voice/asr.c`) is built against the Moonshine C header.

| Component | License | Source |
|---|---|---|
| Moonshine speech engine and models (`moonshine-voice` 0.1.5) | MIT | [moonshine-ai/moonshine](https://github.com/moonshine-ai/moonshine) |
| ONNX Runtime (inside the `moonshine-voice` package) | MIT | [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime) |
| 64-bit GNU C library, libstdc++, libgcc (from `ubuntu-base` 22.04.5) | LGPL-2.1 / GPL-3.0 with runtime library exception | Ubuntu source packages `glibc` and `gcc-12` |

## qrcode-generator (QR code for sharing the log)

`third-party/qrcode-generator/qrcode.js` is [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 by
Kazuhiko Arase, unmodified (npm package `qrcode-generator@1.4.4`, SHA-256 of the file
`18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780`), licensed under the MIT license (the notice is in
the file header). The manager app loads it to draw the QR code.

## Clawd World (the Claude theme)

The Claude theme's pictures and its world (`themes/claude/`, drawn by `tools/clawd-world/`) redraw parts of three MIT-licensed Clawd
projects. Nothing of them is shipped as it was and none of their code runs: the generator was written for this project after reading
theirs, and draws everything pixel by pixel.

| Project | What Clawd World takes from it | Source |
|---|---|---|
| clawd-sidekick by Tunai | The Clawd body and its pose system (eyes, arms, a lift, legs), the beanies and hats, the house and its rooms, colours and furniture, the errands and games (pong, jump rope, the block tower, volleyball), the pals (cat, owl, crab), the sparrow, the deer and the saucer, from `hooks/scene.ts`, `hooks/pixels.ts` and `hooks/themes.ts` | [Tunai-0511/clawd-sidekick](https://github.com/Tunai-0511/clawd-sidekick) at `2c1c19e` |
| Clawd Tank by Marcio Granzotto Rodrigues | The jobs a Clawd does: juggling, conducting, building, hammering, the pickaxe, sweeping, debugging, dancing, the eureka, the dizzy spell, the wizard and the coffee, as ideas redrawn on the same body (not rendered from its SVGs) | [marciogranzotto/clawd-tank](https://github.com/marciogranzotto/clawd-tank) at `ee5c079` |
| claude-clawd by Kien Hoang Trung | The meadow of little Clawds (its subagents), the speech bubbles and the moods | [kreddevils18/claude-clawd](https://github.com/kreddevils18/claude-clawd) at `8f3701a` |

Clawd, the character, is Anthropic's Claude Code mascot; the theme is a fan work, not made or endorsed by Anthropic. The three projects
use the same MIT license:

```
Copyright (c) 2026 Tunai
Copyright (c) 2026 Marcio Granzotto Rodrigues
Copyright (c) 2026 Kien Hoang Trung

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Design

The home-screen design follows the Android TV project [CleanYourTV](https://github.com/Gathin23/cleanyourtv) (MIT).
No code from it is used.
