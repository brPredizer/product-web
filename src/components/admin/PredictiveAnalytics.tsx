import React, { useState } from 'react';
import { mockApi } from '@/app/api/mockClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  DollarSign,
  Users,
  Wallet,
  AlertTriangle,
  Loader2,
  Calendar,
  Target,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type User = {
  id: string | number;
  created_date?: string | Date | null;
};

type Transaction = {
  user_id?: string | number;
  created_date?: string | Date | null;
  type?: string;
  amount?: number | null;
  fee?: number | null;
};

type PredictionMetrics = {
  next_7_days: number;
  next_30_days: number;
  confidence: 'high' | 'medium' | 'low' | string;
  trend: 'up' | 'down' | 'stable' | string;
  insights?: string;
};

type Predictions = {
  user_growth: PredictionMetrics;
  revenue: PredictionMetrics;
  deposits: PredictionMetrics;
  churn: PredictionMetrics;
};

type ForecastResult = {
  predictions: Predictions;
  summary?: string;
  risks?: string[];
  opportunities?: string[];
  recommendations?: string[];
};

type ForecastState = ForecastResult & {
  historicalData: Array<{ date: string; newUsers: number; deposits: number; revenue: number }>;
  currentMetrics: { users: number; churn: number; revenue: number; deposits: number };
} | null;

