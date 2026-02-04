"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { authClient } from "@/app/api/auth";
import { apiRequest, createIdempotencyKey, isAdminL2 } from "@/app/api/api";
import { mockApi } from "@/app/api/mockClient";
import { marketsClient } from '@/app/api/markets/client';
import { createPageUrl } from "@/routes";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Clock, Users, BookOpen, AlertTriangle, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

import TradingPanel from "@/components/trading/TradingPanel";
import RiskAssistant from "@/components/trading/RiskAssistant";
import PriceChart from "@/components/charts/PriceChart";

type Props = {
  user?: any;
  refreshUser?: () => void;
};

const categoryLabels: Record<string, string> = {
  'EM-ALTA': 'Em Alta',
  'NOVIDADES': 'Novidades',
  'TODAS': 'Todas',
  'POLITICA': 'Política',
  'ESPORTES': 'Esportes',
  'CULTURA': 'Cultura',
  'CRIPTOMOEDAS': 'Criptomoedas',
  'CLIMA': 'Clima',
  'ECONOMIA': 'Economia',
  'MENCOES': 'Menções',
  'EMPRESAS': 'Empresas',
  'FINANCAS': 'Finanças',
  'TECNOLOGIA-E-CIENCIA': 'Tecnologia e Ciência',
  'SAUDE': 'Saúde',
  'MUNDO': 'Mundo',
};

const categoryColors: Record<string, string> = {
  CLIMA: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/25',
  CRIPTOMOEDAS: 'bg-amber-500/10 text-amber-800 border-amber-500/25',
  CULTURA: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/25',
  ECONOMIA: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
  'EM-ALTA': 'bg-lime-400/15 text-lime-800 border-lime-500/25',
  EMPRESAS: 'bg-sky-500/10 text-sky-700 border-sky-500/25',
  ESPORTES: 'bg-orange-500/10 text-orange-700 border-orange-500/25',
  FINANCAS: 'bg-rose-500/10 text-rose-700 border-rose-500/25',
  MENCOES: 'bg-slate-200 text-slate-700 border-slate-300/60',
  MUNDO: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/25',
  NOVIDADES: 'bg-teal-500/10 text-teal-700 border-teal-500/25',
  POLITICA: 'bg-blue-500/10 text-blue-700 border-blue-500/25',
  SAUDE: 'bg-red-500/10 text-red-700 border-red-500/25',
  'TECNOLOGIA-E-CIENCIA': 'bg-purple-500/10 text-purple-700 border-purple-500/25',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: "Aberto", color: "bg-emerald-100 text-emerald-700" },
  closed: { label: "Encerrado", color: "bg-slate-100 text-slate-700" },
  resolved_yes: { label: "Resolvido: SIM", color: "bg-emerald-100 text-emerald-700" },
  resolved_no: { label: "Resolvido: NÃO", color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Cancelado", color: "bg-amber-100 text-amber-700" },
};

