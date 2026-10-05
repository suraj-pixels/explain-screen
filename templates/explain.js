/* ═══ EXPLAIN — the design decisions, drawn on the live screen ═══════════════
   From the explain-screen skill. Copy this file and explain.css into a project as they
   are; configure with window.EXPLAIN_CONFIG, never by editing this file per project.

   The Explain button (or ?) opens a panel of topics. A topic puts the screen in the state
   it talks about and rings every part it names with a number. A focused note draws dashed
   rings and lines to the parts it relates to. Auto topics at the end: Drafts (notes picked
   on the screen with + Note, copy as code), Findings (issues, questions, proposals, copy as
   Markdown) and Principles (every source the notes cite).
   Keys: ← → topics · ↑ ↓ notes · Enter opens a note · Esc closes · ? toggles · I inspects ·
         M switches the panel between Full (docked; the page makes room) and Mini (a card over the page,
         which keeps its real width) · H hides everything, to judge the screen as it is, and brings it back.
   Links: ?xp=3 opens topic 3, ?xp=3.2 its note 2 (numbered as in the panel).

   Two lenses on the same notes. "Against" switches every verdict between the last version
   (v, was) and the baseline (bv, bw) — usually what is in production today. A "vs <baseline>"
   topic lists what was removed, changed, moved, added and kept. Inspect (I) reads any part:
   where it sits in the whole (named from anatomy + the notes), what it is made of, its
   measured spec, and the design-system rule behind each value, flagged when off the scale.
   Coverage shows which reasons the notes give at each level, audits the screen's type,
   spacing and colour, and exports the decision log.

   Content  window.EXPLAIN[id] = { name, short?, topics, match?, flags?, other?, otherL?, vl?, fixL?, wasL?,
                                   base?, prevL?, anatomy?, rules?, root? }
     other   another entry to Compare with (needs config.show); short names it on the button
     match   regex on the hash, or on path + query + hash; the entry shows when it fits.
             No match: config.key(), a visible [data-explain="id"] element, or the only entry.
     base    { name, short?, dflt?, imgs?:[[src, caption]], removed?:[{ t, d, w?, p?, img? }] }
             the baseline the screen is measured against; dflt is the bv of a note that has none
     prevL   the other lens's name (default: the Compare entry's short name, or "last version")
     anatomy [[selector, name, level?]]  names parts for Inspect's breadcrumb (notes name the rest)
     rules   see config.rules, per entry        root  selector the screen audit scans (default body)
     scenarios [{ id, name, who, task?, traits:[TRAITS keys], weights?:{ pid:[factor, 'why'] },
                  pains?:[{ id, t }], direction?:[{ id, t }], critical?:[pid] }]
             who uses the screen and how, what hurts them, what stakeholders decided, what can't be traded;
             the Judged topic weighs every decision for one, and lists what flips between them
     feedback [{ id, t, by, date, on? }]  what was said about the last version; notes cite it with fb
     note pain / dir / fb  [ids] the pain point it solves, the direction it follows, the feedback it answers
     note ev  evidence beyond principles: research, analytics, a test, what users said
     topic   { id, name, intro?, setup?(), flag?, before?, notes }
     before  { name?, steps:[ 'text' | ['text', kind] ], note? }  the same flow in the baseline;
             kind: click · type · modal · wait · read · scroll (step notes carry theirs in k)
     note    { s   selector (null = a note with no ring)   t  title   v  verdict   lv  level
               d   the decision, one line (always)          w  why
               q   the design question it answers           alt what was considered instead, and why not
               g   what it does well   b  what it costs     req  the requirement it serves
               st  its states ('text' or { hover:'…', empty:'…' })   a11y  keyboard / reader / focus
               data  data it needs that the product doesn't have yet
               rel [[selector, label], …]  drawn when the note is focused
               p   [principle ids]   fix / was   ref  a real product that does the same (verified)
               bv  against the baseline: added · changed · moved · same     bw  what the baseline had
               x   [principle ids the decision is in tension with]: weighed against p in the Judged topic
               setup()  puts the screen in this note's state (a flow step)   k  the step's kind
               all  ring every match (max 16)   text  only matches whose text fits this regex }
   Config   window.EXPLAIN_CONFIG = { key?(auto), show?(id), push?, accent?, label?, author?,
              verdicts?, levels?, principles?, findings?, anatomy?, rules?, deeplink? }   (SKILL.md has the reference)
     rules   { type:{ '15/600':'why', '12.5':'why' }, space:{ v:[4, 8, …], why }, color:{ '#5353ef' | '--primary':'meaning' },
               radius:{ '8':'why' } }  — the system, written once; Inspect and the audit judge every value by it
   The screen changed without a URL change: dispatchEvent(new Event('explain:change')). */
