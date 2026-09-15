# DropChain website

The dropchain.network marketing site, rebuilt from scratch in [Astro](https://astro.build)
to replace the previous Webflow build.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # static build into dist/
npm run preview  # serve the build
```

Node 22 or newer.

## How it is put together

```
src/
  data/          Site architecture and shared content (nav, plans, quotes)
  components/    Nav, Footer, Button, Icon, Pricing, LinkCards, Split, ...
  layouts/       BaseLayout: head, SEO, analytics, nav and footer
  pages/         One file per URL; file paths match the live URL slugs
  styles/        tokens.css (design tokens) and global.css
public/
  images/        All site imagery, including assets recovered from Webflow's CDN
  icons/         Self-hosted Lordicon animations, recoloured to the brand palette
  documents/     PDFs
scripts/         Build and verification tooling (see below)
```

Design tokens live in `src/styles/tokens.css`. Brand green is `#01f089`,
surfaces are near-black, and the typeface is Poppins, all carried over from the
Webflow build.

### URL slugs

Page file paths deliberately match what Webflow served, including awkward ones
like `/company/about-us-dropchain-official`. Renaming a file changes a live URL,
so add a redirect in `vercel.json` if you do.

The build uses `format: 'directory'`, so `/pricing` is emitted as
`dist/pricing/index.html`. That resolves the extensionless URLs Webflow served on
any static host, with or without a `cleanUrls` rewrite.

Run `node scripts/check-slugs.mjs` to confirm every URL the old site served still
resolves. It currently reports zero 404s across all 60 exported URLs.

## Nothing depends on Webflow

Everything the site needs is in this repo:

- 19 images and PDFs that were still being served from Webflow's CDN were
  downloaded into `public/`.
- All 47 Lordicon animations are self-hosted in `public/icons/` and played
  through a bundled copy of lottie-web, lazily and only when scrolled into view.
- jQuery, `webflow.js` and the 394KB Webflow stylesheet are gone.

## Tooling

| Command | What it does |
| --- | --- |
| `node scripts/verify-content.mjs` | Diffs every built page against its Webflow source and reports missing copy or images |
| `node scripts/outline.mjs --text <slug>` | Dumps a source page's copy, images, links and icon ids |
| `node scripts/check-slugs.mjs` | Confirms every URL the old Webflow site served still resolves |
| `node scripts/audit.mjs` | Reports how much real content each exported page has |
| `node scripts/build-legal-pages.mjs` | Regenerates the five legal pages from the export |
| `node scripts/recolor-icons.mjs` | Recolours the vendored Lottie icons to the brand palette |

`verify-content.mjs` is the one that matters. It strips nav and footer regions
from the source page and compares what is left, so the score reflects real
content rather than chrome. Known-intentional omissions (Webflow's hidden form
states, the hidden older pricing block, corrected typos) are listed explicitly
in that file so the flag keeps meaning something.

The Webflow export is kept at `dropchain-6028cb.webflow/` as a local content
reference and is gitignored.

## Not yet verified

The responsive layouts were checked statically (no fixed width above 260px, every
multi-column grid has a single-column fallback, the nav collapses to a drawer
below 1050px) but were **not** eyeballed at phone width. Worth a pass on a real
device, particularly the `compare` matrix, the four-column `pricing` grid and the
nav drawer.

## Known gaps

- **Forms are not wired up.** Contact, newsletter and bridge forms posted to
  Webflow's own endpoint. Rather than fail silently, each page now shows a
  visible notice and routes people to email or Discord. Wiring these to a
  serverless function is outstanding work.
- **Blog posts at `/post/<slug>` are not in the rebuild and will 404.** The CMS
  collections exported empty, so those URLs cannot be recovered from the export.
  Two are linked from the API page
  (`/post/super-algorand-chooses-dropchain`, `/post/niftgen-x-dropchain`); there
  are likely more. Export the full list from Webflow before the account closes.
- **Five pages have no content.** `academy`, `guides`, `changelog`,
  `case-studies` and `frequently-asked-questions-faq` were Webflow CMS
  collections that exported with zero items. They exist as placeholders that
  keep their URLs. The posts need to be recovered from Webflow before it is
  switched off.
- **Source typos were corrected**, for example "Singe Sign On", "White Lable",
  "Tesnet", "Effortlesly". They are listed in `scripts/verify-content.mjs`.
- **The Termly cookie consent banner was not carried over.** The old site loaded
  it from termly.io. If it is needed for GDPR or CCPA, it has to be re-added.
- **Facebook Pixel and Segment were not carried over.** GA4 and GTM are. If those
  two are still in use, GTM can inject them, or they can be added to
  `src/layouts/BaseLayout.astro`.
- **Four pages are superseded but kept** because they still hold live URLs:
  `old-home` and `no-code-web3-platform` are earlier homepages, `sandbox` is a
  Webflow staging page, and `search` replaced Webflow's hosted site search, which
  has no static equivalent.
