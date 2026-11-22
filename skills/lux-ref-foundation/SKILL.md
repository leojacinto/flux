---
name: lux-ref-foundation
description: "Lux reference: AIUXElement, Lit patterns, SSR safety, loaders and context, decorators, data fetching, component patterns, server scripts. Invoke when writing or debugging Lux components."
---

# lux-ref-foundation


=== FILE: references/foundation/aiux-element.md ===
# AIUXElement Foundation

## Base Classes

### AIUXElement

Extends `LitElement`. Base class for all AIUX components — pages, layouts, and custom components.

```js
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('my-app-element')
export class MyElement extends AIUXElement {
  static styles = css`
    :host {
      display: block;
    }
  `;
  render() {
    return html`<div>Hello</div>`;
  }
}
```

### AIUXWidgetElement

Extends `AIUXElement`. Adds `this.server` for GlideRecord/GlideQuery communication and global adopted stylesheets. Used for standalone widgets.

```js
import {AIUXWidgetElement, decorators} from '@servicenow/aiux-components-core';
const {name, description, discoverable, bestFor} = decorators;

@customElement('aiux-my-widget')
@discoverable(true)
@name('My Widget')
@description('What this widget does')
@bestFor('When to use this widget')
@server('./server.js')
export default class MyWidget extends AIUXWidgetElement { ... }
```

Key differences from `AIUXElement`:

- `this.server.get({action, ...params})` — calls server script
- `this.server.update()` — re-fetch default data
- `this.trackEvent(name, detail)` — analytics
- Global styles adopted automatically (Tailwind + DaisyUI available in shadow DOM)
- `@server` decorator to bind server-side script

### WithData Mixin

Auto-binds server data to `this.data`. Use when the widget simply renders server-provided data.

```js
import {WithData, AIUXWidgetElement} from '@servicenow/aiux-components-core';

export default class MyWidget extends WithData(AIUXWidgetElement) {
  render() {
    // this.data is automatically populated from server script's `data` object
    const items = this.data?.items || [];
    return html`<ul>
      ${items.map(i => html`<li>${i.name}</li>`)}
    </ul>`;
  }
}
```

### withWidgetContext Mixin

Enables bidirectional widget ↔ AI chat communication. See `references/chat-integration.md` for full API.

```js
import {AIUXElement, withWidgetContext} from '@servicenow/aiux-components-core';

class MyWidget extends withWidgetContext(AIUXElement) {
  static client_tools = { ... };
  static aiContext = { description: '...', bestFor: '...' };
  firstUpdated() { this.setAiContext({key: 'value'}); }
}
```

---

## Reactive Properties and State

### With decorators (TS or decorator-enabled JS)

```js
import {property, state, query} from 'lit/decorators.js';

@property({type: String}) label = '';       // public, reflects to attribute
@state() _loading = false;                  // internal, no attribute
@query('#input') _inputEl;                  // DOM reference
```

### Without decorators (plain JS)

```js
static properties = {
  label: {type: String},
  _loading: {type: Boolean, state: true},
  _items: {type: Array, state: true}
};
```

**Rules:**

- Every entry MUST include a `type` key
- Internal state MUST have `state: true`
- All properties MUST be initialized with defaults in `constructor()`
- Declare only the component's own properties — Lit merges the prototype chain automatically

---

## Lifecycle Methods

| Method                   | When                | Key rules                                                                               |
| ------------------------ | ------------------- | --------------------------------------------------------------------------------------- |
| `constructor()`          | Instantiation       | Always call `super()`. Initialize all properties. No DOM access.                        |
| `connectedCallback()`    | Attached to DOM     | Always call `super.connectedCallback()`. Start data fetch, add listeners.               |
| `willUpdate(changed)`    | Before every render | Sync derived state. Re-provide scoped context on navigation. No `this.requestUpdate()`. |
| `render()`               | Each update cycle   | Return `html` template. Pure — no side effects, no mutations.                           |
| `firstUpdated()`         | After first render  | Client-only init (focus, scroll, third-party libs).                                     |
| `updated(changed)`       | After every render  | React to changes. No `this.update()`.                                                   |
| `disconnectedCallback()` | Removed from DOM    | Always call `super.disconnectedCallback()`. Clean up all resources.                     |

### Resource Cleanup (disconnectedCallback)

**All resources acquired in lifecycle MUST be released:**

| Resource                | Setup                                 | Cleanup                                         |
| ----------------------- | ------------------------------------- | ----------------------------------------------- |
| `addEventListener`      | `connectedCallback`                   | `removeEventListener` in `disconnectedCallback` |
| `IntersectionObserver`  | `new IntersectionObserver(...)`       | `.disconnect()`                                 |
| `ResizeObserver`        | `new ResizeObserver(...)`             | `.disconnect()`                                 |
| `MutationObserver`      | `new MutationObserver(...)`           | `.disconnect()`                                 |
| `setTimeout`            | `setTimeout(...)`                     | `clearTimeout(...)`                             |
| `setInterval`           | `setInterval(...)`                    | `clearInterval(...)`                            |
| `requestAnimationFrame` | `rAF(...)`                            | `cancelAnimationFrame(...)`                     |
| `AbortController`       | `new AbortController()`               | `.abort()`                                      |
| Event subscriptions     | `emitter.on(...)`                     | `emitter.off(...)`                              |
| Record watcher          | `recordWatcherService.subscribe(...)` | `.unsubscribe()`                                |
| Scoped context          | `ctx.provide(this, ...)`              | `ctx.unprovide(this)`                           |

```js
connectedCallback() {
  super.connectedCallback();
  this._observer = new IntersectionObserver(this._onIntersect);
  this._observer.observe(this);
  document.addEventListener('scroll', this._onScroll);
  this._timer = setInterval(this._poll, 5000);
}

disconnectedCallback() {
  super.disconnectedCallback();
  this._observer?.disconnect();
  document.removeEventListener('scroll', this._onScroll);
  clearInterval(this._timer);
}
```

---

## Event Handler Binding

Bind handlers in the constructor to ensure stable references:

```js
constructor() {
  super();
  this._handleClick = this._handleClick.bind(this);
  this._handleKeyDown = this._handleKeyDown.bind(this);
}
```

For loops, use `data-*` attributes with a single bound handler:

```js
${items.map(item => html`<li data-id=${item.id} @click=${this._handleSelect}>${item.name}</li>`)}
_handleSelect(e) { const id = e.currentTarget.dataset.id; ... }
```

---

## Custom Component Sub-Packages (TS)

When an app ships its own Lit components in a pnpm workspace:

```
components/my-component/
├── package.json          # @servicenow/aiux-components-my-component
├── build.js              # SWC transpiler: legacyDecorator + loose
├── index.js              # export * from './vN/index.js'
└── src/
    ├── my-component.ts   # @customElement('my-app-my-component')
    └── index.ts          # re-export
```

