/** Audits every exported page: how much real content it has, once chrome is stripped. */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const EXPORT = `${root}dropchain-6028cb.webflow/`;
const CHROME = /\b(?:navigation-wrap[\w-]*|navigation-2|footer-dark|footer-03-div|w-nav)\b/;

function removeElements(html, test) {
  const opener = /<(div|nav|header|footer|section)\b[^>]*>/gi;
  let out = html;
  for (let guard = 0; guard < 200; guard++) {
    opener.lastIndex = 0;
    let match = null;
    while ((match = opener.exec(out))) if (test(match[0])) break;
    if (!match) return out;
    const tag = match[1];
    const scanner = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'gi');
    scanner.lastIndex = match.index;
    let depth = 0, end = out.length, token = null;
    while ((token = scanner.exec(out))) {
      depth += token[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { end = token.index + token[0].length; break; }
    }
    out = out.slice(0, match.index) + ' ' + out.slice(end);
  }
  return out;
}

const strip = (h) =>
  h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
   .replace(/<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<[^>]+>/g, ' ');

const built = new Set(
  (await readdir(`${root}src/pages`, { recursive: true }))
    .filter((f) => f.endsWith('.astro'))
    .map((f) => f.replace(/\.astro$/, ''))
);

const files = (await readdir(EXPORT, { recursive: true })).filter((f) => f.endsWith('.html'));
const rows = [];

for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  const html = await readFile(`${EXPORT}${file}`, 'utf8');
  const content = removeElements(html, (t) => CHROME.test(t));
  const words = (strip(content).match(/[A-Za-z0-9']{2,}/g) ?? []).length;
  const emptyCms = /w-dyn-empty/.test(html);
  const cmsLists = (html.match(/w-dyn-list/g) ?? []).length;
  const forms = (html.match(/<form\b/g) ?? []).length;
  rows.push({ slug, words, emptyCms, cmsLists, forms, done: built.has(slug) });
}

rows.sort((a, b) => b.words - a.words);
console.log('slug'.padEnd(50) + 'words  cms  form  status');
console.log('-'.repeat(78));
for (const r of rows) {
  const status = r.done ? 'BUILT' : r.emptyCms && r.words < 120 ? 'EMPTY CMS' : '';
  console.log(
    r.slug.padEnd(50) +
      String(r.words).padStart(5) +
      String(r.cmsLists ? r.cmsLists : '').padStart(5) +
      String(r.forms ? r.forms : '').padStart(6) +
      '  ' + status
  );
}
const todo = rows.filter((r) => !r.done);
console.log(`\n${rows.length} exported pages, ${rows.length - todo.length} built, ${todo.length} remaining.`);