export default function PredictiveAnalytics({ users, transactions, period }:
  { users: User[]; transactions: Transaction[]; period?: string }
) {
  const [forecasts, setForecasts] = useState<ForecastState>(null);
  const [loading, setLoading] = useState(false);

  const generateForecasts = async () => {
    setLoading(true);
    try {
      const dailyMetrics: Record<string, { newUsers: number; deposits: number; revenue: number }> = {};

      (users || []).forEach(user => {
        const date = new Date(user.created_date || Date.now()).toISOString().split('T')[0];
        if (!dailyMetrics[date]) {
          dailyMetrics[date] = { newUsers: 0, deposits: 0, revenue: 0 };
        }
        dailyMetrics[date].newUsers += 1;
      });

      (transactions || []).forEach(tx => {
        const date = new Date(tx.created_date || Date.now()).toISOString().split('T')[0];
        if (!dailyMetrics[date]) {
          dailyMetrics[date] = { newUsers: 0, deposits: 0, revenue: 0 };
        }
        if (tx.type === 'deposit') {
          dailyMetrics[date].deposits += Number(tx.amount || 0);
          dailyMetrics[date].revenue += Number(tx.fee || 0);
        } else if (tx.type === 'withdrawal') {
          dailyMetrics[date].revenue += Number(tx.fee || 0);
        }
      });

      const historicalData = Object.entries(dailyMetrics)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-30)
        .map(([date, metrics]) => ({ date, ...metrics }));

      const calculateChurn = () => {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        return (users || []).filter(user => {
          const userTxs = (transactions || []).filter(t => t.user_id === user.id && t.type === 'buy');
          if (userTxs.length === 0) return false;
          const lastTx = userTxs.sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime())[0];
          return new Date(lastTx.created_date || 0) <= fiveDaysAgo;
        }).length;
      };

      const currentChurn = calculateChurn();

      // Chamar LLM via mockApi — manter como any para evitar quebra de typing compartilhado
      const prediction = await (mockApi as any).integrations.Core.InvokeLLM({
        prompt: `Você é um analista de dados especializado em previsões de negócios.\n\nAnalise os dados históricos dos últimos 30 dias e forneça previsões detalhadas para os próximos 7 e 30 dias:\n\nDADOS HISTÓRICOS:\n${JSON.stringify(historicalData, null, 2)}\n\nMÉTRICAS ATUAIS:\n- Total de Usuários: ${users.length}\n- Churn Atual: ${currentChurn} usuários inativos\n- Receita Total (últimos 30 dias): R$ ${historicalData.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}\n- Depósitos Totais (últimos 30 dias): R$ ${historicalData.reduce((sum, d) => sum + d.deposits, 0).toFixed(2)}\n\nINSTRUÇÕES:\n1. Identifique tendências e padrões nos dados\n2. Calcule taxas de crescimento médias\n3. Considere sazonalidades e anomalias\n4. Forneça previsões realistas baseadas em análise estatística\n\nPara cada métrica (user_growth, revenue, deposits, churn), forneça:\n- Previsão para 7 dias\n- Previsão para 30 dias\n- Nível de confiança (high/medium/low)\n- Tendência (up/down/stable)\n- Fatores de risco ou oportunidades\n\nSeja conservador nas previsões, considerando volatilidade do mercado.`,
        response_json_schema: {
          type: "object",
        }
      });

      // Esperamos que prediction contenha a estrutura desejada — usar coerção conservadora
      const result: ForecastResult = prediction as any;

      setForecasts({
        ...result,
        historicalData,
        currentMetrics: {
          users: users.length,
          churn: currentChurn,
          revenue: historicalData.reduce((sum, d) => sum + d.revenue, 0),
          deposits: historicalData.reduce((sum, d) => sum + d.deposits, 0)
        }
      });

      toast.success('Previsões geradas com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar previsões:', error);
      toast.error('Erro ao gerar análise preditiva');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string | undefined) => {
    if (trend === 'up') return <ArrowUpCircle className="w-4 h-4 text-emerald-600" />;
    if (trend === 'down') return <ArrowDownCircle className="w-4 h-4 text-rose-600" />;
    return <TrendingUp className="w-4 h-4 text-slate-600" />;
  };

  const getConfidenceBadge = (confidence?: string) => {
    const colors: Record<string, string> = {
      high: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-rose-100 text-rose-700'
    };
    return (
      <Badge className={colors[confidence || 'medium'] || colors.medium}>
        Confiança: {confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'}
      </Badge>
    );
  };

  const ForecastCard: React.FC<{ title: string; icon: any; prediction: PredictionMetrics; currentValue: number; format?: 'number' | 'currency' | 'percentage' }> = ({ title, icon: Icon, prediction, currentValue, format = 'number' }) => {
    const formatValue = (val: number) => {
      if (format === 'currency') return `R$ ${val.toFixed(2)}`;
      if (format === 'percentage') return `${val.toFixed(1)}%`;
      return Math.round(val).toLocaleString('pt-BR');
    };

    const safeCurrent = currentValue === 0 ? 1 : currentValue; // evitar divisão por zero
    const growth7d = ((prediction.next_7_days - currentValue) / safeCurrent) * 100;
    const growth30d = ((prediction.next_30_days - currentValue) / safeCurrent) * 100;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="w-5 h-5 text-purple-600" />
              {title}
            </CardTitle>
            {getConfidenceBadge(prediction.confidence)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                7 dias
              </p>
              <p className="text-xl font-bold text-slate-900">{formatValue(prediction.next_7_days)}</p>
              <p className={`text-xs flex items-center gap-1 mt-1 ${growth7d >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {getTrendIcon(prediction.trend)}
                {growth7d >= 0 ? '+' : ''}{growth7d.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                30 dias
              </p>
              <p className="text-xl font-bold text-slate-900">{formatValue(prediction.next_30_days)}</p>
              <p className={`text-xs flex items-center gap-1 mt-1 ${growth30d >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {getTrendIcon(prediction.trend)}
                {growth30d >= 0 ? '+' : ''}{growth30d.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-600">{prediction.insights}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Análise Preditiva com IA
          </h2>
          <p className="text-sm text-slate-500 mt-1">Previsões baseadas em dados históricos e tendências de mercado</p>
        </div>
        <Button onClick={generateForecasts} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Previsões
            </>
          )}
        </Button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-slate-600 font-medium">Analisando {users?.length ?? 0} usuários e {transactions?.length ?? 0} transações...</p>
          <p className="text-sm text-slate-500 mt-2">A IA está identificando padrões e gerando previsões</p>
        </div>
      )}

      {forecasts && !loading && (
        <>
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-purple-900 mb-2">Resumo Executivo</p>
                  <p className="text-sm text-slate-700">{forecasts.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <ForecastCard
              title="Crescimento de Usuários"
              icon={Users}
              prediction={forecasts.predictions.user_growth}
              currentValue={forecasts.currentMetrics.users}
            />
            <ForecastCard
              title="Receita Prevista"
              icon={DollarSign}
              prediction={forecasts.predictions.revenue}
              currentValue={forecasts.currentMetrics.revenue}
              format="currency"
            />
            <ForecastCard
              title="Volume de Depósitos"
              icon={Wallet}
              prediction={forecasts.predictions.deposits}
              currentValue={forecasts.currentMetrics.deposits}
              format="currency"
            />
            <ForecastCard
              title="Taxa de Churn"
              icon={AlertTriangle}
              prediction={forecasts.predictions.churn}
              currentValue={forecasts.currentMetrics.churn}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {(forecasts.risks?.length ?? 0) > 0 && (
              <Card className="border-rose-200 bg-rose-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    Riscos Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {forecasts.risks?.map((risk, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-rose-600 mt-0.5">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {(forecasts.opportunities?.length ?? 0) > 0 && (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {forecasts.opportunities?.map((opp, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">•</span>
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {(forecasts.recommendations?.length ?? 0) > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-blue-600" />
                  Recomendações Estratégicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {forecasts.recommendations?.map((rec, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-blue-600 font-bold">{idx + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!forecasts && !loading && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-2">Análise Preditiva não executada</p>
          <p className="text-sm text-slate-500 mb-4">Use IA para prever tendências futuras baseadas em dados históricos</p>
        </div>
      )}
    </div>
  );
}
