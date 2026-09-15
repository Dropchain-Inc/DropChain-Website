// Site architecture, carried over from the Webflow build.
// URL slugs match what Webflow served so inbound links and SEO survive the move.

export const APP_URL = 'https://beta.console.dropchain.network/login';
export const CONSOLE_URL = 'https://console.dropchain.network/login';
export const DISCORD_URL = 'https://discord.gg/Mtn4z4fkQ9';
export const DOCS_URL = 'https://dropchain.gitbook.io/dropchain-api-beta/';

export const capabilities = [
  {
    label: 'On Chain Marketing Automation',
    href: '/automation',
    blurb: 'Automate campaigns using real-time blockchain data.',
    icon: 'link',
  },
  {
    label: 'Community Management',
    href: '/web3-community-manager',
    blurb: 'Track, segment, and engage your Web3 community.',
    icon: 'users',
  },
  {
    label: 'NFT Minting',
    href: '/mint-nfts',
    blurb: 'Mint and sell NFTs with no code or gas fees.',
    icon: 'plus-circle',
  },
  {
    label: 'Email Marketing',
    href: '/email-marketing-for-web3-companies',
    blurb: 'Send personalized emails powered by on-chain insights.',
    icon: 'mail',
  },
  {
    label: 'Sell NFTs and Tokens with Credit Cards',
    href: '/sell-nfts-and-tokens-with-credit-card-checkout',
    blurb: 'Accept credit cards for NFT and token sales.',
    icon: 'image',
  },
  {
    label: 'Crypto Payments Forms',
    href: '/forms',
    blurb: 'Capture leads with Web3-friendly, wallet-aware forms.',
    icon: 'form',
  },
];

export const resources = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'DropChain Academy & Blog', href: '/academy' },
  { label: 'FAQ', href: '/frequently-asked-questions-faq' },
  { label: 'Video Guides', href: 'https://www.youtube.com/@DropChain.Network', external: true },
  { label: 'Compare Competitors', href: '/compare' },
  { label: 'DropChain Network', href: '/network' },
  { label: 'Pricing', href: '/pricing' },
];

export const primaryNav = [
  { label: 'Capabilities', items: capabilities, kind: 'cards' },
  { label: 'Resources', items: resources, kind: 'list' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: DOCS_URL, external: true },
];

export const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Single Sign On', href: '/sso' },
      { label: 'API Endpoints', href: '/api' },
      { label: 'Python SDK', href: '/sdk/python' },
      { label: 'JavaScript SDK', href: '/sdk/javascript' },
      { label: 'Fiat Onramp', href: '/nft-fiat-onramp' },
      { label: 'NFT Marketplace', href: '/nft-marketplace' },
      { label: 'No Code Platform', href: '/no-code' },
    ],
  },
  {
    title: 'Plans',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Compare', href: '/compare' },
      { label: 'Sign up', href: CONSOLE_URL, external: true },
      { label: 'Log in', href: CONSOLE_URL, external: true },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', href: DOCS_URL, external: true },
      { label: 'Getting Started', href: 'https://dropchain.gitbook.io/dropchain-api-beta/getting-started', external: true },
      { label: 'Python SDK', href: 'https://dropchain.gitbook.io/dropchain-api-beta/dropchain-overview/dropchain-sdk', external: true },
      { label: 'Bubble Integration', href: 'https://dropchain.gitbook.io/dropchain-api-beta/dropchain-examples/integrating-dropchain-api-into-no-code-bubble.io-app', external: true },
      { label: 'Developer Agreement', href: '/developer-agreement' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/company/about-us-dropchain-official' },
      { label: 'Contact', href: '/contact' },
      { label: 'Newsletter', href: '/subscribe' },
      { label: 'Media Kit', href: '/media-kit' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
  },
];

export const socialLinks = [
  { label: 'Discord', href: DISCORD_URL, icon: 'discord' },
  { label: 'Twitter', href: 'https://twitter.com/DropChainAPI', icon: 'twitter' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/dropchain-network', icon: 'linkedin' },
  { label: 'YouTube', href: 'https://www.youtube.com/@DropChain.Network', icon: 'youtube' },
];

export const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
  { label: 'Marketplace Agreement', href: '/merchant-agreement' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Developer Agreement', href: '/developer-agreement' },
];
