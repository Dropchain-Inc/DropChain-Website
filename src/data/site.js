import { APP_URL, CONSOLE_URL } from './navigation.js';

export const logos = [
  { src: '/images/Mn-Blockchain.svg', alt: 'MN Blockchain' },
  { src: '/images/stability.svg', alt: 'Stability' },
  { src: '/images/Moongate.svg', alt: 'Moongate' },
  { src: '/images/near-foundation.svg', alt: 'NEAR Foundation' },
  { src: '/images/lambda_1.svg', alt: 'Lambda Network' },
];

export const testimonials = [
  {
    quote: 'DropChain is GOLD. It helped me collect attendee data from my IRL event on autopilot, turning them into a vibrant, re-engageable community.',
    name: 'Chris Pederson',
    role: 'Owner of NFT MSP',
  },
  {
    quote: 'The slickest web3 experience I have ever had. Without DropChain, we could not have launched our membership NFTs and then kept in touch with holders easily.',
    name: 'Brandon Ferdig',
    role: 'Executive Director, MN Blockchain',
  },
  {
    quote: 'DropChain let me build an NFT loyalty program that actually converts. I know who my superfans are and can reward them directly.',
    name: 'Kent Garbers',
    role: 'Business Owner, Restaurateur',
  },
  {
    quote: 'DropChain fundamentally changed our user-adoption strategy. We cannot fulfill our mission without making the platform easy to use, and DropChain will help us with that.',
    name: 'Domski',
    role: 'CTO at Lambda Network',
  },
];

export const planFeatures = [
  'DropChain API Testnet Access',
  'Sell NFTs on the Marketplace',
  'DropChain Single Sign-On Access',
  'Smart Contract Library Early Access',
  '24/7 Support',
  'Joint Marketing Support',
];

export const plans = [
  {
    name: 'Free',
    price: '$0',
    cadence: '/ Month',
    note: 'No Credit Card Required',
    calls: '300 API Calls / Month',
    access: 'DropChain API Testnet Access',
    cta: { label: 'Free to Start', href: 'https://billing.stripe.com/p/login/aEU5lU34heCKe2c144' },
  },
  {
    name: 'Pro',
    price: '$29',
    cadence: '/ Month',
    featured: true,
    calls: '40,000 API Calls / Month',
    access: 'DropChain API Testnet & Mainnet Access',
    cta: { label: 'Become a Pro', href: APP_URL },
  },
  {
    name: 'Elite',
    price: '$99',
    cadence: '/ Month',
    calls: '200,000 API Calls / Month',
    access: 'DropChain API Testnet & Mainnet Access',
    cta: { label: 'Start Elite Plan', href: APP_URL },
  },
];

export { APP_URL, CONSOLE_URL };
