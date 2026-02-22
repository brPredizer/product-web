// @ts-nocheck
import React, { useState } from 'react';
import Link from 'next/link';
import { mockApi as mockApiImport } from '@/app/api/mockClient';
import { getRoleLevel, isAdminL1, isAdminL2, isAdminL3 } from '@/app/api/api';
import { createPageUrl } from '@/routes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Users,
  TrendingUp,
  Wallet,
  BarChart3,
  FileText,
  Megaphone,
  Search,
  Download,
  AlertTriangle,
  Activity,
  DollarSign,
  UserCheck,
  Eye,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  Sparkles,
  ShieldAlert,
  Ban,
  Clock,
  CheckCircle2,
  Trash2,
  UserX
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import KPICardComponent from '@/components/admin/KPICard';
import PeriodSelector from '@/components/admin/PeriodSelector';
import UserDrillDown from '@/components/admin/UserDrillDown';
import KPIDetailModal from '@/components/admin/KPIDetailModal';
import AIMarketingAssistant from '@/components/admin/AIMarketingAssistant';
import ManualPostForm from '@/components/admin/ManualPostForm';
import RevenueChart from '@/components/admin/RevenueChart';
import UsersChart from '@/components/admin/UsersChart';
import RevenueFeesChart from '@/components/admin/RevenueFeesChart';
import DepositsChart from '@/components/admin/DepositsChart';
import WithdrawalsChart from '@/components/admin/WithdrawalsChart';
import RevenueProjectionChart from '@/components/admin/RevenueProjectionChart';
import TransactionsChart from '@/components/admin/TransactionsChart';
import MarketDistributionChart from '@/components/admin/MarketDistributionChart';
import VolumeVsRevenueChart from '@/components/admin/VolumeVsRevenueChart';
import WithdrawalStatusChart from '@/components/admin/WithdrawalStatusChart';
import UserSegmentation from '@/components/admin/UserSegmentation';
import PredictiveAnalytics from '@/components/admin/PredictiveAnalytics';
import AdCampaignForm from '@/components/admin/AdCampaignForm';
import CampaignDetailView from '@/components/admin/CampaignDetailView';
import { toast } from 'sonner';

// Relax typings for external modules used in this file
const mockApi: any = mockApiImport as any;
const KPICard: any = KPICardComponent as any;

interface Period {
  start: Date;
  end: Date;
  label: string;
}

interface KpiDetailModalState {
  open: boolean;
  type: string | null;
  data: any | null;
}

interface AdminProps {
  user?: any;
}

