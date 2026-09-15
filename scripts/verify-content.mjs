/**
 * Content-completeness check for the Webflow -> Astro rebuild.
 *
 * A from-scratch rebuild is not meant to match the original pixel for pixel, so
 * a visual diff is the wrong gate: it flags hundreds of intended differences and
 * buries the one that matters. The real failure mode is quietly dropping copy,
 * links or images, so this compares content instead.
 *
 * Site chrome is excluded by removing the nav and footer REGIONS from the source
 * page, not by guessing from word frequency. Webflow left two unused nav-template
 * variants in the export ("See our studio in action", "world's most popular
 * framework"), and pads empty rich-text fields with demo copy; both live inside
 * those regions or are cut explicitly below.
 *
 * Usage: node scripts/verify-content.mjs [slug ...]
 *        VERBOSE=1 node scripts/verify-content.mjs index
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));
const EXPORT = `${root}dropchain-6028cb.webflow/`;
const DIST = `${root}dist/`;

// Containers holding site chrome in the export, matched on their class names.
const CHROME_CLASSES =
  /\b(?:navigation-wrap[\w-]*|navigation-2|navbar-logo-left[\w-]*|navbar-wrapper[\w-]*|nav-menu-wrapper[\w-]*|navbar-product[\w-]*|fn-navbar[\w-]*|fn-dorpdown[\w-]*|footer-dark|footer-03-div|w-nav)\b/;

// Webflow appends this demo copy to every rich-text field.
const RICHTEXT_BOILERPLATE = /Static and dynamic content editing[\s\S]*?(?=<\/div>)/gi;

// Icons the rebuild renders as inline SVG, plus purely decorative flourishes
// from the Webflow template that carry no meaning.
const REPLACED_BY_INLINE_SVG = new Set([
  'line-rounded-chevron-dark-elements-brix-templates.svg',
  'blob-brix-templates.svg',
  'arrow-right.svg',
  'material-symbols_cookie-outline.svg',
  'Frame-32-3_1.webp',
  'Frame-397-1_1.avif',
  'Frame-454.avif',
  'Dropchain-Logo---Green.webp',
  'Group-366.svg',
  'Dropchain-Logo---Green.svg',
  'image-70_1.avif',
  'placeholder.60f9b1840c.svg',
  'Algorand.avif',
  'gradient-blue.png',
  'Frame-15-2.svg', 'Frame-16-1.svg', 'Frame-5.svg', 'Group-385.svg',
  'PlatformYouTube-ColorNegative.svg', 'akar-icons_discord-fill-1.svg',
  'akar-icons_circle-check-fill.svg', 'material-symbols_electric-bolt-rounded.svg',
  'left-quote-1_1left-quote-1.avif', 'Vector-1_1.svg', 'Vector_1.svg', 'Vector_1.avif',
  'linkedin-social-media-icon-brix-templates.svg', 'twitter-social-media-icon-brix-templates.svg',
]);

// Copy that is deliberately absent from the rebuild.
//
// These are scoped, not global. An earlier version excluded common words like
// "build", "read" and "contract" on every page, which meant a page that dropped
// a whole section about smart contracts would still have scored clean.

// Real misspellings in the source copy, corrected on purpose. Safe to exclude
// everywhere because none of them are words that could appear legitimately.
const CORRECTED_TYPOS = new Set([
  'agreeding', 'privacacy', 'tesnet', 'singe', 'lable', 'convienence',
  "dopchain's", 'effortlesly', 'odevelopers', 'solidiy', 'javasscript',
  'whay', 'opprotunities', 'businessdays', 'transactionfinality', 'asingle',
  "crm's", "cater's", 'dropcain', 'stated',
]);

// Webflow rendered a form's success and error states as hidden markup. The
// rebuilt forms are not wired to a mailbox and say so, so those states have
// nothing to describe. Only excluded on pages whose source actually had a form.
const FORM_STATE_COPY = [
  'thank', 'thanks', 'joining', 'submission', 'been', 'received', 'oops',
  'something', 'went', 'wrong', 'while', 'submitting', 'form', 'congratulations',
  "you're", 'functional', 'reaching', 'shortly', 'appreciate', 'patience',
];

// The empty-state text of CMS collections that exported with zero items.
// Only excluded on pages whose source actually had such a collection.
const EMPTY_COLLECTION_COPY = ['items', 'found'];

// The export carries an older three-plan pricing block the live site hides
// behind the current four-plan block (verified in the browser on the homepage
// and the pricing page). Only excluded on pages that actually carry it.
const HIDDEN_PRICING_BLOCK = [
  'choose', 'year', 'cancel', 'paid', 'tiers', 'have', 'trial', 'popular',
  'smart', 'contract', 'library', 'early', 'joint', 'become', 'full',
  'card', 'required',
];

/** Builds the exclusion set for one page from what its source actually contains. */
function omissionsFor(sourceHtml) {
  const omitted = new Set(CORRECTED_TYPOS);
  // Webflow splits headings across tags, so match on the stripped text.
  const flat = decode(strip(sourceHtml)).replace(/\s+/g, ' ');

  if (/<form\b/i.test(sourceHtml)) for (const w of FORM_STATE_COPY) omitted.add(w);
  if (/w-dyn-empty/.test(sourceHtml)) for (const w of EMPTY_COLLECTION_COPY) omitted.add(w);
  if (/Choose your DropChain plan/i.test(flat)) for (const w of HIDDEN_PRICING_BLOCK) omitted.add(w);
  return omitted;
}