**Critical:** `lit` must be a **`peerDependency`**, not `dependency`. Putting `lit` in `dependencies` creates two Lit instances, breaking reactive updates.


=== FILE: references/foundation/lit-patterns.md ===
# Lit Patterns for AIUX

Critical Lit web component rules for AIUX. Violating these causes runtime bugs, broken reactivity, or accessibility failures.

---

## `nothing` Sentinel

`nothing` removes content from the DOM entirely. Use it in child/content positions only. For attribute positions, use an empty string `''`:

```js
import {nothing} from 'lit';

// Child position — removes the element from DOM
render() {
  return html`<div>${this._show ? html`<p>Content</p>` : nothing}</div>`;
}

// Attribute position — use empty string, not nothing
render() {
  return html`<div class=${this._active ? 'active' : ''}>`;
}
```

---

## classMap for Conditional Classes

Use `classMap` for all conditional CSS classes:

```js
import {classMap} from 'lit/directives/class-map.js';

render() {
  const classes = classMap({
    'aiux-btn': true,
    'aiux-btn-primary': this._primary,
    'aiux-btn-disabled': this._disabled
  });
  return html`<button class=${classes}>Click</button>`;
}
```

---

## No Self-Mutation of @property()

`@property()` values flow downward from the parent. To request a change, dispatch an event. Internal `@state()` can be mutated freely.

```js
@property({type: Boolean}) active = false;

_toggle() {
  this.dispatchEvent(new CustomEvent('active-change', {
    detail: {active: !this.active},
    bubbles: true,
    composed: true
  }));
}
```

---

## Reactive State, Not Imperative DOM

Use reactive properties and `classMap` to control visual state. Reserve `@query` for imperative DOM APIs with no declarative equivalent (`.showModal()`, `.focus()`, `.scrollIntoView()`):

```js
@state() _panelOpen = false;

render() {
  const classes = classMap({'panel': true, 'open': this._panelOpen});
  return html`<div class=${classes}></div>`;
}
```

---

## Event Conventions

Use namespace-scoped names with `bubbles: true, composed: true` for all cross-component events:

```js
this.dispatchEvent(
  new CustomEvent('aiux-incident-list:sort-change', {
    detail: {field: 'opened_at', direction: 'desc'},
    bubbles: true,
    composed: true
  })
);
```

Dispatch events instead of calling callback props — events cross shadow DOM naturally and parents can listen at any level:

```js
_select(item) {
  this.dispatchEvent(new CustomEvent('aiux-widget:select', {
    detail: {item}, bubbles: true, composed: true
  }));
}
```

---

## Event Delegation in Loops

Use a single handler on the container with `data-*` attributes — one stable function reference per render:

```js
${items.map(item => html`
  <li data-id=${item.id} @click=${this._handleSelect}>${item.name}</li>
`)}

_handleSelect(e) {
  const id = e.currentTarget.dataset.id;
  this._selectedId = id;
}
```

---

## repeat() vs .map()

Use `repeat` when items have stable unique IDs and the list is reordered, sorted, or filtered. Use `.map()` for simple stateless lists:

```js
import {repeat} from 'lit/directives/repeat.js';

// Dynamic list with reordering — repeat preserves DOM nodes
${repeat(this._items, item => item.sys_id, item => html`
  <incident-card .incident=${item}></incident-card>
`)}

// Static/stateless list — .map() is fine
${this._tabs.map(tab => html`<span>${tab.label}</span>`)}
```

---

## cache() for State Switching

Use `cache` when switching between complex templates to preserve DOM state (scroll position, form input):

```js
import {cache} from 'lit/directives/cache.js';

render() {
  return html`${cache(this._view === 'list'
    ? html`<list-view .items=${this._items}></list-view>`
    : html`<detail-view .record=${this._record}></detail-view>`
  )}`;
}
```

---

## static properties Declaration

Declare only the component's own properties — Lit merges the prototype chain automatically:

```js
static properties = {
  _myState: {type: Boolean, state: true}
};
```


=== FILE: references/foundation/ssr-safety.md ===
# SSR Safety

AIUX apps use server-side rendering (SSR). Guard browser-only APIs so components run safely in both environments.

---

## The Guard

```js
import {isServer} from 'lit';
```

Use `isServer` from `lit` — not custom checks like `typeof window !== 'undefined'`.

---

## Where Guards ARE Required

| Location                   | Why                                      |
| -------------------------- | ---------------------------------------- |
| `constructor()`            | Runs on server during SSR                |
| `render()`                 | Runs on server to produce HTML           |
| `connectedCallback()`      | Runs on server for Lit SSR               |
| `willUpdate(changed)`      | Runs on server before render             |
| `static async loader(ctx)` | Runs on server blocking SSR              |
| Top-level module scope     | Evaluated on import in both environments |

```js
connectedCallback() {
  super.connectedCallback();
  if (!isServer) {
    window.addEventListener('resize', this._onResize);
    this._observer = new IntersectionObserver(this._cb);
  }
}

static async loader(ctx) {
  if (isServer) return {};  // skip client-only logic
  const stored = localStorage.getItem('prefs');
  return {prefs: JSON.parse(stored)};
}
```

---

## Where Guards Are NOT Required

| Location                        | Why                                       |
| ------------------------------- | ----------------------------------------- |
| Event handlers (`@click`, etc.) | Only fire in browser                      |
| `firstUpdated()`                | Only runs after first DOM render (client) |
| `updated(changed)`              | Only runs after DOM updates (client)      |
| `disconnectedCallback()`        | Only runs when removed from DOM (client)  |

```js
// No guard needed — these are client-only
firstUpdated() {
  this.shadowRoot.querySelector('#input')?.focus();
}

_handleClick() {
  window.scrollTo(0, 0);
}
```

---

## Detection Guidance

When unsure whether code runs on the server, trace the call chain:

1. Is it called from `constructor`, `render`, `connectedCallback`, `willUpdate`, or a `loader`?
2. Is it called from a function that is called from one of those?
3. Is it a top-level statement that executes on `import`?

If YES to any → guard with `isServer`.

---

## Common Browser APIs That Need Guards

- `window`, `document`, `navigator`, `location`
- `localStorage`, `sessionStorage`
- `IntersectionObserver`, `ResizeObserver`, `MutationObserver`
- `requestAnimationFrame`, `cancelAnimationFrame`
- `fetch` (in loaders — use `ctx.protocol`/`ctx.hostname` instead)
- `CustomEvent` dispatch (no DOM in SSR)
- `matchMedia`, `getComputedStyle`
- `HTMLElement.prototype.focus`, `.scrollIntoView`

---

## Tailwind v4 Directives

