---
name: lux-aiux-build
description: "Build Lux (AIUX) apps, pages, widgets and components with @servicenow/aiux, Lit and AIUXElement. Use when the user asks for Lux or AIUX output (aiux.json, pages/, application.js). Output is Lux, never React UI Pages. Invoke lux-ref-app, lux-ref-foundation and lux-ref-design first."
---

# lux-aiux-build (Lux = AIUX)
Lux is the product name for the AIUX framework (@servicenow/aiux, Lit, AIUXElement). Output for Lux requests must be a Lux app: aiux.json, application.js, theme.js, pages/<route>/page.js, plus Fluent (*.now.ts) for tables, ACLs and REST APIs. Never produce React UI Pages for Lux requests.
Before writing code, invoke lux-app-method (how to split a full app between Studio and a local Lux build), then these companion skills by name: lux-ref-app (project scaffold to copy, pages, navigation, theme), lux-ref-foundation (AIUXElement, Lit, SSR, loaders, data fetching, server scripts), lux-ref-design (DaisyUI, Tailwind, validation, audit). Paths such as references/... in the text below refer to files inside those companion skills.

# AIUX Build

Orchestrator skill for building production-quality AIUX apps. It directs the LLM to the right reference file or companion skill at each decision point.

**Prerequisite:** App scaffold exists — `aiux.json`, `package.json`, `pages/` directory, and either `pages/layout.js` (simple pattern) or `application.js` (production pattern).

---

## Companion Skills — When to Invoke

These skills must be invoked at the exact moments listed. They are not optional.

| Skill                   | Invoke when                                                                             | What it provides                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `ui-discovery`          | **Before writing any UI code** — every BUILD and EDIT task                              | Unified index of packaged components AND widgets installed on the connected instance. Reuse what it ranks; write custom only when nothing matches. |
| `accessibility`         | **Every BUILD and EDIT task** — all UI components and pages regardless of apparent interactivity level | WCAG 2.2 AA ARIA patterns, keyboard nav, focus management, live regions, Shadow DOM labeling, reflow, forced-colors              |
| `internationalization`  | Any user-visible string, date, number, currency, or sort operation                      | Correct `i18n.getMessage()` usage, parameterized messages, ICU plural/select, locale-aware formatting                            |
| `localization`          | Adding a new locale, RTL layout, translated catalogs, script/font coverage              | Per-locale adaptation on top of the i18n layer (prerequisite: `internationalization` already applied)                            |
| `migrate-header-config` | Migrating `headerConfig.js` per-page files into `application.js`                        | Post-migration review: stale comments, CSR/SSR behavior changes, scope problems                                                  |

**Order of operations for BUILD and EDIT tasks:**

1. `ui-discovery` — rank components and widgets, reuse a match or decide to write custom
2. Write the component/page/widget using this skill's references
3. `accessibility` — wire ARIA, keyboard, focus, reflow, and forced-colors (mandatory — not conditional on presence of interactive elements)
4. `internationalization` — wrap all strings, format all locale-sensitive values

> **EDIT tasks included:** Steps 3–4 apply after every EDIT that touches templates or server scripts — not only on net-new BUILD tasks.

---

## Mode Router

**Step 1 — Classify intent.** Do NOT load references yet.

| User intent                                           | Mode        | References to load (after intent is clear)                          |
| ----------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| "Add", "build", "create", "new page/widget/component" | **BUILD**   | `app/pages-cookbook.md` + relevant widget refs                      |
| "Add extension", "extend `<host app>`", "overlay page on `<host>`" | **BUILD (extension)** | `app/extensions.md`                                                 |
| "Change", "update", "edit", "add nav item", "modify"  | **EDIT**    | `app/navigation-patterns.md`, `app/theme-and-config.md`             |
| "Not working", "error", "broken", "fix", "debug"      | **DEBUG**   | `quality/debugging-guide.md`, `quality/validation-rules.md`         |
| "Review", "audit", "check quality", "analyze"         | **ANALYZE** | `quality/audit-checklist.md`, `quality/best-practices-checklist.md` |

**Step 2 — If intent is ambiguous, ask the user to clarify** before loading any references.

