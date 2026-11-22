---
name: lux-ref-design
description: "Lux reference: DaisyUI and Tailwind patterns, validation rules, audit and best-practice checklists, debugging guide. Invoke when styling or reviewing Lux UI."
---

# lux-ref-design


=== FILE: references/design/daisyui-patterns.md ===
# DaisyUI Patterns

DaisyUI component patterns for AIUX apps. All classes use the `aiux-` prefix (DaisyUI v5).

**Source of truth:** The project's `@servicenow/aiux` dependency (declared in `package.json`). This metapackage transitively provides the `tailwind.css` with `@source inline()` safelists. Only classes registered there are available at runtime. Always verify against the installed metapackage — do NOT assume availability.

---

## Prefix Convention

All DaisyUI classes in AIUX use the `aiux-` prefix:

```html
<!-- Standard DaisyUI → AIUX prefixed -->
<button class="aiux-btn aiux-btn-primary">Click</button>
<div class="aiux-card aiux-card-border">...</div>
<span class="aiux-badge aiux-badge-success">Active</span>
```

### Safelist Registration

DaisyUI classes must be registered via `@source inline()` in the project's `tailwind.css` to prevent tree-shaking. This file is provided transitively through `@servicenow/aiux` in `package.json`. After `pnpm install`, check the resolved `tailwind.css` in `node_modules` to see which classes are safelisted for the installed version.

---

## Component Reference

The table below reflects the `@servicenow/aiux` metapackage safelist at `components/core/src/styles/tailwind.css`. Verify against the installed version — run the commands in "Verifying Availability" below.

### Buttons & Actions

| Component | Classes                                                                                                        | Notes                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Button    | `aiux-btn aiux-btn-{primary,secondary,ghost,outline,soft,dash,link,neutral,accent,info,success,warning,error}` | Sizes: `xs,sm,md,lg,xl`. Shapes: `wide,block,square,circle` |
| Pill      | `aiux-pill aiux-pill-{active,disabled,primary}`                                                                | Sizes: `xs,sm,md,lg,xl`                                     |
| Link      | `aiux-link aiux-link-{hover,neutral,primary,secondary,accent,info,success,warning,error}`                      | —                                                           |

### Form Controls

| Component  | Classes                                                                                     | Notes                                         |
| ---------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Input      | `aiux-input aiux-input-{ghost,neutral,primary,secondary,accent,info,success,warning,error}` | Sizes: `xs,sm,md,lg`                          |
| Textarea   | `aiux-textarea`                                                                             | Same variant/size pattern as input            |
| Select     | `aiux-select`                                                                               | Same variant/size pattern. Sizes include `xl` |
| File Input | `aiux-file-input`                                                                           | Same variant/size pattern                     |
| Checkbox   | `aiux-checkbox aiux-checkbox-{primary,secondary,accent,neutral,success,warning,info,error}` | Sizes: `xs,sm,md,lg,xl`                       |
| Radio      | `aiux-radio`                                                                                | Same variant/size pattern as checkbox         |
| Toggle     | `aiux-toggle aiux-toggle-{primary,secondary,accent,neutral,success,warning,info,error}`     | Sizes: `xs,sm,md,lg,xl`                       |
| Range      | `aiux-range`                                                                                | Same variant/size pattern                     |
| Label      | `aiux-label`, `aiux-floating-label`                                                         | —                                             |
| Fieldset   | `aiux-fieldset aiux-fieldset-{legend,label}`                                                | —                                             |
| Validator  | `aiux-validator aiux-validator-hint`                                                        | —                                             |
| Rating     | `aiux-rating aiux-rating-{half,hidden}`                                                     | Sizes: `xs,sm,md,lg`                          |

### Data Display

| Component   | Classes                                                                                                   | Notes                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Card        | `aiux-card aiux-card-{border,dash,side}`                                                                  | Parts: `title,body,actions`. Sizes: `xs,sm,md,lg,xl`                                       |
| Card Header | `aiux-card-header aiux-card-header-{title,subtitle}`                                                      | Structured header inside card                                                              |
| Badge       | `aiux-badge aiux-badge-{primary,secondary,accent,neutral,ghost,info,success,warning,error,moderate,high}` | Variants: `outline,dash,soft`. Sizes: `xs,sm,md,lg,xl`                                     |
| Status      | `aiux-status aiux-status-{primary,secondary,accent,info,success,warning,error}`                           | Sizes: `xs,sm,md,lg`                                                                       |
| Table       | `aiux-table aiux-table-{zebra,pin-rows,pin-cols}`                                                         | Sizes: `xs,sm,md,lg,xl`                                                                    |
| List        | `aiux-list aiux-list-{row,col-grow}`                                                                      | —                                                                                          |
| Stats       | `aiux-stats aiux-stats-{horizontal,vertical}`                                                             | Items: `aiux-stat aiux-stat-{title,value,desc,figure,actions}`                             |
| Avatar      | `aiux-avatar aiux-avatar-{group,online,offline,placeholder,available,away,busy}`                          | —                                                                                          |
| Kbd         | `aiux-kbd`                                                                                                | Sizes: `xs,sm,md,lg,xl`                                                                    |
| Countdown   | `aiux-countdown`                                                                                          | —                                                                                          |
| Timeline    | `aiux-timeline aiux-timeline-{horizontal,vertical,compact,snap-icon}`                                     | Parts: `aiux-timeline-{start,middle,end,box}`                                              |
| Steps       | `aiux-steps aiux-steps-{horizontal,vertical}`                                                             | Items: `aiux-step aiux-step-{neutral,primary,secondary,accent,info,success,warning,error}` |

### Feedback & Loading

| Component | Classes                                                                                     | Notes                                                                   |
| --------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Alert     | `aiux-alert aiux-alert-{info,success,warning,error,outline,dash,soft,vertical,horizontal}`  | —                                                                       |
| Loading   | `aiux-loading aiux-loading-{spinner,dots,ring,ball,bars,infinity}`                          | Sizes: `xs,sm,md,lg,xl`                                                 |
| Skeleton  | `aiux-skeleton aiux-skeleton-{text,primary,pulse}`                                          | Extended: `list,title,item,circle,card`. Reveal: `aiux-skeleton-reveal` |
| Progress  | `aiux-progress aiux-progress-{primary,secondary,accent,neutral,info,success,warning,error}` | —                                                                       |
| Tooltip   | `aiux-tooltip aiux-tooltip-{content,top,bottom,left,right,open}`                            | Color variants available                                                |

