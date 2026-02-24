export const ROUTES = {
  home: '/',
  explore: '/explore',
  learn: '/learn',
  faq: '/faq',
  helpCenter: '/help-center',
  fees: '/fees',
  terms: '/terms',
  privacy: '/privacy',
  riskDisclosure: '/risk-warnings',
  resolutionRules: '/resolution-rules',
  market: '/market',
  portfolio: '/portfolio',
  wallet: '/wallet',
  account: '/account',
  admin: '/admin',
  createMarket: '/create-market',
  riskControls: '/risk-controls',
  signIn: '/sign-in',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  resetPasswordNew: '/reset-password/new',
  confirmEmail: '/confirm-email',
  settings2fa: '/settings/2fa',
  payments: '/payments'
} as const;

export const PAGE_PATHS = {
  Home: ROUTES.home,
  Explore: ROUTES.explore,
  Learn: ROUTES.learn,
  Faq: ROUTES.faq,
  HelpCenter: ROUTES.helpCenter,
  Fees: ROUTES.fees,
  Terms: ROUTES.terms,
  Privacy: ROUTES.privacy,
  RiskDisclosure: ROUTES.riskDisclosure,
  ResolutionRules: ROUTES.resolutionRules,
  Market: ROUTES.market,
  Portfolio: ROUTES.portfolio,
  Wallet: ROUTES.wallet,
  Account: ROUTES.account,
  Admin: ROUTES.admin,
  CreateMarket: ROUTES.createMarket,
  RiskControls: ROUTES.riskControls,
  SignIn: ROUTES.signIn,
  Signup: ROUTES.signUp
} as const;

export const pagesConfig = {
  mainPage: 'Home',
  Pages: PAGE_PATHS
} as const;

const normalizeKey = (value: string) =>
  String(value).trim().toLowerCase().replace(/[\s-]+/g, '');

export function createPageUrl(pageName: string): string {
  const [rawBase, rawQuery] = String(pageName || '').split('?');
  const base = rawBase.trim();

  if (!base) {
    return ROUTES.home;
  }

  const path = (PAGE_PATHS as Record<string, string>)[base] ??
    `/${base.replace(/\s+/g, '-').toLowerCase()}`;

  return rawQuery ? `${path}?${rawQuery}` : path;
}

export function resolvePageKeyFromPath(pathname = '/'): string | null {
  if (!pathname || pathname === '/' || pathname === '') {
    return pagesConfig.mainPage;
  }

  const normalizedSegment = normalizeKey(
    pathname.replace(/^\//, '').split('/')[0]
  );

  return (
    Object.keys(PAGE_PATHS).find(
      (key) => normalizeKey(key) === normalizedSegment
    ) || null
  );
}

export const PUBLIC_ROUTE_PREFIXES = [
  ROUTES.signIn,
  ROUTES.signUp,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.confirmEmail,
  ROUTES.faq,
  ROUTES.helpCenter,
  ROUTES.fees,
  ROUTES.terms,
  ROUTES.privacy,
  ROUTES.riskDisclosure,
  ROUTES.resolutionRules
];

export const PRIVATE_ROUTE_PREFIXES = [
  ROUTES.portfolio,
  ROUTES.wallet,
  ROUTES.account,
  ROUTES.admin,
  ROUTES.riskControls,
  ROUTES.createMarket,
  ROUTES.settings2fa,
  ROUTES.payments
];