**Step 3 — Load only the references listed** for the classified mode. Read each file directly from this skill's `references/` directory (e.g. `references/app/pages-cookbook.md`). Do not load references for other modes.

For BUILD: also invoke `ui-discovery` before loading any other reference.

---

## Project Discovery (always first)

Read these before writing a single line:

1. `aiux.json` — basename, landing page, chat gate
2. `package.json` — dependencies, scripts
3. `theme.js` — color tokens, shape
4. `pages/` directory listing — routing conventions, existing patterns
5. `application.js` or `pages/layout.js` — which app architecture pattern is in use
6. One existing page file — learn the naming and import style the project already uses

---

## App Architecture

Two patterns exist. Detect which one the project uses before writing navigation or layout code.

| Signal                                                   | Pattern        | Where nav items live       |
| -------------------------------------------------------- | -------------- | -------------------------- |
| `pages/layout.js` extends `NavLayout`                    | **Simple**     | `pages/layout.js` loader   |
| `application.js` exports `{ setup, navigate, teardown }` | **Production** | `application.js` `setup()` |

**Simple — `pages/layout.js`:**

```js
import {NavLayout, navLayoutContext} from '@servicenow/aiux-components-nav';
@customElement('my-app-layout')
export default class MyAppLayout extends NavLayout {
  static appTheme = MY_THEME;
  static async loader(ctx) {
    await super.loader(ctx, {appName: 'My App', features: {logo: true}});
    navLayoutContext.set({...navLayoutContext.get(), items: [...]});
  }
}
```

**Production — `application.js`:**

```js
export default {
  appTheme: MY_THEME,
  applicationLayout: 'aiux-nav-layout',  // required — platform nav shell
  contexts: [licenseContext],             // auto-fetched before setup()
  async setup(ctx) {
    navLayoutContext.set({
      ...navLayoutContext.get(),
      appTitle: i18n.getMessage('My App'),
      features: {logo: true, profile: true, chat: ctx.chat?.enabled === true},
      items: [...]
    });
  },
  navigate(navCtx) { return undefined; },
  teardown() { navLayoutContext.set({items: []}); }
};
```

Page filename: `page.js`.

---

## Placement Conventions

| Artifact               | Location                                | Rule                                                   |
| ---------------------- | --------------------------------------- | ------------------------------------------------------ |
| App lifecycle          | `application.js`                        | `setup()`, `navigate()`, `teardown()`, theme, contexts |
| Theme                  | `theme.js`                              | Color tokens, shape — imported by `application.js`     |
| Pages                  | `pages/<route>/page.js`                 | File-based routing                                     |
| Nested layouts         | `pages/<route>/layout.js`               | Scoped context providers                               |
| Extension pages        | `src/extensions/<host>/pages/<route>/page.js` | Overlay on a different host app — see `references/app/extensions.md` |
| Page-scoped components | `pages/<route>/components/`             | Used by one page only                                  |
| Shared components      | `components/`                           | Used by 2+ pages                                       |
| Widgets                | `widgets/<name>/index.js` + `server.js` | Self-contained with server script                      |
| Shared loaders         | `loaders/`                              | Fetch functions shared across pages                    |
| Contexts               | `contexts/`                             | `createContext()` definitions                          |
| Constants              | `constants/`                            | Table fields, roles, enums                             |
| Utilities              | `utils/`                                | Formatters, shared helpers                             |
| Document title         | `utils/document-title.js`               | `setDocumentTitle()` — WCAG 2.4.2 page titles          |

---

## BUILD Mode

### Step 0 — UI Discovery (mandatory gate)

Invoke the `ui-discovery` skill before drafting any plan. It is mandatory, not optional. It returns a suggested component or widget, or nothing if none fits.

### Step 1 — Present Plan (mandatory gate)

Once the discovery gate above has run, present a concise plan to the user:

1. **What you understood** — restate the user's request in your own words
2. **What you will build** — list pages, widgets, components, server scripts, and say explicitly whether each is a reused `ui-discovery` match or new custom code, and why
3. **Navigation changes** — new routes, nav items, layout changes
4. **Data sources** — tables, APIs, server script actions
5. **Styling approach** — theme tokens, DaisyUI components, custom CSS

