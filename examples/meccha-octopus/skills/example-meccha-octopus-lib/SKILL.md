---
name: example-meccha-octopus-lib
description: "TEST CASE ONLY: Original Meccha Octopus source and porting rules, part 1: lib/game.js, lib/octo-art.js, lib/sound.js, theme.js and CSS. Invoke when porting or building the Meccha Octopus Lux UI."
---

# example-meccha-octopus-lib (test case only)
This skill belongs to the Meccha Octopus test case. Do not use it for other apps.
PORTING RULES (apply to every file below):
1. This is the reference source of the original Meccha Octopus Lux app. Port it into the new Lux UI app at the same relative paths, behaving the same.
2. Remove the world model: do NOT create octo-lab.js, do not use three or @sparkjsdev/spark, and delete worldView, labFailed, showTags, the "World model view" toggle, the "Octopus tags" toggle and the "World model unavailable" message from page.js. Always render <octo-arena>. Keep the Sound toggle.
3. POOL_URL must be '/api/x_snc_meccha_oct_1/meccha_octopus_ba/pool' (the Fluent app's Scripted REST API). Response shape: {source, backend, qubits, shots, inkSurvival, sets: {"x,y": "ab ab ..."}}. The response has no ibmJobId, status, ranAt, resultHash or circuits, so make octo-proof tolerate missing fields.
4. Keep the customElement tag names for child components (octo-arena, octo-picker, octo-proof, octo-scoreboard). Name the page element by the Lux app scope convention (x-<scope with dashes>-home-page).
5. Dependencies to keep in package.json: lit, d3-delaunay, d3-scale, d3-shape, @servicenow/aiux. Remove three and @sparkjsdev/spark.
6. Components extend AIUXElement, use isServer guards, i18n.getMessage for strings, Tailwind and DaisyUI classes (aiux- prefix), as in the source.


=== FILE: lib/game.js ===
// Pure game logic for Meccha Octopus. No DOM, no network, so it renders and
// tests the same on server and client.

// Survive when a XOR b equals x AND y.
export const survives = (x, y, a, b) => (a ^ b) === (x & y);

// A classical octopus sees one bit and has four moves.
export const MOVES = [
  {id: 'camo', label: 'Always camo', fn: () => 0},
  {id: 'bold', label: 'Always bold', fn: () => 1},
  {id: 'copy', label: 'Copy the light', fn: light => light},
  {id: 'flip', label: 'Flip the light', fn: light => 1 - light}
];

// 16 strategies: Octo A's move by Octo B's move. Each wins exactly 75% or 25%.
export const strategyId = (iA, iB) => `${MOVES[iA].id}+${MOVES[iB].id}`;

export const play = (iA, iB, x, y) => {
  const a = MOVES[iA].fn(x);
  const b = MOVES[iB].fn(y);
  return {a, b, win: survives(x, y, a, b)};
};

// Exact win rate over the four light settings.
export const exactRate = (iA, iB) => {
  let wins = 0;
  for (const x of [0, 1]) {
    for (const y of [0, 1]) wins += play(iA, iB, x, y).win ? 1 : 0;
  }
  return wins / 4;
};

// Small seeded generator so a match is repeatable and both teams see the same lights.
export const rng = seed => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
};

// Reads the shot pool: sets["x,y"] is "ab ab ab ...". Wraps at the end.
export const makeInk = pool => {
  const cursor = {};
  const sets = {};
  for (const [k, v] of Object.entries(pool?.sets || {})) sets[k] = v.split(' ');
  return (x, y) => {
    const key = `${x},${y}`;
    const list = sets[key];
    if (!list?.length) return null;
    const i = cursor[key] || 0;
    cursor[key] = i + 1;
    const token = list[i % list.length];
    return {a: Number(token[0]), b: Number(token[1]), idx: i % list.length};
  };
};

export const CLASSICAL_CEILING = 0.75;
export const QUANTUM_CEILING = Math.cos(Math.PI / 8) ** 2;

// Pre-written taunt bands, picked by code from the final rate.
export const tauntBand = rate => {
  if (rate >= 0.7) return 'top';
  if (rate >= 0.45) return 'mid';
  return 'low';
};


=== FILE: lib/octo-art.js ===
// Line-art octopus: a triangulated mesh head and ladder-mesh tentacles, plus
// googly eyes. Pure geometry, no DOM, so it renders the same on server and client.
// Local box is 200 x 270. The head mesh is fixed per seed; tentacles take a
// phase so they can sway without changing their topology.
import {Delaunay} from 'd3-delaunay';
import {rng} from './game.js';

const HEAD = {x: 100, y: 78, r: 60};
const ROWS = 11;
const MAX_EDGE = 34;

