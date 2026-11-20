// [REVISI thinking_revised] GTA-style open world game constants and small helpers.
// All values are authored for this entry; no commercial game data is used.

export const CITY_NAME = 'Kota Karang';
export const GRID = 10;          // city blocks per side
export const BLOCK = 44;         // metres per block
export const ROAD_W = 12;        // road width in metres
export const SIDEWALK = 4;       // sidewalk width on each side of a road
export const PLAYER_HEIGHT = 1.8;
export const WALK_SPEED = 5.2;
export const RUN_SPEED = 9.0;
export const CAR_SPEED = 17.5;

/** The fixed simulation step, in seconds: the loop catches up in whole steps. */
export const STEP = 1 / 60;
/** Longest frame the loop replays; a longer stall (a hidden tab) is dropped. */
export const MAX_FRAME = 0.05;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function rand(a, b) {
  return a + Math.random() * (b - a);
}

/** deterministic pseudo random from a seed, so a shot renders the same city */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function pick(list, rng) {
  return list[Math.floor(rng() * list.length) % list.length];
}

/** Distance in the ground plane; the world has no vertical extent to speak of. */
export function dist2(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}
