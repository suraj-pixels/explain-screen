/* Explain · check the notes, or present them on a live app (explain-screen skill). Copy as it is.

   node xp.mjs check <url|file> [--cdp PORT] [--inject a.css,b.js,…] [--only T[:N]] [--shots DIR] [WxH]
     Opens the page (headless; with --cdp, a new tab in the real signed-in window) and, for every entry
     it can put on screen (the current one, plus the ones EXPLAIN_CONFIG.show reaches), opens every topic,
     runs every note — plain notes first, then step notes in order — and reports:
     rings and relations that land on nothing, unknown verdicts / levels / principle ids, a panel that
     isn't on top, and page errors. Notes without a one-line decision (d) are counted, not failed.
     --only 3 (or 3:5) opens topic 3, focuses note 5, saves one shot and stops. Exit 1 on any miss.

   node xp.mjs open <url|file> --inject explain.css,explain.js,screen.xp.js [--cdp PORT] [--xp 3.2]
     For an app you can't edit (staging, QA, production): opens it in a new tab with Explain injected
     into every page load of that tab, and stays attached until the tab closes or Ctrl+C.
     With --cdp it uses the real-window-verify window, so the app is already signed in.
     Injection is read-only: nothing is sent anywhere, and closing the tab removes it.

   A local file opens as file://. WxH (e.g. 1440x900) sets the viewport; default 1440x900 headless,
   the real window's size with --cdp. Playwright is the global install (npm i -g playwright). */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const argv = process.argv.slice(2), cmd = argv[0];