// Root x positions under the head, outermost first, and how far each one swings out.
const ROOTS = [
  {x: 58, spread: -46, curl: -1},
  {x: 76, spread: -24, curl: -1},
  {x: 92, spread: -8, curl: 1},
  {x: 108, spread: 8, curl: -1},
  {x: 124, spread: 24, curl: 1},
  {x: 142, spread: 46, curl: 1}
];

const bezier = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  ];
};

// Left and right rails of one tentacle. Row 0 sits inside the head mesh.
const tentacleRails = (root, phase, index) => {
  const sway = Math.sin(phase + index * 1.3) * 7;
  const outer = Math.abs(root.spread) > 30;
  const p0 = [root.x, 132];
  const p1 = [root.x + root.spread * 0.15, 178];
  const p2 = [root.x + root.spread * 1.0 + sway * 0.6, 222];
  const p3 = [root.x + root.spread * 1.15 + root.curl * 24 + sway, outer ? 226 : 258 - Math.abs(root.spread) * 0.3];
  const left = [];
  const right = [];
  for (let i = 0; i < ROWS; i++) {
    const t = i / (ROWS - 1);
    const c = bezier(p0, p1, p2, p3, t);
    const n = bezier(p0, p1, p2, p3, Math.min(1, t + 0.02));
    const dx = n[0] - c[0];
    const dy = n[1] - c[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = 9 * (1 - t) ** 0.8 + 1.5;
    left.push([c[0] - (dy / len) * w, c[1] + (dx / len) * w]);
    right.push([c[0] + (dy / len) * w, c[1] - (dx / len) * w]);
  }
  return {left, right};
};

const insideHead = (x, y, pad = 0) => Math.hypot(x - HEAD.x, y - HEAD.y) <= HEAD.r + pad;

// Fixed head mesh for a seed: rim, inner ring, scattered interior points and the
// tentacle root row, Delaunay triangulated once and trimmed to the head shape.
// Triangles are stored as point indexes so each frame can move the points.
const headMesh = seed => {
  const rand = rng(seed);
  const pts = [];
  const ring = (count, scale, jitter) => {
    for (let i = 0; i < count; i++) {
      const a = ((i + (scale < 1 ? 0.5 : 0)) / count) * Math.PI * 2 + (rand() - 0.5) * jitter;
      const r = HEAD.r * scale * (1 + (rand() - 0.5) * 0.04);
      pts.push([HEAD.x + Math.cos(a) * r, HEAD.y + Math.sin(a) * r]);
    }
  };
  ring(26, 1, 0.1);
  const rimCount = pts.length;
  ring(16, 0.66, 0.25);
  for (let tries = 0; pts.length < rimCount + 30 && tries < 3000; tries++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * HEAD.r * 0.85;
    const p = [HEAD.x + Math.cos(a) * r, HEAD.y + Math.sin(a) * r];
    if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 15)) pts.push(p);
  }
  const fixedFrom = pts.length;
  ROOTS.forEach((root, i) => {
    const {left, right} = tentacleRails(root, 0, i);
    pts.push(left[0], right[0]);
  });
  const tri = Delaunay.from(pts).triangles;
  const triangles = [];
  for (let i = 0; i < tri.length; i += 3) {
    const idx = [tri[i], tri[i + 1], tri[i + 2]];
    const t = idx.map(k => pts[k]);
    const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
    const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
    const longest = Math.max(
      Math.hypot(t[0][0] - t[1][0], t[0][1] - t[1][1]),
      Math.hypot(t[1][0] - t[2][0], t[1][1] - t[2][1]),
      Math.hypot(t[2][0] - t[0][0], t[2][1] - t[0][1])
    );
    if (longest > MAX_EDGE) continue;
    if (!insideHead(cx, cy, 2) && cy < HEAD.y) continue;
    if (!insideHead(cx, cy, 2) && (cy > 140 || cx < 50 || cx > 150)) continue;
    triangles.push(idx);
  }
  const grey = pts.map(() => rand() < 0.28);
  return {pts, triangles, grey, rimCount, fixedFrom};
};

const meshCache = new Map();

// Each head node drifts on its own slow loop so the mesh lines stretch and
// breathe. Rim nodes move less to keep the outline round; root nodes stay put
// so the head stays joined to the tentacles.
const drift = (head, phase) =>
  head.pts.map((p, i) => {
    if (i >= head.fixedFrom) return p;
    const amp = i < head.rimCount ? 1.2 : 3;
    return [p[0] + Math.sin(phase * 1.7 + i * 2.1) * amp, p[1] + Math.cos(phase * 1.3 + i * 1.7) * amp];
  });

