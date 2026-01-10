"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { authClient } from "@/api/auth";
import { mockApi } from "@/api/mockClient";
import { createPageUrl } from "@/utils";

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
  politics: "Política",
  economy: "Economia",
  technology: "Tecnologia",
  entertainment: "Entretenimento",
  sports: "Esportes",
  global_events: "Eventos Globais",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: "Aberto", color: "bg-emerald-100 text-emerald-700" },
  closed: { label: "Encerrado", color: "bg-slate-100 text-slate-700" },
  resolved_yes: { label: "Resolvido: SIM", color: "bg-emerald-100 text-emerald-700" },
  resolved_no: { label: "Resolvido: NÃO", color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Cancelado", color: "bg-amber-100 text-amber-700" },
};

export default function Market({ user, refreshUser }: Props) {
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
  const router = useRouter();

  const { data: market, isLoading } = useQuery<any>({
    queryKey: ["market", marketId],
    queryFn: () => (mockApi as any).entities.Market.filter({ id: marketId }),
    select: (data: any) => data?.[0],
    enabled: !!marketId,
  });

  const { data: positions = [] } = useQuery<any[]>({
    queryKey: ["positions", marketId, user?.id],
    queryFn: () =>
      (mockApi as any).entities.Position.filter({
        market_id: marketId,
        user_id: user?.id,
        status: "open",
      }),
    enabled: !!marketId && !!user?.id,
  });

  const tradeMutation = useMutation<void, unknown, any>({
    mutationFn: async (tradeData: any) => {
      const { side, amount, contracts, price } = tradeData;

      await (mockApi as any).entities.Position.create({
        market_id: marketId,
        user_id: user.id,
        side,
        contracts,
        average_price: price,
        total_invested: amount,
        market_title: market.title,
      });

      await (mockApi as any).entities.Transaction.create({
        user_id: user.id,
        type: "buy",
        amount,
        net_amount: amount,
        market_id: marketId,
        market_title: market.title,
        side,
        contracts,
        price,
        description: `Compra de ${contracts} cotas ${String(side).toUpperCase()} em "${market.title}"`,
      });

      const newBalance = (user.balance || 0) - amount;
      await authClient.updateUser({
        balance: newBalance,
        total_wagered: (user.total_wagered || 0) + amount,
        markets_participated: (user.markets_participated || 0) + 1,
      });

      await (mockApi as any).entities.Market.update(marketId, {
        volume_total: (market.volume_total || 0) + amount,
        [`${side}_contracts`]: (market[`${side}_contracts`] || 0) + contracts,
      });
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

  const status = statusLabels[market.status] || statusLabels.open;
  const isOpen = market.status === "open";

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
                <Badge variant="outline" className="text-slate-600">
                  {categoryLabels[market.category] ?? "Categoria"}
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Chart */}
            <PriceChart />

            {/* User Position */}
            {Object.keys(userPosition).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
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
                {user && (
                  <div className="space-y-2">
                    {iaOpen ? (
                      <button
                        type="button"
                        onClick={toggleIa}
                        className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 flex items-center justify-between gap-3 shadow-sm cursor-pointer focus:outline-none"
                        aria-expanded="true"
                        aria-controls={riskPanelId}
                        aria-label="Assistente de Risco IA"
                      >
                        {IaButtonContent}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={toggleIa}
                        className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 flex items-center justify-between gap-3 shadow-sm cursor-pointer focus:outline-none"
                        aria-expanded="false"
                        aria-controls={riskPanelId}
                        aria-label="Assistente de Risco IA"
                      >
                        {IaButtonContent}
                      </button>
                    )}

                    <div id={riskPanelId} hidden={!iaOpen} aria-live="polite">
                      {iaOpen && <RiskAssistant market={market} userBalance={user.balance || 0} side={tradeSide} />}
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
                      className={`rounded-xl border bg-gradient-to-br p-4 text-center transition-all ${
                        tradeSide === "yes"
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
                      className={`rounded-xl border bg-gradient-to-br p-4 text-center transition-all ${
                        tradeSide === "no"
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

                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden flex market-progress" style={{
                      ['--yes' as any]: `${yesPercent}%`,
                      ['--no' as any]: `${noPercent}%`
                    }}>
                      <div className="bg-emerald-600 market-progress-fill-yes" />
                      <div className="bg-rose-600 market-progress-fill-no" />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-700">{yesPercent}%</span>
                      <span className="text-rose-700">{noPercent}%</span>
                    </div>
                  </div>

                  <TradingPanel
                    market={market}
                    userBalance={user?.balance || 0}
                    userId={user?.id}
                    onTrade={(data: any) => tradeMutation.mutate(data)}
                    side={tradeSide}
                    onSideChange={setTradeSide}
                  />
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
