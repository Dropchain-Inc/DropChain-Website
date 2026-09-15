/**
 * Content-completeness check for the Webflow -> Astro rebuild.
 *
 * A from-scratch rebuild is not meant to match the original pixel for pixel, so
 * a visual diff is the wrong gate. The failure mode that actually matters is
 * quietly dropping copy, links or images. This compares the built output against
 * the Webflow export and reports what is missing.
 *
 * Usage: node scripts/verify-content.mjs [slug ...]
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));
const EXPORT = `${root}dropchain-6028cb.webflow/`;
const DIST = `${root}dist/`;

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
    .replace(/&mdash;/g, ' ')
    .replace(/&ndash;/g, ' ');

// Compare on meaningful words only: lowercase, letters and digits, 4+ chars.
const words = (html) => {
  const set = new Set();
  for (const w of decode(strip(html)).toLowerCase().match(/[a-z0-9']{4,}/g) ?? []) set.add(w);
  return set;
};

// Raster icons from the export that the rebuild renders as inline SVG instead.
const REPLACED_BY_INLINE_SVG = new Set([
  'Frame-15-2.svg', 'Frame-16-1.svg', 'Frame-5.svg', 'Group-385.svg',
  'PlatformYouTube-ColorNegative.svg', 'akar-icons_discord-fill-1.svg',
  'akar-icons_circle-check-fill.svg', 'material-symbols_electric-bolt-rounded.svg',
  'left-quote-1_1left-quote-1.avif', 'Vector-1_1.svg', 'Vector_1.svg',
]);

const images = (html) => {
  const set = new Set();
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const file = decodeURIComponent(m[1].split('/').pop() ?? '');
    if (file && !REPLACED_BY_INLINE_SVG.has(file)) set.add(file);
  }
  return set;
};

// Nav and footer were rebuilt deliberately (inline SVG instead of raster icons,
// Webflow template leftovers dropped), so site chrome must not count as content
// loss. Anything appearing on nearly every exported page is chrome.
const exportPages = (await readdir(EXPORT, { recursive: true })).filter((f) => f.endsWith('.html'));
const wordPageCount = new Map();
const imagePageCount = new Map();
for (const file of exportPages) {
  const html = await readFile(`${EXPORT}${file}`, 'utf8');
  for (const w of words(html)) wordPageCount.set(w, (wordPageCount.get(w) ?? 0) + 1);
  for (const i of images(html)) imagePageCount.set(i, (imagePageCount.get(i) ?? 0) + 1);
}
// Webflow left two unused nav-template variants in the export, on roughly 70%
// and 50% of pages ("Webflow Development", "See our studio in action",
// "world's most popular framework"...). Both were dropped on purpose, so the
// cut-off sits just below the smaller of the two.
const CHROME_THRESHOLD = exportPages.length * 0.45;
const chromeWords = new Set([...wordPageCount].filter(([, n]) => n >= CHROME_THRESHOLD).map(([w]) => w));
const chromeImages = new Set([...imagePageCount].filter(([, n]) => n >= CHROME_THRESHOLD).map(([i]) => i));
console.log(`Excluding ${chromeWords.size} chrome words and ${chromeImages.size} chrome images (present on 45%+ of ${exportPages.length} exported pages).\n`);

const slugs = process.argv.slice(2);
const targets = slugs.length
  ? slugs
  : (await readdir(`${root}src/pages`, { recursive: true }))
      .filter((f) => f.endsWith('.astro'))
      .map((f) => f.replace(/\.astro$/, ''));

let failures = 0;

for (const slug of targets) {
  const source = `${EXPORT}${slug}.html`;
  const built = `${DIST}${slug === 'index' ? 'index' : slug}.html`;

  if (!existsSync(source)) { console.log(`- ${slug.padEnd(48)} no Webflow source, skipped`); continue; }
  if (!existsSync(built)) { console.log(`! ${slug.padEnd(48)} NOT BUILT`); failures++; continue; }

  const [srcHtml, outHtml] = await Promise.all([readFile(source, 'utf8'), readFile(built, 'utf8')]);

  const srcWords = new Set([...words(srcHtml)].filter((w) => !chromeWords.has(w)));
  const outWords = words(outHtml);
  const missingWords = [...srcWords].filter((w) => !outWords.has(w));

  const srcImages = new Set([...images(srcHtml)].filter((i) => !chromeImages.has(i)));
  const outImages = images(outHtml);
  const missingImages = [...srcImages].filter((i) => !outImages.has(i));

  const coverage = srcWords.size ? 1 - missingWords.length / srcWords.size : 1;
  const flag = coverage < 0.9 || missingImages.length ? '!' : ' ';
  if (flag === '!') failures++;

  console.log(
    `${flag} ${slug.padEnd(48)} words ${(coverage * 100).toFixed(1).padStart(5)}%  ` +
      `missing ${String(missingWords.length).padStart(4)}/${String(srcWords.size).padStart(4)}  ` +
      `images ${outImages.size}/${srcImages.size}`
  );

  if (process.env.VERBOSE && missingWords.length) {
    console.log(`    words:  ${missingWords.slice(0, 40).join(' ')}`);
  }
  if (missingImages.length) {
    console.log(`    images: ${missingImages.slice(0, 10).join(', ')}`);
  }
}

console.log(`\n${targets.length} pages checked, ${failures} needing attention.`);
