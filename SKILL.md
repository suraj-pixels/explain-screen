---
name: explain-screen
description: Put the design reasoning on the live screen. Every decision is ringed and numbered where it sits, with why it was made, what was considered instead, what it costs, what it relates to, and the UI/UX source it rests on. Use it to showcase a design to a team, to decide between versions, or to review a screen and hand over findings. For experts it also reads the design against what is in production (added, changed, moved, removed, and each flow step for step), inspects any part down to the atom (its place in the whole, measured spec, and the design-system rule behind every size, gap and colour), audits the screen against the system, and exports the decision log. Works in any project: an HTML prototype, an app in code (React, Vue, Angular, plain DOM), or a live site you can't edit (injected through the real browser window). Use when the user says "explain this screen", "add Explain", "walk the team through this", "why is it like this", "justify these decisions", "design rationale", "annotate the design", "present this prototype", "review this screen", "find the issues", "compare v1 and v2", or wants reviewers to mark issues on a screen. Also use before handing over any iteration whose decisions someone else will have to defend.
---

# Explain this screen

**The reasons live on the screen.** A floating **Explain** button (or `?`) opens a side panel of topics. Opening a topic puts the screen in the state it talks about, then rings and numbers every part it names. Each note is one decision: a one-line verdict first, with the why, the alternative, the cost and the sources one click away. A focused note draws dashed lines to the parts it relates to. The team sees the design and its argument together, and nobody has to ask "why is this here?"

**Judge, don't just justify.** Some principle can be found for almost anything, so a note that only gives reasons *for* a decision proves nothing, and Claude, left alone, will justify whatever it made. Three topics turn the notes into judgement:
- **Judged** weighs every decision for a *scenario*: who uses the screen and how (`traits` re-weight the principles), plus three inputs only the designer can bring from research and stakeholders. Claude must not invent them:
  - `pains`, the users' pain points
  - `direction`, what stakeholders decided
  - `critical`, the principles that won't be traded

  A decision that solves a pain (`pain`), follows the direction (`dir`) or answers feedback (`fb`) outweighs one that only cites a principle. A decision in tension (`x`) with a critical principle **breaks**, whatever else it rests on. Every element, group, component and section also pays **the cost of being there**, weighed against the minimalist principle. So one cited principle isn't enough to keep a part, and the verdict becomes **Can it go?** The topic also lists which pains and which direction no decision addresses. Switch between scenarios to see what flips. The designer tunes a scenario with `weights` and a reason, for example when the team's direction overrules what the traits assume.
- **Feedback** records what was said about the last version (`feedback` on the entry: what, by whom, when, on which version). Each decision cites the item it answers (`fb`), so every item shows the decisions that answer it, or is flagged as unanswered.
- **Suggestions** gathers everything worth changing next, from every lens, most serious first: breaks, then unanswered pains and feedback and open issues, then what could go, then ideas.

The designer's role doesn't change. Understand the users and stakeholders, write their pains and direction down, name what can't be compromised, and make the call. The tool weighs, flags and keeps the record; it doesn't know your users. Judge someone else's work, or have a fresh sub-agent judge Claude's with the screen, the scenario and the rules but not the notes. Write `x` honestly: a decision with nothing against it hasn't been weighed.

**Three sizes, so the screen can be judged at its real width:**
- **Full:** the panel is docked and the page makes room for it, so the app renders 380–440 px narrower.
- **Mini** (`M`): a small card that floats over the page and can be dragged. The page gets its real width back, and the rings, notes and Inspect keep working.
- **Hide** (`H`): nothing on screen at all, to judge the design as it is. `H` or `?` brings it back, and Esc closes.
- Judge layout, spacing and breakpoints in Mini or Hide, never in Full.

