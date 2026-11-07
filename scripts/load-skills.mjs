// Publishes Build Agent skills (type=skill, applies_to=instance). Safe to rerun: records are
// matched by name and updated.
//   lux-app-method                                        the method (skills/lux-app-method/SKILL.md)
//   lux-aiux-build, lux-ref-app/-foundation/-design       Lux knowledge built from the AIUX agent pack
//   lux-meccha-src-lib, lux-meccha-src-ui                 only with --example (the test case source)
// Env: REFERENCE_APP = a Lux project with `pnpm install` done, so that
//      node_modules/@servicenow/agent-pack-aiux exists (the original meccha-octopus clone works).
// Usage: node scripts/load-skills.mjs [dry|run] [--example]    (dry prints sizes only)
import fs from 'node:fs';
import {authed} from './lib.mjs';

const mode = process.argv[2] === 'run' ? 'run' : 'dry';
const withExample = process.argv.includes('--example');
const ROOT = process.env.REFERENCE_APP;
if (!ROOT) throw new Error('Set REFERENCE_APP to a Lux project that has node_modules/@servicenow/agent-pack-aiux');
const SKILL_DIR = `${ROOT}/node_modules/@servicenow/agent-pack-aiux/skills/aiux-build`;
const NAME = 'lux-aiux-build';

const rd = f => fs.readFileSync(f, 'utf8');
const ref = rels => rels.map(r => `\n\n=== FILE: ${r} ===\n` + rd(`${SKILL_DIR}/${r}`)).join('');
const scaffoldPkg = (() => {
  const j = JSON.parse(rd(`${ROOT}/package.json`));
  for (const k of ['@sparkjsdev/spark', 'three', 'd3-delaunay', 'd3-scale', 'd3-shape']) delete j.dependencies[k];
  delete j.scripts.postinstall; delete j.scripts['agent:skills'];
  return JSON.stringify(j, null, 2);
})();
const hello = `import {html, css, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, aiuxFetch} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

@customElement('x-snc-mec-oct-ba-home-page')
export default class HomePage extends AIUXElement {
  static properties = {data: {state: true}};
  static styles = css\`:host { display: block; }\`;
  async firstUpdated() {
    if (isServer) return;
    const resp = await aiuxFetch('/api/x_snc_mec_oct_ba/meccha_octopus_ba/pool');
    this.data = resp.ok ? (await resp.json()).result : null;
  }
  render() {
    return html\`<div class="aiux-card bg-base-100 shadow-sm"><div class="aiux-card-body">
      <h2 class="aiux-card-title">\${i18n.getMessage('Hello Lux')}</h2>
      <p>\${this.data ? i18n.getMessage('Loaded') : i18n.getMessage('Loading')}</p>
    </div></div>\`;
  }
}
`;
const scaffold = ['aiux.json', 'application.js', 'theme.js', 'now.config.json'].map(f => `\n\n=== FILE: ${f} (reference app, adapt names and scope) ===\n` + rd(`${ROOT}/${f}`)).join('')
  + `\n\n=== FILE: package.json (trimmed from the reference app) ===\n${scaffoldPkg}`
  + `\n\n=== FILE: pages/home/page.js (minimal Lux page) ===\n${hello}`;
const skillMd = rd(`${SKILL_DIR}/SKILL.md`).replace(/^---[\s\S]*?---\n/, '');
const R = {
  'lux-ref-foundation': ['Lux reference: AIUXElement, Lit patterns, SSR safety, loaders and context, decorators, data fetching, component patterns, server scripts. Invoke when writing or debugging Lux components.',
    ref(['references/foundation/aiux-element.md', 'references/foundation/lit-patterns.md', 'references/foundation/ssr-safety.md', 'references/foundation/loader-and-context.md', 'references/widget/decorators.md', 'references/widget/data-fetching.md', 'references/widget/component-patterns.md', 'references/widget/server-scripts.md'])],
  'lux-ref-app': ['Lux reference: app shell, pages, navigation, theme, backend layer, extensions, plus a known-good project scaffold (aiux.json, application.js, theme.js, package.json, now.config.json, minimal page). Invoke when creating or restructuring a Lux app.',
    ref(['references/app/pages-cookbook.md', 'references/app/navigation-patterns.md', 'references/app/theme-and-config.md', 'references/app/backend-layer.md', 'references/app/extensions.md']) + scaffold],
  'lux-ref-design': ['Lux reference: DaisyUI and Tailwind patterns, validation rules, audit and best-practice checklists, debugging guide. Invoke when styling or reviewing Lux UI.',
    ref(['references/design/daisyui-patterns.md', 'references/design/tailwind-reference.md', 'references/quality/validation-rules.md', 'references/quality/best-practices-checklist.md', 'references/quality/debugging-guide.md', 'references/quality/audit-checklist.md'])],
};
const header = `# lux-aiux-build (Lux = AIUX)\nLux is the product name for the AIUX framework (@servicenow/aiux, Lit, AIUXElement). Output for Lux requests must be a Lux app: aiux.json, application.js, theme.js, pages/<route>/page.js, plus Fluent (*.now.ts) for tables, ACLs and REST APIs. Never produce React UI Pages for Lux requests.\nBefore writing code, invoke lux-app-method (how to split a full app between Studio and a local Lux build), then these companion skills by name: lux-ref-app (project scaffold to copy, pages, navigation, theme), lux-ref-foundation (AIUXElement, Lit, SSR, loaders, data fetching, server scripts), lux-ref-design (DaisyUI, Tailwind, validation, audit). Paths such as references/... in the text below refer to files inside those companion skills.\n\n`;
const skills = [[NAME, 'Build Lux (AIUX) apps, pages, widgets and components with @servicenow/aiux, Lit and AIUXElement. Use when the user asks for Lux or AIUX output (aiux.json, pages/, application.js). Output is Lux, never React UI Pages. Invoke lux-ref-app, lux-ref-foundation and lux-ref-design first.', header + skillMd],
  ...Object.entries(R).map(([n, [d, bdy]]) => [n, d, `# ${n}\n${bdy}`])];
