// Turns an IBM Sampler V2 result file into shot sets and inserts them into <scope>_shot_set.
// Usage: node scripts/seed-shots.mjs <scope> <result.json>
// Samples are hex ints over classical register c: bit 0 is Octo A's paint, bit 1 is Octo B's.
// Each shot becomes the two character token "ab"; tokens are joined by spaces.
import fs from 'node:fs';
import {authed} from './lib.mjs';

const [scope, file] = process.argv.slice(2);
if (!scope || !file) throw new Error('Usage: node scripts/seed-shots.mjs <scope> <result.json>');
const T = `${scope}_shot_set`;
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const ORDER = [[0, 0], [0, 1], [1, 0], [1, 1]];
const sets = r.results.results.map((pub, i) => {
  const [x, y] = ORDER[i];
  const tokens = pub.data.c.samples.map(h => { const v = parseInt(h, 16); return `${v & 1}${(v >> 1) & 1}`; });
  const wins = tokens.filter(t => ((+t[0]) ^ (+t[1])) === (x & y)).length;
  return {x, y, shots: tokens.length, survival: wins / tokens.length, bits: tokens.join(' ')};
});
const {browser, get, post} = await authed();
if ((await get(`${T}?sysparm_fields=sys_id&sysparm_limit=1`)).length) throw new Error(`${T} is not empty, aborting`);
const backend = r.backend, qubits = (r.qubits || []).join(' ');
for (const s of sets) {
  await post(T, {label: `x${s.x}y${s.y} ${backend}`, x: s.x, y: s.y, shots: s.shots, survival: s.survival, backend, qubits, bits: s.bits});
  console.log('inserted', s.x, s.y, s.shots, s.survival.toFixed(3));
}
await browser.close();