Wait for user confirmation. If the user corrects or refines, update the plan. Only proceed after approval.

### Step 2 — Adding a Page

If the target page overlays a different, existing host application (`src/extensions/...`) rather than this app's own `pages/` directory, load `references/app/extensions.md` instead and follow its steps. Otherwise:

Load: `references/app/pages-cookbook.md`

1. Detect page type: home / list / record / custom / nested-layout
2. Create `pages/<route>/page.js` extending `AIUXElement`
3. Add `static async loader(ctx)` for data — use `Promise.allSettled` for multiple fetches
4. Add `firstUpdated()` calling `setDocumentTitle(getMessage('Page Name'))` — required for every non-layout page (WCAG 2.4.2)
5. Wire navigation in `application.js` setup() or `pages/layout.js` loader
6. Apply `isServer` guards to any browser API in `connectedCallback`
7. If the page renders any configurable widget (has `@configProperty`), add the `aiux-config-id` attribute on each instance — load `references/config-framework/config-id.md`

### Step 3 — Adding a Widget

Load: `references/widget/component-patterns.md`, `references/widget/server-scripts.md`, `references/widget/decorators.md`, `references/widget/data-fetching.md`

1. Create `widgets/<name>/index.js` + `widgets/<name>/server.js`
2. Apply required decorators: `@customElement`, `@discoverable(true)`, `@name`, `@description`, `@bestFor`, `@server`
3. Implement all four render states: loading (skeleton), error, empty, data
4. Server script: IIFE pattern (see below), `GlideRecordSecure`, `setLimit()`, `gs.getMessage()`
5. If widget needs configurable properties:
   a. Load `references/config-framework/config-field-types.md` — add `@configProperty` decorators
   b. Load `references/config-framework/config-id.md` — add a static `aiux-config-id` on every instance in host pages (always do this after adding `@configProperty`)
   c. If fields need accordion grouping → load `references/config-framework/config-groups.md`
   d. If widget needs config that opens a platform table → load `references/config-framework/config-external.md`
   e. If fields need conditional visibility → load `references/config-framework/config-depends-on.md`
   f. If widget links out to an external url/list/table/record for config (**custom-url** mode) or owns its entire bespoke config UI (**inline-auto** / self-config mode) → load `references/config-framework/config-modes.md`

A file is an AIUX widget when it has all four: `export default` class extending `AIUXWidgetElement` + `@discoverable(true)` + `@customElement` + `@bestFor`.

### Step 4 — Styling

Load: `references/design/css-custom-properties.md`, `references/design/daisyui-patterns.md`

All `aiux-` prefixed DaisyUI classes. CSS custom properties with hex fallbacks. `:host` display by page type (see Styling section).

### Step 5 — Accessibility (companion skill — mandatory)

Invoke the `accessibility` skill. This step is **not conditional** — invoke it for every component, page, and widget regardless of whether elements appear explicitly interactive. WCAG 2.2 AA requirements (reflow at 320px, forced-colors, keyboard nav, ARIA landmarks, focus management) apply to all UI output.

### Step 6 — i18n (companion skill)

Invoke `internationalization` skill. Every user-visible string uses `i18n.getMessage()`. Every date/number uses locale-aware formatting.

### Step 7 — Validate

Run through `references/quality/validation-rules.md` and `references/quality/best-practices-checklist.md`. Fix all violations before presenting output.

---

## EDIT Mode

Load: `references/app/navigation-patterns.md`, `references/app/theme-and-config.md`

### Step 0 — UI Discovery (mandatory gate)

Invoke the `ui-discovery` skill before touching any file. It is mandatory, not optional. It returns a suggested component or widget, or nothing if none fits.

### Step 1 — Make the edit

Using what Step 0 returned, decide whether to reuse the match or write custom code — write custom only when nothing fits.

**After editing**, run these steps in order:

1. Re-invoke `accessibility` companion skill — not BUILD-only; catches regressions in any touched template
2. Re-invoke `internationalization` companion skill — catches any newly hardcoded strings
3. Run `references/quality/validation-rules.md` — full assertion pass against the changed component or widget; fix all Error-severity violations before presenting output

