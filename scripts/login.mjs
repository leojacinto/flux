// Logs in once and saves the browser session to .local/state.json (git-ignored).
// Usage: INSTANCE_URL=... INSTANCE_USER=... INSTANCE_PASSWORD=... node scripts/login.mjs
import fs from 'node:fs';
import path from 'node:path';
import {BASE, STATE, launch} from './lib.mjs';

const {INSTANCE_USER: user, INSTANCE_PASSWORD: pass} = process.env;
if (!user || !pass) throw new Error('Set INSTANCE_USER and INSTANCE_PASSWORD');
const browser = await launch();
const ctx = await browser.newContext({viewport: {width: 1500, height: 950}});
const page = await ctx.newPage();
await page.goto(BASE + '/login.do');
await page.fill('#user_name', user);
await page.fill('#user_password', pass);
await page.click('#sysverb_login');
await page.waitForLoadState('networkidle').catch(() => {});
fs.mkdirSync(path.dirname(STATE), {recursive: true});
await ctx.storageState({path: STATE});
console.log('saved', STATE);
await browser.close();