(() => {
if (window.__xp) return;                                        // loaded twice (an injected copy on a page that has one)
const CFG = () => window.EXPLAIN_CONFIG || {};
const EXP = () => window.EXPLAIN || (window.EXPLAIN = {});
const has = f => new RegExp('[?&]' + f + '\\b').test(location.search);
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const strip = s => String(s || '').replace(/<[^>]+>/g, '');
const ls = { get(k){ try { return localStorage.getItem(k); } catch { return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch {} } };
const ss = { get(k){ try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v){ try { sessionStorage.setItem(k, v); } catch {} } };   // per tab: a new tab opens Full
const today = (d = new Date()) => `${d.getDate()} ${'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[d.getMonth()]} ${d.getFullYear()}`;

/* ── the sources a note can cite · [name, what it says, source, url] — every url checked 29 Sep 2026 ── */
const NG = 'https://www.nngroup.com/articles/', LX = 'https://lawsofux.com/', W3 = 'https://www.w3.org/WAI/WCAG22/Understanding/';
const P0 = {
  status:      ['Visibility of system status', 'Keep people told what is going on, with feedback in reasonable time.', 'NN/g · heuristic 1', NG + 'visibility-system-status/'],
  match:       ['Match the real world', 'Speak the users’ language — their words, concepts and order, not the system’s.', 'NN/g · heuristic 2', NG + 'match-system-real-world/'],
  control:     ['User control and freedom', 'A clearly marked way out — cancel, undo, back — without a long detour.', 'NN/g · heuristic 3', NG + 'user-control-and-freedom/'],
  consistency: ['Consistency and standards', 'The same word, look and action mean the same thing everywhere — in the product and in the products people already use.', 'NN/g · heuristic 4', NG + 'consistency-and-standards/'],
  prevent:     ['Error prevention', 'Better than a good error message: a design that stops the slip — constraints, good defaults, a check before commit.', 'NN/g · heuristic 5', NG + 'slips/'],
  recognition: ['Recognition rather than recall', 'Show the options and the facts needed to choose; don’t make people remember them from elsewhere.', 'NN/g · heuristic 6', NG + 'recognition-and-recall/'],
  efficiency:  ['Flexibility and efficiency of use', 'Accelerators for frequent users that novices never have to see.', 'NN/g · heuristic 7', NG + 'flexibility-efficiency-heuristic/'],
  minimalist:  ['Aesthetic and minimalist design', 'Every extra piece of information competes with the relevant ones and dims them.', 'NN/g · heuristic 8', NG + 'aesthetic-minimalist-design/'],
  recover:     ['Help recognise and recover from errors', 'Say what went wrong in plain words, and offer the fix.', 'NN/g · heuristic 9', NG + 'error-message-guidelines/'],
  heuristics:  ['The 10 usability heuristics', 'Nielsen’s ten broad rules for interaction design.', 'NN/g', NG + 'ten-usability-heuristics/'],
  disclosure:  ['Progressive disclosure', 'Show the few things most people need; move the rest one step away.', 'NN/g', NG + 'progressive-disclosure/'],
  defaults:    ['The power of defaults', 'Most people keep the default, so it is a design decision: make it the likely right answer.', 'NN/g', NG + 'the-power-of-defaults/'],
  modal:       ['Modal vs non-modal', 'A modal blocks the page; use it only when the work can’t go on without it.', 'NN/g', NG + 'modal-nonmodal-dialog/'],
  hierarchy:   ['Visual hierarchy', 'Size, weight, colour and position tell the eye what to read first.', 'NN/g', NG + 'visual-hierarchy-ux-definition/'],
  visual:      ['Principles of visual design', 'Scale, hierarchy, balance, contrast and grouping make one clear focal point.', 'NN/g', NG + 'principles-visual-design/'],
  scent:       ['Information scent', 'Labels and cues tell people what they will find before they click.', 'NN/g', NG + 'information-scent/'],
  dateinput:   ['Date input', 'Pickers suit nearby dates, typing suits known ones; show the format and the limits.', 'NN/g', NG + 'date-input/'],
  direct:      ['Direct manipulation', 'Act on the object itself — drag, resize, click it — with visible feedback at once.', 'NN/g', NG + 'direct-manipulation/'],
  checkradio:  ['Checkboxes vs radio buttons', 'Checkboxes for independent choices; radios (or a segmented control) for one of a set.', 'NN/g', NG + 'checkboxes-vs-radio-buttons/'],
  dropdown:    ['Drop-down menus', 'Good for many options in little space; few options should just be visible.', 'NN/g', NG + 'drop-down-menus/'],
  listbox:     ['Listbox vs drop-down', 'Few options: show them all. Many: a drop-down, with search when long.', 'NN/g', NG + 'listbox-dropdown/'],
  tooltip:     ['Tooltips', 'Brief, supplementary help — never the only home of essential information.', 'NN/g', NG + 'tooltip-guidelines/'],
  empty:       ['Empty states', 'An empty area says why it is empty and what to do next.', 'NN/g', NG + 'empty-state-interface-design/'],
  confirm:     ['Confirmation dialogs', 'Confirm only what is destructive or can’t be undone; routine confirms get clicked through.', 'NN/g', NG + 'confirmation-dialog/'],
  icons:       ['Icon usability', 'Few icons are universally understood; pair them with a text label.', 'NN/g', NG + 'icon-usability/'],
  signifiers:  ['Signifiers of clickability', 'A visible cue that something can be clicked.', 'NN/g', NG + 'clickable-elements/'],
  placeholders:['Placeholders are not labels', 'Placeholder text vanishes on typing and is low-contrast; keep a real label.', 'NN/g', NG + 'form-design-placeholders/'],
  proximity:   ['Proximity', 'Things near each other read as one group; space separates groups.', 'NN/g · Gestalt', NG + 'gestalt-proximity/'],
  similarity:  ['Similarity', 'Things that look alike read as the same kind and do the same job.', 'NN/g · Gestalt', NG + 'gestalt-similarity/'],
  region:      ['Common region', 'A shared border or background makes its contents one group.', 'NN/g · Gestalt', NG + 'common-region/'],
  connected:   ['Uniform connectedness', 'Elements joined by a line or a shared frame read as related.', 'Laws of UX', LX + 'law-of-uniform-connectedness/'],
  fitts:       ['Fitts’s law', 'The time to hit a target depends on its size and distance: big and near is fast.', 'NN/g', NG + 'fitts-law/'],
  chunking:    ['Chunking', 'Break information into small meaningful groups so it can be scanned and held.', 'NN/g', NG + 'chunking/'],
  scanning:    ['Scanning patterns', 'People scan the left edge and the first words of lines; put the distinguishing words first.', 'NN/g', NG + 'f-shaped-pattern-reading-web-content/'],
  toggle:      ['Toggle switch guidelines', 'A switch acts at once; for a choice applied on Save, use radios or a segmented control.', 'NN/g', NG + 'toggle-switch-guidelines/'],
  formerrors:  ['Errors in forms', 'Show the error next to the field, in plain words, and keep what was typed.', 'NN/g', NG + 'errors-forms-design-guidelines/'],
  forms:       ['Web form design', 'Ask only what is needed, in a logical order, with a clear label on every field.', 'NN/g', NG + 'web-form-design/'],
  mentalmodel: ['Mental models', 'People expect a product to work like the ones they already use and like their idea of the task.', 'NN/g', NG + 'mental-models/'],
  cogload:     ['Minimise cognitive load', 'Cut clutter, build on existing mental models, and let the system do the reading, remembering and working-out.', 'NN/g', NG + 'minimize-cognitive-load/'],
  copy:        ['UI copy', 'Short, specific, front-loaded words that say what will happen.', 'NN/g', NG + 'ui-copy/'],
  indicators:  ['Indicators, validations, notifications', 'Match the message to the moment: an indicator on the thing, validation at the field, a notification for events elsewhere.', 'NN/g', NG + 'indicators-validations-notifications/'],
  accordion:   ['Accordions', 'Collapse to show the structure at a glance; open only what is needed.', 'NN/g', NG + 'accordions-complex-content/'],
  filters:     ['Filters', 'Filters narrow a set; show which are on and how many results remain.', 'NN/g', NG + 'applying-filters/'],
  facets:      ['Filter categories and values', 'Group filter values under clear categories the user thinks in.', 'NN/g', NG + 'filter-categories-values/'],
  response:    ['Response times', '0.1 s feels instant, 1 s keeps the flow of thought, 10 s loses attention.', 'NN/g', NG + 'response-times-3-important-limits/'],
  hick:        ['Hick’s law', 'More choices, longer decisions — cut or group them.', 'Laws of UX', LX + 'hicks-law/'],
  jakob:       ['Jakob’s law', 'People spend most of their time in other products and expect yours to work the same way.', 'Laws of UX', LX + 'jakobs-law/'],
  miller:      ['Miller’s law', 'Working memory holds a handful of items; chunk longer lists.', 'Laws of UX', LX + 'millers-law/'],
  tesler:      ['Tesler’s law', 'Some complexity can’t be removed — only moved; the question is whether the system or the user carries it.', 'Laws of UX', LX + 'teslers-law/'],
  doherty:     ['Doherty threshold', 'Feedback within ~400 ms keeps people engaged.', 'Laws of UX', LX + 'doherty-threshold/'],
  restorff:    ['Von Restorff effect', 'The one thing that differs is the one noticed — spend it on what matters.', 'Laws of UX', LX + 'von-restorff-effect/'],
  serial:      ['Serial position effect', 'The first and last items of a series are remembered best.', 'Laws of UX', LX + 'serial-position-effect/'],
  goal:        ['Goal-gradient effect', 'People speed up as the goal gets near; show the progress.', 'Laws of UX', LX + 'goal-gradient-effect/'],
  aesthetic:   ['Aesthetic-usability effect', 'Polished designs feel easier to use — small flaws are forgiven, until they add up.', 'Laws of UX', LX + 'aesthetic-usability-effect/'],
  peakend:     ['Peak-end rule', 'An experience is judged by its peak and its end.', 'Laws of UX', LX + 'peak-end-rule/'],
  postel:      ['Postel’s law', 'Accept input liberally (formats, pasted lists), send output strictly.', 'Laws of UX', LX + 'postels-law/'],
  zeigarnik:   ['Zeigarnik effect', 'Unfinished tasks stay on the mind; show what is still pending.', 'Laws of UX', LX + 'zeigarnik-effect/'],
  choice:      ['Choice overload', 'Too many options stall a decision; recommend one.', 'Laws of UX', LX + 'choice-overload/'],
  attention:   ['Selective attention', 'People filter out whatever looks like noise — including real content that looks like it.', 'Laws of UX', LX + 'selective-attention/'],
  occam:       ['Occam’s razor', 'Of two designs that work, the one with fewer parts wins.', 'Laws of UX', LX + 'occams-razor/'],
  pareto:      ['Pareto principle', 'Most use comes from a few features; design the common case first.', 'Laws of UX', LX + 'pareto-principle/'],
  w_color:     ['WCAG 1.4.1 Use of colour', 'Colour is never the only way information is shown.', 'W3C · WCAG 2.2', W3 + 'use-of-color.html'],
  w_contrast:  ['WCAG 1.4.3 Contrast', 'Text 4.5:1 against its background (3:1 for large text).', 'W3C · WCAG 2.2', W3 + 'contrast-minimum.html'],
  w_ntcontrast:['WCAG 1.4.11 Non-text contrast', 'Controls, their states and meaningful graphics at 3:1.', 'W3C · WCAG 2.2', W3 + 'non-text-contrast.html'],
  w_target:    ['WCAG 2.5.8 Target size', 'Pointer targets at least 24 × 24 px, or spaced so a 24 px circle fits.', 'W3C · WCAG 2.2', W3 + 'target-size-minimum.html'],
  w_pointer:   ['WCAG 2.5.2 Pointer cancellation', 'Actions fire on release, so a press can be abandoned by sliding off.', 'W3C · WCAG 2.2', W3 + 'pointer-cancellation.html'],
  w_focus:     ['WCAG 2.4.7 Focus visible', 'Keyboard focus is always visible.', 'W3C · WCAG 2.2', W3 + 'focus-visible.html'],
  w_obscured:  ['WCAG 2.4.11 Focus not obscured', 'The focused control is never fully hidden behind sticky bars or overlays.', 'W3C · WCAG 2.2', W3 + 'focus-not-obscured-minimum.html'],
  w_timing:    ['WCAG 2.2.1 Timing adjustable', 'A time limit can be turned off, adjusted or extended.', 'W3C · WCAG 2.2', W3 + 'timing-adjustable.html'],
  w_structure: ['WCAG 1.3.1 Info and relationships', 'Structure shown visually — groups, labels, headings — is in the markup too.', 'W3C · WCAG 2.2', W3 + 'info-and-relationships.html'],
  w_keyboard:  ['WCAG 2.1.1 Keyboard', 'Everything works from the keyboard.', 'W3C · WCAG 2.2', W3 + 'keyboard.html'],
  w_labels:    ['WCAG 3.3.2 Labels or instructions', 'Every input has a label or instructions.', 'W3C · WCAG 2.2', W3 + 'labels-or-instructions.html'],
  w_errid:     ['WCAG 3.3.1 Error identification', 'Errors are identified and described in text.', 'W3C · WCAG 2.2', W3 + 'error-identification.html'],
  w_errsug:    ['WCAG 3.3.3 Error suggestion', 'When the fix is known, suggest it.', 'W3C · WCAG 2.2', W3 + 'error-suggestion.html'],
  w_hover:     ['WCAG 1.4.13 Content on hover or focus', 'Hover content can be dismissed, can itself be hovered, and stays until dismissed.', 'W3C · WCAG 2.2', W3 + 'content-on-hover-or-focus.html'],
  w_nrv:       ['WCAG 4.1.2 Name, role, value', 'Custom controls tell assistive tech their name, role and state.', 'W3C · WCAG 2.2', W3 + 'name-role-value.html'],
  w_consid:    ['WCAG 3.2.4 Consistent identification', 'Things that do the same job are labelled the same way.', 'W3C · WCAG 2.2', W3 + 'consistent-identification.html'],
  w_consnav:   ['WCAG 3.2.3 Consistent navigation', 'Repeated navigation stays in the same place and order.', 'W3C · WCAG 2.2', W3 + 'consistent-navigation.html'],
  w_order:     ['WCAG 2.4.3 Focus order', 'Focus moves in an order that keeps the meaning.', 'W3C · WCAG 2.2', W3 + 'focus-order.html'],
  w_drag:      ['WCAG 2.5.7 Dragging movements', 'Anything done by dragging can also be done with single clicks.', 'W3C · WCAG 2.2', W3 + 'dragging-movements.html'],
  w_statusmsg: ['WCAG 4.1.3 Status messages', 'Status changes are announced without moving focus.', 'W3C · WCAG 2.2', W3 + 'status-messages.html'],
  w_oninput:   ['WCAG 3.2.2 On input', 'Changing a setting doesn’t cause an unexpected change of context.', 'W3C · WCAG 2.2', W3 + 'on-input.html'],
  aria_dialog: ['WAI-ARIA · Modal dialog', 'Focus moves into the dialog, stays inside it, and goes back where it came from on close.', 'W3C · ARIA APG', 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/'],
  m3chips:     ['Material 3 · Chips', 'Compact actions or choices tied to the content they sit with.', 'Google · Material 3', 'https://m3.material.io/components/chips/overview'],
  m3seg:       ['Material 3 · Segmented buttons', 'Pick one of 2–5 options, all visible at once.', 'Google · Material 3', 'https://m3.material.io/components/segmented-buttons/overview'],
  m3side:      ['Material 3 · Side sheets', 'Supporting content beside the main view, which stays in context.', 'Google · Material 3', 'https://m3.material.io/components/side-sheets/overview'],
  m3dialog:    ['Material 3 · Dialogs', 'Interrupt only for a task that needs a decision; keep it short.', 'Google · Material 3', 'https://m3.material.io/components/dialogs/overview'],
  fluent:      ['Fluent 2', 'Microsoft’s design system — the look Outlook and Teams users already know.', 'Microsoft · Fluent 2', 'https://fluent2.microsoft.design/'],
  hig_modal:   ['Apple HIG · Modality', 'Use a modal only when there is a clear benefit; keep modal tasks short.', 'Apple · HIG', 'https://developer.apple.com/design/human-interface-guidelines/modality']
};
/* verdict → [label, tone]; tones: ok · ch (changed/new) · ex (as built) · q · pr · bad */
const VL0 = { keep:['Keep', 'ok'], kept:['Kept', 'ok'], existing:['Existing', 'ex'], new:['New', 'ch'], change:['Changed', 'ch'],
  question:['Open question', 'q'], propose:['Proposal', 'pr'], issue:['Issue', 'bad'] };
const LV0 = { element:'Element', group:'Group', component:'Component', section:'Section', screen:'Screen', step:'Step', system:'System' };
/* against the baseline: what happened to each part · [label, tone] */
const BV = { removed:['Removed', 'rem'], changed:['Changed', 'chg'], moved:['Moved', 'mov'], added:['Added', 'add'], same:['Same', 'ex'] };
/* ── Judge: a principle weighs more or less depending on who uses the screen and how. A scenario names its traits;
   each trait scales the principles it bears on. A decision is weighed by what it rests on (p) against what it is
   in tension with (x). Accessibility (w_…, aria_…) is a floor: a scenario can raise it, never trade it down.
   ponytail: fixed multipliers, not a model of the users; the scenario's own `weights` (with a reason) tune them. ── */
const TRAITS = {
  expert:        ['They know the product and work in it for hours', { efficiency:1.5, jakob:1.2, recognition:0.9, disclosure:0.8, minimalist:0.8, hick:0.8, copy:0.9 }],
  novice:        ['They are new to it, or come back to it rarely', { recognition:1.5, disclosure:1.3, copy:1.3, empty:1.3, defaults:1.3, signifiers:1.3, scent:1.3, efficiency:0.7 }],
  daily:         ['The task repeats many times a day', { efficiency:1.4, fitts:1.2, response:1.2, confirm:1.3, defaults:1.2, doherty:1.2 }],
  occasional:    ['The task comes up now and then', { recognition:1.3, copy:1.2, efficiency:0.8 }],
  desktop:       ['Mouse, keyboard and a large screen', { w_keyboard:1.2, tooltip:0.9, fitts:0.9 }],
  touch:         ['Fingers on a small screen', { fitts:1.5, w_target:1.5, direct:1.2, tooltip:0.5, w_hover:1.3 }],
  'high-stakes': ['A slip costs money, time or trust', { prevent:1.5, control:1.3, recover:1.3, status:1.3, confirm:0.8, efficiency:0.9 }],
  'low-stakes':  ['A slip is cheap and easy to undo', { prevent:0.8, confirm:1.2, efficiency:1.2 }],
  familiar:      ['They already use a version of this product', { consistency:1.5, mentalmodel:1.4, jakob:1.1 }],
  dense:         ['Much has to be read and compared at once', { scanning:1.3, chunking:1.3, hierarchy:1.2, minimalist:0.8 }]
};
/* Anything on screen costs attention, so a part has to earn its place: each element, group, component and section is
   weighed against the minimalist principle unless the note already names it. One principle alone doesn't outweigh it.
   Principles are the cheapest reason there is; a requirement, a real product and evidence each add weight. */
const EXIST = ['element', 'group', 'component', 'section'];
const PSEUDO = { _req:'Serves the requirement', _ref:'A real product does it', _ev:'Evidence: research, data or feedback', _exist:'The cost of being there' };
const pname = (k, label) => label || (L.P[k] ? L.P[k][0] : PSEUDO[k] || k);
const JV = { breaks:['Breaks a critical principle', 'bad', 'It is in tension with a principle this scenario won’t trade. Change it: nothing else it rests on outweighs that.'],
  remove:['Can it go?', 'bad', 'Nothing but a principle or two says it must be there, and being there costs attention. Remove it, or say what it is needed for.'],
  contested:['Contested', 'bad', 'What it is in tension with weighs as much as what it rests on, for these people.'],
  weak:['Weak here', 'chg', 'Everything it rests on counts for less with these people.'],
  'one-sided':['One-sided', 'q', 'Only reasons for it: no alternative, no cost, nothing against. It may be a justification written after the fact.'],
  unsourced:['No source', 'q', 'No principle for it or against it, so it can’t be weighed.'],
  sound:['Sound', 'ok', 'Its reasons outweigh its tensions here, and what it gives up is written down.'] };
const KIND = { click:['click', 'clicks'], type:['typing', 'typing'], modal:['modal', 'modals'], scroll:['scroll', 'scrolls'], wait:['wait', 'waits'], read:['read', 'reads'] };
const L = { P:P0, VL:VL0, LV:LV0 };
const lists = () => { const c = CFG(); L.P = { ...P0, ...c.principles }; L.VL = { ...VL0, ...c.verdicts }; L.LV = { ...LV0, ...c.levels }; return L; };
const FV = () => CFG().findings || ['issue', 'question', 'propose'];
const fmt = v => String(Math.round(v * 2) / 2);                       // px to the nearest half: 12.5, 16
const blName = e => e.base && (e.base.short || e.base.name);
const prevName = e => e.prevL || (e.other && EXP()[e.other] && (EXP()[e.other].short || EXP()[e.other].name)) || 'last version';
const bvOf = (e, n) => n.bv || (e.base && e.base.dflt) || 'added';
const isDesign = n => !FV().includes(n.v) && n.lv !== 'step' && !n.setup;   // an element's decision, not a finding or a flow step

/* ── which entry is on screen ── */
const vis = el => el.getClientRects().length && !el.closest('#xp, #xpRings, #xpToast');
function key(){
  const c = CFG(), E = EXP();
  if (!c.key) return auto();
  const k = c.key(auto); return k && E[k] ? k : null;        // config.key(auto): decide, or hand back to the default
}
function auto(){
  const E = EXP(), url = location.pathname + location.search + location.hash;
  for (const [id, e] of Object.entries(E)) if (e.match){ const re = new RegExp(e.match);
    if ((re.test(location.hash) || re.test(url)) && (!e.flags || e.flags.some(has))) return id; }
  const root = [...document.querySelectorAll('[data-explain]')].find(vis), r = root && root.dataset.explain;
  if (r && E[r]) return r;
  const ids = Object.keys(E).filter(id => !E[id].match);
  return ids.length === 1 ? ids[0] : null;
}
const count = e => e.topics.reduce((a, t) => a + t.notes.length, 0);

/* ── the overlay ── */
let btn, pane, rings;
const X = { on:false, id:null, ti:0, act:null, hov:null, tok:0, busy:0, full: ls.get('xp:full') === '1', pick:false, ph:null, form:null, dc:null, copy:null,
  lens: ls.get('xp:lens') || 'base', insp:false, ih:null, ip:null, cr:[], hl:null, aud:null,
  size: ss.get('xp:size') === 'mini' ? 'mini' : 'full', prev:'full', sci:0, pos: (() => { try { return JSON.parse(ss.get('xp:pos')); } catch { return null; } })() };
const ex = () => EXP()[X.id];
const onBase = () => !!(ex() && ex().base) && X.lens !== 'prev';
const mount = () => { if (!pane.isConnected) document.body.append(btn, pane, rings); };   // an app that rewrites <body> drops them

/* drafts: notes picked on the screen, kept in this browser per entry */
const dkey = () => 'xp:drafts:' + X.id;
function drafts(){
  if (X.dc && X.dc.id === X.id) return X.dc.list;
  let list = []; try { list = JSON.parse(ls.get(dkey()) || '[]'); } catch {}
  X.dc = { id:X.id, list }; return list;
}
const saveDrafts = list => { X.dc = { id:X.id, list }; ls.set(dkey(), JSON.stringify(list)); };
const restoreTo = tid => () => { const t = ex().topics.find(t => t.id === tid); return t && t.setup && t.setup(); };
/* the entry's topics, then Drafts; Findings and Principles are built from these */
function base(){
  const d = drafts(), T = [...ex().topics];
  if (d.length) T.push({ id:'_d', name:'Drafts', auto:'d', notes: d.map(n => ({ ...n, _restore: n.in && restoreTo(n.in) })),
    intro:'Notes picked on the screen with <b>+ Note</b>. They live in this browser only — <b>Copy as code</b> and paste them into the entry (or hand them to Claude) to keep them.' });
  return T;
}
function findings(){
  const F = FV(), out = [];
  base().forEach((t, ti) => t.notes.forEach((n, i) => { if (F.includes(n.v)) out.push({ ti, i, n, tn:t.name }); }));
  return out.sort((a, b) => F.indexOf(a.n.v) - F.indexOf(b.n.v));
}
function cites(){
  const m = {};
  base().forEach((t, ti) => t.notes.forEach((n, i) => [...(n.p || []), ...(n.x || [])].forEach(k => { if (L.P[k]) (m[k] = m[k] || []).push({ ti, i, t:n.t }); })));
  return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
}
const scenarios = e => (e && e.scenarios) || CFG().scenarios || [];
const scene = e => { const S = scenarios(e); return S[Math.min(X.sci || 0, S.length - 1)]; };
function weigh(sc){
  const W = {}, why = {};
  const add = (k, f, r) => { W[k] = (W[k] || 1) * f; (why[k] = why[k] || []).push(r); };
  (sc.traits || []).forEach(t => TRAITS[t] && Object.entries(TRAITS[t][1]).forEach(([k, f]) => add(k, f, t)));
  Object.entries(sc.weights || {}).forEach(([k, v]) => { const [f, r] = Array.isArray(v) ? v : [v]; add(k, f, r || 'set for this scenario'); });
  (sc.critical || []).forEach(k => { if ((W[k] || 1) < 1) W[k] = 1; });   // a critical principle is never traded down either
  Object.keys(W).forEach(k => { if (/^(w_|aria_)/.test(k) && W[k] < 1) W[k] = 1; });
  return { w: k => Math.round((W[k] || 1) * 100) / 100, why, W, sc };
}
/* What the designer brings, and Claude must not make up: the users' pain points and the stakeholders' direction
   (scenario.pains, scenario.direction), and the principles that can't be traded (scenario.critical). A decision that
   solves a pain (note.pain) or follows the direction (note.dir) outweighs one that only cites a principle. One in
   tension with a critical principle breaks, whatever else it rests on. */
const PAIN = 2, DIR = 1.5;
function judgeNote(n, J, e = ex()){
  const sc = J.sc || {}, byId = (L, id) => (L || []).find(x => x.id === id);
  const f = (n.p || []).filter(k => L.P[k]).map(k => [k, J.w(k)]), a = (n.x || []).filter(k => L.P[k]).map(k => [k, J.w(k)]);
  const told = a.length;                                         // tensions the author named, before the cost of being there
  (n.pain || []).forEach(id => { const p = byId(sc.pains, id); if (p) f.push(['pain:' + id, PAIN, 'Pain: ' + strip(p.t)]); });
  (n.dir || []).forEach(id => { const d = byId(sc.direction, id); if (d) f.push(['dir:' + id, DIR, 'Direction: ' + strip(d.t)]); });
  (n.fb || []).forEach(id => { const d = byId(e && e.feedback, id); if (d) f.push(['fb:' + id, PAIN, 'Feedback: ' + strip(d.t)]); });   // what reviewers said outweighs a principle
  if (n.req) f.push(['_req', 1]); if (n.ref) f.push(['_ref', 1]); if (n.ev) f.push(['_ev', 1.5]);
  if (EXIST.includes(n.lv) && ![...(n.x || []), ...(n.p || [])].some(k => k === 'minimalist' || k === 'occam')) a.push(['_exist', J.w('minimalist')]);   // a decision to show less isn't charged for being there
  const F = f.reduce((s, [, w]) => s + w, 0), A = a.reduce((s, [, w]) => s + w, 0);
  const breaks = (n.x || []).filter(k => (sc.critical || []).includes(k));
  const k = breaks.length ? 'breaks' : !f.length && !told ? (a.length ? 'remove' : 'unsourced') : A >= F ? (told ? 'contested' : 'remove')
    : f.every(([, w]) => w < 1) ? 'weak' : !(n.alt || n.b || told) ? 'one-sided' : 'sound';
  return { k, F:Math.round(F * 100) / 100, A:Math.round(A * 100) / 100, f, a, breaks };
}
function judged(e, sc){
  const J = weigh(sc), rows = [];
  e.topics.forEach((t, ti) => t.notes.forEach((n, i) => { if (!FV().includes(n.v)) rows.push({ ti, i, n, tn:t.name, j:judgeNote(n, J, e) }); }));
  return { J, rows };
}
function tops(){
  const T = base(), e = ex();
  if (e.base) T.push({ id:'_b', name:'vs ' + blName(e), auto:'b', notes:[] });
  if ((e.feedback || []).length) T.push({ id:'_k', name:'Feedback', auto:'k', notes:[] });
  if (scenarios(e).length) T.push({ id:'_j', name:'Judged', auto:'j', notes:[] });
  if (scenarios(e).length || (e.feedback || []).length || findings().length) T.push({ id:'_s', name:'Suggestions', auto:'s', notes:[] });
  if (findings().length) T.push({ id:'_f', name:'Findings', auto:'f', notes:[] });
  T.push({ id:'_c', name:'Coverage', auto:'c', notes:[] });
  if (cites().length) T.push({ id:'_p', name:'Principles', auto:'p', notes:[] });
  return T;
}
/* every design note, set against the baseline */
function delta(){
  const e = ex(), rows = [];
  e.topics.forEach((t, ti) => t.notes.forEach((n, i) => { if (isDesign(n)) rows.push({ ti, i, n, tn:t.name, k:bvOf(e, n) }); }));
  return rows;
}
const autoN = x => x.auto === 'p' ? cites().length : x.auto === 'f' ? findings().length
  : x.auto === 'j' ? judged(ex(), scene(ex())).rows.filter(r => ['breaks', 'remove', 'contested', 'weak'].includes(r.j.k)).length
  : x.auto === 'k' ? (ex().feedback || []).length : x.auto === 's' ? suggestions(ex()).length
  : x.auto === 'b' ? delta().filter(r => r.k !== 'same').length + ((ex().base.removed || []).length) : x.auto === 'c' ? '' : x.notes.length;
const topic = () => tops()[X.ti];

const all = s => { try { return [...document.querySelectorAll(s)].filter(vis); } catch { return []; } };
function targets(n){
  if (!n || !n.s) return [];
  let els = all(n.s);
  if (n.text) els = els.filter(e => n.text.test(e.textContent));
  return n.all ? els.slice(0, 16) : els.slice(0, 1);
}
const relsOf = n => !n || !n.rel ? [] : typeof n.rel[0] === 'string' ? [n.rel] : n.rel;
const link = (ti, i) => { const u = new URL(location.href); u.searchParams.set('xp', ti + 1 + (i != null ? '.' + (i + 1) : '')); return u.href; };
function refreshBtn(){
  if (!document.body) return;
  mount(); lists();
  const e = EXP()[key()], hide = !e || X.on;
  if (btn.hidden !== hide) btn.hidden = hide;                  // only on change: the observer below would see every write
  if (e){ const s = `${e.topics.length} topics · ${count(e)} notes`, sm = btn.querySelector('small'); if (sm.textContent !== s) sm.textContent = s; }
}

const psHTML = p => { const ps = (p || []).filter(k => L.P[k]);
  return ps.length ? `<p class="xp__ps">${ps.map(k => `<a class="xp__p" href="${L.P[k][3]}" target="_blank" rel="noopener" title="${esc(L.P[k][1])} — ${esc(L.P[k][2])}">${L.P[k][0]}</a>`).join('')}</p>` : ''; };
const stText = st => typeof st === 'string' ? st : Object.entries(st).map(([k, v]) => `<b>${esc(k)}</b> ${v}`).join(' · ');
const xsHTML = x => { const xs = (x || []).filter(k => L.P[k]);
  return xs.length ? `<p class="xp__ps xp__ps--x"><span>Against</span>${xs.map(k => `<a class="xp__p xp__p--x" href="${L.P[k][3]}" target="_blank" rel="noopener" title="${esc(L.P[k][1])} — ${esc(L.P[k][2])}">${L.P[k][0]}</a>`).join('')}</p>` : ''; };
const bal = j => `${j.f.length ? `<b>For</b> ${j.f.map(([k, w, l]) => `${esc(pname(k, l))} ×${w}`).join(' · ')}` : ''}${j.a.length ? `${j.f.length ? '<br>' : ''}<b>Against</b> ${j.a.map(([k, w, l]) => `${esc(pname(k, l))}${j.breaks.includes(k) ? ' (critical)' : ''} ×${w}`).join(' · ')}` : ''}`;
const jchip = k => `<span class="xp__v xp__v--${JV[k][1]}" title="${esc(JV[k][2])}">${JV[k][0]}</span>`;
/* the chip a note shows: its verdict, or — on the baseline lens — what happened to it since the baseline */
function chip(e, n){
  if (onBase() && !FV().includes(n.v)){ if (n.lv === 'step' || n.setup) return ''; const b = BV[bvOf(e, n)] || BV.added; return `<span class="xp__v xp__v--${b[1]}">${b[0]}</span>`; }
  const v = L.VL[n.v] || L.VL.keep; return `<span class="xp__v xp__v--${v[1]}">${(e.vl && e.vl[n.v]) || v[0]}</span>`;
}
function noteHTML(e, n, i, ti){
  const rels = relsOf(n), draft = topic().auto === 'd';
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${v}</dd>` : '';
  const dl = [row('Question', n.q), row('Instead of', n.alt), row('Works', n.g), row('Costs', n.b), row('Serves', n.req), row('States', n.st && stText(n.st)),
    row('Access', n.a11y), row('Data', n.data), row('Evidence', n.ev), row('Relates', rels.map(r => r[1]).join(' · ')),
    row('Answers', (n.fb || []).map(id => (e.feedback || []).find(f => f.id === id)).filter(Boolean)
      .map(f => `“${f.t}” <span class="xp__src">${esc([f.by, f.date].filter(Boolean).join(' · '))}</span>`).join('<br>'))].join('');
  const was = onBase() ? n.bw && `<p class="xp__was"><b>In ${blName(e)}</b>${n.bw}</p>` : n.was && `<p class="xp__was"><b>${e.wasL || 'Was'}</b>${n.was}</p>`;
  const sc = scene(e), j = sc && !FV().includes(n.v) && judgeNote(n, weigh(sc), e);
  const jud = j && `<p class="xp__jd">${jchip(j.k)} <span class="xp__src">for ${esc(strip(sc.name))}</span>${j.f.length || j.a.length ? `<br>${bal(j)}` : ''}</p>`;
  const more = [n.w && `<p>${n.w}</p>`, dl && `<dl>${dl}</dl>`, n.fix && `<p class="xp__fix"><b>${e.fixL || 'Fix'}</b>${n.fix}</p>`, was, psHTML(n.p), xsHTML(n.x), jud,
    n.ref && `<p class="xp__ref">Like: ${n.ref}</p>`,
    draft && n.s && `<p class="xp__ref"><code>${esc(n.s)}</code></p>`].filter(Boolean).join('');
  return `<li class="xp__note${n.s ? '' : ' xp__note--none'}${n.setup ? ' xp__note--step' : ''}${X.act === i ? ' is-on' : ''}" data-xp="note" data-i="${i}" tabindex="0">
    <span class="xp__n">${i + 1}</span><div>
    <div class="xp__t">${n.t}${chip(e, n)}
      <span class="xp__na">${draft ? `<button data-xp="del" data-i="${i}" title="Delete this draft" aria-label="Delete this draft">✕</button>` : `<button data-xp="link" data-ti="${ti}" data-i="${i}" title="Copy a link to this note" aria-label="Copy a link to this note">#</button>`}</span></div>
    ${n.d ? `<p class="xp__d">${n.lv ? `<i>${L.LV[n.lv] || n.lv}</i>` : ''}${n.d}</p>` : ''}
    ${more ? `<div class="xp__more"${n.d ? ' data-brief' : ''}>${more}</div>` : ''}
    <p class="xp__miss" hidden>Not on screen right now</p></div></li>`;
}
function principlesHTML(){
  return `<p class="xp__intro">Every source the notes on this screen rest on, most cited first. Click a note to jump to it; click a name for the source.</p><ol class="xp__list">${cites().map(([k, refs]) => `<li class="xp__pl">
    <div class="xp__t"><a class="xp__p" href="${L.P[k][3]}" target="_blank" rel="noopener">${L.P[k][0]}</a><span class="xp__cnt">${refs.length}</span></div>
    <p>${L.P[k][1]} <span class="xp__src">${L.P[k][2]}</span></p>
    <p class="xp__uses">${refs.map(r => `<button data-xp="jump" data-ti="${r.ti}" data-i="${r.i}">${esc(strip(r.t))}</button>`).join('')}</p></li>`).join('')}</ol>`;
}
function findingsHTML(e){
  const F = findings();
  return `<p class="xp__intro">What isn’t settled on this screen — from every topic${drafts().length ? ' and your drafts' : ''}. Click one to see it on the screen; copy the list into the review doc or a ticket.</p>
    <p class="xp__acts"><button data-xp="md">Copy as Markdown</button></p>
    ${FV().map(v => { const g = F.filter(f => f.n.v === v); return g.length ? `<h3 class="xp__h">${(L.VL[v] || [v])[0]}<span>${g.length}</span></h3><ol class="xp__list">${g.map(f => `<li class="xp__fi" data-xp="jump" data-ti="${f.ti}" data-i="${f.i}" tabindex="0">
      <div class="xp__t">${f.n.t}</div>${f.n.d ? `<p class="xp__d">${f.n.d}</p>` : ''}${f.n.fix ? `<p class="xp__fix"><b>${e.fixL || 'Fix'}</b>${f.n.fix}</p>` : ''}
      <p class="xp__src">${esc(strip(f.tn))} · note ${f.i + 1}</p></li>`).join('')}</ol>` : ''; }).join('')}`;
}
/* ── vs the baseline: what was removed, changed, moved, added and kept ── */
function deltaHTML(e){
  const b = e.base, R = delta(), nm = blName(e), rem = b.removed || [];
  const n = k => k === 'removed' ? rem.length : R.filter(r => r.k === k).length;
  const item = r => `<li class="xp__fi" data-xp="jump" data-ti="${r.ti}" data-i="${r.i}" tabindex="0"><div class="xp__t">${r.n.t}</div>
    ${r.n.d ? `<p class="xp__d">${r.n.lv ? `<i>${L.LV[r.n.lv] || r.n.lv}</i>` : ''}${r.n.d}</p>` : ''}${r.n.bw ? `<p class="xp__was"><b>In ${nm}</b>${r.n.bw}</p>` : ''}
    ${r.n.data ? `<p class="xp__ref"><b>Data</b> ${r.n.data}</p>` : ''}<p class="xp__src">${esc(strip(r.tn))} · note ${r.i + 1}</p></li>`;
  const gone = x => `<li class="xp__fi xp__fi--gone"><div class="xp__t">${x.t}</div>${x.d ? `<p class="xp__d">${x.d}</p>` : ''}${x.w ? `<p>${x.w}</p>` : ''}
    ${x.img ? `<img class="xp__shot" src="${esc(x.img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}${psHTML(x.p)}</li>`;
  const grp = (k, items, open) => items.length ? `<details class="xp__grp"${open ? ' open' : ''}><summary><span class="xp__v xp__v--${BV[k][1]}">${BV[k][0]}</span><span>${items.length}</span></summary><ol class="xp__list">${items.join('')}</ol></details>` : '';
  const by = k => R.filter(r => r.k === k).map(item);
  const shots = (b.imgs || []).map(([src, cap]) => `<figure class="xp__base"><a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="${esc(strip(cap || nm))}" loading="lazy" onerror="this.closest('figure').remove()"></a>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`).join('');
  return `<p class="xp__intro">This screen against <b>${b.name}</b>, part by part. What was removed can’t be ringed, so it is listed with what took its place. <b>Against</b> above reads every note this way.</p>
    <p class="xp__sum">${Object.keys(BV).map(k => `<span class="xp__v xp__v--${BV[k][1]}">${BV[k][0]} ${n(k)}</span>`).join('')}</p>
    ${shots ? `<div class="xp__shots">${shots}</div>` : ''}<p class="xp__acts"><button data-xp="bmd">Copy as Markdown</button></p>
    ${grp('removed', rem.map(gone), true)}${grp('changed', by('changed'), true)}${grp('moved', by('moved'), true)}${grp('added', by('added'))}${grp('same', by('same'))}`;
}
function deltaMD(){
  const e = ex(), R = delta(), nm = blName(e), rem = e.base.removed || [], out = [`## ${strip(e.name)} · against ${strip(e.base.name)}`, `_exported ${today()}_`];
  if (rem.length){ out.push('', `### Removed (${rem.length})`); rem.forEach(x => out.push(`- **${strip(x.t)}**${x.d ? ' — ' + strip(x.d) : ''}`)); }
  ['changed', 'moved', 'added', 'same'].forEach(k => { const g = R.filter(r => r.k === k); if (!g.length) return;
    out.push('', `### ${BV[k][0]} (${g.length})`);
    g.forEach(r => { out.push(`- **${strip(r.n.t)}**${r.n.d ? ' — ' + strip(r.n.d) : ''}`);
      if (r.n.bw) out.push(`  In ${strip(nm)}: ${strip(r.n.bw)}`); if (r.n.data) out.push(`  Data: ${strip(r.n.data)}`); }); });
  return out.join('\n');
}
/* ── Feedback: what reviewers, users and stakeholders said about the last version, each item cited by the
   decisions in this one that answer it. An item nobody cites is feedback this version doesn't answer. ── */
const fbRows = e => (e.feedback || []).map(f => ({ f, by: e.topics.flatMap((t, ti) => t.notes.map((n, i) => ({ ti, i, n, tn:t.name }))).filter(r => (r.n.fb || []).includes(f.id)) }));
function feedbackHTML(e){
  const R = fbRows(e), open = R.filter(r => !r.by.length).length;
  return `<p class="xp__intro">What was said about the last version, and where this one answers it. Each decision below cites the feedback it answers; click one to see it on the screen.</p>
    <p class="xp__sum"><span class="xp__v xp__v--ok">Answered ${R.length - open}</span> <span class="xp__v xp__v--bad">Not answered ${open}</span></p>
    <p class="xp__acts"><button data-xp="kmd">Copy as Markdown</button></p>
    <ol class="xp__list">${R.map(({ f, by }) => `<li class="xp__fb${by.length ? '' : ' is-miss'}"><q>${f.t}</q><p class="xp__src">${esc([f.by, f.date, f.on && 'on ' + f.on].filter(Boolean).join(' · '))}</p>
      ${by.length ? `<p class="xp__cites"><b>Answered by</b>${by.map(r => `<button data-xp="jump" data-ti="${r.ti}" data-i="${r.i}" title="${esc(strip(r.n.d))}">${esc(strip(r.n.t))}</button>`).join('')}</p>`
        : `<p class="xp__warn">⚠ Nothing in this version answers it yet</p>`}</li>`).join('')}</ol>`;
}
const feedbackMD = () => { const e = ex(); return [`## Feedback · ${strip(e.name)}`, `_how this version answers what was said · exported ${today()}_`, '',
  ...fbRows(e).flatMap(({ f, by }) => [`- “${strip(f.t)}” — ${[f.by, f.date].filter(Boolean).join(', ')}`, by.length ? `  Answered by: ${by.map(r => strip(r.n.t)).join('; ')}` : '  **Not answered yet**'])].join('\n'); };

/* ── Suggestions: what would make the screen better next, from every lens at once, most serious first ── */
function suggestions(e){
  const S = [], sc = scene(e), push = (lvl, t, why, go) => S.push({ lvl, t, why, go });
  if (sc){ const { rows } = judged(e, sc);
    rows.filter(r => r.j.k === 'breaks').forEach(r => push(0, `Change “${strip(r.n.t)}”`, `It is in tension with ${r.j.breaks.map(k => L.P[k][0]).join(', ')}, which ${strip(sc.name)} won’t trade.`, r));
    (sc.pains || []).filter(p => !rows.some(r => (r.n.pain || []).includes(p.id))).forEach(p => push(1, 'Answer a pain point', strip(p.t)));
    rows.filter(r => r.j.k === 'remove').forEach(r => push(2, `Remove “${strip(r.n.t)}”, or say what it is for`, 'Nothing but a principle says it must be there.', r));
    rows.filter(r => r.j.k === 'contested').forEach(r => push(2, `Rethink “${strip(r.n.t)}”`, 'What it is in tension with weighs as much as its reasons.', r)); }
  fbRows(e).filter(r => !r.by.length).forEach(({ f }) => push(1, 'Answer the feedback', `“${strip(f.t)}”${f.by ? ' — ' + strip(f.by) : ''}`));
  findings().forEach(x => push(x.n.v === 'issue' ? 1 : 3, (L.VL[x.n.v] || [x.n.v])[0] + ': ' + strip(x.n.t), strip(x.n.fix || x.n.d), x));
  if (X.aud && X.aud.id === X.id) X.aud.said.slice(0, 5).forEach(x => push(2, 'Say it once', `“${esc(x.k.length > 60 ? x.k.slice(0, 60) + '…' : x.k)}” is on screen ${x.n} times.`));   // page text: escaped; the rest is authored, like every note
  return S.sort((a, b) => a.lvl - b.lvl);
}
const SLV = [['Must change', 'bad'], ['Should answer', 'chg'], ['Worth cutting', 'q'], ['Ideas', 'pr']];
function suggestionsHTML(e){
  const S = suggestions(e);
  return `<p class="xp__intro">Everything the lenses found, in one list, most serious first: what breaks a principle that can’t be traded, what hurts users or reviewers and isn’t answered, what could go, and the ideas. ${X.aud && X.aud.id === X.id ? '' : 'Run <b>Coverage → Audit this screen</b> to add repeated text.'}</p>
    <p class="xp__acts"><button data-xp="smd">Copy as Markdown</button></p>
    ${SLV.map(([h, tone], lvl) => { const g = S.filter(s => s.lvl === lvl); return g.length ? `<h3 class="xp__h"><span class="xp__v xp__v--${tone}">${h}</span><span>${g.length}</span></h3>
      <ol class="xp__list">${g.map(s => `<li class="xp__fi"${s.go ? ` data-xp="jump" data-ti="${s.go.ti}" data-i="${s.go.i}" tabindex="0"` : ''}><div class="xp__t">${s.t}</div><p class="xp__d">${s.why}</p></li>`).join('')}</ol>` : ''; }).join('')
      || '<p class="xp__intro">Nothing to suggest: no breaks, no unanswered pains or feedback, no findings.</p>'}`;
}
const suggestionsMD = () => { const S = suggestions(ex()); return [`## Suggestions · ${strip(ex().name)}`, `_exported ${today()}_`,
  ...SLV.flatMap(([h], lvl) => { const g = S.filter(s => s.lvl === lvl); return g.length ? ['', `### ${h} (${g.length})`, ...g.map(s => `- **${s.t}** — ${s.why}`)] : []; })].join('\n'); };

/* ── Judged: every decision weighed for the people in the scenario, and what changes when the scenario does ── */
const JORDER = ['breaks', 'remove', 'contested', 'weak', 'one-sided', 'unsourced', 'sound'];
function judgedHTML(e){
  const S = scenarios(e), sc = scene(e), { J, rows } = judged(e, sc);
  const used = new Set(rows.flatMap(r => [...(r.n.p || []), ...(r.n.x || [])]));
  const moved = Object.keys(J.W).filter(k => used.has(k) && L.P[k] && J.w(k) !== 1).sort((a, b) => J.w(b) - J.w(a));
  const others = S.filter(o => o !== sc).map(o => ({ o, r: judged(e, o).rows }));
  const flips = rows.map((r, idx) => ({ r, alt: others.map(({ o, r: R }) => [o, R[idx].j.k]).filter(([, k]) => k !== r.j.k) })).filter(x => x.alt.length);
  const item = (r, extra = '') => `<li class="xp__fi" data-xp="jump" data-ti="${r.ti}" data-i="${r.i}" tabindex="0"><div class="xp__t">${r.n.t}${jchip(r.j.k)}</div>
    ${r.n.d ? `<p class="xp__d">${r.n.lv ? `<i>${L.LV[r.n.lv] || r.n.lv}</i>` : ''}${r.n.d}</p>` : ''}${r.j.f.length || r.j.a.length ? `<p class="xp__jb">${bal(r.j)}</p>` : ''}${extra}
    <p class="xp__src">${esc(strip(r.tn))} · note ${r.i + 1}</p></li>`;
  const who = (L, key) => (L || []).map(x => ({ x, n: rows.filter(r => (r.n[key] || []).includes(x.id)) }));
  const ask = (h, L, key, miss) => L.length ? `<div class="xp__asks"><h4>${h}</h4><ul>${L.map(({ x, n }) => `<li${n.length ? '' : ' class="is-miss"'}><span>${x.t}</span>
    ${n.length ? `<span class="xp__src">${n.length} decision${n.length === 1 ? '' : 's'}: ${n.slice(0, 3).map(r => `<button data-xp="jump" data-ti="${r.ti}" data-i="${r.i}">${esc(strip(r.n.t))}</button>`).join('')}</span>`
      : `<span class="xp__warn">⚠ ${miss}</span>`}</li>`).join('')}</ul></div>` : '';
  const pains = who(sc.pains, 'pain'), dirs = who(sc.direction, 'dir');
  const grp = k => { const g = rows.filter(r => r.j.k === k); return g.length ? `<details class="xp__grp"${['breaks', 'remove', 'contested', 'weak'].includes(k) ? ' open' : ''}><summary>${jchip(k)}<span>${g.length}</span></summary>
    <p class="xp__src">${JV[k][2]}</p><ol class="xp__list">${g.map(r => item(r)).join('')}</ol></details>` : ''; };
  return `<p class="xp__intro">A principle matters more or less depending on who is using the screen and how. Here every decision is weighed for <b>${esc(strip(sc.name))}</b>: what it rests on, against what it is in tension with.</p>
    ${S.length > 1 ? `<p class="xp__lens xp__lens--in" role="group" aria-label="Scenario"><span>For</span>${S.map((o, i) => `<button data-xp="sc" data-i="${i}" aria-pressed="${o === sc}">${esc(strip(o.name))}</button>`).join('')}</p>` : ''}
    <div class="xp__sc"><p>${sc.who || ''}</p>${sc.task ? `<p class="xp__src">${sc.task}</p>` : ''}
      <p class="xp__tr">${(sc.traits || []).map(t => `<span title="${esc(TRAITS[t] ? TRAITS[t][0] : '')}">${esc(t)}</span>`).join('')}</p>
      ${moved.length ? `<dl class="xp__wt">${moved.map(k => `<dt>${esc(L.P[k][0])}</dt><dd class="${J.w(k) > 1 ? 'is-up' : 'is-down'}">×${J.w(k)} <span>${esc(J.why[k].join(', '))}</span></dd>`).join('')}</dl>` : ''}
      ${(sc.critical || []).length ? `<p class="xp__crit"><b>Won’t be traded</b>${sc.critical.filter(k => L.P[k]).map(k => `<span>${esc(L.P[k][0])}</span>`).join('')}</p>` : ''}</div>
    ${ask('The users’ pain points', pains, 'pain', 'No decision addresses this pain')}${ask('The stakeholders’ direction', dirs, 'dir', 'No decision follows this yet')}
    ${!pains.length && !dirs.length ? `<p class="xp__flag">No pain points or direction are set for this scenario, so decisions can only be weighed by principles, and a principle can be found for almost anything. Add <code>pains</code> and <code>direction</code> from research and stakeholders.</p>` : ''}
    <p class="xp__sum">${JORDER.map(k => `${jchip(k)} ${rows.filter(r => r.j.k === k).length}`).join(' ')}</p>
    <p class="xp__acts"><button data-xp="jmd">Copy as Markdown</button></p>
    ${flips.length ? `<details class="xp__grp" open><summary>Judged differently for ${others.map(x => esc(strip(x.o.name))).join(', ')}<span>${flips.length}</span></summary>
      <ol class="xp__list">${flips.map(({ r, alt }) => item(r, `<p class="xp__src">${alt.map(([o, k]) => `${esc(strip(o.name))}: ${JV[k][0]}`).join(' · ')}</p>`)).join('')}</ol></details>` : ''}
    ${JORDER.map(grp).join('')}`;
}
function judgedMD(){
  const e = ex(), sc = scene(e), { rows } = judged(e, sc), P = ([p, w, l]) => `${pname(p, l)} ×${w}`;
  const out = [`## Judged · ${strip(e.name)} · for ${strip(sc.name)}`, `_${strip(sc.who || '')} · traits: ${(sc.traits || []).join(', ')} · exported ${today()}_`];
  const lst = (h, L, key) => { if (!(L || []).length) return; out.push('', `### ${h}`); L.forEach(x => { const n = rows.filter(r => (r.n[key] || []).includes(x.id)).length;
    out.push(`- ${strip(x.t)} — ${n ? n + ' decision' + (n === 1 ? '' : 's') : '**no decision addresses it**'}`); }); };
  lst('Pain points', sc.pains, 'pain'); lst('Direction', sc.direction, 'dir');
  if ((sc.critical || []).length) out.push('', `Won’t be traded: ${sc.critical.filter(k => L.P[k]).map(k => L.P[k][0]).join(', ')}`);
  JORDER.forEach(k => { const g = rows.filter(r => r.j.k === k); if (!g.length) return; out.push('', `### ${JV[k][0]} (${g.length})`);
    g.forEach(r => out.push(`- **${strip(r.n.t)}**${r.n.d ? ' — ' + strip(r.n.d) : ''}`, `  for ${r.j.f.map(P).join(', ') || '—'} · against ${r.j.a.map(P).join(', ') || '—'}`)); });
  return out.join('\n');
}
/* ── a flow, step for step against the same task in the baseline ── */
function flowHTML(t){
  const e = ex(), was = t.before.steps.map(s => Array.isArray(s) ? s : [s]), now = t.notes.filter(n => n.lv === 'step' || n.setup).map(n => [strip(n.t), n.k]);
  const sum = S => { const c = {}; S.forEach(([, k]) => { if (k) c[k] = (c[k] || 0) + 1; });   // what the person does first, then how long the path is
    return [...Object.keys(KIND).filter(k => c[k]).map(k => `${c[k]} ${KIND[k][c[k] === 1 ? 0 : 1]}`), `${S.length} step${S.length === 1 ? '' : 's'}`].join(' · '); };
  const col = (h, S) => `<div><h4>${h}</h4><p class="xp__src">${sum(S)}</p><ol>${S.map(([s, k]) => `<li>${esc(s)}${k ? ` <i>${(KIND[k] || [k])[0]}</i>` : ''}</li>`).join('')}</ol></div>`;
  return `<div class="xp__flow">${col(t.before.name || blName(e) || 'Before', was)}${col('Now', now)}</div>${t.before.note ? `<p class="xp__src">${t.before.note}</p>` : ''}`;
}
/* ── Coverage: which reasons the notes give, the decision log, the screen audit ── */
const COV = e => [['Why', n => n.w], ['Instead', n => n.alt || n.q], ['Cost', n => n.b], ['Source', n => (n.p || []).length || n.ref], ['Against', n => (n.x || []).length],
  ...(e.base ? [['vs ' + strip(blName(e)), n => n.bv || n.bw]] : []), ['States', n => n.st], ['Access', n => n.a11y], ['Data', n => n.data]];
function coverageHTML(){
  const e = ex(), N = e.topics.flatMap(t => t.notes), C = COV(e), R = rules();
  const rows = [...Object.keys(L.LV), null].map(k => [k ? L.LV[k] : 'No level', N.filter(n => k ? n.lv === k : !L.LV[n.lv])]).filter(r => r[1].length);
  const cell = (list, f) => { const c = list.filter(f).length, r = c / list.length;
    return `<td class="${r >= .8 ? 'is-hi' : r >= .4 ? 'is-mid' : 'is-lo'}" title="${c} of ${list.length}">${c}</td>`; };
  const flows = e.topics.filter(t => t.notes.some(n => n.lv === 'step')), fb = flows.filter(t => t.before).length;
  return `<p class="xp__intro">Which reasons the notes give, at each level. Pale cells are the gaps: a decision without its alternative or its cost is hard to defend in the room.</p>
    <div class="xp__cov"><table><thead><tr><th>Level</th><th>Notes</th>${C.map(c => `<th>${esc(c[0])}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(([nm, list]) => `<tr><th>${nm}</th><td>${list.length}</td>${C.map(c => cell(list, c[1])).join('')}</tr>`).join('')}
    <tr class="is-tot"><th>All</th><td>${N.length}</td>${C.map(c => cell(N, c[1])).join('')}</tr></tbody></table></div>
    ${flows.length ? `<p class="xp__src">${fb} of ${flows.length} flows are set against the steps ${e.base ? 'in ' + esc(strip(e.base.name)) : 'before'}.</p>` : ''}
    <h3 class="xp__h">Decision log</h3>
    <p class="xp__intro">Every note as one row: topic, level, element, verdict${e.base ? ', against ' + esc(strip(e.base.name)) : ''}, decision, why, instead, costs, sources, data, access.</p>
    <p class="xp__acts"><button data-xp="log">Copy as Markdown table</button><button data-xp="tsv">Copy for a spreadsheet</button></p>
    <h3 class="xp__h">Screen audit</h3>
    <p class="xp__intro">Every text style, gap and colour in use on this screen, judged by the system rules${Object.keys(R.type).length || R.space || Object.keys(R.color).length ? '' : ' — none are set yet, so this only counts (add <code>rules</code> to the entry or the config)'}. Click a row to ring where it is used.</p>
    <p class="xp__acts"><button data-xp="audit">${X.aud && X.aud.id === X.id ? 'Run again' : 'Audit this screen'}</button>${X.aud && X.aud.id === X.id ? '<button data-xp="amd">Copy as Markdown</button>' : ''}</p>
    ${X.aud && X.aud.id === X.id ? auditHTML(X.aud) : ''}`;
}
function logRows(){
  const e = ex(), bn = e.base && strip(e.base.name), sc = scene(e), J = sc && weigh(sc);
  const H = ['Topic', '#', 'Level', 'Element', 'Verdict', ...(bn ? ['vs ' + bn, 'In ' + bn] : []), ...(sc ? ['Judged for ' + strip(sc.name)] : []),
    'Decision', 'Why', 'Instead of', 'Costs', 'Sources', 'Against', 'Data', 'Access', 'Selector'];
  const rows = [], names = ks => (ks || []).filter(k => L.P[k]).map(k => L.P[k][0]).join('; ');
  e.topics.forEach(t => t.notes.forEach((n, i) => rows.push([strip(t.name), i + 1, L.LV[n.lv] || n.lv || '', strip(n.t), (L.VL[n.v] || [n.v])[0],
    ...(bn ? [isDesign(n) ? (BV[bvOf(e, n)] || [bvOf(e, n)])[0] : '', strip(n.bw)] : []), ...(sc ? [FV().includes(n.v) ? '' : JV[judgeNote(n, J, e).k][0]] : []),
    strip(n.d), strip(n.w), strip(n.alt), strip(n.b), names(n.p), names(n.x), strip(n.data), strip(n.a11y), n.s || ''])));
  return [H, ...rows];
}
const logMD = () => { const [H, ...R] = logRows(), c = v => String(v).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
  return [`## Decision log · ${strip(ex().name)}`, `_${R.length} decisions · exported ${today()}_`, '', `| ${H.join(' | ')} |`, `|${H.map(() => '---').join('|')}|`,
    ...R.map(r => `| ${r.map(c).join(' | ')} |`)].join('\n'); };
const logTSV = () => logRows().map(r => r.map(v => String(v).replace(/[\t\n\r]+/g, ' ')).join('\t')).join('\n');

/* ── measuring: any CSS colour → [r, g, b, a] through one canvas pixel, so oklch, color-mix and var() all come out as sRGB ── */
let cx = null, probe = null, TOK = null, NM = new WeakMap();
const RG = new Map();
function rgba(c){
  if (!c || c === 'transparent') return [0, 0, 0, 0];
  if (RG.has(c)) return RG.get(c);
  if (!cx){ const cv = document.createElement('canvas'); cv.width = cv.height = 1; cx = cv.getContext('2d', { willReadFrequently:true }); }
  cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1);
  const d = cx.getImageData(0, 0, 1, 1).data, out = [d[0], d[1], d[2], Math.round(d[3] / 2.55) / 100];
  RG.set(c, out); return out;
}
const hex = c => '#' + c.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('');
const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
const over = (c, u) => [0, 1, 2].map(i => Math.round(c[i] * c[3] + u[i] * (1 - c[3])));
/* ponytail: background colours only — an image or gradient behind text isn't seen, so contrast is read against the colour under it */
function bgOf(el){
  const S = [];
  for (let n = el; n && n.nodeType === 1; n = n.parentElement){ const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0){ S.push(c); if (c[3] >= 1) break; } }
  let out = [255, 255, 255]; for (let i = S.length - 1; i >= 0; i--) out = over(S[i], out);
  return out;
}
/* the design tokens: each custom property on :root / html that holds a colour, keyed by the hex it resolves to (first name wins) */
function tokens(){
  if (TOK) return TOK; TOK = new Map();
  if (!probe){ probe = document.createElement('i'); probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; }
  document.documentElement.append(probe);
  const names = new Set(), root = getComputedStyle(document.documentElement);
  for (const sh of document.styleSheets){ let rs; try { rs = sh.cssRules; } catch { continue; }
    for (const r of rs) if (r.style && /(^|,)\s*(:root|html)\s*(,|$)/.test(r.selectorText || '')) for (const p of r.style) if (p.startsWith('--')) names.add(p); }
  names.forEach(n => { if (!CSS.supports('color', root.getPropertyValue(n).trim() || 'x')) return;
    probe.style.color = ''; probe.style.color = `var(${n})`; const c = rgba(getComputedStyle(probe).color);
    if (c[3] >= 1 && !TOK.has(hex(c))) TOK.set(hex(c), n); });
  probe.remove(); return TOK;
}
const cur = () => ex() || EXP()[key()] || {};
function rules(){
  const a = CFG().rules || {}, b = cur().rules || {}, lc = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) =>
    [/^#[0-9a-f]{3}$/i.test(k) ? '#' + [...k.slice(1)].map(c => c + c).join('').toLowerCase() : k[0] === '#' ? k.toLowerCase() : k, v]));
  return { type:{ ...a.type, ...b.type }, color:lc({ ...a.color, ...b.color }), radius:{ ...a.radius, ...b.radius }, space: b.space || a.space || null };
}
const ruleType = (R, k) => R.type[k] || R.type[k.split('/')[0]];
const ruleColor = (R, h) => R.color[h] || R.color[tokens().get(h)];
const onScale = (R, v) => !R.space || R.space.v.includes(+v);
const ownText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
const S4 = ['Top', 'Right', 'Bottom', 'Left'];
const four = a => a.every(v => v === a[0]) ? a[0] : a[0] === a[2] && a[1] === a[3] ? a[0] + ' ' + a[1] : a.join(' ');
const INTER = 'a[href],button,input,select,textarea,summary,[role="button"],[role="link"],[role="tab"],[role="checkbox"],[role="radio"],[role="switch"],[role="menuitem"],[role="option"],[tabindex]:not([tabindex="-1"])';
function measure(el){
  const cs = getComputedStyle(el), r = el.getBoundingClientRect(), R = rules(), T = tokens();
  const side = p => S4.map(s => fmt(parseFloat(cs[p + s + (p === 'border' ? 'Width' : '')]) || 0));
  const pad = side('padding'), mar = side('margin'), bw = side('border'), gaps = [...new Set([cs.rowGap, cs.columnGap].map(parseFloat).filter(v => v > 0).map(fmt))];
  const col = c => { const k = rgba(c), h = hex(k); return { h, a:k[3], tok:T.get(h), rule:ruleColor(R, h) }; };
  const m = { w:fmt(r.width), h:fmt(r.height), x:fmt(r.left + scrollX), y:fmt(r.top + scrollY), display:cs.display, pad:four(pad), mar:four(mar), gap:gaps.join(' '),
    offSp:[...new Set([...pad, ...gaps].filter(v => +v > 0 && !onScale(R, v)))], spaced:[...pad, ...gaps].some(v => +v > 0), radius:fmt(parseFloat(cs.borderTopLeftRadius) || 0) };
  m.rRule = R.radius[m.radius];
  if (bw.some(v => +v > 0) && cs.borderTopStyle !== 'none') m.border = { w:four(bw), style:cs.borderTopStyle, ...col(cs.borderTopColor) };
  if (rgba(cs.backgroundColor)[3] > 0) m.bg = col(cs.backgroundColor);
  if (ownText(el)){
    const size = fmt(parseFloat(cs.fontSize)), w = cs.fontWeight, k = `${size}/${w}`, under = bgOf(el), cr = ratio(over(rgba(cs.color), under), under);
    const big = +size >= 24 || (+size >= 18.5 && +w >= 700);
    m.type = { fam:cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), size, lh: cs.lineHeight === 'normal' ? 'normal' : fmt(parseFloat(cs.lineHeight)), w, k,
      rule:ruleType(R, k), judged:Object.keys(R.type).length > 0 };
    m.fg = col(cs.color);
    m.contrast = { r:Math.round(cr * 100) / 100, need: big ? 3 : 4.5, big, on:hex(under) };
  }
  const hit = el.closest(INTER);
  if (hit){ const hr = hit.getBoundingClientRect(); m.target = { tag:tag(hit), w:fmt(hr.width), h:fmt(hr.height), ok: hr.width >= 24 && hr.height >= 24 }; }
  return m;
}
/* ── Inspect: names come from anatomy (config, then entry), then the notes that ring a part ── */
function named(){
  if (X.nmFor === X.id && X.nm) return X.nm;
  const e = cur(), A = [...(CFG().anatomy || []), ...(e.anatomy || [])].map(([s, t, lv]) => ({ s, t, lv }));
  X.nm = [...A, ...(e.topics || []).flatMap(t => t.notes).filter(n => n.s && isDesign(n))]; X.nmFor = X.id; return X.nm;
}
function nameOf(el){
  if (NM.has(el)) return NM.get(el);
  let out = null;
  for (const n of named()){ let ok = false; try { ok = el.matches(n.s); } catch {}
    if (ok && (!n.text || n.text.test(el.textContent))){ out = { t:strip(n.t), lv:n.lv }; break; } }
  NM.set(el, out); return out;
}
function crumbs(el){
  const out = [];
  for (let n = el; n && n !== document.documentElement; n = n.parentElement){ const nm = nameOf(n); if (nm || n === el) out.unshift([n, nm]); }
  return out;
}
function parts(el){                                              // named parts whose nearest named ancestor is el: what it is made of
  if (el === document.body) return [];
  const out = [], all = el.querySelectorAll('*');
  for (let i = 0; i < all.length && i < 4000 && out.length < 12; i++){
    const d = all[i]; if (!nameOf(d) || !vis(d)) continue;
    let p = d.parentElement; while (p && p !== el && !nameOf(p)) p = p.parentElement;
    if (p === el) out.push(d);
  }
  return out;
}
function decisionsOn(el){
  const out = [];
  ex().topics.forEach((t, ti) => t.notes.forEach((n, i) => { if (!n.s) return; let ok = false; try { ok = el.matches(n.s); } catch {}
    if (ok && (!n.text || n.text.test(el.textContent))) out.push({ ti, i, n, tn:t.name }); }));
  return out;
}
const okM = s => `<span class="xp__ok">✓ ${s}</span>`, warnM = s => `<span class="xp__warn">⚠ ${s}</span>`;
const swatch = (h, a = 1) => `<i class="xp__sw" style="background:${h}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''}"></i>`;
function inspectHTML(){
  const el = X.ip && X.ip.isConnected ? X.ip : X.ih && X.ih.isConnected ? X.ih : null, e = ex();
  const help = `<p class="xp__tip">Hover any part to read it; click to pin it. Pinned, hover another part for the distance between them. <b>↑</b> parent · <b>↓</b> child · <b>← →</b> siblings · <b>Esc</b></p>`;
  if (!el) return help + `<p class="xp__intro">For each part: where it sits in the whole, what it is made of, its measured size, spacing, type and colour, the system rule behind each value, and the decisions written about it.</p>`;
  const m = measure(el), cr = crumbs(el), kids = parts(el), here = decisionsOn(el), R = rules(), nm = nameOf(el);
  X.cr = [...cr.map(c => c[0]), ...kids];
  const colour = c => `${swatch(c.h, c.a)}<code>${c.h}${c.a < 1 ? ' · ' + Math.round(c.a * 100) + '%' : ''}</code>${c.tok ? ` <code>${esc(c.tok)}</code>` : ''}${c.rule ? ' ' + okM(c.rule) : ''}`;
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${v}</dd>` : '';
  const sp = R.space && m.spaced ? (m.offSp.length ? warnM(`${m.offSp.join(', ')} not on the spacing scale (${R.space.v.join(' · ')})`) : okM(R.space.why || 'on the spacing scale')) : '';
  const type = m.type && `${esc(m.type.fam)} ${m.type.size}/${m.type.lh} · ${m.type.w} ${m.type.judged ? (m.type.rule ? okM(m.type.rule) : warnM(`${m.type.k} is not on the type scale (${Object.keys(R.type).join(' · ')})`)) : ''}`;
  const con = m.contrast && `<b>${m.contrast.r}:1</b> on <code>${m.contrast.on}</code> ${m.contrast.r >= m.contrast.need ? okM(`AA${m.contrast.big ? ' large' : ''}, needs ${m.contrast.need}`) : warnM(`under ${m.contrast.need}:1 · WCAG 1.4.3`)}`;
  const tgt = m.target && `<code>${esc(m.target.tag)}</code> ${m.target.w} × ${m.target.h} ${m.target.ok ? okM('at least 24 × 24 · WCAG 2.5.8') : warnM('under 24 × 24 · WCAG 2.5.8')}`;
  return help + `<div class="xp__ins">
    <p class="xp__crumbs">${cr.map(([n, c], k) => `<button data-xp="ipick" data-n="${k}"${n === el ? ' aria-current="true"' : ''}>${c ? esc(c.t) : esc(tag(n))}</button>`).join('<span>›</span>')}</p>
    <h3 class="xp__ih">${nm ? esc(nm.t) : `<code>${esc(tag(el))}</code>`}${nm && nm.lv ? `<i>${L.LV[nm.lv] || nm.lv}</i>` : ''}</h3>
    ${kids.length ? `<p class="xp__kids"><b>Made of</b>${kids.map((k, j) => `<button data-xp="ipick" data-n="${cr.length + j}">${esc(nameOf(k).t)}</button>`).join('')}</p>` : ''}
    <dl class="xp__spec">${row('Size', `${m.w} × ${m.h} <span class="xp__src">at ${m.x}, ${m.y} · ${m.display}</span>`)}
      ${row('Padding', m.pad !== '0' && m.pad)}${row('Gap', m.gap)}${sp ? `<dt></dt><dd>${sp}</dd>` : ''}${row('Margin', m.mar !== '0' && m.mar)}
      ${row('Radius', m.radius !== '0' && m.radius + (m.rRule ? ' ' + okM(m.rRule) : ''))}${row('Border', m.border && `${m.border.w} ${m.border.style} ${colour(m.border)}`)}
      ${row('Type', type)}${row('Colour', m.fg && colour(m.fg))}${row('Fill', m.bg && colour(m.bg))}${row('Contrast', con)}${row('Target', tgt)}</dl>
    ${here.length ? `<h3 class="xp__h">Decisions on this part<span>${here.length}</span></h3><ol class="xp__list">${here.map(f => `<li class="xp__fi" data-xp="jump" data-ti="${f.ti}" data-i="${f.i}" tabindex="0">
      <div class="xp__t">${f.n.t}${chip(e, f.n)}</div>${f.n.d ? `<p class="xp__d">${f.n.d}</p>` : ''}<p class="xp__src">${esc(strip(f.tn))} · note ${f.i + 1}</p></li>`).join('')}</ol>`
      : `<p class="xp__src">No note is written about this part yet.</p>`}
    <p class="xp__acts">${CFG().author !== false ? '<button data-xp="inote">+ Note on this</button>' : ''}<button data-xp="isel">Copy selector</button></p></div>`;
}
/* the distances a designer measures between the pinned part (A) and the hovered one (B) */
function gaps(A, B){
  const out = [], inside = (o, i) => i.left >= o.left && i.right <= o.right && i.top >= o.top && i.bottom <= o.bottom;
  if (inside(A, B) || inside(B, A)){ const [o, i] = inside(A, B) ? [A, B] : [B, A], cy = i.top + i.height / 2, cx = i.left + i.width / 2;
    out.push([o.left, cy, i.left, cy], [i.right, cy, o.right, cy], [cx, o.top, cx, i.top], [cx, i.bottom, cx, o.bottom]); }
  else {
    const y0 = Math.max(A.top, B.top), y1 = Math.min(A.bottom, B.bottom), cy = y0 < y1 ? (y0 + y1) / 2 : A.top + A.height / 2;
    if (B.left >= A.right) out.push([A.right, cy, B.left, cy]); else if (A.left >= B.right) out.push([B.right, cy, A.left, cy]);
    const x0 = Math.max(A.left, B.left), x1 = Math.min(A.right, B.right), cx = x0 < x1 ? (x0 + x1) / 2 : A.left + A.width / 2;
    if (B.top >= A.bottom) out.push([cx, A.bottom, cx, B.top]); else if (A.top >= B.bottom) out.push([cx, B.bottom, cx, A.top]);
  }
  return out.filter(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1) >= .5);
}
function inspectPaint(){
  const ip = X.ip && X.ip.isConnected ? X.ip : null, ih = X.ih && X.ih.isConnected && X.ih !== ip ? X.ih : null, lab = el => esc(nameOf(el) ? nameOf(el).t : tag(el));
  let html = '', svg = '';
  if (ip){
    const r = ip.getBoundingClientRect(), cs = getComputedStyle(ip), n = p => Math.max(0, parseFloat(cs[p]) || 0);
    const m = S4.map(s => n('margin' + s)), p = S4.map(s => n('padding' + s)), b = S4.map(s => n('border' + s + 'Width'));
    html += `<div class="xp-box xp-box--m" style="left:${r.left - m[3]}px;top:${r.top - m[0]}px;width:${r.width + m[1] + m[3]}px;height:${r.height + m[0] + m[2]}px;border-width:${m.join('px ')}px"></div>`
      + `<div class="xp-box xp-box--p" style="left:${r.left + b[3]}px;top:${r.top + b[0]}px;width:${Math.max(0, r.width - b[1] - b[3])}px;height:${Math.max(0, r.height - b[0] - b[2])}px;border-width:${p.join('px ')}px"></div>`
      + `<div class="xp-ins xp-ins--pin" style="${box(r, 0)}"><em>${lab(ip)} · ${fmt(r.width)} × ${fmt(r.height)}</em></div>`;
  }
  if (ih){ const r = ih.getBoundingClientRect(); html += `<div class="xp-ins" style="${box(r, 0)}"><em>${lab(ih)} · ${fmt(r.width)} × ${fmt(r.height)}</em></div>`; }
  if (ip && ih){ const R = rules();
    gaps(ip.getBoundingClientRect(), ih.getBoundingClientRect()).forEach(([x1, y1, x2, y2]) => { const d = fmt(Math.hypot(x2 - x1, y2 - y1));
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      html += `<em class="xp-gap${R.space && !onScale(R, d) ? ' is-off' : ''}" style="left:${(x1 + x2) / 2}px;top:${(y1 + y2) / 2}px">${d}</em>`; }); }
  return (svg ? `<svg class="xp-lines xp-lines--gap">${svg}</svg>` : '') + html;
}
/* the screen audit: every text style, gap and colour in use under the entry's root */
function audit(){
  const e = cur(), root = (e.root && document.querySelector(e.root)) || document.body, R = rules(), T = tokens();
  const G = { type:new Map(), space:new Map(), color:new Map() }, said = new Map();   // said: the same words in more than one place
  const add = (g, k, el) => { let x = G[g].get(k); if (!x) G[g].set(k, x = { k, n:0, els:[], uses:new Set() }); x.n++; if (x.els.length < 16 && !x.els.includes(el)) x.els.push(el); return x; };
  let seen = 0;
  for (const el of root.querySelectorAll('*')){
    if (seen >= 6000) break;                                      // ponytail: a cap for huge DOMs; scope with entry.root instead
    if (el.closest('#xp, #xpRings, #xpBtn, #xpToast') || !el.getClientRects().length) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
    seen++;
    if (ownText(el)){ add('type', `${fmt(parseFloat(cs.fontSize))}/${cs.fontWeight}`, el); add('color', hex(rgba(cs.color)), el).uses.add('text');
      const t = el.textContent.replace(/\s+/g, ' ').trim();
      if (t.length >= 10 && t.length <= 200 && /\s/.test(t)) (said.get(t.toLowerCase()) || said.set(t.toLowerCase(), { t, els:[] }).get(t.toLowerCase())).els.push(el); }
    [...S4.map(s => cs['padding' + s]), cs.rowGap, cs.columnGap].forEach(v => { const n = parseFloat(v); if (n > 0) add('space', fmt(n), el); });
    const bg = rgba(cs.backgroundColor); if (bg[3] > 0) add('color', hex(bg), el).uses.add('fill');
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && rgba(cs.borderTopColor)[3] > 0) add('color', hex(rgba(cs.borderTopColor)), el).uses.add('border');
  }
  const sort = m => [...m.values()].sort((a, b) => b.n - a.n);
  const sat = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return Math.max(...c) - Math.min(...c) > 40; };
  const jt = Object.keys(R.type).length > 0, jc = Object.keys(R.color).length > 0;
  const twice = [...said.values()].map(x => ({ k:x.t, els:x.els.filter(a => !x.els.some(b => b !== a && b.contains(a))) }))   // not a label inside its own row
    .filter(x => x.els.length > 1).map(x => ({ ...x, n:x.els.length, els:x.els.slice(0, 16) })).sort((a, b) => b.n - a.n);
  return { seen, said:twice,
    type: sort(G.type).map(x => ({ ...x, rule:ruleType(R, x.k), judged:jt })),
    space: sort(G.space).map(x => ({ ...x, ok:onScale(R, x.k), judged:!!R.space })),
    color: sort(G.color).map(x => ({ ...x, tok:T.get(x.k), rule:ruleColor(R, x.k), sat:sat(x.k), judged:jc })) };
}
function auditHTML(A){
  const li = (g, x, label, mark) => `<li><button class="xp__au" data-xp="hl" data-g="${g}" data-k="${esc(x.k)}">${label}<span class="xp__cnt">×${x.n}</span></button>${mark}</li>`;
  const oT = A.type.filter(x => x.judged && !x.rule).length, oS = A.space.filter(x => x.judged && !x.ok).length, oC = A.color.filter(x => x.judged && x.sat && !x.rule).length;
  const grp = (h, n, off, open, items) => `<details class="xp__grp"${open ? ' open' : ''}><summary>${h}<span>${n}${off ? ` · ${off}` : ''}</span></summary><ul class="xp__aud">${items}</ul></details>`;
  return `<p class="xp__src">${A.seen} parts read · ${A.type.length} text styles · ${A.space.length} gap values · ${A.color.length} colours · ${A.said.length} things said twice</p>
    ${A.said.length ? grp('Said twice', A.said.length, 'each one a candidate to cut', true, A.said.map(x => li('said', x, `<span class="xp-said">“${esc(x.k.length > 70 ? x.k.slice(0, 70) + '…' : x.k)}”</span>`,
      warnM(`in ${x.n} places`))).join('')) : ''}
    ${grp('Type', A.type.length, oT && oT + ' off the scale', true, A.type.map(x => li('type', x, `<b>${x.k}</b>`, x.judged ? (x.rule ? okM(x.rule) : warnM('not on the type scale')) : '')).join(''))}
    ${grp('Spacing', A.space.length, oS && oS + ' off the scale', oS > 0, A.space.map(x => li('space', x, `<b>${x.k}</b> px`, x.judged ? (x.ok ? okM('on the scale') : warnM('not on the scale')) : '')).join(''))}
    ${grp('Colour', A.color.length, oC && oC + ' saturated, no meaning set', true, A.color.map(x => li('color', x,
      `${swatch(x.k)}<code>${x.k}</code>${x.tok ? ` <code>${esc(x.tok)}</code>` : ''} <span class="xp__src">${[...x.uses].join(' · ')}</span>`,
      x.rule ? okM(x.rule) : x.judged && x.sat ? warnM('no meaning set') : '')).join(''))}`;
}
const auditMD = A => [`## Screen audit · ${strip(ex().name)}`, `_${A.seen} parts read · ${today()}_`,
  ...(A.said.length ? ['', '### Said twice', ...A.said.map(x => `- “${x.k}” — in ${x.n} places`)] : []),
  '', '### Type', ...A.type.map(x => `- ${x.k} ×${x.n}${x.judged ? ' — ' + (x.rule ? strip(x.rule) : 'not on the type scale') : ''}`),
  '', '### Spacing', ...A.space.map(x => `- ${x.k}px ×${x.n}${x.judged ? (x.ok ? '' : ' — not on the scale') : ''}`),
  '', '### Colour', ...A.color.map(x => `- ${x.k}${x.tok ? ' ' + x.tok : ''} ×${x.n} (${[...x.uses].join(', ')})${x.rule ? ' — ' + strip(x.rule) : x.judged && x.sat ? ' — no meaning set' : ''}`)].join('\n');