| Edit type           | Read                                    | Change                               | Verify                            |
| ------------------- | --------------------------------------- | ------------------------------------ | --------------------------------- |
| Add nav item        | `application.js` or `pages/layout.js`   | `items[]` array                      | Active state, route path          |
| Change theme        | `theme.js`                              | Token values                         | `appTheme` reference              |
| Add page route      | `pages/` directory                      | New page file + nav                  | No route conflicts                |
| Modify widget data  | `widgets/<name>/index.js` + `server.js` | Both files                           | Action name match, response shape |
| Add context sharing | Layout + consumer page                  | Context definition + provide/consume | `willUpdate` re-provision         |
| Add/edit `@configProperty` | `config-framework/config-field-types.md` | `@configProperty` decorators on component | `aiux-config-id` on all host instances (`config-id.md`) |

---

## DEBUG Mode

Load: `references/quality/debugging-guide.md`

| Symptom                            | Check                           | Fix                                                                      |
| ---------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| Blank page                         | Console errors, loader return   | Missing `isServer` guard; loader crash; **non-existent `aiux-components-*` import** (see Module Resolution Traps in `lux-ref-foundation`) |
| Widget shows no data               | Server script                   | Must be `(function(data, options, input) { ... })(data, options, input)` |
| Widget not rendering               | `@customElement` + export       | Missing decorator or wrong base class                                    |
| Nav shell missing                  | `application.js`                | Add `applicationLayout: 'aiux-nav-layout'`                               |
| Data not loading                   | Server script action name       | Action name in `server.get({action})` must match handler                 |
| Chart/library renders nothing      | Module specifier                | Dynamic `await import('lib')` does not resolve in browser — use a static import |
| Styles not applying                | `:host` display, class names    | Missing `display: block`; class typo                                     |
| Properties not updating            | `static properties` declaration | Undeclared reactive property; mutating object without reassignment       |
| Context always default             | Scoped context call             | `detailContext.get(this)` — `this` is required                           |
| Loader crashes on error            | `Promise.allSettled`            | Check `.status === 'fulfilled'` before accessing `.value`                |
| Client fetch 403/401               | Fetch method                    | Use `aiuxFetch` — adds XSRF + auth headers                               |
| L3 tabs stale                      | `willUpdate` in layout          | Re-call `detailContext.provide()` when `loaderData` changes              |
| `setHeaderConfig` silent           | Call timing                     | Call after `super.connectedCallback()`                                   |
| `navigate()` no effect             | Path format                     | App-relative path: `/record/incident/abc` not `/aiux/myapp/...`          |
| `this.server` undefined            | Base class                      | Extend `AIUXWidgetElement`, not `AIUXElement`                            |
| `this` undefined in `client_tools` | Function type                   | Use `function(args) {}` not arrow function in `definition`               |
| i18n raw keys                      | `required_translations`         | Register string in widget metadata                                       |
| Memory leaks                       | `disconnectedCallback`          | Clean up all observers, listeners, timers                                |

---

## ANALYZE Mode

Load: `references/quality/audit-checklist.md`, `references/quality/best-practices-checklist.md`

10-category audit: Structure → Base classes → SSR safety → Styling → i18n → Accessibility → Performance → Security → Observability → Chat integration.

---

## Key Imports

