// hud.js — seluruh tampilan 2D Kota Karang: bilah atas (uang, bintang,
// jam, BBM), kartu misi, minimap kanvas, spidometer, kombo, toast, dan
// layar mulai / jeda / selesai. Minimap digambar ulang tiap frame dari
// posisi dunia yang dikirim boot.js.

export function createHud(callbacks) {
  const $ = (id) => document.getElementById(id);
  const el = {
    money: $('money'), stars: $('stars'), clock: $('clock'),
    fuelfill: $('fuelfill'), missionTitle: $('mission-title'),
    missionDesc: $('mission-desc'), missionBar: $('mission-bar'),
    missionSub: $('mission-sub'), combo: $('combo'), toast: $('toast'),
    speedo: $('speedo'), minimap: $('minimap'),
    start: $('start'), pause: $('pause'), end: $('end'),
    pauseStats: $('pause-stats'), endText: $('end-text'),
    damage: $('damage'),
  };
  const mm = el.minimap.getContext('2d');
  let toastTimer = null;

  function setMoney(v) { el.money.textContent = '$ ' + Math.floor(v).toLocaleString('en-US'); }
  function setStars(n) {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < n ? '★' : '<span class="off">★</span>';
    el.stars.innerHTML = s;
  }
  function setClock(t) { el.clock.textContent = t; }
  function setFuel(frac) {
    el.fuelfill.style.width = Math.max(0, Math.min(100, frac * 100)) + '%';
  }
  function setSpeed(kmh) {
    el.speedo.innerHTML = Math.round(kmh) + ' <small>km/j</small>';
  }
  function setMission(info) {
    el.missionTitle.textContent = info.title;
    el.missionDesc.textContent = info.desc;
    el.missionBar.style.width = Math.max(0, Math.min(100, info.progress * 100)) + '%';
    el.missionSub.textContent = info.sub || '';
  }
  function showCombo(n) {
    el.combo.style.display = 'block';
    el.combo.textContent = 'KOMBO ×' + n + ' — uang berlipat!';
  }
  function hideCombo() { el.combo.style.display = 'none'; }
  function toast(msg, ms) {
    el.toast.textContent = msg;
    el.toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.style.display = 'none'; }, ms || 3600);
  }
  function damageFlash() {
    el.damage.style.opacity = '1';
    setTimeout(() => { el.damage.style.opacity = '0'; }, 260);
  }
  function showStart() { el.start.classList.remove('hidden'); }
  function hideStart() { el.start.classList.add('hidden'); }
  function showPause(stats) {
    el.pauseStats.textContent = stats;
    el.pause.classList.remove('hidden');
  }
  function hidePause() { el.pause.classList.add('hidden'); }
  function showEnd(text) {
    el.endText.textContent = text;
    el.end.classList.remove('hidden');
  }
  function hideEnd() { el.end.classList.add('hidden'); }
  function setPhotoMode(on) {
    const hudIds = ['topbar', 'mission', 'combo', 'toast', 'minimap-wrap', 'speedo', 'hint'];
    for (const id of hudIds) {
      const n = document.getElementById(id);
      if (n) n.style.visibility = on ? 'hidden' : 'visible';
    }
  }

  // --- Minimap ------------------------------------------------------------
  function drawMinimap(snap) {
    const S = 180, W = 400; // dunia -200..200
    const to = (x) => (x + 200) / W * S;
    mm.clearRect(0, 0, S, S);
    mm.fillStyle = '#0e4d6e';
    mm.fillRect(0, 0, S, S);
    mm.fillStyle = '#e8d29a';
    mm.fillRect(to(-178), to(-178), (356 / W) * S, (356 / W) * S);
    mm.fillStyle = '#5da24a';
    mm.fillRect(to(-164), to(-164), (328 / W) * S, (328 / W) * S);
    // Jalan.
    mm.strokeStyle = '#2c2f36';
    mm.lineWidth = 4;
    for (let i = 0; i < 10; i++) {
      const r = to(-144 + i * 32);
      mm.beginPath(); mm.moveTo(r, 0); mm.lineTo(r, S); mm.stroke();
      mm.beginPath(); mm.moveTo(0, r); mm.lineTo(S, r); mm.stroke();
    }
    const dot = (x, z, color, r) => {
      mm.fillStyle = color;
      mm.beginPath(); mm.arc(to(x), to(z), r || 3, 0, Math.PI * 2); mm.fill();
    };
    if (snap.landmarks) {
      dot(snap.landmarks.market.x, snap.landmarks.market.z, '#e2703a', 4);
      dot(snap.landmarks.lighthouse.x, snap.landmarks.lighthouse.z, '#ffd23e', 4);
      dot(snap.landmarks.port.x, snap.landmarks.port.z, '#19c2b8', 4);
      dot(snap.landmarks.gas.x, snap.landmarks.gas.z, '#d23b2e', 3.5);
      dot(snap.landmarks.depot.x, snap.landmarks.depot.z, '#3f6fb5', 3.5);
    }
    if (snap.beacon) {
      const pulse = 4 + Math.sin(performance.now() / 250) * 1.5;
      dot(snap.beacon.x, snap.beacon.z, '#19c2b8', pulse);
      mm.strokeStyle = '#ffffff';
      mm.lineWidth = 1.5;
      mm.beginPath(); mm.arc(to(snap.beacon.x), to(snap.beacon.z), pulse + 3, 0, Math.PI * 2); mm.stroke();
    }
    if (snap.cars) {
      for (const c of snap.cars) dot(c.x, c.z, '#c8c8c8', 2);
    }
    if (snap.police) {
      for (const u of snap.police) dot(u.x, u.z, '#ff4444', 3);
    }
    if (snap.player) {
      // Segitiga putih menghadap arah pemain.
      mm.save();
      mm.translate(to(snap.player.x), to(snap.player.z));
      mm.rotate(-snap.player.heading);
      mm.fillStyle = '#ffffff';
      mm.beginPath();
      mm.moveTo(0, -6); mm.lineTo(4.5, 5); mm.lineTo(-4.5, 5); mm.closePath();
      mm.fill();
      mm.restore();
    }
  }

  // Tombol-tombol layar.
  $('btn-start').addEventListener('click', () => callbacks.onStart(false));
  $('btn-continue').addEventListener('click', () => callbacks.onStart(true));
  $('btn-resume').addEventListener('click', () => callbacks.onResume());
  $('btn-save').addEventListener('click', () => callbacks.onSave());
  $('btn-restart').addEventListener('click', () => callbacks.onRestart());
  $('btn-again').addEventListener('click', () => callbacks.onAgain());

  setStars(0);
  setMoney(0);
  setFuel(1);

  return {
    setMoney, setStars, setClock, setFuel, setSpeed, setMission,
    showCombo, hideCombo, toast, damageFlash,
    showStart, hideStart, showPause, hidePause, showEnd, hideEnd,
    setPhotoMode, drawMinimap,
  };
}
