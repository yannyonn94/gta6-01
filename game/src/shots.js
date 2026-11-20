// Mode shot: membaca ?shot=...&seed=N dan menata scene yang jelas, termasuk
// jam dalam sehari, supaya screenshot adalah render asli kode game.
export function readShotQuery() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot') ?? '',
    seed: Number(q.get('seed') ?? '1') || 1,
    hour: q.get('hour') === null ? null : Number(q.get('hour')),
  };
}

/** Tata scene yang diminta. Mengembalikan deskripsi singkat untuk konsol. */
export function stageShot(name, ctx) {
  const { player, camera, traffic, police, pedestrians, cityHalf, hud, overlay, daynight } = ctx;
  if (overlay) overlay.classList.add('hidden');

  const setHour = (h) => { if (daynight) daynight.setHour(h); };

  switch (name) {
    case 'start':
      // Pemandangan tinggi siang hari: jalan, blok, dan pantai.
      setHour(11);
      camera.position.set(0, 150, 230);
      camera.lookAt(0, 0, 0);
      if (hud) hud.show(true);
      return 'start';
    case 'play': {
      // Over-the-shoulder di tengah jalan, ada mobil dan pejalan kaki.
      setHour(10);
      player.pos.set(6, 0, 40);
      player.group.position.copy(player.pos);
      player.group.rotation.y = Math.PI * 0.15;
      player.speed = 5.2;
      player.walkPhase = 1.2;
      player.animate();
      camera.position.set(7.6, 2.8, 34.2);
      camera.lookAt(6.4, 1.6, 46);
      if (hud) hud.show(true);
      if (hud) hud.setObjective('Misi: Kereta Mati — Ambil mobil biru di garasi dan bawa ke dermaga. (42 m)');
      if (hud) hud.setClock(daynight ? daynight.clockText() : '10:00', false);
      return 'play';
    }
    case 'chase': {
      // Wanted 3 bintang, cruiser mengejar di jalan, senja.
      setHour(18.5);
      const cx = 6, cz = -20;
      player.pos.set(cx, 0, cz);
      player.group.position.copy(player.pos);
      player.group.rotation.y = Math.PI;
      police.forEach((p, i) => {
        p.group.visible = true;
        p.pos.set(cx + (i - 2) * 3.4, 0, cz - 9 - i * 5);
        p.group.position.copy(p.pos);
        p.heading = Math.PI;
        p.speed = 8;
      });
      camera.position.set(cx + 1.8, 3.0, cz + 7.5);
      camera.lookAt(cx, 1.4, cz - 12);
      if (hud) hud.show(true);
      if (hud) hud.setWanted(3);
      if (hud) hud.setObjective('Misi: Hilang Sejenak — Polisi sudah tahu. Turunkan bintang wanted kamu.');
      if (hud) hud.setClock(daynight ? daynight.clockText() : '18:30', false);
      return 'chase';
    }
    case 'drive': {
      // Kamera kejar di belakang mobil, senja.
      setHour(18.2);
      const car = traffic[0];
      player.enterCar(car);
      car.driver = 'player';
      car.pos.set(6, 0, -60);
      car.heading = 0;
      car.speed = 12;
      car.group.position.copy(car.pos);
      camera.position.set(6, 4.0, -68);
      camera.lookAt(6, 0.9, -50);
      if (hud) hud.show(true);
      if (hud) hud.setObjective('Misi: Sprint Pantai — Tempuh 420 meter sebelum waktu habis.');
      if (hud) hud.setClock(daynight ? daynight.clockText() : '18:12', false);
      if (hud) hud.setSpeed(car.speed, true);
      if (hud) hud.setCar('Sedan Kota');
      return 'drive';
    }
    case 'end':
      // Malam hari di atas kota: lampu menyala.
      setHour(22);
      camera.position.set(-40, 90, 260);
      camera.lookAt(0, 10, 0);
      if (hud) hud.show(true);
      if (hud) hud.setClock(daynight ? daynight.clockText() : '22:00', true);
      return 'end';
    default:
      return 'none';
  }
}
