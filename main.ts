// Kota Karang — main.ts: menyerahkan permainan ke penilai.
// Menyalin game/ dan screenshots/ dari samping berkas ini (bukan dari
// direktori kerja pemanggil) ke direktori keluaran, lalu menulis
// dossier.json persis seperti yang ditulis buildDossier dari kit.
// Di luar wadah penilai, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Batas penilai (reference/gate.json): hanya text_max_bytes membentuk isi;
// yang lain menolak entri yang memang akan ditolak penilai (lebih dari 4
// tangkapan layar atau satu di atas 256 KiB; game/ lebih dari 993 berkas
// atau 48 MiB; jalur di bawah game/ lebih dari 1000 byte).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('Kota Karang diserahkan ke ' + out + ' (game/, screenshots/, dossier.json).');
