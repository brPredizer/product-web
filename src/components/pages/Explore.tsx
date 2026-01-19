"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { mockApi } from "@/app/api/mockClient";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isAdminL1 } from "@/app/api/api";
import { createPageUrl } from "@/routes";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import MarketCard from "@/components/ui/MarketCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const categories = [
  { id: "trending", name: "Em Alta" },
  { id: "new", name: "Novidades" },
  { id: "all", name: "Todas" },
  { id: "politics", name: "Política" },
  { id: "sports", name: "Esportes" },
  { id: "culture", name: "Cultura" },
  { id: "crypto", name: "Criptomoedas" },
  { id: "weather", name: "Clima" },
  { id: "economy", name: "Economia" },
  { id: "mentions", name: "Menções" },
  { id: "companies", name: "Empresas" },
  { id: "finance", name: "Finanças" },
  { id: "technology", name: "Tecnologia e Ciência" },
  { id: "health", name: "Saúde" },
  { id: "world", name: "Mundo" },
];

const sortOptions = [
  { value: "-volume_total", label: "Mais Popular" },
  { value: "-created_date", label: "Mais Recente" },
  { value: "closing_date", label: "Encerra Primeiro" },
  { value: "-yes_price", label: "Maior Probabilidade" },
  { value: "yes_price", label: "Menor Probabilidade" },
  { value: "-imbalance", label: "Maior Desbalanceamento" },
  { value: "-volatility_24h", label: "Maior Volatilidade (24h)" },
];

const probabilityBuckets = [
  { id: "low", label: "0% - 30%", min: 0, max: 0.3 },
  { id: "mid", label: "30% - 70%", min: 0.3, max: 0.7 },
  { id: "high", label: "70% - 100%", min: 0.7, max: 1 },
];

const closingOptions = [
  { id: "any", label: "Qualquer data" },
  { id: "today", label: "Hoje" },
  { id: "7", label: "Até 7 dias" },
  { id: "30", label: "Até 30 dias" },
  { id: "90", label: "Até 90 dias" },
];

