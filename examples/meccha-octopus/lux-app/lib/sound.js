// Quiet cues made on the fly with Web Audio: no sound files and no loops.
// Soft mallet notes through a short room reverb, the Quantum Team panned left
// and the Challenger right, as they stand in the arena.

// Major pentatonic steps from G4: any two notes sound fine together.
const STEPS = [0, 2, 4, 7, 9, 12, 14, 16];
const ROOT = 392;
const PAN = {qa: -0.8, qb: -0.45, ca: 0.45, cb: 0.8};
const TEAM_PAN = {q: -0.55, c: 0.55};

// A survival streak climbs the scale; a catch drops it back to the root.
const pitch = step => ROOT * 2 ** (STEPS[Math.min(step, STEPS.length - 1)] / 12);

export default class Sound {
  constructor() {
    this.ctx = null;
    this.on = false;
    this.streak = {q: 0, c: 0};
  }

  // Call from a click or change event: browsers only start audio after a gesture.
  enable() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0.22;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      const verb = ctx.createConvolver();
      verb.buffer = this.room(ctx, 1.6);
      const wet = ctx.createGain();
      wet.gain.value = 0.28;
      verb.connect(wet);
      wet.connect(master);
      this.ctx = ctx;
      this.master = master;
      this.verb = verb;
      this.noise = this.whiteNoise(ctx);
    }
    this.ctx.resume();
    this.on = true;
    return true;
  }

  disable() {
    this.on = false;
    this.ctx?.suspend();
  }

  reset() {
    this.streak = {q: 0, c: 0};
  }

  // One round, timed to the arena: lamps click on, the Seeker scans, then each
  // team's verdict. Fast rounds keep only the verdicts, and quieter.
  round({x, y, ink, chal, pace, quiet}) {
    if (!this.on) return;
    const t0 = this.ctx.currentTime + 0.02;
    const s = pace / 1000;
    if (!quiet) {
      if (x) {
        this.click(t0, PAN.qa);
        this.click(t0 + 0.012, PAN.ca);
      }
      if (y) {
        this.click(t0 + 0.025, PAN.qb);
        this.click(t0 + 0.037, PAN.cb);
      }
      this.scan(t0 + 0.45 * s, 0.3 * s);
    }
    const level = quiet ? 0.6 : 1;
    [
      ['q', ink, 1],
      ['c', chal, 0.5]
    ].forEach(([team, r, octave]) => {
      if (!r) return;
      const at = t0 + 0.75 * s + (team === 'c' ? 0.03 : 0);
      if (r.win) {
        this.mallet(pitch(this.streak[team]) * octave, at, {pan: TEAM_PAN[team], gain: 0.32 * level});
        this.streak[team] += 1;
      } else {
        this.thud(at, TEAM_PAN[team], 0.5 * level);
        this.streak[team] = 0;
      }
    });
  }

  // The Quantum Team passes the classical limit: a short rising arpeggio.
  milestone() {
    if (!this.on) return;
    const t0 = this.ctx.currentTime + 0.05;
    [0, 4, 7, 12].forEach((semi, i) => this.mallet(ROOT * 2 ** (semi / 12), t0 + i * 0.09, {gain: 0.3, decay: 1.4}));
  }

  // Round 100: a settled chord when the Quantum Team wins, an open one when luck does.
  final(quantumWins) {
    if (!this.on) return;
    const t0 = this.ctx.currentTime + 0.05;
    const chord = quantumWins ? [0, 7, 12, 16] : [0, 5, 7];
    chord.forEach((semi, i) => this.mallet(ROOT * 2 ** (semi / 12), t0 + i * 0.07, {gain: 0.28, decay: 2.2}));
  }

  // Short stereo noise that fades out, so every cue sounds like it is in one room.
  room(ctx, secs) {
    const len = Math.round(ctx.sampleRate * secs);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buf.getChannelData(c);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    return buf;
  }

  whiteNoise(ctx) {
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  out(pan) {
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(this.master);
    p.connect(this.verb);
    return p;
  }

  // A soft mallet: a sine with two faint overtones, quick attack, gentle decay.
  mallet(freq, at, {pan = 0, gain = 0.3, decay = 0.9} = {}) {
    const c = this.ctx;
    const out = this.out(pan);
    [
      [1, 1],
      [2, 0.18],
      [3.01, 0.06]
    ].forEach(([mult, g]) => {
      const osc = c.createOscillator();
      osc.frequency.value = freq * mult;
      const env = c.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(gain * g, at + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, at + decay / mult);
      osc.connect(env);
      env.connect(out);
      osc.start(at);
      osc.stop(at + decay + 0.05);
    });
  }

  // Caught: a low, muffled knock that drops in pitch.
  thud(at, pan, gain) {
    const c = this.ctx;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, at);
    osc.frequency.exponentialRampToValueAtTime(62, at + 0.2);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const env = c.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain, at + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.38);
    osc.connect(lp);
    lp.connect(env);
    env.connect(this.out(pan));
    osc.start(at);
    osc.stop(at + 0.42);
  }

  // A lamp switching on: a tiny filtered tick.
  click(at, pan) {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 1.2;
    const env = c.createGain();
    env.gain.setValueAtTime(0.12, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    src.connect(bp);
    bp.connect(env);
    env.connect(this.out(pan));
    src.start(at, Math.random() * 0.5, 0.04);
  }

  // The Seeker's scan: breathy noise through a filter that sweeps upward.
  scan(at, dur) {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 4;
    bp.frequency.setValueAtTime(500, at);
    bp.frequency.exponentialRampToValueAtTime(2000, at + dur);
    const env = c.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.06, at + dur * 0.4);
    env.gain.linearRampToValueAtTime(0, at + dur);
    src.connect(bp);
    bp.connect(env);
    env.connect(this.out(0));
    src.start(at, 0, dur + 0.05);
  }
}
