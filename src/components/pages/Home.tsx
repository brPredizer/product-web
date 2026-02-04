"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { apiRequest } from "@/app/api/api";
import { createPageUrl } from "@/routes";
import { normalizeMarket } from "@/lib/normalizeMarket";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  ArrowRight,
  Shield,
  Eye,
  BarChart3,
  Zap,
  ChevronRight,
  Flame,
  TrendingUp,
  Clock,
} from "lucide-react";

import MarketCard from "@/components/ui/MarketCard";

const categories = [
  { id: "TODAS", name: "Todas" },
  { id: "EM-ALTA", name: "Em Alta" },
  { id: "NOVIDADES", name: "Novidades" },
  { id: "POLITICA", name: "Política" },
  { id: "ESPORTES", name: "Esportes" },
  { id: "CULTURA", name: "Cultura" },
  { id: "CRIPTOMOEDAS", name: "Criptomoedas" },
  { id: "CLIMA", name: "Clima" },
  { id: "ECONOMIA", name: "Economia" },
  { id: "MENCOES", name: "Menções" },
  { id: "EMPRESAS", name: "Empresas" },
  { id: "FINANCAS", name: "Finanças" },
  { id: "TECNOLOGIA-E-CIENCIA", name: "Tecnologia e Ciência" },
  { id: "SAUDE", name: "Saúde" },
  { id: "MUNDO", name: "Mundo" },
];

const categoryLabelMap = categories.reduce<Record<string, string>>((acc, cat) => {
  acc[cat.id] = cat.name;
  return acc;
}, {});

function exploreUrlWithCategory(categoryId?: string) {
  const base = createPageUrl("Explore");
  if (!categoryId || categoryId === "TODAS") return base;
  return `${base}?category=${encodeURIComponent(categoryId)}`;
}

export default function Home(): JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>("TODAS");

  const { data: markets = [], isLoading } = useQuery<any[]>({
    queryKey: ["markets", "open"],
    queryFn: async () => {
      try {
        const result = await apiRequest<any>(`/markets?status=open&limit=50&sort=popular`);
        const rawList: any[] = Array.isArray(result)
          ? result
          : Array.isArray(result.items)
            ? result.items
            : Array.isArray(result.data)
              ? result.data
              : [];
        return rawList.map((market) => normalizeMarket(market)).filter(Boolean);
      } catch (error) {
        return [];
      }
    },
  });

  const stats = useMemo(() => {
    const totalVolume = markets.reduce((sum: number, m: any) => sum + (m.volume_total || 0), 0);
    const activeMarkets = markets.length;
    const totalUsers = 12547; // mock
    return { totalVolume, activeMarkets, totalUsers };
  }, [markets]);

  const featuredMarkets = useMemo(() => markets.filter((m: any) => m.featured).slice(0, 9), [markets]);

  const trendingMarkets = useMemo(() => {
    const now = Date.now();
    const filtered = (() => {
      if (activeCategory === "TODAS") return markets;
      if (activeCategory === "EM-ALTA") {
        return markets.filter((m: any) => {
          const vol24 = m.volume_24h || 0;
          const vol7 = m.volume_7d_avg || 0;
          return vol24 && vol7 ? vol24 >= vol7 * 1.2 : false;
        });
      }
      if (activeCategory === "NOVIDADES") {
        return markets.filter((m: any) => {
          if (!m.created_date) return false;
          const diffDays = (now - new Date(m.created_date).getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        });
      }
      return markets.filter((m: any) => m.category === activeCategory);
    })();

    return [...filtered]
      .sort((a: any, b: any) => (b.volume_total || 0) - (a.volume_total || 0))
      .slice(0, 12);
  }, [markets, activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(45,212,191,0.12),transparent_45%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-35" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 mb-6">
                  <Zap className="w-3 h-3 mr-1" />
                  O futuro das previsões financeiras
                </Badge>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Transforme sua{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                    opinião
                  </span>{" "}
                  em posição
                </h1>

                <p className="text-lg sm:text-xl text-slate-300/90 mb-10 leading-relaxed max-w-2xl">
                  Negocie contratos SIM/NÃO sobre eventos reais com transparência. Uma experiência
                  simples por fora — robusta por baixo.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href={createPageUrl("Explore")} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-base px-8 h-12
                                 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30
                                 transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0"
                    >
                      Explorar Mercados
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  <Link href={createPageUrl("Learn")} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto h-12 px-8 text-base
               bg-transparent text-white border-white/25
               hover:bg-white/20 hover:border-white/35
               transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 hover:text-white"
                    >
                      Como Funciona
                    </Button>
                  </Link>

                </div>
              </motion.div>
            </div>

            {/* STATS */}
            <div className="lg:col-span-5">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold tabular-nums whitespace-nowrap">
                      <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                        <span>R$</span>
                        <span>{(stats.totalVolume / 1_000_000).toFixed(1)}M+</span>
                      </span>
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300/70 mt-1">Volume Total</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.activeMarkets}+</p>
                    <p className="text-xs sm:text-sm text-slate-300/70 mt-1">Mercados</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold">
                      {Math.round(stats.totalUsers / 1000)}k+
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300/70 mt-1">Traders</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3 text-sm text-slate-200/80">
                  <span className="inline-flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-300" />
                    100% transparente
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-300" />
                    taxas visíveis
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-300" />
                    sem posição proprietária
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featuredMarkets.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between gap-4 mb-7">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Em Destaque</h2>
              <p className="text-slate-500 mt-1">Os mercados mais relevantes do momento.</p>
            </div>

            <Link
              href={createPageUrl("Explore")}
              className="text-emerald-700 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredMarkets.map((market: any, index: number) => (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <MarketCard market={market} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* QUICK EXPLORE */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Explorar rapidamente</h2>
              <p className="text-slate-500 mt-1">Escolha uma categoria e caia no Explore já filtrado.</p>
            </div>

            <Link href={createPageUrl("Explore")} className="text-slate-700 hover:text-slate-900 text-sm font-medium">
              Ir para Explore <ArrowRight className="inline w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-0 py-2 text-sm font-semibold border-b-2 transition-colors shrink-0 ${activeCategory === cat.id
                    ? "text-emerald-700 border-emerald-600"
                    : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-800">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold">Mais negociados</h3>
                <span className="text-slate-500 text-sm">
                  ({activeCategory === "TODAS" ? "geral" : (categoryLabelMap[activeCategory] ?? activeCategory)})
                </span>
              </div>

              <Link
                href={exploreUrlWithCategory(activeCategory)}
                className="text-emerald-700 text-sm font-medium hover:text-emerald-800"
              >
                Ver lista completa <ChevronRight className="inline w-4 h-4 ml-1" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
                    <div className="h-6 bg-slate-200 rounded w-full mb-2" />
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
                    <div className="h-2 bg-slate-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : trendingMarkets.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingMarkets.map((market: any, index: number) => (
                  <motion.div
                    key={market.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <MarketCard market={market} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Sem mercados abertos aqui</h3>
                <p className="text-slate-500 text-sm">Tente outra categoria ou veja tudo no Explore.</p>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={exploreUrlWithCategory(activeCategory)} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white h-11 px-7
                           transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0"
              >
                Abrir Explore desta categoria
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href={createPageUrl("Learn")} className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-11 px-7
                           border-slate-300 text-slate-800 hover:bg-slate-100
                           transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0"
              >
                Aprender antes de operar
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}


