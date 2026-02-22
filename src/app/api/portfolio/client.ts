import { authClient } from '@/app/api/auth';
import type { RequestOptions } from '@/app/api/api';

export type PortfolioSummaryScope = 'active' | 'all-time';
export type PortfolioPositionStatus = 'active' | 'closed' | 'all';
export type PortfolioSideFilter = 'yes' | 'no';

export type PortfolioSummary = {
  scope: PortfolioSummaryScope;
  activePositions: number;
  totalInvested: number;
  totalInvestedActive: number;
  totalInvestedAllTime: number;
  realizedPnlAllTime: number;
  potentialPnlActive: number;
  closedMarkets: number;
  wins: number;
  accuracyRate: number;
};

export type PortfolioPositionItem = {
  positionId: string;
  marketId: string;
  marketTitle: string;
  marketCategory?: string | null;
  marketStatus: string;
  side: 'YES' | 'NO';
  contracts: number;
  averagePrice: number;
  totalInvested: number;
  potentialPnl: number;
  realizedPnl: number;
  isActive: boolean;
  updatedAt: string;
};

export type PortfolioPositionList = {
  items: PortfolioPositionItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type PortfolioFillItem = {
  id: string;
  positionId: string;
  marketId: string;
  marketTitle: string;
  marketCategory?: string | null;
  side: 'YES' | 'NO';
  type: 'BUY' | 'SELL';
  contracts: number;
  price: number;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  source: 'ORDER' | 'ADMIN' | 'ADJUSTMENT';
  orderId: string | null;
  idempotencyKey: string | null;
  createdAt: string;
};

export type PortfolioFillList = {
  items: PortfolioFillItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type PortfolioMarketCategory = {
  id: number;
  name: string;
  slug: string | null;
};

const parseDecimal = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const parseInteger = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
};

const normalizeSummaryScope = (scope?: string | null): PortfolioSummaryScope => {
  const normalized = String(scope || '').trim().toLowerCase();
  if (normalized === 'all' || normalized === 'all-time' || normalized === 'all_time') {
    return 'all-time';
  }
  return 'active';
};

const normalizePositionStatus = (status?: string | null): PortfolioPositionStatus => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'closed' || normalized === 'all') return normalized;
  return 'active';
};

const normalizeSideFilter = (side?: string | null): PortfolioSideFilter | undefined => {
  const normalized = String(side || '').trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'no') return normalized;
  return undefined;
};

const normalizePage = (page?: number): number => {
  const parsed = Math.trunc(Number(page));
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
};

const normalizePageSize = (pageSize?: number): number => {
  const parsed = Math.trunc(Number(pageSize));
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(200, Math.max(1, parsed));
};

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && !value.trim()) return;
    search.set(key, String(value));
  });
  return search.toString();
};

const normalizeSideValue = (value: unknown): 'YES' | 'NO' =>
  String(value || '').trim().toUpperCase() === 'NO' ? 'NO' : 'YES';

const normalizeCategoryValue = (value: unknown): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return raw.toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-');
};

const normalizeSummary = (raw: any): PortfolioSummary => {
  const resolvedScope = normalizeSummaryScope(raw?.scope);
  const totalInvestedActive = parseDecimal(raw?.totalInvestedActive);
  const totalInvestedAllTime = parseDecimal(raw?.totalInvestedAllTime);

  return {
    scope: resolvedScope,
    activePositions: parseInteger(raw?.activePositions),
    totalInvested: parseDecimal(
      raw?.totalInvested ??
        (resolvedScope === 'all-time' ? totalInvestedAllTime : totalInvestedActive)
    ),
    totalInvestedActive,
    totalInvestedAllTime,
    realizedPnlAllTime: parseDecimal(raw?.realizedPnlAllTime),
    potentialPnlActive: parseDecimal(raw?.potentialPnlActive),
    closedMarkets: parseInteger(raw?.closedMarkets),
    wins: parseInteger(raw?.wins),
    accuracyRate: parseDecimal(raw?.accuracyRate)
  };
};

const normalizePositionItem = (item: any): PortfolioPositionItem => ({
  positionId: String(item?.positionId || ''),
  marketId: String(item?.marketId || ''),
  marketTitle: String(item?.marketTitle || ''),
  marketCategory: normalizeCategoryValue(
    item?.marketCategory ??
      item?.market_category ??
      item?.category ??
      item?.market?.category
  ),
  marketStatus: String(item?.marketStatus || ''),
  side: normalizeSideValue(item?.side),
  contracts: parseInteger(item?.contracts),
  averagePrice: parseDecimal(item?.averagePrice),
  totalInvested: parseDecimal(item?.totalInvested),
  potentialPnl: parseDecimal(item?.potentialPnl),
  realizedPnl: parseDecimal(item?.realizedPnl),
  isActive: Boolean(item?.isActive),
  updatedAt: String(item?.updatedAt || '')
});

