/**
 * Dumps a Webflow export page's content outline: headings, copy, links, images
 * and animated icons, with nav/footer chrome stripped.
 *
 * Usage: node scripts/outline.mjs <slug> [slug ...]
 */
import { readFile } from 'node:fs/promises';
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

const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&rsquo;|&lsquo;/g, "'")
   .replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
   .replace(/&amp;/g, '&');

const text = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

for (const slug of process.argv.slice(2)) {
  const html = await readFile(`${EXPORT}${slug}.html`, 'utf8');

  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '';
  const desc = html.match(/<meta content="([^"]*)" name="description">/)?.[1] ?? '';

  let body = removeElements(html, (t) => CHROME.test(t));
  body = body.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');

  console.log(`\n${'='.repeat(78)}\n${slug}\n  <title> ${text(title)}\n  <desc>  ${desc}\n${'='.repeat(78)}`);

  const pattern =
    /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>|<p\b[^>]*>([\s\S]*?)<\/p>|<li\b[^>]*>([\s\S]*?)<\/li>|<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<img\b[^>]*src="([^"]*)"|<lord-icon[^>]*src="[^"]*\/([a-z0-9]+)\.json"|<(?:input|textarea)\b[^>]*(?:placeholder|name)="([^"]*)"/gi;

  let last = '';
  for (const m of html.matchAll(pattern)) {
    // Skip anything that fell inside a chrome region.
    if (!body.includes(m[0].slice(0, Math.min(60, m[0].length)))) continue;
    let line = '';
    if (m[1]) line = `${m[1].toUpperCase().padEnd(4)} ${text(m[2])}`;
    else if (m[3] !== undefined) line = `P    ${text(m[3])}`;
    else if (m[4] !== undefined) line = `LI   ${text(m[4])}`;
    else if (m[5] !== undefined) line = `A    ${text(m[6]).slice(0, 60).padEnd(60)} -> ${m[5]}`;
    else if (m[7]) line = `IMG  ${m[7]}`;
    else if (m[8]) line = `ICON ${m[8]}`;
    else if (m[9]) line = `FORM ${m[9]}`;
    if (!line.trim().slice(4).trim() || line === last) continue;
    last = line;
    console.log('  ' + line);
  }
}