### Navigation & Layout

| Component   | Classes                                                                                         | Notes                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Dropdown    | `aiux-dropdown aiux-dropdown-{content,start,center,end,top,bottom,left,right,hover,open,close}` | —                                                                             |
| Menu        | `aiux-menu aiux-menu-{title,active,focus,disabled,dropdown,dropdown-show,dropdown-toggle}`      | Sizes: `xs,sm,md,lg`. Directions: `horizontal,vertical`                       |
| Tabs        | `aiux-tabs aiux-tabs-{box,border,lift}`                                                         | Sizes: `xs,sm,md,lg,xl`. Items: `aiux-tab aiux-tab-{active,disabled,content}` |
| Breadcrumbs | `aiux-breadcrumbs`                                                                              | —                                                                             |
| Pagination  | `aiux-pagination`                                                                               | —                                                                             |
| Collapse    | `aiux-collapse aiux-collapse-{title,content,arrow,plus,open,close}`                             | Prefer native `<details>/<summary>`                                           |
| Divider     | `aiux-divider aiux-divider-{vertical,horizontal,start,end}`                                     | Color variants available                                                      |
| Indicator   | `aiux-indicator aiux-indicator-{item,start,center,end,top,middle,bottom}`                       | —                                                                             |
| Join        | `aiux-join aiux-join-{item,vertical,horizontal}`                                                | —                                                                             |
| Carousel    | `aiux-carousel aiux-carousel-{item,start,center,end,vertical}`                                  | Also: `nav-btn`, `indicator`                                                  |
| Stack       | `aiux-stack aiux-stack-{top,end}`                                                               | —                                                                             |

### Overlays

| Component | Classes                                                                               | Notes                                                                                   |
| --------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Modal     | `aiux-modal aiux-modal-{box,action,backdrop,toggle,open,top,middle,bottom,start,end}` | Use native `<dialog>`                                                                   |
| Toast     | `aiux-toast aiux-toast-{top,bottom,middle,start,center,end}`                          | —                                                                                       |
| Chat      | `aiux-chat aiux-chat-{start,end,image,header,footer,bubble}`                          | Bubble colors: `aiux-chat-bubble-{primary,secondary,accent,info,success,warning,error}` |

### Utilities

`aiux-rounded-box`

---

## Verifying Availability

The safelist lives in the installed metapackage at `node_modules/@servicenow/aiux/components/core/src/styles/tailwind.css`. Always verify before using a class:

```bash
# Confirm the file exists
ls node_modules/@servicenow/aiux/components/core/src/styles/tailwind.css

# Search for a specific class
grep "aiux-skeleton" node_modules/@servicenow/aiux/components/core/src/styles/tailwind.css
```

If a class is not safelisted, it will be tree-shaken and silently fail at runtime. Options:

1. Use an alternative that IS safelisted
2. Implement the styles manually in the component's `static styles`
3. Request the platform team add it to the metapackage

---

## Accessibility Requirements Per Component

### Buttons

- Visible focus ring (`:focus-visible`)
- `aria-label` when icon-only
- `aria-disabled="true"` + `pointer-events: none` instead of `disabled` attribute when needed

### Modals

```html
<dialog
  class="aiux-modal"
  aria-modal="true"
  role="dialog"
  aria-labelledby="modal-title"
>
  <div class="aiux-modal-box">
    <h3 id="modal-title">${i18n.getMessage('Confirm Action')}</h3>
    <div class="aiux-modal-action">
      <button class="aiux-btn" @click="${this._close}">
        ${i18n.getMessage('Cancel')}
      </button>
      <button class="aiux-btn aiux-btn-primary" @click="${this._confirm}">
        ${i18n.getMessage('Confirm')}
      </button>
    </div>
  </div>
</dialog>
```

### Toggles

- Always pair with a visible `<label>`
- Use `role="switch"` and `aria-checked`

### Tabs

- `role="tablist"` on container
- `role="tab"` + `aria-selected` on each tab
- `role="tabpanel"` on content

---

## Key Rules

1. **Semantic colors directly** — `bg-primary`, `bg-success`, etc.
2. **DaisyUI components carry their own rounding** — add only classes that change the component's variant or size
3. **Card surfaces** — `bg-base-100 shadow-sm`
4. **Collapse** — native `<details>/<summary>` elements
5. **Tooltips** — tooltip directive from `@servicenow/aiux-directive-tooltip`
6. **Disabled state** — native `disabled` attribute on the element
7. **Skeleton loaders** — `aiux-skeleton` class; for animated variants use `static styles` CSS (see `css-custom-properties.md`)
8. **Modals** — `<dialog>` element
9. **Non-blocking alerts** — `aiux-alert aiux-alert-{info|success|warning|error} aiux-alert-soft`
10. **Status chips** — `aiux-badge aiux-badge-sm aiux-badge-{success|warning|error} aiux-badge-soft`
11. **Async loading in buttons** — add `aiux-loading aiux-loading-spinner aiux-loading-xs` inside the button while `_saving` is true

---

## Card Pattern

```html
<!-- Elevated card -->
<div class="aiux-card bg-base-100 shadow-sm">
  <div class="aiux-card-body p-6">
    <h2 class="aiux-card-title text-base font-medium text-text-primary">
      ${i18n.getMessage('Card Title')}
    </h2>
    <p class="text-sm text-text-tertiary">${this._description}</p>
    <div class="aiux-card-actions justify-end mt-2">
      <button class="aiux-btn aiux-btn-primary aiux-btn-sm">
        ${i18n.getMessage('Action')}
      </button>
    </div>
  </div>
</div>

<!-- Bordered card -->
<div class="aiux-card aiux-card-border bg-base-100">
  <div class="aiux-card-body">...</div>
</div>

<!-- Card wrapping slotted content -->
<div class="aiux-card bg-base-100 shadow-sm">
  <slot></slot>
</div>
```

