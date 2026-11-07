import {chromium} from 'playwright-core';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BASE = (process.env.INSTANCE_URL || '').replace(/\/$/, '');
export const STATE = path.join(ROOT, '.local/state.json');
export const EXE = process.env.CHROME_PATH || undefined;
if (!BASE) throw new Error('Set INSTANCE_URL, for example https://<instance>.service-now.com');

export const launch = () => chromium.launch({headless: true, executablePath: EXE});

// Opens a classic page with the saved login so window.g_ck (the session token) exists, then
// returns small helpers for the Table API and any other instance REST path.
export async function authed() {
  const browser = await launch();
  const ctx = await browser.newContext({storageState: STATE});
  const page = await ctx.newPage();
  await page.goto(BASE + '/sn_build_agent_instruction_list.do', {waitUntil: 'commit', timeout: 120000});
  await page.waitForTimeout(6000);
  const tok = await page.evaluate(() => window.g_ck);
  if (!tok) throw new Error('No session token. Run: node scripts/login.mjs');
  const H = {'X-UserToken': tok, Accept: 'application/json', 'Content-Type': 'application/json'};
  const call = async (method, url, data) => {
    const r = await page.request.fetch(BASE + url, {method, headers: H, data: data ? JSON.stringify(data) : undefined});
    if (!r.ok()) throw new Error(`${method} ${url} ${r.status()} ${(await r.text()).slice(0, 200)}`);
    return r.status() === 204 ? null : (await r.json()).result;
  };
  return {
    browser, page, tok,
    get: u => call('GET', '/api/now/table/' + u),
    post: (u, d) => call('POST', '/api/now/table/' + u, d),
    patch: (u, d) => call('PATCH', '/api/now/table/' + u, d),
    raw: call,
  };
}