function pin(el){ X.ip = el && el !== document.documentElement ? el : null; X.ih = null; render(); draw(); }
function setInspect(on){
  X.insp = on; X.ih = X.ip = null; X.hl = null; X.form = null; X.copy = null;
  if (on){ X.pick = false; X.ph = null; document.documentElement.classList.remove('xp-picking'); NM = new WeakMap(); TOK = null; }
  document.documentElement.classList.toggle('xp-inspecting', on);
  if (X.on){ render(); draw(); }
}
function formHTML(){
  const f = X.form, n = all(f.s).length;
  return `<form class="xp__form" data-xp-form>
    <p class="xp__intro">Note on <code>${esc(f.label)}</code>. It is ringed on the screen; edit the selector if it catches too much or too little.</p>
    <label>Selector <input name="s" value="${esc(f.s)}" spellcheck="false" autocomplete="off"><small data-xp-count>${n === 1 ? '1 match' : n + ' matches'}</small></label>
    <label>Title <input name="t" required placeholder="" autocomplete="off"></label>
    <label>The decision or the finding, one line <textarea name="d" rows="3"></textarea></label>
    <div class="xp__row"><label>Verdict <select name="v">${Object.entries(L.VL).map(([k, v]) => `<option value="${k}"${k === f.v ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></label>
      <label>Level <select name="lv">${Object.entries(L.LV).map(([k, v]) => `<option value="${k}"${k === f.lv ? ' selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <div class="xp__row"><button type="submit" class="is-primary">Save note</button><button type="button" data-xp="cancel">Cancel</button></div></form>`;
}
/* ── three sizes: Full (docked; the page makes room) · Mini (a card over the page, which keeps its real width)
      · Hide (nothing on screen, to judge the design as it is). M and H switch them. ── */
function setSize(s){
  if (s === 'hide' && X.size !== 'hide') X.prev = X.size;
  X.size = s; if (s !== 'hide') ss.set('xp:size', s);
  const de = document.documentElement;
  de.classList.toggle('xp-mini', X.on && s === 'mini'); de.classList.toggle('xp-hide', X.on && s === 'hide');
  if (!X.on) return;
  pane.hidden = s === 'hide';
  if (s === 'hide') toast('Explain is hidden. Press H to bring it back.');
  render(); draw(); refreshBtn();
}
const unhide = () => { if (X.size === 'hide') setSize(X.prev || 'full'); };
function toast(text){
  let el = document.getElementById('xpToast');
  if (!el){ el = document.createElement('div'); el.id = 'xpToast'; el.className = 'xp-toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = text; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 1800);
}
/* the mini card goes where it is dragged, kept in the window; the spot is kept for this tab */
function place(x, y){
  const r = pane.getBoundingClientRect();
  X.pos = [Math.max(8, Math.min(innerWidth - r.width - 8, x)), Math.max(8, Math.min(innerHeight - r.height - 8, y))];
  Object.assign(pane.style, { left:X.pos[0] + 'px', top:X.pos[1] + 'px', right:'auto', bottom:'auto' });
}
const unplace = () => Object.assign(pane.style, { left:'', top:'', right:'', bottom:'' });
function miniInspect(el){
  const m = measure(el), nm = nameOf(el), path = crumbs(el).map(([n, c]) => c ? c.t : tag(n)).slice(0, -1);
  const bits = [`${m.w} × ${m.h}`, m.pad !== '0' && 'pad ' + m.pad, m.gap && 'gap ' + m.gap, m.radius !== '0' && 'radius ' + m.radius,
    m.type && `${m.type.size}/${m.type.w}`, m.fg && m.fg.h + (m.fg.tok ? ' ' + m.fg.tok : '')].filter(Boolean);
  const says = [m.type && m.type.judged && (m.type.rule ? okM(m.type.rule) : warnM(`${m.type.k} is off the type scale`)),
    m.offSp.length && warnM(`${m.offSp.join(', ')} off the spacing scale`),
    m.contrast && m.contrast.r < m.contrast.need && warnM(`contrast ${m.contrast.r}:1, needs ${m.contrast.need}`),
    m.target && !m.target.ok && warnM('target under 24 × 24')].filter(Boolean);
  return `${path.length ? `<p class="xp__src">${esc(path.join(' › '))}</p>` : ''}<div class="xp__t">${nm ? esc(nm.t) : `<code>${esc(tag(el))}</code>`}</div>
    <p class="xp__d"><code>${esc(bits.join(' · '))}</code></p>${says.length ? `<p class="xp-mini__says">${says.join('<br>')}</p>` : ''}`;
}
function renderMini(){
  const e = ex(), T = tops(), t = T[X.ti], i = X.act, n = i != null && t.notes[i], el = X.insp && ((X.ip && X.ip.isConnected && X.ip) || (X.ih && X.ih.isConnected && X.ih));
  const body = X.insp ? (el ? miniInspect(el) : `<p class="xp__intro">Hover any part to read it; click to pin it. <b>Esc</b> stops.</p>`)
    : n ? `<div class="xp__t"><span class="xp__n">${i + 1}</span>${n.t}${chip(e, n)}</div>${n.d ? `<p class="xp__d">${n.lv ? `<i>${L.LV[n.lv] || n.lv}</i>` : ''}${n.d}</p>` : ''}`
    : `<p class="xp__intro">${t.auto ? 'This topic reads best in the full panel.' : t.intro || ''}</p>${t.notes.length ? '<p class="xp__src">↓ steps through the notes</p>' : ''}`;
  pane.innerHTML = `<div class="xp-mini__hd" data-xp-drag title="Drag to move"><small>${X.insp ? 'Inspect' : esc(strip(t.name))} · ${X.ti + 1}/${T.length}</small>
      <button data-xp="size" data-k="full" title="Open the full panel (M)">Panel</button><button data-xp="hide" title="Hide everything to judge the screen as it is (H)">Hide</button>
      <button data-xp="close" aria-label="Close explain">✕</button></div>
    <div class="xp-mini__bd">${body}</div>
    <div class="xp-mini__ft"><button data-xp="prev" aria-label="Previous topic" title="Previous topic (←)" ${X.ti ? '' : 'disabled'}>‹</button>
      <button data-xp="nstep" data-d="-1" aria-label="Previous note" title="Previous note (↑)" ${t.notes.length ? '' : 'disabled'}>↑</button>
      <span>${X.insp ? (el ? 'pinned: ↑ parent · ↓ child' : '') : n ? `note ${i + 1} of ${t.notes.length}` : `${t.notes.length} notes`}</span>
      <button data-xp="nstep" data-d="1" aria-label="Next note" title="Next note (↓)" ${t.notes.length ? '' : 'disabled'}>↓</button>
      <button data-xp="next" aria-label="Next topic" title="Next topic (→)" ${X.ti < T.length - 1 ? '' : 'disabled'}>›</button>
      <button data-xp="insp" aria-pressed="${X.insp}" title="Inspect any part (I)">Inspect</button></div>`;
  if (X.pos) place(X.pos[0], X.pos[1]); else unplace();
}
function render(){
  const e = ex(), T = tops(), t = T[X.ti], other = e.other && EXP()[e.other] && CFG().show;
  const off = t.flag && !has(t.flag);
  if (X.size === 'mini' && (X.form || X.copy != null || X.pick)){ X.size = 'full'; document.documentElement.classList.remove('xp-mini'); }   // forms and picking need the panel
  pane.classList.toggle('is-mini', X.size === 'mini');
  if (X.size === 'mini') return renderMini();
  unplace();
  pane.classList.toggle('is-full', X.full);
  let body;
  if (X.form) body = formHTML();
  else if (X.insp) body = inspectHTML();
  else if (t.auto === 'p') body = principlesHTML();
  else if (t.auto === 'f') body = findingsHTML(e);
  else if (t.auto === 'b') body = deltaHTML(e);
  else if (t.auto === 'c') body = coverageHTML();
  else if (t.auto === 'j') body = judgedHTML(e);
  else if (t.auto === 'k') body = feedbackHTML(e);
  else if (t.auto === 's') body = suggestionsHTML(e);
  else { let flagUrl = ''; if (off){ const u = new URL(location.href); u.searchParams.set(t.flag, ''); u.searchParams.set('xp', X.ti + 1); flagUrl = u.href; }
    body = `${off ? `<p class="xp__flag">This topic needs the <b>${t.flag}</b> idea on. <a href="${esc(flagUrl)}">Turn it on ›</a></p>` : ''}
      ${t.auto === 'd' ? `<p class="xp__acts"><button data-xp="code">Copy as code</button></p>` : ''}
      <p class="xp__intro">${t.intro || ''}</p>${t.before ? flowHTML(t) : ''}<ol class="xp__list">${t.notes.map((n, i) => noteHTML(e, n, i, X.ti)).join('')}</ol>`; }
  if (X.pick) body = `<p class="xp__tip">Click any part of the screen to note it. <b>Esc</b> stops.</p>` + body;
  if (X.copy != null) body = `<p class="xp__tip">Copying isn’t allowed here — select the text below and copy it.</p><textarea class="xp__copy" readonly>${esc(X.copy)}</textarea>` + body;
  const lens = e.base ? `<div class="xp__lens" role="group" aria-label="Read the notes against"><span>Against</span>${[['base', blName(e)], ['prev', prevName(e)]].map(([k, l]) =>
    `<button data-xp="lens" data-k="${k}" aria-pressed="${(k === 'base') === onBase()}">${esc(strip(l))}</button>`).join('')}</div>` : '';
  pane.innerHTML = `<div class="xp__hd"><div><small>Explain · ${e.name}</small><h2>${X.insp ? 'Inspect' : t.name}</h2></div>
      <span class="xp__win"><button class="xp__full" data-xp="size" data-k="mini" title="Shrink to a small card, so the screen gets back its real width (M)">Mini</button>
      <button class="xp__full" data-xp="hide" title="Hide everything to judge the screen as it is (H)">Hide</button>
      <button class="xp__full" data-xp="full" aria-pressed="${X.full}" title="Off: one line per decision, the rest on click · On: every reason open">Full detail</button></span>
      <button class="xp__x" data-xp="close" aria-label="Close explain">✕</button></div>${lens}
    <div class="xp__topics">${T.map((x, i) => `<button data-xp="topic" data-i="${i}" aria-pressed="${!X.insp && i === X.ti}"${x.auto ? ' class="is-auto"' : ''}>${x.name}<span>${autoN(x)}</span></button>`).join('')}</div>
    <div class="xp__body">${body}</div>
    <div class="xp__ft"><button class="xp__nav" data-xp="prev" aria-label="Previous topic" title="Previous topic (←)" ${X.ti ? '' : 'disabled'}>‹</button><span>${X.ti + 1} / ${T.length}</span>
      <button class="xp__nav" data-xp="next" aria-label="Next topic" title="Next topic (→)" ${X.ti < T.length - 1 ? '' : 'disabled'}>›</button>
      <button class="xp__insp" data-xp="insp" aria-pressed="${X.insp}" title="Inspect any part: where it sits in the whole, what it is made of, its measured spec and the rule behind each value (I)">${X.insp ? 'Inspecting… Esc' : 'Inspect'}</button>
      ${CFG().author !== false ? `<button class="xp__pick" data-xp="pick" aria-pressed="${X.pick}" title="Pick a part of the screen and write a note on it">${X.pick ? 'Picking… Esc' : '+ Note'}</button>` : ''}
      ${other ? `<button class="xp__go" data-xp="go">${e.otherL || 'Compare with'} ${EXP()[e.other].short || EXP()[e.other].name.split(' ·')[0]} ›</button>` : ''}</div>`;
  if (X.copy != null){ const ta = pane.querySelector('.xp__copy'); ta.focus(); ta.select(); }
}

/* ── rings: one per ringed note; the focused note's relations as dashed rings and lines ── */
let raf = 0, tmo = 0;
const draw = () => { cancelAnimationFrame(raf); clearTimeout(tmo);
  if (document.hidden) tmo = setTimeout(paint, 0); else raf = requestAnimationFrame(paint); };   // a background tab gets no frames
const box = (r, pad = 4) => `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
const edge = (r, dx, dy) => { const hw = r.width / 2 + 4, hh = r.height / 2 + 4, k = Math.min(dx ? hw / Math.abs(dx) : 1e9, dy ? hh / Math.abs(dy) : 1e9, 1);
  return [r.left + r.width / 2 + dx * k, r.top + r.height / 2 + dy * k]; };
const tag = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList[0] ? '.' + el.classList[0] : '');
function paint(){
  if (!X.on || X.size === 'hide'){ rings.innerHTML = ''; return; }
  if (X.insp){ rings.classList.remove('has-on'); rings.innerHTML = inspectPaint(); return; }
  let html = '', svg = '';
  if (X.pick && X.ph && X.ph.isConnected) html += `<div class="xp-ring xp-ring--pick" style="${box(X.ph.getBoundingClientRect(), 2)}"><em>${esc(tag(X.ph))}</em></div>`;
  if (X.form){ all(X.form.s).slice(0, 16).forEach(el => { html += `<div class="xp-ring xp-ring--pick" style="${box(el.getBoundingClientRect(), 2)}"></div>`; });
    rings.innerHTML = html; rings.classList.remove('has-on'); return; }
  const notes = topic().notes, on = X.hov != null ? X.hov : X.act, badges = [];
  notes.forEach((n, i) => {
    const els = targets(n), li = pane.querySelector(`.xp__note[data-i="${i}"]`);
    if (li && n.s){ li.toggleAttribute('data-miss', !els.length); li.querySelector('.xp__miss').hidden = !!els.length; }
    els.forEach((el, k) => { const r = el.getBoundingClientRect(), x0 = r.left - 16, y0 = r.top - 16;
      let x = x0; while (!k && badges.some(b => Math.abs(b[0] - x) < 24 && Math.abs(b[1] - y0) < 24)) x += 26;   // side-step a badge already there
      if (!k) badges.push([x, y0]);
      html += `<div class="xp-ring${on === i ? ' is-on' : ''}" style="${box(r)}">${k ? '' : `<b data-xp="ring" data-i="${i}" style="left:${x - x0 - 12}px">${i + 1}</b>`}</div>`; });
  });
  const an = on != null && notes[on], from = an && targets(an)[0], fr = from && from.getBoundingClientRect();
  relsOf(an).forEach(([sel, lab]) => all(sel).filter(el => el !== from).slice(0, 6).forEach((el, k) => {
    const r = el.getBoundingClientRect();
    html += `<div class="xp-ring xp-ring--rel" style="${box(r)}">${k ? '' : `<em>${lab}</em>`}</div>`;
    if (fr){ const dx = (r.left + r.width / 2) - (fr.left + fr.width / 2), dy = (r.top + r.height / 2) - (fr.top + fr.height / 2);
      const [x1, y1] = edge(fr, dx, dy), [x2, y2] = edge(r, -dx, -dy);
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle cx="${x2}" cy="${y2}" r="3"/>`; }
  }));
  if (X.hl) X.hl.filter(el => el.isConnected && vis(el)).forEach(el => { html += `<div class="xp-ring xp-ring--rel" style="${box(el.getBoundingClientRect())}"></div>`; });   // an audit row's uses
  rings.innerHTML = (svg ? `<svg class="xp-lines">${svg}</svg>` : '') + html;
  rings.classList.toggle('has-on', !!(an && (an.s || relsOf(an).length)));
}
async function run(fn){ X.busy++; try { await fn(); } catch (err) { console.warn('explain setup', err); } finally { setTimeout(() => X.busy--, 120); } }

