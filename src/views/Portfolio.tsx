"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { mockApi } from '@/api/mockClient';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface PortfolioProps {
  user?: any;
}

export default function Portfolio({ user }: PortfolioProps) {
  const router = useRouter();
  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['positions', user?.id],
    queryFn: () => (mockApi as any).entities.Position.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id
  });

  const openPositions = positions.filter((p: any) => p.status === 'open');
  const closedPositions = positions.filter((p: any) => p.status !== 'open');

  const totalInvested = openPositions.reduce((sum: number, p: any) => sum + (p.total_invested || 0), 0);
  const totalPnL = closedPositions.reduce((sum: number, p: any) => sum + (p.pnl || 0), 0);
  const winCount = closedPositions.filter((p: any) => p.status === 'won').length;
  const winRate = closedPositions.length > 0 ? (winCount / closedPositions.length * 100).toFixed(0) : 0;

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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Meu Portfólio</h1>
          <p className="text-slate-500 mt-1">Acompanhe suas posições e resultados</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Posições Ativas"
            value={openPositions.length}
            icon={Briefcase}
          />
          <StatsCard
            title="Total Investido"
            value={`R$ ${totalInvested.toFixed(2)}`}
            icon={BarChart3}
          />
          <StatsCard
            title="P&L Total"
            value={`${totalPnL >= 0 ? '+' : ''}R$ ${totalPnL.toFixed(2)}`}
            icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
            className={totalPnL >= 0 ? 'ring-1 ring-emerald-200' : 'ring-1 ring-rose-200'}
          />
          <StatsCard
            title="Taxa de Acerto"
            value={`${winRate}%`}
            subtitle={`${winCount}/${closedPositions.length} mercados`}
            icon={CheckCircle2}
          />
        </div>

        {/* Positions */}
        <Tabs defaultValue="open" className="space-y-6">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="open" className="data-[state=active]:bg-white">
              Ativas ({openPositions.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-white">
              Encerradas ({closedPositions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : openPositions.length > 0 ? (
              <div className="space-y-4">
                {openPositions.map((position: any, index: number) => (
                  <motion.div
                    key={position.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PositionCard position={position} />
                  </motion.div>
                ))}
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
            {closedPositions.length > 0 ? (
              <div className="space-y-4">
                {closedPositions.map((position: any, index: number) => (
                  <motion.div
                    key={position.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PositionCard position={position} closed />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum histórico</h3>
                <p className="text-slate-500">Suas posições encerradas aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PositionCard({ position, closed }: { position: any; closed?: boolean }) {
  const isYes = position.side === 'yes';
  const isWon = position.status === 'won';
  const potentialPayout = position.contracts * 1;
  const potentialProfit = potentialPayout - position.total_invested;

  return (
    <Link 
      href={createPageUrl(`Market?id=${position.market_id}`)}
      className="block bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn(
              "font-medium",
              isYes ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}>
              {isYes ? 'SIM' : 'NÃO'}
            </Badge>
            {closed && (
              <Badge className={cn(
                isWon ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {isWon ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Ganhou</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" /> Perdeu</>
                )}
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-slate-900 mb-1">
            {position.market_title || 'Mercado'}
          </h3>
          
          <p className="text-sm text-slate-500">
            {position.contracts} contratos @ R$ {position.average_price?.toFixed(2)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-500 mb-1">
            {closed ? 'Resultado' : 'Investido'}
          </p>
          {closed ? (
            <p className={cn(
              "text-xl font-bold",
              (position.pnl || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {(position.pnl || 0) >= 0 ? '+' : ''}R$ {(position.pnl || 0).toFixed(2)}
            </p>
          ) : (
            <>
              <p className="text-xl font-bold text-slate-900">
                R$ {position.total_invested?.toFixed(2)}
              </p>
              <p className="text-sm text-emerald-600">
                +R$ {potentialProfit.toFixed(2)} potencial
              </p>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
