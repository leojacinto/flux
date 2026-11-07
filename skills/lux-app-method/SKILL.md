---
name: lux-app-method
description: Build a full ServiceNow app with a Lux (AIUX) UI using Build Agent plus a local Lux compile. Use when the user asks for an app, page or UI in Lux or AIUX, or a Fluent backend with a Lux front end. Splits the work into a Fluent app built and installed in Studio and a Lux UI app written as source only.
---

# lux-app-method

Lux is the product name for the AIUX framework (`@servicenow/aiux`, Lit, `AIUXElement`). Output for Lux requests is a Lux app, never a React UI Page.

Studio cannot install `@servicenow/aiux`, so it cannot compile or install a Lux app. Build Agent writes all the source. A person (or a script) compiles and installs the Lux app on a laptop with Lux Lab or `now-sdk`. Plan for that split from the start.

Invoke these companion skills before writing Lux code: `lux-aiux-build` (main Lux rules), `lux-ref-app` (scaffold, pages, navigation, theme), `lux-ref-foundation` (AIUXElement, Lit, SSR, data fetching), `lux-ref-design` (DaisyUI, Tailwind, validation).

## 1. Two apps, never one

1. Fluent app (backend): tables, roles, ACLs, Scripted REST APIs, Script Includes, properties. Build it and install it from Studio as usual. Write no Lux or UI files in this app.
2. Lux UI app: `aiux.json`, `application.js`, `theme.js`, `pages/<route>/page.js`, components, `lib/`. Write source only. Do not run build or install on this app.

Why two: the Fluent app stays in Studio and is never touched from the laptop. Only the UI app (no Fluent objects) is installed locally, so the backend and Studio cannot drift apart.

## 2. Scopes

The create-app tool does not accept a scope. It generates one (`x_snc_<name>_0`, then `_1`, and so on). Ask for the scope the user wants; if the tool cannot set it, do not stop and do not ask. Use the generated scope and state both scopes in the summary.

The UI reaches the backend over HTTP, so the REST URL is `/api/<fluent scope>/<service id>/<route>`. Put that URL in one constant at the top of the page file.

## 3. Fluent app

1. Show the plan first, then build after approval.
2. Prefix every object with the app scope: table `<scope>_<name>`, role `<scope>.user`.
3. For each table, add read, write, create and delete ACLs for `admin` and the app role.
4. Scripted REST API: set `authentication: true`, no outbound calls unless the user asks, and return only what the UI needs.
5. Verify before finishing: insert temporary rows, call the route, check the response shape, delete the rows.

## 4. Lux UI app

Files to write: `package.json`, `aiux.json`, `now.config.json`, `application.js`, `theme.js`, `head.app.css`, `tailwind.app.css`, `lib/*.js`, `pages/<route>/page.js`, `pages/<route>/components/*.js`, `src/fluent/index.now.ts` (`export {};`).

Rules:

- Components extend `AIUXElement` from `@servicenow/aiux/aiux-components-core`, never `LitElement`.
- Guard browser globals with `isServer` from `lit`.
- Fetch with `aiuxFetch`; the body is `{result: ...}`.
- Every user-visible string goes through `i18n.getMessage()`.
- Style with Tailwind and DaisyUI (`aiux-` classes). No `--now-*` tokens.
- Keep `aiux.json#basename` equal to `package.json#aiux.basename`. The app route is `/aiux/<basename>/<page>`.

The Studio scaffold's `now.config.json` and `package.json` have no AIUX settings (no `metadataDir`, `staticContent` or AIUX dependencies). Replace them with files in this shape, which is the shape that was built and deployed:

`now.config.json` (use the app's real scope and scope id from the scaffold):

```json
{
  "scope": "<scope>",
  "scopeId": "<scope id from the scaffold>",
  "name": "<app name>",
  "metadataDir": "src/plugin-xmls",
  "appOutputDir": "dist-metadata/app",
  "packageSourceCodeOnInstance": true,
  "staticContent": {
    "assets": {
      "./public/**": {"publicPath": "[$config.aiux.basename]/public"}
    }
  }
}
```

`package.json`:

```json
{
  "name": "<basename>",
  "private": true,
  "aiux": {"basename": "<basename>"},
  "scripts": {
    "build": "now-sdk build",
    "dev": "now-sdk run dev",
    "deploy": "now-sdk install",
    "lint": "eslint ."
  },
  "dependencies": {"@servicenow/aiux": "latest", "lit": "^3.2.1"},
  "devDependencies": {
    "@babel/eslint-parser": "^7.28.0",
    "@babel/plugin-proposal-decorators": "^7.29.0",
    "@eslint/js": "^9.39.0",
    "@servicenow/sdk": "4.12.2",
    "eslint": "^9.0.0",
    "globals": "^16.0.0"
  },
  "engines": {"node": ">=24.14.1"}
}
```

Add any chart or utility libraries the code imports (for example `d3-scale`, `d3-shape`) to `dependencies`.

## 5. Porting existing code

- Copy the reference source verbatim. Change only what the task requires (names, URLs, removed features).
- Do not rewrite or "clean up" a ported file. A rewritten chart component once stopped drawing its lines; the original file fixed it.
- List every file you changed from the reference, and why.

## 6. Finish with a handoff summary

End the UI app run with a summary that lists: both scopes, every file written, the REST URL the UI calls, any data the backend still needs seeded, and the commands to run from inside the UI app folder on a laptop:

```
pnpm install
pnpm build
pnpm run deploy
```

Use `pnpm run deploy`; plain `pnpm deploy` is a different pnpm command. The app then loads at `/aiux/<basename>/<page>`.

After the install, the UI app must not be edited in Studio. Change the source locally (or ask Build Agent), export, rebuild and redeploy.