export default function Market({ user, refreshUser }: Props) {
  const { user: authUser, walletAvailableBalance } = useAuth();
  const effectiveUser = user ?? authUser;
  const [tradeSide, setTradeSide] = useState<string>("yes");
  const [iaOpen, setIaOpen] = useState<boolean>(false);
  const riskPanelId = useId();
  const progressRef = useRef<HTMLDivElement | null>(null);
  const toggleIa = () => setIaOpen((prev) => !prev);
  const IaButtonContent = (
    <>
      <div>
        <p className="text-sm font-semibold text-slate-900">Assistente de Risco IA</p>
        <p className="text-xs text-slate-500">Sugestões de posição e confiança</p>
      </div>
      <span className="p-2 rounded-full" aria-hidden="true">
        <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${iaOpen ? "rotate-180" : "rotate-0"}`} />
      </span>
    </>
  );

  const searchParams = useSearchParams();
  const marketId = searchParams.get("id");
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchQuery = searchParams?.toString();
  const nextPath = searchQuery ? `${pathname}?${searchQuery}` : (pathname ?? "/");

  const { data: market, isLoading } = useQuery<any>({
    queryKey: ["market", marketId],
    queryFn: async () => {
      if (!marketId) return null;
      try {
        const res = await apiRequest<any>(`/markets/${marketId}`);
        // backend may return the market object directly
        if (!res) return null;
        // if wrapped in { data: ... } or { items: [...] }, handle common shapes
        const raw = res.data ?? (res.items && Array.isArray(res.items) ? res.items[0] : res);
        if (!raw) return null;

        const { normalizeMarket } = await import("@/lib/normalizeMarket");
        const normalized = normalizeMarket(raw);
        return normalized;
      } catch (err) {
        return null;
      }
    },
    enabled: !!marketId,
  });

  // fetch history points for chart
  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["marketHistory", marketId],
    queryFn: async () => {
      if (!marketId) return [];
      try {
        const res = await apiRequest<any>(`/markets/${marketId}/history`);
        if (!res) return [];
        const list = Array.isArray(res) ? res : (Array.isArray(res.items) ? res.items : (Array.isArray(res.data) ? res.data : []));
        const { normalizeHistoryPoint } = await import("@/lib/normalizeMarket");
        return list.map((p: any) => normalizeHistoryPoint(p)).filter(Boolean);
      } catch (e) {
        return [];
      }
    },
    enabled: !!marketId,
  });

  const chartData = (history || []).map((p: any) => ({
    date: p.timestamp || p.date || new Date().toISOString(),
    price: Math.round((p.yesPrice ?? p.yes_price ?? 0) * 100),
    volume: Number(p.volume ?? 0),
  }));

  const { data: positions = [] } = useQuery<any[]>({
    queryKey: ["positions", marketId, effectiveUser?.id],
    queryFn: () =>
      (mockApi as any).entities.Position.filter({
        market_id: marketId,
        user_id: effectiveUser?.id,
        status: "open",
      }),
    enabled: !!marketId && !!effectiveUser?.id,
  });

  const tradeMutation = useMutation<void, unknown, any>({
    mutationFn: async (tradeData: any) => {
      const { side, amount, contracts, price } = tradeData;

      // call real backend trade endpoint
      const res = await marketsClient.buyMarket({
        MarketId: String(marketId),
        Side: side,
        Amount: Number(amount),
        IdempotencyKey: createIdempotencyKey(),
      });

      // try to extract new balance from common shapes and coerce to number
      const rawNewBalance = res?.NewBalance ?? res?.data?.NewBalance ?? res?.data?.newBalance ?? res?.newBalance;
      let parsedNewBalance: number | null = null;
      if (typeof rawNewBalance === 'number') parsedNewBalance = rawNewBalance;
      else if (typeof rawNewBalance === 'string' && rawNewBalance.trim() !== '') {
        const v = parseFloat(rawNewBalance);
        if (!isNaN(v)) parsedNewBalance = v;
      }

      if (parsedNewBalance !== null) {
        try {
          await authClient.updateUser({ balance: parsedNewBalance });
        } catch (e) {
          // non-fatal: if updating session fails, continue
          console.warn('Failed to update user session balance after trade', e);
        }
      }
    },
    onSuccess: () => {
      toast.success("Operação realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["market"] });
      refreshUser?.();
    },
    onError: () => {
      toast.error("Erro ao realizar operação");
    },
  });

  const yesPrice = Number(market?.yes_price ?? 0.5);
  const noPrice = Number(market?.no_price ?? (1 - yesPrice));

  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.max(0, 100 - yesPercent);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    el.style.setProperty("--yes", `${yesPercent}%`);
    el.style.setProperty("--no", `${noPercent}%`);
  }, [yesPercent, noPercent]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Mercado não encontrado</h2>
          <Link href={createPageUrl("Explore")}>
            <Button variant="outline">Voltar para Explorar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusLabels[market.status] || statusLabels.open;
  const isOpen = market.status === "open";
  const canEdit = isAdminL2(effectiveUser);

  const userPosition = positions.reduce((acc: any, pos: any) => {
    if (!acc[pos.side]) acc[pos.side] = { contracts: 0, invested: 0 };
    acc[pos.side].contracts += pos.contracts;
    acc[pos.side].invested += pos.total_invested;
    return acc;
  }, {} as any);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={createPageUrl("Explore")}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className={`text-slate-600 ${categoryColors[String(market.category ?? "")] ?? ""}`}
                >
                  {categoryLabels[String(market.category ?? "")] ?? "Categoria"}
                </Badge>
                <Badge className={status.color}>{status.label}</Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">{market.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                {market.closing_date && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      Encerra em {" "}
                      {format(new Date(market.closing_date), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>
                    R$ {(market.volume_total || 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    volume
                  </span>
                </div>
              </div>
            </div>
            {canEdit && marketId && (
              <div className="shrink-0">
                <Link href={createPageUrl(`CreateMarket?id=${marketId}`)}>
                  <Button variant="outline" className="border-slate-200">
                    Editar mercado
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Chart */}
            <PriceChart data={history} side={tradeSide as 'yes' | 'no'} />

            {/* User Position */}
            {Object.keys(userPosition).length > 0 && (
              <div className="bg-white  p-0">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Sua Posição</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {userPosition.yes && (
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-700">SIM</span>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {userPosition.yes.contracts} cotas
                        </Badge>
                      </div>

                      <p className="text-2xl font-bold text-emerald-600">
                        {userPosition.yes.invested.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <p className="text-sm text-emerald-600/70">investido</p>
                    </div>
                  )}

                  {userPosition.no && (
                    <div className="bg-rose-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-rose-700">NÃO</span>
                        <Badge className="bg-rose-100 text-rose-700">
                          {userPosition.no.contracts} cotas
                        </Badge>
                      </div>

                      <p className="text-2xl font-bold text-rose-600">
                        {userPosition.no.invested.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <p className="text-sm text-rose-600/70">investido</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-400" />
                Sobre este Mercado
              </h3>
              <p className="text-slate-600 leading-relaxed">{market.description || "Descrição não disponível."}</p>
            </div>

            {/* Resolution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Critérios de Resolução</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Fonte de Verificação</p>
                  <p className="text-slate-900">{market.resolution_source || "A definir"}</p>
                </div>

                {market.resolution_date && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Data de Resolução</p>
                    <p className="text-slate-900">
                      {format(new Date(market.resolution_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium mb-1">Aviso de Risco</p>
                  <p>
                    Negociar cotas preditivas envolve risco de perda do capital investido. Invista apenas o que você pode
                    perder.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Trading */}
          <div className="lg:col-span-1">
            {isOpen ? (
              <div className="sticky top-24 space-y-4">
                {effectiveUser && (
                  <div className="w-full">
                    <div className="bg-white rounded-2xl border border-purple-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={toggleIa}
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 focus:outline-none"
                        aria-controls={riskPanelId}
                        aria-label="Assistente de Risco IA"
                      >
                        {IaButtonContent}
                      </button>

                      {iaOpen && (
                        <div id={riskPanelId} className="p-4" aria-live="polite">
                          <RiskAssistant market={market} userBalance={walletAvailableBalance ?? effectiveUser?.balance ?? 0} side={tradeSide} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold uppercase tracking-wide text-slate-600">Negociar</p>
                    <p className="text-sm text-slate-600">Selecione SIM ou NÃO abaixo e informe o valor</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTradeSide("yes")}
                      className={`rounded-xl border bg-gradient-to-br p-4 text-center transition-all ${tradeSide === "yes"
                        ? "border-emerald-300 ring-2 ring-emerald-200 from-emerald-50 to-white"
                        : "border-slate-200 from-slate-50 to-white hover:border-slate-300"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-emerald-700">SIM</span>
                        <p className="text-3xl font-bold tracking-tight text-emerald-700">R$ {yesPrice.toFixed(2)}</p>
                        <p className="text-xs font-semibold text-emerald-700">{yesPercent}% probabilidade</p>
                        <p className="text-xs text-slate-500">Preço por contrato</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTradeSide("no")}
                      className={`rounded-xl border bg-gradient-to-br p-4 text-center transition-all ${tradeSide === "no"
                        ? "border-rose-300 ring-2 ring-rose-200 from-rose-50 to-white"
                        : "border-slate-200 from-slate-50 to-white hover:border-slate-300"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-rose-700">NÃO</span>
                        <p className="text-3xl font-bold tracking-tight text-rose-700">R$ {noPrice.toFixed(2)}</p>
                        <p className="text-xs font-semibold text-rose-700">{noPercent}% probabilidade</p>
                        <p className="text-xs text-slate-500">Preço por contrato</p>
                      </div>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-700">SIM</span>
                      <span className="text-rose-700">NÃO</span>
                    </div>

                    <div ref={progressRef} className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden flex market-progress">
                      <div className="bg-emerald-600 market-progress-fill-yes" />
                      <div className="bg-rose-600 market-progress-fill-no" />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-700">{yesPercent}%</span>
                      <span className="text-rose-700">{noPercent}%</span>
                    </div>
                  </div>

                  {effectiveUser ? (
                    <TradingPanel
                      market={market}
                      userBalance={walletAvailableBalance ?? effectiveUser?.balance ?? 0}
                      userId={effectiveUser?.id}
                      onTrade={(data: any) => tradeMutation.mutate(data)}
                      side={tradeSide}
                      onSideChange={setTradeSide}
                      hideSideSelector={true}
                      showRiskAssistant={false}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                      {/* Removido: cartões SIM/NÃO duplicados (já presentes acima) */}

                      <p className="text-sm text-slate-600 mb-4">Faça login para negociar neste mercado.</p>

                      <div className="flex items-center justify-center">
                        <Link href={createPageUrl("SignIn") + `?next=${encodeURIComponent(nextPath)}`}>
                          <Button className="w-full  bg-emerald-600 hover:bg-emerald-700">Entrar para negociar</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Negociação indisponível</p>
                    <p className="text-sm text-slate-500">Este mercado não está aberto para negociação.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



