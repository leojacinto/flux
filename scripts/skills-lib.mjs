import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib.mjs';

export const MAX_BODY = 65000;
export const CORE_DIR = path.join(ROOT, 'skills');
export const EXAMPLE_DIR = path.join(ROOT, 'examples/meccha-octopus/skills');

// Records created under an older name. The loader renames them instead of adding a duplicate.
export const RENAMED = {
  'example-meccha-octopus-lib': 'lux-meccha-src-lib',
  'example-meccha-octopus-ui': 'lux-meccha-src-ui',
};

export function readSkill(file) {
  const t = fs.readFileSync(file, 'utf8');
  const m = t.match(/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const fm = Object.fromEntries(m[1].split('\n').map(l => { const i = l.indexOf(': '); return [l.slice(0, i), l.slice(i + 2)]; }));
  const description = fm.description.startsWith('"') ? JSON.parse(fm.description) : fm.description;
  return {name: fm.name, description, body: m[2].replace(/\s+$/, '')};
}

export function writeSkill(file, {name, description, body}) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n\n${body.replace(/\s+$/, '')}\n`);
}

export function listSkillFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).filter(e => e.isDirectory())
    .map(e => path.join(dir, e.name, 'SKILL.md')).filter(f => fs.existsSync(f));
}
