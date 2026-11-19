# Vice Cover Studio — make.fun gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/whyuardi/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/whyuardi/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your photos and a caption into GTA-style
cover art — the multi-panel poster look with bold caption lettering and a
Vice City sunset / neon colour grade — exported as a PNG to share.

Everything runs in the browser from static files. Photos never leave the
machine. All art is original code (gradients, a code-drawn synthwave sun,
skyline and palm silhouettes); no Rockstar logo, artwork, character or
font is used anywhere.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `app/` with any static file server and open `index.html`.
Node 22+, no dependencies, no network.

## What it does

- **Multi-panel covers** — Hero+2, 2×2 Grid and 3 Columns layouts with
  white poster borders over a sunset sky backdrop.
- **Any photo** — upload one or several photos from your machine, assign
  them to panels, crop with zoom + X/Y pan sliders per panel, or fill all
  panels with one photo. Two built-in sample photos ship with the app.
- **Caption** — live caption + sub-caption editing, size slider, top /
  bottom band position, neon outline and slanted-type toggles.
- **Grades** — Sunset, Neon Night and Vice Pastel colour grades.
- **Export** — one click renders the cover at full size and downloads a
  PNG in 1080×1080, 1080×1350 or 1920×1080.

## Files

- `main.ts` — entrypoint: copies `app/` and `screenshots/` to the output
  directory and writes `dossier.json` with `vendor/makefun-app.ts`.
- `app/` — the static app: `index.html`, `style.css`, `src/cover.js`
  (cover rendering + export), `src/main.js` (editor), `src/shots.js`
  (`?shot=` deterministic renders), `samples/` (two built-in photos).
- `screenshots/` — 4 screenshots: `1-cover.jpg` (true exported PNG,
  1080×1080, "VICE HEIST"), `2-editor.jpg` (editor with a photo loaded),
  `3-cover-wide.jpg` (1920×1080 export), `4-cover-tall.jpg` (1080×1350
  export).
- `vendor/makefun-app.ts` — kit copy, byte for byte, do not edit.

## Validation (local, 19 Nov 2026)

- `MAKEFUN_OUTPUT_DIR=out node main.ts` runs clean twice with
  byte-identical output; `out/dossier.json` 1,190,102 bytes (≤1.5 MiB cap).
- Export verified in headless Chromium: `__exportCover()` produces a real
  1080×1080 RGBA PNG.
- Offline: 36 requests across 5 page loads, 0 external; no `http://` /
  `https://` references under `app/`.
- `vendor/makefun-app.ts` sha256 matches the kit starter copy.
- Screenshots: 4 JPEGs, each ≤256 KiB, long side ≤1280, short side ≥480.