| Import                                                              | From                                    | Purpose                      |
| ------------------------------------------------------------------- | --------------------------------------- | ---------------------------- |
| `html`, `css`, `nothing`, `isServer`                                | `lit`                                   | Templates, styles, SSR guard |
| `customElement`, `property`, `state`, `query`                       | `lit/decorators.js`                     | Lit decorators               |
| `classMap`                                                          | `lit/directives/class-map.js`           | Conditional CSS classes      |
| `repeat`                                                            | `lit/directives/repeat.js`              | Keyed list rendering         |
| `cache`                                                             | `lit/directives/cache.js`               | State-switching templates    |
| `AIUXElement`, `AIUXWidgetElement`, `WithData`, `withWidgetContext` | `@servicenow/aiux-components-core`      | Base classes                 |
| `decorators`, `createContext`, `getHeaders`                         | `@servicenow/aiux-components-core`      | Platform APIs                |
| `configProperty`, `externalConfig`                                  | `@servicenow/aiux-components-core`      | Config decorators (widget)   |
| `elementId`                                                         | `@servicenow/aiux-components-core`      | Config binding — auto-imported by the `aiux-config-id` desugar; import by hand only inside `layout` templates |
| `aiuxFetch`, `fetchDataResource`                                    | `@servicenow/aiux-components-core`      | Client fetch + data broker   |
| `isPluginActive`, `getSystemProperty`, `getLogger`                  | `@servicenow/aiux-components-core`      | Plugin checks, logging       |
| `userContext`, `getAMBService`                                      | `@servicenow/aiux-components-core`      | User context, real-time      |
| `i18n`, `locationService`, `recordWatcherService`                   | `@servicenow/aiux-services`             | Platform services            |
| `navigate`, `getGlobalRouter`                                       | `@servicenow/aiux-client`               | Navigation                   |
| `navLayoutContext`, `setHeaderConfig`, `setPageActions`             | `@servicenow/aiux-components-nav`       | Nav shell                    |
| `lazyImage`                                                         | `@servicenow/aiux-directive-lazy-image` | SSR-safe images              |
| `icon`                                                              | `@servicenow/aiux-directive-icon`       | Icon directive               |
| `createLogger`                                                      | `@servicenow/aiux-observability`        | Server-side logging          |
| `setDocumentTitle`                                                  | `utils/document-title.js`               | Browser tab title (WCAG)     |

> **Before importing any `@servicenow/aiux/aiux-components-<x>` subpath, confirm the package directory exists.** These subpaths are externalised, so a non-existent one passes the build and blanks the page at runtime. See Module Resolution Traps in `lux-ref-foundation`.

---

## Base Classes

| Class                            | Extends             | Use when                                       |
| -------------------------------- | ------------------- | ---------------------------------------------- |
| `AIUXElement`                    | `LitElement`        | Pages, layouts, custom components              |
| `AIUXWidgetElement`              | `AIUXElement`       | Widgets with `this.server`                     |
| `WithData(AIUXWidgetElement)`    | `AIUXWidgetElement` | Widgets that auto-bind `this.data` from server |
| `withWidgetContext(AIUXElement)` | `AIUXElement`       | Chat-integrated widgets                        |

---

## Lit Rules

1. **Extend `AIUXElement` or `AIUXWidgetElement`** — never plain `LitElement`
2. **`static properties = {}`** in JS, `@property()`/`@state()` in TS — declare every mutable property
3. **`classMap`** for conditional classes — `class=${classMap({'btn': true, 'active': isActive})}`
4. **`nothing`** in child/content positions only
5. **Dispatch events** for state owned by parent — `dispatchEvent(new CustomEvent('...', {bubbles: true, composed: true}))`
6. **Reactive state + `classMap`** for visual mutations
7. **Namespace-scoped event names** — `aiux-widget:sort-change`
8. **Event delegation in loops** — `data-*` attributes + single bound handler on container

---

## SSR Golden Rule

```js
import {isServer} from 'lit';

connectedCallback() {
  super.connectedCallback();
  if (!isServer) {
    window.addEventListener('resize', this._onResize);
  }
}
```

Guard in: `constructor`, `connectedCallback`, `render`, `willUpdate`, `static async loader`, module top-level.
No guard needed in: `firstUpdated`, `updated`, `disconnectedCallback`, event handlers.

---

## Server Script (Widget Only)

```js
export default function server(data, _options, input) {
  // data    → response object; assign fields to return them to client
  // _options → widget instance config from page editor
  // input   → params from this.server.get({...})
  // Priority: input > options > hardcoded default
}
```

The build pipeline (Rollup) compiles `export default function` into an IIFE at deploy time.

Client call:

```js
const response = await this.server.get({action: 'getItems', limit: 50});
```

---

## Styling

Load: `references/design/css-custom-properties.md` before writing any CSS.

### `:host` by page type

