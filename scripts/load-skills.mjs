// Publishes the skills in this repo to Build Agent as instruction records
// (type=skill, applies_to=instance). Safe to rerun: records are matched by name and updated.
//   skills/*/SKILL.md   the Lux skills
// The records belong to the app with scope SKILLS_APP_SCOPE (default x_snc_flux). Only a session
// whose application picker is on that app can edit them, so the script switches the picker to it
// and puts it back afterwards. The app must exist (create it with scope x_snc_flux first).
// Usage: node scripts/load-skills.mjs [dry|run]   (dry prints sizes only)
import {authed} from './lib.mjs';
import {CORE_DIR, MAX_BODY, listSkillFiles, readSkill} from './skills-lib.mjs';

const mode = process.argv[2] === 'run' ? 'run' : 'dry';
const skills = listSkillFiles(CORE_DIR).map(readSkill);
for (const s of skills) console.log(s.name.padEnd(30), s.body.length);
const tooLong = skills.filter(s => s.body.length > MAX_BODY);
if (tooLong.length) throw new Error(`Over the ${MAX_BODY} character body limit: ${tooLong.map(s => s.name).join(', ')}`);
if (mode === 'dry') process.exit(0);

const {browser, get, post, patch, raw} = await authed();
const scope = process.env.SKILLS_APP_SCOPE || 'x_snc_flux';
const app = (await get(`sys_app?sysparm_query=scope=${scope}&sysparm_fields=sys_id`))[0];
if (!app) throw new Error(`No app with scope ${scope}. Create it first (Studio or System Applications > Custom Applications).`);
const picker = id => raw('PUT', '/api/now/ui/concoursepicker/application', {app_id: id});
const back = (await raw('GET', '/api/now/ui/concoursepicker/current')).currentApplication.sysId;
try {
await picker(app.sys_id);
for (const s of skills) {
  const rec = {name: s.name, description: s.description, type: 'skill', applies_to: 'instance', active: 'true', body: s.body};
  const ex = await get(`sn_build_agent_instruction?sysparm_query=name=${s.name}&sysparm_fields=sys_id`);
  if (ex.length) await patch(`sn_build_agent_instruction/${ex[0].sys_id}`, rec);
  else await post('sn_build_agent_instruction', rec);
  console.log('published', s.name);
}
} finally {
  await picker(back);
  await browser.close();
}
