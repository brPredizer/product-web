"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { walletClient } from "@/app/api/wallet";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/ui/StatsCard";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, ShoppingCart, Clock } from "lucide-react";
import { formatCurrencyValue, mapReceipts } from "./helpers";
import TransactionRow from "./TransactionRow";
import ReceiptModal from "./ReceiptModal";
import DepositDialog from "./DepositDialog";
import PixDialog from "./PixDialog";
import WithdrawDialog from "./WithdrawDialog";

interface WalletProps {
  user?: any;
  refreshUser?: () => void;
}

export default function WalletView({ user, refreshUser }: WalletProps) {
  const router = useRouter();

  const [depositSetupOpen, setDepositSetupOpen] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<any>(null);

  const balancesQuery = useQuery({
    queryKey: ["wallet-balances", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await (walletClient as any).getBalances?.();
      return res ?? [];
    },
  });

  const summaryQuery = useQuery({
    queryKey: ["wallet-summary", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await (walletClient as any).getSummary?.();
      return (
        res ?? {
          currency: "BRL",
          totalDeposited: 0,
          totalWithdrawn: 0,
          totalBought: 0,
        }
      );
    },
  });

  const receiptsQuery = useQuery({
    queryKey: ["wallet-receipts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await (walletClient as any).getReceipts?.();
      return res ?? { items: [], nextCursor: null };
    },
  });

  const availableBalance = useMemo(() => {
    const b = balancesQuery.data as any;
    const list = Array.isArray(b) ? b : b?.balances ?? b?.data ?? [];
    if (!Array.isArray(list)) return 0;
    const brl = list.find((item: any) => String(item?.currency || "").toUpperCase() === "BRL");
    return Number(brl?.available ?? brl?.balance ?? 0) || 0;
  }, [balancesQuery.data]);

  const totals = useMemo(() => {
    const raw = summaryQuery.data as any;
    const currency = String(raw?.currency || "BRL").toUpperCase();
    const deposited = Number(raw?.totalDeposited ?? 0) || 0;
    const withdrawn = Number(raw?.totalWithdrawn ?? 0) || 0;
    const bought = Number(raw?.totalBought ?? 0) || 0;

    return {
      currency,
      deposited,
      withdrawn,
      bought,
    };
  }, [summaryQuery.data]);

  const transactions = useMemo(() => {
    const rawReceipts = receiptsQuery.data as any;
    const items = Array.isArray(rawReceipts)
      ? rawReceipts
      : rawReceipts?.items ?? rawReceipts?.data?.items ?? rawReceipts?.data ?? [];
    return mapReceipts(items);
  }, [receiptsQuery.data]);

  const isLoading = balancesQuery.isLoading || summaryQuery.isLoading || receiptsQuery.isLoading;

  const handleOpenReceipt = (id: string | null) => {
    if (!id) return;
    setSelectedReceiptId(id);
    setReceiptModalOpen(true);
  };

  const handlePixReady = (data: any) => {
    setPixData(data);
    setPixOpen(true);
  };

  const handleClosePix = () => {
    setPixOpen(false);
    setPixData(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <WalletIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesse sua Carteira</h2>
          <p className="text-slate-500 mb-6">Faça login para gerenciar seu saldo.</p>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/sign-in")}>
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Carteira</h1>
          <p className="text-slate-500 mt-1">Gerencie seus depósitos e saques</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Saldo Disponível</p>
              <p className="text-4xl font-bold">{formatCurrencyValue(availableBalance, "BRL")}</p>
            </div>

            <div className="flex gap-3">
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setDepositSetupOpen(true)}>
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button
                variant="outline"
                className="text-white bg-rose-600 hover:bg-rose-700 border-transparent hover:border-transparent hover:text-white"
                onClick={() => setWithdrawOpen(true)}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Sacar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatsCard title="Total Depositado" value={formatCurrencyValue(totals.deposited, totals.currency)} icon={ArrowDownCircle} />
          <StatsCard title="Total Sacado" value={formatCurrencyValue(totals.withdrawn, totals.currency)} icon={ArrowUpCircle} />
          <StatsCard title="Total Comprado" value={formatCurrencyValue(totals.bought, totals.currency)} icon={ShoppingCart} />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-emerald-900 mb-3">Taxas Transparentes</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">
                Depósito: <strong>4,99%</strong> do valor
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">
                Saque: <strong>7,99%</strong> do valor
              </span>
            </div>
          </div>
          <p className="text-sm text-emerald-600 mt-3">Nenhuma taxa escondida. Nenhuma posição proprietária contra você.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Histórico</h3>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-24" />
                  </div>
                  <div className="h-5 bg-slate-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx: any) => (
                <TransactionRow key={tx.id} transaction={tx} onClick={tx?.id ? () => handleOpenReceipt(tx.id) : undefined} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Sem recibos</h3>
              <p className="text-slate-500">Suas transações aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>

      <DepositDialog
        open={depositSetupOpen}
        onOpenChange={setDepositSetupOpen}
        user={user}
        refreshUser={refreshUser}
        onPixReady={handlePixReady}
      />

      <PixDialog
        open={pixOpen}
        pixData={pixData}
        setPixData={setPixData}
        onClose={handleClosePix}
        refreshUser={refreshUser}
        userId={user?.id}
      />

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        refreshUser={refreshUser}
        userId={user?.id}
      />

      <ReceiptModal
        open={receiptModalOpen}
        receiptId={selectedReceiptId}
        onOpenChange={(open) => {
          setReceiptModalOpen(open);
          if (!open) setSelectedReceiptId(null);
        }}
      />
    </div>
  );
}
