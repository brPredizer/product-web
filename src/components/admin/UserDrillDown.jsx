import React from 'react';
import { mockApi } from '@/api/mockClient';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Wallet, 
  TrendingUp, 
  Activity,
  Clock,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UserDrillDown({ userId, open, onClose }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await mockApi.entities.User.filter({ id: userId });
      return users[0];
    },
    enabled: !!userId && open
  });

  const { data: positions = [] } = useQuery({
    queryKey: ['user-positions', userId],
    queryFn: () => mockApi.entities.Position.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId && open
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['user-transactions', userId],
    queryFn: () => mockApi.entities.Transaction.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId && open
  });

  if (!user) return null;

  const deposits = transactions.filter(t => t.type === 'deposit');
  const withdrawals = transactions.filter(t => t.type === 'withdrawal');
  
  const totalDeposited = deposits.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalWithdrawn = withdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);
  const depositFees = deposits.reduce((sum, t) => sum + (t.fee || 0), 0);
  const withdrawalFees = withdrawals.reduce((sum, t) => sum + (t.fee || 0), 0);
  const totalFeeRevenue = depositFees + withdrawalFees;

  const totalWon = positions.filter(p => p.status === 'won').reduce((sum, p) => sum + (p.pnl || 0), 0);
  const totalLost = Math.abs(positions.filter(p => p.status === 'lost').reduce((sum, p) => sum + (p.pnl || 0), 0));
  const netPnL = totalWon - totalLost;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold">{user.full_name || 'Usuário'}</p>
              <p className="text-sm text-slate-500 font-normal">{user.email}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Geral</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoCard
                title="Status"
                value={user.kyc_status === 'verified' ? 'Verificado' : 'Pendente'}
                icon={Shield}
              />
              <InfoCard
                title="Tipo"
                value={user.user_type || 'Retail'}
                icon={User}
              />
              <InfoCard
                title="Saldo Atual"
                value={`R$ ${(user.balance || 0).toFixed(2)}`}
                icon={Wallet}
              />
              <InfoCard
                title="Mercados"
                value={user.markets_participated || 0}
                icon={TrendingUp}
              />
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 mb-2">Receita Gerada para Plataforma</h4>
              <p className="text-2xl font-bold text-emerald-600">
                R$ {totalFeeRevenue.toFixed(2)}
              </p>
              <div className="mt-2 text-sm text-emerald-700 space-y-1">
                <p>Taxa de Depósito: R$ {depositFees.toFixed(2)}</p>
                <p>Taxa de Saque: R$ {withdrawalFees.toFixed(2)}</p>
              </div>
            </div>

            <div className="text-sm text-slate-500 space-y-1">
              <p>Cadastrado em: {format(new Date(user.created_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p>ID: {user.id}</p>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-1">Total Depositado</p>
                <p className="text-2xl font-bold text-slate-900">R$ {totalDeposited.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">{deposits.length} depósitos</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-1">Total Sacado</p>
                <p className="text-2xl font-bold text-slate-900">R$ {totalWithdrawn.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">{withdrawals.length} saques</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-1">Saldo Atual</p>
                <p className="text-2xl font-bold text-emerald-600">R$ {(user.balance || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Últimas Transações</h4>
              <div className="space-y-2">
                {transactions.slice(0, 10).map(tx => (
                  <div key={tx.id} className="flex justify-between text-sm p-2 hover:bg-slate-50 rounded">
                    <span className="text-slate-600">{tx.description}</span>
                    <span className="font-semibold">R$ {tx.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trading" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                <p className="text-sm text-emerald-700 mb-1">Total Ganho</p>
                <p className="text-2xl font-bold text-emerald-600">+R$ {totalWon.toFixed(2)}</p>
              </div>

              <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
                <p className="text-sm text-rose-700 mb-1">Total Perdido</p>
                <p className="text-2xl font-bold text-rose-600">-R$ {totalLost.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500 mb-1">Net P&L</p>
              <p className={`text-3xl font-bold ${netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netPnL >= 0 ? '+' : ''}R$ {netPnL.toFixed(2)}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Posições ({positions.length})</h4>
              <div className="space-y-2">
                {positions.slice(0, 10).map(pos => (
                  <div key={pos.id} className="flex justify-between text-sm p-2 hover:bg-slate-50 rounded">
                    <div>
                      <p className="font-medium text-slate-900">{pos.market_title}</p>
                      <p className="text-xs text-slate-500">
                        {pos.contracts} × {pos.side === 'yes' ? 'SIM' : 'NÃO'}
                      </p>
                    </div>
                    <Badge className={pos.status === 'won' ? 'bg-emerald-100 text-emerald-700' : pos.status === 'lost' ? 'bg-rose-100 text-rose-700' : ''}>
                      {pos.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="space-y-3">
              <InfoCard
                title="Taxa de Acerto"
                value={`${(user.win_rate || 0).toFixed(0)}%`}
                icon={TrendingUp}
              />
              <InfoCard
                title="Total Apostado"
                value={`R$ ${(user.total_wagered || 0).toFixed(2)}`}
                icon={Wallet}
              />
            </div>

            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm text-amber-700 mb-2">Risco de Churn</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '35%' }} />
                </div>
                <span className="text-sm font-semibold text-amber-700">Baixo</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50">
            <Icon className="w-4 h-4 text-slate-600" />
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}