// keys.js — status keyboard dan mouse untuk seluruh permainan. Satu sumber:
// tombol ditahan (held), tombol baru ditekan sekali (pressed), dan putaran
// kamera dari gerakan mouse. Dipanggil sekali per frame lewat poll().

export function createInput() {
  const held = {};
  const pressed = {};
  let yawDelta = 0;
  let pitchDelta = 0;
  let locked = false;

  function keyName(e) {
    return e.code || e.key;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(k)) {
      e.preventDefault();
    }
    if (!held[k]) pressed[k] = true;
    held[k] = true;
  });
  window.addEventListener('keyup', (e) => {
    held[keyName(e)] = false;
  });
  window.addEventListener('blur', () => {
    for (const k in held) held[k] = false;
  });
  document.addEventListener('mousemove', (e) => {
    if (!locked) return;
    yawDelta -= e.movementX * 0.0028;
    pitchDelta -= e.movementY * 0.0022;
  });
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement != null;
  });

  return {
    isDown(code) { return !!held[code]; },
    wasPressed(code) { return !!pressed[code]; },
    axis() {
      // -1..1 untuk maju/mundur (W/S) dan belok (A/D).
      let f = 0, s = 0;
      if (held['KeyW'] || held['ArrowUp']) f += 1;
      if (held['KeyS'] || held['ArrowDown']) f -= 1;
      if (held['KeyA'] || held['ArrowLeft']) s -= 1;
      if (held['KeyD'] || held['ArrowRight']) s += 1;
      return { forward: f, steer: s };
    },
    running() { return !!(held['ShiftLeft'] || held['ShiftRight']); },
    handbrake() { return !!held['Space']; },
    look() {
      const d = { yaw: yawDelta, pitch: pitchDelta };
      yawDelta = 0; pitchDelta = 0;
      return d;
    },
    lockPointer(el) {
      try { el.requestPointerLock(); } catch (e) { /* abaikan */ }
    },
    unlockPointer() {
      try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    },
    poll() {
      // Dipanggil di akhir tiap frame: tombol sekali-tekan hangus.
      for (const k in pressed) delete pressed[k];
    },
  };
}