Valid Tailwind v4 directives for AIUX apps:

```css
/* In global CSS */
@import 'tailwindcss';
@config '../tailwind.config.js';

/* In component static styles — use @apply or utility classes in templates */
@layer base { ... }
@layer components { ... }
@layer utilities { ... }
```

Components should prefer Tailwind utility classes in templates over `@apply` in `static styles`.


=== FILE: references/foundation/loader-and-context.md ===
# Loader Pattern & Context API

## Loader Pattern

Every page and layout may define `static async loader(ctx)`. The loader runs **before rendering** — on the server (blocking SSR) and again on the client during navigation. Its return value is available as `this.loaderData`.

```js
static async loader(ctx) {
  const {table} = ctx.params;
  const data = await fetchSomething(table);
  return {table, data};  // becomes this.loaderData
}

render() {
  const {table, data} = this.loaderData || {};
  return html`...`;
}
```

### `ctx` Shape

| Property             | Description                                        |
| -------------------- | -------------------------------------------------- |
| `ctx.params`         | Dynamic route params from `[bracket]` filenames    |
| `ctx.query`          | URL query string params                            |
| `ctx.pagePath`       | Current page path (e.g. `/list/incident`)          |
| `ctx.basePath`       | App basename prefix (e.g. `/aiux/my-app`)          |
| `ctx.protocol`       | `http` or `https`                                  |
| `ctx.hostname`       | ServiceNow instance hostname                       |
| `ctx.csrfToken`      | CSRF token for mutating requests (POST/PUT/DELETE) |
| `ctx.headers.cookie` | Session cookie for authenticated fetches           |

### Headers Helper

`getHeaders(ctx)` from `@servicenow/aiux-components-core` returns standard API headers. Auth and tracing headers are injected automatically by the fetch interceptor (SSR) and `sn-http-request` (client).

```js
import {getHeaders} from '@servicenow/aiux-components-core';

static async loader(ctx) {
  const res = await fetch(`${ctx.protocol}://${ctx.hostname}/api/now/table/incident`, {
    headers: getHeaders(ctx)
  });
  return {incidents: await res.json()};
}
```

### SSR Guard in Loaders

Loaders run on both server and client. Guard browser-only logic:

```js
import {isServer} from 'lit';

static async loader(ctx) {
  if (isServer) return {};
  // client-only logic
}
```

### Full `ctx` Shape

| Property             | Description                                      |
| -------------------- | ------------------------------------------------ |
| `ctx.params`         | Dynamic route params from `[bracket]` filenames  |
| `ctx.query`          | URL query string params                          |
| `ctx.pagePath`       | Current page path (e.g. `/inventory/abc123`)     |
| `ctx.basePath`       | App basename prefix (e.g. `/aiux/my-app`)        |
| `ctx.protocol`       | `http` or `https`                                |
| `ctx.hostname`       | ServiceNow instance hostname                     |
| `ctx.csrfToken`      | CSRF token for POST/PUT/DELETE requests          |
| `ctx.headerConfig`   | Pre-computed header config (may be null in CSR)  |
| `ctx.chat`           | Chat gate `{enabled, deploymentDocumentId, ...}` |
| `ctx.app`            | App object with `routes` array                   |
| `ctx.resolvedPath`   | Fully resolved page path (for nested layouts)    |
| `ctx.headers.cookie` | Session cookie for authenticated fetches (SSR)   |

### Parallel Fetches with `Promise.allSettled`

Always use `Promise.allSettled` (not `Promise.all`) in loaders when fetching multiple independent data sources. A single failing fetch must not crash the entire loader.

```js
static async loader(ctx) {
  const [recordResult, insightsResult, licenseResult] = await Promise.allSettled([
    fetchRecord(ctx, table, sysId),
    fetchInsights(ctx).catch(() => []),
    fetchLicense(ctx)
  ]);

  const record = recordResult.status === 'fulfilled' ? recordResult.value : null;
  if (recordResult.status === 'rejected') {
    log.error({error: recordResult.reason}, 'Failed to fetch record');
  }
  const insights = insightsResult.status === 'fulfilled' ? insightsResult.value : [];
  const license = licenseResult.status === 'fulfilled' ? licenseResult.value : {hasEnterpriseLicense: false};

  return {record, insights, license};
}
```

### `aiuxFetch` for Client-Side API Calls

Use `aiuxFetch` from `@servicenow/aiux-components-core` for REST API calls on the client (not in loaders). It adds XSRF tokens, auth headers, and handles retries. Raw `fetch` is acceptable in loaders where `getHeaders(ctx)` provides the session context.

```js
import {aiuxFetch, getLogger} from '@servicenow/aiux-components-core';

const log = getLogger('my-page');

// Client-side fetch (in connectedCallback, event handlers, firstUpdated)
async _loadTasks() {
  const params = new URLSearchParams({
    sysparm_fields: 'sys_id,short_description,state,assigned_to',
    sysparm_query: 'active=true',
    sysparm_limit: '50'
  });
  const resp = await aiuxFetch(`/api/now/table/task?${params}`, {
    headers: {'Content-Type': 'application/json'}
  });
  if (!resp.ok) {
    log.error({status: resp.status}, 'Failed to fetch tasks');
    return [];
  }
  const data = await resp.json();
  return data?.result ?? [];
}
```

### `fetchDataResource` for Data Broker Calls

Use `fetchDataResource` from `@servicenow/aiux-components-core` to invoke ServiceNow Data Broker definitions by sys_id. This is the platform-idiomatic way to call server-side business logic without writing server scripts.

```js
import {fetchDataResource} from '@servicenow/aiux-components-core';

const LICENSE_BROKER_SYS_ID = '37397e8effa772103812ffffffffff6d';

// In a loader (runs SSR + CSR)
static async loader(ctx) {
  try {
    const result = await fetchDataResource(LICENSE_BROKER_SYS_ID, {}, ctx);
    return {hasLicense: result?.output?.toString().toLowerCase() === 'true'};
  } catch {
    return {hasLicense: false};
  }
}

// Client-side (no ctx arg)
async _startReview(assetSysId) {
  const result = await fetchDataResource(START_REVIEW_BROKER_ID, {assetSysId});
  if (result?.output?.success) {
    this._showToast('success', i18n.getMessage('Review started'));
  }
}
```

### Shared Loader Functions

Data-fetching functions shared across pages belong in a `loaders/` folder. They must accept `ctx` as a parameter and return plain data (not DOM/Lit objects):

```
loaders/
├── insights-loader.js   # fetchInsights(baseUrl, ctx, opts)
├── cost-configured.js   # fetchCostConfigured(ctx)
└── task-detail-loader.js  # fetchTaskDetail(card)
```

Example shared loader:

```js
// loaders/inventory-loader.js
import {getHeaders} from '@servicenow/aiux-components-core';

