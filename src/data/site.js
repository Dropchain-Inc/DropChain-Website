import { APP_URL, CONSOLE_URL } from './navigation.js';

export const logos = [
  { src: '/images/Mn-Blockchain.svg', alt: 'MN Blockchain' },
  { src: '/images/stability.svg', alt: 'Stability' },
  { src: '/images/Moongate.svg', alt: 'Moongate' },
  { src: '/images/near-foundation.svg', alt: 'NEAR Foundation' },
  { src: '/images/lambda_1.svg', alt: 'Lambda Network' },
];

// Quoted verbatim from the Webflow site. Do not reword: these are real people.
export const testimonials = [
  {
    quote: 'DropChain is GOLD. It helped me collect attendee data from my IRL event on autopilot\u2014turning them into a vibrant, re-engageable community.',
    name: 'Chris Pederson',
    role: 'Owner of NFT MSP',
  },
  {
    quote: 'The slickest web3 experience I\u2019ve ever had. Without DropChain, we couldn\u2019t have launched our membership NFTs and then kept in touch with holders easily.',
    name: 'Brandon Ferdig',
    role: 'Executive Director, MN Blockchain',
  },
  {
    quote: 'DropChain let me build an NFT loyalty program that actually converts. I know who my superfans are and can reward them directly.',
    name: 'Kent Garbers',
    role: 'Business Owner, Restaurateur',
  },
  {
    quote: 'DropChain fundamentally changed our user-adoption strategy... We cannot fulfill our mission without making the platform easy to use and DropChain will help us with that.',
    name: 'Christain Casini',
    role: 'CEO at NiftGen',
  },
  {
    quote: 'DropChain makes it possible for web3 newbies like me to create a web3 app.',
    name: 'Niles Drekker',
    role: 'Software developer',
  },
  {
    quote: 'DropChain is now our go-to solution for building web3 apps. Every client we work with wants the assurance that we can undo mistakes made by us or our users. DropChain\u2019s flexibility makes it a perfect solution.',
    name: 'Ryan Radomski',
    role: 'CTO at Lambda Network',
  },
];

// Plan data as shown on the live site. Obvious typos in the source copy have
// been corrected ("Singe" -> "Single", "Lable" -> "Label", "Tesnet" -> "Testnet").
export const plans = [
  {
    name: 'Free',
    monthly: '$0',
    annual: '$0',
    features: [
      'NFT Minting: One',
      'NFT Claim Page: One',
      'DropChain Connect: One Page',
      '300 API Calls Per Month',
      'DropChain Testnet Access',
      'No-Code Plugin',
    ],
    cta: { monthly: 'Start For Free', annual: 'Start Free - No Credit Card', href: APP_URL },
  },
  {
    name: 'Pro',
    monthly: '$29',
    annual: '$25',
    features: [
      'Single Sign On Access',
      'NFT Claim: 50 Pages',
      'DropChain Connect: 10 Pages',
      'DropChain CRM: 1,000 Members',
      'DropChain CRM: 2,000 Email Sends per Month',
      '40,000 API Calls Per Month',
      'DropChain Testnet and Mainnet Access',
      'Launch web apps',
    ],
    cta: { monthly: 'Go Pro', annual: 'Start for $1', href: APP_URL },
  },
  {
    name: 'Elite',
    monthly: '$99',
    annual: '$83',
    featured: true,
    features: [
      'Everything in Pro, plus...',
      'NFT Claim: Unlimited Pages',
      'DropChain Connect: Unlimited Pages',
      'DropChain CRM: 5,000 Members',
      'DropChain CRM: 20,000 Email Sends per Month',
      '200,000 API Calls Per Month',
      'White Label Wallet Support',
    ],
    cta: { monthly: 'Go Elite', annual: 'Start for $1', href: APP_URL },
  },
  {
    name: 'Enterprise',
    blurb:
      "If you're ready to launch a custom web3 app created by experts, this is the right plan for you. Click the button below to connect with our team to learn more.",
    priceLabel: 'Contact Sales',
    cta: { monthly: 'Contact Our Team', annual: 'Contact Sales', href: '/contact' },
  },
];

export { APP_URL, CONSOLE_URL };
