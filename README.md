# Explain Screen

**The design argument, on the design itself.**

Every decision on a screen gets a ring and a number right where it sits. Click one and you get the reasoning: why it was made, what was tried instead, what it costs, and the UI/UX principle behind it. Nobody in the review has to ask "why is this here?" The answer is already on the screen.

**[See it live →](https://explain-screen.web.app)** · **[Try the demo →](https://explain-screen.web.app/templates/demo/)** (press `?` or **Explain**)

---

## The problem

Design reasoning gets lost. It sits in a Figma comment, a slide nobody opens again, or the designer's head. Then the review comes round and the same questions get asked again:

- *Why a side sheet and not a modal?*
- *What did we have before, and why did it change?*
- *Is this 14 px gap on the system, or did someone just eyeball it?*
- *Who decided this, and on what basis?*

Explain Screen keeps the answers next to the pixels they're about, so the design and the reasons for it get reviewed together.

## What a note looks like

Each note is **one decision**, written as a choice, not a description:

> **Status is a dot and a word, never a pill.**
> **Why:** the list is scanned for exceptions; pills compete with the amount column for attention.
> **Instead:** coloured pills, rejected because five pill colours in one column read as noise.
> **Cost:** less glanceable at a distance.
> **Source:** NN/g · Aesthetic and minimalist design. WCAG 1.4.1 (colour is never the only signal).

Opening a topic puts the screen into the state it describes (empty, error, hover, step 3 of a flow) and rings every part it mentions. A focused note draws dashed lines to the parts it depends on.

## Built for how designers actually work

| Job | When | What you get out of it |
|---|---|---|
| **Showcase** | Presenting to the team or a stakeholder | Step through topics with ← →. A deep link (`?xp=3.2`) goes straight into the deck or chat |
| **Decide** | Two versions, or a choice still open | **Compare** swaps versions on the same topic, and each note says what it replaced |
| **Review** | Critiquing your own screen, a teammate's, or the live app | Reviewers press **+ Note**, click a part and type. **Copy as Markdown** gives you the review doc |
| **Redesign** | A new version of a screen people already use | **vs Production** lists what was removed, changed, moved and added, and compares each flow step by step in clicks, typing and modals |
| **Spec** | Handing over to developers | **Inspect** any part down to the atom, audit the screen against the design system, export the decision log |

## Judge, don't just justify

You can find a principle to back almost anything. A tool that only lists reasons *for* a decision proves nothing. So Explain Screen weighs them too:

- **Judged** scores every decision against a *scenario*: who uses the screen, their **pain points**, what stakeholders **decided**, and the principles you **won't trade**. If a decision clashes with a critical principle, it breaks, however many others it cites. Every element also has to earn its place, so the verdict reads **"Can it go?"**
- **Feedback** shows each comment from the last review next to the decisions that answer it, and flags the ones nothing answers yet.
- **Suggestions** puts everything worth changing next in one list, most serious first.

The tool weighs, flags and keeps the record. **It doesn't know your users.** The pains, the direction and the trade-offs come from your research and your stakeholders. The designer still makes the call.

## Expert lenses

- **Against production:** switch every verdict between "since the last review" and "compared with what users have today".
- **Inspect** (`I`): hover any part to see where it sits (screen → section → component → element), its measured size, padding, type, colour, contrast and target size, plus the **system rule** behind each value, or a warning when a value is off the scale. Pin one part and hover another to see the distance between them.
- **Coverage:** a heatmap of which reasons the notes give at each level, a **screen audit** of every text style, gap and colour in use, and the **decision log** exported as Markdown or a spreadsheet.
- **Three sizes:** Full (docked panel), Mini (a floating card you can drag) and Hide. You can judge layout and breakpoints at the screen's real width.

## Grounded in real sources

Notes cite from a checked glossary of about 90 principles, and every URL in it has been opened:
**Nielsen Norman heuristics · Laws of UX · WCAG 2.2 · ARIA Authoring Practices · Material 3 · Fluent 2 · Apple HIG.**
You can add your own design system's guidelines next to them.

## Works on anything with a screen

| Host | How |
|---|---|
| **An HTML prototype** | Two tags and a notes file |
| **An app in code** (React, Vue, Angular, Svelte, Next.js) | Load it in dev builds only. It follows your routes |
| **A live site you can't edit** (QA, staging, production, a competitor) | Injected into one browser tab. Nothing is sent anywhere, and closing the tab removes it |

Here's the HTML version:

```html
<link rel="stylesheet" href="explain.css">
<!-- …your screen… -->
<script src="checkout.xp.js"></script>  <!-- your notes -->
<script src="explain.js"></script>      <!-- the engine -->
```

No build step, no framework and no dependencies. It's one script and one stylesheet, in magenta by default so it never passes for product UI.

## Use it with Claude Code

Explain Screen is a [Claude Code](https://claude.com/claude-code) skill. Claude reads the screen for real (every state, the DOM, measured values), writes the notes level by level, runs a consistency pass, and checks that every ring lands on something:

```bash
git clone https://github.com/suraj-pixels/explain-screen ~/.claude/skills/explain-screen
```

Then, in any project:

> *"Explain this screen."* · *"Walk the team through this."* · *"Compare v1 and v2."* · *"Review this screen and find the issues."* · *"What's different from production?"*

Running `node templates/xp.mjs check <page>` checks every topic and note, and fails when a ring lands on nothing or a principle id doesn't exist.

## What's inside

| File | What it is |
|---|---|
| `templates/explain.js` | The engine: rings, panel, topics, flows, Inspect, audit, findings, drafts |
| `templates/explain.css` | The overlay's styles |
| `templates/xp.mjs` | `check` proves every ring lands; `open` injects Explain into a live app |
| `templates/demo/` | A worked example: fictional expense approvals, v1 and v2, 32 notes |
| `references/hosts.md` | How to wire it into each kind of host |
| `guide.html` | The visual guide, with the demo running inside it |
| `SKILL.md` | The method Claude follows |

## Where it came from

I built it during a real product redesign, where every iteration had to be defended in front of a team. The engine has since run a whole multi-screen project, with hundreds of notes, without changes.

---

Made by [Suraj Padala](https://github.com/suraj-pixels), a product designer. [MIT licensed](LICENSE): use it, fork it, ship it.