export async function fetchInventoryData(baseUrl, ctx) {
  const headers = getHeaders(ctx);
  const resp = await fetch(
    `${baseUrl}/api/now/stats/my_table?sysparm_count=true&sysparm_group_by=governed`,
    {headers}
  );
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  return data?.result ?? [];
}
```

---

## Context API

Use the AIUX context API from `@servicenow/aiux-components-core` — it provides SSR compatibility and platform integration that the raw `@lit/context` package lacks.

### Global Context — `createContext`

Module-level singleton. Use for app-wide state set once per navigation (current user, license info, etc.):

```js
// contexts/user-context.js
import {createContext} from '@servicenow/aiux-components-core';
export const userContext = createContext('user-context', null);
```

**Provider** (typically in a layout's `loader`):

```js
static async loader(ctx) {
  userContext.set(await fetchCurrentUser(ctx));
}
```

**Consumer** (any descendant page):

```js
static contexts = [userContext];
render() {
  const user = userContext.get();
  return html`<p>Hello, ${user?.name}</p>`;
}
```

### Scoped Context — `createScopedContext`

Tree-scoped per host element. Use when a nested layout serves multiple independent subtrees that need isolated values (e.g. a `[id]/layout.js` providing different record data per navigation):

```js
// contexts/detail-context.js
import {createScopedContext} from '@servicenow/aiux-components-core';
export const detailContext = createScopedContext('detail-context', null);
```

**Provider** (nested layout):

```js
_prevLoaderData = null;

connectedCallback() {
  super.connectedCallback();
  detailContext.provide(this, this.loaderData?.record);
}

disconnectedCallback() {
  super.disconnectedCallback();
  detailContext.unprovide(this);  // REQUIRED — prevents memory leaks
}

willUpdate() {
  if (this.loaderData !== this._prevLoaderData) {
    this._prevLoaderData = this.loaderData;
    detailContext.provide(this, this.loaderData?.record);
  }
}
```

**Consumer** (child page):

```js
static contexts = [detailContext];
render() {
  const record = detailContext.get(this);  // `this` is REQUIRED for scoped
  return html`<p>${record?.short_description}</p>`;
}
```

### Context with Auto-Fetch (`createContext` options)

For contexts that need to be auto-fetched before `setup()` runs (e.g. license checks), pass a `fetch` function:

```js
// contexts/license-context.js
import {
  createContext,
  fetchDataResource
} from '@servicenow/aiux-components-core';

const BROKER_SYS_ID = '37397e8effa772103812ffffffffff6d';

export async function fetchLicense(ctx) {
  try {
    const result = await fetchDataResource(BROKER_SYS_ID, {}, ctx);
    return {
      hasEnterpriseLicense: result?.output?.toString().toLowerCase() === 'true'
    };
  } catch {
    return {hasEnterpriseLicense: false};
  }
}

// {immutable: true} — value never changes after first fetch
// {fetch: fetchLicense} — route-pipeline auto-fetches before setup() runs
export const [licenseContext, setLicenseContext] = createContext(
  'my-app-license',
  {hasEnterpriseLicense: false},
  {immutable: true, fetch: fetchLicense}
);
```

Declare in `application.js`:

```js
export default {
  contexts: [licenseContext], // pipeline fetches licenseContext before setup()
  async setup(ctx) {
    const license = licenseContext.get();
    // license is already populated — no manual fetchLicense() needed
  }
};
```

### `createScopedContext` vs `createContext`

Use `createContext` (not `createScopedContext`) when the context is simple and non-nested. The real app (AICT) uses the simpler pattern:

```js
// contexts/inventory-context.js
import {createContext} from '@servicenow/aiux-components-core';

export const inventoryDetailContext = createContext(
  'aict-inventory-detail',
  null,
  {scoped: true} // scoped option on createContext, not createScopedContext
);
```

### Critical Context Rules

1. `detailContext.get()` without `this` silently returns the default value — **always pass `this`** for scoped contexts
2. Scoped providers MUST call `unprovide(this)` in `disconnectedCallback` — memory leak otherwise
3. Use `willUpdate` to re-provide when `loaderData` changes on navigation — prevents stale context
4. `_prevLoaderData` pattern avoids unnecessary re-provision on unrelated property changes
5. Declare app-level contexts in `application.js` `contexts` array for automatic pipeline fetching
6. `fetchDataResource` can be called both in loaders (pass `ctx`) and client-side (no `ctx`)


=== FILE: references/widget/decorators.md ===
# Decorators

## Imports

`@customElement` comes from `lit/decorators.js`. All AIUX platform decorators come from `@servicenow/aiux-components-core` via `decorators`.

```js
import {customElement} from 'lit/decorators.js';
import {AIUXWidgetElement, decorators} from '@servicenow/aiux-components-core';
const {
  name,
  description,
  discoverable,
  bestFor,
  server,
  chatCompatible,
  category,
  demo,
  explicitSysId
} = decorators;
```

---

## Reference

| Decorator         | Type    | Required    | Description                                                  |
| ----------------- | ------- | ----------- | ------------------------------------------------------------ |
| `@customElement`  | string  | **Yes**     | Tag name for the web component                               |
| `@discoverable`   | boolean | **Yes**     | Makes widget visible in the platform registry                |
| `@bestFor`        | string  | **Yes**     | Describes ideal use cases; helps AI agents select the widget |
| `@name`           | string  | Recommended | Display name                                                 |
| `@description`    | string  | Recommended | 1–2 sentences on what the widget does                        |
| `@server`         | string  | No          | Relative path to server script (e.g. `'./server.js'`)        |
| `@chatCompatible` | boolean | No          | Widget works in chat interfaces                              |
| `@category`       | string  | No          | `'custom'` (default) or `'platform'`                         |
| `@demo`           | boolean | No          | Widget only installs when demo data is opted into            |
| `@explicitSysId`  | string  | No          | Hardcoded 32-char hex sys_id                                 |

**Page-only decorators** (from `decorators`):

| Decorator | Type    | Required | Description                                               |
| --------- | ------- | -------- | --------------------------------------------------------- |
| `@title`  | string  | Optional | Display title in platform UI                              |
| `@global` | boolean | Optional | `@global(false)` scopes page to experience in `aiux.json` |

---

## Widget Example

```js
@customElement('aiux-employee-profile-card')
@discoverable(true)
@name('Employee Profile Card')
@description(
  'Displays an employee profile card with personal details and team information'
)
@bestFor(
  'Providing comprehensive employee profile views in dashboards and detail pages'
)
@chatCompatible(true)
@category('custom')
@server('./server.js')
export default class EmployeeProfileCard extends AIUXWidgetElement {}
```

---

## Page Example

```js
@customElement('my-app-home')
@title('Home')
@global(false)
export default class HomePage extends AIUXElement { ... }
```

---

## `@explicitSysId`

**Do not use unless the user explicitly asks to hardcode a sys_id, or it is already present.** Sys_ids are auto-generated from the scope and tag name by default.

- 32-character lowercase hex string, unique across all widgets
- **Once set, NEVER change the value** — changing it breaks all existing references

---

## Build-Time Extraction

AIUX platform decorators are **build-time metadata** — arguments are extracted from the AST without executing the code. **Arguments must be static literals** — no variables, expressions, template literals, or function calls.

```js
// Static string literals only
@name('My Widget')
@bestFor('Showing incident details in a compact card')
```


=== FILE: references/widget/data-fetching.md ===
# Data Fetching & Loading States

## Server Communication

### Basic Fetch

```js
connectedCallback() {
  super.connectedCallback();
  this._fetchData();
}

