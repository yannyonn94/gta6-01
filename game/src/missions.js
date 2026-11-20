// [RONDE 2] Empat misi: curi mobil, kumpul kantong, hilangkan wanted, dan sprint
// jarak jauh sebelum waktu habis. Setiap misi punya objektif, penanda, hadiah.
import { MISSION } from './config.js';

export const MISSIONS = [
  {
    id: 'm1',
    title: 'Kereta Mati',
    briefing: 'Ambil mobil biru di garasi dan bawa ke dermaga.',
    kind: 'steal',
    carColor: 0x2980b9,
    reward: MISSION.rewards[0],
    target: { x: 0, z: -190 },
    start: { x: 60, z: 80 },
  },
  {
    id: 'm2',
    title: 'Kantong Pasir',
    briefing: 'Kumpulkan 3 kantong di blok pasar sebelum polisi tiba.',
    kind: 'collect',
    reward: MISSION.rewards[1],
    count: 3,
    spots: [
      { x: 120, z: 40, taken: false },
      { x: -90, z: 110, taken: false },
      { x: 30, z: -60, taken: false },
    ],
  },
  {
    id: 'm3',
    title: 'Hilang Sejenak',
    briefing: 'Polisi sudah tahu. Turunkan bintang wanted kamu.',
    kind: 'evade',
    reward: MISSION.rewards[2],
    time: 45,
  },
  {
    id: 'm4',
    title: 'Sprint Pantai',
    briefing: 'Tempuh 420 meter sebelum waktu habis, kejar-kejaran boleh.',
    kind: 'race',
    reward: MISSION.rewards[3],
    time: 40,
    distance: MISSION.raceDistance,
    start: { x: 6, z: 40 },
  },
];

export class MissionState {
  constructor() {
    this.index = 0;
    this.active = null;
    this.collected = 0;
    this.timer = 0;
    this.distance = 0;
    this.lastPos = null;
  }

  start(mission) {
    for (const spot of mission.spots ?? []) spot.taken = false;
    this.active = mission;
    this.collected = 0;
    this.timer = mission.time ?? 0;
    this.distance = 0;
    this.lastPos = null;
  }

  next() {
    this.index = Math.min(this.index + 1, MISSIONS.length - 1);
    return MISSIONS[this.index];
  }

  /** Tambah jarak tempuh untuk misi sprint; dipanggil tiap frame. */
  addDistance(pos) {
    if (this.active?.kind !== 'race') return;
    if (this.lastPos) {
      this.distance += Math.hypot(pos.x - this.lastPos.x, pos.z - this.lastPos.z);
    }
    this.lastPos = { x: pos.x, z: pos.z };
  }

  objectiveText(playerPos, wanted) {
    if (!this.active) return 'Misi: —';
    const m = this.active;
    if (m.kind === 'go' || m.kind === 'steal') {
      const d = Math.hypot(playerPos.x - m.target.x, playerPos.z - m.target.z);
      return `${m.title}: ${m.briefing} (${Math.round(d)} m)`;
    }
    if (m.kind === 'collect') {
      return `${m.title}: ${this.collected}/${m.count} kantong (${Math.max(0, Math.ceil(this.timer))} d)`;
    }
    if (m.kind === 'evade') {
      return `${m.title}: turunkan wanted (${wanted > 0 ? `${wanted}★` : 'bersih'})`;
    }
    if (m.kind === 'race') {
      const left = Math.max(0, m.distance - this.distance);
      return `${m.title}: ${Math.round(this.distance)}/${m.distance} m (${Math.max(0, Math.ceil(this.timer))} d)`;
    }
    return m.title;
  }
}
