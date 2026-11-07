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
