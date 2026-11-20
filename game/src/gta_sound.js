// [RONDE 5] Audio prosedural WebAudio: tembakan, sirene, mesin, blip, musik,
// klakson, koin, jingle misi, derau hujan, dan sengatan wanted naik.
import { SUARA } from './config.js';

export class SuaraGTA {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musikGain = null;
    this.osMesin = null;
    this.osSirene = null;
    this.nodeHujan = null;
    this.nyalakan = true;
  }

  pastikan() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = SUARA.master;
    this.master.connect(this.ctx.destination);
    this.musikGain = this.ctx.createGain();
    this.musikGain.gain.value = SUARA.musik;
    this.musikGain.connect(this.master);
    return true;
  }

  /** Matikan/nyalakan semua suara (tombol M); kembalikan status nyala. */
  bisukan() {
    this.nyalakan = !this.nyalakan;
    if (!this.nyalakan) {
      this.sirene(false);
      this.mesin(0);
      this.hujan(0);
    }
    return this.nyalakan;
  }

  lanjut() {
    if (!this.pastikan()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  blip(freq = 660, dur = 0.09, tipe = 'square', vol = 0.2) {
    if (!this.pastikan() || !this.nyalakan) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = tipe;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.6), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  tembak() {
    if (!this.pastikan() || !this.nyalakan) return;
    const t = this.ctx.currentTime;
    const dur = 0.22;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = 0.35;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1800;
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  mesin(level) {
    if (!this.pastikan() || !this.nyalakan) return;
    if (!this.osMesin) {
      this.osMesin = this.ctx.createOscillator();
      this.gainMesin = this.ctx.createGain();
      this.osMesin.type = 'sawtooth';
      this.gainMesin.gain.value = 0;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      this.osMesin.connect(lp).connect(this.gainMesin).connect(this.master);
      this.osMesin.start();
    }
    this.gainMesin.gain.setTargetAtTime(Math.min(SUARA.mesinMaks, level * SUARA.mesinMaks), this.ctx.currentTime, 0.08);
    this.osMesin.frequency.setTargetAtTime(60 + level * 130, this.ctx.currentTime, 0.08);
  }

  sirene(on) {
    if (!this.pastikan() || !this.nyalakan) on = false;
    if (on && !this.osSirene) {
      this.osSirene = this.ctx.createOscillator();
      this.gainSirene = this.ctx.createGain();
      this.osSirene.type = 'triangle';
      this.gainSirene.gain.value = 0.09;
      this.osSirene.connect(this.gainSirene).connect(this.master);
      this.osSirene.start();
      this.osLfo = this.ctx.createOscillator();
      this.osLfo.frequency.value = 0.8;
      this.gainLfo = this.ctx.createGain();
      this.gainLfo.gain.value = 220;
      this.osLfo.connect(this.gainLfo).connect(this.osSirene.frequency);
      this.osLfo.start();
    } else if (!on && this.osSirene) {
      try { this.osSirene.stop(); this.osLfo.stop(); } catch {}
      this.osSirene = null;
      this.osLfo = null;
    }
    if (on) this.osSirene.frequency.setTargetAtTime(760, this.ctx.currentTime, 0.05);
  }

  /** Klakson dua nada (H): bunyi pendek 370 Hz lalu 440 Hz. */
  klakson() {
    if (!this.pastikan() || !this.nyalakan) return;
    this.blip(370, 0.14, 'square', 0.22);
    setTimeout(() => this.blip(440, 0.16, 'square', 0.22), 120);
  }

  /** Bunyi koin: dua blip naik (880 lalu 1320 Hz). */
  koin() {
    if (!this.pastikan() || !this.nyalakan) return;
    this.blip(880, 0.09, 'sine', 0.25);
    setTimeout(() => this.blip(1320, 0.14, 'sine', 0.25), 80);
  }

  /** Jingle misi selesai: arpeggio empat nada naik. */
  jingle() {
    if (!this.pastikan() || !this.nyalakan) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.blip(f, 0.16, 'triangle', 0.25), i * 110);
    });
  }

  /** Derau hujan berulang: noise putih lewat lowpass, volume ikut intensitas. */
  hujan(level) {
    if (!this.pastikan() || !this.nyalakan) level = 0;
    if (level > 0.02 && !this.nodeHujan) {
      const dur = 2;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1200;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(f).connect(g).connect(this.master);
      src.start();
      this.nodeHujan = { src, gain: g };
    }
    if (this.nodeHujan) {
      if (level <= 0.02) {
        try { this.nodeHujan.src.stop(); } catch {}
        this.nodeHujan = null;
      } else {
        this.nodeHujan.gain.gain.setTargetAtTime(level * 0.12, this.ctx.currentTime, 0.3);
      }
    }
  }

  /** Sengatan dua nada saat wanted naik: peringatan singkat. */
  sengatanWanted() {
    if (!this.pastikan() || !this.nyalakan) return;
    this.blip(220, 0.12, 'sawtooth', 0.2);
    setTimeout(() => this.blip(330, 0.16, 'sawtooth', 0.2), 130);
  }

  musik(on) {
    if (!this.pastikan()) return;
    if (on && !this.nodeMusik) {
      const nada = [110, 130.81, 146.83, 164.81];
      this.nodeMusik = nada.map((f, i) => {
        const o = this.ctx.createOscillator();
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        const g = this.ctx.createGain();
        g.gain.value = 0.05;
        o.connect(g).connect(this.musikGain);
        o.start();
        return o;
      });
    } else if (!on && this.nodeMusik) {
      this.nodeMusik.forEach((o) => { try { o.stop(); } catch {} });
      this.nodeMusik = null;
    }
  }
}
