// HUD: wanted stars, cash, health bar, objective text and the minimap canvas.
import { CITY } from './config.js';

export class Hud {
  constructor() {
    this.root = document.getElementById('hud');
    this.wantedEl = document.getElementById('wanted');
    this.cashEl = document.getElementById('cash');
    this.objectiveEl = document.getElementById('objective');
    this.msgEl = document.getElementById('msg');
    this.healthEl = document.querySelector('#healthbar > div');
    this.mapCanvas = document.getElementById('minimap');
    this.mapCtx = this.mapCanvas.getContext('2d');
    this.msgTimer = 0;
  }

  show(on) { this.root.classList.toggle('on', on); }

  setWanted(level) {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < level ? '★' : '☆';
    this.wantedEl.textContent = s;
    this.wantedEl.style.color = level >= 3 ? '#ff6b6b' : level > 0 ? '#f2c94c' : '#8b93a3';
  }

  setCash(v) { this.cashEl.textContent = `$${Math.round(v)}`; }
  setHealth(v) { this.healthEl.style.width = `${Math.max(0, Math.min(100, v))}%`; }
  setObjective(text) { this.objectiveEl.textContent = text; }

  flash(text, seconds = 2.4) {
    this.msgEl.textContent = text;
    this.msgEl.style.opacity = '1';
    this.msgTimer = seconds;
  }

  update(dt) {
    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0) this.msgEl.style.opacity = '0';
    }
  }

  /** draw a top-down minimap: roads, player arrow, police blips, mission marker */
  drawMinimap(playerPos, playerHeading, half, police, marker) {
    const ctx = this.mapCtx;
    const size = this.mapCanvas.width;
    const scale = size / (half * 2.2);
    const toMap = (x, z) => [size / 2 + x * scale, size / 2 + z * scale];

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(10,14,18,.85)';
    ctx.fillRect(0, 0, size, size);

    // road grid
    ctx.strokeStyle = 'rgba(200,205,215,.28)';
    ctx.lineWidth = 2;
    const step = CITY.block + CITY.roadWidth;
    for (let i = 0; i <= CITY.grid; i++) {
      const c = -half + i * step + 6;
      const [x1, y1] = toMap(c, -half);
      const [x2, y2] = toMap(c, half);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const [a1, b1] = toMap(-half, c);
      const [a2, b2] = toMap(half, c);
      ctx.beginPath(); ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.stroke();
    }

    // mission marker
    if (marker) {
      const [mx, my] = toMap(marker.x, marker.z);
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill();
    }

    // police
    ctx.fillStyle = '#4d8dff';
    for (const p of police) {
      const [px, py] = toMap(p.pos.x, p.pos.z);
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }

    // player arrow
    const [px, py] = toMap(playerPos.x, playerPos.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(Math.sin(playerHeading), Math.cos(playerHeading)) * -1 + Math.PI);
    ctx.fillStyle = '#9fe3a0';
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