const rdSrc = f => fs.readFileSync(`${ROOT}/${f}`, 'utf8');
const srcFiles = fs_ => fs_.map(f => `\n\n=== FILE: ${f} ===\n${rdSrc(f)}`).join('');
const RULES = `PORTING RULES (apply to every file below):
1. This is the reference source of the original Meccha Octopus Lux app. Port it into the new Lux UI app at the same relative paths, behaving the same.
2. Remove the world model: do NOT create octo-lab.js, do not use three or @sparkjsdev/spark, and delete worldView, labFailed, showTags, the "World model view" toggle, the "Octopus tags" toggle and the "World model unavailable" message from page.js. Always render <octo-arena>. Keep the Sound toggle.
3. POOL_URL must be '/api/x_snc_meccha_oct_1/meccha_octopus_ba/pool' (the Fluent app's Scripted REST API). Response shape: {source, backend, qubits, shots, inkSurvival, sets: {"x,y": "ab ab ..."}}. The response has no ibmJobId, status, ranAt, resultHash or circuits, so make octo-proof tolerate missing fields.
4. Keep the customElement tag names for child components (octo-arena, octo-picker, octo-proof, octo-scoreboard). Name the page element by the Lux app scope convention (x-<scope with dashes>-home-page).
5. Dependencies to keep in package.json: lit, d3-delaunay, d3-scale, d3-shape, @servicenow/aiux. Remove three and @sparkjsdev/spark.
6. Components extend AIUXElement, use isServer guards, i18n.getMessage for strings, Tailwind and DaisyUI classes (aiux- prefix), as in the source.
`;
const srcSkills = [
  ['lux-meccha-src-lib', 'Reference source for the Meccha Octopus Lux app, part 1: lib/game.js, lib/octo-art.js, lib/sound.js, theme.js and CSS. Invoke when porting or building the Meccha Octopus Lux UI.',
    `# lux-meccha-src-lib\n${RULES}${srcFiles(['lib/game.js', 'lib/octo-art.js', 'lib/sound.js', 'theme.js', 'head.app.css', 'tailwind.app.css'])}`],
  ['lux-meccha-src-ui', 'Reference source for the Meccha Octopus Lux app, part 2: pages/home/page.js and the arena, picker, proof and scoreboard components. Invoke when porting or building the Meccha Octopus Lux UI.',
    `# lux-meccha-src-ui\n${RULES}${srcFiles(['pages/home/page.js', 'pages/home/components/octo-arena.js', 'pages/home/components/octo-picker.js', 'pages/home/components/octo-proof.js', 'pages/home/components/octo-scoreboard.js'])}`],
];
const methodMd = fs.readFileSync(new URL('../skills/lux-app-method/SKILL.md', import.meta.url), 'utf8');
const methodSkill = ['lux-app-method', methodMd.match(/^description: (.*)$/m)[1], methodMd.replace(/^---[\s\S]*?---\n/, '')];
const all = [methodSkill, ...skills, ...(withExample ? srcSkills : [])];
for (const [n, , bdy] of all) console.log(n, bdy.length);
if (all.some(([, , bdy]) => bdy.length > 65000)) throw new Error('body too long (65,000 character field limit)');
if (mode === 'dry') process.exit(0);

const {browser, get, post, patch} = await authed();
for (const [name, description, body] of all) {
  const rec = {name, description, type: 'skill', applies_to: 'instance', active: 'true', body};
  const ex = await get(`sn_build_agent_instruction?sysparm_query=name=${name}&sysparm_fields=sys_id`);
  if (ex.length) await patch(`sn_build_agent_instruction/${ex[0].sys_id}`, rec);
  else await post('sn_build_agent_instruction', rec);
  console.log('published', name, body.length);
}
await browser.close();
