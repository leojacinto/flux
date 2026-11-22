// Copies skills from the instance back into this repo, so edits made in the instance are kept.
// Updates every skill that already has a SKILL.md here (core and example). Use --check to only
// report differences.
// Usage: node scripts/pull-skills.mjs [--check]
import fs from 'node:fs';
import {authed} from './lib.mjs';
import {CORE_DIR, EXAMPLE_DIR, RENAMED, listSkillFiles, readSkill, writeSkill} from './skills-lib.mjs';

const check = process.argv.includes('--check');
const {browser, get} = await authed();
let changed = 0;
for (const file of [...listSkillFiles(CORE_DIR), ...listSkillFiles(EXAMPLE_DIR)]) {
  const local = readSkill(file);
  let rows = await get(`sn_build_agent_instruction?sysparm_query=name=${local.name}&sysparm_fields=name,description,body`);
  if (!rows.length && RENAMED[local.name]) rows = await get(`sn_build_agent_instruction?sysparm_query=name=${RENAMED[local.name]}&sysparm_fields=name,description,body`);
  if (!rows.length) { console.log('not on instance', local.name); continue; }
  const remote = {name: local.name, description: rows[0].description, body: rows[0].body.replace(/\s+$/, '')};
  const same = remote.description === local.description && remote.body === local.body;
  console.log(same ? 'same   ' : 'differs', local.name);
  if (!same) { changed++; if (!check) writeSkill(file, remote); }
}
console.log(check ? `${changed} differ` : `${changed} updated`);
await browser.close();
