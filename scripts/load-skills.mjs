// Publishes the skills in this repo to Build Agent as instruction records
// (type=skill, applies_to=instance). Safe to rerun: records are matched by name and updated.
//   skills/*/SKILL.md                                        the Lux skills
//   examples/meccha-octopus/skills/*/SKILL.md                the test case skills, only with --example
// Usage: node scripts/load-skills.mjs [dry|run] [--example]   (dry prints sizes only)
import {authed} from './lib.mjs';
import {CORE_DIR, EXAMPLE_DIR, MAX_BODY, RENAMED, listSkillFiles, readSkill} from './skills-lib.mjs';

const mode = process.argv[2] === 'run' ? 'run' : 'dry';
const files = [...listSkillFiles(CORE_DIR), ...(process.argv.includes('--example') ? listSkillFiles(EXAMPLE_DIR) : [])];
const skills = files.map(readSkill);
for (const s of skills) console.log(s.name.padEnd(30), s.body.length);
const tooLong = skills.filter(s => s.body.length > MAX_BODY);
if (tooLong.length) throw new Error(`Over the ${MAX_BODY} character body limit: ${tooLong.map(s => s.name).join(', ')}`);
if (mode === 'dry') process.exit(0);

const {browser, get, post, patch} = await authed();
for (const s of skills) {
  const rec = {name: s.name, description: s.description, type: 'skill', applies_to: 'instance', active: 'true', body: s.body};
  let ex = await get(`sn_build_agent_instruction?sysparm_query=name=${s.name}&sysparm_fields=sys_id`);
  if (!ex.length && RENAMED[s.name]) ex = await get(`sn_build_agent_instruction?sysparm_query=name=${RENAMED[s.name]}&sysparm_fields=sys_id`);
  if (ex.length) await patch(`sn_build_agent_instruction/${ex[0].sys_id}`, rec);
  else await post('sn_build_agent_instruction', rec);
  console.log('published', s.name);
}
await browser.close();
