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
