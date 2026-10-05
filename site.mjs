/* Builds site/: the public copy of guide.html and its live demo, for Firebase Hosting (firebase.json runs this
   before every deploy). guide.html stays the source; it has no <!doctype> because the claude.ai artifact wraps
   it, so this adds one. The build fails if any name listed in .private-names (one per line, never committed)
   turns up in what gets published. */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url)), out = join(here, 'site');

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'templates', 'demo'), { recursive: true });
const html = readFileSync(join(here, 'guide.html'), 'utf8');
writeFileSync(join(out, 'index.html'), '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n' + html);
for (const f of ['explain.js', 'explain.css', 'demo/index.html', 'demo/demo.xp.js']) cpSync(join(here, 'templates', f), join(out, 'templates', f));

const files = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]);
const names = existsSync(join(here, '.private-names')) ? readFileSync(join(here, '.private-names'), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
const leak = files(out).filter(f => { const s = readFileSync(f, 'utf8').toLowerCase(); return names.some(n => s.includes(n.toLowerCase())); });
if (leak.length) throw new Error('site.mjs: the public copy names a private project in ' + leak.join(', '));
console.log(`site/ built: ${files(out).length} files, checked against ${names.length} private names`);