async function open(ti){
  const id = X.on && EXP()[X.id] ? X.id : key(); if (!id || !EXP()[id]) return;   // stays on its entry even when a step left its route
  const tok = ++X.tok; mount(); lists();
  const c = CFG(), de = document.documentElement;
  if (c.accent) de.style.setProperty('--xp', c.accent);
  de.classList.toggle('xp-push', c.push !== false);
  X.on = true; X.id = id; X.form = null; X.copy = null;
  if (X.insp){ X.insp = false; X.ip = X.ih = null; de.classList.remove('xp-inspecting'); }
  X.hl = null;
  X.ti = Math.max(0, Math.min(ti, tops().length - 1)); X.act = X.hov = null;
  de.classList.add('xp-open'); de.classList.toggle('xp-mini', X.size === 'mini'); de.classList.toggle('xp-hide', X.size === 'hide');
  pane.hidden = X.size === 'hide';                               // a route change while hidden keeps it hidden
  render(); refreshBtn();
  const t = topic();
  if (t.setup && !(t.flag && !has(t.flag))){ await run(t.setup); if (tok !== X.tok) return; render(); }
  const chip = pane.querySelector('.xp__topics [aria-pressed="true"]'); if (chip) chip.scrollIntoView({ block:'nearest', inline:'center' });
  draw(); setTimeout(draw, 400);
}
function close(){
  X.on = false; X.tok++; setPick(false); X.form = null; X.insp = false; X.ip = X.ih = null; X.hl = null;
  if (X.size === 'hide') X.size = X.prev || 'full';             // the next open shows it again
  document.documentElement.classList.remove('xp-open', 'xp-inspecting', 'xp-mini', 'xp-hide'); pane.hidden = true; rings.innerHTML = ''; refreshBtn();
}
async function focusNote(i, toggle = true){
  const n = topic().notes[i]; if (!n) return;
  const step = n.setup || n._restore;
  X.act = toggle && X.act === i && !step ? null : i;
  if (X.size === 'mini') render();                               // the card shows the focused note
  pane.querySelectorAll('.xp__note').forEach(li => li.classList.toggle('is-on', +li.dataset.i === X.act));
  if (!toggle){ const li = pane.querySelector(`.xp__note[data-i="${i}"]`); if (li) li.scrollIntoView({ block:'nearest' }); }
  if (X.act != null && step){ const tok = ++X.tok; await run(step); if (tok !== X.tok) return; await wait(200); }
  const el = X.act != null && targets(n)[0];
  if (el){ const r = el.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight - 20) el.scrollIntoView({ block:'center', behavior:'smooth' }); }
  draw(); setTimeout(draw, 450);
}