async _fetchData() {
  if (this._fetching) return;  // in-flight guard (P23)
  this._fetching = true;
  this._loading = true;
  try {
    const response = await this.server.get({action: 'getData'});
    if (response.isError) {
      this._error = response.errorMessage;
    } else {
      this._items = response.items || [];
      this._error = '';
    }
  } catch (e) {
    this._error = i18n.getMessage('Failed to load data');
  } finally {
    this._loading = false;
    this._fetching = false;
  }
}
```

### With Parameters (Action-Based)

```js
async _fetchIncidents(sortOrder = 'recent') {
  const response = await this.server.get({
    action: 'getIncidents',
    sortOrder,
    limit: 10
  });
  this._incidents = response.incidents || [];
}
```

### Re-fetch Default Data

```js
async _handleRefresh() {
  this._loading = true;
  await this.server.update();
  this._loading = false;
}
```

### Refetch on Property Change

```js
updated(changedProperties) {
  if (changedProperties.has('selectedId') && this.selectedId) {
    this._loadRecord(this.selectedId);
  }
}
```

---

## Loading State Management

### Full Pattern (try/catch/finally)

```js
static properties = {
  _loading: {type: Boolean, state: true},
  _error: {type: String, state: true},
  _items: {type: Array, state: true}
};

constructor() {
  super();
  this._loading = false;
  this._error = '';
  this._items = [];
  this._fetching = false;
}
```

### Render States

```js
render() {
  if (this._loading) return this._renderSkeletonLoader();
  if (this._error) return this._renderError();
  if (!this._items?.length) return this._renderEmptyState();
  return this._renderData();
}
```

---

## Error Display

```js
_renderError() {
  return html`
    <div class="aiux-alert aiux-alert-error m-4">
      <aiux-icon name="alert-circle-outline" size="sm"></aiux-icon>
      <span>${this._error}</span>
      <button class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${this._fetchData}>
        ${i18n.getMessage('Retry')}
      </button>
    </div>
  `;
}
```

---

## Truncation Awareness

When the server caps results with `setLimit()`, indicate whether more records exist so the client can display a truncation notice.

### Server Pattern

```js
// After the query loop, get total count with GlideAggregate
var ga = new GlideAggregate('incident');
ga.addAggregate('COUNT');
ga.addQuery('active', true);
ga.query();
var totalAvailable = 0;
if (ga.next()) {
  totalAvailable = parseInt(ga.getAggregate('COUNT'), 10);
}

data.items = items;
data.total = items.length;
data.totalAvailable = totalAvailable;
data.hasMore = totalAvailable > items.length;
```

### Client Pattern

```js
static properties = {
  _hasMore: {type: Boolean, state: true},
  _totalAvailable: {type: Number, state: true}
};

constructor() {
  super();
  this._hasMore = false;
  this._totalAvailable = 0;
}

// In _fetchData success path:
this._hasMore = response?.hasMore || false;
this._totalAvailable = response?.totalAvailable || 0;

// Render truncation notice:
_renderTruncationNotice() {
  if (!this._hasMore) return nothing;
  return html`
    <p class="text-xs mt-2 text-text-tertiary">
      ${i18n.getMessage('Showing {0} of {1}', [this._items.length, this._totalAvailable])}
    </p>
  `;
}
```

---

## Real-Time Data with recordWatcherService

Subscribe to live record updates:

```js
import {recordWatcherService} from '@servicenow/aiux-services';

connectedCallback() {
  super.connectedCallback();
  this._subscription = recordWatcherService.subscribe({
    table: 'incident',
    filter: 'active=true',
    callback: (event) => {
      if (event.operation === 'insert' || event.operation === 'update') {
        this._fetchData();  // refresh on change
      }
    }
  });
}

disconnectedCallback() {
  super.disconnectedCallback();
  this._subscription?.unsubscribe();  // REQUIRED cleanup
}
```

---

## Debounced Search

```js
static properties = {
  _searchQuery: {type: String, state: true},
  _searchResults: {type: Array, state: true}
};

constructor() {
  super();
  this._searchQuery = '';
  this._searchResults = [];
  this._debounceTimer = null;
  this._handleSearch = this._handleSearch.bind(this);
}

_handleSearch(e) {
  this._searchQuery = e.target.value;
  clearTimeout(this._debounceTimer);
  this._debounceTimer = setTimeout(() => {
    this._executeSearch(this._searchQuery);
  }, 300);
}

async _executeSearch(query) {
  if (!query.trim()) {
    this._searchResults = [];
    return;
  }
  const response = await this.server.get({
    action: 'search',
    query: query.trim()
  });
  this._searchResults = response.results || [];
}

disconnectedCallback() {
  super.disconnectedCallback();
  clearTimeout(this._debounceTimer);
}
```

---

## Fire-and-Forget (Non-Blocking)

For non-critical operations (analytics, preference saving), update state immediately and fire the async call without awaiting:

```js
_handleSortChange(sortOrder) {
  this._sortOrder = sortOrder;
  this.requestUpdate();
  saveUserPreference('sortOrder', sortOrder).catch(err =>
    log.warn({error: err.message}, 'Failed to save preference')
  );
}
```


=== FILE: references/widget/component-patterns.md ===
# Component Patterns

## Property Declaration

### Public Properties (Attributes)

```js
static properties = {
  title: {type: String},
  count: {type: Number},
  enabled: {type: Boolean},
  items: {type: Array},
  config: {type: Object},
  userName: {type: String, attribute: 'user-name'}  // custom attribute name
};