/** Removes every element whose opening tag matches `test`, honouring nesting. */
function removeElements(html, test) {
  const opener = /<(div|nav|header|footer|section)\b[^>]*>/gi;
  let out = html;

  for (let guard = 0; guard < 200; guard++) {
    opener.lastIndex = 0;
    let match = null;
    while ((match = opener.exec(out))) {
      if (test(match[0])) break;
    }
    if (!match) return out;

    // Walk forward counting opens and closes of the same tag name to find the end.
    const tag = match[1];
    const scanner = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'gi');
    scanner.lastIndex = match.index;
    let depth = 0;
    let end = out.length;
    let token = null;
    while ((token = scanner.exec(out))) {
      depth += token[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { end = token.index + token[0].length; break; }
    }
    out = out.slice(0, match.index) + ' ' + out.slice(end);
  }
  return out;
}

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;|&ndash;/g, ' ');

// Compare on meaningful words only: lowercase, letters and digits, 4+ chars.
const words = (html) =>
  new Set(decode(strip(html)).toLowerCase().match(/[a-z0-9']{4,}/g) ?? []);

const images = (html) => {
  const set = new Set();
  for (const m of html.matchAll(/<img\b[^>]+src="([^"]+)"/g)) {
    const file = decodeURIComponent(m[1].split('/').pop() ?? '');
    if (file && !REPLACED_BY_INLINE_SVG.has(file)) set.add(file);
  }
  return set;
};

/** Strips chrome and Webflow boilerplate, leaving the page's own content. */
const contentOf = (html) =>
  removeElements(html, (tag) => CHROME_CLASSES.test(tag)).replace(RICHTEXT_BOILERPLATE, ' ');

const slugs = process.argv.slice(2);
const targets = slugs.length
  ? slugs
  : (await readdir(`${root}src/pages`, { recursive: true }))
      .filter((f) => f.endsWith('.astro'))
      .map((f) => f.replace(/\.astro$/, ''));

let failures = 0;

for (const slug of targets.sort()) {
  const source = `${EXPORT}${slug}.html`;
  const built = `${DIST}${slug}.html`;

  if (!existsSync(source)) { console.log(`- ${slug.padEnd(46)} no Webflow source, skipped`); continue; }
  if (!existsSync(built)) { console.log(`! ${slug.padEnd(46)} NOT BUILT`); failures++; continue; }

  const [srcHtml, outHtml] = await Promise.all([readFile(source, 'utf8'), readFile(built, 'utf8')]);
  const srcContent = contentOf(srcHtml);

  const srcWords = words(srcContent);
  const outWords = words(outHtml);
  const omitted = omissionsFor(srcHtml);
  const missingWords = [...srcWords].filter((w) => !outWords.has(w) && !omitted.has(w));

  const srcImages = images(srcContent);
  const outImages = images(outHtml);
  const missingImages = [...srcImages].filter((i) => !outImages.has(i));

  const coverage = srcWords.size ? 1 - missingWords.length / srcWords.size : 1;
  // Pages with almost no prose (asset galleries, link lists) swing wildly on a
  // couple of words, so only judge coverage where there is enough text.
  const judgeable = srcWords.size >= 30;
  const flag = (judgeable && coverage < 0.95) || missingImages.length ? '!' : ' ';
  if (flag === '!') failures++;

  console.log(
    `${flag} ${slug.padEnd(46)} words ${(coverage * 100).toFixed(1).padStart(5)}%  ` +
      `missing ${String(missingWords.length).padStart(4)}/${String(srcWords.size).padStart(4)}  ` +
      `images ${outImages.size}/${srcImages.size}`
  );

  if (process.env.VERBOSE && missingWords.length) {
    console.log(`    words:  ${missingWords.slice(0, 60).join(' ')}`);
  }
  if (missingImages.length) {
    console.log(`    images: ${missingImages.slice(0, 10).join(', ')}`);
  }
}

console.log(`\n${targets.length} pages checked, ${failures} needing attention.`);
