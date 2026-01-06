import type { ComponentType } from 'react';

import Admin from './views/Admin';
import Explore from './views/Explore';
import Home from './views/Home';
import Learn from './views/Learn';
import Market from './views/Market';
import Portfolio from './views/Portfolio';
import RiskControls from './views/RiskControls';
import Wallet from './views/Wallet';

type PageComponent = ComponentType<any>;

type PagesMap = Record<string, PageComponent>;

export const PAGES: PagesMap = {
  Admin,
  Explore,
  Home,
  Learn,
  Market,
  Portfolio,
  RiskControls,
  Wallet,
};

export const pagesConfig = {
  mainPage: 'Home',
  Pages: PAGES,
} as const;

export function resolvePageKeyFromPath(pathname = '/'): string | null {
  if (!pathname || pathname === '/' || pathname === '') {
    return pagesConfig.mainPage;
  }

  const normalizedSegment = pathname
    .replace(/^\//, '')
    .split('/')[0]
    .replace(/-/g, ' ')
    .toLowerCase();

  return Object.keys(PAGES).find(
    (key) => key.toLowerCase() === normalizedSegment
  ) || null;
}
