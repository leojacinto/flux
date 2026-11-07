import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {octopus} from '../../../lib/octo-art.js';

// Logical canvas size. Everything below is drawn in these units and scaled to fit.
const W = 1000;
const H = 430;

const LINE = '#1d2530';
const GREY = '#8a929a';
const CAMO = '#6f8f7d';
const BOLD = '#e8467c';
const LIT_ROOM = '#fff4cf';
const DARK_ROOM = '#dfe4ea';
const FLOOR = '#f6f4ef';
const HALL = '#ece8df';
const LAMP = '#ffcf3a';
const OK = '#1f9d63';
const BAD = '#d92d20';

const ROOM_W = 215;
const ROOM_TOP = 44;
const ROOM_H = 238;
const CORRIDOR = {x: 20, y: 302, w: 960, h: 112};
const OCTO_SCALE = 0.6;
const WALK_MS = 1400;

// Four rooms: Quantum Team on the left, Challenger on the right. The wall
// between each pair of rooms is the isolation: nothing crosses it.
const ROOMS = [
  {team: 'q', who: 'a', x: 24, seed: 7},
  {team: 'q', who: 'b', x: 269, seed: 11},
  {team: 'c', who: 'a', x: 516, seed: 23},
  {team: 'c', who: 'b', x: 761, seed: 31}
];

const LOBBY = [430, 470, 530, 570];

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = t => Math.max(0, Math.min(1, t));

// Round timeline, as fractions of the round's pace.
const FLINCH_END = 0.15;
const RIPPLE_START = 0.08;
const RIPPLE_END = 0.5;
const SCAN_START = 0.45;
const SCAN_END = 0.75;

@customElement('octo-arena')
export default class OctoArena extends AIUXElement {
  static properties = {
    // Each team: {x, y, a, b, win} for the current round, or null before play.
    ink: {attribute: false},
    challenger: {attribute: false},
    challengerName: {type: String},
    round: {type: Number},
    pace: {type: Number},
    matchId: {type: Number}
  };

  static styles = css`
    :host {
      display: block;
    }
    canvas {
      display: block;
      width: 100%;
      aspect-ratio: 1000 / 430;
    }
  `;

  constructor() {
    super();
    this.ink = null;
    this.challenger = null;
    this.challengerName = '';
    this.round = 0;
    this.pace = 900;
    this.matchId = 0;
    this._paint = {};
    this._prevPaint = {};
    this._roundStart = -1e9;
    this._walkStart = 0;
    this._raf = 0;
  }