**Four lenses for experts, on the same notes:**
- **Against** switches every verdict between the last iteration (`v`, `was`) and a **baseline**, usually what is in production (`bv`, `bw`). A **vs Production** topic lists what was removed, changed, moved, added and kept, with production screenshots. Removed things can't be ringed, so they are listed with what replaced them.
- **Inspect** (button or `I`): hover any part to read it, click to pin it.
  - Where it sits in the whole, as a breadcrumb from screen to atom, named by `anatomy` and the notes. Also what it is made of.
  - Its measured size, padding, gap, radius, border, type, colour, fill, contrast and target size. Each value comes with the **system rule** behind it, or a warning when it's off the scale.
  - Every decision written about that part.
  - Pin one part and hover another to see the distance between them.
- **Flows vs before:** a flow topic with `before` shows the same task in the baseline next to the new steps, counted in clicks, typing and modals.
- **Coverage:**
  - a heatmap of which reasons (why, instead, cost, source, baseline, states, access, data) the notes give at each level;
  - a **screen audit** of every text style, gap and colour in use, judged by the rules;
  - the **decision log**, exported as Markdown or for a spreadsheet.

Files in this skill (copy the templates as they are and never fork them per project; configure them instead):
- `templates/explain.js`: the engine. Rings, panel, topics, relations, flows, Findings, Drafts, Principles, deep links, and + Note picking. The note schema is in its header.
- `templates/explain.css`: the overlay's styles. Magenta by default so it never reads as product UI.
- `templates/xp.mjs`: `check` proves every ring lands; `open` injects Explain into an app you can't edit.
- `templates/demo/`: a worked example (fictional expense approvals, v1 and v2, 32 notes). Copy its structure and replace its content.
- `references/hosts.md`: wiring for each kind of host, including a complex one (a multi-screen prototype plus a replayed app).
- `guide.html`: the visual guide for people. It embeds the demo live. Open it to show someone what this is.

## Pick the job

The same notes serve three jobs. Ask which one only if it's unclear, because it changes what you write first.

