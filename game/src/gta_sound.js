// gta_sound.js — suara Kota Karang, semuanya disintesis dengan WebAudio.
// Tanpa file audio: dengung mesin, klakson, tembakan, derai hujan,
// jingle misi, dan bunyi tabrakan. Audio baru hidup setelah gestur
// pengguna; dalam mode staging screenshot suara tetap diam.
var KKSound = {
  ctx: null,
  muted: false,
  _engineOsc: null,
  _engineGain: null,
  _rainNode: null,
  _rainGain: null,
  _ready: false,

  init: function () {
    if (this._ready) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this._ready = true;
      // Dengung mesin: osilator gergaji rendah lewat lowpass
      this._engineOsc = this.ctx.createOscillator();
      this._engineOsc.type = 'sawtooth';
      this._engineOsc.frequency.value = 55;
      this._engineGain = this.ctx.createGain();
      this._engineGain.gain.value = 0;
      var filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 320;
      this._engineOsc.connect(filt);
      filt.connect(this._engineGain);
      this._engineGain.connect(this.ctx.destination);
      this._engineOsc.start();
      // Hujan: noise putih berulang lewat lowpass
      var len = this.ctx.sampleRate * 2;
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      var rfilt = this.ctx.createBiquadFilter();
      rfilt.type = 'lowpass';
      rfilt.frequency.value = 900;
      this._rainGain = this.ctx.createGain();
      this._rainGain.gain.value = 0;
      src.connect(rfilt);
      rfilt.connect(this._rainGain);
      this._rainGain.connect(this.ctx.destination);
      src.start();
      this._rainNode = src;
    } catch (e) {
      this._ready = false;
    }
  },

  resume: function () {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  setMuted: function (m) {
    this.muted = m;
    if (this.ctx) this.ctx.destination.gain ? null : null;
    if (this._engineGain) this._engineGain.gain.value = m ? 0 : this._engineGain.gain.value;
    if (this._rainGain && m) this._rainGain.gain.value = 0;
  },

  engine: function (load) {
    if (!this._ready || this.muted || !this._engineOsc) return;
    this._engineOsc.frequency.value = 48 + load * 90;
    this._engineGain.gain.value = 0.02 + load * 0.05;
  },

  engineOff: function () {
    if (this._engineGain) this._engineGain.gain.value = 0;
  },

  _beep: function (freq, dur, type, vol) {
    if (!this._ready || this.muted) return;
    try {
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.12, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + dur);
    } catch (e) { /* suara opsional */ }
  },

  horn: function () {
    this._beep(370, 0.28, 'square', 0.14);
    var self = this;
    setTimeout(function () { self._beep(370, 0.22, 'square', 0.1); }, 90);
  },

  shot: function () {
    if (!this._ready || this.muted) return;
    try {
      var len = this.ctx.sampleRate * 0.12;
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var g = this.ctx.createGain();
      g.gain.value = 0.3;
      src.connect(g);
      g.connect(this.ctx.destination);
      src.start();
    } catch (e) { /* abaikan */ }
  },

  crash: function () {
    this._beep(90, 0.3, 'sawtooth', 0.22);
  },

  pickup: function () {
    this._beep(880, 0.12, 'sine', 0.14);
    var self = this;
    setTimeout(function () { self._beep(1318, 0.16, 'sine', 0.12); }, 90);
  },

  jingle: function () {
    var notes = [523, 659, 784, 1046];
    var self = this;
    notes.forEach(function (n, i) {
      setTimeout(function () { self._beep(n, 0.22, 'triangle', 0.16); }, i * 130);
    });
  },

  rain: function (on) {
    if (!this._ready || !this._rainGain) return;
    if (this.muted) { this._rainGain.gain.value = 0; return; }
    this._rainGain.gain.value = on ? 0.05 : 0;
  },

  // Sirene polisi dua nada; dipanggil tiap detik saat buronan 3 ke atas.
  _sirenAt: 0,
  siren: function (nowMs) {
    if (!this._ready || this.muted) return;
    if (nowMs - this._sirenAt < 900) return;
    this._sirenAt = nowMs;
    this._beep(660, 0.32, 'sine', 0.07);
    var self = this;
    setTimeout(function () { self._beep(520, 0.32, 'sine', 0.07); }, 340);
  }
};