---

## Badge Pattern

```html
<span class=${classMap({
  'aiux-badge': true,
  'aiux-badge-success': this._status === 'active',
  'aiux-badge-warning': this._status === 'pending',
  'aiux-badge-error': this._status === 'error'
})}>
  ${this._statusLabel}
</span>
```

---

## Dropdown Menu Pattern

```html
<div class="aiux-dropdown aiux-dropdown-end">
  <button tabindex="0" class="aiux-btn aiux-btn-ghost aiux-btn-sm">
    <aiux-icon name="ellipsis-vertical-outline" size="sm"></aiux-icon>
  </button>
  <ul
    tabindex="0"
    class="aiux-dropdown-content aiux-menu p-2 shadow bg-base-100 rounded-box w-52"
  >
    <li><a @click="${this._handleEdit}">${i18n.getMessage('Edit')}</a></li>
    <li><a @click="${this._handleDelete}">${i18n.getMessage('Delete')}</a></li>
  </ul>
</div>
```


=== FILE: references/design/tailwind-reference.md ===
# Tailwind CSS Reference

Utility class categories commonly used in AIUX apps. Prefer Tailwind utilities in templates over `@apply` in `static styles`.

---

## Layout

| Class             | Purpose                       |
| ----------------- | ----------------------------- |
| `flex`            | Flexbox container             |
| `flex-col`        | Column direction              |
| `flex-row`        | Row direction                 |
| `flex-wrap`       | Allow wrapping                |
| `flex-1`          | Grow to fill                  |
| `flex-shrink-0`   | Prevent shrinking             |
| `grid`            | Grid container                |
| `grid-cols-2/3/4` | Grid columns                  |
| `items-center`    | Align items vertically center |
| `items-start/end` | Align to start/end            |
| `justify-center`  | Justify center                |
| `justify-between` | Space between items           |
| `justify-end`     | Justify end                   |

---

## Spacing

| Class                          | Purpose                          |
| ------------------------------ | -------------------------------- |
| `p-1/2/3/4/6/8`                | Padding all sides                |
| `px-*`, `py-*`                 | Horizontal/vertical padding      |
| `pt-*`, `pb-*`, `pl-*`, `pr-*` | Individual side padding          |
| `m-*`                          | Margin (same pattern as padding) |
| `gap-1/2/3/4`                  | Gap between flex/grid children   |
| `space-x-*`, `space-y-*`       | Space between children           |

---

## Typography

| Class                        | Purpose               |
| ---------------------------- | --------------------- |
| `text-xs`                    | 12px                  |
| `text-sm`                    | 14px                  |
| `text-base`                  | 16px                  |
| `text-lg`                    | 18px                  |
| `text-xl`                    | 20px                  |
| `font-normal`                | 400 weight            |
| `font-medium`                | 500 weight            |
| `font-semibold`              | 600 weight            |
| `font-bold`                  | 700 weight            |
| `leading-tight/snug/normal`  | Line height           |
| `tracking-tight/normal/wide` | Letter spacing        |
| `truncate`                   | Ellipsis overflow     |
| `line-clamp-2/3`             | Multi-line truncation |

---

## Sizing

| Class               | Purpose                               |
| ------------------- | ------------------------------------- |
| `w-full`            | 100% width                            |
| `w-1/2`, `w-1/3`    | Fractional widths                     |
| `w-48`, `w-64`      | Fixed widths                          |
| `h-full`            | 100% height                           |
| `h-screen`          | Viewport height                       |
| `min-h-0`           | Reset min-height (important for flex) |
| `max-w-sm/md/lg/xl` | Max width                             |

---

## Borders & Rounding

| Class             | Purpose                              |
| ----------------- | ------------------------------------ |
| `rounded`         | Small border radius                  |
| `rounded-lg`      | Large border radius                  |
| `rounded-full`    | Circular                             |
| `rounded-box`     | DaisyUI box radius token             |
| `border`          | 1px border                           |
| `border-2`        | 2px border                           |
| `border-base-300` | Theme-aware border color             |
| `divide-y`        | Horizontal dividers between children |

---

## Colors (DaisyUI Semantic)

Use DaisyUI semantic color classes. These adapt automatically to light/dark themes.

### Background

| Class                                                | Purpose                                      |
| ---------------------------------------------------- | -------------------------------------------- |
| `bg-base-100`                                        | Card / panel surface                         |
| `bg-base-200`                                        | Page background, hover state, muted sections |
| `bg-base-300`                                        | Input background, skeleton base              |
| `bg-primary`                                         | Primary action / hero sections               |
| `bg-secondary`                                       | Secondary action                             |
| `bg-success` / `bg-error` / `bg-warning` / `bg-info` | Status backgrounds                           |

### Text

| Class                    | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `text-text-primary`      | Default body text, headings, labels         |
| `text-text-secondary`    | Secondary / subdued text                    |
| `text-text-tertiary`     | Hint text, timestamps, captions, muted text |
| `text-primary`           | Brand-color text                            |
| `text-error`             | Error text                                  |
| `text-success`           | Success text                                |
| `text-warning`           | Warning text                                |
| `text-primary-content`   | Text on primary-colored backgrounds         |
| `text-secondary-content` | Text on secondary-colored backgrounds       |

### Border

| Class                             | Purpose              |
| --------------------------------- | -------------------- |
| `border-base-200`                 | Light border         |
| `border-base-300`                 | Standard border      |
| `border-base-content`             | High contrast border |
| `border-error` / `border-success` | Status borders       |

---

## Visibility & Overflow

| Class             | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `hidden`          | Display none                                           |
| `invisible`       | Invisible but takes space                              |
| `overflow-hidden` | Clip overflow                                          |
| `overflow-y-auto` | Vertical scroll (but prefer `<fade-scroll>` for lists) |

---

## Responsive