constructor() {
  super();
  this.title = '';
  this.count = 0;
  this.enabled = true;
  this.items = [];
  this.config = {};
  this.userName = 'Default Name';
}
```

### Internal State

Use `state: true` for properties that shouldn't reflect to attributes:

```js
static properties = {
  _loading: {type: Boolean, state: true},
  _error: {type: String, state: true},
  _selectedIndex: {type: Number, state: true},
  _items: {type: Array, state: true}
};
```

Every property assigned anywhere in the class must be declared — Lit only re-renders when a declared reactive property changes:

```js
static properties = {
  _loading: {type: Boolean, state: true},
  _items: {type: Array, state: true},
  _error: {type: String, state: true}
};
```

---

## Base Class Selection

| Scenario                             | Base Class                       |
| ------------------------------------ | -------------------------------- |
| Page, layout, custom component       | `AIUXElement`                    |
| Standalone widget with server script | `AIUXWidgetElement`              |
| Widget with auto data binding        | `WithData(AIUXWidgetElement)`    |
| Chat-integrated widget               | `withWidgetContext(AIUXElement)` |

---

## Lifecycle Patterns

### Data Fetching

```js
connectedCallback() {
  super.connectedCallback();
  this._fetchData();
}

async _fetchData() {
  if (this._fetching) return;  // in-flight guard
  this._fetching = true;
  this._loading = true;
  try {
    const response = await this.server.get({action: 'getData'});
    if (response.isError) {
      this._error = response.errorMessage;
    } else {
      this._items = response.items || [];
      this._error = '';
    }
  } catch (e) {
    this._error = i18n.getMessage('Failed to load data');
  } finally {
    this._loading = false;
    this._fetching = false;
  }
}
```

### In-Flight Guard for Event-Triggered Server Calls

When event handlers (approve, reject, save, delete) trigger server calls, guard against overlapping requests with a boolean flag:

```js
static properties = {
  _actioning: {type: Boolean, state: true}
};

constructor() {
  super();
  this._actioning = false;
  this._handleApprove = this._handleApprove.bind(this);
}

async _handleApprove(e) {
  const sysId = e.currentTarget.dataset.id;
  if (!sysId || this._actioning) return;
  this._actioning = true;

  try {
    const response = await this.server.get({action: 'approve', sysId});
    if (response?.isError) {
      this._error = response.errorMessage || i18n.getMessage('Failed to approve');
      return;
    }
    this._fetching = false;
    await this._fetchData();
  } catch (error) {
    this._error = i18n.getMessage('Failed to approve');
  } finally {
    this._actioning = false;
  }
}
```

### Refetch on Property Change

```js
updated(changedProperties) {
  if (changedProperties.has('selectedId') && this.selectedId) {
    this._loadRecord(this.selectedId);
  }
}
```

---

## Event Handling

### Binding

Binding is only needed when passing a handler to `addEventListener`/`removeEventListener` — `removeEventListener` must receive the exact same function reference that was passed to `addEventListener`. Lit template `@event` bindings do not require it.

**Preferred: class field arrow function** — already bound to the instance, stable reference by default:

```js
// Arrow class field = auto-bound, same reference every time
_handleFieldChange = e => {
  const {name, value} = e.detail;
  if (name === 'title') this._title = value;
};

connectedCallback() {
  super.connectedCallback();
  this.addEventListener('AIUX_CONTROL_INPUT#VALUE_CHANGED', this._handleFieldChange);
}

disconnectedCallback() {
  super.disconnectedCallback();
  this.removeEventListener('AIUX_CONTROL_INPUT#VALUE_CHANGED', this._handleFieldChange);
}
```

**Alternative: explicit bind** — needed only when the handler is a regular method and you cannot use a class field:

```js
constructor() {
  super();
  this._boundHandleSort = this._handleSort.bind(this);
}

connectedCallback() {
  super.connectedCallback();
  document.addEventListener('keydown', this._boundHandleSort);
}

disconnectedCallback() {
  super.disconnectedCallback();
  document.removeEventListener('keydown', this._boundHandleSort);
}
```

### Dispatching Custom Events

```js
_handleItemSelect(e) {
  const id = e.currentTarget.dataset.id;
  this.dispatchEvent(new CustomEvent('aiux-widget:item-select', {
    detail: {id},
    bubbles: true,
    composed: true
  }));
}
```

### In Loops — Data Attributes

```js
// single handler on the container, item id from data attribute
${this._items.map(item => html`
  <li data-id=${item.sys_id} @click=${this._handleItemSelect}>
    ${item.name}
  </li>
`)}
```

---

## Template Organization

Split complex templates into focused helpers:

```js
render() {
  return html`
    <div class="aiux-card bg-base-100 shadow-sm h-full">
      <div class="aiux-card-body p-6">
        ${this._loading ? this._renderSkeletonLoader()
        : this._error ? this._renderError()
        : !this._items?.length ? this._renderEmptyState()
        : this._renderData()}
      </div>
    </div>
  `;
}

_renderSkeletonLoader() {
  return html`
    <div class="flex flex-col gap-2">
      ${Array(3).fill(0).map(() => html`
        <div class="aiux-skeleton h-12 w-full rounded"></div>
      `)}
    </div>
  `;
}

_renderEmptyState() {
  return html`
    <div class="flex flex-col items-center justify-center h-full p-8">
      <aiux-icon name="inbox-outline" size="lg"></aiux-icon>
      <p class="text-sm mt-2 text-text-tertiary">
        ${i18n.getMessage('No items found')}
      </p>
    </div>
  `;
}

_renderError() {
  return html`
    <div class="aiux-alert aiux-alert-error aiux-alert-soft">
      <span>${this._error}</span>
    </div>
  `;
}
```

---

## Conditional Rendering

### classMap

```js
import {classMap} from 'lit/directives/class-map.js';

render() {
  const classes = classMap({
    'aiux-btn': true,
    'aiux-btn-primary': this._primary,
    'aiux-btn-sm': this._size === 'small'
  });
  return html`<button class=${classes}>Click</button>`;
}
```

### repeat() for Keyed Lists

```js
import {repeat} from 'lit/directives/repeat.js';

${repeat(this._items, item => item.sys_id, item => html`
  <incident-card .incident=${item}></incident-card>
`)}
```

### cache() for State Switching

```js
import {cache} from 'lit/directives/cache.js';

render() {
  return html`${cache(this._view === 'list'
    ? html`<list-view .items=${this._items}></list-view>`
    : html`<detail-view .record=${this._record}></detail-view>`
  )}`;
}
```

---

## Internationalization

### Client-Side

```js
import {i18n} from '@servicenow/aiux-services';

