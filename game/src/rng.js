// rng.js — angka acak ber-seed (mulberry32) supaya lalu lintas, pejalan kaki
// dan tata kota sama setiap kali permainan dimuat dengan seed yang sama.
// Dipakai juga untuk mode tangkapan layar agar keempat gambar bisa diulang.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function range(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

export function intIn(rng, lo, hi) {
  return Math.floor(range(rng, lo, hi + 1));
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function chance(rng, p) {
  return rng() < p;
}

export function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

// Titik acak di dalam sebuah blok kota (dipakai untuk koin dan penanda misi).
export function pointInBlock(rng, blockX, blockZ, margin) {
  return {
    x: blockX + range(rng, -margin, margin),
    z: blockZ + range(rng, -margin, margin),
  };
}
