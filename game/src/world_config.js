// [RONDE 4] Helper matematika kecil dan konstanta dunia.
export function batas(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function acak(a, b) {
  return a + Math.random() * (b - a);
}

/** Bilangan bulat acak inklusif di [a, b]. */
export function acakInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

/** Sudut dari (ax, az) menuju (bx, bz), searah jarum jam dari +Z. */
export function sudutKe(ax, az, bx, bz) {
  return Math.atan2(bx - ax, bz - az);
}

/** Interpolasi linear a -> b sebesar t (0..1). */
export function lerp(a, b, t) {
  return a + (b - a) * batas(t, 0, 1);
}

/** Pengacak deterministik dari seed supaya kota sama untuk seed yang sama. */
export function acakSeed(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function pilih(arr, rng) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function jarak2(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

/** Sudut terpendek dari a ke b, dilipat ke [-PI, PI]. */
export function selisihSudut(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
