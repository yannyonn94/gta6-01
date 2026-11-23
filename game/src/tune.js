// tune.js — semua angka penyetel Kota Karang di satu tempat: ukuran pulau,
// kecepatan, ekonomi, polisi, dan daftar ketujuh misi. Mengubah permainan
// berarti mengubah berkas ini, bukan mengobrak-abrik logika di mana-mana.

export const WORLD = {
  GRID: 10,          // pulau 10 x 10 blok
  BLOCK: 24,         // lebar satu blok (meter permainan)
  ROAD: 8,           // lebar jalan
  PITCH: 32,         // jarak antar sumbu jalan = BLOCK + ROAD
  HALF: 160,         // setengah bentang kota (10 * 32 / 2)
  SEA: 560,          // bentang bidang laut
  BEACH: 178,        // tepi pasir tempat kota bertemu laut
};

export function roadLine(i) {
  // Sumbu jalan ke-i (10 jalan tiap arah), dari -144 sampai +144.
  return -WORLD.HALF + 16 + i * WORLD.PITCH;
}

export function blockCenter(i) {
  // Pusat blok ke-i (9 blok tiap arah, di antara jalan), dari -128 sampai +128.
  return -WORLD.HALF + WORLD.PITCH + i * WORLD.PITCH;
}

export const PALETTE = {
  seaDeep: 0x0e4d6e,
  seaShallow: 0x1b7f9e,
  sand: 0xe8d29a,
  grass: 0x5da24a,
  asphalt: 0x2c2f36,
  line: 0xf5d76e,
  sidewalk: 0x9aa0a8,
  roofA: 0xc65b4e,
  roofB: 0x3f6fb5,
  roofC: 0xe0a458,
  wallA: 0xf2e6d0,
  wallB: 0xd9c7a7,
  wallC: 0xb9c8d8,
  glass: 0x9fd8e8,
  palm: 0x2f7d3a,
  trunk: 0x7a5230,
  lighthouse: 0xf4f1e6,
  lighthouseTop: 0xd23b2e,
  market: 0xe2703a,
};

export const TUNE = {
  walkSpeed: 6.5,
  runSpeed: 11,
  carAccel: 26,
  carBrake: 42,
  carMaxSpeed: 38,
  carMaxReverse: 10,
  carTurn: 2.1,
  carGrip: 6.5,
  fuelMax: 100,
  fuelDrain: 0.55,       // per detik saat mengemudi
  fuelRefillRate: 30,    // per detik di pom
  wantedDecay: 9,        // detik tanpa kejahatan sebelum satu bintang turun
  bustSeconds: 6,        // detik ditangkap polisi saat diam dekat mereka
  coinValue: 25,
  comboWindow: 6,        // detik menjaga kombo
  dayLength: 420,        // detik satu hari penuh dalam permainan
  startHour: 8,
};

export const MISSIONS = [
  {
    id: 'koin-pertama',
    title: 'Misi 1 — Koin Pertama',
    brief: 'Pasar pagi baru buka. Kumpulkan 8 koin emas yang tersebar di sekitar kios pasar dan jalan utama.',
    type: 'collect',
    target: 8,
    reward: 200,
  },
  {
    id: 'antar-paket',
    title: 'Misi 2 — Antar Paket',
    brief: 'Van logistik sudah menunggu di depot. Antar 3 paket ke titik-titik di kota sebelum waktu habis. Mengemudi cepat, tapi jangan menabrak pejalan kaki.',
    type: 'deliver',
    target: 3,
    timeLimit: 150,
    reward: 450,
  },
  {
    id: 'taksi-karang',
    title: 'Misi 3 — Taksi Karang',
    brief: 'Dua turis menunggu di depan pasar. Jemput mereka dengan mobil, lalu antar ke mercusuar di tanjung timur.',
    type: 'taxi',
    target: 2,
    reward: 500,
  },
  {
    id: 'kejar-pencuri',
    title: 'Misi 4 — Kejar Pencuri',
    brief: 'Pencuri kabur dengan mobil curian! Kejar dan tabrak mobilnya 3 kali sampai dia menyerah. Hati-hati, polisi ikut mengejar.',
    type: 'chase',
    target: 3,
    reward: 700,
  },
  {
    id: 'balapan-senja',
    title: 'Misi 5 — Balapan Senja',
    brief: 'Balapan liar keliling pulau saat senja. Lewati 5 gerbang kuning secepat mungkin. Gerbang berikutnya menyala di peta.',
    type: 'race',
    target: 5,
    reward: 900,
  },
  {
    id: 'selundup-senyap',
    title: 'Misi 6 — Selundup Senyap',
    brief: 'Paket ini tidak boleh terlihat polisi. Antar ke pelabuhan barat TANPA satu pun bintang buronan. Kalau bintang naik, misi gagal.',
    type: 'stealth',
    target: 1,
    reward: 1200,
  },
  {
    id: 'badai-karang',
    title: 'Misi 7 — Badai Karang',
    brief: 'Badai terbesar tahun ini menghantam pulau. Tembus hujan dan roadblock polisi, bawa obat-obatan ke mercusuar sebelum fajar. Ini misi terakhir.',
    type: 'storm',
    target: 1,
    timeLimit: 240,
    reward: 2000,
  },
];

export const SAVE_KEY = 'kotakarang-save-v1';
