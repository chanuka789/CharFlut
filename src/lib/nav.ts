/** Site navigation, shared by header, mobile menu and footer. */
export const mainNav = [
  { label: 'Shop', href: '/shop' },
  { label: 'Tees', href: '/shop/tees' },
  { label: 'Hoodies', href: '/shop/hoodies' },
  { label: 'Drops', href: '/drops' },
  { label: 'Lookbook', href: '/lookbook' },
];

export const footerNav = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', href: '/shop' },
      { label: 'Tees', href: '/shop/tees' },
      { label: 'Hoodies', href: '/shop/hoodies' },
      { label: 'Drops', href: '/drops' },
      { label: 'Lookbook', href: '/lookbook' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Track order', href: '/track-order' },
      { label: 'Size guide', href: '/help/size-guide' },
      { label: 'Shipping', href: '/help/shipping' },
      { label: 'Returns', href: '/help/returns' },
      { label: 'FAQ', href: '/help/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'CharFlut',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Account', href: '/account' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Cookies', href: '/legal/cookies' },
      { label: 'Accessibility', href: '/legal/accessibility' },
    ],
  },
];

export const social = [
  { label: 'Instagram', href: 'https://instagram.com/charflut', icon: 'instagram' as const },
  { label: 'TikTok', href: 'https://tiktok.com/@charflut', icon: 'tiktok' as const },
  { label: 'Pinterest', href: 'https://pinterest.com/charflut', icon: 'pinterest' as const },
];
