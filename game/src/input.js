// [RONDE 5] Masukan keyboard dan pointer lock. H membunyikan klakson,
// F mengaktifkan mode foto, M mematikan suara, R mereset sudut kamera,
// roda mouse mengatur zoom kamera.
export const AKSI_MOBIL = 1;
export const AKSI_TEMBAK = 2;
export const AKSI_JEDA = 4;
export const AKSI_KLAKSON = 8;
export const AKSI_FOTO = 16;
export const AKSI_BISU = 32;

const ATAS = new Set(['KeyW', 'ArrowUp']);
const BAWAH = new Set(['KeyS', 'ArrowDown']);
const KIRI = new Set(['KeyA', 'ArrowLeft']);
const KANAN = new Set(['KeyD', 'ArrowRight']);
const LARI = new Set(['ShiftLeft', 'ShiftRight']);
const MOBIL = new Set(['KeyE']);
const TEMBAK = new Set(['Space']);
const JEDA = new Set(['Escape', 'KeyP']);
const KLAKSON = new Set(['KeyH']);
const FOTO = new Set(['KeyF']);
const BISU = new Set(['KeyM']);
const RESET_ZOOM = new Set(['KeyR']);
const SEMUA = new Set([...ATAS, ...BAWAH, ...KIRI, ...KANAN, ...LARI, ...MOBIL, ...TEMBAK, ...JEDA, ...KLAKSON, ...FOTO, ...BISU, ...RESET_ZOOM]);

export function buatMasukan(target) {
  const tahan = new Set();
  let aksi = 0;
  let yaw = 0;
  let pitch = -0.18;
  let zoom = 1;
  let terkunci = false;
  // Mode foto mengizinkan seret mouse tanpa pointer lock; dimatikan di luar itu.
  let dragBoleh = false;
  const dragAktif = () => dragBoleh;

  window.addEventListener('keydown', (e) => {
    if (tahan.has(e.code)) return;
    tahan.add(e.code);
    if (MOBIL.has(e.code)) aksi |= AKSI_MOBIL;
    else if (TEMBAK.has(e.code)) aksi |= AKSI_TEMBAK;
    else if (JEDA.has(e.code)) aksi |= AKSI_JEDA;
    else if (KLAKSON.has(e.code)) aksi |= AKSI_KLAKSON;
    else if (FOTO.has(e.code)) aksi |= AKSI_FOTO;
    else if (BISU.has(e.code)) aksi |= AKSI_BISU;
    else if (RESET_ZOOM.has(e.code)) { zoom = 1; yaw = 0; pitch = -0.18; }
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
  // Seret mouse tanpa pointer lock: dipakai mode foto untuk mengorbit kamera.
  let menyeret = false;
  target.addEventListener('mousedown', () => { menyeret = true; });
  window.addEventListener('mouseup', () => { menyeret = false; });
  window.addEventListener('mousemove', (e) => {
    if (terkunci || !menyeret || !dragAktif()) return;
    yaw -= e.movementX * 0.004;
    pitch = Math.max(-1.2, Math.min(0.5, pitch - e.movementY * 0.004));
  });
  // Roda mouse: zoom kamera masuk/keluar, dibatasi 0.7–1.6.
  target.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom = Math.max(0.7, Math.min(1.6, zoom + (e.deltaY > 0 ? 0.08 : -0.08)));
  }, { passive: false });

  return {
    gerak() {
      const x = (tahan.has('KeyD') || tahan.has('ArrowRight') ? 1 : 0)
        - (tahan.has('KeyA') || tahan.has('ArrowLeft') ? 1 : 0);
      const y = (tahan.has('KeyW') || tahan.has('ArrowUp') ? 1 : 0)
        - (tahan.has('KeyS') || tahan.has('ArrowDown') ? 1 : 0);
      return { x, y, lari: LARI.has('ShiftLeft') || LARI.has('ShiftRight'), rem: tahan.has('Space') };
    },
    pandang() { return { yaw, pitch, zoom }; },
    ambilAksi() { const a = aksi; aksi = 0; return a; },
    get terkunci() { return terkunci; },
    /** Nyalakan/matikan seret mouse (mode foto). */
    aturDrag(b) { dragBoleh = !!b; },
  };
}