// Full octopus for one frame. `phase` drives the mesh drift and tentacle sway,
// `look` (-1..1) moves the pupils.
export const octopus = ({seed = 7, phase = 0, look = 0} = {}) => {
  if (!meshCache.has(seed)) meshCache.set(seed, headMesh(seed));
  const head = meshCache.get(seed);
  const pts = drift(head, phase);
  const edges = new Map();
  const addEdge = (a, b, w) => {
    const key = a[0] < b[0] ? `${a}|${b}` : `${b}|${a}`;
    if (!edges.has(key)) edges.set(key, [a[0], a[1], b[0], b[1], w]);
  };
  const fills = head.triangles.map(idx => idx.map(k => pts[k]));
  fills.forEach(t => {
    addEdge(t[0], t[1], 1);
    addEdge(t[1], t[2], 1);
    addEdge(t[2], t[0], 1);
  });
  const nodes = pts.map((p, i) => ({x: p[0], y: p[1], grey: head.grey[i]}));
  ROOTS.forEach((root, ti) => {
    const {left, right} = tentacleRails(root, phase, ti);
    for (let i = 1; i < ROWS; i++) {
      addEdge(left[i - 1], left[i], 1.2);
      addEdge(right[i - 1], right[i], 1.2);
      addEdge(left[i], right[i], 0.8);
      if (i % 2) addEdge(left[i - 1], right[i], 0.6);
      else addEdge(right[i - 1], left[i], 0.6);
      fills.push([left[i - 1], right[i - 1], right[i], left[i]]);
      nodes.push({x: left[i][0], y: left[i][1], grey: (i + ti) % 3 === 0});
      nodes.push({x: right[i][0], y: right[i][1], grey: (i + ti) % 4 === 0});
    }
    // Tentacle tip.
    nodes.push({x: (left[ROWS - 1][0] + right[ROWS - 1][0]) / 2, y: (left[ROWS - 1][1] + right[ROWS - 1][1]) / 2, grey: false, tip: true});
  });
  const p = look * 4;
  return {
    edges: [...edges.values()],
    nodes,
    fills,
    eyes: [
      {x: 78, y: 80, r: 16, px: 78 + p, py: 84},
      {x: 122, y: 80, r: 16, px: 122 + p, py: 84}
    ]
  };
};


=== FILE: lib/sound.js ===
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


=== FILE: theme.js ===
export const AppTheme = {
  primary_color: '#032D42',
  neutral_colors: {
    use_hex_value: true,
    hex_value: '#F8F7F4'
  },
  shape: {
    selector_radius: '0.75rem',
    field_radius: '0.5rem',
    boxes_radius: '1rem',
    border_width: '1px'
  }
};


=== FILE: head.app.css ===
/**
 * Application head CSS.
 *
 * Unlike tailwind.app.css (adopted into every component's shadow root via
 * adoptedStyleSheets), this file is linked directly into the document
 * <head> — see core/sdk/src/build-runtime-manifest/build-app-head-css.js.
 * Use it for CSS that must be registered once, document-wide: most notably
 * @font-face, which needs to apply to every shadow root without being
 * duplicated into each one's adopted stylesheet.
 *
 * url(...) / @import references must be absolute (CDN, data: URI, or an
 * already-served path) — you can leverage the ./public directory to serve
 * fonts as seen in the example below. Supported font formats: woff, woff2,
 * ttf, otf.
 *
 * To actually apply an imported/declared font, pair this with a
 * --font-sans / --font-mono token override in
 * tailwind.app.css (see the example there) — those tokens are what each
 * component's shadow-scoped Tailwind sheet reads from.
 */

/* Example: register a custom font, then point the font tokens in
tailwind.app.css at it to apply it app-wide.

@font-face {
  font-family: 'MyFont';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(/aiux/meccha-octopus/public/fonts/MyFont.woff2) format('woff2');
}
*/


=== FILE: tailwind.app.css ===
/**
 * Application Tailwind extensions.
 *
 * Merged into the app's Tailwind delta sheet at build time.
 * Supported directives:
 *
 *   @source inline("...")     — additional class safelists
 *   @layer utilities { ... }  — new and overriding utility classes
 *
 * Do NOT add @import "tailwindcss" here — the build entry already includes it.
 * Do NOT add @theme { ... } here — it is stripped by the build process.
 * 
 * Note:
 * Theme-level token overrides are also possible via theme.token_overrides
 * Override precedence is theme < app: this app-level sheet is adopted above
 * the base platform sheet, so any app-level override here wins over the same token 
 * set at the theme level. Set app-level token overrides deliberately; they cannot be
 * overridden by the theme.
 */

/* Example: declare a custom app layer above utilities so app overrides
always win the cascade, even though the app delta sheet is adopted before
the base platform sheet.

@layer utilities, my-app;

@layer my-app {
  :host {
    --my-app-button-bg: #007bff;
    --my-font: 'MyFont';
    --font-sans: var(--my-font);
  }

  .aiux-btn {
    background-color: var(--my-app-button-bg);
  }
}
*/