/* ── + Note: pick a part of the screen, write a draft note on it ── */
const junk = c => /^(css|sc|jsx|svelte|emotion|chakra|ng|tw)-|^[a-z]{1,3}[0-9a-f]{5,}$|__[a-z0-9]{5}$|^(is|has)-|hover|active|focus/i.test(c);
/* ponytail: a strict child chain, anchored at the nearest usable id; brittle if wrappers change — the form shows the match count so it can be edited */
function selectorFor(el){
  const one = s => { try { const m = document.querySelectorAll(s); return m.length === 1 && m[0] === el; } catch { return false; } };
  const parts = [];
  for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement){
    let p;
    if (n.id && !/\d{3,}|:/.test(n.id)) p = '#' + CSS.escape(n.id);
    else {
      p = n.tagName.toLowerCase();
      const a = ['data-testid', 'data-test', 'data-qa', 'data-id', 'name', 'aria-label'].find(a => (n.getAttribute(a) || '').length && n.getAttribute(a).length < 40);
      p += a ? `[${a}="${n.getAttribute(a).replace(/["\\]/g, '\\$&')}"]` : [...n.classList].filter(c => !junk(c)).slice(0, 2).map(c => '.' + CSS.escape(c)).join('');
      const par = n.parentElement; let dup = false;
      if (par){ try { dup = par.querySelectorAll(':scope > ' + p).length > 1; } catch { dup = true; } }
      if (dup) p += `:nth-of-type(${[...par.children].filter(c => c.tagName === n.tagName).indexOf(n) + 1})`;
    }
    parts.unshift(p);
    const s = parts.join(' > ');
    if (one(s)) return s;
  }
  return parts.join(' > ');
}
function setPick(on){
  X.pick = on; X.ph = null;
  if (on && X.insp){ X.insp = false; X.ip = X.ih = null; document.documentElement.classList.remove('xp-inspecting'); }
  document.documentElement.classList.toggle('xp-picking', on);
  if (X.on){ render(); draw(); }
}
function startForm(el){
  const t = topic();
  X.form = { s: selectorFor(el), label: tag(el), v: ls.get('xp:lastv') || 'issue', lv: 'element', in: t.auto ? null : t.id };   // `in`: the topic whose state the note needs
  setPick(false);
}
const inPane = t => t && t.closest && t.closest('#xp, #xpRings, #xpBtn, #xpToast');
let rt = 0; const renderSoon = () => { clearTimeout(rt); rt = setTimeout(() => { if (X.on && X.insp && !X.ip) render(); }, 60); };
addEventListener('mousemove', e => { if (!X.pick && !X.insp) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || inPane(el)) return;
  if (X.insp){ if (el !== X.ih){ X.ih = el; draw(); renderSoon(); } }
  else if (el !== X.ph){ X.ph = el; draw(); } }, true);
