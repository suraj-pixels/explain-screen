/* ═══ EXPLAIN · Approvals demo — the notes (the engine is ../explain.js) ═══════
   Two entries: v2 (the design) and v1 (the version it replaced). Topic ids match
   across them, so Compare lands on the same topic. Every setup starts from
   DEMO.reset(), so a topic always shows the screen as reviewed, whatever was
   clicked before. A note: s selector · t title · v verdict · lv level · d decision
   (one line) · w why · alt instead of · g works · b costs · rel · p · fix · was · ref */
(() => {
const E = window.EXPLAIN || (window.EXPLAIN = {});
const reset = () => DEMO.reset();
const row = id => `.row[data-id="${id}"]`;

E['approvals'] = { name:'Approvals · v2', short:'v2', other:'approvals-v1', otherL:'Compare with', prevL:'The review',
  /* the lenses: what is live today, the system the values are judged by, and the parts' names for Inspect */
  base:{ name:'Live today (v1)', short:'Live', dflt:'same',
    removed:[{ t:'“Approve this claim?” on every approve', d:'Approving happens at once, with Undo in the toast.', w:'A confirm that routine is clicked through unread.', p:['confirm'] }] },
  rules:{
    type:{ '24':'Title — one per screen', '15/600':'Names — who is asking, read first', '14':'Body and purpose', '12':'Labels and table heads' },
    space:{ v:[4, 8, 12, 16, 20, 24, 32], why:'On the 4-point spacing scale' },
    color:{ '--act':'Indigo = act', '--warn':'Amber = needs a look', '--warn-dot':'Amber = needs a look', '--bad':'Red = blocked', '--bad-dot':'Red = blocked',
      '--ok':'Green = ready', '--ok-dot':'Green = ready' },
    radius:{ '8':'Controls and panels', '99':'Counts and badges' } },
  anatomy:[['.top', 'Top bar', 'section'], ['.top nav', 'Tabs', 'group'], ['main', 'Page', 'screen'], ['.head', 'Header', 'section'], ['.bar', 'Toolbar', 'section'],
    ['.search', 'Search', 'component'], ['.seg', 'Status filter', 'component'], ['.seg button', 'Status option', 'element'], ['.sort', 'Sort', 'component'],
    ['.list', 'Claims list', 'section'], ['.row.th', 'Column heads', 'group'], ['.row:not(.th)', 'Claim row', 'group'], ['.row .ck', 'Select', 'element'], ['.row .av', 'Avatar', 'element'],
    ['.row .who b', 'Name', 'element'], ['.row .who span', 'Purpose', 'element'], ['.row .amt', 'Amount', 'element'], ['.row time', 'Date', 'element'],
    ['.row .st', 'Status', 'element'], ['#bulk', 'Bulk approve', 'component'], ['.sheet', 'Claim sheet', 'section']],
  topics:[

  { id:'anatomy', name:'The screen', setup:reset,
    intro:'What a manager sees on Monday morning: how much is waiting, what it adds up to, and the one thing to do about it.', notes:[
    { s:'.head', t:'Title, then what is waiting', v:'keep', lv:'section',
      d:'One line under the title answers the two questions a manager arrives with: how many, and how much money.',
      w:'The count sets the size of the job and the total sets its weight. Both are read before any row, so they sit where the eye lands first.',
      alt:'A row of KPI tiles (waiting, approved this month, average time to approve). Tiles take a third of the screen for numbers nobody acts on here.',
      b:'Month-level numbers move to Reports; a manager who wants them is one tab away.',
      p:['status', 'minimalist', 'hierarchy'], rel:[['.top nav a.is-on', 'same count on the tab']] },
    { s:'.bar', t:'Find, narrow, order', v:'keep', lv:'section',
      d:'Search, then status, then sort — left to right in the order people narrow a list.',
      w:'Search is for the claim you already have in mind; status is the everyday narrowing; sort is rarely touched, so it goes last and furthest right.',
      p:['filters', 'scanning'] },
    { s:'.list', t:'The list is the screen', v:'keep', lv:'section',
      d:'Rows take the full width; a claim opens beside the list, never instead of it.',
      w:'Approving is triage: scan many, open few. A side sheet keeps your place in the list while you read one claim.',
      alt:'Cards in a grid — slower to scan down, and the amounts stop lining up.',
      p:['scanning', 'm3side'] },
    { s:'#bulk', t:'One primary button', v:'keep', lv:'component',
      d:'The only filled button on the page, greyed until something is ticked.',
      w:'The one thing that differs is the one noticed; spending the strong colour on a single action tells the eye where the work ends.',
      alt:'An always-on “Approve all” — one slip pays out claims nobody read.',
      b:'Greyed buttons are easy to miss; the label says what to do (“Approve 2 selected”) as soon as it wakes up.',
      p:['restorff', 'hierarchy', 'prevent'] },
    { s:'.top nav a.is-on', t:'Where you are', v:'existing', lv:'system',
      d:'The product’s own tabs, with the waiting count on Approvals, seen from every page.',
      w:'Navigation stays in the same place and order across the product; the badge makes waiting work visible from anywhere.',
      p:['w_consnav', 'status'] }
  ]},

  { id:'row', name:'A claim row', setup:reset,
    intro:'The closed claim. Five parts, read left to right: select · who · when · how much · is it fine.', notes:[
    { s:row('c1') + ' .who b', t:'The person first', v:'keep', lv:'element',
      d:'Name in bold, purpose under it — who is asking is the first thing a manager decides on.',
      w:'Managers know their people. The name tells them how closely to read before the amount does, and people scan the first words of a line.',
      alt:'Purpose first (“Client dinner”) — five rows of Taxi, Hotel, Train say nothing about whose they are.',
      p:['scanning', 'hierarchy'], rel:[[row('c1') + ' .who span', 'purpose, one level down']] },
    { s:row('c1') + ' .amt', t:'Amounts line up on the right', v:'keep', lv:'element',
      d:'Right-aligned, tabular figures, always two decimals.',
      w:'Money is compared, not read. Aligned decimal points let the eye find the big one (£312.00) without reading each figure.',
      p:['scanning', 'consistency'] },
    { s:row('c1') + ' .st', t:'Status: a dot and a word', v:'change', lv:'element',
      d:'The word carries the meaning; the dot only speeds it up.',
      w:'Colour is never the only signal, so the status survives colour-blindness, greyscale printouts and a glance.',
      alt:'Filled pills (v1) — five saturated pills in a column out-shout the names beside them.',
      was:'Filled colour pills with white text.', bv:'changed', bw:'Filled colour pills with white text.', p:['w_color', 'indicators', 'attention'],
      rel:[['.row:not(.th) .st', 'same grammar on every row']] },
    { s:row('c1') + ' time', t:'One date rule', v:'change', lv:'element',
      d:'“12 Sep” for any other day, the time for today; the full date in the tooltip.',
      w:'One format for every date, short enough to scan. Today is the only day where the hour matters.',
      alt:'12/09/2026 (v1) — longer, and 12/09 is 9 December to anyone who reads dates month-first.',
      was:'12/09/2026 on every row.', bv:'changed', bw:'12/09/2026 on every row.', ref:'Gmail’s message list', p:['consistency', 'cogload'],
      rel:[[row('c5') + ' time', 'today → the time']] },
    { s:row('c1') + ' .ck', t:'A checkbox that is easy to hit', v:'keep', lv:'element',
      d:'Its own 32 px cell at the left edge, so ticking never opens the claim.',
      b:'Two targets in one row: a click a few pixels off opens the claim instead of ticking it.',
      p:['w_target', 'fitts'] },
    { s:row('c1'), t:'The whole row opens the claim', v:'keep', lv:'group',
      d:'The row is the button, with a hover tint as its signifier.',
      st:{ hover:'a pale indigo tint', open:'the tint stays while its sheet is open', ticked:'checkbox on, row unchanged' },
      a11y:'Click only today — see Found in review.',
      w:'The biggest target there can be, the way a mail list works.',
      alt:'A “View” link at the end of each row — a small, far target and one more word per row.',
      p:['fitts', 'signifiers', 'jakob'] }
  ]},

  { id:'bar', name:'Toolbar', setup:reset,
    intro:'Three controls, three different jobs. Each control type was picked for how many options it holds and how often it changes.', notes:[
    { s:'.search', t:'Search with a real label', v:'keep', lv:'component',
      d:'A magnifier and a hidden label name it; the placeholder gives an example, not the label.',
      b:'The label is invisible to sighted users. That holds for search, which people know by its shape — not for other fields.',
      p:['placeholders', 'w_labels'] },
    { s:'.seg', t:'Status as a segmented control', v:'change', lv:'component',
      d:'Four statuses, all visible, one at a time, each with its count.',
      q:'How does a manager narrow the list to one status?',
      w:'Few options that exclude each other: show them all. The counts answer “is anything sent back?” without a click.',
      alt:'A drop-down “Status: Waiting ▾” (v1) — saves 200 px, costs a click and hides the counts.',
      was:'A drop-down.', bv:'changed', bw:'“Status: Waiting ▾”, a drop-down with no counts.', p:['checkradio', 'listbox', 'm3seg'] },
    { s:'#sort', t:'Oldest first by default', v:'keep', lv:'component',
      d:'The default order is the fairest one: whoever has waited longest is on top.',
      w:'Most people never change a sort, so the default decides who is paid first. Oldest first stops a claim sinking under new ones.',
      alt:'Newest first, like an inbox — the claim from 12 Sep would sit at the bottom for another week.',
      p:['defaults'] }
  ]},

  { id:'review', name:'Review a claim', setup:reset,
    intro:'The path through one claim. Each step sets the screen up itself — press ↓ to walk it.',
    before:{ steps:[['Open the claim', 'click'], ['Check it against the policy yourself', 'read'], ['Approve', 'click'], ['Confirm “Approve this claim?”', 'modal']] }, notes:[
    { s:row('c1'), t:'Open Priya’s claim', v:'keep', lv:'step', k:'click', setup:reset,
      d:'A click opens the claim in a side sheet; the list stays where it was.',
      alt:'A page of its own — Back loses the scroll position and any ticks.',
      p:['m3side', 'modal'] },
    { s:'#shChecks', t:'The policy check does the reading', v:'new', lv:'step', k:'read', setup:() => { reset(); DEMO.open('c1'); },
      d:'The sheet says what is wrong in plain words and in money: over the meals limit by £36.40.',
      w:'The manager shouldn’t need the policy by heart. The system checks it and names the gap.',
      p:['cogload', 'recognition', 'tesler'], rel:[['#shReceipt', 'the evidence']] },
    { s:'#shErr', t:'Sending back needs a reason', v:'new', lv:'step', k:'click', setup:() => { reset(); DEMO.open('c1'); DEMO.sendBack(); },
      d:'Send back without a note shows the error at the field, in words that say what to write.',
      w:'A claim sent back without a reason comes straight back unchanged.',
      p:['prevent', 'formerrors', 'w_errid', 'w_errsug'], rel:[['#shNote', 'the field it’s about']] },
    { s:'#toast', t:'Approve, then Undo — no “Are you sure?”', v:'change', lv:'step', k:'click', setup:() => { reset(); DEMO.open('c2'); DEMO.approve('c2'); },
      d:'Approving happens at once and offers Undo.',
      w:'A manager approves dozens of claims a week. Confirms that routine get clicked through unread; Undo protects the rare mistake without taxing every approval.',
      alt:'A confirm dialog on every approve (v1).', was:'“Approve this claim?” every time.',
      b:'Undo only lasts 8 seconds — see Found in review.',
      p:['confirm', 'control', 'w_statusmsg'] },
    { s:'#empty', t:'Nothing waiting', v:'keep', lv:'step', setup:() => { reset(); DEMO.decide(['c1', 'c2', 'c3', 'c4', 'c5'], 'approved'); document.querySelector('#toast').hidden = true; },
      d:'The empty list says why it is empty, what happens next, and where the approved ones went.',
      p:['empty', 'peakend'] }
  ]},

  { id:'system', name:'System', setup:reset,
    intro:'Rules that hold across the whole product, not just this screen.', notes:[
    { s:row('c1') + ' .st i', t:'One meaning per colour', v:'keep', lv:'system',
      d:'Indigo = act, amber = needs a look, red = blocked, green = ready. Nothing else is coloured.',
      w:'When each colour means one thing, people learn it once. A decorative colour would teach them to ignore colour.',
      p:['consistency', 'restorff'], rel:[['#bulk', 'indigo = act'], ['.top nav a.is-on b', 'indigo = act']] },
    { s:'.head h1', t:'A small type scale', v:'keep', lv:'system',
      d:'Four sizes: 24 title, 15 names, 14 body, 12 labels. Weight, not size, separates a name from its purpose.',
      p:['hierarchy', 'visual'], rel:[[row('c1') + ' .who b', '15 / 600'], [row('c1') + ' .who span', '14 / 400'], ['.row.th', '12 / 600']] },
    { s:null, t:'Every person has one name', v:'keep', lv:'system',
      d:'“Priya Nair” in the row, “Priya” in buttons and messages — never a username or an email.',
      p:['consistency', 'w_consid'] }
  ]},

  { id:'found', name:'Found in review', setup:reset,
    intro:'What the review found. None of these is fixed yet — each one is a decision to make.', notes:[
    { s:'#bulk', t:'Bulk approve skips the policy check', v:'issue', lv:'component', setup:() => { reset(); DEMO.select(['c1', 'c2']); },
      d:'Tick Priya’s over-policy claim with Tom’s and “Approve 2 selected” pays both.',
      fix:'Bulk approve takes Ready claims only and says what it left: “Approve 1 · 1 over policy needs a look”.',
      p:['prevent'] },
    { s:row('c1'), t:'Rows can’t be opened from the keyboard', v:'issue', lv:'group',
      d:'The row opens on click only; Tab goes from checkbox to checkbox and never reaches the claim.',
      fix:'Make the name a real link or button that opens the sheet; the row click stays as the shortcut.',
      p:['w_keyboard', 'w_nrv'] },
    { s:'#toast', t:'Undo disappears while you read it', v:'issue', lv:'component', setup:() => { reset(); DEMO.open('c2'); DEMO.approve('c2'); },
      d:'The toast closes after 8 seconds, even when hovered or focused.',
      fix:'Pause the timer on hover and focus, and keep an Undo on the claim in Approved for a day.',
      p:['w_timing', 'w_hover'] },
    { s:'.seg', t:'Does “Sent back” need a tab?', v:'question', lv:'component',
      d:'A claim sent back is the claimant’s to fix; the manager may never look there.' },
    { s:null, t:'Show the claimant’s month so far?', v:'question', lv:'screen',
      d:'A £38.90 taxi reads differently when it is the ninth this month.' },
    { s:row('c1') + ' time', t:'Say how long a claim has waited', v:'propose', lv:'element',
      d:'After 14 days, add the wait beside the date: “12 Sep · 17 days”.',
      p:['zeigarnik', 'status'] }
  ]}
]};

/* Judged: the same screen for two companies. What the designer brought back from each — the users' pain points,
   the stakeholders' direction, the principles they won't trade — and which decisions answer them. */
E['approvals'].scenarios = [
  { id:'finance', name:'A finance team', who:'Six managers clear 40–60 claims every Monday. Claims run up to £5,000 and are paid out on approval.',
    task:'Clear the week’s claims by lunch without paying anything over policy.', traits:['expert', 'daily', 'desktop', 'high-stakes', 'dense'],
    pains:[{ id:'overpay', t:'Over-policy claims get paid, because nobody checks every rule by hand' },
      { id:'monday', t:'Monday takes the whole morning: every claim is opened one by one' },
      { id:'why', t:'Claimants don’t know why a claim came back to them' }],
    direction:[{ id:'check', t:'Finance director: nothing is paid out without a policy check (audit requirement)' },
      { id:'fast', t:'Head of operations: approvals should take minutes, not a morning' }],
    critical:['prevent', 'w_contrast', 'w_keyboard'] },
  { id:'startup', name:'A 12-person startup', who:'The founder approves a few small claims a week, between other work.',
    task:'Approve the week’s claims in a couple of minutes.', traits:['occasional', 'low-stakes', 'desktop', 'novice'],
    pains:[{ id:'forget', t:'Claims wait for weeks, because approving is easy to forget' },
      { id:'monday', t:'Every claim has to be opened to be sure it’s fine' }],
    direction:[{ id:'simple', t:'Founder: as simple as a to-do list' }],
    critical:['w_contrast', 'w_keyboard'] }
];
/* what reviewers said about v1, and (fb on the notes below) where v2 answers it — the phone request isn't answered yet */
E['approvals'].feedback = [
  { id:'loud', t:'The status pills shout louder than the people’s names', by:'Design review', date:'12 Sep', on:'v1' },
  { id:'confirm', t:'Clearing 40 claims means 40 “Are you sure?” dialogs', by:'Finance team', date:'15 Sep', on:'v1' },
  { id:'sentback', t:'Nobody sees a claim was sent back until they open the status menu', by:'Support', date:'15 Sep', on:'v1' },
  { id:'dates', t:'12/09 reads as 9 December to the US office', by:'US office', date:'16 Sep', on:'v1' },
  { id:'phone', t:'Managers want to approve from their phone on the way in', by:'Head of operations', date:'18 Sep', on:'v1' }
];
const JU = {                                                     // the pains a decision answers, the direction it follows, the feedback it answers, what it is in tension with
  'Title, then what is waiting':{ pain:['forget'] }, 'Find, narrow, order':{ pain:['monday'] }, 'The list is the screen':{ pain:['monday'] },
  'One primary button':{ pain:['monday'], dir:['fast', 'simple'], x:['prevent'] },
  'Status: a dot and a word':{ pain:['overpay'], fb:['loud'] }, 'One date rule':{ fb:['dates'] }, 'Status as a segmented control':{ fb:['sentback'] },
  'Oldest first by default':{ pain:['forget'] },
  'The policy check does the reading':{ pain:['overpay'], dir:['check'] }, 'Sending back needs a reason':{ pain:['why'] },
  'Approve, then Undo — no “Are you sure?”':{ dir:['fast', 'simple'], fb:['confirm'], x:['prevent', 'w_timing'] }
};
E['approvals'].topics.forEach(t => t.notes.forEach(n => Object.assign(n, JU[n.t] || {})));

E['approvals-v1'] = { name:'Approvals · v1 (before)', short:'v1', other:'approvals', otherL:'See it in', topics:[
  { id:'row', name:'A claim row', setup:reset,
    intro:'The row as it was, and what the review said about it.', notes:[
    { s:row('c1') + ' .st', t:'Filled status pills', v:'existing', lv:'element',
      d:'Saturated pills with white text, one per row.',
      b:'Five loud pills in a column pull the eye away from the names — the part a manager decides on.',
      fix:'v2: a dot and a word, in the text colour of the status.', p:['attention', 'restorff'] },
    { s:row('c1') + ' time', t:'Numeric dates', v:'existing', lv:'element',
      d:'12/09/2026 on every row.',
      b:'Ten characters to say what “12 Sep” says in six, and ambiguous between day-first and month-first readers.',
      fix:'v2: “12 Sep”, or the time for today.', p:['cogload'] }
  ]},
  { id:'bar', name:'Toolbar', setup:reset,
    intro:'The toolbar as it was.', notes:[
    { s:'.sel', t:'Status in a drop-down', v:'existing', lv:'component',
      d:'“Status: Waiting ▾” hides the other three statuses and their counts.',
      b:'Nobody sees that a claim was sent back until they open the menu.',
      fix:'v2: a segmented control with counts.', p:['listbox', 'recognition'] }
  ]},
  { id:'review', name:'Review a claim', setup:reset,
    intro:'The approve step as it was.', notes:[
    { s:'#dlg > div', t:'“Approve this claim?” every time', v:'existing', lv:'step', setup:() => { reset(); DEMO.open('c2'); DEMO.approve('c2'); },
      d:'A modal confirm on every approve.',
      b:'Dozens a week, so it is clicked through without reading — it protects nothing and costs a click each time.',
      fix:'v2: approve at once, with Undo.', p:['confirm', 'modal', 'hig_modal'] }
  ]}
]};
})();
