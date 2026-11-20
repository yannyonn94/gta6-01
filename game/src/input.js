// [RONDE 3] Masukan keyboard dan pointer lock.
export const AKSI_MOBIL = 1;
export const AKSI_TEMBAK = 2;
export const AKSI_JEDA = 4;

const ATAS = new Set(['KeyW', 'ArrowUp']);
const BAWAH = new Set(['KeyS', 'ArrowDown']);
const KIRI = new Set(['KeyA', 'ArrowLeft']);
const KANAN = new Set(['KeyD', 'ArrowRight']);
const LARI = new Set(['ShiftLeft', 'ShiftRight']);
const MOBIL = new Set(['KeyE']);
const TEMBAK = new Set(['Space']);
const JEDA = new Set(['Escape', 'KeyP']);
const SEMUA = new Set([...ATAS, ...BAWAH, ...KIRI, ...KANAN, ...LARI, ...MOBIL, ...TEMBAK, ...JEDA]);

export function buatMasukan(target) {
  const tahan = new Set();
  let aksi = 0;
  let yaw = 0;
  let pitch = -0.18;
  let terkunci = false;

  window.addEventListener('keydown', (e) => {
    if (tahan.has(e.code)) return;
    tahan.add(e.code);
    if (MOBIL.has(e.code)) aksi |= AKSI_MOBIL;
    else if (TEMBAK.has(e.code)) aksi |= AKSI_TEMBAK;
    else if (JEDA.has(e.code)) aksi |= AKSI_JEDA;
    if (SEMUA.has(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => tahan.delete(e.code));
  window.addEventListener('blur', () => tahan.clear());

  target.addEventListener('mousedown', () => { if (!terkunci) target.requestPointerLock?.(); });
  document.addEventListener('pointerlockchange', () => {
    terkunci = document.pointerLockElement === target;
  });
  window.addEventListener('mousemove', (e) => {
    if (!terkunci) return;
    yaw -= e.movementX * 0.0022;
    pitch = Math.max(-1.2, Math.min(0.5, pitch - e.movementY * 0.0022));
  });

  return {
    gerak() {
      const x = (tahan.has('KeyD') || tahan.has('ArrowRight') ? 1 : 0)
        - (tahan.has('KeyA') || tahan.has('ArrowLeft') ? 1 : 0);
      const y = (tahan.has('KeyW') || tahan.has('ArrowUp') ? 1 : 0)
        - (tahan.has('KeyS') || tahan.has('ArrowDown') ? 1 : 0);
      return { x, y, lari: LARI.has('ShiftLeft') || LARI.has('ShiftRight'), rem: tahan.has('Space') };
    },
    pandang() { return { yaw, pitch }; },
    ambilAksi() { const a = aksi; aksi = 0; return a; },
    get terkunci() { return terkunci; },
  };
}
