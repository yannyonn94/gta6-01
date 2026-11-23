// main.ts — entrypoint Kota Karang.
// Menyalin screenshots/ ke folder output dan menulis dossier.json.
// Dijalankan dari root repo:  MAKEFUN_OUTPUT_DIR=out node main.ts
import * as fs from "node:fs";
import * as path from "node:path";

const OUTPUT_DIR: string = process.env.MAKEFUN_OUTPUT_DIR || "out";
const EXPECTED_SHOTS: string[] = ["1-start.jpg", "2-play.jpg", "3-chase.jpg", "4-drive.jpg"];
const MAX_SHOT_BYTES: number = 256 * 1024;
const MAX_DOSSIER_BYTES: number = 1024 * 1024;

function fail(message: string): never {
  console.error("Kota Karang main.ts gagal: " + message);
  process.exit(1);
}

function isImageFile(name: string): boolean {
  const lower: string = name.toLowerCase();
  return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg");
}

function main(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const indexPath: string = path.join("game", "index.html");
  if (!fs.existsSync(indexPath)) {
    fail("game/index.html tidak ditemukan di root repo.");
  }

  // Validasi screenshots/
  const shotDir: string = "screenshots";
  if (!fs.existsSync(shotDir) || !fs.statSync(shotDir).isDirectory()) {
    fail("folder screenshots/ tidak ditemukan.");
  }
  const shotFiles: string[] = fs.readdirSync(shotDir).filter((f: string): boolean => {
    return fs.statSync(path.join(shotDir, f)).isFile();
  });
  if (shotFiles.length < 3 || shotFiles.length > 4) {
    fail("screenshots/ harus berisi 3 atau 4 file, ditemukan " + shotFiles.length + ".");
  }
  const sortedShots: string[] = shotFiles.slice().sort();
  const sortedExpected: string[] = EXPECTED_SHOTS.slice().sort();
  if (sortedShots.length !== sortedExpected.length) {
    fail("nama screenshot tidak sesuai: " + sortedShots.join(", "));
  }
  for (let i: number = 0; i < sortedShots.length; i++) {
    if (sortedShots[i] !== sortedExpected[i]) {
      fail("nama screenshot tidak sesuai: " + sortedShots.join(", ") + " (harus " + sortedExpected.join(", ") + ").");
    }
  }
  for (const name of sortedShots) {
    if (!isImageFile(name)) {
      fail("screenshot " + name + " bukan PNG atau JPEG.");
    }
    const size: number = fs.statSync(path.join(shotDir, name)).size;
    if (size > MAX_SHOT_BYTES) {
      fail("screenshot " + name + " berukuran " + size + " byte, melebihi 256 KiB.");
    }
  }

  // Validasi shots.json mencantumkan nama file yang sama persis
  const shotsRaw: string = fs.readFileSync("shots.json", "utf8");
  let shots: Array<{ file: string; caption: string }>;
  try {
    shots = JSON.parse(shotsRaw) as Array<{ file: string; caption: string }>;
  } catch {
    fail("shots.json bukan JSON yang valid.");
  }
  const listed: string[] = shots.map((s: { file: string }): string => s.file).sort();
  if (listed.length !== sortedExpected.length) {
    fail("shots.json harus mencantumkan " + sortedExpected.length + " file.");
  }
  for (let i: number = 0; i < listed.length; i++) {
    if (listed[i] !== sortedExpected[i]) {
      fail("shots.json tidak cocok dengan screenshots/: " + listed.join(", "));
    }
  }

  // Salin screenshot ke folder output
  for (const name of sortedShots) {
    fs.copyFileSync(path.join(shotDir, name), path.join(OUTPUT_DIR, name));
  }

  const dossier: Record<string, unknown> = {
    game: "Kota Karang",
    tagline: "Dunia terbuka pesisir: curi mobil, kabur dari polisi, dan selesaikan 7 misi di pulau 10x10 blok.",
    cover: "2-play.jpg",
    images: sortedShots,
    captions: shots.map((s: { caption: string }): string => s.caption),
    briefing: "Kota Karang adalah game aksi dunia terbuka 3D berbahasa Indonesia yang dibangun dengan three.js. Pemain menjelajahi kota pulau seluas 10 blok kali 10 blok dengan pantai, laut, mercusuar berlampu putar, dermaga, pasar, dua SPBU, garasi, dan gudang pesisir barat. Ada 7 misi berurutan (mencuri mobil biru, mengumpulkan kantong, menghilang dari kejaran, sprint pantai 420 meter, parkir presisi, mengumpulkan 5 koin emas, dan mengantar van logistik dalam badai), 3 jenis kendaraan (mobil, motor, van), sistem buronan 0 sampai 5 bintang dengan polisi pengejar dan roadblock, pejalan kaki termasuk turis yang berteduh saat hujan, siklus siang-malam, cuaca hujan yang membuat jalan licin, bahan bakar dan SPBU, stamina, kombo skor sampai x4, minimap bundar, mode foto, dan suara sintetis WebAudio.",
    rules: [
      "Selesaikan 7 misi berurutan untuk menaklukkan Kota Karang.",
      "Buronan naik saat mencuri kendaraan, menabrak, atau menembak; sembunyi sampai bintang turun.",
      "Kendaraan memakai bensin; isi ulang di SPBU barat laut atau tenggara.",
      "Kesehatan habis berarti perjalanan berakhir; selesaikan misi untuk memulihkan sebagian kesehatan.",
      "Hujan membuat jalan licin: akselerasi dan cengkeraman berkurang.",
      "Parkir presisi harus rapi di dalam kotak kuning dengan kecepatan rendah.",
      "Misi Badai Karang harus diantar dengan van logistik dalam hujan deras melewati roadblock."
    ],
    controls: [
      "WASD atau panah: jalan dan mengemudi",
      "Shift: lari atau ngebut (memakai stamina)",
      "Spasi: tembak saat jalan kaki, rem saat berkendara",
      "E: naik atau turun kendaraan",
      "H: klakson",
      "F: mode foto (bekukan permainan, putar kamera dengan mouse)",
      "M: bisukan suara",
      "R: reset kamera",
      "Roda mouse: zoom kamera",
      "Esc atau P: jeda",
      "Klik layar: kunci pointer untuk mengarahkan kamera"
    ],
    credits: [
      "Kota Karang — game orisinal yang ditulis dan dibangun oleh agen pembangun untuk bounty make.fun gta6-01.",
      "three.js versi 0.128 (MIT License) dipakai sebagai pustaka rendering 3D dan disertakan di game/vendor/three.min.js."
    ],
    dependencies: [],
    features: [
      "Kota pulau 10x10 blok dengan seed acak yang dapat direproduksi",
      "7 misi berurutan dengan tujuan, penanda, timer, dan hadiah",
      "3 jenis kendaraan: mobil, motor cepat, dan van logistik bertangki besar",
      "Sistem buronan 0-5 bintang, polisi dengan kemudi prediktif, dan roadblock",
      "Lalu lintas dan 26 pejalan kaki termasuk turis yang berteduh saat hujan",
      "Siklus siang-malam, hujan, jalan licin, dan mercusuar berlampu putar",
      "Bahan bakar, dua SPBU, stamina, kesehatan, dan kombo skor sampai x4",
      "Minimap bundar, HUD lengkap, menu jeda, mode foto, dan layar akhir",
      "Suara sintetis WebAudio: mesin, klakson, tembakan, hujan, dan jingle misi"
    ]
  };

  const dossierJson: string = JSON.stringify(dossier, null, 2);
  const dossierBytes: number = Buffer.byteLength(dossierJson, "utf8");
  dossier.textSizeCap = Math.max(4000, dossierBytes);
  const finalJson: string = JSON.stringify(dossier, null, 2);
  const finalBytes: number = Buffer.byteLength(finalJson, "utf8");
  if (finalBytes > MAX_DOSSIER_BYTES) {
    fail("dossier.json berukuran " + finalBytes + " byte, melebihi 1 MiB.");
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, "dossier.json"), finalJson, "utf8");
  console.log("Kota Karang OK: " + sortedShots.length + " screenshot disalin, dossier.json " + finalBytes + " byte ditulis ke " + OUTPUT_DIR + "/dossier.json.");
}

main();
