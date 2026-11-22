---
name: example-meccha-octopus-ui
description: "TEST CASE ONLY: Original Meccha Octopus source and porting rules, part 2: pages/home/page.js and the arena, picker, proof and scoreboard components. Invoke when porting or building the Meccha Octopus Lux UI."
---

# example-meccha-octopus-ui (test case only)
This skill belongs to the Meccha Octopus test case. Do not use it for other apps.
PORTING RULES (apply to every file below):
1. This is the reference source of the original Meccha Octopus Lux app. Port it into the new Lux UI app at the same relative paths, behaving the same.
2. Remove the world model: do NOT create octo-lab.js, do not use three or @sparkjsdev/spark, and delete worldView, labFailed, showTags, the "World model view" toggle, the "Octopus tags" toggle and the "World model unavailable" message from page.js. Always render <octo-arena>. Keep the Sound toggle.
3. POOL_URL must be '/api/x_snc_meccha_oct_1/meccha_octopus_ba/pool' (the Fluent app's Scripted REST API). Response shape: {source, backend, qubits, shots, inkSurvival, sets: {"x,y": "ab ab ..."}}. The response has no ibmJobId, status, ranAt, resultHash or circuits, so make octo-proof tolerate missing fields.
4. Keep the customElement tag names for child components (octo-arena, octo-picker, octo-proof, octo-scoreboard). Name the page element by the Lux app scope convention (x-<scope with dashes>-home-page).
5. Dependencies to keep in package.json: lit, d3-delaunay, d3-scale, d3-shape, @servicenow/aiux. Remove three and @sparkjsdev/spark.
6. Components extend AIUXElement, use isServer guards, i18n.getMessage for strings, Tailwind and DaisyUI classes (aiux- prefix), as in the source.


=== FILE: pages/home/page.js ===
import {html, css, isServer, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, aiuxFetch} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {makeInk, play, rng, tauntBand, CLASSICAL_CEILING} from '../../lib/game.js';
import './components/octo-arena.js';
import './components/octo-lab.js';
import './components/octo-scoreboard.js';
import './components/octo-picker.js';
import './components/octo-proof.js';
import {MOVE_LABELS} from './components/octo-picker.js';
import Sound from '../../lib/sound.js';

const POOL_URL = '/api/x_snc_mec_oct/meccha_octopus/pool';
const ROUNDS = 100;
const SLOW_ROUNDS = 10;
const SLOW_MS = 900;
const FAST_MS = 500;
const WALK_IN_MS = 2000;
// The Quantum Team's lead counts from round 20; passing 75% then slows the next rounds.
const MILESTONE_FROM = 20;
const MILESTONE_SLOW_ROUNDS = 4;
const MILESTONE_SHOW_MS = 2600;

const TAUNTS = {
  top: () => i18n.getMessage('Perfect classical play. Still lost to two octopuses. Sit down.'),
  mid: () => i18n.getMessage('Randomness will not save you. Nothing classical gets past the red line.'),
  low: () => i18n.getMessage('You found the worst strategy in the universe. Impressive.')
};

const TAUNT_LUCKY = () =>
  i18n.getMessage('You finished ahead on luck. Over a long run no classical pair stays above 75%.');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

@customElement('x-snc-mec-oct-home-page')
export default class HomePage extends AIUXElement {
  static properties = {
    pool: {state: true},
    loadError: {state: true},
    choice: {state: true},
    running: {state: true},
    round: {state: true},
    total: {state: true},
    ink: {state: true},
    chal: {state: true},
    inkSeries: {state: true},
    chalSeries: {state: true},
    taunt: {state: true},
    shame: {state: true},
    status: {state: true},
    trace: {state: true},
    matchId: {state: true},
    labFailed: {state: true},
    worldView: {state: true},
    showTags: {state: true},
    soundOn: {state: true},
    pace: {state: true},
    moment: {state: true},
    momentOpen: {state: true}
  };

  static styles = css`
    :host {
      display: block;
    }
  `;

  constructor() {
    super();
    this.pool = null;
    this.loadError = false;
    this.choice = {iA: null, iB: null};
    this.running = false;
    this.round = 0;
    this.total = ROUNDS;
    this.ink = null;
    this.chal = null;
    this.inkSeries = [];
    this.chalSeries = [];
    this.taunt = '';
    this.shame = [];
    this.status = '';
    this.trace = [];
    this.matchId = 0;
    this.labFailed = false;
    this.worldView = true;
    this.showTags = false;
    this.soundOn = false;
    this.pace = SLOW_MS;
    this.moment = null;
    this.momentOpen = false;
    this.sound = new Sound();
    this.token = 0;
  }

  async firstUpdated() {
    document.title = i18n.getMessage('Meccha Octopus');
    try {
      const resp = await aiuxFetch(POOL_URL);
      const body = resp.ok ? (await resp.json()).result : null;
      if (!body || body.error) throw new Error('no pool');
      this.pool = body;
    } catch (err) {
      this.loadError = true;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Stops a running match.
    this.token++;
    this.sound.disable();
  }

  toggleSound(e) {
    this.soundOn = e.target.checked && this.sound.enable();
    if (!this.soundOn) this.sound.disable();
  }

  // A short callout over the arena; the final one stays until the next match.
  showMoment(moment, ms) {
    this.moment = moment;
    this.momentOpen = true;
    clearTimeout(this._momentTimer);
    if (ms) this._momentTimer = setTimeout(() => (this.momentOpen = false), ms);
  }

  onChange(e) {
    if (this.running) return;
    this.choice = e.detail;
  }

  clearChoice() {
    if (!this.running) this.choice = {iA: null, iB: null};
  }

  hasChoice() {
    return this.choice.iA !== null && this.choice.iB !== null;
  }

  challengerName() {
    if (!this.hasChoice()) return '';
    return `${MOVE_LABELS[this.choice.iA]()} / ${MOVE_LABELS[this.choice.iB]()}`;
  }

  async start() {
    if (this.running || !this.pool || !this.hasChoice() || isServer) return;
    const mine = ++this.token;
    const duel = this.hasChoice();
    const pick = this.choice;
    const name = this.challengerName();
    const nextInk = makeInk(this.pool);
    const lights = rng(Date.now());
    this.total = ROUNDS;
    this.running = true;
    this.round = 0;
    this.ink = null;
    this.chal = null;
    this.inkSeries = [];
    this.chalSeries = [];
    this.taunt = '';
    this.trace = [];
    this.status = i18n.getMessage('Match started');
    this.momentOpen = false;
    this.sound.reset();
    // Octopuses swim from the lobby to their rooms before round 1.
    this.matchId++;
    await sleep(WALK_IN_MS);
    let inkWins = 0;
    let chalWins = 0;
    let crossed = false;
    let slowUntil = 0;

    for (let i = 1; i <= this.total; i++) {
      if (this.token !== mine) return;
      const x = lights() < 0.5 ? 0 : 1;
      const y = lights() < 0.5 ? 0 : 1;
      const shot = nextInk(x, y);
      if (!shot) break;
      const inkWin = ((shot.a ^ shot.b) === (x & y));
      inkWins += inkWin ? 1 : 0;
      this.ink = {name: i18n.getMessage('Quantum Team'), x, y, a: shot.a, b: shot.b, win: inkWin};
      this.inkSeries = [...this.inkSeries, inkWins / i];
      this.trace = [{round: i, x, y, idx: shot.idx, a: shot.a, b: shot.b, win: inkWin}, ...this.trace].slice(0, 8);
      if (duel) {
        const r = play(pick.iA, pick.iB, x, y);
        chalWins += r.win ? 1 : 0;
        this.chal = {name, x, y, a: r.a, b: r.b, win: r.win};
        this.chalSeries = [...this.chalSeries, chalWins / i];
      }
      const pace = i <= SLOW_ROUNDS || i <= slowUntil ? SLOW_MS : FAST_MS;
      this.pace = pace;
      this.round = i;
      this.sound.round({x, y, ink: this.ink, chal: this.chal, pace, quiet: pace === FAST_MS});
      if (!crossed && i >= MILESTONE_FROM && inkWins / i > CLASSICAL_CEILING) {
        crossed = true;
        slowUntil = i + MILESTONE_SLOW_ROUNDS;
        this.showMoment({kind: 'cross', rate: inkWins / i}, MILESTONE_SHOW_MS);
        this.sound.milestone();
        this.status = i18n.getMessage('The Quantum Team is above 75 percent, the classical limit');
      }
      await sleep(pace);
    }
    if (this.token !== mine) return;
    this.running = false;
    const inkRate = this.inkSeries[this.inkSeries.length - 1] ?? 0;
    if (duel) {
      const rate = this.chalSeries[this.chalSeries.length - 1] ?? 0;
      const lucky = rate > inkRate;
      this.taunt = lucky ? TAUNT_LUCKY() : TAUNTS[tauntBand(rate)]();
      this.shame = [...this.shame, {name, rate, ink: inkRate, lucky}].sort((a, b) => b.rate - a.rate);
      this.showMoment({kind: 'final', ink: inkRate, chal: rate});
      this.sound.final(!lucky);
    }
    this.status = i18n.getMessage('Match finished');
  }

  stop() {
    this.token++;
    this.running = false;
    this.momentOpen = false;
    this.status = i18n.getMessage('Match stopped');
  }

  lightWord(v) {
    return v === 1 ? i18n.getMessage('lit') : i18n.getMessage('dark');
  }

  sourceBadge() {
    const s = this.pool?.source;
    if (s === 'hardware') return i18n.getMessage('From IBM quantum shots');
    if (s === 'cached') return i18n.getMessage('From saved IBM quantum shots');
    return i18n.getMessage('Simulator shots. Hardware pool pending.');
  }

  paintWord(v) {
    return v === 1 ? i18n.getMessage('bold') : i18n.getMessage('camo');
  }

  renderKnew(team) {
    const cell = (light, paint) =>
      html`<td class="py-1 pr-2">${this.lightWord(light)} <span aria-hidden="true">→</span>
        <span class="sr-only">${i18n.getMessage('painted')}</span> ${this.paintWord(paint)}</td>`;
    return html`<tr class="border-t border-base-300">
      <th scope="row" class="truncate py-1 pr-2 text-left font-medium text-text-primary">${team.name}</th>
      ${cell(team.x, team.a)}${cell(team.y, team.b)}
      <td class="py-1 font-semibold ${team.win ? 'text-success' : 'text-error'}">
        ${team.win ? i18n.getMessage('Survived') : i18n.getMessage('Caught')}
      </td>
    </tr>`;
  }

  // Callout over the arena: passing the classical limit, then the final score.
  // Pointer events pass through so the 3D view can still be dragged.
  renderMoment() {
    const m = this.moment;
    const pct = v => `${Math.round(v * 100)}%`;
    let body = nothing;
    if (m?.kind === 'cross') {
      body = html`<p class="text-sm font-semibold text-info">
        ${i18n.getMessage('Quantum Team is above 75%, the classical limit')}
      </p>`;
    } else if (m?.kind === 'final') {
      const quantum = m.ink >= m.chal;
      body = html`<p class="text-base font-bold ${quantum ? 'text-info' : 'text-warning'}">
          ${quantum ? i18n.getMessage('Quantum Team wins') : i18n.getMessage('You win, on luck')}
        </p>
        <p class="text-sm text-text-secondary">
          ${i18n.getMessage('{ink} to {chal} over 100 rounds', {ink: pct(m.ink), chal: pct(m.chal)})}
        </p>`;
    }
    // Classic arena: over the corridor, clear of names and rooms. 3D lab: the
    // callout above the tanks, the final score mid-corridor.
    const classic = this.labFailed || !this.worldView;
    const where = classic ? 'inset-x-0 bottom-3' : m?.kind === 'final' ? 'inset-0 items-center' : 'inset-x-0 top-2';
    return html`<div class="pointer-events-none absolute ${where} flex justify-center px-2" aria-hidden="true">
      <div
        ?data-open=${Boolean(this.momentOpen && m)}
        class="rounded-box bg-base-100 px-4 py-2 text-center shadow-md opacity-0 scale-[var(--scale-down-sm)] -translate-y-2
          [transition:transform_var(--duration-lg)_var(--ease-medium-accel),opacity_var(--duration-lg)_linear]
          data-[open]:opacity-100 data-[open]:scale-100 data-[open]:translate-y-0
          motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:[transition:opacity_var(--duration-xs)_linear]"
      >
        ${body}
      </div>
    </div>`;
  }

  render() {
    const duel = this.hasChoice();
    const idle = !this.running && this.round === 0;
    const total = idle ? ROUNDS : this.total;
    return html`
      <div class="mx-auto flex max-w-7xl flex-col gap-3">
        <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div class="flex flex-wrap items-baseline gap-x-3">
            <p class="text-sm text-text-secondary">
              ${i18n.getMessage(
                'Two octopuses cannot talk. A Seeker can only catch them in pairs. They must pick the same paint, except when both rooms are lit, when they must pick different paints. Anything else gets both caught.'
              )}
            </p>
          </div>
          ${this.pool
            ? html`<span class="aiux-badge aiux-badge-soft aiux-badge-info">${this.sourceBadge()}</span>`
            : nothing}
        </header>

        ${this.loadError
          ? html`<div class="aiux-alert aiux-alert-error aiux-alert-soft" role="alert">
              ${i18n.getMessage('The shot pool could not be loaded.')}
            </div>`
          : nothing}

        <p class="sr-only" role="status" aria-live="polite">${this.status}</p>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <section class="aiux-card bg-base-100 shadow-sm lg:col-span-8" aria-label=${i18n.getMessage('Arena')}>
            <div class="aiux-card-body gap-2 p-3">
              <div class="relative">
              ${this.labFailed || !this.worldView
                ? html`<octo-arena
                .ink=${this.ink}
                .challenger=${duel ? this.chal : null}
                .challengerName=${duel ? this.challengerName() : ''}
                .round=${this.round}
                .pace=${this.pace}
                .matchId=${this.matchId}
              ></octo-arena>`
                : html`<octo-lab
                .ink=${this.ink}
                .challenger=${duel ? this.chal : null}
                .challengerName=${duel ? this.challengerName() : ''}
                .round=${this.round}
                .pace=${this.pace}
                .matchId=${this.matchId}
              
                .labels=${this.showTags}
                @octo-lab:error=${() => (this.labFailed = true)}
              ></octo-lab>`}
              ${this.renderMoment()}
              </div>
              <div class="flex flex-wrap items-center gap-3">
                ${this.running
                  ? html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${this.stop}>
                      ${i18n.getMessage('Stop')}
                    </button>`
                  : html`<button
                      type="button"
                      class="aiux-btn aiux-btn-sm aiux-btn-primary"
                      ?disabled=${!this.pool || !duel}
                      @click=${this.start}
                    >
                      ${i18n.getMessage('Play 100 rounds')}
                    </button>`}
                ${!duel && !this.running
                  ? html`<span class="text-xs text-text-secondary">${i18n.getMessage('Pick a move for Octo A and Octo B to play.')}</span>`
                  : nothing}
                <span class="text-sm text-text-secondary">${i18n.getMessage('Round')} ${this.round} / ${total}</span>
                ${this.taunt ? html`<p class="text-sm font-semibold text-warning">${this.taunt}</p>` : nothing}
              </div>
            </div>
          </section>

          <section class="aiux-card bg-base-100 shadow-sm lg:col-span-4" aria-label=${i18n.getMessage('Scoreboard')}>
            <div class="aiux-card-body p-3">
              <octo-scoreboard
                .inkSeries=${this.inkSeries}
                .challengerSeries=${duel ? this.chalSeries : []}
                .total=${total}
                .challengerName=${duel ? this.challengerName() : ''}
              ></octo-scoreboard>
              <div class="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-base-300 pt-3 text-sm text-text-secondary">
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="aiux-toggle aiux-toggle-sm"
                    .checked=${this.worldView}
                    @change=${e => (this.worldView = e.target.checked)}
                  />
                  ${i18n.getMessage('World model view')}
                </label>
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="aiux-toggle aiux-toggle-sm"
                    .checked=${this.showTags}
                    ?disabled=${!this.worldView || this.labFailed}
                    @change=${e => (this.showTags = e.target.checked)}
                  />
                  ${i18n.getMessage('Octopus tags')}
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="aiux-toggle aiux-toggle-sm" .checked=${this.soundOn} @change=${this.toggleSound} />
                  ${i18n.getMessage('Sound')}
                </label>
                ${this.labFailed
                  ? html`<span class="text-xs text-warning">${i18n.getMessage('World model unavailable, showing the classic arena.')}</span>`
                  : nothing}
              </div>
            </div>
          </section>

          <section class="aiux-card bg-base-100 shadow-sm lg:col-span-12" aria-label=${i18n.getMessage('Choose your strategy in challenging the quantum octopuses')}>
            <div class="aiux-card-body gap-2 p-3">
              <div class="flex items-center justify-between gap-2">
                <h2 class="text-sm font-semibold text-text-primary">${i18n.getMessage('Choose your strategy in challenging the quantum octopuses')}</h2>
                ${duel
                  ? html`<button type="button" class="aiux-btn aiux-btn-ghost aiux-btn-xs" ?disabled=${this.running} @click=${this.clearChoice}>
                      ${i18n.getMessage('Clear')}
                    </button>`
                  : nothing}
              </div>
              <div class="grid grid-cols-1 gap-4 xl:grid-cols-[auto_1fr]">
                <octo-picker
                  .selected=${this.choice}
                  ?disabled=${this.running}
                  @octo-picker:change=${this.onChange}
                ></octo-picker>
                <div class="flex min-w-0 flex-col gap-1 border-base-300 xl:border-l xl:pl-6" aria-label=${i18n.getMessage('Hall of Shame')} role="region">
                  <div class="flex items-baseline justify-between gap-2">
                <h2 class="text-sm font-semibold text-text-primary">${i18n.getMessage('Hall of Shame')}</h2>
                <p class="text-xs font-semibold text-error">
                  ${i18n.getMessage('No strategy beats')} ${Math.round(CLASSICAL_CEILING * 100)}% ${i18n.getMessage('for long')}
                </p>
              </div>
              ${this.shame.length
                ? html`<div role="region" aria-label=${i18n.getMessage('Hall of Shame entries')} class="max-h-[4.5rem] overflow-y-auto pr-2">
                    <ol class="flex list-inside list-decimal flex-col gap-1 text-sm">
                    ${this.shame.map(
                      s => html`<li>
                        <span class="inline-flex w-[calc(100%-1.5rem)] justify-between gap-3">
                          <span class="text-text-primary">${s.name}</span>
                          <span class="font-mono text-text-secondary">
                            ${s.lucky ? html`<span class="aiux-badge aiux-badge-xs aiux-badge-warning aiux-badge-soft">${i18n.getMessage('Lucky run')}</span>` : nothing}
                            ${(s.rate * 100).toFixed(0)}%
                          </span>
                        </span>
                      </li>`
                    )}
                  </ol>
                  </div>`
                : html`<p class="text-sm text-text-secondary">${i18n.getMessage('No challengers yet.')}</p>`}
                </div>
              </div>
            </div>
          </section>

        </div>

        <div class="grid grid-cols-1 items-start gap-3">
          <section class="aiux-card bg-base-100 shadow-sm" aria-label=${i18n.getMessage('What they knew')}>
            <div class="aiux-card-body gap-1 p-3">
              <h2 class="text-sm font-semibold text-text-primary">${i18n.getMessage('What they knew')}</h2>
              <p class="text-xs text-text-secondary">
                ${i18n.getMessage('Each octopus is told only its own room light.')}
              </p>
              ${this.ink
                ? html`<table class="w-full table-fixed border-collapse text-sm">
                    <caption class="sr-only">${i18n.getMessage('Light told and paint chosen, this round')}</caption>
                    <colgroup>
                      <col class="w-[34%]" />
                      <col class="w-[22%]" />
                      <col class="w-[22%]" />
                      <col class="w-[22%]" />
                    </colgroup>
                    <thead class="text-xs text-text-secondary">
                      <tr>
                        <th scope="col" class="py-1 pr-2 text-left font-medium">${i18n.getMessage('Team')}</th>
                        <th scope="col" class="py-1 pr-2 text-left font-medium">${i18n.getMessage('Octo A')}</th>
                        <th scope="col" class="py-1 pr-2 text-left font-medium">${i18n.getMessage('Octo B')}</th>
                        <th scope="col" class="py-1 text-left font-medium">${i18n.getMessage('Result')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.renderKnew(this.ink)}${duel && this.chal ? this.renderKnew(this.chal) : nothing}
                    </tbody>
                  </table>`
                : html`<p class="text-sm text-text-secondary">${i18n.getMessage('Start a match to see the lights.')}</p>`}
            </div>
          </section>

        </div>

        <section class="aiux-card bg-base-100 shadow-sm" aria-label=${i18n.getMessage('IBM Output')}>
          <div class="aiux-card-body gap-2">
            <h2 class="aiux-card-title text-text-primary">${i18n.getMessage('IBM Output')}</h2>
            <octo-proof .pool=${this.pool} .trace=${this.trace}></octo-proof>
          </div>
        </section>
      </div>
    `;
  }
}


=== FILE: pages/home/components/octo-arena.js ===
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


=== FILE: pages/home/components/octo-picker.js ===
import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {MOVES, play, exactRate} from '../../../lib/game.js';

// Same order as MOVES. Literal calls so the catalog can extract each string.
export const MOVE_LABELS = [
  () => i18n.getMessage('Always camo'),
  () => i18n.getMessage('Always bold'),
  () => i18n.getMessage('Copy the light'),
  () => i18n.getMessage('Opposite of the light')
];

const MOVE_SHORT = [
  () => i18n.getMessage('Camo'),
  () => i18n.getMessage('Bold'),
  () => i18n.getMessage('Copy'),
  () => i18n.getMessage('Opposite')
];

const MOVE_HINTS = [
  () => i18n.getMessage('always camo, ignores the light'),
  () => i18n.getMessage('always bold, ignores the light'),
  () => i18n.getMessage('lit means bold, dark means camo'),
  () => i18n.getMessage('lit means camo, dark means bold')
];

// Each octopus sees only its own light, so a classical octopus has four moves.
// Pick one for each, then see which light settings the pair survives.
@customElement('octo-picker')
export default class OctoPicker extends AIUXElement {
  static properties = {
    selected: {attribute: false},
    disabled: {type: Boolean}
  };

  static styles = css`
    :host {
      display: block;
    }
  `;

  constructor() {
    super();
    this.selected = {iA: null, iB: null};
    this.disabled = false;
  }

  change(who, index) {
    const next = {...this.selected, [who]: index};
    this.dispatchEvent(
      new CustomEvent('octo-picker:change', {detail: next, bubbles: true, composed: true})
    );
  }

  // One segmented row of four radio buttons per octopus.
  renderGroup(who, title, current) {
    return html`
      <fieldset class="flex flex-wrap items-center gap-x-3 gap-y-1" ?disabled=${this.disabled}>
        <legend class="sr-only">${title}</legend>
        <span aria-hidden="true" class="w-14 text-sm font-semibold text-text-primary">${title}</span>
        <div class="aiux-join">
          ${MOVES.map(
            (_m, i) => html`<input
              type="radio"
              class="aiux-join-item aiux-btn aiux-btn-sm"
              name=${`octo-${who}`}
              aria-label=${MOVE_SHORT[i]()}
              title=${MOVE_LABELS[i]()}
              .checked=${current === i}
              @change=${() => this.change(who, i)}
            />`
          )}
        </div>
        <span class="text-xs text-text-secondary">${current === null ? nothing : MOVE_HINTS[current]()}</span>
      </fieldset>
    `;
  }

  // The scoring rule and your pair's result share one 2x2 grid of lights:
  // each cell says what the paints need, and once both moves are picked,
  // the two paints the pair would show there and whether that survives.
  renderOutcome() {
    const {iA, iB} = this.selected;
    const picked = iA !== null && iB !== null;
    const paint = p => (p ? i18n.getMessage('bold') : i18n.getMessage('camo'));
    const cell = (x, y) => {
      const rule = x & y ? i18n.getMessage('need different') : i18n.getMessage('need same');
      if (!picked) return html`<td class="px-3 py-1 text-center text-text-secondary">${rule}</td>`;
      const {a, b, win} = play(iA, iB, x, y);
      return html`<td class="px-3 py-1 text-center">
        <span class="block text-text-secondary">${rule}</span>
        <span class="block whitespace-nowrap font-medium ${win ? 'text-success' : 'text-error'}">
          ${paint(a)} · ${paint(b)} <span aria-hidden="true">${win ? '✓' : '✗'}</span>
          <span class="sr-only">${win ? i18n.getMessage('Survive') : i18n.getMessage('Caught')}</span>
        </span>
      </td>`;
    };
    return html`
      <div>
        <p class="text-xs font-semibold text-text-primary">
          ${picked
            ? html`${i18n.getMessage('Your pair survives')} ${Math.round(exactRate(iA, iB) * 4)}
              ${i18n.getMessage('of 4 light settings')}`
            : i18n.getMessage('To survive, the paints must')}
        </p>
        <table class="border-collapse text-xs">
          <caption class="sr-only">${i18n.getMessage('Paint rule and result for each combination of room lights')}</caption>
          <thead>
            <tr>
              <td></td>
              <th scope="col" class="px-3 font-medium text-text-secondary">${i18n.getMessage('B dark')}</th>
              <th scope="col" class="px-3 font-medium text-text-secondary">${i18n.getMessage('B lit')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" class="pr-1 text-left font-medium text-text-secondary">${i18n.getMessage('A dark')}</th>
              ${cell(0, 0)}${cell(0, 1)}
            </tr>
            <tr>
              <th scope="row" class="pr-1 text-left font-medium text-text-secondary">${i18n.getMessage('A lit')}</th>
              ${cell(1, 0)}${cell(1, 1)}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    return html`
      <div class="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div class="flex flex-col gap-2">
          ${this.renderGroup('iA', i18n.getMessage('Octo A'), this.selected.iA)}
          ${this.renderGroup('iB', i18n.getMessage('Octo B'), this.selected.iB)}
        </div>
        ${this.renderOutcome()}
      </div>
    `;
  }
}


=== FILE: pages/home/components/octo-proof.js ===
import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

const SETTINGS = ['0,0', '0,1', '1,0', '1,1'];

// Provenance for the Ink Team: which IBM job the shots came from, and which stored
// shot each round used, so the audience can check the paint against the raw output.
@customElement('octo-proof')
export default class OctoProof extends AIUXElement {
  static properties = {
    pool: {attribute: false},
    trace: {attribute: false}
  };

  static styles = css`
    :host {
      display: block;
    }
  `;

  constructor() {
    super();
    this.pool = null;
    this.trace = [];
  }

  fact(label, value) {
    return html`
      <dt class="text-text-secondary">${label}</dt>
      <dd class="break-all font-mono text-text-primary">${value}</dd>
    `;
  }

  renderTrace() {
    if (!this.trace.length) {
      return html`<p class="text-sm text-text-secondary">
        ${i18n.getMessage('Start a match to see each round traced to a stored IBM shot.')}
      </p>`;
    }
    return html`
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">${i18n.getMessage('Last rounds traced to stored IBM shots')}</caption>
          <thead class="text-xs text-text-secondary">
            <tr>
              <th scope="col" class="pr-3">${i18n.getMessage('Round')}</th>
              <th scope="col" class="pr-3">${i18n.getMessage('Lights A, B')}</th>
              <th scope="col" class="pr-3">${i18n.getMessage('Stored shot')}</th>
              <th scope="col" class="pr-3">${i18n.getMessage('IBM value')}</th>
              <th scope="col" class="pr-3">${i18n.getMessage('Paint A, B')}</th>
              <th scope="col">${i18n.getMessage('Result')}</th>
            </tr>
          </thead>
          <tbody class="font-mono">
            ${this.trace.map(
              t => html`<tr>
                <td class="pr-3">${t.round}</td>
                <td class="pr-3">${t.x}, ${t.y}</td>
                <td class="pr-3">#${t.idx + 1}</td>
                <td class="pr-3">0x${t.a + 2 * t.b}</td>
                <td class="pr-3">${t.a}, ${t.b}</td>
                <td>${t.win ? i18n.getMessage('Survived') : i18n.getMessage('Caught')}</td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    const p = this.pool;
    if (!p) return nothing;
    const hardware = p.source === 'hardware';
    return html`
      <div class="flex flex-col gap-3">
        ${hardware
          ? html`<div class="flex flex-col gap-2 text-sm">
              <div class="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-3">
                <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  ${this.fact(i18n.getMessage('Backend'), p.backend)}
                  ${this.fact(i18n.getMessage('Qubits'), p.qubits)}
                </dl>
                <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  ${this.fact(
                    i18n.getMessage('IBM job ID'),
                    html`<a
                      class="aiux-link"
                      href=${`https://quantum.cloud.ibm.com/jobs/${p.ibmJobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      >${p.ibmJobId}</a
                    >`
                  )}
                  ${this.fact(i18n.getMessage('Status'), p.status)}
                </dl>
                <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  ${this.fact(i18n.getMessage('Shots per setting'), p.shots)}
                  ${this.fact(i18n.getMessage('Recorded'), p.ranAt)}
                </dl>
              </div>
              <dl class="grid grid-cols-[auto_1fr] gap-x-4">
                ${this.fact(i18n.getMessage('Result SHA-256'), p.resultHash)}
              </dl>
            </div>`
          : html`<p class="text-sm text-warning">
              ${i18n.getMessage('These shots come from a simulator. Load a hardware job to show IBM proof.')}
            </p>`}
        ${this.renderTrace()}
        <details class="text-sm">
          <summary class="cursor-pointer font-semibold text-text-primary">
            ${i18n.getMessage('Circuits sent to IBM')}
          </summary>
          ${SETTINGS.map(
            k =>
              html`<h3 class="mt-2 text-xs font-semibold text-text-secondary">
                  ${i18n.getMessage('Lights')} ${k}
                </h3>
                <pre class="overflow-x-auto rounded-box bg-base-200 p-2 text-xs">${p.circuits?.[k] || ''}</pre>`
          )}
        </details>
        <p class="text-xs text-text-secondary">
          ${i18n.getMessage('Rounds replay stored output from one real IBM job. There is no live quantum call per round.')}
        </p>
      </div>
    `;
  }
}


=== FILE: pages/home/components/octo-scoreboard.js ===
import {html, css, svg, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {line, curveMonotoneX} from 'd3-shape';
import {scaleLinear} from 'd3-scale';
import {CLASSICAL_CEILING, QUANTUM_CEILING} from '../../../lib/game.js';

const W = 420;
const H = 330;
const M = {top: 12, right: 10, bottom: 26, left: 34};

// Running survival per team against rounds, with the 75% line nobody classical crosses.
@customElement('octo-scoreboard')
export default class OctoScoreboard extends AIUXElement {
  static properties = {
    inkSeries: {attribute: false},
    challengerSeries: {attribute: false},
    total: {type: Number},
    challengerName: {type: String}
  };

  static styles = css`
    :host {
      display: block;
    }
  `;

  constructor() {
    super();
    this.inkSeries = [];
    this.challengerSeries = [];
    this.total = 200;
    this.challengerName = '';
  }

  pct(series) {
    return series.length ? `${(series[series.length - 1] * 100).toFixed(1)}%` : '--';
  }

  render() {
    const x = scaleLinear()
      .domain([0, Math.max(this.total, 1)])
      .range([M.left, W - M.right]);
    const y = scaleLinear()
      .domain([0, 1])
      .range([H - M.bottom, M.top]);
    const path = line()
      .x((_, i) => x(i + 1))
      .y(d => y(d))
      .curve(curveMonotoneX);
    const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const inkNow = this.inkSeries[this.inkSeries.length - 1] ?? 0;
    const beating = this.inkSeries.length > 10 && inkNow > CLASSICAL_CEILING;

    return html`
      <div class="grid grid-cols-2 gap-3">
        <div class="aiux-card min-w-0 border border-base-300 bg-base-100">
          <div class="aiux-card-body items-center gap-0 p-2">
            <p class="truncate text-[11px] uppercase tracking-wide text-text-secondary">
              ${i18n.getMessage('Quantum Team')}
            </p>
            <p class="text-3xl font-bold ${beating ? 'text-success' : 'text-text-primary'}">
              ${this.pct(this.inkSeries)}
            </p>
          </div>
        </div>
        <div class="aiux-card min-w-0 border border-base-300 bg-base-100">
          <div class="aiux-card-body items-center gap-0 p-2">
            <p class="truncate text-[11px] uppercase tracking-wide text-text-secondary">
              ${i18n.getMessage('Challenger')}
            </p>
            <p class="text-3xl font-bold text-text-primary">${this.pct(this.challengerSeries)}</p>
          </div>
        </div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" class="mt-2 w-full" role="img"
        aria-label=${i18n.getMessage('Survival rate by round, with the 75 percent classical limit')}>
        ${ticks.map(
          t => svg`<line x1=${M.left} x2=${W - M.right} y1=${y(t)} y2=${y(t)} stroke="#8884" stroke-width="1"></line>
            <text x=${M.left - 6} y=${y(t) + 4} text-anchor="end" font-size="11" fill="#888">${Math.round(t * 100)}%</text>`
        )}
        <line x1=${M.left} x2=${W - M.right} y1=${y(QUANTUM_CEILING)} y2=${y(QUANTUM_CEILING)}
          stroke="#7cc4ff" stroke-width="1" stroke-dasharray="3 5" opacity="0.7"></line>
        <text x=${W - M.right} y=${y(QUANTUM_CEILING) - 4} text-anchor="end" font-size="11" fill="#7cc4ff">
          ${i18n.getMessage('Entanglement ceiling 85.4%')}
        </text>
        <line x1=${M.left} x2=${W - M.right} y1=${y(CLASSICAL_CEILING)} y2=${y(CLASSICAL_CEILING)}
          stroke="#d92d20" stroke-width="3"></line>
        <text x=${M.left + 6} y=${y(CLASSICAL_CEILING) + 16} font-size="11" font-weight="700" fill="#d92d20">
          ${i18n.getMessage('Nobody has ever beaten this')}
        </text>
        ${this.challengerSeries.length > 1
          ? svg`<path d=${path(this.challengerSeries)} fill="none" stroke="#f6b94c" stroke-width="2.5"></path>`
          : nothing}
        ${this.inkSeries.length > 1
          ? svg`<path d=${path(this.inkSeries)} fill="none" stroke="#2f8fe0" stroke-width="3"></path>`
          : nothing}
        <text x=${W / 2} y=${H - M.bottom + 18} text-anchor="middle" font-size="11" fill="#888">
          ${i18n.getMessage('Round')}
        </text>
      </svg>
    `;
  }
}