const normalizePositionList = (raw: any): PortfolioPositionList => ({
  items: Array.isArray(raw?.items) ? raw.items.map(normalizePositionItem) : [],
  total: parseInteger(raw?.total),
  page: normalizePage(raw?.page),
  pageSize: normalizePageSize(raw?.pageSize)
});

const normalizeFillType = (type: unknown): 'BUY' | 'SELL' =>
  String(type || '').trim().toUpperCase() === 'SELL' ? 'SELL' : 'BUY';

const normalizeFillSource = (source: unknown): 'ORDER' | 'ADMIN' | 'ADJUSTMENT' => {
  const normalized = String(source || '').trim().toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'ADJUSTMENT') return normalized;
  return 'ORDER';
};

const normalizeFillItem = (item: any): PortfolioFillItem => ({
  id: String(item?.id || ''),
  positionId: String(item?.positionId || ''),
  marketId: String(item?.marketId || ''),
  marketTitle: String(item?.marketTitle || ''),
  marketCategory: normalizeCategoryValue(
    item?.marketCategory ??
      item?.market_category ??
      item?.category ??
      item?.market?.category
  ),
  side: normalizeSideValue(item?.side),
  type: normalizeFillType(item?.type),
  contracts: parseInteger(item?.contracts),
  price: parseDecimal(item?.price),
  grossAmount: parseDecimal(item?.grossAmount),
  feeAmount: parseDecimal(item?.feeAmount),
  netAmount: parseDecimal(item?.netAmount),
  source: normalizeFillSource(item?.source),
  orderId: item?.orderId ? String(item.orderId) : null,
  idempotencyKey: item?.idempotencyKey ? String(item.idempotencyKey) : null,
  createdAt: String(item?.createdAt || '')
});

const normalizeFillList = (raw: any): PortfolioFillList => ({
  items: Array.isArray(raw?.items) ? raw.items.map(normalizeFillItem) : [],
  total: parseInteger(raw?.total),
  page: normalizePage(raw?.page),
  pageSize: normalizePageSize(raw?.pageSize)
});

const normalizeMarketCategory = (item: any): PortfolioMarketCategory => ({
  id: parseInteger(item?.id),
  name: String(item?.name || '').trim(),
  slug: item?.slug ? String(item.slug).trim() : null
});

const normalizeMarketCategories = (raw: any): PortfolioMarketCategory[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeMarketCategory).filter((item) => item.id > 0 && item.name);
};

const requestWithAuth = async <T>(path: string, options: RequestOptions = {}) =>
  authClient.requestWithAuth<T>(path, options);

const getSummary = async (scope?: string): Promise<PortfolioSummary> => {
  const normalizedScope = normalizeSummaryScope(scope);
  const query = buildQueryString({ scope: normalizedScope });
  const raw = await requestWithAuth<any>(query ? `/portfolio/summary?${query}` : '/portfolio/summary');
  return normalizeSummary(raw);
};

const getPositions = async ({
  status,
  side,
  category,
  search,
  page,
  pageSize
}: {
  status?: string;
  side?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PortfolioPositionList> => {
  const query = buildQueryString({
    status: normalizePositionStatus(status),
    side: normalizeSideFilter(side),
    category: category?.trim(),
    search: search?.trim(),
    page: normalizePage(page),
    pageSize: normalizePageSize(pageSize)
  });

  const raw = await requestWithAuth<any>(`/portfolio/positions?${query}`);
  return normalizePositionList(raw);
};

const getFills = async ({
  category,
  page,
  pageSize
}: {
  category?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PortfolioFillList> => {
  const query = buildQueryString({
    category: category?.trim(),
    page: normalizePage(page),
    pageSize: normalizePageSize(pageSize)
  });

  const raw = await requestWithAuth<any>(`/portfolio/fills?${query}`);
  return normalizeFillList(raw);
};

const getMarketCategories = async (): Promise<PortfolioMarketCategory[]> => {
  const raw = await requestWithAuth<any>('/markets/market-categories');
  return normalizeMarketCategories(raw);
};

export const portfolioClient = {
  getSummary,
  getPositions,
  getFills,
  getMarketCategories
};

export default portfolioClient;
