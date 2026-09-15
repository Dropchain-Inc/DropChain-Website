/**
 * Compares the live Webflow site against the static export this rebuild was
 * written from. The export was published 5 August 2026; the hosted site has
 * been republished since, so any page that changed in between was rebuilt
 * from stale copy.
 *
 * Usage: node scripts/check-drift.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const EXPORT = `${root}dropchain-6028cb.webflow/`;
const SITE = 'https://dropchain-6028cb.webflow.io';

const CHROME =
  /\b(?:navigation-wrap[\w-]*|navigation-2|navbar-logo-left[\w-]*|navbar-wrapper[\w-]*|nav-menu-wrapper[\w-]*|navbar-product[\w-]*|fn-navbar[\w-]*|fn-dorpdown[\w-]*|footer-dark|footer-03-div|w-nav)\b/;

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

const words = (html) => {
  const body = removeElements(html, (t) => CHROME.test(t))
    .replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return new Set(body.toLowerCase().match(/[a-z0-9']{4,}/g) ?? []);
};

const pages = (await readdir(EXPORT, { recursive: true }))
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''))
  .sort();

const drifted = [];

for (const slug of pages) {
  const url = slug === 'index' ? '/' : `/${slug}`;
  let liveHtml;
  try {
    const res = await fetch(`${SITE}${url}`);
    if (!res.ok) continue;
    liveHtml = await res.text();
  } catch { continue; }

  const exported = words(await readFile(`${EXPORT}${slug}.html`, 'utf8'));
  const live = words(liveHtml);

  const added = [...live].filter((w) => !exported.has(w));
  const removed = [...exported].filter((w) => !live.has(w));

  if (added.length || removed.length) {
    drifted.push({ url, added, removed });
  }
  await new Promise((r) => setTimeout(r, 150));
}

if (!drifted.length) {
  console.log('No page changed between the export and the live site.');
} else {
  console.log(`${drifted.length} of ${pages.length} pages changed since the export:\n`);
  for (const d of drifted.sort((a, b) => b.added.length + b.removed.length - a.added.length - a.removed.length)) {
    console.log(`${d.url}`);
    console.log(`   +${d.added.length} words  -${d.removed.length} words`);
    if (d.added.length) console.log(`   added:   ${d.added.slice(0, 18).join(' ')}`);
    if (d.removed.length) console.log(`   removed: ${d.removed.slice(0, 18).join(' ')}`);
    console.log();
  }
}