| Prefix | Breakpoint |
| ------ | ---------- |
| `sm:`  | 640px      |
| `md:`  | 768px      |
| `lg:`  | 1024px     |
| `xl:`  | 1280px     |

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
```

---

## Motion

| Class                           | Purpose                   |
| ------------------------------- | ------------------------- |
| `transition-all`                | Transition all properties |
| `duration-200`                  | 200ms transition          |
| `ease-in-out`                   | Easing function           |
| `motion-reduce:transition-none` | Remove motion for a11y    |


=== FILE: references/quality/validation-rules.md ===
# Validation Rules

Automated assertions to validate AIUX components. Run after every implementation.

---

## Component Structure

| Rule                   | Check                                                   | Severity |
| ---------------------- | ------------------------------------------------------- | -------- |
| Base class             | Class extends `AIUXElement` or `AIUXWidgetElement`      | Error    |
| Custom element tag     | `@customElement('tag-name')` with unique namespaced tag | Error    |
| Export                 | Widget has `export default`                             | Error    |
| Constructor            | `super()` called first                                  | Error    |
| connectedCallback      | `super.connectedCallback()` called                      | Error    |
| disconnectedCallback   | `super.disconnectedCallback()` called                   | Error    |
| Static properties type | Every entry has `type` key                              | Error    |
| State declaration      | Every `this._*` assignment has matching `state: true`   | Error    |
| Property init          | All properties have defaults in constructor             | Warning  |

---

## Widget-Specific

| Rule             | Check                                                  | Severity |
| ---------------- | ------------------------------------------------------ | -------- |
| Discoverable     | `@discoverable(true)` present                          | Error    |
| bestFor          | `@bestFor('...')` with meaningful description          | Error    |
| Name             | `@name('...')` decorator                               | Warning  |
| Description      | `@description('...')` decorator                        | Warning  |
| Server decorator | If server.js exists → `@server('./server.js')` present | Error    |
| Render states    | `render()` handles loading, error, empty, data         | Warning  |
| Widget height    | `:host` has `height: 100%`                             | Warning  |

---

## Server Script

| Rule             | Check                                                                                                 | Severity |
| ---------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Export           | `export default function server(data, _options, input)`                                               | Error    |
| Security         | Using `GlideRecordSecure` (not `GlideRecord`)                                                         | Error    |
| Field selection  | GlideQuery `.select()` used when restricting fetched columns (GlideRecord has no field-selection API) | Warning  |
| Limit            | `setLimit()` called before `query()`                                                                  | Error    |
| Access check     | `canRead()` after `get()`                                                                             | Warning  |
| Error shape      | `data.isError` + `data.errorMessage` includes actual error (`e.message`), not generic string alone    | Error    |
| Input validation | `input.*` has defaults                                                                                | Warning  |
| Server strings   | `gs.getMessage()` for user-facing text                                                                | Warning  |
| Truncation data  | If `setLimit()` is used, server returns `data.hasMore` and `data.totalAvailable` via `GlideAggregate` | Warning  |
| Truncation UI    | Client renders a truncation notice (e.g. "Showing X of Y") when `hasMore` is `true`                   | Warning  |

---

## Page-Level

| Rule                | Check                                                                                            | Severity |
| ------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Document title      | Non-layout pages call `setDocumentTitle(getMessage('...'))` in `firstUpdated()` (WCAG 2.4.2)     | Error    |
| Document title util | `utils/document-title.js` exists, exports `setDocumentTitle`, SSR-safe (`typeof document` guard) | Error    |

---

## Internationalization

| Rule              | Check                                                                                 | Severity |
| ----------------- | ------------------------------------------------------------------------------------- | -------- |
| Client i18n       | All template strings use `i18n.getMessage()`                                          | Error    |
| Server i18n       | User-facing strings use `gs.getMessage()`                                             | Error    |
| No hardcoded text | No English strings in templates                                                       | Error    |
| Import            | `i18n` imported from `@servicenow/aiux-services`                                      | Error    |
| Client catch i18n | Client `catch` blocks assign `i18n.getMessage(...)` to `_error` — not raw `e.message` | Error    |

---

## SSR Safety

| Rule                    | Check                                             | Severity |
| ----------------------- | ------------------------------------------------- | -------- |
| Constructor guard       | No `window`/`document`/`navigator` in constructor | Error    |
| Render guard            | No browser APIs in `render()`                     | Error    |
| Loader guard            | `isServer` check when using browser APIs          | Error    |
| connectedCallback guard | Browser APIs guarded with `!isServer`             | Error    |
| Event handler safe      | No `isServer` needed                              | Info     |

---

## Styling

| Rule                  | Check                                                                                                                | Severity |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| Host display          | `:host { display: block }` (or `contents` for list pages)                                                            | Error    |
| No hardcoded colors   | No hex/rgb/named colors in templates                                                                                 | Warning  |
| CSS custom properties | Colors use `var(--color-*)`                                                                                          | Warning  |
| DaisyUI prefix        | All DaisyUI classes use `aiux-` prefix                                                                               | Warning  |
| Card wrapper          | Widget root is `aiux-card` + `aiux-card-body`, not a raw `<div>`                                                     | Warning  |
| Card background       | Cards use `bg-base-100 shadow-sm`                                                                                    | Info     |
| No inline SVG         | Using `<aiux-icon>`                                                                                                  | Warning  |
| Text overflow         | Dynamic/prop-driven text has `overflow-wrap: break-word; word-break: break-word; max-width: 100%` — legible at 320px | Warning  |

---

## Events

| Rule              | Check                                                                                                          | Severity |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Namespace         | Custom events use `namespace:action` format                                                                    | Warning  |
| Bubbling          | `bubbles: true, composed: true`                                                                                | Error    |
| No self-mutation  | `@property()` values not self-assigned                                                                         | Error    |
| Bound handlers    | Event handlers bound in constructor                                                                            | Warning  |
| No arrow in loops | `.map()` uses data attributes, not arrow closures                                                              | Warning  |
| Action guard      | Event handlers that call `server.get()` use a boolean flag (e.g. `_actioning`) to prevent overlapping requests | Warning  |

---

## Cleanup

| Rule            | Check                                              | Severity |
| --------------- | -------------------------------------------------- | -------- |
| Listeners       | Every `addEventListener` has `removeEventListener` | Error    |
| Observers       | Every observer has `.disconnect()`                 | Error    |
| Timers          | Every `setTimeout`/`setInterval` is cleared        | Error    |
| Record watcher  | Subscription has `.unsubscribe()`                  | Error    |
| Scoped context  | `unprovide(this)` in `disconnectedCallback`        | Error    |
| AbortController | `.abort()` in cleanup                              | Warning  |

---

## Observability

| Rule                             | Check                                           | Severity |
| -------------------------------- | ----------------------------------------------- | -------- |
| No console in backend            | No `console.*` in server files                  | Error    |
| No console.warn/error in browser | New `console.warn`/`console.error` flagged      | Warning  |
| Structured logging               | `createLogger` (server) / `getLogger` (browser) | Info     |

---

## Accessibility

**Invoke the `accessibility` skill now** if any of the following apply to the component or widget being validated:

| Condition                                                        | Invoke `accessibility` skill? |
| ---------------------------------------------------------------- | ----------------------------- |
| Component has buttons, inputs, links, or any clickable element   | Yes — always                  |
| Component renders a modal, dialog, drawer, or overlay            | Yes — always                  |
| Component has tabs, menus, dropdowns, or disclosure patterns     | Yes — always                  |
| Component uses drag-and-drop or resizable panels                 | Yes — always                  |
| Component renders dynamic or async-updated content               | Yes — always                  |
| Component is a layout, page, or navigation shell                 | Yes — always                  |
| Component is purely static display with no interaction           | Yes — reflow and forced-colors still apply |

> There is no case where `accessibility` is skipped. The conditions above are listed to help identify *which reference files* inside the skill to load — not to gate whether the skill is invoked.

After the `accessibility` skill has been applied, run these minimum checks:

| Rule             | Check                                                                                  | Severity |
| ---------------- | -------------------------------------------------------------------------------------- | -------- |
| Keyboard access  | All interactive elements reachable and operable via keyboard                           | Error    |
| ARIA labels      | Icon-only buttons and controls have `aria-label` or `aria-labelledby`                  | Error    |
| Form labels      | Every form input has an associated `<label>` or `aria-label`                           | Error    |
| Live regions     | Async-updated regions have `aria-live="polite"` or `role="status"`                     | Error    |
| Reflow 320px     | No horizontal scroll at 320px viewport width (WCAG 1.4.10)                            | Error    |
| Forced-colors    | Interactive, field, and container components have `@media (forced-colors: active)` CSS | Error    |

---

## Chat Integration

| Rule               | Check                                             | Severity |
| ------------------ | ------------------------------------------------- | -------- |
| Mixin              | Chat widgets use `withWidgetContext(AIUXElement)` | Error    |
| No arrow functions | `client_tools.definition` is regular function     | Error    |
| Context push       | `setAiContext()` called with serializable data    | Warning  |


=== FILE: references/quality/best-practices-checklist.md ===
# Best Practices Checklist

All 48 principles grouped by category. Validate every implementation against this list.

---

## Widget Core (P1–P25)

- [ ] **P1** Extend `AIUXWidgetElement` — never plain `LitElement`
- [ ] **P2** `i18n.getMessage()` for all user-facing text
- [ ] **P3** `state: true` for internal state properties
- [ ] **P4** All properties initialized in `constructor()`
- [ ] **P5** Data fetch in `connectedCallback()` after `super.connectedCallback()`
- [ ] **P6** Cleanup in `disconnectedCallback()` — listeners, watchers, timers
- [ ] **P7** `_renderX()` helper methods for complex templates
- [ ] **P8** `height: 100%` on `:host` and container
- [ ] **P9** CSS custom properties for all colors
- [ ] **P10** Loading, error, empty, data states all handled
- [ ] **P11** `@discoverable(true)` on every widget
- [ ] **P12** `<aiux-icon>` for icons — no inline SVG
- [ ] **P13** Widget heading: `text-sm font-medium text-text-secondary`
- [ ] **P14** `<fade-scroll>` for scrollable lists
- [ ] **P15** `this.trackEvent()` for key user actions
- [ ] **P16** GlideQuery `.select()` used when column restriction is needed (GlideRecord fetches all columns — switch to GlideQuery to restrict)
- [ ] **P17** `setLimit()` on every GlideRecord query
- [ ] **P18** `canRead()`/`canWrite()` after `.get()`
- [ ] **P19** Validate and coerce all `input.*` parameters
- [ ] **P20** Error shape: `data.isError` + `data.errorMessage`
- [ ] **P21** No orphan `data.*` fields — client ↔ server aligned
- [ ] **P22** `gs.getMessage()` for server-side user strings
- [ ] **P23** In-flight request guard (`this._fetching`)
- [ ] **P24** Property `type` in every `static properties` entry
- [ ] **P25** Reactive state triggers re-render — no manual `this.update()`

---

## Lit Patterns (P26–P33)

- [ ] **P26** `classMap` for conditional classes
- [ ] **P27** No `nothing` in attribute positions
- [ ] **P28** No self-mutation of `@property()` values
- [ ] **P29** Namespace-scoped events: `bubbles: true, composed: true`
- [ ] **P30** No anonymous arrow handlers in `.map()` loops
- [ ] **P31** `<details>/<summary>` for collapse — not DaisyUI input hack
- [ ] **P32** Tooltip directive — not `data-tip`
- [ ] **P33** Cards use `bg-base-100 shadow-sm` (elevated) or `bg-base-100 border border-base-300` (bordered)

---

## Performance & Cleanup (P34–P36)

- [ ] **P34** Resource cleanup in `disconnectedCallback` — observers, listeners, timers, AbortControllers
- [ ] **P35** No `await` on fire-and-forget — fire and `.catch()`
- [ ] **P36** `lazyImage` directive for `<img>` elements

---

## Chat Integration (P37–P39)

- [ ] **P37** `withWidgetContext(AIUXElement)` for chat-integrated widgets
- [ ] **P38** `client_tools` definitions use regular functions (not arrows)
- [ ] **P39** `setAiContext()` pushes serializable state to chat

---

## Observability (P40–P41)

- [ ] **P40** `createLogger` (server) / `getLogger` (browser) — no `console.*`
- [ ] **P41** Correct severity: `debug` per-request, `info` lifecycle, `warn` degraded, `error` failures

---

## App-Level (P42–P43)

- [ ] **P42** `display: contents` on list pages
- [ ] **P43** Bind `aiux-list-connected:*` events — not `aiux-list:*`

---

## Accessibility (P44)

- [ ] **P44** `aria-live="polite"` or `role="status"` on regions with polled or async-updated content

---

## Responsive Text (P45)

- [ ] **P45** Dynamic/prop-driven text elements use `class="break-words max-w-full"` — legible at 320px without horizontal overflow

---

## Data Completeness (P46–P47)

- [ ] **P46** Client `catch` blocks assign `i18n.getMessage('...')` to `this._error` — never raw `e.message`
- [ ] **P47** When server uses `setLimit()`, return `data.hasMore` + `data.totalAvailable` via `GlideAggregate`; client renders truncation notice when `hasMore` is `true`

---

## Document Title (P48)

- [ ] **P48** `setDocumentTitle(getMessage('...'))` in `firstUpdated()` on every non-layout page — WCAG 2.4.2; `utils/document-title.js` must exist

---

## Additional Best Practices

### Component

- [ ] `static styles` includes `:host { display: block }`
- [ ] No `...super.properties` spread
- [ ] `@query` only for imperative DOM APIs (`showModal`, `focus`)
- [ ] No imperative DOM manipulation (`classList.add`, `el.style.*`)

### Server Script

- [ ] Action routing via `switch` or `if/else` on `input.action`
- [ ] `GlideRecordSecure` for all queries (not `GlideRecord`)
- [ ] No `getRowCount()` — use `GlideAggregate` for counts
- [ ] `addNotNullQuery('field')` for non-empty filters

### Styling

- [ ] No hardcoded font families
- [ ] Tailwind utility classes in templates, not `@apply` in styles
- [ ] DaisyUI classes with `aiux-` prefix
- [ ] New DaisyUI classes registered in safelist

### SSR

- [ ] `isServer` guard in constructor, render, connectedCallback, willUpdate, loader
- [ ] No guard needed in event handlers, firstUpdated, updated, disconnectedCallback

### Context

- [ ] Global context: `createContext` for app-wide singletons
- [ ] Scoped context: `createScopedContext` for nested layouts
- [ ] `willUpdate` re-provision for scoped context on navigation
- [ ] `unprovide(this)` in `disconnectedCallback`
- [ ] `detailContext.get(this)` — always pass `this` for scoped

### Navigation

- [ ] `navigate()` uses app-relative paths (no basePath)
- [ ] Anchor links use full `basePath`-prefixed href
- [ ] No relative hrefs (`./page`)
- [ ] Sidebar items have correct active state logic

### Motion

- [ ] `@media (prefers-reduced-motion: reduce)` fallback in CSS
- [ ] `motion-reduce:` Tailwind prefix for template transitions


=== FILE: references/quality/debugging-guide.md ===
# Debugging Guide

Structured diagnostics for AIUX widget, app, build, and deploy issues.

---

## Component Issues

- [ ] Extending `AIUXWidgetElement` (not LitElement directly)?
- [ ] `super()` called in constructor?
- [ ] `super.connectedCallback()` called?
- [ ] `super.disconnectedCallback()` called?
- [ ] Properties defined in `static properties`?
- [ ] Component exported from index.js?
- [ ] Event handlers bound in constructor?

---

## Server Script Issues

- [ ] Using `export default function server(data, _options, input) { ... }`?
- [ ] Checking `input.action` correctly?
- [ ] Populating `data` object (not returning)?
- [ ] Using `gs.info()` for debugging?
- [ ] `gr.query()` called after building query?
- [ ] Using `getValue` for text, `getDisplayValue` for references?
- [ ] `setLimit()` present? Use GlideQuery `.select()` if restricting fetched columns.

---

## Data Fetching Issues

- [ ] `this.server.get()` being called?
- [ ] Correct action name in request?
- [ ] Response being logged?
- [ ] Loading state reset in `finally` block?
- [ ] Error caught and displayed?
- [ ] In-flight guard (`this._fetching`) present?

---

## Rendering Issues

- [ ] Using `` html`...` `` template literal?
- [ ] All properties reactive (declared in `static properties`)?
- [ ] Conditional rendering checking correct state?
- [ ] `:host` has `display: block`?
- [ ] Not mutating arrays/objects directly? (use `this.items = [...newItems]`)

---

## Styling Issues

- [ ] `height: 100%` on both `:host` and container?
- [ ] Tailwind classes spelled correctly?
- [ ] Custom CSS in `static styles`?
- [ ] No missing semicolons in CSS?
- [ ] Using CSS custom properties? (`var(--color-text-primary)`, `var(--color-base-100)` — not `white` or `#hex`)
- [ ] `aiux-` prefix on DaisyUI classes?

