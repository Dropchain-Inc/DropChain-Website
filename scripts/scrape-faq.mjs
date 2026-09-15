/**
 * Pulls the FAQ entries off the live Webflow site.
 *
 * Like the blog posts, these live in a CMS collection that came out empty in
 * the static export, so the FAQ page looked like it had no content. It has
 * eight entries.
 *
 * Usage: node scripts/scrape-faq.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const SITE = 'https://dropchain-6028cb.webflow.io';

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&');

const textOf = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function elementAt(html, from, tag) {
  const scanner = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'gi');
  scanner.lastIndex = from;
  let depth = 0;
  let token = null;
  while ((token = scanner.exec(html))) {
    depth += token[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(from, token.index + token[0].length);
  }
  return html.slice(from);
}

const html = await (await fetch(`${SITE}/frequently-asked-questions-faq`)).text();

const items = [];
const itemPattern = /<div role="listitem" class="collection-item-5 w-dyn-item">/g;
let match = null;

while ((match = itemPattern.exec(html))) {
  const block = elementAt(html, match.index, 'div');

  const question = textOf(block.match(/<div class="faq-q-text">([\s\S]*?)<\/div>/)?.[1] ?? '');

  const answerStart = block.indexOf('<div class="c-faq-a">');
  const answerBlock = answerStart >= 0 ? elementAt(block, answerStart, 'div') : '';
  // Strip the trailing "Docs" link out of the answer body and keep it separately.
  const link = answerBlock.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  const answer = textOf(answerBlock.replace(/<a\b[\s\S]*?<\/a>/gi, ' '));

  if (question && answer) {
    items.push({
      question,
      answer,
      link: link ? { href: decode(link[1]), label: textOf(link[2]) || 'Docs' } : null,
    });
  }
}

await writeFile(`${root}src/data/faq.json`, JSON.stringify(items, null, 2));

console.log(`${items.length} FAQ entries\n`);
for (const item of items) {
  console.log(`  ${item.question}`);
  console.log(`    ${item.answer.slice(0, 90)}...`);
}
