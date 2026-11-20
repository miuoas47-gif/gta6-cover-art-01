# gta6-cover-art-01

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/miuoas47-gif/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/miuoas47-gif/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Vice City Nights** — a GTA-style cover art maker. Drop in your own photo, pick a multi-panel poster layout, write a bold caption, choose a sunset or neon colour grade, and export a share-ready PNG in 1080×1080, 1080×1350, or 1920×1080.

## What it does

- **Multi-panel poster covers** — 1-photo full-bleed, 2-panel split, 3-panel collage, or 4-panel grid, with white poster seams.
- **Any photo** — upload a photo per panel, or fill every panel with one photo; each panel has its own zoom and x/y crop sliders. Two free sample photos (Boulevard, Pier) are built in, so one click makes a cover.
- **Bold lettering** — caption in Archivo Black (SIL Open Font License, bundled under `app/fonts/`), with outline, glow, size and top/bottom position controls, plus an editable subtitle.
- **Colour grades** — Sunset, Neon, Noir, and Vice, each tinting every panel and the caption band.
- **Fast and easy** — live preview while you edit; one click exports a full-size PNG. No upload, no account, no network: everything runs offline from the static files under `app/`.

## Run it

Serve `app/` with any static server, or use the one in this repo:

```sh
node serve.ts
# open http://localhost:8080
```

Pick a layout, load a sample or your own photo, edit the caption, choose a post size, and press **Export PNG**.

## Original work

All art in this entry is original: the layout, lettering, grades, and code were made for this bounty. No Rockstar Games logo, wordmark, official artwork, character, or font is used. The display font is Archivo Black under the SIL Open Font License (see `app/fonts/OFL.txt`); the sample photos were made with an image model for make.fun and are free to use.

Made for the [Make GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) on [make.fun](https://make.fun/?ref=6gvkzysc).