---

## i18n Issues

- [ ] Importing `i18n` from `@servicenow/aiux-services`?
- [ ] All user-facing strings wrapped in `i18n.getMessage()`?
- [ ] Server-side strings using `gs.getMessage()`?
- [ ] Translation keys registered in `required_translations`?

---

## Cleanup Issues

- [ ] `disconnectedCallback()` implemented?
- [ ] All `addEventListener` calls have matching `removeEventListener`?
- [ ] Record watcher subscriptions unsubscribed?
- [ ] Timers (`setTimeout`/`setInterval`) cleared?
- [ ] Observers disconnected?
- [ ] Scoped contexts unprovided?

---

## Import Issues

- [ ] Relative imports starting with `./`?
- [ ] No circular dependencies?
- [ ] Using correct Lit directive paths? (`lit/directives/unsafe-html.js`)
- [ ] Widget-to-widget using `@servicenow/glide-widgets/` path?

---

## Common Error Fixes

### "SyntaxError: Unexpected token"

Check bundler output for invalid identifiers from relative imports.

### "this.server is undefined"

Not extending `AIUXWidgetElement`. Widgets MUST extend `AIUXWidgetElement`, not `AIUXElement`.

### "this is undefined in client_tools"

Arrow function in `client_tools.definition`. Use regular function.

