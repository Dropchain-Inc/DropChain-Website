// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.dropchain.network',
  // Webflow served extensionless URLs; keep them identical so inbound links survive.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
