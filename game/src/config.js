// config.js — semua angka yang bisa disetel untuk Kota Karang.
// Satu tempat untuk kecepatan, bahan bakar, bintang buronan, misi, dan kombo.
var KKCFG = {
  // Pemain berjalan kaki
  walkSpeed: 6.0,
  runSpeed: 10.5,
  runStaminaDrain: 14.0,      // stamina per detik saat lari
  staminaRecover: 9.0,        // pulih saat diam
  staminaRecoverWalk: 4.0,    // pulih saat jalan biasa
  // Kendaraan
  carAccel: 16.0,
  carBrake: 30.0,
  carMaxSpeed: 34.0,
  carTurn: 1.9,
  motoAccel: 22.0,
  motoMaxSpeed: 42.0,
  motoTurn: 2.4,
  vanAccel: 11.0,
  vanMaxSpeed: 26.0,
  vanTurn: 1.5,
  vanTank: 120.0,
  carTank: 80.0,
  motoTank: 45.0,
  // Bahan bakar (liter per detik pada kecepatan penuh)
  fuelUseFull: 0.55,
  fuelUseIdle: 0.05,
  fuelLowWarn: 15.0,
  refuelRate: 22.0,           // liter per detik di SPBU
  // Kesehatan
  maxHealth: 100,
  crashDamage: 9,
  crashCooldown: 0.8,
  missionHeal: 12,
  // Buronan
  wantedMax: 5,
  wantedSteal: 1,
  wantedCrash: 1,
  wantedShootPed: 2,
  wantedShootPolice: 2,
  wantedDecayDelay: 6.0,      // detik bersembunyi sebelum bintang turun
  wantedDecayStep: 8.0,       // detik per satu bintang turun
  // Polisi
  policeBaseSpeed: 20.0,
  policeSpeedPerStar: 3.5,
  policeCatchRadius: 4.5,
  policeSpawnRadius: 55,
  policeMaxActive: 6,
  roadblockAtWanted: 3,
  // Misi
  missionBagCount: 8,
  missionCoinCount: 5,
  missionSprintMeters: 420,
  missionSprintTime: 75,
  missionHideTime: 25,
  missionParkRadius: 3.2,
  missionParkAngle: 0.45,
  missionReward: [500, 400, 600, 700, 500, 800, 1500],
  // Skor dan kombo
  comboWindowBase: 5.0,       // detik jendela kombo level 1
  comboWindowStep: 2.0,       // tambahan detik per level
  comboMaxLevel: 4,           // pengali tertinggi x4
  comboHitsPerLevel: 3,       // aksi berantai per level
  scoreSteal: 100,
  scoreBag: 60,
  scoreCoin: 150,
  scoreCrash: -25,
  // Kamera orang ketiga
  cameraDefaultDist: 13,
  cameraDefaultHeight: 6.5,
  cameraMinDist: 8,
  cameraMaxDist: 26,
  // Dunia
  rainSlipAccel: 0.62,        // pengali akselerasi saat hujan
  rainSlipGrip: 0.72,         // pengali cengkeraman saat hujan
  dayLengthSec: 240,          // satu hari penuh dalam detik
  trafficCount: 14,
  pedCount: 26,
  coinSpinSpeed: 2.2
};
