// [RONDE 4] Pusat angka dan warna Kota Karang.
// Semua jarak meter, kecepatan meter/detik, waktu detik.
export const KOTA = { grid: 10, block: 44, roadWidth: 12, sidewalk: 4 };
export const ORANG = { jalan: 5.2, lari: 9.0, nyawa: 100 };
export const STAMINA = { maks: 100, habisLari: 14, pulih: 9, ambangLari: 12 };
export const MOBIL = {
  top: 17.5, akselerasi: 1.6, belok: 2.1, rem: 0.02,
  jarakCuri: 3.4, wantedCuri: 0.6,
};
export const MOTOR = { top: 22.5, akselerasi: 2.3, belok: 2.6, rem: 0.02 };
// Van logistik: lambat tapi stabil, tangki besar, muat misi antar barang.
export const VAN = { top: 15.5, akselerasi: 1.35, belok: 1.7, rem: 0.02, tangki: 140 };
export const LALU = { jumlah: 14, laju: 9.6 };
// Hujan: peluang mulai tiap pergantian cuaca, durasi, dan cengkeram jalan.
export const HUJAN = { peluang: 0.45, durasiMin: 25, durasiMax: 55, cengkeram: 0.28, gelap: 0.35 };
export const PEJALAN = { jumlah: 22, lariPanik: 3.4, peluangCross: 0.35 };
export const POLISI = { jumlah: 5, top: 21.9, decay: 6, lead: 0.35, ramJarak: 3.2, kejarAgresif: 0.08, roadblockWanted: 3, pengaliDecay: 0.25, jarakRoadblock: 42 };

export const MISI = {
  jarakSampai: 10,
  jarakAmbil: 7,
  jarakSprint: 420,
  jarakParkir: 3.2,
  jarakAntar: 10,
  // Nyawa yang pulih tiap misi selesai.
  pulihNyawa: 10,
  hadiah: [400, 550, 300, 650, 500, 450, 700],
};

// Volume dasar audio prosedural.
export const SUARA = { master: 0.5, musik: 0.25, mesinMaks: 0.16 };

// Koin Karang: koleksi sampingan di misi keenam.
export const KOINS = { jumlah: 5, waktu: 50, jariJemput: 4.5, nilai: 80 };

// Satu putaran penuh siang-malam dan jam mulai.
export const HARI = { detik: 240, mulai: 8.5 };

// Bahan bakar: kapasitas, pemakaian per meter, dan laju isi di pom.
export const BAHAN = { kapasitas: 100, pakai: 0.032, isi: 30, rendah: 20 };

// Kombo: jendela dasar detik, tambahan per tingkat pengali, dan batasnya.
export const KOMBO = { jendela: 4, tambahTingkat: 0.4, tambahMaks: 1.2 };

export const SKOR = {
  misi: 250, polisi: 120, pejalan: 40, nyaris: 15, parkir: 180, koin: 80, antar: 200,
};

export const STEP = 1 / 60;
export const MAX_FRAME = 0.05;

export const WARNA = {
  langit: 0x87b5d9,
  kabut: 0x87b5d9,
  aspal: 0x2b2f36,
  trotoar: 0x4a4f58,
  tanah: 0x243026,
  polisiBadan: 0xf2f4f6,
  polisiGaris: 0x14213d,
  blipLalu: 0xd8b13c,
  blipPejalan: 0xb9c2d0,
  lampu: 0xffe9a8,
  bensin: 0x2f9e6e,
  koin: 0xf2c94c,
  koinPijar: 0x7a5c00,
};

export const KUNCI_SIMPAN = 'kota-karang.simpan';
