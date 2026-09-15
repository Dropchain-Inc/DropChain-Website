/**
 * Pulls the blog posts out of the live Webflow site.
 *
 * The Webflow static export came out with its CMS collections empty, so the
 * 44 posts served at /post/<slug> exist only on the hosted site. This scrapes
 * them into src/data/posts/ and downloads their images into
 * public/images/posts/, so the content lives in this repo before the Webflow
 * account is closed.
 *
 * Usage: node scripts/scrape-posts.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const SITE = 'https://dropchain-6028cb.webflow.io';
const POSTS_DIR = `${root}src/data/posts/`;
const IMAGE_DIR = `${root}public/images/posts/`;

await mkdir(POSTS_DIR, { recursive: true });
await mkdir(IMAGE_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const textOf = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Extracts a balanced element starting at `from`. */
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

/** Downloads a remote asset once and returns its local path. */
const downloaded = new Map();
async function localise(url) {
  if (downloaded.has(url)) return downloaded.get(url);

  const clean = url.split('?')[0];
  let name = decodeURIComponent(clean.split('/').pop() ?? '');
  name = name.replace(/[^A-Za-z0-9._-]/g, '-').slice(-90);
  if (!name || !name.includes('.')) return null;

  const dest = `${IMAGE_DIR}${name}`;
  const local = `/images/posts/${name}`;

  if (!existsSync(dest)) {
    try {
      const res = await fetch(url);
      if (!res.ok) { downloaded.set(url, null); return null; }
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    } catch {
      downloaded.set(url, null);
      return null;
    }
  }
  downloaded.set(url, local);
  return local;
}

// The academy index carries the full post list; there is no pagination.
const index = await (await fetch(`${SITE}/academy`)).text();
const slugs = [...new Set([...index.matchAll(/href="\/post\/([^"]+)"/g)].map((m) => m[1]))].sort();
console.log(`${slugs.length} posts listed on /academy\n`);

const manifest = [];

for (const [i, slug] of slugs.entries()) {
  const html = await (await fetch(`${SITE}/post/${slug}`)).text();

  const title = textOf(html.match(/<h1[^>]*class="heading-351"[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '')
    || textOf(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const description = decode(html.match(/<meta content="([^"]*)" name="description">/)?.[1] ?? '');


  // Date, author and category sit as three sibling divs under the title.
  // Matched by balanced tag, since a non-greedy regex closes on the first child.
  const metaStart = html.indexOf('<div class="div-block-692">');
  const metaBlock = metaStart >= 0 ? elementAt(html, metaStart, 'div') : '';
  // Not every post carries all three, and the order varies, so classify each
  // value rather than assuming a fixed position.
  const CATEGORIES = new Set(['Blog', 'Guides', 'Case Studies', 'Company News', 'News', 'Tutorial', 'Tutorials']);
  const fields = [...metaBlock.matchAll(/<div class="text-block-406">([\s\S]*?)<\/div>/g)].map((m) => textOf(m[1])).filter(Boolean);

  let date = '';
  let category = '';
  let author = '';
  for (const value of fields) {
    if (!date && !Number.isNaN(Date.parse(value))) date = value;
    else if (!category && CATEGORIES.has(value)) category = value;
    else if (!author) author = value;
  }

  // A few posts have no standfirst; fall back to the meta description.
  const summary =
    textOf(html.match(/<p class="paragraph-104">([\s\S]*?)<\/p>/)?.[1] ?? '') || description;

  // Hero image is a CSS background on the first .div-block-688.
  const heroUrl = html.match(/background-image:url\(&quot;([^&]+)&quot;\)/)?.[1];
  const hero = heroUrl ? await localise(decode(heroUrl)) : null;

  // Body rich text.
  const bodyStart = html.indexOf('<div class="blog-rich-text w-richtext">');
  let body = bodyStart >= 0 ? elementAt(html, bodyStart, 'div') : '';
  body = body.replace(/^<div[^>]*>/, '').replace(/<\/div>$/, '');

  // Pull every image in the body local and drop Webflow's srcset/sizes.
  for (const m of [...body.matchAll(/<img[^>]+src="([^"]+)"/g)]) {
    const local = await localise(decode(m[1]));
    if (local) body = body.split(m[1]).join(local);
  }
  body = body
    .replace(/\s(?:srcset|sizes|loading)="[^"]*"/g, '')
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/\sdata-[\w-]+="[^"]*"/g, '')
    // Several posts link the GitBook docs with the domain missing, so on the
    // live site they resolve against dropchain.network and 404. Repaired here.
    .replace(/href="\/dropchain-api-beta/g, 'href="https://dropchain.gitbook.io/dropchain-api-beta');

  const post = { slug, title, description, summary, date, author, category, hero, body };
  await writeFile(`${POSTS_DIR}${slug}.json`, JSON.stringify(post, null, 2));
  manifest.push({ slug, title, date, author, category, summary, hero });

  const words = textOf(body).split(/\s+/).filter(Boolean).length;
  console.log(`  ${String(i + 1).padStart(2)}/${slugs.length}  ${String(words).padStart(5)} words  ${category.padEnd(14)} ${slug.slice(0, 58)}`);

  await sleep(250);
}

await writeFile(`${POSTS_DIR}index.json`, JSON.stringify(manifest, null, 2));
console.log(`\nSaved ${manifest.length} posts and ${[...downloaded.values()].filter(Boolean).length} images.`);
