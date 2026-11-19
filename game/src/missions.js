// Missions: three authored jobs with clear objectives, markers and rewards.
// Objective kinds: go (reach a point), steal (bring a car to the drop),
// collect (pick up bags), evade (lose the wanted level).
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
];

export class MissionState {
  constructor() {
    this.index = 0;
    this.active = null;     // mission object when running
    this.collected = 0;
    this.timer = 0;
  }

  /** (Re)start a mission, clearing any pickups left from an earlier attempt. */
  start(mission) {
    for (const spot of mission.spots ?? []) spot.taken = false;
    this.active = mission;
    this.collected = 0;
    this.timer = mission.time ?? 0;
  }

  next() {
    this.index = Math.min(this.index + 1, MISSIONS.length - 1);
    return MISSIONS[this.index];
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
    return m.title;
  }
}