render() {
  return html`
    <h2>${i18n.getMessage('Incidents')}</h2>
    <p>${i18n.getMessage('{0} items found', [this._items.length])}</p>
  `;
}
```

### Server-Side

```js
data.errorMessage = gs.getMessage('Failed to load data');
data.title = gs.getMessage('Recent Incidents');
```

All user-facing strings use `i18n.getMessage()`.


=== FILE: references/widget/server-scripts.md ===
# Server Script Patterns

Server scripts run on the ServiceNow server when widgets call `this.server.get()`. They use ServiceNow server-side JavaScript with access to GlideRecord, GlideQuery, and other ServiceNow APIs.

---

## Server Script Structure

**Use `export default function` — the build pipeline compiles it to an IIFE at deploy time.**

Server scripts are ES module files. The Rollup build step wraps them into the IIFE format the Glide runtime expects. Always write server scripts as exported functions:

```js
export default function server(data, _options, input) {
  // your logic — assign fields to `data` to return them to the client
}
```

### Standard pattern

```js
export default function server(data, _options, input) {
  var action = (input && input.action) || 'getItems';

  if (action === 'getItems') {
    try {
      var items = [];
      var gr = new GlideRecordSecure('incident');
      gr.setLimit(50);
      gr.query();

      while (gr.next()) {
        items.push({
          sys_id: gr.getUniqueValue(),
          number: gr.getValue('number'),
          description: gr.getValue('short_description'),
          state: gr.getDisplayValue('state'),
          priority: gr.getDisplayValue('priority')
        });
      }

      data.items = items;
      data.count = items.length;
    } catch (e) {
      gs.error('MyWidget handleGetItems: ' + e.message);
      data.isError = true;
      data.errorMessage =
        gs.getMessage('Failed to load data') + ': ' + e.message;
    }
  }
}
```

### Truncation awareness with `setLimit()`

When the server uses `setLimit()` to cap results, always return `data.hasMore` and `data.totalAvailable` so the client can display a truncation notice. Use `GlideAggregate` for the total count (never `getRowCount()`):

```js
// After the query loop:
var ga = new GlideAggregate('incident');
ga.addAggregate('COUNT');
ga.addQuery('active', true);
ga.query();
var totalAvailable = 0;
if (ga.next()) {
  totalAvailable = parseInt(ga.getAggregate('COUNT'), 10);
}

data.items = items;
data.total = items.length;
data.totalAvailable = totalAvailable;
data.hasMore = totalAvailable > items.length;
```

### Importing shared utilities

```js
import {getPriorityLabel, truncate} from './utils/format.js';

export default function server(data, _options, _input) {
  // Rollup inlines the import at build time
  var label = getPriorityLabel(1);
  data.label = label;
}
```

---

## Client-Server Communication

### Client Side

```js
// Simple fetch (executes default server action)
const response = await this.server.get();

// With parameters
const response = await this.server.get({
  action: 'getIncidents',
  sortOrder: 'recent',
  limit: 10
});

// Re-fetch default data (no action dispatch)
await this.server.update();
```

### Server Side Receives

```js
export default function server(data, _options, input) {
  // input.action → 'getIncidents'
  // input.sortOrder → 'recent'
  // input.limit → 10
}
```

---

## Parameter Handling

### Priority: input > options > default

```js
var sysId = (input && input.sysId) || options.sysId;
var table = (input && input.table) || options.table || 'incident';
var limit = parseInt(input.limit, 10) || 10;
```

### Early Return Guard

```js
if (!input || !input.action) {
  return; // Only respond to explicit actions
}
```

### Null/Empty Checks

```js
if (gs.nil(input.userId)) return;
if (gs.nil(input.table)) {
  data.isError = true;
  data.errorMessage = gs.getMessage('Table parameter is required');
  return;
}
```

---

## GlideRecord Patterns

### Query with Security

Always use `GlideRecordSecure` (enforces ACLs):

```js
var gr = new GlideRecordSecure('incident');
gr.setLimit(50);
gr.addEncodedQuery('active=true^ORDERBYDESCsys_created_on');
gr.query();
```

To restrict which columns are fetched, use GlideQuery with `.select()` instead — GlideRecord has no field-selection API:

```js
var results = new GlideQuery('incident')
  .where('active', true)
  .orderByDesc('sys_created_on')
  .select('number', 'short_description', 'state', 'priority')
  .limit(50)
  .toArray(50);
```

### Single Record Lookup

```js
var gr = new GlideRecordSecure('incident');
if (gr.get(input.sysId)) {
  if (!gr.canRead()) {
    data.isError = true;
    data.errorMessage = gs.getMessage('Access denied');
    return;
  }
  data.record = {
    sys_id: gr.getUniqueValue(),
    number: gr.getValue('number'),
    short_description: gr.getValue('short_description'),
    assigned_to: gr.getDisplayValue('assigned_to')
  };
} else {
  data.isError = true;
  data.errorMessage = gs.getMessage('Record not found');
}
```

### Field Access Methods

| Method                     | Returns          | Use for                           |
| -------------------------- | ---------------- | --------------------------------- |
| `getValue('field')`        | Raw string value | Sys_ids, numbers, internal values |
| `getDisplayValue('field')` | Display string   | Reference fields, choice labels   |
| `getUniqueValue()`         | Record sys_id    | Always use for sys_id             |
| `getBooleanValue('field')` | `true`/`false`   | Boolean fields                    |

### Aggregation

```js
var ga = new GlideAggregate('incident');
ga.addAggregate('COUNT');
ga.addQuery('active', true);
ga.query();
if (ga.next()) {
  data.totalCount = parseInt(ga.getAggregate('COUNT'), 10);
}
```

---

## GlideQuery (Modern API)

```js
var results = new GlideQuery('incident')
  .where('active', true)
  .where('priority', '<=', 2)
  .select('number', 'short_description', 'state')
  .limit(20)
  .toArray(20);

data.items = results.map(function (r) {
  return {
    sys_id: r.sys_id.value,
    number: r.number.value,
    description: r.short_description.value
  };
});
```

### Field Selection with `.select()`

Use GlideQuery when you need to restrict the columns the server fetches. `sys_id` is always returned automatically.

```js
var results = new GlideQuery('incident')
  .where('active', true)
  .orderByDesc('sys_created_on')
  .select('number', 'short_description', 'state', 'priority', 'assigned_to')
  .limit(50)
  .toArray(50);