['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'dblclick'].forEach(type => addEventListener(type, e => {
  if (!(X.pick || X.insp) || inPane(e.target)) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  if (type !== 'click') return;
  if (X.insp) return pin(X.ih || e.target);
  const el = X.ph || e.target; if (el && el !== document.body) startForm(el);
}, true));

/* ── copy, with a fallback for frames that refuse the clipboard ── */
async function copy(text, b){
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {}
  if (!ok){ const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px'; pane.append(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch {} ta.remove(); }
  if (!ok){ X.copy = text; render(); return; }
  if (b && b.isConnected){ const was = b.textContent; b.textContent = 'Copied'; setTimeout(() => { if (b.isConnected) b.textContent = was; }, 1400); }
}
function markdown(){
  const e = ex(), F = findings();
  const out = [`## Findings · ${strip(e.name)}`, `_${F.length} on this screen · exported ${today()}_`];
  FV().forEach(v => { const g = F.filter(f => f.n.v === v); if (!g.length) return;
    out.push('', `### ${(L.VL[v] || [v])[0]} (${g.length})`);
    g.forEach(f => { out.push(`- **${strip(f.n.t)}**${f.n.d ? ' — ' + strip(f.n.d) : ''}`);
      if (f.n.fix) out.push(`  ${e.fixL || 'Fix'}: ${strip(f.n.fix)}`);
      out.push(`  _${strip(f.tn)} · note ${f.i + 1}_${f.tn === 'Drafts' ? '' : ` · [open](${link(f.ti, f.i)})`}`); }); });
  return out.join('\n');
}
function code(){
  const name = id => { const t = ex().topics.find(t => t.id === id); return t ? strip(t.name) : id; };
  return [`/* Drafts · ${strip(ex().name)} · picked on the screen ${today()} — paste into a topic's notes */`,
    ...drafts().map(d => JSON.stringify({ s:d.s, t:d.t, v:d.v, lv:d.lv, d:d.d }) + ',' + (d.in ? `   // picked on “${name(d.in)}”` : ''))].join('\n');
}

/* ── wiring ── */
function build(){
  document.body.insertAdjacentHTML('beforeend', `<button class="xp-btn" id="xpBtn" hidden title="Explain the design (?)"><i>?</i><span></span> <small></small></button>
    <aside class="xp" id="xp" aria-label="Explain the design" hidden></aside><div class="xp-rings" id="xpRings"></div>`);
  btn = document.querySelector('#xpBtn'); pane = document.querySelector('#xp'); rings = document.querySelector('#xpRings');
  btn.querySelector('span').textContent = CFG().label || 'Explain';
  btn.addEventListener('click', () => open(0));
  pane.addEventListener('click', e => {
    if (e.target.closest('a, input, textarea, select, label')) return;
    const a = e.target.closest('[data-xp]'); if (!a) return;
    const k = a.dataset.xp, i = +a.dataset.i;
    if (k === 'close') return close();
    if (k === 'size') return setSize(a.dataset.k);
    if (k === 'hide') return setSize('hide');
    if (k === 'nstep'){ const n = topic().notes.length; if (!n) return; const d = +a.dataset.d;
      return focusNote(X.act == null ? (d > 0 ? 0 : n - 1) : (X.act + d + n) % n, false); }
    if (k === 'full'){ X.full = !X.full; ls.set('xp:full', X.full ? '1' : '0'); a.setAttribute('aria-pressed', X.full); pane.classList.toggle('is-full', X.full); return draw(); }
    if (k === 'topic') return open(i);
    if (k === 'prev') return open(X.ti - 1);
    if (k === 'next') return open(X.ti + 1);
    if (k === 'note') return focusNote(i);
    if (k === 'jump') return open(+a.dataset.ti).then(() => focusNote(i, false));
    if (k === 'link') return copy(link(+a.dataset.ti, i), a);
    if (k === 'md') return copy(markdown(), a);
    if (k === 'code') return copy(code(), a);
    if (k === 'pick'){ X.form = null; X.copy = null; return setPick(!X.pick); }
    if (k === 'cancel'){ X.form = null; render(); return draw(); }
    if (k === 'del'){ const d = drafts().slice(); d.splice(i, 1); saveDrafts(d); X.act = null; return open(d.length ? X.ti : 0); }
    if (k === 'go'){ CFG().show(ex().other); return setTimeout(sync, 60); }
    if (k === 'lens'){ X.lens = a.dataset.k; ls.set('xp:lens', X.lens); render(); return draw(); }
    if (k === 'sc'){ X.sci = +a.dataset.i; render(); return draw(); }
    if (k === 'jmd') return copy(judgedMD(), a);
    if (k === 'kmd') return copy(feedbackMD(), a);
    if (k === 'smd') return copy(suggestionsMD(), a);
    if (k === 'insp') return setInspect(!X.insp);
    if (k === 'ipick') return pin(X.cr[+a.dataset.n]);
    if (k === 'inote'){ const el = X.ip || X.ih; X.insp = false; X.ip = X.ih = null; document.documentElement.classList.remove('xp-inspecting'); if (el) startForm(el); return; }
    if (k === 'isel'){ const el = X.ip || X.ih; return el && copy(selectorFor(el), a); }
    if (k === 'bmd') return copy(deltaMD(), a);
    if (k === 'log') return copy(logMD(), a);
    if (k === 'tsv') return copy(logTSV(), a);
    if (k === 'amd') return X.aud && copy(auditMD(X.aud), a);
    if (k === 'audit'){ a.textContent = 'Reading…'; return setTimeout(() => { X.aud = { ...audit(), id:X.id }; X.hl = null; render(); draw(); }, 30); }
    if (k === 'hl'){ const g = X.aud && X.aud[a.dataset.g], x = g && g.find(x => x.k === a.dataset.k), f = x && x.els.find(vis);
      X.hl = x ? x.els : null; if (f){ const r = f.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) f.scrollIntoView({ block:'center' }); } return draw(); }
  });
  pane.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.xp__note, .xp__fi')){ e.preventDefault(); e.target.click(); }
  });
  pane.addEventListener('input', e => {
    if (!X.form || e.target.name !== 's') return;
    X.form.s = e.target.value; const n = all(X.form.s).length;
    pane.querySelector('[data-xp-count]').textContent = n === 1 ? '1 match' : n + ' matches'; draw();
  });
  pane.addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target), d = drafts().slice();
    d.push({ s: String(f.get('s')).trim() || null, t: String(f.get('t')).trim(), d: String(f.get('d')).trim(), v: f.get('v'), lv: f.get('lv'), in: X.form.in });
    ls.set('xp:lastv', f.get('v')); saveDrafts(d); X.form = null;
    open(ex().topics.length).then(() => focusNote(d.length - 1, false));   // Drafts sits right after the entry's own topics
  });
  pane.addEventListener('mouseover', e => { const li = e.target.closest('.xp__note'); const h = li ? +li.dataset.i : null; if (h !== X.hov){ X.hov = h; draw(); } });
  pane.addEventListener('mouseleave', () => { X.hov = null; draw(); });
  pane.addEventListener('pointerdown', e => {                    // drag the mini card by its header
    if (X.size !== 'mini' || !e.target.closest('[data-xp-drag]') || e.target.closest('button')) return;
    const r = pane.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    const move = ev => place(ev.clientX - dx, ev.clientY - dy);
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); ss.set('xp:pos', JSON.stringify(X.pos)); };
    addEventListener('pointermove', move); addEventListener('pointerup', up); e.preventDefault();
  });
  rings.addEventListener('click', e => { const b = e.target.closest('[data-xp="ring"]'); if (!b) return;
    const i = +b.dataset.i; focusNote(i); const li = pane.querySelector(`.xp__note[data-i="${i}"]`); if (li) li.scrollIntoView({ block:'nearest', behavior:'smooth' }); });
  /* the screen moved or changed: redraw when open, re-check the button always */
  let bt = 0;
  new MutationObserver(recs => {
    if (!recs.some(r => !rings.contains(r.target) && !pane.contains(r.target) && !btn.contains(r.target))) return;
    if (X.on) draw();
    clearTimeout(bt); bt = setTimeout(refreshBtn, 250);
  }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class', 'style', 'hidden', 'open', 'data-explain'] });
  refreshBtn();
  const q = new URLSearchParams(location.search).get('xp'), m = q && /^(\d+)(?:\.(\d+))?$/.exec(q);
  if (m) (async () => { await wait(0); if (CFG().deeplink === false) return;   // the host handles ?xp itself (read after a tick: its config may load after this file)
    for (let k = 0; k < 40 && !key(); k++) await wait(150);
    if (!key()) return; await open(+m[1] - 1); if (m[2]) focusNote(+m[2] - 1, false); })();
}
addEventListener('scroll', () => X.on && draw(), { passive:true, capture:true });   // capture: drawers and panes scroll inside themselves
addEventListener('resize', () => { if (!X.on) return; if (X.size === 'mini' && X.pos) place(X.pos[0], X.pos[1]); draw(); });
addEventListener('keydown', e => {
  if (X.pick && e.key === 'Escape'){ e.preventDefault(); return setPick(false); }
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '?' && (X.on || EXP()[key()])){ e.preventDefault(); return X.on ? (X.size === 'hide' ? unhide() : close()) : open(0); }
  if (!X.on || X.form) return;
  if (e.key === 'h' || e.key === 'H'){ e.preventDefault(); return X.size === 'hide' ? unhide() : setSize('hide'); }
  if (X.size === 'hide'){ if (e.key === 'Escape') close(); return; }   // hidden: the page gets every other key
  if (e.key === 'm' || e.key === 'M'){ e.preventDefault(); return setSize(X.size === 'mini' ? 'full' : 'mini'); }
  if (X.insp){
    if (e.key === 'Escape'){ e.preventDefault(); return X.ip ? pin(null) : setInspect(false); }
    const el = X.ip, sib = d => { let n = el; do n = d > 0 ? n.nextElementSibling : n.previousElementSibling; while (n && !vis(n)); return n; };
    const to = el && { ArrowUp: () => el.parentElement !== document.documentElement && el.parentElement, ArrowDown: () => [...el.children].find(vis),
      ArrowLeft: () => sib(-1), ArrowRight: () => sib(1) }[e.key];
    if (to){ e.preventDefault(); const n = to(); if (n && !inPane(n)) pin(n); return; }
    if (e.key === 'i' || e.key === 'I'){ e.preventDefault(); return setInspect(false); }
    if (/^Arrow/.test(e.key)) return;                             // no topic stepping while inspecting
  }
  if (e.key === 'i' || e.key === 'I'){ e.preventDefault(); return setInspect(true); }
  if (e.key === 'Escape') return close();
  if (e.key === 'ArrowRight'){ e.preventDefault(); return open(X.ti + 1); }
  if (e.key === 'ArrowLeft'){ e.preventDefault(); return open(X.ti - 1); }
  const n = topic().notes.length;
  if (n && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){ e.preventDefault();
    return focusNote(X.act == null ? (e.key === 'ArrowDown' ? 0 : n - 1) : (X.act + (e.key === 'ArrowDown' ? 1 : -1) + n) % n, false); }
});

