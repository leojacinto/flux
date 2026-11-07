// Exports Studio / Build Agent workspace files to disk, byte for byte.
// Usage: node scripts/export.mjs <workspaceId>:<scope>:<outDir> [...]
// The workspace id is the id in the ba-file:/<id>/<scope>/... URIs, see docs/walkthrough.md.
import fs from 'node:fs';
import path from 'node:path';
import {authed} from './lib.mjs';

const targets = process.argv.slice(2).map(a => { const [ws, scope, out] = a.split(':'); return {ws, scope, out}; });
if (!targets.length) throw new Error('Usage: node scripts/export.mjs <workspaceId>:<scope>:<outDir> ...');
const {browser, raw} = await authed();
const post = async (u, d) => { const r = await raw('POST', u, d); return r; };
for (const t of targets) {
  const st = await post('/api/sn_glider/sync/state', {uris: [`ba-file:/${t.ws}/`]});
  const files = st.files.filter(f => f.type === 'file' && !f.dtime && !/@types|\/target\/|\.git\/|node_modules/.test(f.uri));
  const res = await post('/api/sn_glider/sync/files', {uris: files.map(f => f.uri)});
  const byCs = new Map(res.contents.map(c => [c.checksum, c.content]));
  let n = 0;
  for (const f of res.files) {
    const b64 = byCs.get(f.checksum);
    if (b64 === undefined) { console.log('NO CONTENT', f.uri); continue; }
    const buf = Buffer.from(b64, 'base64');
    const dest = path.join(t.out, f.uri.split(`/${t.scope}/`)[1]);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.writeFileSync(dest, buf);
    n++;
    console.log(buf.length === +f.size ? 'ok  ' : 'SIZE', dest, buf.length, '/', f.size);
  }
  console.log(t.scope, 'exported', n, 'of', files.length);
}
await browser.close();