### Data not loading

1. Add `gs.info()` in server script to trace execution
2. Check browser console for network errors
3. Verify action name matches between client and server
4. Check parameter priority: `input > options > default`

### Component not rendering

1. Check browser console for errors
2. Verify `@customElement` decorator present with unique tag name
3. Ensure `render()` returns `html` template
4. Check all properties initialized in constructor

### Styles not applying

1. Verify CSS is in `` static styles = css`...` `` block
2. Check DaisyUI classes have `aiux-` prefix
3. Ensure `:host` has `display: block`
4. Check CSS custom property fallbacks

### Properties not updating UI

1. Verify property is in `static properties` with `type`
2. Check `state: true` for internal state
3. Don't mutate arrays/objects — reassign: `this.items = [...newItems]`
4. Check `updated(changedProperties)` logic

### Server script returns empty data

1. Check `gs.info()` logs in System Logs
2. Verify GlideRecord table name is correct
3. Confirm `gr.query()` is called
4. Check ACLs — user may not have access
5. Try `GlideRecordSecure` — it silently filters inaccessible records

### Event listeners not firing

1. Handlers bound in constructor?
2. Using `@event` syntax in templates (not `onevent`)?
3. Custom events have `composed: true` to cross shadow DOM?

### Memory leaks

1. `disconnectedCallback()` with `super.disconnectedCallback()`?
2. All `window`/`document` listeners removed?
3. Record watchers unsubscribed?
4. Intervals/timeouts cleared?

