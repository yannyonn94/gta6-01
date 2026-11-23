// camera.js — kamera Kota Karang: mengikuti pemain dari belakang (jalan
// kaki lebih dekat, mobil lebih jauh), orbit dengan mouse, mode foto bebas,
// dan mode udara untuk tangkapan layar pembuka. Posisi dihaluskan supaya
// tidak bergetar saat pemain berbelok tajam.

export function createCamera() {
  let yaw = 0;        // arah kamera mengelilingi pemain
  let pitch = 0.42;   // sudut ke bawah
  let distance = 10;
  let targetDistance = 10;
  const current = new THREE.Vector3(0, 40, 120);
  const look = new THREE.Vector3(0, 0, 0);
  let aerial = null;  // { pos, look } tetap untuk mode udara
  let photo = false;

  function update(dt, focus, mode, lookDelta) {
    if (aerial) return; // mode udara: kamera diam
    yaw += lookDelta.yaw;
    pitch = Math.max(0.08, Math.min(1.15, pitch + lookDelta.pitch));
    if (mode === 'car') targetDistance = 13.5;
    else if (photo) targetDistance = 9;
    else targetDistance = 9.5;
    distance += (targetDistance - distance) * Math.min(1, dt * 5);

    const fx = focus.x, fz = focus.z;
    const fy = focus.y !== undefined ? focus.y : 1.5;
    const cx = fx + Math.sin(yaw) * Math.cos(pitch) * distance;
    const cz = fz + Math.cos(yaw) * Math.cos(pitch) * distance;
    const cy = fy + Math.sin(pitch) * distance + (mode === 'car' ? 1.2 : 0.6);
    const k = 1 - Math.exp(-dt * 7);
    current.x += (cx - current.x) * k;
    current.y += (cy - current.y) * k;
    current.z += (cz - current.z) * k;
    look.x += (fx - look.x) * k;
    look.y += ((fy + 1.2) - look.y) * k;
    look.z += (fz - look.z) * k;
  }

  function apply(camera) {
    camera.position.copy(current);
    camera.lookAt(look);
  }

  return {
    get yaw() { return yaw; },
    set yaw(v) { yaw = v; },
    get photo() { return photo; },
    setPhoto(on) { photo = on; },
    setAerial(x, y, z, lx, ly, lz) {
      aerial = { pos: new THREE.Vector3(x, y, z), look: new THREE.Vector3(lx, ly, lz) };
      current.copy(aerial.pos);
      look.copy(aerial.look);
    },
    clearAerial() { aerial = null; },
    snapBehind(heading) {
      yaw = heading + Math.PI;
      pitch = 0.42;
    },
    update, apply,
  };
}