data.items = results.map(function (r) {
  return {
    sys_id: r.sys_id.value,
    number: r.number.value,
    description: r.short_description.value,
    state: r.state.displayValue,       // .displayValue for choice/reference fields
    priority: r.priority.displayValue,
    assigned_to: r.assigned_to.displayValue
  };
});
```

> `r.<field>.value` — raw stored value (sys_id, number, internal code)
> `r.<field>.displayValue` — human-readable label (choice fields, reference display values)

---

## Action Routing

### If-chain (small widgets, 1-2 actions)

```js
export default function server(data, _options, input) {
  if (input && input.action === 'feedback') {
    // handle feedback
  }
}
```

### Handler map (recommended for 3+ actions)

```js
export default function server(data, _options, input) {
  var actionHandlers = {
    getList: handleGetList,
    getRecord: handleGetRecord,
    updateRecord: handleUpdateRecord
  };

  var action = (input && input.action) || 'getList';
  var handler = actionHandlers[action];
  if (handler) {
    handler();
  }

  function handleGetList() {
    /* ... */
  }
  function handleGetRecord() {
    /* ... */
  }
  function handleUpdateRecord() {
    /* ... */
  }
}
```

---

## Security Rules

1. **Always `GlideRecordSecure`** — not plain `GlideRecord`
2. **Restrict fetched columns with GlideQuery** — GlideRecord fetches all columns and has no field-selection API; use GlideQuery with `.select('field1', 'field2')` when you need to limit what the server returns
3. **Always `setLimit()`** — default to 50 if unspecified
4. **Always `canRead()`/`canWrite()` after `.get()`** — check before accessing fields
5. **Validate all input** — defaults, parseInt, known action names
6. **Error shape**: `data.isError = true` + `data.errorMessage` that includes the actual error (`e.message`) — not a generic string alone
7. **Use `gs.getMessage()`** for all user-facing strings

---

## Script Includes

For reusable server logic, create Script Includes:

```js
// In server script
var helper = new global.MyAppHelper();
var result = helper.processRecords(input.table, input.query);
data.items = result;
```

---

## Debugging Server Scripts

```js
gs.info('MyWidget - action: ' + input.action);
gs.info('MyWidget - input: ' + JSON.stringify(input));
gs.info('MyWidget - query returned: ' + items.length + ' records');
```

View logs in: **System Logs → System Log → All** (filter by source)

### Common Pitfalls

- `getValue` in loops is fine; `getDisplayValue` in loops can be slow for reference fields — batch if >50 rows
- Use `GlideAggregate` for counts — `getRowCount()` fetches all rows into memory.
- `addNotNullQuery('field')` is the correct way to filter non-empty fields

## Module Resolution Traps (SSR isolate bundler)

Three failure modes where **the build passes and the browser breaks**, or the build
fails with a misleading cause. All three cost real debugging time.

### d3 (and any npm lib): static import, never `await import()`

A dynamic `import('d3')` inside a client-only hook looks like the SSR-safe choice
and **builds clean**, but leaves a bare `'d3'` specifier in the browser bundle
that the platform module loader cannot resolve. The promise rejects inside
`firstUpdated`, the chart never draws, and there is **no visible error** — the
page renders, sibling non-d3 components populate, only the charts are missing.

```js
// Builds, then silently never draws in the browser:
this.#d3 = await import('d3');

// Correct — Rollup bundles it into the page chunk:
import * as d3 from 'd3';
```

Static import is SSR-safe because d3 touches no DOM at module scope (`d3-timer`
guards `window`/`performance` with `typeof`). The real rule is narrower than
"never import d3 at module scope": **never *use* d3 during `render()` or
`loader()`**. Draw in `firstUpdated`/`updated` behind `if (isServer) return;` and
emit a static `<svg>` shell from `render()`.

> Diagnostic: chart missing but its non-d3 sibling works → suspect the module
> specifier, not the data.

Verify a lib is bundled: after `build`, a separate
`sys_aix_dependency_*_index.js` record for it means it is still being treated as
an unresolvable external.

### `Could not resolve import "#context"` — blame the `aiux-services` barrel

```
isolate bundle failed for page "home/page":
Could not resolve import "#context" from
node_modules/@servicenow/aiux/core/observability/logger.js
```

**The cause is not `getLogger`.** Avoiding `getLogger` does not fix it, and
patching `node_modules` is reverted by the next install.

Actual chain:

```
import {i18n} from '@servicenow/aiux/aiux-services'   ← barrel
  └─ services/src/index.js re-exports locationService
       └─ location-service.js imports createLogger from '@servicenow/aiux/aiux-observability'
            └─ core/observability/logger.js imports '#context' / '#processor'
```

`#context`/`#processor` are Node `imports`-field **private subpath aliases** in
`core/observability/package.json`. The isolate bundler resolves non-package dirs
with `@rollup/plugin-node-resolve`, which has **no `imports`-field support at
all**. `SN_PACKAGE_DIRS` (in `core/commons/build-isolate-bundle.js`) is
`['components','directives','controllers','mixins','libraries']` — `core/` and
`services/` are **not** in it, so `services/` source gets inlined and drags
observability in. `aiux-components-core` *is* externalised, so importing
`AIUXElement` is safe.

```js
// Breaks the SSR build:
import {i18n} from '@servicenow/aiux/aiux-services';

// Works — services/src/i18n.js has zero imports:
import {i18n} from '@servicenow/aiux/aiux-services/src/i18n.js';
```

Known tradeoff: the translation extractor matches the specifier
`@servicenow/aiux-services`, so a leaf import may skip string extraction.
`getMessage()` still returns the English fallback via the shared
`__WIDGET_MESSAGES__` global — degrades translations, does not break UI.

### A non-existent `aiux-components-*` import passes the build

`aiux-components-*` subpaths are **externalised** (mapped to
`globalThis.__aiuxCore` et al), not inlined, so the build **never validates that
the subpath exists**. A typo or imaginary component resolves to nothing in the
browser, the page module fails to load, and you get a blank page from a green
build.

Before importing `@servicenow/aiux/aiux-components-<x>`, confirm it exists:

```bash
ls node_modules/@servicenow/aiux/components/
```

Real list: ai-filter-assist, ainh-gateway, angular, announcement-banner,
attachment, catalog, chat, code-editor, condition-builder, config-editor,
config-editor-iframe-modal, config-editor-props-pane, controls, core,
dashboard-config, dashboard-layout, document-viewer, glide-widgets,
guidance-modal, guided-tour, help-assistant, help-panel, home, icon, layout,
layout-renderer, list, live-region, nacm, nav, notification-container,
page-alert, pagination, playbook, record, score, search-combobox, stepper,
visual-board, widget-loader.

There is **no** `empty-state`, `empty-state-content`, `now-greeting`, or
`info-badge` package. Write plain markup instead.

### Do not fetch from a page `loader()`

`loader()` runs in the SSR isolate. Absolute-URL `fetch` with `getHeaders(ctx)`
is fragile there, and because loaders wrap failures in `Promise.allSettled`, a
total failure is **indistinguishable from "no data"** — you get an empty state
and no error. Silent-wrong-answer failure mode.

Keep `loader()` to cheap non-network values (`{basePath: ctx.basePath}`). Fetch
client-side in `firstUpdated()` behind `if (isServer) return;` using `aiuxFetch`
on relative URLs, with explicit loading / error / empty states.

Prefer `/api/now/table` over `/api/now/stats`: fewer cross-scope and ACL
surprises. Use `sysparm_fields` + `sysparm_display_value=all` and aggregate in
JS — `display_value` keeps choice labels platform-translated.