```js
/* Standard page */    :host { display: block; }
/* List page */        :host { display: contents; }  /* required for aiux-list-connected */
/* Widget */           :host { display: block; height: 100%; }
/* Dashboard/home */   :host { display: block; min-height: 100%; container-type: inline-size; }
```

### Token quick-reference

| Need                   | Token                                  | Tailwind class        |
| ---------------------- | -------------------------------------- | --------------------- |
| Default / primary text | `var(--color-text-primary, #000)`      | `text-text-primary`   |
| Subdued text           | `var(--color-text-secondary, #4d4c4a)` | `text-text-secondary` |
| Card background        | `var(--color-base-100, #fff)`          | `bg-base-100`         |
| Page background        | `var(--color-base-200, #f2f2f2)`       | `bg-base-200`         |
| Border                 | `var(--color-base-300, #e5e7eb)`       | `border-base-300`     |

Always include hex fallback in `static styles`. Card surfaces: `bg-base-100 shadow-sm`.

### Self-constraining visual components

A component that sizes itself from a percentage or viewBox (SVG charts, gauges, media) must carry its own size ceiling in its **own** `static styles` — never rely only on a parent page's class or on Tailwind layout classes. Parent `static styles` and the global Tailwind sheet are not guaranteed to be in effect at first paint, so a `width: 100%` SVG renders at full container width for one frame and then snaps down. The symptom is "huge on first load, correct after navigating".

```js
/* In the component itself, not the host page */
:host { display: block; max-width: 9rem; }
svg  { display: block; width: 100%; height: auto; aspect-ratio: 1 / 1; }
```

### Text overflow protection

All user-facing text elements (titles, subtitles, descriptions) must remain visible and legible at 320px viewport width without horizontal overflow. Use Tailwind utility classes in the template for any text element that receives dynamic or prop-driven content:

```html
<span class="break-words max-w-full">${this.title}</span>
```

Reserve `static styles` for values Tailwind cannot express (`:host`, keyframes, pseudo-elements).

---

## Principles (P1–P48)

The full enumerated principles live in `references/quality/best-practices-checklist.md`. After implementing, validate against that checklist plus `references/quality/validation-rules.md` before presenting output.

---

## Common UI Patterns

- **Skeleton loader** — `aiux-skeleton h-N w-full rounded` or CSS `::before` animation (see `css-custom-properties.md`)
- **Error state** — `<div class="aiux-alert aiux-alert-error aiux-alert-soft">...</div>`
- **Empty state** — plain markup (a centered `<div>` with a heading and body paragraph using theme tokens). **There is no `empty-state` or `empty-state-content` package in `@servicenow/aiux`** — importing `@servicenow/aiux/aiux-components-empty-state-content` passes the build and then blanks the page at runtime. Only use `<aiux-empty-state-content>` if `ui-discovery` confirms it is installed on the connected instance and `node_modules/@servicenow/aiux/components/empty-state-content/` exists.
- **Toast** — `<div class="aiux-toast aiux-toast-top aiux-toast-center z-50"><div class="aiux-alert aiux-alert-success aiux-alert-soft">...</div></div>`
- **Loading spinner in button** — `<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` inside button
- **Status badge** — `<span class="aiux-badge aiux-badge-sm aiux-badge-success aiux-badge-soft">`

---

## References

### Foundation

- [AIUXElement](references/foundation/aiux-element.md) — Base classes, lifecycle, event binding, cleanup
- [Loader & Context](references/foundation/loader-and-context.md) — `ctx` shape, `Promise.allSettled`, `aiuxFetch`, `fetchDataResource`, context API
- [Lit Patterns](references/foundation/lit-patterns.md) — `nothing`, `classMap`, events, delegation, `repeat`, `cache`
- [SSR Safety](references/foundation/ssr-safety.md) — `isServer` guards, where they are and are not needed

### App

- [Pages Cookbook](references/app/pages-cookbook.md) — Layout, list, record, nested layout, custom page templates
- [Navigation Patterns](references/app/navigation-patterns.md) — `application.js` setup, `navigate()`, L2/L3 nav, `setHeaderConfig`, `setPageActions`
- [Theme & Config](references/app/theme-and-config.md) — `theme.js`, `aiux.json`, `application.js`, `applicationLayout`
- [Backend Layer](references/app/backend-layer.md) — Deploy pipeline, build commands, common gotchas
- [Extensions](references/app/extensions.md) — Overlaying pages on a host app via `src/extensions/`, path conventions, page/loader/layout templates, nested layout precedence

