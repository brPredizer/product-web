"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQueries, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiRequest } from '@/app/api/api';
import { createPageUrl } from '@/routes';
import { categories as createMarketCategories } from '@/components/pages/CreateMarket/constants';
import { categoryColors } from '@/components/pages/Market/constants';
import {
  portfolioClient,
  type PortfolioFillItem,
  type PortfolioPositionItem
} from '@/app/api/portfolio';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  History,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface PortfolioProps {
  user?: any;
}

type PortfolioTab = 'open' | 'closed' | 'fills';
type SideFilter = 'all' | 'yes' | 'no';
type CategoryOption = { value: string; label: string; isAll: boolean };

const PAGE_SIZE = 20;
const HIDDEN_HISTORY_CATEGORY_KEYS = new Set(['EM-ALTA', 'NOVIDADES']);
const normalizeCategory = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
const normalizeCategoryKey = (value: string) =>
  normalizeCategory(value)
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
const toTitleCaseLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
const categoryLabelByKey = createMarketCategories.reduce<Record<string, string>>((acc, category) => {
  acc[normalizeCategoryKey(String(category.id || ''))] = String(category.name || '');
  return acc;
}, {});
const isAllCategory = (value?: string | null) => {
  const key = normalizeCategoryKey(String(value || ''));
  return key === 'TODAS' || key === 'TODOS';
};
const resolveCategoryLabel = (value?: string | null) => {
  const key = normalizeCategoryKey(String(value || ''));
  if (!key) return '';
  return categoryLabelByKey[key] || toTitleCaseLabel(String(value));
};
const resolveCategoryBadgeClass = (value?: string | null) => {
  const key = normalizeCategoryKey(String(value || ''));
  return categoryColors[key] || 'bg-slate-100 text-slate-700 border-slate-300/60';
};
const normalizeMarketCategoryValue = (value: unknown): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return raw.toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-');
};

const formatDecimalBr = (value: string | number | null | undefined): string => {
  const raw =
    typeof value === 'number'
      ? value
      : Number((value ?? '0').toString().replace(',', '.'));
  const safe = Number.isFinite(raw) ? raw : 0;
  return safe.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatCurrencyBr = (value: string | number | null | undefined): string =>
  `R$ ${formatDecimalBr(value)}`;

const formatSignedCurrencyBr = (value: number) => {
  const amount = Number(value || 0);
  const signal = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${signal}${formatCurrencyBr(Math.abs(amount))}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

const toErrorInfo = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return {
      status: undefined as number | undefined,
      title: undefined as string | undefined,
      message: 'Não foi possível carregar os dados do portfólio.',
      unauthorized: false
    };
  }

  const anyError = error as any;
  const status = typeof anyError.status === 'number' ? anyError.status : undefined;
  const titleRaw = anyError?.payload?.title || anyError?.title || anyError?.code;
  const title = typeof titleRaw === 'string' ? titleRaw.toLowerCase() : undefined;
  const message =
    typeof anyError.message === 'string' && anyError.message.trim()
      ? anyError.message
      : 'Não foi possível carregar os dados do portfólio.';
  const unauthorized = status === 401 || title === 'invalid_token';

  return { status, title, message, unauthorized };
};

