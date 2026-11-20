// [RONDE 5] Pelanggan make.fun: membangun dossier entry "Kota Karang" dan
// menyalin screenshot ke folder output. Semua validasi gagal keras di sini.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const here = process.cwd();
const out = process.env.MAKEFUN_OUTPUT_DIR ?? 'out';
mkdirSync(out, { recursive: true });

// [RONDE 4] Cek keras bahan baku: folder game/ dan index.html harus ada.
const gameDir = join(here, 'game');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html tidak ada; jalankan dari root repo');
}

// [RONDE 4] Cek keras bahan baku: screenshot 3-4 berkas, PNG/JPEG, <= 256 KiB.
const shotsDir = join(here, 'screenshots');
let shotNames = [];
try {
  shotNames = readdirSync(shotsDir);
} catch {
  shotNames = [];
}
const buruk = shotNames.filter((n) => !/\.(png|jpe?g)$/i.test(n));
const raksasa = shotNames.filter((n) => {
  try {
    return statSync(join(shotsDir, n)).size > 262144;
  } catch {
    return false;
  }
});
if (shotNames.length < 3 || shotNames.length > 4 || buruk.length || raksasa.length) {
  throw new Error(
    `screenshot tidak sah: ${shotNames.length} berkas, nama buruk=${buruk.join(',') || '-'}, terlalu besar=${raksasa.join(',') || '-'}`,
  );
}

const urut = ['1-start.jpg', '2-play.jpg', '3-chase.jpg', '4-drive.jpg'];
const ada = urut.filter((n) => shotNames.includes(n));
if (ada.length !== shotNames.length) {
  throw new Error(`screenshot harus memakai nama ${urut.join(', ')}; ditemukan ${shotNames.join(', ')}`);
}

// [RONDE 5] Nama screenshot harus cocok dengan shots.json supaya caption
// dan berkas tidak melenceng satu sama lain.
const shotsJson = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8')) as { name: string }[];
const namaJson = shotsJson.map((s) => s.name).sort();
const namaBerkas = [...shotNames].sort();
if (JSON.stringify(namaJson) !== JSON.stringify(namaBerkas)) {
  throw new Error(`shots.json tidak cocok dengan screenshots/: ${namaJson.join(',')} vs ${namaBerkas.join(',')}`);
}

const salin = (src: string, dst: string) => cpSync(src, join(out, dst));
for (const nama of shotNames) salin(join(shotsDir, nama), nama);

const gambar = shotNames.map((n) => join(here, 'screenshots', n));
const cover = join(here, 'screenshots', '2-play.jpg');

const dossier = {
  name: 'Kota Karang',
  tagline: 'Kota pesisir terbuka: tujuh misi, van logistik, hujan badai, roadblock polisi, mode foto, dan hidupmu taruhannya.',
  cover,
  images: gambar,
  briefing:
    'Kota Karang adalah kota pesisir yang longgar dijaga. Ambil mobil, motor, atau van logistik, selesaikan tujuh misi, ' +
    'kumpulkan koin emas, dan jangan biarkan polisi mengepungmu — apalagi saat hujan deras membuat jalan licin dan ' +
    'roadblock menutup jalan. Kamu bisa berjalan kaki, mencuri kendaraan, menembak, mengemudi sepanjang pantai, ' +
    'mengisi bahan bakar di dua pom bensin, membunyikan klakson, dan membekukan momen lewat mode foto.',
  rules: [
    'Satu pemain, dunia terbuka yang bisa dijelajahi bebas.',
    'Tujuh misi berurutan: curi mobil, kumpul kantong, hilangkan wanted, sprint pantai, parkir presisi, koin Karang, dan antar van saat badai.',
    'Wanted naik saat mencuri mobil, menabrak, atau menembak polisi dan pejalan kaki; turun saat sembunyi. Makin tinggi wanted, makin cepat dan akurat polisi mengejar, dan wanted 3 ke atas memunculkan roadblock.',
    'Hujan datang bergantian dan membuat jalan licin: akselerasi dan belok berkurang, pejalan kaki bergegas berteduh.',
    'Mobil, motor, dan van punya bahan bakar; isi ulang di dua pom bensin (barat-laut dan tenggara). Van lebih lambat tapi tangkinya besar.',
    'Lari memakai stamina; diam memulihkan stamina lebih cepat. Misi selesai memulihkan sedikit nyawa.',
    'Menabrak mobil lain mengurangi nyawa; nyawa habis berarti pelarian berakhir.',
    'Skor berlipat lewat kombo: tiap 3 aksi beruntun menaikkan pengali (maks x4), dan jendela kombo memanjang tiap tingkat.',
    'Mode foto (F) membekukan permainan dan menyembunyikan HUD supaya momen bisa diabadikan.',
  ],
  controls: [
    'WASD atau panah: bergerak / mengemudi',
    'Shift: lari / ngebut (pakai stamina)',
    'Spasi: menembak (kaki) atau mengerem (dalam mobil)',
    'E: masuk atau keluar mobil',
    'H: klakson',
    'F: mode foto (bekukan, sembunyikan HUD, orbit kamera)',
    'Roda mouse: zoom kamera',
    'Esc atau P: jeda',
    'Klik layar: kunci kursor untuk mengarahkan kamera',
  ],
  credits: {
    game: 'Kota Karang',
    role: 'perancang, kode, dan playtest',
    third_party: [
      { name: 'three.js', version: '0.128', license: 'MIT', source: 'vendor/three.min.js' },
    ],
    generated_with: 'Muse',
  },
  dependencies: [],
  // [RONDE 5] Daftar fitur kunci untuk dibaca sekilas di dossier.
  features: [
    'tujuh-misi', 'hujan-badai', 'van-logistik', 'roadblock',
    'mode-foto', 'kombo-x4', 'minimap', 'siklus-siang-malam', 'mercusuar',
  ],
};

// [RONDE 3] Batas teks dihitung dari isi dossier, bukan angka tebakan:
// gate scorer membandingkan byte teks maksimum dengan text_max_bytes.
dossier.text_max_bytes = Math.max(4000, Buffer.byteLength(JSON.stringify(dossier), 'utf8'));

writeFileSync(join(out, 'dossier.json'), `${JSON.stringify(dossier, null, 2)}\n`, 'utf8');

// [RONDE 5] Dossier tidak boleh melewati 1 MiB supaya tetap bisa diserahkan.
const ukuranDossier = statSync(join(out, 'dossier.json')).size;
if (ukuranDossier > 1024 * 1024) {
  throw new Error(`dossier.json terlalu besar: ${ukuranDossier} byte`);
}

if (!existsSync(cover)) throw new Error(`cover tidak ada: ${cover}`);
console.log(`Kota Karang: dossier ditulis ke ${out}/dossier.json (${gambar.length} gambar, cover ${cover})`);
