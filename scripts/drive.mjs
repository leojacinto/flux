// Interactive driver. Start it, then send commands with scripts/c.sh. It records a square video.
// Usage: INSTANCE_URL=... node scripts/drive.mjs <recording-name>
// Commands (JSON): goto {url} | click {x,y} | type {text} | press {key} | wait {ms}
//                  scroll {x,y,dy} | step {title,note} | shot | eval {js} | close
import fs from 'node:fs';
import path from 'node:path';
import {BASE, ROOT} from './lib.mjs';
import {session} from './rec.mjs';

const dir = path.join(ROOT, '.local/cmd');
fs.mkdirSync(dir, {recursive: true});
const {page: p, step, close} = await session(process.argv[2] || 'run');
console.log('ready');
let done = false;
while (!done) {
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const c = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
    fs.renameSync(`${dir}/${f}`, `${dir}/${f}.run`);
    let out = 'ok';
    try {
      if (c.action === 'goto') await p.goto(c.url.startsWith('http') ? c.url : BASE + c.url, {waitUntil: 'commit', timeout: 120000});
      else if (c.action === 'click') await p.mouse.click(c.x, c.y);
      else if (c.action === 'type') await p.keyboard.type(c.text, {delay: 5});
      else if (c.action === 'press') await p.keyboard.press(c.key);
      else if (c.action === 'wait') await p.waitForTimeout(c.ms);
      else if (c.action === 'scroll') { await p.mouse.move(c.x, c.y); await p.mouse.wheel(0, c.dy); }
      else if (c.action === 'step') await step(c.title, c.note || '');
      else if (c.action === 'shot') await p.screenshot({path: path.join(ROOT, '.local/live.png'), timeout: 120000});
      else if (c.action === 'eval') out = JSON.stringify(await p.evaluate(c.js));
      else if (c.action === 'close') done = true;
    } catch (e) { out = 'ERR ' + String(e.message).slice(0, 300); }
    fs.writeFileSync(`${dir}/${f}.done`, out);
  }
  await new Promise(r => setTimeout(r, 700));
}
await close();
