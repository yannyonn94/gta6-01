// world_config.js — tata letak Kota Karang: grid kota, jalan, dan landmark.
// Semua posisi dalam meter, pusat kota di (0, 0), utara = -Z.
var KKWORLD = {
  gridBlocks: 10,
  pitch: 32,            // jarak antar pusat blok
  blockSize: 24,        // lebar satu blok bangunan
  roadWidth: 8,
  halfCity: 160,        // setengah lebar area jalan kota
  islandSize: 430,      // lebar pulau (tanah)
  seaSize: 1400,        // lebar bidang laut
  // Garis tengah jalan (sumbu X dan Z yang sama)
  roadLines: [-160, -128, -96, -64, -32, 0, 32, 64, 96, 128, 160],
  // Landmark utama
  lighthouse: { x: 192, z: -192, height: 46 },
  headland: { x: 192, z: -192, radius: 26 },
  pier: { x: 64, z: 196, length: 64, width: 10 },
  market: { x: -8, z: 96, radius: 26 },
  garage: { x: -80, z: -48 },
  warehouse: { x: -188, z: 48 },
  stationNW: { x: -144, z: -144 },
  stationSE: { x: 144, z: 144 },
  parkBay: { x: 32, z: -96, angle: 0 },
  beachBand: 26,        // lebar pasir di tepi pulau
  // Titik pandang cantik untuk mode foto (x, z, arah hadap)
  photoSpots: [
    { x: 120, z: -120, heading: Math.PI * 0.25 },
    { x: 64, z: 170, heading: Math.PI },
    { x: -188, z: 48, heading: -Math.PI / 2 }
  ],
  // Titik awal pemain (di jalan x=-96, menghadap selatan ke pasar)
  playerStart: { x: -96, z: -16, heading: Math.PI },
  // Titik kemunculan kendaraan misi
  blueCarSpot: { x: -80, z: -32 },
  vanSpot: { x: -160, z: 64 },
  motoSpot: { x: 32, z: 96 },
  // Warna kota
  palette: [
    0xd8c9a3, 0xc9a06a, 0xb98a5e, 0x8fa3b0, 0xd97b5f,
    0xe8dcc0, 0x7fa88f, 0xc96f4a, 0x9db3c8, 0xe0b45c
  ],
  roofColors: [0x8a4a3a, 0x5d6b7a, 0x74604a, 0x9c3d2e, 0x4a5d4f],
  seaColor: 0x1d6f8e,
  sandColor: 0xe3cf9e,
  grassColor: 0x6f9e5f,
  roadColor: 0x3a3d42,
  // Langit
  skyDay: 0x87bfe8,
  skyDusk: 0xe8975a,
  skyNight: 0x101a2e,
  skyRain: 0x5d6b78
};
