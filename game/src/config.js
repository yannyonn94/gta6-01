// [RONDE 2] Semua angka tuning dan warna Kota Karang.
// Jarak dalam meter, kecepatan meter per detik, waktu dalam detik.
export const CITY = {
  grid: 10,
  block: 44,
  roadWidth: 12,
  sidewalk: 4,
};

export const PLAYER = {
  height: 1.8,
  walkSpeed: 5.2,
  runSpeed: 9.0,
  health: 100,
};

export const CAR = {
  topSpeed: 17.5,
  acceleration: 1.6,
  turnRate: 2.1,
  brakeDamping: 0.02,
  stealWanted: 0.6,
  enterRange: 3.4,
};

export const TRAFFIC = { count: 14, speed: 9.6 };
export const PEDS = { count: 22, panicSpeed: 3.4, crossChance: 0.35 };
export const POLICE = { count: 5, topSpeed: 21.9, wantedDecaySeconds: 6, leadTime: 0.35 };

export const MISSION = {
  arriveRadius: 10,
  pickupRadius: 7,
  raceDistance: 420,
  rewards: [400, 550, 300, 650],
};

// Siklus penuh siang-malam berapa detik game, dan jam berapa pemain mulai.
export const DAY = { seconds: 240, startHour: 8.5 };

// Skor per aksi, supaya HUD punya angka yang bergerak.
export const SCORE = {
  mission: 250,
  policeDown: 120,
  pedDown: 40,
  nearMiss: 15,
};

export const STEP = 1 / 60;
export const MAX_FRAME = 0.05;

export const PALETTE = {
  sky: 0x87b5d9,
  fog: 0x87b5d9,
  asphalt: 0x2b2f36,
  sidewalk: 0x4a4f58,
  ground: 0x243026,
  policeBody: 0xf2f4f6,
  policeStripe: 0x14213d,
  trafficBlip: 0xd8b13c,
  pedBlip: 0xb9c2d0,
  lamp: 0xffe9a8,
};

export const SAVE_KEY = 'kota-karang.save';
