// [REVISI thinking_revised] Procedural audio: every sound is synthesized with WebAudio, no files.
export class GtaSound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.engineOsc = null;
    this.sirenOsc = null;
    this.enabled = true;
  }

  ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.master);
    return true;
  }

  resume() {
    if (!this.ensure()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  /** short percussive blip for UI / pickups */
  blip(freq = 660, dur = 0.09, type = 'square', vol = 0.2) {
    if (!this.ensure() || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.6), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** noise burst for a gunshot */
  shot() {
    if (!this.ensure() || !this.enabled) return;
    const t = this.ctx.currentTime;
    const len = 0.22;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * len), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
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

  /** continuous engine tone, pitch follows speed */
  engine(level) {
    if (!this.ensure() || !this.enabled) return;
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineGain.gain.value = 0;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      this.engineOsc.connect(lp).connect(this.engineGain).connect(this.master);
      this.engineOsc.start();
    }
    const target = Math.min(0.16, level * 0.16);
    this.engineGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
    this.engineOsc.frequency.setTargetAtTime(60 + level * 130, this.ctx.currentTime, 0.08);
  }

  /** police siren while wanted > 0 */
  siren(on) {
    if (!this.ensure() || !this.enabled) { on = false; }
    if (on && !this.sirenOsc) {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenOsc.type = 'triangle';
      this.sirenGain.gain.value = 0.09;
      this.sirenOsc.connect(this.sirenGain).connect(this.master);
      this.sirenOsc.start();
      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfo.frequency.value = 0.8;
      this.sirenLfoGain = this.ctx.createGain();
      this.sirenLfoGain.gain.value = 220;
      this.sirenLfo.connect(this.sirenLfoGain).connect(this.sirenOsc.frequency);
      this.sirenLfo.start();
    } else if (!on && this.sirenOsc) {
      try { this.sirenOsc.stop(); this.sirenLfo.stop(); } catch {}
      this.sirenOsc = null;
      this.sirenLfo = null;
    }
    if (on) this.sirenOsc.frequency.setTargetAtTime(760, this.ctx.currentTime, 0.05);
  }

  music(on) {
    if (!this.ensure()) return;
    if (on && !this.musicNodes) {
      const notes = [110, 130.81, 146.83, 164.81];
      this.musicNodes = notes.map((f, i) => {
        const o = this.ctx.createOscillator();
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        const g = this.ctx.createGain();
        g.gain.value = 0.05;
        o.connect(g).connect(this.musicGain);
        o.start();
        return o;
      });
    } else if (!on && this.musicNodes) {
      this.musicNodes.forEach((o) => { try { o.stop(); } catch {} });
      this.musicNodes = null;
    }
  }
}
