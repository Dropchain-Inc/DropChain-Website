// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.dropchain.network',
  // Webflow served extensionless URLs; keep them identical so inbound links survive.
  trailingSlash: 'never',
  build: {
    // 'directory' emits pricing/index.html rather than pricing.html, so the
    // extensionless URLs Webflow served resolve on any static host without
    // needing a cleanUrls rewrite. 'file' only worked behind Vercel.
    format: 'directory',
  },
  integrations: [
    sitemap({
      // Staging and flow pages that should not be indexed.
      filter: (page) =>
        !/\/(sandbox|search|claim-nft|claim-nft-success|404)$/.test(page.replace(/\.html$/, '')),
    }),
  ],
});
