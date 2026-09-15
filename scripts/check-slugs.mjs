/**
 * Slug parity check for the Webflow -> Astro migration.
 *
 * Every page in the Webflow export was served at an extensionless URL
 * (`pricing.html` was live at `/pricing`). This walks that full list and
 * confirms each URL still resolves in the build, either as a page or via a
 * redirect in vercel.json. Anything listed as MISSING would be a live 404.
 *
 * Usage: node scripts/check-slugs.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const EXPORT = `${root}dropchain-6028cb.webflow/`;
const DIST = `${root}dist/`;

const { redirects = [] } = JSON.parse(await readFile(`${root}vercel.json`, 'utf8'));
const redirectSources = new Set(redirects.map((r) => r.source));

/** Does the build serve this URL? */
const resolves = (url) => {
  if (url === '/') return existsSync(`${DIST}index.html`);
  const slug = url.slice(1);
  return (
    existsSync(`${DIST}${slug}/index.html`) ||
    existsSync(`${DIST}${slug}.html`) ||
    redirectSources.has(url)
  );
};

const pages = (await readdir(EXPORT, { recursive: true }))
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''))
  .sort();

const missing = [];
const viaRedirect = [];
let served = 0;

for (const slug of pages) {
  const url = slug === 'index' ? '/' : `/${slug}`;
  if (existsSync(`${DIST}${slug}/index.html`) || existsSync(`${DIST}${slug}.html`)) served += 1;
  else if (redirectSources.has(url)) viaRedirect.push(url);
  else missing.push(url);
}

console.log(`${pages.length} URLs the Webflow site served\n`);
console.log(`  ${String(served).padStart(3)} served by a rebuilt page`);
console.log(`  ${String(viaRedirect.length).padStart(3)} covered by a redirect (Webflow scaffolding)`);
console.log(`  ${String(missing.length).padStart(3)} would 404\n`);

if (viaRedirect.length) {
  console.log('Covered by a redirect:');
  for (const url of viaRedirect) console.log(`  ${url}`);
  console.log();
}

if (missing.length) {
  console.log('WOULD 404 (add a page or a redirect in vercel.json):');
  for (const url of missing) console.log(`  ${url}`);
  process.exitCode = 1;
} else {
  console.log('No exported URL 404s.');
}

// The CMS collections exported with zero items, so blog posts served at
// /post/<slug> cannot be enumerated from the export. Flag the ones the export
// happens to link to, as a reminder that the full list lives in Webflow.
const blob = (
  await Promise.all(pages.map((p) => readFile(`${EXPORT}${p}.html`, 'utf8')))
).join('');
const posts = [...new Set([...blob.matchAll(/dropchain\.network(\/post\/[\w-]+)/g)].map((m) => m[1]))];
if (posts.length) {
  console.log(`\nNOT COVERED: ${posts.length} blog URLs are linked from the export but were`);
  console.log('never exported (the CMS collections came out empty). These will 404:');
  for (const url of posts.sort()) console.log(`  ${url}`);
  console.log('\nThe full list of /post/ URLs is only in Webflow. Export it before the');
  console.log('account is closed, or add redirects for them.');
}
