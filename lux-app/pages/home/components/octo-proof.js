import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

// Shows where the Quantum Team's paints came from: the pool metadata, and the
// last few rounds with the shot index each one read.
// The pool is served by the Fluent app's Scripted REST API and may omit the
// optional job fields, so every field below is rendered only when present.
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

  sourceLabel() {
    const s = this.pool?.source;
    if (s === 'hardware') return i18n.getMessage('IBM quantum hardware');
    if (s === 'cached') return i18n.getMessage('Saved IBM quantum shots');
    return i18n.getMessage('Simulator');
  }

  // Only the fields the pool actually returned.
  facts() {
    const p = this.pool;
    if (!p) return [];
    const rows = [[i18n.getMessage('Source'), this.sourceLabel()]];
    const add = (label, value) => {
      if (value === null || value === undefined || value === '') return;
      rows.push([label, String(value)]);
    };
    add(i18n.getMessage('Backend'), p.backend);
    add(i18n.getMessage('Qubits'), p.qubits);
    add(i18n.getMessage('Shots per setting'), p.shots);
    add(i18n.getMessage('Status'), p.status);
    add(i18n.getMessage('Job'), p.ibmJobId);
    add(i18n.getMessage('Run at'), p.ranAt);
    add(i18n.getMessage('Result hash'), p.resultHash);
    if (typeof p.inkSurvival === 'number') {
      add(i18n.getMessage('Pool survival rate'), `${Math.round(p.inkSurvival * 100)}%`);
    }
    return rows;
  }

  setSizes() {
    const sets = this.pool?.sets || {};
    return Object.entries(sets).map(([key, value]) => [key, String(value).split(' ').filter(Boolean).length]);
  }

  lightWord(v) {
    return v === 1 ? i18n.getMessage('lit') : i18n.getMessage('dark');
  }

  paintWord(v) {
    return v === 1 ? i18n.getMessage('bold') : i18n.getMessage('camo');
  }

  renderTrace() {
    const trace = this.trace || [];
    if (!trace.length) {
      return html`<p class="text-sm text-text-secondary">${i18n.getMessage('Start a match to read shots from the pool.')}</p>`;
    }
    return html`
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <caption class="sr-only">${i18n.getMessage('Recent rounds and the shot each one read')}</caption>
          <thead class="text-xs text-text-secondary">
            <tr>
              <th scope="col" class="py-1 pr-3 text-left font-medium">${i18n.getMessage('Round')}</th>
              <th scope="col" class="py-1 pr-3 text-left font-medium">${i18n.getMessage('Lights')}</th>
              <th scope="col" class="py-1 pr-3 text-left font-medium">${i18n.getMessage('Shot')}</th>
              <th scope="col" class="py-1 pr-3 text-left font-medium">${i18n.getMessage('Paints')}</th>
              <th scope="col" class="py-1 text-left font-medium">${i18n.getMessage('Result')}</th>
            </tr>
          </thead>
          <tbody>
            ${trace.map(
              r => html`<tr class="border-t border-base-300">
                <th scope="row" class="py-1 pr-3 text-left font-mono font-normal text-text-primary">${r.round}</th>
                <td class="py-1 pr-3 text-text-secondary">
                  ${i18n.getMessage('A')} ${this.lightWord(r.x)}, ${i18n.getMessage('B')} ${this.lightWord(r.y)}
                </td>
                <td class="py-1 pr-3 font-mono text-text-secondary">${r.x},${r.y} #${r.idx}</td>
                <td class="py-1 pr-3 text-text-primary">${this.paintWord(r.a)} · ${this.paintWord(r.b)}</td>
                <td class="py-1 font-semibold ${r.win ? 'text-success' : 'text-error'}">
                  ${r.win ? i18n.getMessage('Survived') : i18n.getMessage('Caught')}
                </td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    const facts = this.facts();
    const sets = this.setSizes();
    if (!this.pool) {
      return html`<p class="text-sm text-text-secondary">${i18n.getMessage('The shot pool is not loaded.')}</p>`;
    }
    return html`
      <div class="flex flex-col gap-3">
        <p class="text-xs text-text-secondary">
          ${i18n.getMessage(
            'Every paint the Quantum Team shows is read from this pool of measured shots. Nothing is generated in the browser.'
          )}
        </p>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          ${facts.map(
            ([label, value]) => html`
              <dt class="text-text-secondary">${label}</dt>
              <dd class="break-all font-mono text-text-primary">${value}</dd>
            `
          )}
        </dl>
        ${sets.length
          ? html`<div class="flex flex-wrap gap-2">
              ${sets.map(
                ([key, count]) => html`<span class="aiux-badge aiux-badge-sm aiux-badge-ghost font-mono">
                  ${key}: ${count}
                </span>`
              )}
            </div>`
          : nothing}
        ${this.renderTrace()}
      </div>
    `;
  }
}