export default function Portfolio({ user }: PortfolioProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = React.useState<PortfolioTab>('open');
  const [activePage, setActivePage] = React.useState(1);
  const [closedPage, setClosedPage] = React.useState(1);
  const [fillsPage, setFillsPage] = React.useState(1);
  const [sideFilter, setSideFilter] = React.useState<SideFilter>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [fillsCategory, setFillsCategory] = React.useState('');

  const sideQueryValue = sideFilter === 'all' ? undefined : sideFilter;

  const [summaryQuery, activePositionsQuery] = useQueries({
    queries: [
      {
        queryKey: ['portfolio-summary', user?.id, 'active'],
        enabled: !!user?.id,
        queryFn: () => portfolioClient.getSummary('active')
      },
      {
        queryKey: ['portfolio-positions', user?.id, 'active', activePage, PAGE_SIZE, searchTerm, sideFilter, fillsCategory],
        enabled: !!user?.id,
        queryFn: () =>
          portfolioClient.getPositions({
            status: 'active',
            side: sideQueryValue,
            category: fillsCategory || undefined,
            search: searchTerm || undefined,
            page: activePage,
            pageSize: PAGE_SIZE
          })
      }
    ]
  });

  const closedPositionsQuery = useQuery({
    queryKey: ['portfolio-positions', user?.id, 'closed', closedPage, PAGE_SIZE, searchTerm, sideFilter, fillsCategory],
    enabled: !!user?.id && currentTab === 'closed',
    queryFn: () =>
      portfolioClient.getPositions({
        status: 'closed',
        side: sideQueryValue,
        category: fillsCategory || undefined,
        search: searchTerm || undefined,
        page: closedPage,
        pageSize: PAGE_SIZE
      })
  });

  const fillsQuery = useQuery({
    queryKey: ['portfolio-fills', user?.id, fillsPage, PAGE_SIZE, fillsCategory],
    enabled: !!user?.id,
    queryFn: () =>
      portfolioClient.getFills({
        category: fillsCategory || undefined,
        page: fillsPage,
        pageSize: PAGE_SIZE
      })
  });

  const marketCategoriesQuery = useQuery({
    queryKey: ['portfolio-market-categories', user?.id],
    enabled: !!user?.id,
    queryFn: () => portfolioClient.getMarketCategories()
  });

  const fillsCountQuery = useQuery({
    queryKey: ['portfolio-fills-count', user?.id],
    enabled: !!user?.id,
    queryFn: () => portfolioClient.getFills({ page: 1, pageSize: 1 })
  });

  const summary = summaryQuery.data;
  const activePositions = activePositionsQuery.data;
  const closedPositions = closedPositionsQuery.data;
  const fills = fillsQuery.data;
  const fillsItems = fills?.items ?? [];

  const visibleMarketIds = React.useMemo(() => {
    const ids = new Set<string>();
    (activePositions?.items ?? []).forEach((item) => {
      if (item?.marketId) ids.add(String(item.marketId));
    });
    (closedPositions?.items ?? []).forEach((item) => {
      if (item?.marketId) ids.add(String(item.marketId));
    });
    (fillsItems ?? []).forEach((item) => {
      if (item?.marketId) ids.add(String(item.marketId));
    });
    return Array.from(ids);
  }, [activePositions?.items, closedPositions?.items, fillsItems]);

  const marketCategoryQueries = useQueries({
    queries: visibleMarketIds.map((marketId) => ({
      queryKey: ['portfolio-market-category', marketId],
      enabled: Boolean(marketId),
      staleTime: 5 * 60 * 1000,
      queryFn: async (): Promise<string | null> => {
        const market = await apiRequest<any>(`/markets/${marketId}`);
        return normalizeMarketCategoryValue(
          market?.category ??
            market?.marketCategory ??
            market?.market_category ??
            market?.Category ??
            market?.market?.category
        );
      }
    }))
  });

  const marketCategoryById = React.useMemo(() => {
    const map: Record<string, string> = {};
    visibleMarketIds.forEach((marketId, index) => {
      const category = marketCategoryQueries[index]?.data;
      if (category) map[marketId] = category;
    });
    return map;
  }, [visibleMarketIds, marketCategoryQueries]);

  const isInitialLoading = summaryQuery.isLoading || activePositionsQuery.isLoading;
  const initialError = summaryQuery.error || activePositionsQuery.error;
  const initialErrorInfo = toErrorInfo(initialError);

  const clearPositionFilters = () => {
    setSearchTerm('');
    setSideFilter('all');
    setFillsCategory('');
    setActivePage(1);
    setClosedPage(1);
    setFillsPage(1);
  };

  const marketCategories = marketCategoriesQuery.data || [];

  const categoryOptions = React.useMemo<CategoryOption[]>(() => {
    const items = marketCategories
      .map((category: any) => {
        const value = String(category?.slug || category?.name || '').trim();
        const apiLabel = String(category?.name || category?.slug || '').trim();
        if (!value || !apiLabel) return null;

        const valueKey = normalizeCategoryKey(value);
        const labelKey = normalizeCategoryKey(apiLabel);
        if (HIDDEN_HISTORY_CATEGORY_KEYS.has(valueKey) || HIDDEN_HISTORY_CATEGORY_KEYS.has(labelKey)) return null;

        const isAll = valueKey === 'TODAS' || valueKey === 'TODOS';
        const friendlyLabel =
          categoryLabelByKey[valueKey] ||
          categoryLabelByKey[labelKey] ||
          toTitleCaseLabel(apiLabel);

        return { value, label: friendlyLabel, isAll };
      })
      .filter(Boolean) as CategoryOption[];

    const unique = new Map<string, CategoryOption>();
    items.forEach((item) => {
      const key = normalizeCategory(item.value);
      if (!unique.has(key)) unique.set(key, item);
    });

    return Array.from(unique.values()).sort((a, b) => {
      if (a.isAll && !b.isAll) return -1;
      if (!a.isAll && b.isAll) return 1;
      return a.label.localeCompare(b.label, 'pt-BR');
    });
  }, [marketCategories]);

  const selectedCategoryLabel = React.useMemo(() => {
    if (!fillsCategory) return 'Categorias';
    return categoryOptions.find((category) => category.value === fillsCategory)?.label || toTitleCaseLabel(fillsCategory);
  }, [categoryOptions, fillsCategory]);

  React.useEffect(() => {
    if (fillsCategory) return;
    const defaultOption = categoryOptions[0];
    if (defaultOption) {
      setFillsCategory(defaultOption.value);
      setFillsPage(1);
    }
  }, [categoryOptions, fillsCategory]);

  const summaryActivePositions = summary?.activePositions ?? 0;
  const summaryPotentialPnl = summary?.potentialPnlActive ?? 0;
  const summaryRealizedPnl = summary?.realizedPnlAllTime ?? 0;
  const summaryAccuracyRate = summary?.accuracyRate ?? 0;
  const closedTotal = closedPositions?.total ?? summary?.closedMarkets ?? 0;

  const hasTopHistoryFilters = sideFilter !== 'all' || searchTerm.trim().length > 0;

  const filteredFillsItems = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return fillsItems.filter((item: PortfolioFillItem) => {
      const sideMatches =
        sideFilter === 'all' || item.side === sideFilter.toUpperCase();

      const searchMatches =
        !normalizedSearch ||
        String(item.marketTitle || '').toLowerCase().includes(normalizedSearch);

      return sideMatches && searchMatches;
    });
  }, [fillsItems, sideFilter, searchTerm]);

  const fillsTotal =
    hasTopHistoryFilters
      ? filteredFillsItems.length
      : fillsCategory
        ? fills?.total ?? 0
        : fillsCountQuery.data?.total ?? fills?.total ?? 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesse seu Portfólio</h2>
          <p className="text-slate-500 mb-6">Faça login para ver suas posições e histórico.</p>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => router.push('/sign-in')}
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  if (!isInitialLoading && initialErrorInfo.unauthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Sessão expirada</h2>
          <p className="text-slate-500 mb-6">
            Sua autenticação não é mais válida. Entre novamente para continuar.
          </p>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => router.push('/sign-in')}
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  if (!isInitialLoading && initialError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Falha ao carregar portfólio</h2>
          <p className="text-slate-500 mb-6">{initialErrorInfo.message}</p>
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800"
            onClick={() => {
              summaryQuery.refetch();
              activePositionsQuery.refetch();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Meu Portfólio</h1>
          <p className="text-slate-500 mt-1">Acompanhe suas posições e resultados</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Posições Ativas"
            value={summaryActivePositions}
            icon={Briefcase}
          />
          <StatsCard
            title="Total Investido Ativo"
            value={formatCurrencyBr(summary?.totalInvestedActive ?? summary?.totalInvested ?? 0)}
            subtitle="Valor total investido nas posições ativas"
            icon={BarChart3}
          />
          <StatsCard
            title="P&L Potencial Ativo"
            value={formatSignedCurrencyBr(summaryPotentialPnl)}
            subtitle={`Realizado acumulado: ${formatSignedCurrencyBr(summaryRealizedPnl)}`}
            icon={summaryPotentialPnl >= 0 ? TrendingUp : TrendingDown}
            className={summaryPotentialPnl >= 0 ? 'ring-1 ring-emerald-200' : 'ring-1 ring-rose-200'}
          />
          <StatsCard
            title="Taxa de Acerto"
            value={`${formatDecimalBr(summaryAccuracyRate)}%`}
            subtitle={`${summary?.wins ?? 0}/${summary?.closedMarkets ?? 0} mercados`}
            icon={CheckCircle2}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <Input
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value);
                setActivePage(1);
                setClosedPage(1);
              }}
              placeholder="Buscar por título do mercado"
              className="lg:flex-1"
            />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={categoryOptions.length === 0}
                  className="h-10 min-w-[180px] lg:w-[260px] justify-between font-normal"
                >
                  <span className="truncate">
                    {categoryOptions.length === 0 ? 'Sem categorias' : selectedCategoryLabel}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="start"
                sideOffset={4}
                avoidCollisions={false}
                className="w-[260px] max-h-[320px] overflow-y-auto"
              >
                {categoryOptions.map((category) => (
                  <DropdownMenuItem
                    key={category.value}
                    className={cn(fillsCategory === category.value && "bg-accent")}
                    onSelect={() => {
                      setFillsCategory(category.value);
                      setActivePage(1);
                      setClosedPage(1);
                      setFillsPage(1);
                    }}
                  >
                    {category.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 min-w-[160px] lg:w-[180px] justify-between font-normal"
                >
                  <span>
                    {sideFilter === 'yes' ? 'Lado: SIM' : sideFilter === 'no' ? 'Lado: NÃO' : 'Lado: todos'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="start"
                sideOffset={4}
                avoidCollisions={false}
                className="w-[180px]"
              >
                <DropdownMenuItem
                  className={cn(sideFilter === 'all' && "bg-accent")}
                  onSelect={() => {
                    setSideFilter('all');
                    setActivePage(1);
                    setClosedPage(1);
                  }}
                >
                  Lado: todos
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(sideFilter === 'yes' && "bg-accent")}
                  onSelect={() => {
                    setSideFilter('yes');
                    setActivePage(1);
                    setClosedPage(1);
                  }}
                >
                  Lado: SIM
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(sideFilter === 'no' && "bg-accent")}
                  onSelect={() => {
                    setSideFilter('no');
                    setActivePage(1);
                    setClosedPage(1);
                  }}
                >
                  Lado: NÃO
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={clearPositionFilters}>Limpar</Button>
          </div>
        </div>
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as PortfolioTab)} className="space-y-6">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="open" className="data-[state=active]:bg-white">
              Ativas ({activePositions?.total ?? 0})
            </TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-white">
              Encerradas ({closedTotal})
            </TabsTrigger>
            <TabsTrigger value="fills" className="data-[state=active]:bg-white">
              Histórico ({fillsTotal})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {isInitialLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : activePositionsQuery.error ? (
              <InlineError
                error={activePositionsQuery.error}
                onRetry={() => activePositionsQuery.refetch()}
                onSignIn={() => router.push('/sign-in')}
              />
            ) : (activePositions?.items?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {activePositions?.items.map((position: PortfolioPositionItem, index: number) => (
                  <motion.div
                    key={position.positionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PositionCard
                      position={position}
                      selectedCategoryFilter={fillsCategory}
                      resolvedMarketCategory={marketCategoryById[position.marketId]}
                    />
                  </motion.div>
                ))}
                <PaginationControls
                  page={activePositions?.page ?? 1}
                  pageSize={activePositions?.pageSize ?? PAGE_SIZE}
                  total={activePositions?.total ?? 0}
                  onPageChange={setActivePage}
                  isFetching={activePositionsQuery.isFetching}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Sem posições ativas</h3>
                <p className="text-slate-500 mb-6">Explore os mercados e faça sua primeira operação.</p>
                <Link href={createPageUrl('Explore')}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Explorar Mercados
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed" className="space-y-4">
            {closedPositionsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : closedPositionsQuery.error ? (
              <InlineError
                error={closedPositionsQuery.error}
                onRetry={() => closedPositionsQuery.refetch()}
                onSignIn={() => router.push('/sign-in')}
              />
            ) : (closedPositions?.items?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {closedPositions?.items.map((position: PortfolioPositionItem, index: number) => (
                  <motion.div
                    key={position.positionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PositionCard
                      position={position}
                      closed
                      selectedCategoryFilter={fillsCategory}
                      resolvedMarketCategory={marketCategoryById[position.marketId]}
                    />
                  </motion.div>
                ))}
                <PaginationControls
                  page={closedPositions?.page ?? 1}
                  pageSize={closedPositions?.pageSize ?? PAGE_SIZE}
                  total={closedPositions?.total ?? 0}
                  onPageChange={setClosedPage}
                  isFetching={closedPositionsQuery.isFetching}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum histórico</h3>
                <p className="text-slate-500">Suas posições encerradas aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fills" className="space-y-4">
            {fillsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : fillsQuery.error ? (
              <InlineError
                error={fillsQuery.error}
                onRetry={() => fillsQuery.refetch()}
                onSignIn={() => router.push('/sign-in')}
              />
            ) : filteredFillsItems.length > 0 ? (
              <div className="space-y-4">
                {filteredFillsItems.map((fill: PortfolioFillItem) => (
                  <FillCard
                    key={fill.id}
                    fill={fill}
                    selectedCategoryFilter={fillsCategory}
                    resolvedMarketCategory={marketCategoryById[fill.marketId]}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma movimentação encontrada</h3>
                <p className="text-slate-500">
                  {hasTopHistoryFilters
                    ? 'Nenhum item corresponde aos filtros selecionados.'
                    : 'O histórico de movimentações aparecerá aqui.'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InlineError({
  error,
  onRetry,
  onSignIn
}: {
  error: unknown;
  onRetry: () => void;
  onSignIn: () => void;
}) {
  const errorInfo = toErrorInfo(error);

  return (
    <div className="bg-white rounded-2xl border border-rose-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-semibold text-rose-700">Erro ao carregar dados</p>
          <p className="text-sm text-slate-600 mt-1">{errorInfo.message}</p>
        </div>
        <div className="flex gap-2">
          {errorInfo.unauthorized ? (
            <Button onClick={onSignIn} className="bg-emerald-600 hover:bg-emerald-700">
              Entrar novamente
            </Button>
          ) : (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PositionCard({
  position,
  closed,
  selectedCategoryFilter,
  resolvedMarketCategory
}: {
  position: PortfolioPositionItem;
  closed?: boolean;
  selectedCategoryFilter?: string;
  resolvedMarketCategory?: string;
}) {
  const isYes = position.side === 'YES';
  const isWinner = position.realizedPnl > 0;
  const isLoser = position.realizedPnl < 0;
  const fallbackCategory = !position.marketCategory && selectedCategoryFilter && !isAllCategory(selectedCategoryFilter)
    ? selectedCategoryFilter
    : undefined;
  const effectiveCategory = position.marketCategory || resolvedMarketCategory || fallbackCategory;
  const categoryLabel = resolveCategoryLabel(effectiveCategory);

  return (
    <Link
      href={createPageUrl(`Market?id=${position.marketId}`)}
      className="block bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {categoryLabel ? (
              <Badge
                variant="outline"
                className={cn("text-slate-600", resolveCategoryBadgeClass(effectiveCategory))}
              >
                {categoryLabel}
              </Badge>
            ) : null}
            <Badge className={cn(
              "font-medium",
              isYes ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}>
              {isYes ? 'SIM' : 'NÃO'}
            </Badge>
            {closed && (
              <Badge className={cn(
                isWinner
                  ? "bg-emerald-100 text-emerald-700"
                  : isLoser
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700"
              )}>
                {isWinner ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Ganhou</>
                ) : isLoser ? (
                  <><XCircle className="w-3 h-3 mr-1" /> Perdeu</>
                ) : (
                  <>Empate</>
                )}
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-slate-900 mb-1">
            {position.marketTitle || 'Mercado'}
          </h3>

          <p className="text-sm text-slate-500">
            {position.contracts} contratos por R$ {formatDecimalBr(position.averagePrice)} cada
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Atualizado em {formatDateTime(position.updatedAt)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-500 mb-1">
            {closed ? 'Resultado' : 'Investido'}
          </p>
          {closed ? (
            <p className={cn(
              "text-xl font-bold",
              position.realizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {formatSignedCurrencyBr(position.realizedPnl)}
            </p>
          ) : (
            <>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrencyBr(position.totalInvested)}
              </p>
              <p className={cn(
                "text-sm",
                position.potentialPnl >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {formatSignedCurrencyBr(position.potentialPnl)} potencial
              </p>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function FillCard({
  fill,
  selectedCategoryFilter,
  resolvedMarketCategory
}: {
  fill: PortfolioFillItem;
  selectedCategoryFilter?: string;
  resolvedMarketCategory?: string;
}) {
  const isYes = fill.side === 'YES';
  const isBuy = fill.type === 'BUY';
  const netPositive = fill.netAmount >= 0;
  const fallbackCategory = !fill.marketCategory && selectedCategoryFilter && !isAllCategory(selectedCategoryFilter)
    ? selectedCategoryFilter
    : undefined;
  const effectiveCategory = fill.marketCategory || resolvedMarketCategory || fallbackCategory;
  const categoryLabel = resolveCategoryLabel(effectiveCategory);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{fill.marketTitle || 'Mercado'}</p>
          <p className="text-sm text-slate-500">{formatDateTime(fill.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          {categoryLabel ? (
            <Badge
              variant="outline"
              className={cn("text-slate-600", resolveCategoryBadgeClass(effectiveCategory))}
            >
              {categoryLabel}
            </Badge>
          ) : null}
          <Badge className={isYes ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
            {isYes ? 'SIM' : 'NÃO'}
          </Badge>
          <Badge className={isBuy ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>
            {isBuy ? 'COMPRA' : 'VENDA'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-sm">
        <MetricItem label="Contratos" value={String(fill.contracts)} />
        <MetricItem label="Preço" value={formatCurrencyBr(fill.price)} />
        <MetricItem label="Bruto" value={formatCurrencyBr(fill.grossAmount)} />
        <MetricItem label="Taxa" value={formatCurrencyBr(fill.feeAmount)} />
        <MetricItem
          label="Líquido"
          value={formatSignedCurrencyBr(fill.netAmount)}
          valueClassName={netPositive ? 'text-emerald-600' : 'text-rose-600'}
        />
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  valueClassName
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn('font-medium text-slate-900', valueClassName)}>{value}</p>
    </div>
  );
}

function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  isFetching
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));

  if (total <= 0 || totalPages <= 1) return null;

  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">
        Mostrando {from}-{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1 || isFetching}
        >
          Anterior
        </Button>
        <span className="text-sm text-slate-500 px-2">
          Página {safePage} de {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages || isFetching}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