  firstUpdated() {
    this._canvas = this.renderRoot.querySelector('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._resize = new ResizeObserver(() => this.fit());
    this._resize.observe(this._canvas);
    this.fit();
    this._walkStart = performance.now();
    const loop = now => {
      this.draw(now);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._resize?.disconnect();
  }

  updated(changed) {
    if (!this._canvas) return;
    if (changed.has('matchId') && this.matchId > 0) {
      this._walkStart = performance.now();
      this._paint = {};
      this._prevPaint = {};
    }
    if (changed.has('round')) {
      this._prevPaint = {...this._paint};
      this._paint = {};
      const set = (team, s) => {
        if (!s) return;
        this._paint[`${team}a`] = s.a;
        this._paint[`${team}b`] = s.b;
      };
      set('q', this.ink);
      set('c', this.challenger);
      this._roundStart = this.round > 0 ? performance.now() : -1e9;
    }
  }

  fit() {
    const dpr = window.devicePixelRatio || 1;
    const w = this._canvas.clientWidth;
    this._canvas.width = Math.round(w * dpr);
    this._canvas.height = Math.round((w * H * dpr) / W);
    this._scale = (w * dpr) / W;
  }

  teamState(team) {
    return team === 'q' ? this.ink : this.challenger;
  }

  lit(room) {
    const s = this.teamState(room.team);
    if (!s) return false;
    return (room.who === 'a' ? s.x : s.y) === 1;
  }

  // Where an octopus is: jet-swimming in from the lobby, or settled in its room.
  place(room, i, now) {
    const home = {x: room.x + ROOM_W / 2, y: ROOM_TOP + 150};
    const t = this._reduced?.matches ? 1 : clamp01((now - this._walkStart - i * 120) / WALK_MS);
    if (t >= 1) return {...home, rot: 0, stretch: 0};
    const door = {x: room.x + ROOM_W / 2, y: CORRIDOR.y + 10};
    const lobby = {x: LOBBY[i], y: CORRIDOR.y + 64};
    const e = ease(t);
    const leg1 = 0.45;
    const from = e < leg1 ? lobby : door;
    const to = e < leg1 ? door : home;
    const k = e < leg1 ? e / leg1 : (e - leg1) / (1 - leg1);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // Jet swimming: the head pulses long and short and leans into the motion.
    return {
      x: from.x + dx * k,
      y: from.y + dy * k,
      rot: Math.atan2(dx, -dy) * 0.6,
      stretch: Math.abs(Math.sin(t * Math.PI * 4)) * 0.18
    };
  }

  draw(now) {
    const ctx = this._ctx;
    if (!ctx) return;
    const reduced = this._reduced?.matches;
    ctx.setTransform(this._scale, 0, 0, this._scale, 0, 0);
    ctx.fillStyle = FLOOR;
    ctx.fillRect(0, 0, W, H);
    const rt = reduced ? 1 : (now - this._roundStart) / Math.max(this.pace, 1);
    this.drawMap(ctx);
    const seeker = this.drawSeeker(ctx, now, rt);
    ROOMS.forEach((room, i) => this.drawOccupant(ctx, room, i, now, rt, reduced));
    this.drawScan(ctx, seeker, rt);
    this.drawVerdicts(ctx, rt);
  }

  drawMap(ctx) {
    ctx.lineJoin = 'round';
    ctx.fillStyle = HALL;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(CORRIDOR.x, CORRIDOR.y, CORRIDOR.w, CORRIDOR.h, 18);
    ctx.fill();
    ctx.stroke();

    ROOMS.forEach(room => {
      const lit = this.lit(room);
      const mid = room.x + ROOM_W / 2;
      const door = 56;
      const bottom = ROOM_TOP + ROOM_H;
      ctx.fillStyle = lit ? LIT_ROOM : DARK_ROOM;
      ctx.beginPath();
      ctx.roundRect(room.x, ROOM_TOP, ROOM_W, ROOM_H, 14);
      ctx.fill();

      // Passage from the doorway down to the corridor.
      ctx.fillStyle = HALL;
      ctx.fillRect(mid - door / 2, bottom - 2, door, CORRIDOR.y - bottom + 5);
      ctx.lineWidth = 3;
      ctx.strokeStyle = LINE;
      ctx.beginPath();
      ctx.moveTo(mid - door / 2, bottom);
      ctx.lineTo(mid - door / 2, CORRIDOR.y);
      ctx.moveTo(mid + door / 2, bottom);
      ctx.lineTo(mid + door / 2, CORRIDOR.y);
      ctx.stroke();

      // Walls, open at the doorway.
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(mid - door / 2, bottom);
      ctx.lineTo(room.x + 14, bottom);
      ctx.arcTo(room.x, bottom, room.x, ROOM_TOP, 14);
      ctx.arcTo(room.x, ROOM_TOP, room.x + ROOM_W, ROOM_TOP, 14);
      ctx.arcTo(room.x + ROOM_W, ROOM_TOP, room.x + ROOM_W, bottom, 14);
      ctx.arcTo(room.x + ROOM_W, bottom, room.x, bottom, 14);
      ctx.lineTo(mid + door / 2, bottom);
      ctx.stroke();

      // Ceiling lamp.
      const ly = ROOM_TOP + 22;
      if (lit) {
        const g = ctx.createRadialGradient(mid, ly, 4, mid, ly, 120);
        g.addColorStop(0, 'rgba(255, 207, 58, 0.55)');
        g.addColorStop(1, 'rgba(255, 207, 58, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(room.x + 2, ROOM_TOP + 2, ROOM_W - 4, 160);
      }
      ctx.beginPath();
      ctx.arc(mid, ly, 11, 0, Math.PI * 2);
      ctx.fillStyle = lit ? LAMP : FLOOR;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = LINE;
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(room.who === 'a' ? i18n.getMessage('Octo A') : i18n.getMessage('Octo B'), room.x + 12, ROOM_TOP + 24);
    });

    ctx.textAlign = 'center';
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillStyle = '#1f6fb2';
    ctx.fillText(i18n.getMessage('Quantum Team'), 256, 28);
    ctx.fillStyle = this.challenger || this.challengerName ? '#b7791f' : GREY;
    ctx.fillText(this.challengerName || i18n.getMessage('Challenger'), 748, 28);
  }

  drawOccupant(ctx, room, i, now, rt, reduced) {
    const pos = this.place(room, i, now);
    const key = `${room.team}${room.who}`;
    const phase = reduced ? 0 : now / 900 + i * 1.7;
    const started = rt >= 0 && rt < 1.2;
    const flinch = started && !reduced ? Math.sin(clamp01(rt / FLINCH_END) * Math.PI) * 0.1 : 0;
    const ripple = reduced ? 1 : clamp01((rt - RIPPLE_START) / (RIPPLE_END - RIPPLE_START));
    const state = this.teamState(room.team);
    const caught = Boolean(state) && state.win === false && rt > SCAN_END;
    const verdictT = clamp01((rt - SCAN_END) / 0.25);
    const shake = caught && !reduced ? Math.sin(rt * 90) * 3 * (1 - verdictT) : 0;
    const exhale = state?.win && !reduced && rt > SCAN_END ? Math.sin(verdictT * Math.PI) * 0.05 : 0;
    const lookUp = started && rt < 0.4 && !reduced;
    const o = octopus({seed: room.seed, phase, look: lookUp ? 0 : Math.sin(now / 1400 + i)});

    ctx.save();
    ctx.translate(pos.x + shake, pos.y);
    ctx.rotate(pos.rot);
    const s = OCTO_SCALE;
    ctx.scale(s * (1 + flinch - pos.stretch * 0.5 + exhale), s * (1 - flinch + pos.stretch + exhale));
    ctx.translate(-100, -135);

    // Paint ripples out from the middle of the head, mesh triangle by triangle.
    const next = this._paint[key];
    const prev = this._prevPaint[key];
    ctx.globalAlpha = 0.34;
    o.fills.forEach(poly => {
      const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
      const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
      const paint = Math.hypot(cx - 100, cy - 78) / 190 < ripple ? next : prev;
      if (paint === undefined || paint === null) return;
      ctx.fillStyle = paint === 1 ? BOLD : CAMO;
      ctx.beginPath();
      poly.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.strokeStyle = LINE;
    ctx.lineCap = 'round';
    o.edges.forEach(e => {
      ctx.lineWidth = e[4] * 1.3;
      ctx.beginPath();
      ctx.moveTo(e[0], e[1]);
      ctx.lineTo(e[2], e[3]);
      ctx.stroke();
    });
    o.nodes.forEach(n => {
      ctx.fillStyle = n.grey ? GREY : LINE;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.tip ? 3.4 : n.grey ? 2.2 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
    o.eyes.forEach(e => {
      ctx.fillStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const py = lookUp ? e.py - 7 : e.py;
      ctx.fillStyle = LINE;
      ctx.beginPath();
      ctx.arc(e.px, py, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(e.px - 2.5, py - 2.5, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Caught: a small ink cloud puffs out.
    if (caught && !reduced && verdictT < 1) {
      ctx.fillStyle = this._paint[key] === 1 ? BOLD : CAMO;
      ctx.globalAlpha = 0.6 * (1 - verdictT);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const r = 20 + verdictT * 46;
        ctx.beginPath();
        ctx.arc(pos.x + Math.cos(a) * r, pos.y + 10 + Math.sin(a) * r * 0.7, 5 + verdictT * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  // The Seeker patrols the corridor and scans every room each round.
  drawSeeker(ctx, now, rt) {
    const walkDone = now - this._walkStart > WALK_MS + 500;
    const x = walkDone && !this._reduced?.matches ? 500 + Math.sin(now / 2200) * 300 : 500;
    const y = CORRIDOR.y + 58 + Math.sin(now / 400) * 3;
    if (!walkDone) return {x, y};
    const scanning = rt > SCAN_START && rt < SCAN_END;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = LINE;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 22);
    ctx.lineTo(x, y - 34);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 37, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = scanning ? LAMP : LINE;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = FLOOR;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + Math.sin(now / 700) * 4, y - 3, 5, 0, Math.PI * 2);
    ctx.fillStyle = LINE;
    ctx.fill();
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = GREY;
    ctx.fillText(i18n.getMessage('Seeker'), x, y + 40);
    return {x, y};
  }

  drawScan(ctx, seeker, rt) {
    if (rt < SCAN_START || rt > SCAN_END) return;
    const k = (rt - SCAN_START) / (SCAN_END - SCAN_START);
    ctx.globalAlpha = 0.22 * Math.sin(k * Math.PI);
    ctx.fillStyle = LAMP;
    ROOMS.forEach(room => {
      if (!this.teamState(room.team)) return;
      const cx = room.x + ROOM_W / 2;
      ctx.beginPath();
      ctx.moveTo(seeker.x, seeker.y - 10);
      ctx.lineTo(cx - 60, ROOM_TOP + 90);
      ctx.lineTo(cx + 60, ROOM_TOP + 90);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawVerdicts(ctx, rt) {
    if (rt < SCAN_END) return;
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    [
      ['q', 256],
      ['c', 748]
    ].forEach(([team, x]) => {
      const s = this.teamState(team);
      if (!s) return;
      const text = s.win ? i18n.getMessage('Survived') : i18n.getMessage('Caught');
      const w = ctx.measureText(text).width + 28;
      const y = ROOM_TOP + ROOM_H - 16;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.strokeStyle = s.win ? OK : BAD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 15, w, 30, 15);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = s.win ? OK : BAD;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1);
      ctx.textBaseline = 'alphabetic';
    });
  }

  paintWord(p) {
    if (p === null || p === undefined) return i18n.getMessage('waiting');
    return p === 1 ? i18n.getMessage('bold') : i18n.getMessage('camo');
  }

  label() {
    const t = (name, s) =>
      s
        ? `${name}: ${i18n.getMessage('Octo A')} ${this.paintWord(s.a)}, ${i18n.getMessage('Octo B')} ${this.paintWord(s.b)}, ${s.win ? i18n.getMessage('Survived') : i18n.getMessage('Caught')}`
        : name;
    return [
      t(i18n.getMessage('Quantum Team'), this.ink),
      t(this.challengerName || i18n.getMessage('Challenger'), this.challenger)
    ].join('. ');
  }

  render() {
    return html`<canvas role="img" aria-label=${this.label()} class="rounded-box"></canvas>`;
  }
}
