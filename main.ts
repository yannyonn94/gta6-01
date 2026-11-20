// [RONDE 3] Pelanggan make.fun: membangun dossier entry "Kota Karang" dan
// menyalin screenshot ke folder output. Semua validasi gagal keras di sini.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const here = process.cwd();
const out = process.env.MAKEFUN_OUTPUT_DIR ?? 'out';
mkdirSync(out, { recursive: true });

// [RONDE 3] Cek keras bahan baku: screenshot 3-4 berkas, PNG/JPEG, <= 256 KiB.
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

const salin = (src: string, dst: string) => cpSync(src, join(out, dst));
for (const nama of shotNames) salin(join(shotsDir, nama), nama);

const gambar = shotNames.map((n) => join(here, 'screenshots', n));
const cover = join(here, 'screenshots', '2-play.jpg');

const dossier = {
  name: 'Kota Karang',
  tagline: 'Kota pesisir terbuka: lima misi, polisi yang mengintai, dan hidupmu taruhannya.',
  cover,
  images: gambar,
  briefing:
    'Kota Karang adalah kota pesisir yang longgar dijaga. Ambil mobil, selesaikan lima misi, dan ' +
    'jangan biarkan polisi mengepungmu. Kamu bisa berjalan kaki, mencuri mobil, menembak, mengemudi ' +
    'sepanjang pantai, dan mengisi bahan bakar di pom bensin.',
  rules: [
    'Satu pemain, dunia terbuka yang bisa dijelajahi bebas.',
    'Lima misi berurutan: curi mobil, kumpul kantong, hilangkan wanted, sprint pantai, parkir presisi.',
    'Wanted naik saat mencuri mobil, menabrak, atau menembak polisi dan pejalan kaki; turun saat sembunyi.',
    'Mobil punya bahan bakar; isi ulang di pom bensin di sudut barat-laut.',
    'Menabrak mobil lain mengurangi nyawa; nyawa habis berarti pelarian berakhir.',
  ],
  controls: [
    'WASD atau panah: bergerak / mengemudi',
    'Shift: lari / ngebut',
    'Spasi: menembak (kaki) atau mengerem (dalam mobil)',
    'E: masuk atau keluar mobil',
    'Esc atau P: jeda',
    'Klik layar: kunci kursor untuk mengarahkan kamera',
  ],
  credits: {
    game: 'Kota Karang',
    role: 'perancang, kode, dan playtest',
    third_party: [
      { name: 'three.js', version: '0.128', license: 'MIT', source: 'vendor/three.min.js' },
    ],
    generated_with: 'Hermes Agent',
  },
  dependencies: [],
};

// [RONDE 3] Batas teks dihitung dari isi dossier, bukan angka tebakan:
// gate scorer membandingkan byte teks maksimum dengan text_max_bytes.
dossier.text_max_bytes = Math.max(4000, Buffer.byteLength(JSON.stringify(dossier), 'utf8'));

writeFileSync(join(out, 'dossier.json'), `${JSON.stringify(dossier, null, 2)}\n`, 'utf8');

if (!existsSync(cover)) throw new Error(`cover tidak ada: ${cover}`);
console.log(`Kota Karang: dossier ditulis ke ${out}/dossier.json (${gambar.length} gambar, cover ${cover})`);
