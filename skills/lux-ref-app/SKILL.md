---
name: lux-ref-app
description: "Lux reference: app shell, pages, navigation, theme, backend layer, extensions, plus a known-good project scaffold (aiux.json, application.js, theme.js, package.json, now.config.json, minimal page). Invoke when creating or restructuring a Lux app."
---

# lux-ref-app


=== FILE: references/app/pages-cookbook.md ===
# Pages Cookbook

Patterns for page templates in AIUX applications. All examples work in both JS and TS.

---

## Root Layout (`pages/layout.js`)

Apps using the Polaris sidebar/header shell extend `NavLayout` from `@servicenow/aiux-components-nav` and use `navLayoutContext` to drive the sidebar. Apps that do not need the shell (embedded experiences, lightweight prototypes) extend `AIUXAppLayoutElement` directly.

```js
import {NavLayout, navLayoutContext} from '@servicenow/aiux-components-nav';
import {css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {MyAppTheme} from '../theme.js';

@customElement('my-app-layout')
export default class MyAppLayout extends NavLayout {
  static appTheme = MyAppTheme;

  static styles = [
    ...NavLayout.styles,
    css`
      :host {
        --nav-sidebar-bg: linear-gradient(to bottom, #032d42 0%, #044355 100%);
        --nav-layout-bg: #f5f7fa;
      }
    `
  ];

  static async loader(ctx) {
    await super.loader(ctx, {
      appName: 'My App',
      features: {
        menus: false,
        logo: true,
        userSession: true,
        concoursePicker: false
      }
    });

    const pagePath = ctx.pagePath;

    const items = [
      {icon: 'home', title: 'Home', action: {type: 'navigate', path: '/home'}},
      {
        icon: 'list-outline',
        title: 'Incidents',
        action: {type: 'navigate', path: '/list/incident'}
      }
    ];

    navLayoutContext.set({
      ...navLayoutContext.get(),
      items: items.map(item => {
        const isActive = pagePath?.startsWith(item.action?.path);
        return {...item, ...(isActive && {active: true})};
      })
    });
  }
}
```

---

## Generic List Page (`pages/list/[table]/page.js`)

Uses `ListDataManager` for data and `aiux-list-connected` for rendering. Works with any ServiceNow table.

**Critical — `display: contents`:** The page host MUST be `display: contents` so `aiux-list-connected`'s internal flex layout inherits the NavLayout height chain. Using `display: block` breaks the layout — the list collapses and row affordances render in a detached column.

**Critical — bind `aiux-list-connected:*` events, not `aiux-list:*`:** Row/link clicks come through `@aiux-list-connected:reference-link-clicked` and UI actions through `@aiux-list-connected:ui-action-clicked`. These are the stable public API. The inner `aiux-list:*` events (e.g. `aiux-list:cell-link-clicked`) are internal and can change without notice.

```js
import '@servicenow/aiux-components-list';
import {ListDataManager} from '@servicenow/aiux-components-list';
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {navigate} from '@servicenow/aiux-client';
import {setDocumentTitle} from '../../utils/document-title.js';
import {getMessage} from '../../utils/i18n.js';

@customElement('my-app-list-page')
export default class ListPage extends AIUXElement {
  // REQUIRED: display:contents
  static styles = css`
    :host {
      display: contents;
    }
  `;

  firstUpdated() {
    setDocumentTitle(getMessage('Incidents'));
  }

  static async loader(ctx) {
    const {table} = ctx.params;
    const query = ctx.query?.sysparm_query || '';
    const data = await ListDataManager.fetch({table, query});
    return {table, query, data};
  }

  _handleRowClick(e) {
    const {referenceTable, referenceSysId, listTable, listSysId} = e.detail;
    const table = referenceTable || listTable;
    const sysId = referenceSysId || listSysId;
    if (table && sysId) navigate(`/record/${table}/${sysId}`);
  }

  _handleUIAction(e) {
    const {uiAction, table} = e.detail || {};
    if (uiAction?.name === 'new_record' && table) {
      navigate(`/record/${table}/-1`);
    }
  }

  render() {
    const {data, table, query} = this.loaderData || {};
    return html`
      <aiux-list-connected
        table=${table}
        .query=${query || ''}
        .data=${data}
        @aiux-list-connected:reference-link-clicked=${this._handleRowClick}
        @aiux-list-connected:ui-action-clicked=${this._handleUIAction}
      ></aiux-list-connected>
    `;
  }
}
```

---

## Generic Record Page (`pages/record/[table]/[id]/page.js`)

Uses `RecordDataManager` and `aiux-record-provider`. `sysId="-1"` opens a new-record form.

**Critical — `onOpenRecord` is a property callback**, not a DOM event. Use `.onOpenRecord=${fn}` (dot-binding). The handler receives `(table, sysId)` as separate arguments, not a `CustomEvent`. Using `@onOpenRecord` silently does nothing.

```js
import '@servicenow/aiux-components-record';
import {RecordDataManager} from '@servicenow/aiux-components-record';
import {AIUXElement, getLogger} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {navigate} from '@servicenow/aiux-client';
import {setDocumentTitle} from '../../utils/document-title.js';
import {getMessage} from '../../utils/i18n.js';

const log = getLogger('my-app-record-page');

@customElement('my-app-record-page')
export default class RecordPage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;

  firstUpdated() {
    const {table, id} = this.loaderData || {};
    setDocumentTitle(getMessage(table || 'Record'));
  }

  static async loader(ctx) {
    const {table, id} = ctx.params;
    let rawData = null;
    if (table && id && id !== '-1') {
      try {
        rawData = await RecordDataManager.fetchRecord({table, sysId: id});
      } catch (e) {
        log.error({error: e.message}, 'Failed to fetch record');
      }
    }
    return {table, id, rawData};
  }

  _handleOpenRecord(table, sysId) {
    if (table && sysId) navigate(`/record/${table}/${sysId}`);
  }

  render() {
    const {rawData, table, id} = this.loaderData || {};
    return html`
      <aiux-record-provider
        .data=${rawData}
        table=${table || ''}
        sysId=${id || ''}
        show-error-details="true"
        .onOpenRecord=${this._handleOpenRecord}
      >
        <aiux-record-form></aiux-record-form>
      </aiux-record-provider>
    `;
  }
}
```

**Troubleshooting — "Error loading record":** Keep `show-error-details="true"` to see the real error. Common causes:

- Invalid or empty `sysId`
- Instance GraphQL schema older than the package version (instance/build mismatch, not an app bug)

---

## Nested Layout (`pages/[table]/[id]/layout.js`)

For route groups that need shared data via scoped context. The `willUpdate` hook is **required** — without it, navigating between records under the same layout updates `loaderData` but never re-runs `provide()`, leaving child pages with stale data.

```js
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {detailContext} from '../../../contexts/detail-context.js';

@customElement('my-app-detail-layout')
export default class DetailLayout extends AIUXElement {
  _prevLoaderData = null;

  static async loader(ctx) {
    const {id} = ctx.params;
    return {id, record: await fetchRecord(id)};
  }

  connectedCallback() {
    super.connectedCallback();
    const {id, record} = this.loaderData || {};
    detailContext.provide(this, {id, record});
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    detailContext.unprovide(this); // REQUIRED — prevents memory leaks
  }

  willUpdate() {
    if (this.loaderData !== this._prevLoaderData) {
      this._prevLoaderData = this.loaderData;
      const {id, record} = this.loaderData || {};
      detailContext.provide(this, {id, record});
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}
```

Child pages consume:

```js
static contexts = [detailContext];
render() {
  const {id, record} = detailContext.get(this) || {};
}
```

---

## Custom Page (AIUXElement)

For pages that don't fit list/record patterns:

```js
import {AIUXElement} from '@servicenow/aiux-components-core';
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {i18n} from '@servicenow/aiux-services';
import {setDocumentTitle} from '../../utils/document-title.js';
import {getMessage} from '../../utils/i18n.js';

@customElement('my-app-dashboard')
export default class DashboardPage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      padding: 1rem;
    }
  `;

  firstUpdated() {
    setDocumentTitle(getMessage('Dashboard'));
  }

  static async loader(ctx) {
    const stats = await fetchDashboardStats(ctx);
    return {stats};
  }

  render() {
    const {stats} = this.loaderData || {};
    return html`
      <h1 class="text-lg font-semibold mb-4">
        ${i18n.getMessage('Dashboard')}
      </h1>
      <div class="grid grid-cols-3 gap-4">
        ${stats?.map(s => html`<stat-card .stat=${s}></stat-card>`)}
      </div>
    `;
  }
}
```


=== FILE: references/app/navigation-patterns.md ===
# Navigation Patterns

## `application.js` — The Preferred App Shell Pattern

Production apps (e.g. AICT) use `application.js` as the lifecycle module instead of a custom `NavLayout` class. The framework calls `setup()` once per SSR request before loaders run. Nav items, features, and app title are set via `navLayoutContext` inside `setup()`. The app shell is `aiux-nav-layout` (declared via `applicationLayout` in `application.js`).

```js
// application.js
import {navLayoutContext} from '@servicenow/aiux-components-nav';
import {i18n} from '@servicenow/aiux-services';
import {
  isPluginActive,
  getSystemProperty
} from '@servicenow/aiux-components-core';
import {MY_THEME} from './theme.js';
import {
  licenseContext,
  setLicenseContext,
  fetchLicense
} from './contexts/license-context.js';

