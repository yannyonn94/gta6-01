// Every tuning number and colour in one place for Kota Karang, the open world.
// Distances are metres, speeds metres per second, times seconds.

export const CITY = {
  grid: 10,          // blocks per side
  block: 44,         // metres per block
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
export const PEDS = { count: 22, panicSpeed: 3.4 };
export const POLICE = { count: 5, topSpeed: 21.9, wantedDecaySeconds: 6 };

export const MISSION = {
  arriveRadius: 10,
  pickupRadius: 7,
  rewards: [400, 550, 300],
};

/** The fixed simulation step: the loop catches up in whole steps, never half of one. */
export const STEP = 1 / 60;

/** Longest frame the loop replays; a longer stall (a hidden tab) is dropped. */
export const MAX_FRAME = 0.05;

export const PALETTE = {
  sky: 0x87b5d9,
  fog: 0x87b5d9,
  asphalt: 0x2b2f36,
  sidewalk: 0x4a4f58,
  ground: 0x243026,
  policeBody: 0xf2f4f6,
  policeStripe: 0x14213d,
};

/** Where progress is kept between visits (this browser only). */
export const SAVE_KEY = 'kota-karang.save';
