import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletClient } from '@/api/wallet';
import { paymentsClient } from '@/api/payments';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

const DEPOSIT_FEE = 0.025; // 2.5%
const WITHDRAWAL_FEE = 0.075; // 7.5%

export default function WalletPage({ user, refreshUser }) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('PIX');
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: balances = [], isLoading: isLoadingBalances } = useQuery({
    queryKey: ['wallet-balances', user?.id],
    queryFn: walletClient.getBalances,
    enabled: !!user?.id
  });

  const { data: ledgerData, isLoading: isLoadingLedger } = useQuery({
    queryKey: ['wallet-ledger', user?.id],
    queryFn: () => walletClient.getLedger({ limit: 50 }),
    enabled: !!user?.id
  });
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: paymentsClient.getMethods,
    enabled: !!user?.id
  });

  const transactions = useMemo(
    () => mapLedgerEntries(ledgerData?.entries || []),
    [ledgerData?.entries]
  );
  const brlBalance = balances.find((item) => item.currency === 'BRL');
  const availableBalance = brlBalance?.available ?? 0;
  const cardMethods = useMemo(
    () => (paymentMethods || []).filter((method) => method.type === 'CARD'),
    [paymentMethods]
  );
  const totals = useMemo(
    () =>
      transactions.reduce(
        (acc, tx) => {
          const amountValue = Math.abs(Number(tx.amount ?? tx.net_amount ?? 0));
          if (tx.type === 'deposit') acc.deposited += amountValue;
          if (tx.type === 'withdrawal') acc.withdrawn += amountValue;
          return acc;
        },
        { deposited: 0, withdrawn: 0 }
      ),
    [transactions]
  );
  const isLoading = isLoadingBalances || isLoadingLedger;

  const depositMutation = useMutation({
    mutationFn: async ({ depositAmount }) => {
      await walletClient.createDepositIntent({ amount: depositAmount });
    },
    onSuccess: () => {
      toast.success('Deposito realizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['wallet-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet-ledger', user?.id] });
      refreshUser?.();
      setDepositOpen(false);
      setAmount('');
    },
    onError: (error) => {
      toast.error(error?.message || 'Falha ao realizar deposito.');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (withdrawAmount) => {
      await walletClient.createWithdrawal({ amount: withdrawAmount });
    },
    onSuccess: () => {
      toast.success('Saque solicitado! Aguarde aprovacao do administrador.');
      queryClient.invalidateQueries({ queryKey: ['wallet-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet-ledger', user?.id] });
      refreshUser?.();
      setWithdrawOpen(false);
      setAmount('');
    },
    onError: (error) => {
      toast.error(error?.message || 'Falha ao solicitar saque.');
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesse sua Carteira</h2>
          <p className="text-slate-500 mb-6">Faça login para gerenciar seu saldo.</p>
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => router.push('/Login')}
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  const depositAmount = parseFloat(amount) || 0;
  const depositFee = depositAmount * DEPOSIT_FEE;
  const depositNet = depositAmount - depositFee;

  const withdrawAmount = parseFloat(amount) || 0;
  const withdrawFee = withdrawAmount * WITHDRAWAL_FEE;
  const withdrawNet = withdrawAmount - withdrawFee;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Carteira</h1>
          <p className="text-slate-500 mt-1">Gerencie seus depósitos e saques</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Saldo Disponível</p>
              <p className="text-4xl font-bold">
                R$ {availableBalance.toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Depositar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Depositar</DialogTitle>
                    <DialogDescription>
                      Escolha o método e adicione saldo
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Método de Pagamento</label>
                      <Tabs value={depositMethod} onValueChange={setDepositMethod}>
                        <TabsList>
                          <TabsTrigger value="PIX">PIX</TabsTrigger>
                          <TabsTrigger value="Cartão">Cartão</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      {depositMethod === 'Cartão' && (
                        <p className="text-xs text-slate-500 mt-2">
                          {(cardMethods.length > 0)
                            ? `Usando cartões salvos (${cardMethods.length}). Altere em Minha Conta.`
                            : 'Nenhum cartão cadastrado. Cadastre em Minha Conta > Pagamentos.'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Valor do Depósito
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0,00"
                          className="pl-10 h-12 text-lg"
                        />
                      </div>
                    </div>

                    {depositAmount > 0 && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Valor</span>
                          <span className="font-medium">R$ {depositAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Taxa (2,5%)</span>
                          <span className="font-medium text-rose-600">- R$ {depositFee.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-medium">Você recebe</span>
                          <span className="font-bold text-emerald-600">R$ {depositNet.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-700">
                        Este é um ambiente de demonstração. Nenhum dinheiro real será transferido.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDepositOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={
                        depositAmount < 10 ||
                        depositMutation.isPending ||
                        (depositMethod === 'Cartão' && cardMethods.length === 0)
                      }
                      onClick={() => depositMutation.mutate({ depositAmount })}
                    >
                      {depositMutation.isPending ? 'Processando...' : `Confirmar (${depositMethod})`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white">
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Sacar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Sacar</DialogTitle>
                    <DialogDescription>
                      Transfira seu saldo para sua conta bancária
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Valor do Saque
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0,00"
                          max={availableBalance}
                          className="pl-10 h-12 text-lg"
                        />
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Saldo disponível: R$ {availableBalance.toFixed(2)}
                      </p>
                    </div>

                    {withdrawAmount > 0 && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Valor solicitado</span>
                          <span className="font-medium">R$ {withdrawAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Taxa (7,5%)</span>
                          <span className="font-medium text-rose-600">- R$ {withdrawFee.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-medium">Você recebe</span>
                          <span className="font-bold text-emerald-600">R$ {withdrawNet.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={withdrawAmount < 10 || withdrawAmount > availableBalance || withdrawMutation.isPending}
                      onClick={() => withdrawMutation.mutate(withdrawAmount)}
                    >
                      {withdrawMutation.isPending ? 'Processando...' : 'Confirmar Saque'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="Total Depositado"
            value={`R$ ${totals.deposited.toFixed(2)}`}
            icon={ArrowDownCircle}
          />
          <StatsCard
            title="Total Sacado"
            value={`R$ ${totals.withdrawn.toFixed(2)}`}
            icon={ArrowUpCircle}
          />
          <StatsCard
            title="Total Apostado"
            value={`R$ ${(user.total_wagered || 0).toFixed(2)}`}
            icon={CreditCard}
          />
        </div>

        {/* Fee Transparency */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-emerald-900 mb-3">Taxas Transparentes</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Depósito: <strong>2,5%</strong> do valor</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Saque: <strong>7,5%</strong> do valor</span>
            </div>
          </div>
          <p className="text-sm text-emerald-600 mt-3">
            Nenhuma taxa escondida. Nenhuma posição proprietária contra você.
          </p>
        </div>

        {/* Transactions */}
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
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Sem transações</h3>
              <p className="text-slate-500">Suas transações aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function mapLedgerEntries(entries = []) {
  const typeMap = {
    DEPOSIT: 'deposit',
    DEPOSIT_GATEWAY: 'deposit',
    WITHDRAWAL: 'withdrawal',
    WITHDRAWAL_REQUEST: 'withdrawal',
    WITHDRAWAL_APPROVED: 'withdrawal',
    WITHDRAWAL_REJECTED: 'withdrawal',
    FEE: 'fee',
    ORDER: 'buy',
    BUY: 'buy',
    SELL: 'sell',
    PAYOUT: 'payout'
  };
  const statusMap = {
    PENDING: { key: 'pending', label: 'Pendente', tone: 'bg-amber-100 text-amber-700' },
    REQUESTED: { key: 'pending', label: 'Pendente', tone: 'bg-amber-100 text-amber-700' },
    APPROVED: { key: 'approved', label: 'Aprovado', tone: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { key: 'rejected', label: 'Rejeitado', tone: 'bg-rose-100 text-rose-700' },
    CANCELLED: { key: 'cancelled', label: 'Cancelado', tone: 'bg-slate-100 text-slate-700' },
    FAILED: { key: 'failed', label: 'Falhou', tone: 'bg-rose-100 text-rose-700' },
    COMPLETED: { key: 'completed', label: 'Concluido', tone: 'bg-emerald-100 text-emerald-700' }
  };
  const descriptionMap = {
    withdrawal: 'Saque',
    deposit: 'Deposito',
    fee: 'Taxa',
    market: 'Mercado',
    order: 'Compra',
    paymentintent: 'Deposito',
    payment: 'Pagamento',
    payout: 'Pagamento'
  };
  const typeFallbackMap = {
    withdrawal: 'withdrawal',
    deposit: 'deposit',
    fee: 'fee',
    order: 'buy',
    payment: 'payout',
    payout: 'payout',
    paymentintent: 'deposit'
  };

  const getDescriptionTokens = (value) => {
    const normalized = String(value).trim().toLowerCase();
    return [
      normalized,
      normalized.replace(/[^a-z0-9]+/g, ''),
      normalized.replace(/[^a-z0-9]+/g, '_')
    ];
  };

  const translateDescription = (value) => {
    if (!value) return value;
    const tokens = getDescriptionTokens(value);
    for (const token of tokens) {
      if (descriptionMap[token]) return descriptionMap[token];
    }
    return value;
  };

  const resolveTypeFromText = (value) => {
    if (!value) return null;
    const tokens = getDescriptionTokens(value);
    for (const token of tokens) {
      if (typeFallbackMap[token]) return typeFallbackMap[token];
    }
    return null;
  };

  return entries.map((entry, index) => {
    const rawType = String(entry?.type || '');
    let normalizedType = typeMap[rawType] || typeMap[rawType.toUpperCase()] || 'other';
    const amount = Number(entry?.amount ?? 0);
    const rawStatus = String(entry?.status || '');
    const normalizedStatus = statusMap[rawStatus] || statusMap[rawStatus.toUpperCase()] || null;
    const rawDescription = entry?.description || entry?.referenceType || entry?.type || 'Movimento';
    if (normalizedType === 'other') {
      normalizedType = resolveTypeFromText(rawDescription) || normalizedType;
    }

    return {
      id: entry?.id || entry?.referenceId || `${rawType || 'entry'}-${index}`,
      type: normalizedType,
      amount,
      net_amount: Math.abs(amount),
      fee: Number(entry?.fee ?? 0),
      status: normalizedStatus?.key || entry?.status || null,
      statusLabel: normalizedStatus?.label || null,
      statusTone: normalizedStatus?.tone || null,
      description: translateDescription(rawDescription),
      createdAt: entry?.createdAt
    };
  });
}
function TransactionRow({ transaction }) {
  const typeConfig = {
    deposit: {
      icon: ArrowDownCircle,
      color: 'text-emerald-600 bg-emerald-100',
      label: 'Deposito',
      sign: '+'
    },
    withdrawal: {
      icon: ArrowUpCircle,
      color: 'text-rose-600 bg-rose-100',
      label: 'Saque',
      sign: '-'
    },
    fee: {
      icon: AlertCircle,
      color: 'text-amber-600 bg-amber-100',
      label: 'Taxa',
      sign: '-'
    },
    buy: {
      icon: CreditCard,
      color: 'text-blue-600 bg-blue-100',
      label: 'Compra',
      sign: '-'
    },
    sell: {
      icon: CreditCard,
      color: 'text-purple-600 bg-purple-100',
      label: 'Venda',
      sign: '+'
    },
    payout: {
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-100',
      label: 'Pagamento',
      sign: '+'
    },
    other: {
      icon: AlertCircle,
      color: 'text-slate-600 bg-slate-100',
      label: 'Movimento',
      sign: ''
    }
  };

  const config = typeConfig[transaction.type] || typeConfig.other;
  const Icon = config.icon;
  const createdAt = transaction.createdAt || transaction.created_date;
  const createdLabel = createdAt
    ? format(new Date(createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })
    : '-';

  return (
    <div className="p-4 sm:p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
      <div className={cn("p-2.5 rounded-full", config.color)}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900">{config.label}</p>
        <p className="text-sm text-slate-500 truncate">
          {transaction.description || transaction.market_title || '-'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {createdLabel}
        </p>
      </div>

      <div className="text-right">
        <p className={cn(
          "font-semibold",
          config.sign === '+' ? "text-emerald-600" : "text-slate-900"
        )}>
          {config.sign}R$ {(transaction.net_amount || transaction.amount || 0).toFixed(2)}
        </p>
        {transaction.fee > 0 && (
          <p className="text-xs text-slate-500">
            Taxa: R$ {transaction.fee.toFixed(2)}
          </p>
        )}
        {transaction.statusLabel && (
          <Badge className={`${transaction.statusTone || 'bg-slate-100 text-slate-700'} mt-1`}>
            {transaction.statusLabel}
          </Badge>
        )}
      </div>
    </div>
  );
}










