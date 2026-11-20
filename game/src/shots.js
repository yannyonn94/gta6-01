// Shot mode: reads ?shot=...&seed=N from the URL and stages a readable scene,
// so screenshots are real renders of this game's own code.
export function readShotQuery() {
  const q = new URLSearchParams(window.location.search);
  return { shot: q.get('shot') ?? '', seed: Number(q.get('seed') ?? '1') || 1 };
}

/** Stage the requested scene. Returns a short description for the console. */
export function stageShot(name, ctx) {
  const { player, camera, traffic, police, pedestrians, cityHalf, hud, overlay } = ctx;
  // Hide the title card so the city itself is the subject of the shot.
  if (overlay) overlay.classList.add('hidden');
  switch (name) {
    case 'start':
      // high vantage over the whole grid: roads, blocks and coast
      camera.position.set(0, 150, 230);
      camera.lookAt(0, 0, 0);
      if (hud) hud.show(true);
      return 'start';
    case 'play': {
      // over-the-shoulder on foot, mid-street, traffic and peds around
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
      return 'play';
    }
    case 'chase': {
      // wanted level: cruisers closing in behind the player on a road
      const cx = 6, cz = -20;                       // on the north-south road at x=6
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
      return 'chase';
    }
    case 'drive': {
      // chase cam behind a moving car on a road
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
      if (hud) hud.setObjective('Misi: Kereta Mati — Ambil mobil biru di garasi dan bawa ke dermaga. (152 m)');
      return 'drive';
    }
    case 'end':
      // dusk view over the city from the coast
      camera.position.set(-40, 90, 260);
      camera.lookAt(0, 10, 0);
      if (hud) hud.show(true);
      return 'end';
    default:
      return 'none';
  }
}