/* follow the page: hash, back/forward, pushState routers, and hosts that say so */
function sync(){
  if (!btn) return;
  refreshBtn();
  if (!X.on) return;
  if (X.busy) return draw();                                    // a step's setup is moving the screen on purpose
  const k = key();
  if (k === X.id) return draw();
  if (!k) return close();
  const tid = topic().id; X.id = k;
  open(Math.max(0, ex().topics.findIndex(t => t.id === tid)));
}
let lt = 0; const later = () => { clearTimeout(lt); lt = setTimeout(sync, 80); };
['pushState', 'replaceState'].forEach(m => { const f = history[m]; history[m] = function(){ const r = f.apply(this, arguments); later(); return r; }; });
['hashchange', 'popstate', 'explain:change'].forEach(t => addEventListener(t, later));
addEventListener('load', () => btn && refreshBtn());
if (document.body) build(); else addEventListener('DOMContentLoaded', build);   // injected at document start

/* helpers for content files' setups */
const click = async (s, ms = 250) => { const el = typeof s === 'string' ? document.querySelector(s) : s; if (!el) return false;
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); el.click(); await wait(ms); return true; };
async function go(to, ms = 500){                                 // '#/route' sets the hash; '/path' pushes a route (React Router, Vue Router … listen to popstate)
  if (to[0] === '#'){ if (location.hash !== to) location.hash = to; else dispatchEvent(new HashChangeEvent('hashchange')); }
  else { history.pushState(null, '', to); dispatchEvent(new PopStateEvent('popstate')); }
  await wait(ms);
}
window.XP = { wait, click, go, has, $: s => document.querySelector(s), $$: s => [...document.querySelectorAll(s)] };
window.__xp = { open: ti => { unhide(); return open(ti); }, close, focus: i => focusNote(i, false), key, sync, state: () => ({ ...X }), draw: paint, selectorFor,
  size: s => setSize(s),                                         // 'full' · 'mini' · 'hide'
  get TRAITS(){ return TRAITS; },
  judge: (id, si) => { const e = EXP()[id || key()], sc = scenarios(e)[si || 0]; if (!sc) return null;
    return judged(e, sc).rows.map(r => ({ t:strip(r.n.t), topic:r.tn, k:r.j.k, F:r.j.F, A:r.j.A })); },
  get P(){ return lists().P; }, get VL(){ return lists().VL; }, get LV(){ return lists().LV; }, get BV(){ return BV; }, get KIND(){ return KIND; },
  inspect: on => setInspect(on !== false), pin: s => pin(typeof s === 'string' ? document.querySelector(s) : s),
  measure: s => { const el = typeof s === 'string' ? document.querySelector(s) : s; return el ? measure(el) : null; },
  name: s => { const el = typeof s === 'string' ? document.querySelector(s) : s; return el ? crumbs(el).map(([n, c]) => c ? c.t : tag(n)) : null; },
  lens: k => { X.lens = k; if (X.on){ render(); draw(); } },
  audit: () => { const A = audit(); return { seen:A.seen, said:A.said.map(x => [x.k, x.n]), type:A.type.map(x => [x.k, x.n, x.rule || null]), space:A.space.map(x => [x.k, x.n, x.ok]),
    color:A.color.map(x => [x.k, x.n, x.tok || null, x.rule || null]) }; },
  topics: () => X.on ? tops().map(t => ({ id:t.id, name:t.name, auto:t.auto || null, notes:t.notes.length })) : null,
  targets: (ti, i) => targets((tops()[ti].notes || [])[i]).length, rels: (ti, i) => relsOf((tops()[ti].notes || [])[i]).map(([s]) => all(s).length) };
})();
