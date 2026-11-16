// Tiny synthesised soundtrack: drone + chimes + finale chord. No samples.
export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.droneStarted = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.32;
    this.master.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  startDrone() {
    if (!this.ctx || this.droneStarted) return;
    this.droneStarted = true;
    const t = this.ctx.currentTime;
    const bus = this.ctx.createGain();
    bus.gain.value = 0.0;
    bus.gain.linearRampToValueAtTime(0.05, t + 4.0);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 240;
    filter.Q.value = 3;
    bus.connect(filter);
    filter.connect(this.master);

    const freqs = [55, 82.41, 110.0, 164.81];
    freqs.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = i % 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 6;
      const g = this.ctx.createGain();
      g.gain.value = 0.22 / (i + 1);
      o.connect(g); g.connect(bus);
      o.start(t);
    });

    // slow breathing of the filter
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lg = this.ctx.createGain();
    lg.gain.value = 90;
    lfo.connect(lg); lg.connect(filter.frequency);
    lfo.start(t);

    // air
    const len = 4 * this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last += 0.02 * (Math.random() * 2 - 1 - last);
      d[i] = last;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const ng = this.ctx.createGain();
    ng.gain.value = 0.18;
    src.connect(ng); ng.connect(bus);
    src.start(t);
  }

  chime(index = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const scale = [587.33, 698.46, 880.0, 1046.5, 1174.66, 1396.91];
    const f = scale[index % scale.length];
    [1, 2.01, 3.0].forEach((h, k) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * h;
      const g = this.ctx.createGain();
      const amp = [0.16, 0.05, 0.02][k];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6 / h);
      const pan = this.ctx.createStereoPanner();
      pan.pan.value = (Math.random() - 0.5) * 0.5;
      o.connect(g); g.connect(pan); pan.connect(this.master);
      o.start(t); o.stop(t + 3.0);
    });
  }

  thud() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 1.0);
  }

  finale() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const notes = [293.66, 440.0, 587.33, 739.99, 880.0];
    notes.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.07, t + i * 0.08 + 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 7.0);
      o.connect(g); g.connect(this.master);
      o.start(t + i * 0.08); o.stop(t + 7.5);
    });
  }

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.32;
    return this.muted;
  }
}