export default {
  appTheme: MY_THEME,
  applicationLayout: 'aiux-nav-layout', // use platform nav shell
  contexts: [licenseContext], // auto-fetched before setup()

  async setup(ctx) {
    const [licenseResult] = await Promise.all([fetchLicense(ctx)]);
    setLicenseContext(licenseResult ?? {hasEnterpriseLicense: false});
    const hasEnterpriseLicense = licenseResult?.hasEnterpriseLicense === true;

    const features = {
      menus: false,
      logo: true,
      userSession: false,
      profile: true,
      chat: ctx.chat?.enabled === true,
      announcements: true,
      helpPanel: true
    };

    const items = [
      {
        icon: 'home',
        title: i18n.getMessage('Home'),
        action: {type: 'navigate', path: '/home'}
      },
      {
        icon: 'list-outline',
        title: i18n.getMessage('Inventory'),
        action: {type: 'navigate', path: '/inventory'},
        activePath: '/inventory'
      },
      ...(hasEnterpriseLicense
        ? [
            {
              icon: 'lightbulb',
              title: i18n.getMessage('Insights'),
              action: {type: 'navigate', path: '/insights'}
            }
          ]
        : []),
      {
        icon: 'gear',
        title: i18n.getMessage('Settings'),
        l2Nav: [
          {
            title: i18n.getMessage('Users'),
            action: {type: 'navigate', path: '/settings/users'}
          },
          {
            title: i18n.getMessage('Integrations'),
            action: {type: 'navigate', path: '/settings/integrations'}
          }
        ]
      }
    ];

    const current = navLayoutContext.get();
    navLayoutContext.set({
      ...current,
      appTitle: i18n.getMessage('My App'),
      features,
      items,
      defaultLogoFull:
        getSystemProperty('com.glide.myapp.logo_full') || 'servicenow',
      defaultLogoIcon:
        getSystemProperty('com.glide.myapp.logo_small') || 'servicenow'
    });
  },

  // Rewrite legacy SN URLs to app routes before navigation commits
  navigate(navCtx) {
    // navCtx.toAppPath, navCtx.to (URL), navCtx.from (URL)
    // return a new path string to redirect, or undefined to allow through
    if (/^\/incident\.do$/.test(navCtx.toAppPath)) {
      const sysId = navCtx.to.searchParams.get('sys_id');
      if (sysId) return `/record/incident/${sysId}`;
    }
    return undefined;
  },

  // Clean up nav when leaving this app (CSR cross-app navigation)
  teardown() {
    navLayoutContext.set({
      items: [],
      defaultLogoFull: null,
      defaultLogoIcon: null
    });
  }
};
```

### L2 Nav (Sub-menus) and L3 Nav (Header Tabs)

```js
// L2 (sidebar sub-menu items)
{
  icon: 'building',
  title: i18n.getMessage('Govern'),
  l2Nav: [
    {title: i18n.getMessage('Risk'), action: {type: 'navigate', path: '/control/risk'}},
    {title: i18n.getMessage('Security'), action: {type: 'navigate', path: '/security'}, l3Nav: [
      {label: i18n.getMessage('Overview'), path: '/security/overview'},
      {label: i18n.getMessage('Events'), path: '/security/events'}
    ]}
  ]
}