### Widget

- [Component Patterns](references/widget/component-patterns.md) — Properties, lifecycle, events, i18n, templates
- [Server Scripts](references/widget/server-scripts.md) — IIFE pattern, GlideRecord, action routing, security
- [Data Fetching](references/widget/data-fetching.md) — `this.server`, loading states, record watcher, debounced search
- [Chat Integration](references/widget/chat-integration.md) — `withWidgetContext`, `setAiContext`, `client_tools`
- [Observability](references/widget/observability.md) — `getLogger`, `createLogger`, severity guide, `lazyImage`
- [Decorators](references/widget/decorators.md) — All Lit and AIUX platform decorators
- [Config Field Types](references/config-framework/config-field-types.md) — `@configProperty` decorator: semantics, base schema, localization, all field types
- [Config aiux-config-id](references/config-framework/config-id.md) — Exposing widget config in host pages via `aiux-config-id`
- [Config Groups](references/config-framework/config-groups.md) — Accordion grouping with `static configGroups`
- [Config External](references/config-framework/config-external.md) — `@externalConfig` for opening a platform table
- [Config dependsOn](references/config-framework/config-depends-on.md) — Conditional field visibility
- [Config Modes](references/config-framework/config-modes.md) — Custom config UI: `custom-url`, `inline-auto` (self-config)

### Design

- [CSS Custom Properties](references/design/css-custom-properties.md) — **Load before writing any CSS.** Color tokens, typography, motion, spacing, radius, `:host` rules, production patterns
- [DaisyUI Patterns](references/design/daisyui-patterns.md) — Component classes, `aiux-` prefix, card/badge/alert/dropdown patterns
- [Tailwind Reference](references/design/tailwind-reference.md) — Layout, spacing, typography, color utility classes

### Quality

- [Debugging Guide](references/quality/debugging-guide.md) — Expanded symptom → fix diagnostics
- [Validation Rules](references/quality/validation-rules.md) — Assertions checked after every implementation
- [Best Practices Checklist](references/quality/best-practices-checklist.md) — P1–P43 checklist
- [Audit Checklist](references/quality/audit-checklist.md) — 10-category app health audit

---

## Seeding Demo ITSM Data

Business rules actively fight direct inserts. Creating `incident` rows assigned
to a specific user does **not** stick:

- Assignment / ML-prediction rules **blank or reassign `assigned_to`** on insert.
- `state` is normalised, so every row lands in one bucket and bar charts show
  a single bar.
- `setWorkflow(false)` is **refused cross-scope** — `incident` is Global, so a
  script running in `x_snc_*` scope cannot call it: *"setWorkflow can only be
  called from within the same Scope as the Table on which it is called."*

**Two-pass pattern:**

1. Insert in any scope.
2. Second pass in **`global` scope** with `setWorkflow(false)` +
   `autoSysFields(false)` to force `assigned_to`, `state`, `active`, and
   backdated `opened_at` / `closed_at`.

Other rules:

- `priority` is **derived** from `impact`/`urgency` — set those, not `priority`
  (1/1→P1, 1/2→P2, 2/2→P3, 2/3→P4).
- Tag demo rows (`correlation_id`) so they are findable and removable.
- **Verify with the dashboard's own encoded query afterwards**, never with the
  values you intended to write.
- `assigned_to=javascript:gs.getUserID()` is evaluated in the calling session —
  use it instead of a hardcoded sys_id so charts and drill-down lists agree.

### `run_script` returns logs, not the final expression

The tool surfaces the log stream. To read values back, use
`gs.info(JSON.stringify(...))` — do not rely on the trailing expression.

### Verifying a page actually works

A green build and a successful install prove **neither** that the page renders
nor that data arrives. Both externalised imports and dynamic specifiers fail
only in the browser. Confirm with `ui_diagnostics`; if it will not complete,
say the result is unverified rather than implying it renders.
