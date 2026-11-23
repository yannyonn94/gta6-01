// random.js — generator angka acak dengan seed, supaya kota yang sama
// selalu muncul dari seed yang sama. Dipakai kota, lalu lintas, dan misi.
function makeSeededRandom(seed) {
  var state = (seed >>> 0) || 1;
  function next() {
    // mulberry32
    state = (state + 0x6D2B79F5) >>> 0;
    var t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(min, max) {
    return min + next() * (max - min);
  }
  function int(min, max) {
    return Math.floor(range(min, max + 1));
  }
  function pick(list) {
    return list[Math.floor(next() * list.length)];
  }
  function chance(p) {
    return next() < p;
  }
  // Nilai acak sekitar rata-rata (untuk tinggi gedung, kecepatan, dan lain-lain).
  function gaussian(mean, spread) {
    var u = 0, v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    var z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * spread;
  }
  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(next() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }
  return { next: next, range: range, int: int, pick: pick, chance: chance, gaussian: gaussian, shuffle: shuffle, seed: seed >>> 0 };
}

// Seed dari URL (?seed=...) atau jam, supaya tiap sesi bisa beda kota.
function seedFromLocation() {
  try {
    var params = new URLSearchParams(window.location.search);
    var raw = parseInt(params.get('seed'), 10);
    if (!isNaN(raw)) return raw >>> 0;
  } catch (e) { /* abaikan, pakai seed tetap */ }
  return 20261123;
}