export default function Explore({ user }: { user?: any }): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // agora 0 ou 1 categoria
  const [sort, setSort] = useState<string>("-volume_total");
  const [viewMode, setViewMode] = useState<string>("grid");
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  const [probabilityFilters, setProbabilityFilters] = useState<string[]>([]);
  const [closingRange, setClosingRange] = useState<string>("any");
  const [statusFilters, setStatusFilters] = useState<string[]>([]); // 'new', 'trending'

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");

    if (!categoryFromUrl) return;

    const exists = categories.some((c) => c.id === categoryFromUrl && c.id !== "all");
    if (!exists) return;

    setSelectedCategories((prev) => {
      const same = prev.length === 1 && prev[0] === categoryFromUrl;
      if (same) return prev;
      return [categoryFromUrl];
    });
  }, [searchParams]);

  const setCategoryAndUrl = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (id === "all") {
      setSelectedCategories([]);
      params.delete("category");
      router.replace(`${createPageUrl("Explore")}?${params.toString()}`, { scroll: false });
      return;
    }

    setSelectedCategories([id]);
    params.set("category", id);
    router.replace(`${createPageUrl("Explore")}?${params.toString()}`, { scroll: false });
  };

  const isCategoryActive = (id: string) => (id === "all" ? selectedCategories.length === 0 : selectedCategories.includes(id));

  const toggleInArray = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const { data: markets = [], isLoading } = useQuery<any[]>({
    queryKey: ["markets", "explore", sort],
    queryFn: async () => {
      const data = await (mockApi as any).entities.Market.filter({ status: "open" }, sort, 100);
      return data;
    },
  });

  const filteredMarkets = useMemo(() => {
    const now = Date.now();

    return markets
      .filter((market: any) => {
        const matchesSearch =
          !search ||
          market.title?.toLowerCase().includes(search.toLowerCase()) ||
          market.description?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(market.category);

        const matchesProbability =
          probabilityFilters.length === 0 ||
          probabilityBuckets
            .filter((b) => probabilityFilters.includes(b.id))
            .some((b) => {
              const price = market.yes_price ?? 0;
              return price >= b.min && price <= b.max;
            });

        const closing = market.closing_date ? new Date(market.closing_date).getTime() : null;
        const matchesClosing = (() => {
          if (!closing || closingRange === "any") return true;
          const diffDays = (closing - now) / (1000 * 60 * 60 * 24);
          if (closingRange === "today") return diffDays <= 1;
          return diffDays <= Number(closingRange);
        })();

        const isNew = (() => {
          if (!market.created_date) return false;
          const diffDays = (now - new Date(market.created_date).getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        })();

        const isTrending = (() => {
          const vol24 = market.volume_24h || 0;
          const vol7 = market.volume_7d_avg || 0;
          if (!vol24 || !vol7) return false;
          return vol24 >= vol7 * 1.2;
        })();

        const matchesStatus =
          statusFilters.length === 0 ||
          statusFilters.every((status) => {
            if (status === "new") return isNew;
            if (status === "trending") return isTrending;
            return true;
          });

        return (
          matchesSearch &&
          matchesCategory &&
          matchesProbability &&
          matchesClosing &&
          matchesStatus
        );
      })
      .sort((a: any, b: any) => {
        if (sort === "-volume_total") return (b.volume_total || 0) - (a.volume_total || 0);
        if (sort === "-created_date") return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
        if (sort === "closing_date") return new Date(a.closing_date).getTime() - new Date(b.closing_date).getTime();
        if (sort === "-yes_price") return (b.yes_price || 0) - (a.yes_price || 0);
        if (sort === "yes_price") return (a.yes_price || 0) - (b.yes_price || 0);
        if (sort === "-imbalance") {
          const imbalance = (m: any) => Math.abs((m.yes_price ?? 0.5) - 0.5);
          return imbalance(b) - imbalance(a);
        }
        if (sort === "-volatility_24h") return (b.volatility_24h || 0) - (a.volatility_24h || 0);
        return 0;
      });
  }, [markets, search, selectedCategories, probabilityFilters, closingRange, statusFilters, sort]);

  const activeFiltersCount =
    selectedCategories.length +
    probabilityFilters.length +
    (closingRange !== "any" ? 1 : 0) +
    statusFilters.length +
    (search ? 1 : 0);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setProbabilityFilters([]);
    setClosingRange("any");
    setStatusFilters([]);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    router.replace(`${createPageUrl("Explore")}?${params.toString()}`, { scroll: false });
  };

  const showCreateAction = isAdminL1(user);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Explorar Mercados</h1>
                <p className="text-slate-500 mt-1">{filteredMarkets.length} mercados disponíveis</p>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                {showCreateAction && (
                  <Link href={createPageUrl("CreateMarket")}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Criar mercado
                    </Button>
                  </Link>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Modo grade"
                    title="Modo grade"
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="Modo lista"
                    title="Modo lista"
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar mercados..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-10 h-11"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Limpar busca"
                    title="Limpar busca"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[200px] h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-11 relative">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>

                  <SheetContent className="w-full sm:max-w-[480px]">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>

                    <div className="mt-6 space-y-6 pb-6 pr-1 max-h-[80vh] overflow-y-auto">
                      {/* Categorias */}
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Categorias</p>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setCategoryAndUrl(cat.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                isCategoryActive(cat.id)
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Probabilidade */}
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Probabilidade (SIM)</p>
                        <div className="flex flex-wrap gap-2">
                          {probabilityBuckets.map((bucket) => (
                            <button
                              key={bucket.id}
                              onClick={() => toggleInArray(bucket.id, setProbabilityFilters)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                probabilityFilters.includes(bucket.id)
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              {bucket.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Encerra */}
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Encerra até</p>
                        <div className="flex flex-wrap gap-2">
                          {closingOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setClosingRange(opt.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                closingRange === opt.id
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Status</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "new", label: "Recém-criado (7d)" },
                            { id: "trending", label: "Trending (volume 24h > 7d)" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => toggleInArray(opt.id, setStatusFilters)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                statusFilters.includes(opt.id)
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                          Aplicar
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            clearAllFilters();
                            setFiltersOpen(false);
                          }}
                        >
                          Limpar Filtros
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Category Tabs (top) */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <div className="flex gap-3 items-center">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryAndUrl(cat.id)}
                    className={cn(
                      "px-0 py-2 text-sm font-semibold border-b-2 transition-colors shrink-0",
                      isCategoryActive(cat.id)
                        ? "text-emerald-700 border-emerald-600"
                        : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div
            className={cn(
              "gap-6",
              viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
            )}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
                <div className="h-6 bg-slate-200 rounded w-full mb-2" />
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-2 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredMarkets.length > 0 ? (
          <div
            className={cn(
              "gap-6",
              viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
            )}
          >
            <AnimatePresence mode="popLayout">
              {filteredMarkets.map((market: any, index: number) => (
                <motion.div
                  key={market.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <MarketCard market={market} compact={viewMode === "list"} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum resultado</h3>
            <p className="text-slate-500 mb-6">Tente ajustar os filtros ou termo de busca.</p>
            <Button variant="outline" onClick={clearAllFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
