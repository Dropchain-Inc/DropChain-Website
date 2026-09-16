/**
 * Responsive audit. Loads every built page at phone width in a real headless
 * Chrome and reports horizontal overflow, naming the elements responsible.
 *
 * Horizontal overflow is the failure that actually matters on a phone: the page
 * scrolls sideways, and the right-hand edge of the content is unreachable.
 *
 * Usage:
 *   node scripts/check-responsive.mjs                 # audit every page at 414px
 *   node scripts/check-responsive.mjs --shot pricing  # also save a screenshot
 *   node scripts/check-responsive.mjs --width 360
 *
 * Needs a local server on $BASE (default http://localhost:4341).
 */
import { readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const DIST = `${root}dist/`;
const BASE = process.env.BASE ?? 'http://localhost:4341';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const width = Number(args[args.indexOf('--width') + 1]) || 414;
const shotIndex = args.indexOf('--shot');
const shotFor = shotIndex >= 0 ? args[shotIndex + 1] : null;

const pages = (await readdir(DIST, { recursive: true }))
  .filter((f) => f.endsWith('index.html') || f === '404.html')
  // 404.html is served at its file path by a plain static server.
  .map((f) => '/' + (f === '404.html' ? '404.html' : f.replace(/index\.html$/, '')))
  .map((p) => (p === '/' ? '/' : p.replace(/\/$/, '')))
  .sort();

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width, height: 896, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

const problems = [];

for (const path of pages) {
  process.stdout.write(`\r  ${String(pages.indexOf(path) + 1).padStart(3)}/${pages.length}  ${path.slice(0, 50).padEnd(52)}`);
  const res = await page
    .goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    .catch(() => null);
  // Let fonts and images settle so measurements reflect the real layout.
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await new Promise((r) => setTimeout(r, 120));
  if (!res || !res.ok()) { problems.push({ path, error: `HTTP ${res ? res.status() : 'no response'}` }); continue; }

  const result = await page.evaluate((viewportWidth) => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;

    // Name the elements sticking out past the right edge.
    const culprits = [];
    if (overflow > 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > viewportWidth + 1) {
          const parent = el.parentElement;
          const parentRect = parent?.getBoundingClientRect();
          // Only report the outermost offender in each chain.
          if (parentRect && parentRect.right > viewportWidth + 1) continue;
          culprits.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.baseVal ?? el.className ?? '').toString().split(/\s+/).filter((c) => !c.startsWith('astro-')).slice(0, 2).join('.'),
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
        }
        if (culprits.length >= 5) break;
      }
    }

    // Anything with text smaller than 12px is hard to read on a phone.
    let tiny = 0;
    for (const el of document.querySelectorAll('p, li, span, a, h1, h2, h3, h4, td, th')) {
      if (!el.textContent?.trim()) continue;
      if (parseFloat(getComputedStyle(el).fontSize) < 11) tiny += 1;
    }

    return { overflow, culprits, tiny, scrollWidth: doc.scrollWidth };
  }, width);

  if (result.overflow > 1 || result.tiny > 0) {
    problems.push({ path, ...result });
  }
}

if (shotFor) {
  await mkdir(`${root}.screenshots`, { recursive: true });
  const target = shotFor.startsWith('/') ? shotFor : `/${shotFor}`;
  await page.goto(`${BASE}${target}`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 600));
  const file = `${root}.screenshots/${target.replace(/\//g, '_') || 'home'}-${width}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`screenshot: ${file}\n`);
}

await browser.close();

process.stdout.write('\r'.padEnd(70) + '\r');
console.log(`${pages.length} pages audited at ${width}px\n`);

if (!problems.length) {
  console.log('No horizontal overflow and no text under 11px.');
} else {
  for (const p of problems) {
    if (p.error) { console.log(`! ${p.path}  ${p.error}`); continue; }
    console.log(`! ${p.path}`);
    if (p.overflow > 1) {
      console.log(`    overflows by ${p.overflow}px (content ${p.scrollWidth}px wide)`);
      for (const c of p.culprits) {
        console.log(`      <${c.tag}${c.cls ? '.' + c.cls : ''}>  width ${c.width}px, right edge ${c.right}px`);
      }
    }
    if (p.tiny) console.log(`    ${p.tiny} elements with text under 11px`);
  }
  process.exitCode = 1;
}