### Context stale after navigation

1. `willUpdate` checking `this.loaderData !== this._prevLoaderData`?
2. Re-calling `provide(this, ...)` inside `willUpdate`?
3. `unprovide(this)` in `disconnectedCallback`?

### Build failure

1. Check `pnpm build` output for compilation errors
2. Verify all imports resolve
3. Check `aiux.json` ↔ `package.json` ↔ `now.config.json` alignment
4. Delete `dist/` and rebuild

### Deploy failure

1. Check `.bin/deploy-full` output
2. Clear instance cache
3. Verify scope matches across config files
4. Check role/ACL XML in `fluent/update/`


=== FILE: references/quality/audit-checklist.md ===
# App Health Audit Checklist

10-category audit for AIUX application quality. Each category has pass/warn/fail criteria.

---

## 1. Structure

**Check:** Required files and directory layout.

| Item                               | Pass | Warn                                                   | Fail                                                         |
| ---------------------------------- | ---- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `aiux.json` exists at root         | ✅   | —                                                      | ❌ Missing                                                   |
| `package.json` has `aiux.basename` | ✅   | ⚠️ Missing (valid for widget-only or global-page apps) | ❌ Mismatched with `aiux.json#basename`                      |
| `now.config.json` scope matches    | ✅   | —                                                      | ❌ Scope mismatch                                            |
| `pages/layout.js` exists           | ✅   | —                                                      | ❌ Missing root layout                                       |
| `pages/home/page.js` exists        | ✅   | ⚠️ Different landing page                              | —                                                            |
| `theme.js` at root                 | ✅   | ⚠️ Missing (uses defaults)                             | —                                                            |
| No stray files in root             | ✅   | ⚠️ Unnecessary files                                   | —                                                            |
| Three-way config agreement         | ✅   | —                                                      | ❌ `aiux.json` ↔ `package.json` ↔ `now.config.json` mismatch |

---

## 2. Base Classes

**Check:** All components extend the correct AIUX base class.

| Item                                 | Pass | Warn               | Fail                                     |
| ------------------------------------ | ---- | ------------------ | ---------------------------------------- |
| Pages extend `AIUXElement`           | ✅   | —                  | ❌ Extends `LitElement`                  |
| Root layout extends `NavLayout`      | ✅   | —                  | ❌ Wrong base class                      |
| Widgets extend `AIUXWidgetElement`   | ✅   | —                  | ❌ Extends `LitElement` or `AIUXElement` |
| Chat widgets use `withWidgetContext` | ✅   | ⚠️ Not using mixin | —                                        |
| No direct `LitElement` usage         | ✅   | —                  | ❌ Found `LitElement` import             |

---

## 3. SSR Safety

**Check:** Browser-only APIs are guarded in SSR-executing code paths.

| Item                                    | Pass | Warn | Fail                        |
| --------------------------------------- | ---- | ---- | --------------------------- |
| No `window`/`document` in constructor   | ✅   | —    | ❌ Unguarded                |
| No browser APIs in `render()`           | ✅   | —    | ❌ Unguarded                |
| `isServer` guard in `connectedCallback` | ✅   | —    | ❌ Missing guard            |
| Loaders guard browser-only logic        | ✅   | —    | ❌ Missing `isServer` check |
| `isServer` import from `lit`            | ✅   | —    | ❌ Using `typeof window`    |

---

## 4. Styling

**Check:** Consistent, theme-aware styling.

| Item                                         | Pass | Warn                  | Fail                                              |
| -------------------------------------------- | ---- | --------------------- | ------------------------------------------------- |
| No hardcoded hex/rgb colors                  | ✅   | ⚠️ Found in edge case | ❌ Throughout templates                           |
| CSS custom properties for colors             | ✅   | —                     | ❌ Using raw color values                         |
| `:host { display: block }` on all components | ✅   | —                     | ❌ Missing                                        |
| DaisyUI classes have `aiux-` prefix          | ✅   | ⚠️ Some missing       | ❌ Unprefixed throughout                          |
| Cards use `bg-base-100 shadow-sm`            | ✅   | —                     | ❌ Using `bg-surface-primary` (not in production) |
| No hardcoded font families                   | ✅   | —                     | ❌ Found hardcoded fonts                          |
| No inline styles for spacing                 | ✅   | ⚠️ Few instances      | —                                                 |

---

## 5. Internationalization

**Check:** All user-facing text is externalized.

