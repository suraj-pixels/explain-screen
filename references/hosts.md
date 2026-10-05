# Wiring Explain into a host

The engine never changes per project. A host gives it three things:
1. **Which entry is on screen:** `match`, `data-explain` or `config.key`.
2. **How to reach a state:** setups.
3. **Room for the panel:** CSS for the host's own fixed layers.

## A · An HTML prototype

```html
<link rel="stylesheet" href="explain.css">
…the screen…
<script src="approvals.xp.js"></script>   <!-- the notes: window.EXPLAIN['approvals'] = {…} -->
<script src="explain.js"></script>        <!-- order doesn't matter; the engine reads EXPLAIN lazily -->
```
- **One screen per page:** nothing else is needed, because the only entry shows.
- **Several screens in one page (hash router):** give each entry a `match`, e.g. `match: '^#/checkout'`. Hash changes are followed.
- **Screens switched by JS without a URL change:** `EXPLAIN_CONFIG.key = () => currentScreenId`, and `dispatchEvent(new Event('explain:change'))` after each switch.
- **Versions of the same screen (Decide):** give each version its own entry with the same topic ids, set `other` on each, and `EXPLAIN_CONFIG.show = id => switchTo(id)`. The demo does exactly this with `body.v1`.
- **A `mainline-prototype` prototype:** hide Explain in present/blind links with `EXPLAIN_CONFIG.author = false` if reviewers shouldn't add notes. Add `#xpBtn` to `real-window-verify`'s `config.hide` so it stays out of screenshots.

Setups call the prototype's own functions (`DEMO.reset()`, `DEMO.open('c1')`). Expose a small object like the demo's `window.DEMO` for this. It's more reliable than clicking.

## B · An app in code (React, Vue, Angular, Svelte, server-rendered)

Load Explain in **dev builds only**, as plain scripts. It touches nothing but `window.EXPLAIN*`, `window.XP`, `window.__xp` and its own three nodes at the end of `<body>`.
```js
// Vite / webpack entry, dev only
if (import.meta.env.DEV) {
  import('./explain/explain.css');
  import('./explain/checkout.xp.js').then(() => import('./explain/explain.js'));
}
```
- **Next.js:** put the files in `public/explain/` and render `<Script src="/explain/explain.js" />` (plus the content file and a `<link>` for the CSS) only when `process.env.NODE_ENV === 'development'`.
- **Angular:** add them to a dev configuration's `scripts` / `styles` in `angular.json`.

Which entry: tag each screen's root, `<main data-explain="checkout">`, or give entries a `match` on the route (`'/orders/\\d+'`). `pushState` and `popstate` are picked up. So are root changes, through a MutationObserver.

Setups:
- Prefer the app's own dev hooks, e.g. a `window.__dev.setState(…)` the team already has.
- Otherwise drive the real UI: `await XP.go('/orders/42'); await XP.click('[data-testid=refund]')`.
- Seed data through a mock (MSW, fixtures) so every setup starts from the same state.

Selectors: `data-testid` survives refactors; generated class names don't.

## C · A live app you can't edit (QA, staging, production, a competitor's site)

Use the `real-window-verify` window, which is already signed in:
```
node .auth/xp.mjs open https://qa.example.com/app/orders --inject .auth/explain.css,.auth/explain.js,.auth/orders.xp.js --cdp 9224 --xp 1
```
The injected scripts run in every page load of **that tab only**, in the top frame. The process stays attached until the tab closes. `check` takes the same `--inject`.

Setups can only **navigate and click**. There is no data to reset, so:
- Setups go to a route and open the state (`XP.go`, `XP.click`). They never press anything that saves, sends, approves or deletes. On shared QA data a setup that "just approves one" changes someone else's test.
- Write selectors against what is stable in that app (ids, `aria-label`, `name`, `data-*`), and re-run `check` after each of the app's releases.
- Use this host for **Review** (findings on what's live) and for a **redesign baseline** (`existing` notes that a new version's `was` fields point back to).

## D · A complex host: a multi-screen prototype plus a replayed app

For example, a store's checkout redesign. `index.html` holds every version of the screen and shows one at a time through `showVersion(id)`. `replay/index.html` is a copy of the live store, with idea flags in the query and routes in the hash. Keep `explain.js` verbatim and put the wiring in a marked `HOST` block after it. To update the engine, replace everything above the block.
```js
(() => {
const REPLAY = !!window.REPLAY;                                    // set by replay/index.html
document.documentElement.classList.toggle('xp-app', REPLAY);       // the host CSS below keys off it
window.EXPLAIN_CONFIG = Object.assign({
  verdicts: { live: ['Live today', 'ex'] },                        // the team's own word for "existing"
  key: auto => REPLAY ? auto()
                      : (EXPLAIN[window.currentVersion] ? window.currentVersion : null),
  show: REPLAY ? undefined : id => showVersion(id),                // Compare switches versions in index.html
}, window.EXPLAIN_CONFIG);
/* follow a version switch at once */
if (!REPLAY){ const _s = showVersion; showVersion = id => { _s(id); __xp.sync(); }; }
})();
```
```css
html.xp-open.xp-push .cart-drawer, html.xp-open.xp-push .site-footer{ right:var(--xp-w)!important; width:auto!important }
html.xp-open .dialog{ left:calc(50% - var(--xp-w) / 2) }          /* centred dialogs centre in the room left of the panel */
```
In the replay, entries carry `match: '^#/checkout/\\d+'` and `flags: ['oneclick']`. The default `auto()` picks them, and topics that need an idea flag that is off show a "Turn it on ›" link (`topic.flag`).