const VALUED = ['cdp', 'inject', 'only', 'shots', 'xp'];
const opt = n => { const i = argv.indexOf('--' + n); return i > 0 ? argv[i + 1] : null; };
const target = argv.find((a, i) => i > 0 && !a.startsWith('--') && !/^\d+x\d+$/.test(a) && !VALUED.includes((argv[i - 1] || '').slice(2)));
const size = argv.find(a => /^\d+x\d+$/.test(a));
if (!['check', 'open'].includes(cmd) || !target){
  console.error('Usage: node xp.mjs check <url|file> [--cdp PORT] [--inject files] [--only T[:N]] [--shots DIR] [WxH]\n       node xp.mjs open <url|file> --inject files [--cdp PORT] [--xp T.N]');
  process.exit(2);
}
const file = target.split(/[?#]/)[0];
const url = existsSync(file) ? pathToFileURL(path.resolve(file)).href + target.slice(file.length) : target;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* the browser: the real window over CDP (own tab), or a headless one */
const port = opt('cdp');
const browser = port
  ? await chromium.connectOverCDP(`http://127.0.0.1:${port}`).catch(() => { console.error(`Nothing on port ${port}. Start the window first (real-window-verify: node .auth/launch.mjs).`); process.exit(1); })
  : await chromium.launch({ headless: cmd === 'check' });
const [w, h] = (size || '1440x900').split('x').map(Number);
const context = port ? browser.contexts()[0] : await browser.newContext({ viewport: { width: w, height: h } });
const page = await context.newPage();                          // own tab: the user's tabs and other sessions stay untouched
if (port && size) await page.setViewportSize({ width: w, height: h });

/* --inject: the engine, its css and the notes, into every document this tab loads (top frame only) */
for (const f of (opt('inject') || '').split(',').filter(Boolean)){
  const text = readFileSync(f, 'utf8');
  const js = f.endsWith('.css')
    ? `(css => { const add = () => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); };
         document.head ? add() : document.addEventListener('DOMContentLoaded', add); })(${JSON.stringify(text)});`
    : text;
  await page.addInitScript({ content: `if (window === window.top) {\n${js}\n}` });
}

const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|favicon/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1200);

/* ── open: present on the live app ── */
if (cmd === 'open'){
  const xp = /^(\d+)(?:\.(\d+))?$/.exec(opt('xp') || '');
  const ok = await page.evaluate(() => !!(window.__xp && __xp.key()));
  console.log(ok ? 'Explain is on this page: the button sits bottom right (or press ?).' : 'Explain loaded, but no entry matches this page yet — check the entry’s match / data-explain.');
  if (ok && xp){ await page.evaluate(t => __xp.open(t), +xp[1] - 1); if (xp[2]){ await page.waitForTimeout(700); await page.evaluate(i => __xp.focus(i), +xp[2] - 1); } }
  console.log('Attached. Close the tab or press Ctrl+C to stop.');
  await new Promise(r => { page.on('close', r); process.on('SIGINT', r); });
  await browser.close().catch(() => {});
  process.exit(0);
}

/* ── check ── */
const shots = opt('shots');
if (shots) mkdirSync(shots, { recursive: true });
async function shot(name){
  const p = path.join(shots || '.', name + '.png');
  await page.bringToFront(); await sleep(300); await page.evaluate(() => __xp.draw()); await sleep(120);
  await page.screenshot({ path: p }); console.log('  shot', p);
}
const start = await page.evaluate(() => {
  if (!window.__xp) return { none: 'explain.js is not on the page' };
  const k = __xp.key(), E = window.EXPLAIN || {};
  if (!k) return { none: `no entry matches this page (entries: ${Object.keys(E).join(', ') || 'none'})` };
  const more = window.EXPLAIN_CONFIG && EXPLAIN_CONFIG.show ? Object.keys(E).filter(id => id !== k) : [];
  return { k, ids: [k, ...more] };
});
if (start.none){ console.log('✗ ' + start.none); await page.close(); await browser.close(); process.exit(1); }

const only = opt('only');
if (only){
  const [t, n] = only.split(':').map(Number);
  await page.evaluate(ti => __xp.open(ti), t - 1); await page.waitForTimeout(900);
  if (n){ await page.evaluate(i => __xp.focus(i), n - 1); await page.waitForTimeout(800); }
  await shot(`${start.k}-${t}${n ? '-' + n : ''}`);
  if (errs.length) console.log('page errors:\n  ' + [...new Set(errs)].join('\n  '));
  await page.close(); await browser.close(); process.exit(0);
}

let fails = 0;
for (const id of start.ids){
  const on = await page.evaluate(async id => {
    if (__xp.key() !== id){ __xp.close(); EXPLAIN_CONFIG.show(id); await new Promise(r => setTimeout(r, 400)); }
    return __xp.key() === id;
  }, id);
  if (!on){ console.log(`· ${id}: not reachable from this page — check it on its own page`); continue; }
  const info = await page.evaluate(id => {
    const e = EXPLAIN[id], bad = [], V = {}, L = {}, B = {}, P = new Set(); let nod = 0, steps = 0, rels = 0;
    const F = (window.EXPLAIN_CONFIG && EXPLAIN_CONFIG.findings) || ['issue', 'question', 'propose'];
    if (e.base){ if (!e.base.name) bad.push('base: no name'); if (e.base.dflt && !__xp.BV[e.base.dflt]) bad.push('base: unknown dflt ' + e.base.dflt);
      (e.base.removed || []).forEach((x, i) => { if (!x.t) bad.push(`base.removed #${i + 1}: no title`); (x.p || []).forEach(p => { if (!__xp.P[p]) bad.push(`base.removed #${i + 1}: unknown principle ${p}`); }); }); }
    e.topics.forEach(t => {
      if (t.before) (t.before.steps || []).forEach((s, i) => { const k = Array.isArray(s) && s[1]; if (k && !__xp.KIND[k]) bad.push(`${t.name} before #${i + 1}: unknown kind ${k}`); });
      t.notes.forEach((n, i) => {
      const at = `${t.name} #${i + 1} “${String(n.t).replace(/<[^>]+>/g, '')}”`;
      if (!n.t) bad.push(at + ': no title');
      if (!__xp.VL[n.v]) bad.push(at + ': unknown verdict ' + n.v);
      if (n.lv && !__xp.LV[n.lv]) bad.push(at + ': unknown level ' + n.lv);
      if (n.bv && !__xp.BV[n.bv]) bad.push(at + ': unknown bv ' + n.bv);
      const SCx = e.scenarios || (window.EXPLAIN_CONFIG || {}).scenarios || [], has = (key, id) => SCx.some(s => (s[key] || []).some(x => x.id === id));
      (n.fb || []).forEach(id => { if (!(e.feedback || []).some(f => f.id === id)) bad.push(at + ': cites unknown feedback ' + id); });
      (n.pain || []).forEach(id => { if (!has('pains', id)) bad.push(at + ': unknown pain ' + id); });
      (n.dir || []).forEach(id => { if (!has('direction', id)) bad.push(at + ': unknown direction ' + id); });
      if (n.k && !__xp.KIND[n.k]) bad.push(at + ': unknown step kind ' + n.k);
      [...(n.p || []), ...(n.x || [])].forEach(p => { if (!__xp.P[p]) bad.push(at + ': unknown principle ' + p); P.add(p); });
      V[n.v] = (V[n.v] || 0) + 1; L[n.lv || '—'] = (L[n.lv || '—'] || 0) + 1;
      if (e.base && !F.includes(n.v) && n.lv !== 'step' && !n.setup){ const b = n.bv || e.base.dflt || 'added'; B[b] = (B[b] || 0) + 1; }
      if (!n.d) nod++; if (n.setup) steps++; if (n.rel) rels++;
    }); });
    const SC = e.scenarios || (window.EXPLAIN_CONFIG || {}).scenarios || [];
    SC.forEach((s, i) => { if (!s.name) bad.push(`scenario #${i + 1}: no name`);
      (s.traits || []).forEach(t => { if (!__xp.TRAITS[t]) bad.push(`scenario “${s.name}”: unknown trait ${t}`); });
      Object.keys(s.weights || {}).forEach(k => { if (!__xp.P[k]) bad.push(`scenario “${s.name}”: weight on unknown principle ${k}`); }); });
    const JU = SC.map((s, i) => { const r = __xp.judge(id, i) || [], c = {}; r.forEach(x => { c[x.k] = (c[x.k] || 0) + 1; }); return s.name + ' ' + JSON.stringify(c); });
    const A = [...((window.EXPLAIN_CONFIG || {}).anatomy || []), ...(e.anatomy || [])], an = A.filter(([s]) => { try { return document.querySelector(s); } catch { return false; } }).length;
    return { name: e.name, bad, V, L, B, JU, base: e.base && e.base.name, an, anT: A.length, P: P.size, nod, steps, rels, total: e.topics.reduce((a, t) => a + t.notes.length, 0),
      topics: e.topics.map(t => ({ id: t.id, name: t.name, flag: t.flag, notes: t.notes.map(n => ({ t: String(n.t).replace(/<[^>]+>/g, ''), s: !!n.s, step: !!n.setup, rel: !!n.rel })) })) };
  }, id);
  console.log(`\n${info.name}  [${id}]  ${info.topics.length} topics · ${info.total} notes · ${info.steps} steps · ${info.rels} with relations · ${info.P} principles`);
  console.log('  verdicts', JSON.stringify(info.V), ' levels', JSON.stringify(info.L), info.nod ? ` · ${info.nod} without d` : '');
  if (info.base) console.log(`  vs ${info.base}`, JSON.stringify(info.B));
  info.JU.forEach(s => console.log('  judged for ' + s));
  if (info.anT) console.log(`  anatomy: ${info.an} of ${info.anT} parts on screen in the default state`);
  /* the lenses themselves: inspect a ringed part, audit the screen — any throw is a miss */
  const lens = await page.evaluate(async () => { try {
    await __xp.open(0);
    const el = [...document.querySelectorAll('body *')].find(n => !n.closest('#xp, #xpRings, #xpBtn') && n.getClientRects().length && !n.children.length && n.textContent.trim());
    __xp.inspect(true); if (el) __xp.pin(el); const m = el ? __xp.measure(el) : null, path = el ? __xp.name(el) : null; __xp.inspect(false);
    const a = __xp.audit(); return { ok:true, m: m && `${m.w}×${m.h}`, path: path && path.join(' › '), a: `${a.seen} parts · ${a.type.length} text styles (${a.type.filter(x => !x[2]).length} without a rule) · ${a.space.length} gaps · ${a.color.length} colours` };
  } catch (err) { return { ok:false, err: String(err && err.stack || err).slice(0, 400) }; } });
  if (!lens.ok){ fails++; console.log('✗ inspect / audit threw: ' + lens.err); }
  else console.log(`  inspect ✓ ${lens.path || '—'} (${lens.m || '—'}) · audit ✓ ${lens.a}`);
  for (let ti = 0; ti < info.topics.length; ti++){
    const t = info.topics[ti], out = [];
    await page.evaluate(ti => __xp.open(ti), ti); await page.waitForTimeout(800);
    const top = await page.evaluate(() => { const p = document.querySelector('#xp'); if (!p || p.hidden) return false;
      const r = p.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + 40); return r.width > 200 && !!el && p.contains(el); });
    if (!top) out.push('the Explain panel is not visible on top');
    if (shots) await shot(`${id}-${String(ti + 1).padStart(2, '0')}-${t.id}`);
    const order = [...t.notes.keys()].sort((a, b) => t.notes[a].step - t.notes[b].step);
    for (const i of order){
      const n = t.notes[i];
      if (n.step || n.rel){ await page.evaluate(i => __xp.focus(i), i); await page.waitForTimeout(n.step ? 700 : 150); }
      const r = await page.evaluate(([ti, i]) => ({ n: __xp.targets(ti, i), r: __xp.rels(ti, i) }), [ti, i]);
      if (n.s && !r.n) out.push(`#${i + 1} rings nothing “${n.t}”`);
      r.r.forEach((c, k) => { if (!c) out.push(`#${i + 1} relation ${k + 1} lands on nothing “${n.t}”`); });
    }
    fails += out.length;
    console.log(`${out.length ? '✗' : '✓'} ${ti + 1}. ${t.name} — ${t.notes.length} notes${t.flag ? ' (needs ' + t.flag + ')' : ''}${out.length ? '\n    ' + out.join('\n    ') : ''}`);
  }
  if (info.bad.length){ fails += info.bad.length; console.log('schema:\n  ' + info.bad.join('\n  ')); }
}
await page.evaluate(k => { __xp.close(); if (__xp.key() !== k && window.EXPLAIN_CONFIG && EXPLAIN_CONFIG.show) EXPLAIN_CONFIG.show(k); }, start.k);
if (errs.length) console.log('page errors:\n  ' + [...new Set(errs)].join('\n  '));
console.log(fails || errs.length ? `\nFAIL · ${fails} misses · ${errs.length} page errors` : '\nPASS · every ring and relation lands');
await page.close(); await browser.close();
process.exitCode = fails || errs.length ? 1 : 0;