| Item                                   | Pass | Warn                      | Fail                   |
| -------------------------------------- | ---- | ------------------------- | ---------------------- |
| Client strings use `i18n.getMessage()` | ✅   | —                         | ❌ Hardcoded English   |
| Server strings use `gs.getMessage()`   | ✅   | —                         | ❌ Hardcoded English   |
| `i18n` imported from correct package   | ✅   | —                         | ❌ Wrong import        |
| No English strings in templates        | ✅   | ⚠️ Placeholder text found | ❌ User-facing English |
| Translation keys registered            | ✅   | ⚠️ Some missing           | —                      |

---

## 6. Accessibility

**Check:** WCAG 2.2 AA compliance.

| Item                                      | Pass | Warn            | Fail           |
| ----------------------------------------- | ---- | --------------- | -------------- |
| Interactive elements keyboard-accessible  | ✅   | —               | ❌ Click-only  |
| ARIA labels on icon-only buttons          | ✅   | —               | ❌ Missing     |
| Form inputs have labels                   | ✅   | —               | ❌ Unlabeled   |
| Modals have `aria-modal`, `role="dialog"` | ✅   | —               | ❌ Missing     |
| Focus management on navigation            | ✅   | ⚠️ Partial      | —              |
| Color contrast meets 4.5:1 ratio          | ✅   | ⚠️ Borderline   | ❌ Below ratio |
| `prefers-reduced-motion` fallbacks        | ✅   | ⚠️ Missing some | —              |
| Reflow at 320px — no horizontal scroll (WCAG 1.4.10) | ✅ | ⚠️ Some overflow | ❌ Horizontal scroll at 320px |
| Forced-colors (Windows High Contrast) CSS on all interactive, field, and container components | ✅ | ⚠️ Missing on some | ❌ No forced-colors support |

---

## 7. Performance

**Check:** No performance anti-patterns.

| Item                                       | Pass | Warn                                        | Fail                           |
| ------------------------------------------ | ---- | ------------------------------------------- | ------------------------------ |
| No state mutation in `render()`            | ✅   | —                                           | ❌ Side effects in render      |
| `repeat()` with keys for dynamic lists     | ✅   | ⚠️ Using `.map()` for sorted/filtered lists | —                              |
| No N+1 query patterns in server scripts    | ✅   | —                                           | ❌ Query inside loop           |
| GlideQuery `.select()` for column restriction | ✅   | —                                        | ❌ GlideRecord used where column restriction is needed (it has no field-selection API) |
| `setLimit()` on all queries                | ✅   | —                                           | ❌ Unbounded query             |
| Resource cleanup in `disconnectedCallback` | ✅   | —                                           | ❌ Leaking listeners/observers |
| No `await` on fire-and-forget              | ✅   | ⚠️ Analytics/prefs awaited                  | —                              |
| No `getRowCount()`                         | ✅   | —                                           | ❌ Use `GlideAggregate`        |
| In-flight request guard                    | ✅   | ⚠️ Missing on some methods                  | —                              |
| `lazyImage` for `<img>` elements           | ✅   | ⚠️ Raw `<img>` found                        | —                              |

---

## 8. Security

**Check:** Server-side security patterns.

| Item                                              | Pass | Warn                       | Fail                   |
| ------------------------------------------------- | ---- | -------------------------- | ---------------------- |
| `GlideRecordSecure` (not `GlideRecord`)           | ✅   | —                          | ❌ Using `GlideRecord` |
| `canRead()` after `.get()`                        | ✅   | ⚠️ Missing on some queries | ❌ Never checked       |
| Input validation with defaults                    | ✅   | ⚠️ Partial                 | ❌ Raw input used      |
| Error shape: `data.isError` + `data.errorMessage` | ✅   | —                          | ❌ Empty catch blocks  |
| No PII in `trackEvent()`                          | ✅   | —                          | ❌ PII in analytics    |
| CSRF token used for mutations                     | ✅   | —                          | ❌ Missing             |

---

## 9. Observability

**Check:** Structured logging, no raw console usage.

| Item                                      | Pass | Warn                      | Fail                            |
| ----------------------------------------- | ---- | ------------------------- | ------------------------------- |
| No `console.*` in server-side code        | ✅   | —                         | ❌ `console.log` in loaders/API |
| No new `console.warn/error` in components | ✅   | ⚠️ New instance found     | —                               |
| `createLogger` in backend modules         | ✅   | ⚠️ Missing in some        | —                               |
| `getLogger` in browser components         | ✅   | ⚠️ Missing in some        | —                               |
| Correct severity levels                   | ✅   | ⚠️ `info` for per-request | —                               |
| Catch blocks log errors                   | ✅   | ⚠️ Silent catches         | ❌ Empty catch                  |

---

## 10. Chat Integration

**Check:** Widget-chat communication patterns (when applicable).

| Item                                             | Pass | Warn                        | Fail                         |
| ------------------------------------------------ | ---- | --------------------------- | ---------------------------- |
| `withWidgetContext` mixin used                   | ✅   | —                           | ❌ Direct `__AIEX_GLOBALS__` |
| `client_tools.definition` regular function       | ✅   | —                           | ❌ Arrow function            |
| `setAiContext()` with serializable data          | ✅   | ⚠️ Not calling setAiContext | —                            |
| `static aiContext` has `description` + `bestFor` | ✅   | ⚠️ Missing                  | —                            |

---

## Audit Output Format

```
=== AIUX App Health Audit ===
App: my-app (x_snc_my_app)

1. Structure:     ✅ PASS (8/8)
2. Base Classes:  ✅ PASS (5/5)
3. SSR Safety:    ⚠️ WARN (4/5 — 1 unguarded connectedCallback)
4. Styling:       ✅ PASS (7/7)
5. i18n:          ❌ FAIL (3/5 — 2 hardcoded English strings)
6. Accessibility:  ⚠️ WARN (5/7 — missing aria-label on 2 icon buttons)
7. Performance:   ✅ PASS (10/10)
8. Security:      ✅ PASS (6/6)
9. Observability: ⚠️ WARN (4/6 — console.log in api/incidents.js)
10. Chat:         N/A (no chat widgets)

Overall: 7 PASS / 3 WARN / 1 FAIL
Priority fixes: i18n (2 strings), a11y (2 labels), observability (1 file)
```
