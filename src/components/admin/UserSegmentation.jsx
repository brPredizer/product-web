import React, { useState } from 'react';
import { mockApi } from '@/api/mockClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Sparkles,
  DollarSign,
  Activity,
  UserCheck,
  AlertTriangle,
  Target,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const segmentConfig = {
  'high_value': {
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Usuários com alto volume de apostas e saldo'
  },
  'new_depositors': {
    icon: UserCheck,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Novos usuários que realizaram depósito recentemente'
  },
  'infrequent_players': {
    icon: TrendingDown,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Usuários com baixa frequência de apostas'
  },
  'at_risk': {
    icon: AlertTriangle,
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    description: 'Usuários em risco de churn'
  },
  'active_traders': {
    icon: Activity,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Usuários ativos com alta frequência de operações'
  },
  'potential_whales': {
    icon: TrendingUp,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description: 'Usuários com potencial de se tornarem high-value'
  }
};

export default function UserSegmentation({ users, transactions, positions }) {
  const [segments, setSegments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  const analyzeSegments = async () => {
    setLoading(true);
    try {
      // Preparar dados agregados para análise
      const userMetrics = users.map(user => {
        const userTxs = transactions.filter(t => t.user_id === user.id);
        const userPos = positions.filter(p => p.user_id === user.id);
        
        const totalDeposited = userTxs
          .filter(t => t.type === 'deposit')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalWagered = user.total_wagered || 0;
        const daysSinceCreation = Math.floor(
          (new Date() - new Date(user.created_date)) / (1000 * 60 * 60 * 24)
        );
        
        const lastTransaction = userTxs.sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        )[0];
        
        const daysSinceLastActivity = lastTransaction 
          ? Math.floor((new Date() - new Date(lastTransaction.created_date)) / (1000 * 60 * 60 * 24))
          : daysSinceCreation;
        
        return {
          id: user.id,
          email: user.email,
          balance: user.balance || 0,
          total_deposited: totalDeposited,
          total_wagered: totalWagered,
          markets_participated: user.markets_participated || 0,
          days_since_creation: daysSinceCreation,
          days_since_last_activity: daysSinceLastActivity,
          num_transactions: userTxs.length,
          num_positions: userPos.length,
          avg_bet_size: totalWagered > 0 ? totalWagered / (userPos.length || 1) : 0
        };
      });

      // Análise com IA
      const analysis = await mockApi.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em segmentação de usuários para plataformas de mercados preditivos.

Analise os ${userMetrics.length} usuários abaixo e segmente-os em categorias:
- high_value: Alto valor (>R$500 apostado, saldo alto)
- new_depositors: Novos depositantes (<7 dias desde criação, já depositou)
- infrequent_players: Jogadores pouco frequentes (>10 dias sem atividade, mas já apostou)
- at_risk: Em risco de churn (>5 dias sem atividade, pouco saldo)
- active_traders: Traders ativos (muitas transações, frequência alta)
- potential_whales: Potencial de alto valor (crescimento rápido, boa frequência)

Para cada segmento, forneça:
1. Lista de user IDs
2. Características principais
3. Valor total do segmento (soma dos saldos)
4. Recomendações de engajamento
5. Insights comportamentais

Dados dos usuários (primeiros 100 para análise):
${JSON.stringify(userMetrics.slice(0, 100), null, 2)}`,
        response_json_schema: {
          type: "object",
          properties: {
            segments: {
              type: "object",
              properties: {
                high_value: {
                  type: "object",
                  properties: {
                    user_ids: { type: "array", items: { type: "string" } },
                    count: { type: "number" },
                    characteristics: { type: "string" },
                    total_value: { type: "number" },
                    recommendations: { type: "string" },
                    insights: { type: "string" }
                  }
                },
                new_depositors: {
                  type: "object",
                  properties: {
                    user_ids: { type: "array", items: { type: "string" } },
                    count: { type: "number" },
                    characteristics: { type: "string" },
                    total_value: { type: "number" },
                    recommendations: { type: "string" },
                    insights: { type: "string" }
                  }
                },
                infrequent_players: {
                  type: "object",
                  properties: {
                    user_ids: { type: "array", items: { type: "string" } },
                    count: { type: "number" },
                    characteristics: { type: "string" },
                    total_value: { type: "number" },
                    recommendations: { type: "string" },
                    insights: { type: "string" }
                  }
                },
                at_risk: {
                  type: "object",
                  properties: {
                    user_ids: { type: "array", items: { type: "string" } },
                    count: { type: "number" },
                    characteristics: { type: "string" },
                    total_value: { type: "number" },
                    recommendations: { type: "string" },
                    insights: { type: "string" }
                  }
                },
                active_traders: {
                  type: "object",
                  properties: {
                    user_ids: { type: "array", items: { type: "string" } },
                    count: { type: "number" },
                    characteristics: { type: "string" },
                    total_value: { type: "number" },
                    recommendations: { type: "string" },
                    insights: { type: "string" }
                  }
                },
                potential_whales: {
                  type: "object",
                  properties: {
                    user_ids: { type: "array", items: { type: "string" } },
                    count: { type: "number" },
                    characteristics: { type: "string" },
                    total_value: { type: "number" },
                    recommendations: { type: "string" },
                    insights: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      setSegments(analysis.segments);
      toast.success('Segmentação concluída!');
    } catch (error) {
      console.error('Erro na segmentação:', error);
      toast.error('Erro ao segmentar usuários');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Segmentação Inteligente de Usuários
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            IA analisa comportamento e valor para criar segmentos personalizados
          </p>
        </div>
        <Button
          onClick={analyzeSegments}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Executar Segmentação
            </>
          )}
        </Button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-slate-600">Analisando {users.length} usuários com IA...</p>
          <p className="text-sm text-slate-500 mt-2">Isso pode levar alguns segundos</p>
        </div>
      )}

      {segments && !loading && (
        <>
          {/* Segment Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(segments).map(([key, segment]) => {
              const config = segmentConfig[key];
              const Icon = config.icon;
              
              return (
                <Card 
                  key={key}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedSegment(key)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className="text-lg font-bold">
                        {segment.count || 0}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">
                      {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </CardTitle>
                    <p className="text-xs text-slate-500">{config.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Valor Total:</span>
                        <span className="font-semibold">R$ {(segment.total_value || 0).toFixed(2)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSegment(key);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Selected Segment Details */}
          {selectedSegment && segments[selectedSegment] && (
            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(segmentConfig[selectedSegment].icon, { className: "w-5 h-5 text-purple-600" })}
                    {selectedSegment.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSegment(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Características:</p>
                  <p className="text-sm text-slate-600">{segments[selectedSegment].characteristics}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Insights Comportamentais:</p>
                  <p className="text-sm text-slate-600">{segments[selectedSegment].insights}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Recomendações de Engajamento:
                  </p>
                  <p className="text-sm text-slate-600">{segments[selectedSegment].recommendations}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Usuários no Segmento ({segments[selectedSegment].count}):
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-slate-200 max-h-48 overflow-y-auto">
                    <div className="space-y-1">
                      {segments[selectedSegment].user_ids.slice(0, 20).map(userId => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <div key={userId} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                            <span className="text-slate-700">{user?.email || userId}</span>
                            <span className="text-slate-500">R$ {(user?.balance || 0).toFixed(2)}</span>
                          </div>
                        );
                      })}
                      {segments[selectedSegment].user_ids.length > 20 && (
                        <p className="text-xs text-slate-500 text-center pt-2">
                          ... e mais {segments[selectedSegment].user_ids.length - 20} usuários
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!segments && !loading && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-2">Nenhuma segmentação executada</p>
          <p className="text-sm text-slate-500 mb-4">
            Clique em "Executar Segmentação" para analisar seus usuários com IA
          </p>
        </div>
      )}
    </div>
  );
}