import {html, css, isServer, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, aiuxFetch} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {makeInk, play, rng, tauntBand, CLASSICAL_CEILING} from '../../lib/game.js';
import './components/octo-arena.js';
import './components/octo-scoreboard.js';
import './components/octo-picker.js';
import './components/octo-proof.js';
import {MOVE_LABELS} from './components/octo-picker.js';
import Sound from '../../lib/sound.js';

const POOL_URL = '/api/x_snc_meccha_oct_1/meccha_octopus_ba/pool';
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

@customElement('x-snc-meccha-oct-2-home-page')
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
    clearTimeout(this._momentTimer);
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
      const inkWin = (shot.a ^ shot.b) === (x & y);
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
  // Pointer events pass through so the canvas below stays interactive.
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
    // Over the corridor, clear of the team names and the rooms.
    return html`<div class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-2" aria-hidden="true">
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
                <octo-arena
                  .ink=${this.ink}
                  .challenger=${duel ? this.chal : null}
                  .challengerName=${duel ? this.challengerName() : ''}
                  .round=${this.round}
                  .pace=${this.pace}
                  .matchId=${this.matchId}
                ></octo-arena>
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
                  <input type="checkbox" class="aiux-toggle aiux-toggle-sm" .checked=${this.soundOn} @change=${this.toggleSound} />
                  ${i18n.getMessage('Sound')}
                </label>
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
                                <span class="break-words max-w-full text-text-primary">${s.name}</span>
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
