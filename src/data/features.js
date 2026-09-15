const FIAT_DOCS = 'https://dropchain.gitbook.io/dropchain-api-beta/dropchain-overview/fiat-onramp';

// Shared by the NFT marketplace and fiat onramp pages, which run the same set.
export const fiatFeatures = [
  { title: 'Accept Credit Card Payments for NFTs on any Blockchain', blurb: 'NFT Checkout supports Algorand, Ethereum, Arbitrum, and more.', href: FIAT_DOCS, image: '/images/Frame-22_1.avif' },
  { title: 'Direct Deposit', blurb: 'Get your money via ACH bank transfer or any crypto listed on Coinbase.', href: FIAT_DOCS, image: '/images/Frame-31.svg' },
  { title: 'Automatic Wallets', blurb: 'Wallets are automatically created when users sign up to your platform.', href: '/sso', image: '/images/Frame-30.svg' },
  { title: 'No Gas Fees', blurb: "We'll take care of all the gas fees your users generate.", href: `${FIAT_DOCS}#overview`, image: '/images/Frame-33.svg' },
  { title: 'No KYC required', blurb: "Users don't need to go through a lengthy KYC identification process.", href: FIAT_DOCS, image: '/images/Frame-29-1.svg' },
];
