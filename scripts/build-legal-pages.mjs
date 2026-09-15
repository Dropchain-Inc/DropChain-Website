/**
 * Converts the long-form legal pages from the Webflow export into semantic
 * Astro pages.
 *
 * The export stores these two different ways:
 *   A. One giant <p> with <br> separators and no structure at all
 *      (privacy-policy, terms-of-service). Headings and lists are rebuilt here.
 *   B. A .w-richtext block that already has real markup
 *      (refund-policy, merchant-agreement, developer-agreement). Kept as-is,
 *      minus Webflow's rich-text demo boilerplate.
 *
 * Usage: node scripts/build-legal-pages.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const EXPORT = `${root}dropchain-6028cb.webflow/`;
const PAGES = `${root}src/pages/`;

const TARGETS = [
  { file: 'privacy-policy', title: 'Privacy Policy', description: 'How DropChain collects, stores, uses and shares your personal information.' },
  { file: 'terms-of-service', title: 'Terms of Service', description: 'The terms governing your use of DropChain products and services.' },
  { file: 'refund-policy', title: 'Refund Policy', description: 'How refunds and returns work on the DropChain Marketplace.' },
  { file: 'merchant-agreement', title: 'Marketplace Agreement', description: 'The agreement covering merchants selling on the DropChain Marketplace.' },
  { file: 'developer-agreement', title: 'Developer Agreement', description: 'The terms covering use of the DropChain API, SDKs and developer tools.' },
];

// Webflow appends this demo copy to every empty rich-text field.
const BOILERPLATE = /<h4[^>]*>\s*Static and dynamic content editing[\s\S]*$/i;

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&');

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// "(#section)" markers point at anchors Webflow never generated.
const clean = (s) => s.replace(/\s*\(#[a-zA-Z0-9_-]+\)/g, '').trim();

const isHeading = (line) => {
  const text = line.replace(/^\d+\.\s*/, '');
  if (text.length < 3 || text.length > 110) return false;
  const letters = text.replace(/[^A-Za-z]/g, '');
  return letters.length >= 3 && letters === letters.toUpperCase();
};

function fromBrSoup(body) {
  const lines = body
    .split(/<br\s*\/?>/i)
    .map((chunk) => decode(chunk.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim());

  const out = [];
  let list = null;
  const flush = () => { if (list?.length) out.push(`      <ul>\n${list.map((i) => `        <li>${escape(i)}</li>`).join('\n')}\n      </ul>`); list = null; };

  for (const raw of lines) {
    const line = clean(raw);
    if (!line) { flush(); continue; }
    if (line.startsWith('*')) {
      list = [...(list ?? []), ...line.split('*').map(clean).filter(Boolean)];
      continue;
    }
    flush();
    out.push(isHeading(line) ? `      <h2>${escape(line)}</h2>` : `      <p>${escape(line)}</p>`);
  }
  flush();
  return out.join('\n');
}

function fromRichText(html) {
  let out = html.replace(BOILERPLATE, '');
  // Drop Webflow's layout classes and empty spacer paragraphs.
  out = out
    .replace(/\s*class="[^"]*"/g, '')
    .replace(/<p>\s*(?:‍|&zwnj;|&nbsp;)?\s*<\/p>/gi, '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '');
  // A lone <strong> paragraph is a section heading in this content.
  out = out.replace(/<p>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>/gi, (_, t) => `<h2>${t.trim()}</h2>`);
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `      ${l}`)
    .join('\n');
}

for (const target of TARGETS) {
  const html = await readFile(`${EXPORT}${target.file}.html`, 'utf8');

  const rich = html.match(/<div[^>]*class="[^"]*w-richtext[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
  let content;
  let shape;

  if (rich) {
    content = fromRichText(rich[1]);
    shape = 'rich-text';
  } else {
    // \b so the pattern cannot match <path>, <picture> and friends.
    const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)];
    if (!paragraphs.length) { console.warn(`! ${target.file}: no prose found`); continue; }
    const longest = paragraphs.sort((a, b) => b[1].length - a[1].length)[0][1];
    content = fromBrSoup(longest);
    shape = 'br-soup';
  }

  const page = `---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="${target.title} | DropChain"
  description="${target.description}"
>
  <section class="legal dc-section">
    <div class="dc-container dc-container--narrow">
      <h1>${target.title}</h1>
      <div class="dc-prose">
${content}
      </div>
    </div>
  </section>
</BaseLayout>

<style>
  .legal h1 { margin-bottom: var(--dc-space-lg); }
</style>
`;

  await writeFile(`${PAGES}${target.file}.astro`, page);
  const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`${target.file.padEnd(22)} ${shape.padEnd(10)} ${String(words).padStart(6)} words`);
}
