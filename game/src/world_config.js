// [RONDE 3] Helper matematika kecil dan konstanta dunia.
export function batas(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function acak(a, b) {
  return a + Math.random() * (b - a);
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
