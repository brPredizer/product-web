import Admin from './views/Admin';
import Explore from './views/Explore';
import Home from './views/Home';
import Learn from './views/Learn';
import Market from './views/Market';
import Portfolio from './views/Portfolio';
import RiskControls from './views/RiskControls';
import Wallet from './views/Wallet';


export const PAGES = {
    "Admin": Admin,
    "Explore": Explore,
    "Home": Home,
    "Learn": Learn,
    "Market": Market,
    "Portfolio": Portfolio,
    "RiskControls": RiskControls,
    "Wallet": Wallet,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};

export function resolvePageKeyFromPath(pathname = '/') {
    if (!pathname || pathname === '/' || pathname === '') {
        return pagesConfig.mainPage;
    }

    const normalizedSegment = pathname
        .replace(/^\//, '')
        .split('/')[0]
        .replace(/-/g, ' ')
        .toLowerCase();

    return Object.keys(PAGES).find(
        key => key.toLowerCase() === normalizedSegment
    ) || null;
}