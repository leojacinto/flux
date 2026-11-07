# Flux

Meccha Octopus rebuilt with ServiceNow Build Agent: Fluent objects built and installed in Studio, Lux (AIUX) UI written by Build Agent and compiled locally. The original app is [leojacinto/meccha-octopus](https://github.com/leojacinto/meccha-octopus). This version has no IBM integration (shots come from a table) and no 3D world model.

Build Agent knows nothing about Lux out of the box, so six custom skills teach it. Studio cannot install `@servicenow/aiux`, so the Lux build and install runs on a laptop.

## Layout

* `lux-app/` — the Lux UI app. Build and install this one.
  * `pages/home/page.js` plus `pages/home/components/` — arena, picker, scoreboard, proof panel.
  * `lib/` — game logic, octopus art, sound.
  * `now.config.json`, `aiux.json` — scope, scope id and app basename (`meccha-octopus-ba`).
* `fluent-app-reference/` — Fluent source Build Agent wrote (table, role, ACLs, `/pool` REST API). Reference only. It was installed from Studio; do not install it again from here.
* `prompts/` — the two Build Agent prompts used (`fluent-app.txt`, `lux-ui-app.txt`).
* `scripts/` — Playwright helpers.
  * `login.mjs` saves a login session to `.local/state.json` (git-ignored).
  * `load-skills.mjs` publishes the six skills to `sn_build_agent_instruction`.
  * `seed-shots.mjs`, `check-pool.mjs` — fill and check the shot table.
  * `export.mjs` — copies Studio workspace files to disk.
  * `drive.mjs`, `c.sh`, `rec.mjs` — drive a browser by commands and record a square 1080 x 1080 video.
* `docs/` — walkthrough, screenshots and videos. Kept local for now, not in the repo.

## Requirements

Node 24 or later, pnpm 10 or later, `@servicenow/sdk` 4.12.1 or later, an instance on Australia Patch 5 / Zurich Patch 12 or later with Build Agent and custom skills enabled, and admin on that instance.

## Build the Lux app

```
cd lux-app
pnpm install
pnpm build
pnpm run deploy
```

Run it from inside `lux-app/`. Use `pnpm run deploy`; plain `pnpm deploy` is a different pnpm command. Authenticate first with `npx now-sdk auth`.

Open `https://<instance>/aiux/meccha-octopus-ba/home`.

`lux-app/now.config.json` carries the scope (`x_snc_meccha_oct_2`) and scope id from the instance this was built on. For another instance, create a Lux UI app in Studio first and put its scope and scope id there. The page also calls the REST API of the Fluent app, so change `POOL_URL` in `pages/home/page.js` to your Fluent app's scope.

## Reproduce the whole chain

```
cd scripts && npm install && cd ..
export INSTANCE_URL=https://<instance>.service-now.com
export INSTANCE_USER=<admin user> INSTANCE_PASSWORD=<password>
node scripts/login.mjs

# 1. skills (MECCHA_SRC = clone of leojacinto/meccha-octopus after pnpm install)
MECCHA_SRC=/path/to/meccha-octopus node scripts/load-skills.mjs run

# 2. in Studio, give Build Agent prompts/fluent-app.txt, approve the plan
# 3. seed shots into <fluent scope>_shot_set from an IBM Sampler V2 result file
node scripts/seed-shots.mjs <fluent scope> <result.json>
node scripts/check-pool.mjs <fluent scope>

# 4. in Studio, give Build Agent prompts/lux-ui-app.txt, approve the plan
# 5. copy the workspace files out, then build locally as above
node scripts/export.mjs <workspaceId>:<ui scope>:lux-app
```

The workspace id is the first path segment in the `ba-file:/<id>/<scope>/...` URIs; it is visible in the Build Agent workspace file URIs. Set `CHROME_PATH` if Playwright has no browser installed.

The Build Agent steps are driven by hand from screenshots. Rerunning them creates new apps with new numbered scopes.

## Notes

* The create-app tool cannot set a scope. It generates `x_snc_<name>_0`, then `_1`, and so on. Prompts ask for a scope and fall back to the generated one.
* Skills are limited to 65,000 characters and cannot carry extra files here, so the reference material is split across six skills.
* Build Agent does not always port code verbatim. It rewrote `octo-scoreboard.js` and the chart lines stopped drawing; the original file was restored. Diff ported files against the source.
* After the local install, do not edit the UI app in Studio. Change `lux-app/`, rebuild, redeploy.
* Studio file content is not readable through the Table API. `scripts/export.mjs` uses `/api/sn_glider/sync/state` and `/api/sn_glider/sync/files`.
* The IBM result file used for seeding is not included, because it carries an account id. Use your own, or the one from the original repo's `python/out/`.
