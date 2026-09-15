// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.dropchain.network',
  // Webflow served extensionless URLs; keep them identical so inbound links survive.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [
    sitemap({
      // Staging and flow pages that should not be indexed.
      filter: (page) =>
        !/\/(sandbox|search|claim-nft|claim-nft-success|404)$/.test(page.replace(/\.html$/, '')),
    }),
  ],
});