export default function Admin({ user }: AdminProps) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>({
    start: subDays(new Date(), 30),
    end: new Date(),
    label: '30 dias'
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [kpiDetailModal, setKpiDetailModal] = useState<KpiDetailModalState>({ open: false, type: null, data: null });

  // All hooks must be called before any conditional returns
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['admin-users'],
    queryFn: () => mockApi.entities.User.list('-created_date', 1000),
  });

  const { data: allPositions = [] } = useQuery<any[]>({
    queryKey: ['admin-positions'],
    queryFn: () => mockApi.entities.Position.list('-created_date', 5000),
  });

  const { data: allTransactions = [] } = useQuery<any[]>({
    queryKey: ['admin-transactions'],
    queryFn: () => mockApi.entities.Transaction.list('-created_date', 5000),
  });

  const { data: markets = [] } = useQuery<any[]>({
    queryKey: ['admin-markets'],
    queryFn: () => mockApi.entities.Market.list('-created_date', 500),
  });

  const { data: contentPosts = [] } = useQuery<any[]>({
    queryKey: ['content-posts'],
    queryFn: () => mockApi.entities.ContentPost.list('-created_date', 100),
  });

  const { data: adCampaigns = [] } = useQuery<any[]>({
    queryKey: ['ad-campaigns'],
    queryFn: () => mockApi.entities.AdCampaign.list('-created_date', 100),
  });

  const { data: withdrawalRequests = [] } = useQuery<any[]>({
    queryKey: ['withdrawal-requests'],
    queryFn: async () => {
      const requests = await mockApi.entities.WithdrawalRequest.list('-created_date', 100);
      console.log('Withdrawal requests loaded:', requests.length);
      return requests;
    },
  });

  const { data: riskDisclosures = [] } = useQuery<any[]>({
    queryKey: ['risk-disclosures'],
    queryFn: () => mockApi.entities.RiskDisclosure.list('-created_date', 1000),
  });

  const { data: userRiskLimits = [] } = useQuery<any[]>({
    queryKey: ['user-risk-limits'],
    queryFn: () => mockApi.entities.UserRiskLimits.list('-created_date', 1000),
  });

  const handleCreatePost = async (postData: any) => {
    try {
      await mockApi.entities.ContentPost.create({
        ...postData,
        author_id: user.id,
        author_name: user.full_name || user.email
      });
      await queryClient.invalidateQueries(['content-posts']);
      toast.success('Post criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar post:', error);
      toast.error('Erro ao criar post: ' + (error?.message || String(error)));
    }
  };

  const handlePromoteToAdmin = async (userId: string, userEmail: string, level: number) => {
    const levelNames: Record<number, string> = {
      1: 'Nível 1 (Marketing/Publicidade)',
      2: 'Nível 2 (Responsabilidade/IA)',
      3: 'Nível 3 (Acesso Total)'
    };
    
    if (!confirm(`Promover ${userEmail} a administrador ${levelNames[level]}?`)) return;
    try {
      const roleTag = `ADMIN_L${level}`;
      await mockApi.entities.User.update(userId, {
        role: roleTag,
        roles: [roleTag],
        admin_level: level
      });
      await queryClient.invalidateQueries(['admin-users']);
      toast.success(`Usuário promovido a admin ${levelNames[level]}!`);
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      toast.error('Erro ao promover usuário');
    }
  };

  const handleChangeAdminLevel = async (userId: string, userEmail: string, currentLevel: number, newLevel: number) => {
    const levelNames: Record<number, string> = {
      1: 'Nível 1 (Marketing/Publicidade)',
      2: 'Nível 2 (Responsabilidade/IA)',
      3: 'Nível 3 (Acesso Total)'
    };
    
    if (!confirm(`Alterar ${userEmail} de ${levelNames[currentLevel]} para ${levelNames[newLevel]}?`)) return;
    try {
      const roleTag = `ADMIN_L${newLevel}`;
      await mockApi.entities.User.update(userId, {
        role: roleTag,
        roles: [roleTag],
        admin_level: newLevel
      });
      await queryClient.invalidateQueries(['admin-users']);
      toast.success(`Nível alterado para ${levelNames[newLevel]}!`);
    } catch (error) {
      console.error('Erro ao alterar nível:', error);
      toast.error('Erro ao alterar nível');
    }
  };

  const handleApproveWithdrawal = async (withdrawal: any) => {
    if (!confirm(`Aprovar saque de R$ ${withdrawal.net_amount.toFixed(2)} para ${withdrawal.user_email}?`)) return;
    
    try {
      console.log('Aprovando saque:', withdrawal);
      
      await mockApi.entities.WithdrawalRequest.update(withdrawal.id, {
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      });

      await mockApi.entities.Transaction.create({
        user_id: withdrawal.user_id,
        type: 'withdrawal',
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        net_amount: withdrawal.net_amount,
        status: 'completed',
        description: `Saque aprovado via ${withdrawal.payment_method}`
      });

      const userToUpdate = allUsers.find((u: any) => u.id === withdrawal.user_id);
      if (userToUpdate) {
        await mockApi.entities.User.update(withdrawal.user_id, {
          total_withdrawn: (userToUpdate.total_withdrawn || 0) + withdrawal.amount
        });
      }

      await queryClient.invalidateQueries(['withdrawal-requests']);
      await queryClient.invalidateQueries(['admin-users']);
      await queryClient.invalidateQueries(['admin-transactions']);
      
      toast.success(`Saque de R$ ${withdrawal.net_amount.toFixed(2)} aprovado!`);
    } catch (error: any) {
      console.error('Erro ao aprovar saque:', error);
      toast.error('Erro ao aprovar saque: ' + (error?.message || String(error)));
    }
  };

  const handleRejectWithdrawal = async (withdrawal: any) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    
    try {
      console.log('Rejeitando saque:', withdrawal);
      
      await mockApi.entities.WithdrawalRequest.update(withdrawal.id, {
        status: 'rejected',
        rejection_reason: reason,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      });

      const userToUpdate = allUsers.find((u: any) => u.id === withdrawal.user_id);
      if (userToUpdate) {
        await mockApi.entities.User.update(withdrawal.user_id, {
          balance: (userToUpdate.balance || 0) + withdrawal.amount
        });
      }

      await queryClient.invalidateQueries(['withdrawal-requests']);
      await queryClient.invalidateQueries(['admin-users']);
      
      toast.success('Saque rejeitado e saldo devolvido');
    } catch (error: any) {
      console.error('Erro ao rejeitar saque:', error);
      toast.error('Erro ao rejeitar saque: ' + (error?.message || String(error)));
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmText = `EXCLUIR ${userEmail}`;
    const userInput = prompt(
      `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
      `Você está prestes a EXCLUIR PERMANENTEMENTE:\n` +
      `• Usuário: ${userEmail}\n` +
      `• Todos os depósitos e saques\n` +
      `• Todas as posições e transações\n` +
      `• Todos os dados de risco e limites\n\n` +
      `Os números do dashboard serão atualizados automaticamente.\n\n` +
      `Para confirmar, digite: ${confirmText}`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) toast.error('Exclusão cancelada - texto de confirmação incorreto');
      return;
    }

    try {
      toast.loading('Excluindo usuário e todos os dados relacionados...');

      const userTransactions = allTransactions.filter((t: any) => t.user_id === userId);
      for (const tx of userTransactions) {
        await mockApi.entities.Transaction.delete(tx.id);
      }

      const userPositions = allPositions.filter((p: any) => p.user_id === userId);
      for (const pos of userPositions) {
        await mockApi.entities.Position.delete(pos.id);
      }

      const userWithdrawals = withdrawalRequests.filter((w: any) => w.user_id === userId);
      for (const w of userWithdrawals) {
        await mockApi.entities.WithdrawalRequest.delete(w.id);
      }

      const userDisclosures = riskDisclosures.filter((d: any) => d.user_id === userId);
      for (const d of userDisclosures) {
        await mockApi.entities.RiskDisclosure.delete(d.id);
      }

      const userLimits = userRiskLimits.filter((l: any) => l.user_id === userId);
      for (const l of userLimits) {
        await mockApi.entities.UserRiskLimits.delete(l.id);
      }

      await mockApi.entities.User.delete(userId);

      await queryClient.invalidateQueries(['admin-users']);
      await queryClient.invalidateQueries(['admin-transactions']);
      await queryClient.invalidateQueries(['admin-positions']);
      await queryClient.invalidateQueries(['withdrawal-requests']);
      await queryClient.invalidateQueries(['risk-disclosures']);
      await queryClient.invalidateQueries(['user-risk-limits']);

      toast.dismiss();
      toast.success(`Usuário ${userEmail} e todo seu histórico foram excluídos permanentemente`);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.dismiss();
      toast.error('Erro ao excluir usuário: ' + (error?.message || String(error)));
    }
  };

  const handleRevertDeposit = async (transactionId: string, userId: string, amount: number, netAmount: number, fee: number) => {
    if (!confirm(`⚠️ REVERTER DEPÓSITO\n\nValor: R$ ${amount.toFixed(2)}\n\nEsta ação irá:\n• Remover o depósito do histórico\n• Reduzir o saldo do usuário em R$ ${netAmount.toFixed(2)}\n• Ajustar total depositado\n• Atualizar KPIs\n\nConfirmar?`)) return;
    
    try {
      toast.loading('Revertendo depósito...');
      
      const userToUpdate = allUsers.find((u: any) => u.id === userId);
      if (!userToUpdate) {
        throw new Error('Usuário não encontrado');
      }
      
      await mockApi.entities.Transaction.delete(transactionId);
      
      await mockApi.entities.User.update(userId, {
        balance: (userToUpdate.balance || 0) - netAmount,
        total_deposited: (userToUpdate.total_deposited || 0) - amount
      });
      
      await queryClient.invalidateQueries(['admin-users']);
      await queryClient.invalidateQueries(['admin-transactions']);
      
      toast.dismiss();
      toast.success('Depósito revertido com sucesso');
    } catch (error: any) {
      console.error('Erro ao reverter depósito:', error);
      toast.dismiss();
      toast.error('Erro ao reverter depósito: ' + (error?.message || String(error)));
    }
  };

  const handleResetUserData = async (userId: string, userEmail: string) => {
    const confirmText = `RESETAR ${userEmail}`;
    const userInput = prompt(
      `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
      `Você está prestes a RESETAR os dados de: ${userEmail}\n\n` +
      `Isso irá:\n` +
      `• Zerar saldo atual para R$ 0,00\n` +
      `• Zerar total depositado para R$ 0,00\n` +
      `• Zerar total sacado para R$ 0,00\n` +
      `• DELETAR todas as transações (depósitos, saques, compras)\n` +
      `• DELETAR todas as posições\n` +
      `• Zerar todas as estatísticas (total apostado, mercados, P&L)\n` +
      `• O usuário permanecerá cadastrado mas sem nenhum histórico ou saldo\n\n` +
      `Os números do dashboard serão atualizados automaticamente.\n\n` +
      `Para confirmar, digite: ${confirmText}`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) toast.error('Reset cancelado - texto de confirmação incorreto');
      return;
    }

    try {
      toast.loading('Resetando dados do usuário...');

      const userTransactions = allTransactions.filter((t: any) => t.user_id === userId);
      for (const tx of userTransactions) {
        await mockApi.entities.Transaction.delete(tx.id);
      }

      const userPositions = allPositions.filter((p: any) => p.user_id === userId);
      for (const pos of userPositions) {
        await mockApi.entities.Position.delete(pos.id);
      }

      const userWithdrawals = withdrawalRequests.filter((w: any) => w.user_id === userId);
      for (const w of userWithdrawals) {
        await mockApi.entities.WithdrawalRequest.delete(w.id);
      }

      await mockApi.entities.User.update(userId, {
        balance: 0,
        total_deposited: 0,
        total_withdrawn: 0,
        total_wagered: 0,
        markets_participated: 0,
        net_pnl: 0
      });

      await queryClient.invalidateQueries(['admin-users']);
      await queryClient.invalidateQueries(['admin-transactions']);
      await queryClient.invalidateQueries(['admin-positions']);
      await queryClient.invalidateQueries(['withdrawal-requests']);

      toast.dismiss();
      toast.success(`Dados de ${userEmail} foram resetados com sucesso`);
    } catch (error: any) {
      console.error('Erro ao resetar dados:', error);
      toast.dismiss();
      toast.error('Erro ao resetar dados: ' + (error?.message || String(error)));
    }
  };

  // Check admin permission AFTER all hooks
  if (!user || !isAdminL1(user)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesso Restrito</h2>
          <p className="text-slate-500">Você não tem permissão para acessar o Admin Hub.</p>
        </div>
      </div>
    );
  }

  const adminLevel = getRoleLevel(user);

  const canAccessAdmin = isAdminL3(user);
  const canAccessWithdrawals = isAdminL2(user);
  const canAccessMarketing = isAdminL1(user);
  const canAccessResponsibility = isAdminL2(user);
  const canAccessSegmentation = isAdminL2(user);
  const canAccessPredictive = isAdminL2(user);

  const filterByPeriod = (items: any[], dateField = 'created_date') => {
    return items.filter(item => {
      const date = new Date(item[dateField]);
      return date >= period.start && date <= period.end;
    });
  };

  const usersInPeriod = filterByPeriod(allUsers);
  const transactionsInPeriod = filterByPeriod(allTransactions);
  const positionsInPeriod = filterByPeriod(allPositions);

  const totalUsers = allUsers.length;
  const newUsers = usersInPeriod.length;
  const activeUsers = allUsers.filter((u: any) => (u.balance || 0) > 0 || (u.markets_participated || 0) > 0).length;

  const allDeposits = allTransactions.filter(t => t.type === 'deposit');
  const allWithdrawals = allTransactions.filter(t => t.type === 'withdrawal' && t.status === 'completed');
  const totalDepositedGross = allDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalDepositedNet = allDeposits.reduce((sum, t) => sum + (t.net_amount || 0), 0);

  const allApprovedWithdrawals = withdrawalRequests.filter(w => w.status === 'approved' || w.status === 'completed');
  const totalWithdrawnGross = allApprovedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalWithdrawnNetFinalCorrect = allApprovedWithdrawals.reduce((sum, w) => sum + (w.net_amount || 0), 0);
  const allApprovedWithdrawalFees = allApprovedWithdrawals.reduce((sum, w) => sum + (w.fee || 0), 0);

  const totalCustody = allUsers.reduce((sum: number, u: any) => sum + (u.balance || 0), 0);
  const avgBalance = totalUsers > 0 ? totalCustody / totalUsers : 0;

  const deposits = transactionsInPeriod.filter(t => t.type === 'deposit');
  const withdrawals = transactionsInPeriod.filter(t => t.type === 'withdrawal' && t.status === 'completed');

  const totalDepositedPeriod = deposits.reduce((sum, t) => sum + (t.net_amount || 0), 0);
  const totalWithdrawnPeriod = withdrawals.reduce((sum, t) => sum + (t.net_amount || 0), 0);

  const wonPositions = allPositions.filter(p => p.status === 'won');
  const lostPositions = allPositions.filter(p => p.status === 'lost');
  const totalWonByUsers = wonPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const totalLostByUsers = Math.abs(lostPositions.reduce((sum, p) => sum + (p.pnl || 0), 0));
  const netPnLUsers = totalWonByUsers - totalLostByUsers;

  const allBuyTransactions = allTransactions.filter(t => t.type === 'buy');
  const totalVolume = allBuyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const allDepositFees = allDeposits.reduce((sum, t) => sum + (t.fee || 0), 0);
  const allWithdrawalFees = allApprovedWithdrawalFees;
  const totalWithdrawalFees = allWithdrawalFees;
  const totalPlatformRevenueAllTime = allDepositFees + totalWithdrawalFees;

  const depositFees = deposits.reduce((sum, t) => sum + (t.fee || 0), 0);
  const withdrawalFees = withdrawals.reduce((sum, t) => sum + (t.fee || 0), 0);

  const approvedWithdrawalsInPeriod = withdrawalRequests
    .filter(w => {
      if (w.status !== 'approved' && w.status !== 'completed') return false;
      const date = new Date(w.approved_at || w.created_date);
      return date >= period.start && date <= period.end;
    });

  const approvedWithdrawalFeesInPeriod = approvedWithdrawalsInPeriod.reduce((sum, w) => sum + (w.fee || 0), 0);
  const totalWithdrawalFeesPeriod = approvedWithdrawalFeesInPeriod;
  const totalPlatformRevenue = depositFees + totalWithdrawalFeesPeriod;

  const activeMarkets = markets.filter(m => m.status === 'open').length;

  const publishedPosts = contentPosts.filter(p => p.status === 'published').length;
  const totalViews = contentPosts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalConversions = contentPosts.reduce((sum, p) => sum + (p.conversions || 0), 0);

  const activeCampaigns = adCampaigns.filter(c => c.status === 'active').length;
  const totalImpressions = adCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalAdRevenue = adCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);

  const validDisclosures = riskDisclosures.filter((d: any) => {
    if (d.revoked) return false;
    const validUntil = new Date(d.valid_until);
    return validUntil > new Date();
  });
  const usersWithValidDisclosure = new Set(validDisclosures.map((d: any) => d.user_id)).size;
  const disclosureAcceptanceRate = totalUsers > 0 ? (usersWithValidDisclosure / totalUsers * 100) : 0;
  
  const usersWithLimits = userRiskLimits.length;
  const usersOnBreak = userRiskLimits.filter((l: any) => l.trading_break_until && new Date(l.trading_break_until) > new Date()).length;
  const usersExcluded = userRiskLimits.filter((l: any) => l.self_excluded_until && new Date(l.self_excluded_until) > new Date()).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-emerald-600" />
                Predizer Admin Hub
              </h1>
              <p className="text-slate-500 mt-1">Gestão completa da plataforma</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar usuário, mercado..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <PeriodSelector period={period} onPeriodChange={setPeriod} />
              
              {isAdminL2(user) && (
                <Link href={createPageUrl('CreateMarket')}>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Novo Mercado
                  </Button>
                </Link>
              )}

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={canAccessAdmin ? "admin" : canAccessMarketing ? "marketing" : "responsibility"} className="space-y-8">
          <TabsList className="bg-white p-1 border border-slate-200">
            {canAccessWithdrawals && (
              <>
                {canAccessAdmin && (
                  <TabsTrigger value="admin" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  Administração
                  </TabsTrigger>
                )}
                <TabsTrigger value="withdrawals" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Wallet className="w-4 h-4 mr-2" />
                  Saques e Depósitos
                </TabsTrigger>
              </>
            )}
            {canAccessMarketing && (
              <>
                <TabsTrigger value="marketing" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Marketing
                </TabsTrigger>
                <TabsTrigger value="ads" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Publicidade
                </TabsTrigger>
              </>
            )}
            {canAccessResponsibility && (
              <>
                <TabsTrigger value="responsibility" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  Responsabilidade
                </TabsTrigger>
                <TabsTrigger value="segmentation" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Segmentação IA
                </TabsTrigger>
                <TabsTrigger value="predictive" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Previsões IA
                </TabsTrigger>
              </>
            )}
            </TabsList>

          {/* ADMIN TAB */}
          {canAccessAdmin && <TabsContent value="admin" className="space-y-8">
          {/* Admin Level Info */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900 mb-1">Seu Nível de Acesso: Nível {adminLevel}</p>
                <p className="text-sm text-purple-800">
                  {adminLevel === 3 && 'Acesso Total - Você pode acessar todas as áreas do sistema'}
                  {adminLevel === 2 && 'Responsabilidade e IA - Acesso a controles de risco, segmentação e previsões'}
                  {adminLevel === 1 && 'Marketing e Publicidade - Acesso a criação de conteúdo e campanhas'}
                </p>
              </div>
            </div>
          </div>
            {/* User KPIs */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Usuários
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total de Usuários"
                  value={totalUsers}
                  previousValue={totalUsers - newUsers}
                  icon={Users}
                />
                <KPICard
                  title="Novos Usuários"
                  value={newUsers}
                  previousValue={newUsers * 0.8}
                  icon={UserCheck}
                  subtitle={period.label}
                />
                <KPICard
                  title="Usuários Ativos"
                  value={activeUsers}
                  previousValue={activeUsers * 0.9}
                  icon={Activity}
                />
                <KPICard
                  title="Taxa de Ativação"
                  value={(activeUsers / totalUsers * 100)}
                  previousValue={85}
                  format="percentage"
                  icon={Target}
                />
              </div>
            </section>

            {/* Financial KPIs - Custody */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Custódia
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <KPICard
                  title="Em Custódia"
                  value={totalCustody}
                  previousValue={totalCustody * 0.9}
                  format="currency"
                  icon={Shield}
                  subtitle="Saldo atual dos usuários (nossa responsabilidade)"
                  onDrillDown={() => setKpiDetailModal({
                    open: true,
                    type: 'totalCustody',
                    data: {
                      users: allUsers.sort((a: any, b: any) => (b.balance || 0) - (a.balance || 0)),
                      total: totalCustody,
                      count: allUsers.filter((u: any) => (u.balance || 0) > 0).length
                    }
                  })}
                />
              </div>
            </section>

            {/* Financial KPIs - User Capital */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Capital dos Usuários
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Bruto Depositado"
                  value={totalDepositedGross}
                  previousValue={totalDepositedGross * 0.85}
                  format="currency"
                  icon={ArrowDownCircle}
                  subtitle={`Antes das taxas (${allDeposits.length} depósitos)`}
                  onDrillDown={() => setKpiDetailModal({
                    open: true,
                    type: 'totalDepositedGross',
                    data: {
                      transactions: allDeposits.sort((a: any, b: any) => new Date(b.created_date) - new Date(a.created_date)),
                      users: allUsers,
                      total: totalDepositedGross,
                      count: allDeposits.length
                    }
                  })}
                />
                <KPICard
                  title="Total Líquido Depositado"
                  value={totalDepositedNet}
                  previousValue={totalDepositedNet * 0.85}
                  format="currency"
                  icon={ArrowDownCircle}
                  subtitle={`Creditado após taxa 7% (${allDeposits.length} depósitos)`}
                  onDrillDown={() => setKpiDetailModal({
                    open: true,
                    type: 'totalDepositedNet',
                    data: {
                      transactions: allDeposits.sort((a: any, b: any) => new Date(b.created_date) - new Date(a.created_date)),
                      users: allUsers,
                      total: totalDepositedNet,
                      count: allDeposits.length
                    }
                  })}
                />
                <KPICard
                  title="Total Bruto Sacado"
                  value={totalWithdrawnGross}
                  previousValue={totalWithdrawnGross * 0.9}
                  format="currency"
                  icon={ArrowUpCircle}
                  subtitle={`Antes das taxas (${allApprovedWithdrawals.length} saques)`}
                  onDrillDown={() => setKpiDetailModal({
                    open: true,
                    type: 'totalWithdrawnGross',
                    data: {
                      withdrawals: allApprovedWithdrawals.sort((a: any, b: any) => new Date(b.created_date) - new Date(a.created_date)),
                      total: totalWithdrawnGross,
                      count: allApprovedWithdrawals.length
                    }
                  })}
                />
                <KPICard
                  title="Total Líquido Sacado"
                  value={totalWithdrawnNetFinalCorrect}
                  previousValue={totalWithdrawnNetFinalCorrect * 0.9}
                  format="currency"
                  icon={ArrowUpCircle}
                  subtitle={`Pago após taxa 10% (${allApprovedWithdrawals.length} saques)`}
                  onDrillDown={() => setKpiDetailModal({
                    open: true,
                    type: 'totalWithdrawnNet',
                    data: {
                      withdrawals: allApprovedWithdrawals.sort((a: any, b: any) => new Date(b.created_date) - new Date(a.created_date)),
                      total: totalWithdrawnNetFinalCorrect,
                      count: allApprovedWithdrawals.length
                    }
                  })}
                />
              </div>
            </section>

            {/* Financial KPIs - Fees */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Taxas
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <KPICard
                  title="Total de Taxas de Depósito (2.5%)"
                  value={allDepositFees}
                  previousValue={allDepositFees * 0.85}
                  format="currency"
                  icon={DollarSign}
                  subtitle={`${allDeposits.length} depósitos processados`}
                  onDrillDown={() => setKpiDetailModal({
                    open: true,
                    type: 'depositFees',
                    data: {
                      transactions: allDeposits.sort((a: any, b: any) => new Date(b.created_date) - new Date(a.created_date)),
                      users: allUsers,
                      total: allDepositFees,
                      count: allDeposits.length
                    }
                  })}
                />
                <KPICard
                  title="Total de Taxas de Saque (7.5%)"
                  value={totalWithdrawalFees}
                  previousValue={totalWithdrawalFees * 0.9}
                  format="currency"
                  icon={DollarSign}
                  subtitle={`${allApprovedWithdrawals.length} saques aprovados`}
                  onDrillDown={() => setKpiDetailModal({
                    open: true,
                    type: 'withdrawalFees',
                    data: {
                      withdrawals: allApprovedWithdrawals.sort((a: any, b: any) => new Date(b.created_date) - new Date(a.created_date)),
                      total: totalWithdrawalFees,
                      count: allApprovedWithdrawals.length
                    }
                  })}
                />
              </div>
            </section>

            {/* Financial KPIs - User Performance */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Performance dos Usuários
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Ganho"
                  value={totalWonByUsers}
                  previousValue={totalWonByUsers * 0.88}
                  format="currency"
                  icon={TrendingUp}
                  subtitle={`${wonPositions.length} posições vencedoras`}
                />
                <KPICard
                  title="Total Perdido"
                  value={totalLostByUsers}
                  previousValue={totalLostByUsers * 0.92}
                  format="currency"
                  icon={TrendingUp}
                  subtitle={`${lostPositions.length} posições perdedoras`}
                />
                <KPICard
                  title="Net P&L Usuários"
                  value={netPnLUsers}
                  previousValue={netPnLUsers * 0.9}
                  format="currency"
                  icon={BarChart3}
                />
                <KPICard
                  title="Volume Total"
                  value={totalVolume}
                  previousValue={totalVolume * 0.85}
                  format="currency"
                  icon={Activity}
                />
              </div>
            </section>

            {/* Charts Row 1 - Users, Revenue, Deposits and Withdrawals */}
            <section>
              <div className="grid lg:grid-cols-4 gap-4">
                <UsersChart users={allUsers} period={period} allTransactions={allTransactions} />
                <RevenueFeesChart allTransactions={allTransactions} withdrawalRequests={withdrawalRequests} period={period} />
                <DepositsChart allTransactions={allTransactions} period={period} />
                <WithdrawalsChart withdrawalRequests={withdrawalRequests} period={period} />
              </div>
            </section>

            {/* Charts Row 2 - Revenue Projection */}
            <section>
              <RevenueProjectionChart allTransactions={allTransactions} withdrawalRequests={withdrawalRequests} />
            </section>

            {/* Markets */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Mercados
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Mercados Ativos"
                  value={activeMarkets}
                  previousValue={activeMarkets}
                  icon={Activity}
                />
                <KPICard
                  title="Total de Mercados"
                  value={markets.length}
                  previousValue={markets.length - 5}
                  icon={BarChart3}
                />
                <KPICard
                  title="Volume Total"
                  value={totalVolume}
                  previousValue={totalVolume * 0.88}
                  format="currency"
                  icon={TrendingUp}
                />
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900">Alertas</p>
                  </div>
                  <p className="text-3xl font-bold text-amber-600">0</p>
                  <p className="text-xs text-amber-700 mt-2">Nenhum alerta ativo</p>
                </div>
              </div>
            </section>

            {/* User List with Drill-down */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Top Usuários por Volume</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role / Nível</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Saldo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Apostado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mercados</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers
                      .sort((a: any, b: any) => (b.total_wagered || 0) - (a.total_wagered || 0))
                      .slice(0, 20)
                      .map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-slate-900">{u.full_name || 'Usuário'}</p>
                              <p className="text-sm text-slate-500">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <Badge className={isAdminL1(u) ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}>
                                {isAdminL1(u) ? 'Admin' : 'User'}
                              </Badge>
                              {isAdminL1(u) && getRoleLevel(u) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Nível {getRoleLevel(u)}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="font-semibold text-slate-900">
                              R$ {(u.balance || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            R$ {(u.total_wagered || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {u.markets_participated || 0}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUserId(u.id)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                              {!isAdminL1(u) && (
                                <Select onValueChange={(level: string) => handlePromoteToAdmin(u.id, u.email, parseInt(level))}>
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue placeholder="Promover..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Admin Nível 1</SelectItem>
                                    <SelectItem value="2">Admin Nível 2</SelectItem>
                                    <SelectItem value="3">Admin Nível 3</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              {isAdminL1(u) && u.id !== user.id && isAdminL3(user) && (
                                <Select value={String(u.admin_level || 3)} onValueChange={(level: string) => handleChangeAdminLevel(u.id, u.email, u.admin_level || 3, parseInt(level))}>
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Nível 1</SelectItem>
                                    <SelectItem value="2">Nível 2</SelectItem>
                                    <SelectItem value="3">Nível 3</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>}

          {/* WITHDRAWALS TAB */}
          {canAccessWithdrawals && <TabsContent value="withdrawals" className="space-y-8">
            {/* Withdrawal Status Chart */}
            <WithdrawalStatusChart withdrawals={withdrawalRequests} transactions={allTransactions} />

            {/* Deposits by User */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Depósitos por Usuário</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nº Depósitos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Bruto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Taxa Gerada (7%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Líquido</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const depositsData = allTransactions.filter(t => t.type === 'deposit');
                      
                      return depositsData
                        .sort((a: any, b: any) => new Date(b.created_date) - new Date(a.created_date))
                        .map((tx: any) => {
                          const user = allUsers.find((u: any) => u.id === tx.user_id);
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-slate-900">{user?.email || 'Usuário'}</p>
                                  <p className="text-xs text-slate-500">{new Date(tx.created_date).toLocaleString('pt-BR')}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {tx.description || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold">
                                R$ {(tx.amount || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                R$ {(tx.fee || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                                R$ {(tx.net_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRevertDeposit(tx.id, tx.user_id, tx.amount, tx.net_amount, tx.fee)}
                                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                >
                                  Reverter
                                </Button>
                              </td>
                            </tr>
                          );
                        });
                    })()}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-200">
                    <tr>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">TOTAL</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {allTransactions.filter(t => t.type === 'deposit').length} depósitos
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        R$ {totalDepositedGross.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-700">
                        R$ {allDepositFees.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-700">
                        R$ {totalDepositedNet.toFixed(2)}
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Solicitações de Saque</h2>
                <Badge 
                  variant="outline" 
                  className={`text-lg ${withdrawalRequests.filter(w => w.status === 'pending').length > 0 ? 'animate-pulse-slow bg-emerald-100 border-emerald-300 text-emerald-700' : ''}`}
                >
                  {withdrawalRequests.filter(w => w.status === 'pending').length} pendentes
                </Badge>
              </div>
              <style jsx>{`
                @keyframes pulse-slow {
                  0%, 100% {
                    background-color: rgb(209 250 229);
                    border-color: rgb(110 231 183);
                  }
                  50% {
                    background-color: white;
                    border-color: rgb(209 213 219);
                  }
                }
                .animate-pulse-slow {
                  animation: pulse-slow 2s ease-in-out infinite;
                }
              `}</style>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Valor Bruto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Taxa (10%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Valor Líquido</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawalRequests.length > 0 ? withdrawalRequests.map((withdrawal: any) => (
                      <tr key={withdrawal.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{withdrawal.user_email}</p>
                          <p className="text-xs text-slate-500">{withdrawal.payment_method}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          R$ {(withdrawal.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-rose-600">
                          R$ {(withdrawal.fee || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                          R$ {(withdrawal.net_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            withdrawal.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            withdrawal.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            withdrawal.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {withdrawal.status === 'pending' ? 'Pendente' :
                             withdrawal.status === 'approved' ? 'Aprovado' :
                             withdrawal.status === 'rejected' ? 'Rejeitado' :
                             'Completo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(withdrawal.created_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveWithdrawal(withdrawal)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectWithdrawal(withdrawal)}
                                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {withdrawal.status === 'rejected' && (
                            <div className="space-y-2">
                              {withdrawal.rejection_reason && (
                                <p className="text-xs text-slate-500">Motivo: {withdrawal.rejection_reason}</p>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await mockApi.entities.WithdrawalRequest.update(withdrawal.id, {
                                        status: 'pending',
                                        rejection_reason: null
                                      });
                                      await queryClient.invalidateQueries(['withdrawal-requests']);
                                      toast.success('Status alterado para pendente');
                                    } catch (error) {
                                      toast.error('Erro ao alterar status');
                                    }
                                  }}
                                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                >
                                  Reabrir
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveWithdrawal(withdrawal)}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  Aprovar
                                </Button>
                              </div>
                            </div>
                          )}
                        </td>
                        </tr>
                        )) : (
                        <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                          Nenhuma solicitação de saque encontrada
                        </td>
                        </tr>
                        )}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-blue-50 to-cyan-50 border-t-2 border-blue-200">
                    <tr>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">TOTAL</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        R$ {withdrawalRequests.reduce((sum: number, w: any) => sum + (w.amount || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-700">
                        R$ {withdrawalRequests.reduce((sum: number, w: any) => sum + (w.fee || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-700">
                        R$ {withdrawalRequests.reduce((sum: number, w: any) => sum + (w.net_amount || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {withdrawalRequests.length} solicitações
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </TabsContent>}

          {/* MARKETING TAB */}
          {canAccessMarketing && <TabsContent value="marketing" className="space-y-8">
            {/* AI Marketing Assistant */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Assistente de Marketing IA
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Use IA para criar, otimizar e analisar conteúdo automaticamente
                  </p>
                </div>
              </div>
              <AIMarketingAssistant 
                markets={markets}
                contentPosts={contentPosts}
                onCreatePost={handleCreatePost}
                user={user}
                adminLevel={adminLevel}
              />
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Conteúdo e Postagens</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      + Nova Postagem
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Postagem</DialogTitle>
                      <DialogDescription>
                        Preencha os campos para criar uma nova postagem
                      </DialogDescription>
                    </DialogHeader>
                    <ManualPostForm onSubmit={handleCreatePost} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <KPICard
                  title="Postagens Publicadas"
                  value={publishedPosts}
                  previousValue={publishedPosts - 2}
                  icon={FileText}
                />
                <KPICard
                  title="Total de Visualizações"
                  value={totalViews}
                  previousValue={totalViews * 0.85}
                  icon={Eye}
                />
                <KPICard
                  title="Conversões"
                  value={totalConversions}
                  previousValue={totalConversions * 0.9}
                  icon={Target}
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Visualizações</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Conversões</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contentPosts.slice(0, 10).map((post: any) => (
                      <tr key={post.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{post.title}</p>
                          <p className="text-sm text-slate-500">{post.author_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline">{post.category}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                            post.status === 'draft' ? 'bg-slate-100 text-slate-700' : ''
                          }>
                            {post.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">{post.views || 0}</td>
                        <td className="px-6 py-4 text-sm">{post.conversions || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>}

          {/* PUBLICIDADE TAB */}
          {canAccessMarketing && <TabsContent value="ads" className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Campanhas Publicitárias</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      + Nova Campanha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Campanha Publicitária</DialogTitle>
                      <DialogDescription>
                        Preencha os dados para criar uma nova campanha
                      </DialogDescription>
                    </DialogHeader>
                    <AdCampaignForm 
                      onSubmit={async (data: any) => {
                        try {
                          await mockApi.entities.AdCampaign.create(data);
                          await queryClient.invalidateQueries(['ad-campaigns']);
                          toast.success('Campanha criada com sucesso!');
                          document.querySelector('[data-state="open"]')?.click();
                        } catch (error) {
                          toast.error('Erro ao criar campanha');
                        }
                      }}
                      onCancel={() => document.querySelector('[data-state="open"]')?.click()}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <KPICard
                  title="Campanhas Ativas"
                  value={activeCampaigns}
                  previousValue={activeCampaigns}
                  icon={Megaphone}
                />
                <KPICard
                  title="Impressões Totais"
                  value={totalImpressions}
                  previousValue={totalImpressions * 0.8}
                  icon={Eye}
                />
                <KPICard
                  title="Receita de Publicidade"
                  value={totalAdRevenue}
                  previousValue={totalAdRevenue * 0.85}
                  format="currency"
                  icon={DollarSign}
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Campanha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Anunciante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Impressões</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">CTR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Receita</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adCampaigns.slice(0, 10).map((campaign: any) => {
                      const ctr = campaign.clicks && campaign.impressions 
                        ? (campaign.clicks / campaign.impressions * 100).toFixed(2)
                        : '0.00';

                      return (
                        <tr key={campaign.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-900">{campaign.name}</p>
                            <p className="text-xs text-slate-500">{campaign.slot}</p>
                          </td>
                          <td className="px-6 py-4 text-sm">{campaign.advertiser}</td>
                          <td className="px-6 py-4">
                            <Badge className={
                              campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              campaign.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                              campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }>
                              {campaign.status === 'active' ? 'Ativa' :
                               campaign.status === 'paused' ? 'Pausada' :
                               campaign.status === 'completed' ? 'Concluída' :
                               campaign.status === 'draft' ? 'Rascunho' : campaign.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">{(campaign.impressions || 0).toLocaleString('pt-BR')}</td>
                          <td className="px-6 py-4 text-sm">{ctr}%</td>
                          <td className="px-6 py-4 text-sm font-semibold">R$ {(campaign.spent || 0).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCampaignId(campaign.id)}
                            >
                              Ver Detalhes
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>}

          {/* SEGMENTATION TAB */}
          {canAccessSegmentation && <TabsContent value="segmentation" className="space-y-8">
            <UserSegmentation 
              users={allUsers}
              transactions={allTransactions}
              positions={allPositions}
            />
          </TabsContent>}

          {/* PREDICTIVE ANALYTICS TAB */}
          {canAccessPredictive && <TabsContent value="predictive" className="space-y-8">
            <PredictiveAnalytics 
              users={allUsers}
              transactions={allTransactions}
              period={period}
            />
          </TabsContent>}

            {/* RESPONSIBILITY TAB */}
          {canAccessResponsibility && <TabsContent value="responsibility" className="space-y-8">
            {/* Risk Disclosure KPIs */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                Termo de Ciência e Risco
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <KPICard
                  title="Usuários com Termo Válido"
                  value={usersWithValidDisclosure}
                  previousValue={usersWithValidDisclosure * 0.9}
                  icon={CheckCircle2}
                  subtitle={`${disclosureAcceptanceRate.toFixed(1)}% do total`}
                />
                <KPICard
                  title="Total de Aceites"
                  value={riskDisclosures.length}
                  previousValue={riskDisclosures.length * 0.85}
                  icon={FileText}
                />
                <KPICard
                  title="Taxa de Aceitação"
                  value={disclosureAcceptanceRate}
                  previousValue={disclosureAcceptanceRate * 0.92}
                  format="percentage"
                  icon={Target}
                />
              </div>
            </section>

            {/* Risk Controls KPIs */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Controles de Proteção
              </h2>
              <div className="grid sm:grid-cols-4 gap-4">
                <KPICard
                  title="Usuários com Limites"
                  value={usersWithLimits}
                  previousValue={usersWithLimits * 0.88}
                  icon={Shield}
                  subtitle={`${(usersWithLimits / totalUsers * 100).toFixed(1)}% do total`}
                />
                <KPICard
                  title="Em Pausa Temporária"
                  value={usersOnBreak}
                  previousValue={usersOnBreak}
                  icon={Clock}
                />
                <KPICard
                  title="Autoexcluídos"
                  value={usersExcluded}
                  previousValue={usersExcluded}
                  icon={Ban}
                />
                <KPICard
                  title="Taxa de Adoção"
                  value={(usersWithLimits / totalUsers * 100)}
                  previousValue={(usersWithLimits / totalUsers * 100) * 0.9}
                  format="percentage"
                  icon={TrendingUp}
                />
              </div>
            </section>

            {/* Recent Disclosures */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Aceites Recentes</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Versão</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Validade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riskDisclosures.slice(0, 20).map((disclosure: any) => {
                      const isValid = !disclosure.revoked && new Date(disclosure.valid_until) > new Date();
                      const userEmail = allUsers.find((u: any) => u.id === disclosure.user_id)?.email || 'Usuário';

                      return (
                        <tr key={disclosure.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">{userEmail}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{disclosure.document_version}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {format(new Date(disclosure.created_date), "d 'de' MMM, HH:mm", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {format(new Date(disclosure.valid_until), "d 'de' MMM, yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                              {isValid ? 'Válido' : 'Expirado'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Users with Risk Controls */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Usuários com Controles Ativos</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Limites Configurados</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userRiskLimits.slice(0, 20).map((limit: any) => {
                      const userEmail = allUsers.find((u: any) => u.id === limit.user_id)?.email || 'Usuário';
                      const isOnBreak = limit.trading_break_until && new Date(limit.trading_break_until) > new Date();
                      const isExcluded = limit.self_excluded_until && new Date(limit.self_excluded_until) > new Date();

                      const configuredLimits: string[] = [];
                      if (limit.daily_deposit_limit) configuredLimits.push('Depósito diário');
                      if (limit.daily_loss_limit) configuredLimits.push('Perda diária');
                      if (limit.funding_cap) configuredLimits.push('Teto de aporte');

                      return (
                        <tr key={limit.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">{userEmail}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {configuredLimits.join(', ') || 'Nenhum'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {isExcluded && (
                                <Badge className="bg-rose-100 text-rose-700">Autoexcluído</Badge>
                              )}
                              {isOnBreak && !isExcluded && (
                                <Badge className="bg-amber-100 text-amber-700">Em Pausa</Badge>
                              )}
                              {!isOnBreak && !isExcluded && (
                                <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Reset User Data Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Ban className="w-5 h-5 text-amber-600" />
                    Resetar Dados de Usuários
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Zerar saldo, apostas e histórico mantendo o cadastro do usuário
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">⚠️ Atenção: Ação Irreversível</p>
                    <p className="text-sm text-amber-800">
                      O reset irá zerar o saldo atual, total depositado, total sacado e deletar PERMANENTEMENTE 
                      todas as transações, depósitos, saques e posições do usuário. O cadastro será mantido mas 
                      sem nenhum histórico ou valores. Os números do dashboard serão automaticamente recalculados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Saldo Atual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Depositado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Sacado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Apostado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Transações</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Posições</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers
                      .sort((a: any, b: any) => (b.total_wagered || 0) - (a.total_wagered || 0))
                      .map((u: any) => {
                        const userTxCount = allTransactions.filter((t: any) => t.user_id === u.id).length;
                        const userPosCount = allPositions.filter((p: any) => p.user_id === u.id).length;

                        return (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">{u.full_name || 'Usuário'}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                              R$ {(u.balance || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                              R$ {(u.total_deposited || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-cyan-600">
                              R$ {(u.total_withdrawn || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold">
                              R$ {(u.total_wagered || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {userTxCount}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {userPosCount}
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetUserData(u.id, u.email)}
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                disabled={userTxCount === 0 && userPosCount === 0 && (u.balance || 0) === 0}
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Resetar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Delete Users Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <UserX className="w-5 h-5 text-rose-600" />
                    Exclusão Permanente de Usuários
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Remover usuários e todo seu histórico da plataforma (ação irreversível)
                  </p>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-900 mb-1">⚠️ Atenção: Ação Irreversível</p>
                    <p className="text-sm text-rose-800">
                      A exclusão de um usuário removerá PERMANENTEMENTE todos os seus dados: transações, 
                      depósitos, saques, posições, limites de risco e aceites de termos. Os números do 
                      dashboard serão automaticamente recalculados. Esta ação NÃO pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Transações</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Posições</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Saldo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Depositado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers
                      .sort((a: any, b: any) => new Date(b.created_date) - new Date(a.created_date))
                      .map((u: any) => {
                        const userTxCount = allTransactions.filter((t: any) => t.user_id === u.id).length;
                        const userPosCount = allPositions.filter((p: any) => p.user_id === u.id).length;
                        const userDeposits = allTransactions
                          .filter((t: any) => t.user_id === u.id && t.type === 'deposit')
                          .reduce((sum, t) => sum + (t.amount || 0), 0);

                        return (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">{u.full_name || 'Usuário'}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={isAdminL1(u) ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}>
                                {isAdminL1(u) ? 'Admin' : 'User'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {userTxCount}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {userPosCount}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold">
                              R$ {(u.balance || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold">
                              R$ {userDeposits.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Excluir
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Compliance Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-2">Conformidade e Responsabilidade</p>
                  <p className="text-sm text-blue-800">
                    O Predizer implementa controles de risco obrigatórios inspirados em práticas de mercados 
                    regulados e jogo responsável. Todos os usuários devem aceitar o Termo de Ciência antes 
                    da primeira aposta, e o sistema rastreia aceites de forma imutável para auditoria.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>}
          </Tabs>
          </div>

      <UserDrillDown 
        userId={selectedUserId}
        open={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />

      <CampaignDetailView
        campaignId={selectedCampaignId}
        open={!!selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
      />

      <KPIDetailModal
        open={kpiDetailModal.open}
        onClose={() => setKpiDetailModal({ open: false, type: null, data: null })}
        kpiType={kpiDetailModal.type}
        data={kpiDetailModal.data}
      />
      </div>
  );
}