| Job | When | Write first | In the room | What comes out |
|---|---|---|---|---|
| **Showcase** | Presenting a design to the team or a stakeholder | Anatomy → sections → flows, mostly `keep` / `new` / `change` | The designer steps topics with ← → and notes with ↓; flows set themselves up | Nobody asks "why is this here"; the deep link `?xp=T.N` goes in the deck or chat |
| **Decide** | Two or more versions, or an open choice | The same topic ids in each version's entry, `alt` on every choice, `question` notes for what is still open | **Compare with** swaps versions on the same topic; each note says what it replaced (`was`) | A decision per question, and the losing version kept as an entry with its reasons |
| **Review** | Checking a screen (yours, a teammate's, the live app) | Found in review: `issue` with a `fix`, then `question`, then `propose` | Reviewers press **+ Note**, click the part, and type the finding. Drafts ring at once | **Findings → Copy as Markdown** for the review doc or ticket; **Drafts → Copy as code** to keep them |
| **Redesign** | A new version of a screen people already use | `base` (production), `bv` / `bw` on every note that isn't new, `removed`, and `before` on each flow | **Against: Production**, then the **vs Production** topic, then each flow's before/now | Nobody asks "what's different from what we have?"; **Copy as Markdown** is the changelog |
| **Spec** | Handing a design to experts or developers | `rules` (the type, spacing, colour and radius system, written once), `anatomy`, plus `st`, `a11y` and `data` on the notes that need them | **Inspect** any part; **Coverage → Audit this screen** for what's off the system | The decision log (a spreadsheet), the audit, and the data the design asks the backend for |

## Set up (once per project)

1. **Find the host type** (details and code in `references/hosts.md`):
   - **A: an HTML prototype.** Add two tags and a content file. The entry shows because it's the only one, because of `match` on the URL, or because of a `[data-explain="id"]` element.
   - **B: an app in code.** Load the files in dev only. The entry follows the route (`match`) or the screen root's `data-explain`. `pushState` routers are picked up without extra wiring.
   - **C: a live app you can't edit** (QA, staging, production, a competitor). `node xp.mjs open <url> --inject explain.css,explain.js,<screen>.xp.js --cdp <port>` adds Explain to that one tab of the real signed-in window (the `real-window-verify` skill). Nothing is sent anywhere, and closing the tab removes it.
2. **Copy** `explain.js`, `explain.css` and `xp.mjs` next to the prototype (or into `.auth/` for host C). Content goes in its own file per screen: `<screen>.xp.js`.
3. **Config**, only for what differs from the defaults: `window.EXPLAIN_CONFIG` (reference below). Typical needs: `key(auto)` when the host knows which screen is showing, `show(id)` for Compare, and CSS so the host's own fixed layers make room (`html.xp-open.xp-push .drawer{right:var(--xp-w)}`).
4. **Memory:** save a project memory with where the engine and content live, the host type, the check command, and that every new iteration gets an entry.

## Write the notes

**Read the screen for real first.** Open it, click every state, read the code or the DOM, and measure what matters (sizes, colours, spacing). A note describes what is there, never what you remember or expect.

**Topic order** (this is the order people understand a screen in): **The screen** (anatomy: what's on it, the reading order, the one focal point) → one topic per **section** → **components** that were real choices → **states** (empty, loading, error, long text, no permission, hover and focus) → **flows**, each as step notes → **System** (rules that hold across the product) → **Found in review**. Keep each topic between 3 and 15 notes. Split a topic that grows past that.

**Walk every level and ask its questions.** Each answer that survives becomes a note:

| Level `lv` | Ask |
|---|---|
| `element` | Why this word, size, weight, colour, icon, position? Is it needed at all? What does it look like in every state? |
| `group` | Why are these together? What groups them (space, a border, alignment)? Why this order? |
| `component` | Why this control and not the obvious alternative (segmented or drop-down, switch or checkbox, modal or side sheet)? What's the default, and why? |
| `section` | What job does it do? Why here, why this size, what does it push away? |
| `screen` | What's the one thing to do here? What's the reading order? What was left out? |
| `step` | What does the user see and do at this step? What can go wrong, and how do they recover? |
| `system` | Does it hold everywhere: one meaning per colour, one name per thing, one format per fact, the same element keeping its shape in every state? |

**One note = one decision:**
- `d` (always) is the decision in one line, stated as a choice ("Status is a dot and a word, never a pill"), not a description ("This is the status").
- `w` is why, grounded in the user's task and a source. `alt` names what was rejected and why. It's the field that answers "why not X?" in the room, so write it for every real choice.
- `b` is the honest cost. A decision with no cost usually wasn't a decision. `g` covers what it does well, when that isn't obvious.
- `rel` links the note to the parts it depends on, e.g. `[['#bulk', 'indigo = act']]`. These draw as dashed rings and lines.
- `p` lists principle ids from the engine's glossary (NN/g heuristics, Laws of UX, WCAG 2.2, ARIA APG, Material 3, Fluent 2, HIG). Every URL there has been checked. Cite only ids that exist. For project sources (the product's design system, research), add them with `config.principles` after opening each URL yourself.
- `ref` names a real product that does the same thing. Include it only when you've verified it.
- `fix` (on an issue) or `was` (on a change) says what to do or what it replaced.
- `setup()` is required on step notes and topics that need a state. **Every setup starts from a reset of the demo data**, so a topic always shows the screen as reviewed, whatever was clicked before.
- `q` is the design question the note answers ("How does a manager narrow the list?"). Together, `q`, `alt` and `p` make the question, options and criteria of a design-space analysis.
- `st` lists the note's states (`{ hover:'…', empty:'…' }`), `a11y` covers keyboard, reader and focus, `data` is data the product doesn't have yet (developers need this), and `req` is the requirement it serves.
- `k` on a step note is its kind: `click`, `type`, `modal`, `scroll`, `wait` or `read`. Flow comparisons count by it.
- `x` lists the principles the decision is in tension with, which is the honest side of `p`.
- `pain`, `dir` and `fb` hold the ids of the pain point it solves, the direction it follows and the feedback it answers, as set in the entry's `scenarios` and `feedback`.
- `ev` is evidence beyond principles: research, analytics, a usability test, or what users said. It outweighs a principle.

**Against the baseline (a redesign).** Read the live product first, as captures or screenshots, and write what it had, not what you remember:
- `base: { name, short, dflt, imgs:[[src, caption]], removed:[{ t, d, w, p }] }`. `dflt` is the verdict a note without `bv` gets, usually `added`.
- On every note that isn't new, set `bv` (`changed`, `moved` or `same`) and `bw` (what production had, in one line).
- For each removed part, say what replaced it, or say that nothing did and why. A removal with no reason is a `question`.
- On each flow topic, `before: { steps:[['New ▾', 'click'], ['Notes: a modal', 'modal'], …], note }`: the same task, step for step, as it's done today.
- The per-iteration verdicts (`v`, `was`) stay as they are. The two lenses answer different questions: "what changed since the last review" and "what's different from what people use".

**The system, written once.** `rules` in the entry or the config states the type scale (`'15/600'` or a size alone, `'12.5'`), the spacing scale (`{ v:[4, 8, …], why }`), what each colour means (by hex or token name), and the radii. Inspect and the audit then answer every "why this size, this gap, this colour?" from it, and they flag every value the rules don't cover. That's the consistency pass, measured. Add `anatomy: [[selector, name, level]]` for the parts no note names, so Inspect's breadcrumb reads screen → section → component → element. Set `root` so the audit reads the design rather than the host's chrome.

**Verdicts** (`v`): `keep` (sound, stays) · `kept` (checked, unchanged from the last version) · `existing` (the product already did it; a redesign's baseline) · `new` · `change` (with `was`) · `question` (the team decides) · `propose` (an idea beyond the brief) · `issue` (a problem, with `fix`). The last three feed the **Findings** topic. Findings stay findings until the user picks; never fix them silently in the same pass.

**Consistency pass before handing over.** Check the design, not just the notes. Each failure becomes an `issue`:
- The same element keeps its shape and position in every state (closed, open, hover, selected).
- Each fact lives in one place, in one format. Each colour has one meaning. Each person and thing has one name.
- Visual weight comes from size and contrast. Watch for a single saturated element stealing the eye.
- Everything works from the keyboard, focus stays visible, and targets are at least 24 px. Colour is never the only signal.
- Question every item: is it needed?

## Verify

```
node xp.mjs check <page|url> [--cdp PORT] [WxH]
```
It checks every entry the page can show (with `config.show`, the Compare versions too) and every topic and note. Step notes run their setups in order. It fails when:
- a ring or relation lands on nothing
- a verdict, level, principle id, `bv` or step kind is unknown
- the panel isn't on top
- Inspect or the audit throws
- the page throws

It also prints the baseline counts, how many `anatomy` parts are on screen, and an audit summary. Notes without `d` are counted. Run it once at the end, not after every edit. For layout, look at one or two screenshots (`--only T:N` saves one); read text results over images.

## Hand over

Say it in a few lines:
- the entry: its topics, notes and steps, and the check result
- the findings, grouped (issues first, each with its one-line fix)
- how to open it: the page, then **Explain** or `?`, plus a deep link to the topic that matters most (`?xp=3` or `?xp=3.2`, numbered as in the panel)

If the user will present it, point them at the Findings export and the Compare button. Offer `guide.html` to anyone new to the tool.

## Config reference (`window.EXPLAIN_CONFIG`, all optional)

| Key | Default | Use |
|---|---|---|
| `key(auto)` | `auto()`: an entry's `match` on the URL, then a visible `[data-explain]`, then the only entry | Return an entry id or `null`. Call `auto()` to fall back to the default |
| `show(id)` | none (no Compare button) | Put another entry's screen on (a version switch). Compare then keeps the same topic |
| `push` | `true` | Pads `body` so the panel doesn't cover the screen. `false` lets the panel float over the page |
| `accent` | `#d6246e` | The ring and panel colour. Pick one the product never uses |
| `label` | `Explain` | The button's text |
| `author` | `true` | Shows **+ Note** (picking and drafts). Set `false` for a read-only showcase link |
| `verdicts` | see above | Add or rename: `{ risk: ['Risk', 'bad'] }`. Tones: `ok` `ch` `ex` `q` `pr` `bad` |
| `levels` | element … system | Add or rename levels: `{ state: 'State' }` |
| `principles` | about 90 sources | Add sources: `{ ds_btn: ['Buttons', 'One primary per view', 'Acme DS', 'https://…'] }` |
| `findings` | `['issue', 'question', 'propose']` | Which verdicts the Findings topic collects, in this order |
| `anatomy` | none | `[[selector, name, level]]` names for Inspect, for every entry (entries add their own) |
| `rules` | none | `{ type, space, color, radius }`: the design system Inspect and the audit judge by (entries override per group) |
| `deeplink` | `true` | `false` when the host reads `?xp=` itself (e.g. its own 0-based numbering) |

Entry fields:
- `name`, `short` (the name on the Compare button), `topics`
- `match` (a regex), `flags` (only when these query flags are on)
- `other` / `otherL` (the Compare target and its label)
- `vl` / `fixL` / `wasL` (per-entry label overrides)
- `base` (the baseline, see above), `prevL` (the other lens's name; default: the Compare entry's short name)
- `anatomy`, `rules`, `root` (the selector the audit scans)

If the screen changes without a URL change, `dispatchEvent(new Event('explain:change'))`, or call `__xp.sync()` to follow it at once. Setups can use `XP.wait`, `XP.click`, `XP.go('#/route' | '/path')`, `XP.$` and `XP.$$`.

Scripting: `__xp.measure(sel)`, `__xp.name(sel)` (the breadcrumb), `__xp.audit()`, `__xp.inspect(on)`, `__xp.pin(sel)` and `__xp.lens('base' | 'prev')` return plain data, which is useful for checks and hand-over tables.

## Gotchas (each one was hit for real)

- **A ring on nothing.** The part only exists in a state. Give the note or topic a `setup`. Grey numbers in the panel mean "not on screen right now".
- **Stale state between topics.** One topic's clicks leak into the next unless every setup resets first. Keep a `PRISTINE` copy of the demo data and restore it.
- **The host's fixed layers** (drawers, dialogs, toasts, sticky headers) sit under the panel. Add `html.xp-open.xp-push <layer>{right:var(--xp-w)}` in the host's CSS; don't edit the engine.
- **An app that rewrites `<body>`.** The engine re-mounts itself on the next change. If the app swaps the whole `body` element, dispatch `explain:change` after it.
- **A step that leaves its route.** The panel stays on its entry while a setup runs. Afterwards, a route with no entry closes Explain, so keep flow steps on routes the entry matches.
- **Generated class names** (`css-1x2y`, `sc-…`) break selectors on the next build. + Note skips them and prefers ids and `data-testid`/`data-id`/`name`/`aria-label`. Add `data-testid` to the host when you can.
- **Background tabs get no animation frames.** The engine paints with a timer there, so checks in background tabs still work.
- **Drafts live in the browser that picked them** (localStorage per entry). Tell reviewers to **Copy as code** or **Copy as Markdown** before they close the tab.
- **A deep link has to wait for the app.** `?xp=` waits up to 6 s for the entry to appear. An app that loads slower needs `explain:change` after it renders.
- **Inspect takes the page's clicks.** While it's on, a click pins a part instead of pressing it. Press `Esc` (unpin, then leave) or the Inspect button to hand the page back.
- **Token names come from `:root` / `html` rules in same-origin stylesheets.** A token defined in a cross-origin sheet or inside a media query shows as a bare hex. Contrast is read against background *colours*: text on an image or a gradient gets the colour under it, so check those by eye.
- **The audit reads up to 6,000 parts.** On a big page, set the entry's `root` to the design's own container. That also keeps the host's chrome (a header you didn't design) out of the counts.
- **A baseline screenshot from a signed-in app shows real data.** Keep it where the project keeps its captures, outside the repo if the repo doesn't track them, and link to it with `base.imgs`. A missing image just drops out of the panel.
