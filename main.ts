// Vice City Nights — a GTA-style cover art maker for gta6-cover-art-01.
// Node 22, standard library only. This program hands the entry in: it copies
// app/ and screenshots/ from beside this file into the output directory and
// writes /output/dossier.json with the vendored make.fun library, so the judge
// can read the app's source and screenshots. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The app itself is plain static files under app/ (index.html plus ES modules,
// a bundled OFL font and two free sample photos) and runs offline in desktop
// Chrome with no network request.

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The gate's caps: text_max_bytes is the only one that shapes the dossier's
// bytes; the rest refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of
// app files in all, or a path under app/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// Self-report, so a run's result is visible without opening the output: the
// dossier's byte size and the screenshots handed in beside it.
const dossierBytes = statSync(join(out, 'dossier.json')).size;
const shotNames = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8')).map((s) => s.name);
console.log(`wrote ${out} (dossier.json ${dossierBytes} bytes, screenshots: ${shotNames.join(', ')})`);