// activePath — marks an item active when any child route matches
{icon: 'inventory', title: 'Inventory', action: {type: 'navigate', path: '/inventory/all'}, activePath: '/inventory'}
```

### `setHeaderConfig` and `setPageActions` (from nested layouts)

Nested layouts can push dynamic header config and action buttons to the nav shell:

```js
import {setHeaderConfig, setPageActions} from '@servicenow/aiux-components-nav';

// In a nested layout's connectedCallback or willUpdate
setHeaderConfig(this, {
  actionsDropdown: true,
  title: assetName,
  metadata: [
    {label: 'Active', iconName: 'check-outline', iconClass: 'text-success'}
  ],
  l3: [
    {label: i18n.getMessage('Overview'), path: `/inventory/${id}`},
    {label: i18n.getMessage('Details'), path: `/inventory/${id}/details`}
  ]
});

setPageActions(this, [
  {
    id: 'manage_asset',
    label: i18n.getMessage('Manage'),
    handler: async () => {
      await manageAsset(id);
      await this._refreshAfterAction();
    }
  },
  {
    id: 'unmanage_asset',
    label: i18n.getMessage('Unmanage'),
    handler: async () => {
      await unmanageAsset(id);
    }
  }
]);
```

---

## NavLayout — The Simple App Shell (Polaris-shell apps only)

Apps using the Polaris sidebar/header shell extend `NavLayout` from `@servicenow/aiux-components-nav`. It provides the sidebar, header, user session, and content slot. Apps that do not need the Polaris shell (embedded experiences, lightweight prototypes) extend `AIUXAppLayoutElement` directly.

```js
import {NavLayout, navLayoutContext} from '@servicenow/aiux-components-nav';
import {css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {MyAppTheme} from '../theme.js';

@customElement('my-app-layout')
export default class MyAppLayout extends NavLayout {
  static appTheme = MyAppTheme;

  static styles = [
    ...NavLayout.styles,
    css`
      :host {
        --nav-sidebar-bg: linear-gradient(to bottom, #032d42 0%, #044355 100%);
        --nav-layout-bg: #f5f7fa;
      }
    `
  ];

  static async loader(ctx) {
    await super.loader(ctx, {
      appName: 'My App',
      features: {
        menus: false,
        logo: true,
        userSession: true,
        concoursePicker: false
      }
    });
    // configure sidebar items (see Sidebar section below)
  }
}
```

### Key Rules

- **Polaris-shell root layout extends `NavLayout`** — non-shell apps extend `AIUXAppLayoutElement`. Nested layouts extend `AIUXElement`.
- **Always call `super.loader(ctx, options)`** before setting sidebar items
- **Always spread `...NavLayout.styles`** in `static styles` — omitting it breaks the shell
- **Pages inside NavLayout MUST use `display: contents`** on `:host` — otherwise `aiux-list-connected` and other flex children collapse

### Features Object

| Feature           | Type    | Description                                  |
| ----------------- | ------- | -------------------------------------------- |
| `appName`         | string  | Display name in header                       |
| `menus`           | boolean | Show app menus (default: false)              |
| `logo`            | boolean | Show ServiceNow logo (default: true)         |
| `userSession`     | boolean | Show user avatar/session (default: true)     |
| `concoursePicker` | boolean | Show concourse scope picker (default: false) |

### CSS Custom Properties

| Property              | Default | Description                            |
| --------------------- | ------- | -------------------------------------- |
| `--nav-sidebar-bg`    | —       | Sidebar background (gradient or color) |
| `--nav-layout-bg`     | —       | Main content area background           |
| `--nav-sidebar-width` | —       | Sidebar width when expanded            |

### navLayoutContext

`navLayoutContext` is the shared context for sidebar state. Always read-modify-write:

```js
navLayoutContext.set({
  ...navLayoutContext.get(),
  items: [...],        // sidebar items
  // other props the context supports
});
```

---

## File-Based Routing

Pages live in `pages/`. Folders map directly to URL segments. `[param]` brackets create dynamic segments.

| File path                           | Route                | Params                              |
| ----------------------------------- | -------------------- | ----------------------------------- |
| `pages/home/page.js`                | `/home`              | —                                   |
| `pages/list/[table]/page.js`        | `/list/:table`       | `ctx.params.table`                  |
| `pages/record/[table]/[id]/page.js` | `/record/:table/:id` | `ctx.params.table`, `ctx.params.id` |
| `pages/[...slug]/page.js`           | `/:slug*`            | `ctx.params.slug` (catch-all)       |

Catch-all segments use `[...name]` to match the remainder of the path.

---

## Programmatic Navigation

```js
import {navigate} from '@servicenow/aiux-client';

// App-relative path — the router prepends basePath automatically
navigate('/record/incident/abc123');

// Replace current history entry (redirect-style)
navigate('/home', {replace: true});
```

The path is **app-relative** — do NOT include `basePath`.

---

## Anchor Links

Anchor links require the **full basePath-prefixed** href. Read `basePath` from the loader `ctx`.

```js
static async loader(ctx) {
  return {basePath: ctx.basePath};
}

render() {
  const {basePath} = this.loaderData || {};
  return html`<a href="${basePath}/home">Home</a>`;
}
```

**Do NOT use relative hrefs** like `./home` — they do not resolve correctly. The router intercepts absolute `basePath`-prefixed links for SPA navigation.

---

## Sidebar Navigation Items

Sidebar items are configured in the root layout's `loader` via `navLayoutContext`:

```js
const items = [
  {icon: 'home', title: 'Home', action: {type: 'navigate', path: '/home'}},
  {
    icon: 'list-outline',
    title: 'Incidents',
    action: {type: 'navigate', path: '/list/incident'}
  },
  {
    icon: 'document-outline',
    title: 'Tasks',
    action: {type: 'navigate', path: '/list/task'}
  },
  // Divider
  {divider: true},
  // External link
  {
    icon: 'link-outline',
    title: 'Docs',
    action: {type: 'link', href: 'https://docs.servicenow.com'}
  }
];
```

### Item Shape

| Property      | Type                     | Description                        |
| ------------- | ------------------------ | ---------------------------------- |
| `icon`        | string                   | Icon name for `<aiux-icon>`        |
| `title`       | string                   | Display text                       |
| `action.type` | `'navigate'` or `'link'` | Navigation type                    |
| `action.path` | string                   | App-relative path (for `navigate`) |
| `action.href` | string                   | Full URL (for `link`)              |
| `active`      | boolean                  | Highlight as current               |
| `divider`     | boolean                  | Render as separator                |

### Active State

Set active based on current `pagePath`:

```js
static async loader(ctx) {
  const pagePath = ctx.pagePath;
  // ...
  navLayoutContext.set({
    ...navLayoutContext.get(),
    items: items.map(item => {
      const isActive = pagePath?.startsWith(item.action?.path);
      return {...item, ...(isActive && {active: true})};
    })
  });
}
```

---

## Layout Chain

The layout chain resolves from outermost (root) to innermost:

```
pages/layout.js           → Root layout (NavLayout, sidebar, theme)
  pages/detail/layout.js  → Nested layout (scoped context provider)
    pages/detail/[id].js  → Page (consumes context)
```

Each layout's loader runs **before** the page's loader. Layouts render their content via `<slot></slot>`.


=== FILE: references/app/theme-and-config.md ===
# Theme & Configuration

## aiux.json

App configuration — MUST exist at the project root.

```json
{
  "name": "My App",
  "basename": "my-app",
  "landing": "/home",
  "systemPropertyAllowlist": true,
  "chatDeploymentChannelSysId": "0c697083ffd803104846fffffffffffd",
  "development": {
    "token": "Basic YWRtaW46YWRtaW4="
  },
  "build": {
    "exclude": ["**/*.test.js", "**/test/**"]
  }
}
```

| Field                        | Purpose                          | Rule                                        |
| ---------------------------- | -------------------------------- | ------------------------------------------- |
| `name`                       | Human-readable app name          | Displayed in manifests                      |
| `basename`                   | URL prefix (e.g. `/aiux/my-app`) | Must match `package.json` → `aiux.basename` |
| `landing`                    | Default landing page path        | Must be a valid page route                  |
| `systemPropertyAllowlist`    | Enable sys prop allowlist file   | `true` when using `getSystemProperty()`     |
| `chatDeploymentChannelSysId` | Chat widget channel sys_id       | Required for embedded chat integration      |
| `build.exclude`              | Glob patterns to exclude         | Always exclude test files                   |

---

## `application.js` — App Lifecycle Module

The `application.js` file at the project root is the preferred way to configure the app shell, nav, and lifecycle hooks in production apps.

```js
// application.js
import {MY_THEME} from './theme.js';

export default {
  appTheme: MY_THEME,
  applicationLayout: 'aiux-nav-layout',  // platform shell — replaces custom NavLayout class

  // Called once per SSR request before page loaders run
  async setup(ctx) { ... },

  // Called on every client-side navigation — return a path to redirect, undefined to allow
  navigate(navCtx) { return undefined; },

  // Called when leaving the app (CSR cross-app navigation only)
  teardown() { ... }
};
```

`applicationLayout: 'aiux-nav-layout'` tells the framework to use the platform's built-in nav shell component. This is required when using the `application.js` approach — without it the app has no shell.

---

## `theme.js` — App Theme

```js
// theme.js — exported as a named const, imported by application.js
export const MY_THEME = {
  primary_color: '#032D42',
  neutral_colors: {
    use_hex_value: true,
    hex_value: '#F8F7F4'
  },
  shape: {
    selector_radius: '0.75rem',
    field_radius: '0.5rem',
    boxes_radius: '1rem',
    border_width: '1px'
  }
};
```

Set in `application.js`:

```js
export default {
  appTheme: MY_THEME
  // ...
};
```

---

## package.json

Must include AIUX-specific fields:

```json
{
  "name": "@servicenow/my-app",
  "aiux": {
    "basename": "my-app"
  }
}
```

**`aiux.basename` MUST match `aiux.json#basename`** — mismatch causes routing failures.

---

## now.config.json

Fluent SDK metadata for the ServiceNow instance:

```json
{
  "scope": "x_snc_my_app",
  "scopeId": "abc123def456"
}
```

Scope configuration is managed by the now-sdk tooling — do not add `scope`/`scopeId` to `aiux.json`.


=== FILE: references/app/backend-layer.md ===
# Backend Layer

Scoped AIUX applications add ServiceNow metadata (tables, roles, ACLs, navigation) and a deploy pipeline via the Fluent SDK.

---

## Fluent SDK File Map

```
fluent/
├── update/
│   ├── sys_db_object/           # Table definitions
│   ├── sys_dictionary/          # Field definitions
│   ├── sys_user_role/           # Roles
│   ├── sys_security_acl/        # ACLs
│   ├── sys_app_module/          # Application navigation modules
│   └── sys_ai_agent/            # AI agent configurations (optional)
└── now.config.json              # Scope and scopeId
```

---

## Build & Deploy Pipeline

```bash
pnpm run build                  # Build the AIUX app
pnpm run deploy                 # Deploy to ServiceNow instance
pnpm run deploy:full            # Build + deploy in one step
```

`deploy:full` runs:

1. `pnpm build` — compiles app, generates widget XML
2. `pnpm deploy` — pushes to instance via Fluent SDK

---

## Common Gotchas

| Issue                            | Cause                                                           | Fix                                              |
| -------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Deploy fails with scope mismatch | `now.config.json`, `aiux.json`, `fluent/` have different scopes | Align all three                                  |
| Stale metadata on instance       | Cached old version                                              | Clear instance cache, re-deploy                  |
| Missing type definitions         | `dist/app` out of sync                                          | Delete `dist/`, rebuild                          |
| "Record not found" after deploy  | Role/ACL not deployed                                           | Check `sys_user_role` and `sys_security_acl` XML |
| Widget not visible on instance   | Missing `@discoverable(true)`                                   | Add decorator and rebuild                        |

---

## Role/ACL Contract

Three files must agree for a role-protected resource:

1. **`sys_user_role/`** — role definition XML
2. **`sys_security_acl/`** — ACL referencing the role
3. **Application code** — role checks in server scripts (`GlideRecordSecure`, `gs.hasRole()`)

---

## Dev Server

```bash
pnpm run dev    # Start local development server
```


=== FILE: references/app/extensions.md ===
# Adding Extensions to an Existing App

Use this reference when the user's intent is to **overlay pages onto a host application** rather than add a page to the current standalone app. Extensions live in `src/extensions/` and do not modify host application code. This reference is self-contained — no companion skill needs to be invoked for extension work.

## When This Applies

- User says "add an extension page", "extend `<host app>`", "overlay a page on `<host>`", "create an extension for `<host-scope>`"
- The target route belongs to a **different, existing host experience** — not a page under this app's own `pages/` directory
- Distinguish from a normal BUILD-mode page: a normal page lives at `pages/<route>/page.js` in *this* app; an extension page lives at `src/extensions/<host-scope>/<host-basename>/pages/<route>/page.js` (or `src/extensions/<experience-sys_id>/pages/<route>/page.js`) and targets a *host* app.

## Scaffolding Options

**Option A — Scaffold a new extension project from scratch:**

```bash
npx @servicenow/sdk@latest init --template javascript.aiux-extension
```

This scaffolds a complete extension project with `src/extensions/`, `application.js`, a hello-world page, and `now.config.json` pre-configured.

**Option B — Add extensions to an existing AIUX application:**

If you already have a working AIUX app and want it to extend another host experience, no re-scaffold is needed. Just:

1. Create the `src/extensions/<host-scope>/<host-basename>/pages/<route>/page.js` directory structure
2. Optionally add a per-host lifecycle module at `src/extensions/<host-scope>/<host-basename>/application.js` for nav contributions
3. Build and deploy as normal — `pnpm build && pnpm run deploy`

The build auto-discovers `src/extensions/` pages and emits the host-targeting records alongside your app's own pages. **Caution:** combining your own `pages/` with `src/extensions/` pages in the same project is unsafe — see the extensibility doc's Known Limitations.

## Path Conventions

Two equivalent formats — both are discovered identically. A single project can mix conventions across hosts.

**Convention 1 (scope + basename — familiar):**

```
src/extensions/<host-scope>/<host-basename>/pages/<route>/page.js
src/extensions/sn_app_aict_ui/aict/pages/home/page.js
```

**Convention 2 (direct sys_id — explicit):**

```
src/extensions/<experience-sys_id>/pages/<route>/page.js
src/extensions/2f86ed94fdab96a806bbbb5b8573c5d5/pages/home/page.js
```

**Key:** extension pages use `page.js` (not `index.js`). The route is derived from the directory path, not the filename.

If the host scope/basename/sys_id is unknown and cannot be inferred from the workspace (e.g. an existing `src/extensions/` sibling), ask the user before scaffolding.

## Key Concepts

- **Pages = Lit web components** extending `AIUXElement`
- **Loaders = SSR data fetching** via `static async loader(ctx)`
- **Layouts = nested inheritance** with per-level most-specific-wins precedence
- **Extensions = overlay pages** on host applications without modifying host code
- **Host-level chrome** (nav items, etc.) is contributed via `application.js` exporting `setup(ctx)` — `extension.js` is not read by the build

## Extension Page Template

```js
import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {
  AIUXElement,
  decorators,
  getLogger
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

const {roles} = decorators;
const log = getLogger('{{TAG_NAME}}');

// Save to: src/extensions/<host-scope>/<host-basename>/pages/<route>/page.js

@customElement('x-scope-page-name') // Replace 'x-scope' with your scope prefix
// @roles(['admin', 'user'])  // Uncomment to restrict access to roles
export default class MyPage extends AIUXElement {
  static styles = css`
    :host { display: block; height: 100%; }
  `;

  constructor() {
    super();
    this._loading = false;
    this._error = null;
  }

  /**
   * Runs on the server during initial render and on the client during
   * navigation. Returned object is embedded as __LOADER_DATA__ and
   * exposed as this.loaderData in render().
   */
  static async loader(ctx) {
    try {
      return {pageTitle: i18n.getMessage('{{PAGE_TITLE}}')};
    } catch (err) {
      log.error({error: err.message}, '{{CLASS_NAME}} loader error');
      throw err;
    }
  }

  render() {
    if (!this.loaderData) {
      return html`<p>${i18n.getMessage('Loading')}</p>`;
    }
    if (this.loaderData.error) {
      return html`<p>${this.loaderData.error}</p>`;
    }
    return html`<h1>${this.loaderData.pageTitle}</h1>`;
  }
}
```

Never use browser APIs (`window`, `document`, `localStorage`) inside `render()` or `loader()` — both run during SSR. Guard with `isServer` per `references/foundation/ssr-safety.md`.

## Loader Module Pattern (optional separate file)

```js
// Location: src/extensions/<host>/pages/<route>/loaders/data.js
import {getHeaders, getLogger} from '@servicenow/aiux/aiux-components-core';

const log = getLogger('fetchPageData');

export async function fetchPageData(ctx) {
  try {
    const url = new URL(`${ctx.protocol}://${ctx.hostname}/api/v2/your-endpoint`);
    if (ctx.params.id) url.searchParams.set('id', ctx.params.id);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(ctx),
      credentials: 'include'
    });
    if (!resp.ok) throw new Error(`Failed to fetch data: ${resp.status} ${resp.statusText}`);
    return await resp.json();
  } catch (err) {
    log.error({error: err.message}, 'fetchPageData error');
    throw err;
  }
}
```

Import it in the page: `static async loader(ctx) { return {pageTitle: '...', data: await fetchPageData(ctx)}; }`

## Layout Override Pattern

Nested layout precedence (highest to lowest):

1. Extension layout at this level
2. Extension layout at parent level (inherited)
3. Host layout at this level
4. Host layout at parent level (inherited)
5. Default layout from core-ui

If no `layout.js` is defined at a level, the extension inherits the host's layout at that level automatically.

```js
// Location: src/extensions/<extension>/pages/<route>/layout.js
import {html} from 'lit';
import {NavLayout} from '@servicenow/aiux/aiux-components-nav';

