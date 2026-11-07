# Flux

A Build Agent skill and a method for building full ServiceNow apps with a Lux (AIUX) UI. Build Agent builds and installs the Fluent backend in Studio and writes the Lux source. Lux Lab (or `now-sdk`) compiles and installs the UI from a laptop.

Build Agent knows nothing about Lux out of the box, and Studio cannot install `@servicenow/aiux`. The skill covers the first problem. The method works around the second.

Meccha Octopus ([leojacinto/meccha-octopus](https://github.com/leojacinto/meccha-octopus)) is the test case, in `examples/meccha-octopus/`. It is not the product.

## The method

1. **Load the skills** into Build Agent (`scripts/load-skills.mjs`). They are records in `sn_build_agent_instruction`.
2. **Fluent app.** Prompt Build Agent with `prompts/fluent-app.template.txt`. It plans, you approve, it builds and installs tables, role, ACLs and REST APIs from Studio, and verifies them.
3. **Lux UI app.** Prompt Build Agent with `prompts/lux-ui-app.template.txt`. It creates a second app and writes the Lux source only. It does not build, because Studio cannot.
4. **Export** the UI app's files from Studio (`scripts/export.mjs`).
5. **Compile and install** the UI app in Lux Lab or a terminal, from inside the app folder:
   ```
   pnpm install
   pnpm build
   pnpm run deploy
   ```
   Open `https://<instance>/aiux/<basename>/home`.
6. **Change it later** in the local folder, or ask Build Agent, then export, build and deploy again. Do not edit the UI app in Studio after the install.

The backend and the UI are separate apps on purpose. The Fluent app stays in Studio and is never touched from the laptop. Only the UI app is installed locally, so the two cannot drift apart.

## Skills

| Skill | Source | Does | Used in the Meccha Octopus test |
| ----- | ------ | ---- | ------------------------------- |
| `lux-aiux-build` | built by `load-skills.mjs` from `@servicenow/agent-pack-aiux` | Main Lux rules for Build Agent | Yes |
| `lux-ref-app`, `lux-ref-foundation`, `lux-ref-design` | built by `load-skills.mjs` from the same pack | AIUX reference material and a project scaffold | Yes |
| `lux-meccha-src-lib`, `lux-meccha-src-ui` | `load-skills.mjs --example` | Original Meccha Octopus source and porting rules | Yes |
| `lux-app-method` | `skills/lux-app-method/SKILL.md` | The method: two apps, scope handling, Fluent steps, Lux file list and config templates, porting rules, handoff summary | No. Added afterwards, not tested yet |

The pack skills are generated at load time, not copied into this repo. A skill body is limited to 65,000 characters and extra files on a skill are blocked on the instance tested, so the reference material is split across several skills.

## Use it

```
cd scripts && npm install && cd ..
export INSTANCE_URL=https://<instance>.service-now.com
export INSTANCE_USER=<admin user> INSTANCE_PASSWORD=<password>
node scripts/login.mjs

# REFERENCE_APP = a Lux project with pnpm install done, so
# node_modules/@servicenow/agent-pack-aiux exists (a clone of meccha-octopus works)
REFERENCE_APP=/path/to/lux-project node scripts/load-skills.mjs run
```

Then, in Studio's Build Agent:

1. Fill in `prompts/fluent-app.template.txt`, send it, read the plan, approve it.
2. Fill in `prompts/lux-ui-app.template.txt`, send it, approve the plan.
3. Export the UI app and build it:
   ```
   node scripts/export.mjs <workspaceId>:<ui scope>:my-app-ui
   cd my-app-ui && pnpm install && pnpm build && pnpm run deploy
   ```

The workspace id is the first path segment in the `ba-file:/<id>/<scope>/...` file URIs of the Build Agent workspace. Set `CHROME_PATH` if Playwright has no browser installed. Authenticate the SDK first with `npx now-sdk auth`.

## Test case: Meccha Octopus

Rebuilt without the IBM integration (shots come from a table) and without the 3D world model.

* Build Agent built and installed the Fluent app by itself: a shot table, a role, 4 ACLs and `GET /pool`.
* Build Agent wrote the full Lux UI (19 files) in a second app.
* Compiling and installing Lux was the only step done outside Studio.
* The deployed app plays a 100 round match from real IBM shots (82% against 76% for a classical strategy).

What needed a person:

* Replacing the Studio scaffold's `now.config.json` and `package.json` with the AIUX shape. The skill now includes templates for this.
* Restoring `octo-scoreboard.js`. Build Agent rewrote it instead of copying it and the chart lines did not draw.
* Running the Lux compile and install.

Files: `examples/meccha-octopus/lux-app` (build this one), `examples/meccha-octopus/fluent-app` (reference only, already installed from Studio), `examples/meccha-octopus/prompts`, and `scripts/seed-shots.mjs` and `scripts/check-pool.mjs` for the shot table.

## Layout

* `skills/lux-app-method/` — the skill.
* `prompts/` — prompt templates.
* `scripts/` — Playwright helpers: `login`, `load-skills`, `export`, `seed-shots`, `check-pool`, and `drive`, `c.sh`, `rec` (drive a browser by commands and record a square 1080 x 1080 video).
* `examples/meccha-octopus/` — the test case.

## Status

Tested: the six Lux and example skills were loaded into Build Agent, and Build Agent used them to build the Meccha Octopus test case end to end. The method itself (two apps, scope fallback, source only, config fix, handoff) was given to Build Agent in the prompts in `examples/meccha-octopus/prompts` and done by hand where noted above.

Not tested: `lux-app-method`. It puts the method into a skill so the prompts can be short, but it has not been loaded or run yet. The `lux-aiux-build` skill on the instance also needs `load-skills.mjs run` rerun to pick up its updated header.

Rerunning the Build Agent steps creates new apps with new numbered scopes.

## Limits

* The create-app tool cannot set a scope. It generates `x_snc_<name>_0`, then `_1`, and so on. The prompts ask for a scope and fall back to the generated one.
* Build Agent does not always port code verbatim. Diff ported files against the source.
* Studio file content is not readable through the Table API. `scripts/export.mjs` uses `/api/sn_glider/sync/state` and `/api/sn_glider/sync/files`.
* Plain `pnpm deploy` is a different pnpm command. Use `pnpm run deploy`.

## Requirements

Node 24 or later, pnpm 10 or later, `@servicenow/sdk` 4.12.1 or later, an instance on Australia Patch 5 or Zurich Patch 12 or later with Build Agent and custom skills enabled, and admin on that instance.
