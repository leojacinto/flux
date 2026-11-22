// Calls GET /api/<scope>/meccha_octopus_ba/pool as the saved user and prints a summary.
// Usage: node examples/meccha-octopus/scripts/check-pool.mjs <scope>
import {authed} from '../../../scripts/lib.mjs';

const scope = process.argv[2];
if (!scope) throw new Error('Usage: node examples/meccha-octopus/scripts/check-pool.mjs <scope>');
const {browser, raw} = await authed();
const j = await raw('GET', `/api/${scope}/meccha_octopus_ba/pool`);
console.log(JSON.stringify({source: j.source, backend: j.backend, qubits: j.qubits, shots: j.shots, inkSurvival: j.inkSurvival,
  sets: Object.fromEntries(Object.entries(j.sets).map(([k, v]) => [k, v.split(' ').length]))}, null, 2));
await browser.close();
