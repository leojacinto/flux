// Recorder: a 1080 x 1080 browser with video, plus a step() that saves a square screenshot and
// logs it to docs/steps/<name>.json.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, STATE, launch} from './lib.mjs';

export async function session(name) {
  const browser = await launch();
  const raw = path.join(ROOT, 'docs/video/raw');
  const ctx = await browser.newContext({
    viewport: {width: 1080, height: 1080},
    storageState: STATE,
    recordVideo: {dir: raw, size: {width: 1080, height: 1080}},
  });
  const page = await ctx.newPage();
  const steps = [];
  let n = 0;
  const step = async (title, note = '') => {
    n++;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const file = `${name}-${String(n).padStart(2, '0')}-${slug}.png`;
    fs.mkdirSync(path.join(ROOT, 'docs/shots'), {recursive: true});
    await page.screenshot({path: path.join(ROOT, 'docs/shots', file), timeout: 120000});
    steps.push({n, title, note, shot: `shots/${file}`});
    fs.mkdirSync(path.join(ROOT, 'docs/steps'), {recursive: true});
    fs.writeFileSync(path.join(ROOT, `docs/steps/${name}.json`), JSON.stringify(steps, null, 2));
    console.log('step', n, title);
  };
  const close = async () => {
    const v = page.video();
    await ctx.close();
    await browser.close();
    if (v) fs.renameSync(await v.path(), path.join(ROOT, `docs/video/${name}.webm`));
    console.log('video saved', `docs/video/${name}.webm`);
  };
  return {page, step, close};
}