export default class MyLayoutOverride extends NavLayout {
  render() {
    // Option 1: use host layout as-is — return super.render();
    // Option 2: wrap/customize while keeping structure
    return html`<div class="extension-layout">${super.render()}</div>`;
    // Option 3: fully custom layout — must still render <slot> for the child page
  }

  // Override specific regions instead of the whole layout:
  // _renderSidebar() / _renderToolbar() / _renderHeader() / _renderContent()
}
```

**Example:** host defines `layout.js` at `measure/` (L2) and `measure/value/` (L3). Extension defines `layout.js` only at `measure/` (L2). At `/measure/value`: extension L2 layout applies (most-specific), host L3 layout is inherited (no extension override at that level).

## Continue in This Skill

After scaffolding the extension page/loader/layout, run through the normal pipeline for anything the templates above don't cover:

- **Styling** — `references/design/daisyui-patterns.md`, `references/design/css-custom-properties.md`
- **Accessibility** — invoke `accessibility` companion skill (required — extension pages render real UI and must comply with WCAG 2.2 AA)
- **i18n** — invoke `internationalization` companion skill (required — all page/loader strings must use `i18n.getMessage()`, never hardcoded English)
- **UI discovery** — invoke `ui-discovery` before writing any custom UI inside the extension page

## Key Differences From Standalone Pages

| Aspect | Standalone page (this app) | Extension page |
| --- | --- | --- |
| Location | `pages/<route>/page.js` | `src/extensions/<host>/pages/<route>/page.js` |
| Filename | `page.js` | `page.js` (route from directory path, not filename) |
| Layout | `pages/layout.js` or `application.js` | Nested layout override, most-specific-wins |
| Modifies host code | N/A | Never — overlay only |
| Nav wiring | `application.js` setup() / `pages/layout.js` loader | Host-level chrome via `application.js` `setup(ctx)` |


=== FILE: aiux.json (reference app, adapt names and scope) ===
{
  "name": "My App",
  "basename": "my-app",
  "landing": "/home",
  "development": {
    "token": ""
  },
  "build": {
    "exclude": ["**/*.test.js", "**/test/**", "python/**"]
  }
}


=== FILE: application.js (reference app, adapt names and scope) ===
import {navLayoutContext} from '@servicenow/aiux/aiux-components-nav';
import {i18n} from '@servicenow/aiux/aiux-services';
import {AppTheme} from './theme.js';

export default {
  appTheme: AppTheme,
  applicationLayout: 'aiux-nav-layout',

  setup(ctx) {
    const items = [
      {
        icon: 'home',
        title: i18n.getMessage('My App'),
        action: {type: 'navigate', path: '/home'}
      },
      {
        icon: 'list',
        title: i18n.getMessage('Incidents'),
        action: {type: 'navigate', path: '/incidents'}
      }
    ];

    const activeRoute = ctx.app?.routes?.find(r => r.active);
    const itemsWithActive = items.map(item => ({
      ...item,
      ...(item.action?.path === activeRoute?.route && {active: true})
    }));

    const current = navLayoutContext.get();
    navLayoutContext.set({
      ...current,
      appTitle: i18n.getMessage('My App'),
      features: {
        menus: false,
        logo: true,
        userSession: false,
        notifications: false,
        themeToggle: false,
        densityPicker: false,
        unifiedExperience: false,
        profile: true,
        helpPanel: true
      },
      items: itemsWithActive,
      defaultLogoFull: 'servicenow',
      defaultLogoIcon: 'servicenow'
    });
  },

  teardown() {
    navLayoutContext.set({
      items: [],
      defaultLogoFull: null,
      defaultLogoIcon: null
    });
  }
};


=== FILE: theme.js (reference app, adapt names and scope) ===
export const AppTheme = {
  primary_color: '#032D42',
  neutral_colors: {
    use_hex_value: true,
    hex_value: '#F8F7F4'
  },
  shape: {
    selector_radius: '0.75rem',
    field_radius: '0.5rem',
    boxes_radius: '1rem',
    border_width: '1px'
  }
};


=== FILE: now.config.json (reference app, adapt names and scope) ===
{
  "scope": "x_snc_my_app",
  "scopeId": "<scope id>",
  "name": "My App",
  "metadataDir": "src/plugin-xmls",
  "appOutputDir": "dist-metadata/app",
  "packageSourceCodeOnInstance": true,
  "staticContent": {
    "assets": {
      "./public/**": {
        "publicPath": "[$config.aiux.basename]/public"
      }
    }
  }
}

=== FILE: package.json (trimmed from the reference app) ===
{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "description": "AIUX application: My App",
  "scripts": {
    "build": "now-sdk build",
    "doctor": "aiux doctor",
    "dev": "now-sdk run dev",
    "deploy": "now-sdk install",
    "deploy:reinstall": "now-sdk install --reinstall",
    "lint": "eslint ."
  },
  "dependencies": {
    "@servicenow/aiux": "latest",
    "lit": "^3.2.1"
  },
  "devDependencies": {
    "@babel/eslint-parser": "^7.28.0",
    "@babel/plugin-proposal-decorators": "^7.29.0",
    "@eslint/js": "^9.39.0",
    "@servicenow/agent-pack-aiux": "latest",
    "@servicenow/agent-pack-horizon-design-knowledge": "latest",
    "@servicenow/eslint-plugin-aiux-a11y": "latest",
    "@servicenow/eslint-plugin-aiux-app": "latest",
    "@servicenow/eslint-plugin-aiux-i18n": "latest",
    "@servicenow/eslint-plugin-aiux-ssr": "latest",
    "@servicenow/eslint-plugin-aiux-style": "latest",
    "@servicenow/sdk": "4.12.2",
    "eslint": "^9.0.0",
    "globals": "^16.0.0"
  },
  "engines": {
    "node": ">=24.14.1"
  },
  "pnpm": {
    "onlyBuiltDependencies": [
      "@parcel/watcher",
      "@servicenow/aiux-components-condition-builder",
      "@servicenow/aiux-document-viewer",
      "@swc/core",
      "core-js",
      "isolated-vm",
      "libxmljs2",
      "sn-http-request"
    ]
  }
}

=== FILE: pages/home/page.js (minimal Lux page) ===
import {html, css, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, aiuxFetch} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

@customElement('x-snc-my-app-home-page')
export default class HomePage extends AIUXElement {
  static properties = {data: {state: true}};
  static styles = css`:host { display: block; }`;
  async firstUpdated() {
    if (isServer) return;
    const resp = await aiuxFetch('/api/x_snc_my_app/my_service/data');
    this.data = resp.ok ? (await resp.json()).result : null;
  }
  render() {
    return html`<div class="aiux-card bg-base-100 shadow-sm"><div class="aiux-card-body">
      <h2 class="aiux-card-title">${i18n.getMessage('Hello Lux')}</h2>
      <p>${this.data ? i18n.getMessage('Loaded') : i18n.getMessage('Loading')}</p>
    </div></div>`;
  }
}
