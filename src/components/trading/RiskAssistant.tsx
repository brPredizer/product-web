import React, { useState, useEffect } from 'react'
import { mockApi } from '@/api/mockClient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Sparkles,
  TrendingUp,
  Shield,
  AlertTriangle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  calculateRiskManagedPosition,
  blendProbability,
  fetchExternalSignals,
  getRiskLevel,
  formatBRL,
} from '@/utils/marketIntelligence'
import { cn } from '@/lib/utils'

type Market = any

type RiskAssistantProps = {
  market: Market
  userBalance: number
  side?: string
}

type Analysis = {
  external: any
  p_final: number
  position: any
  p_mkt: number
}

export default function RiskAssistant({ market, userBalance, side }: RiskAssistantProps) {
  const [loading, setLoading] = useState<boolean>(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [expanded, setExpanded] = useState<boolean>(false)

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const external = await fetchExternalSignals(market, mockApi)

      const p_mkt = Number(side === 'yes' ? market.yes_price : (market.no_price ?? (1 - market.yes_price)))
      const externalProb = Number(external.external_probability ?? 0.5)
      const directional = Number(external.directional_consensus ?? 0)
      const liquidity = Math.min(1, (market.volume_total || 0) / 100000)

      const p_final = blendProbability(
        p_mkt,
        externalProb,
        side === 'yes' ? directional : -directional,
        liquidity
      )

      const confidence = Number(external.confidence ?? 0.5)
      const position = calculateRiskManagedPosition(userBalance, p_mkt, p_final, confidence)

      setAnalysis({ external, p_final, position, p_mkt })
    } catch (error) {
      console.error('Error running analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (market && userBalance > 0) {
      runAnalysis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market?.id, side, userBalance])

  if (!analysis) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Assistente de Risco IA</p>
              <p className="text-sm text-slate-600">Análise inteligente de posição</p>
            </div>
          </div>
          <Button onClick={runAnalysis} disabled={loading} size="sm" className="bg-purple-600 hover:bg-purple-700">
            {loading ? 'Analisando...' : 'Analisar'}
          </Button>
        </div>
      </Card>
    )
  }

  const { external, p_final, position, p_mkt } = analysis
  const riskLevel = getRiskLevel(position.kelly_fraction_pct)
  const hasEdge = parseFloat(position.edge) > 0

  return (
    <Card className="overflow-hidden border-purple-200">
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 border-b border-purple-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Assistente de Risco IA</p>
              <Badge className="mt-1 bg-purple-100 text-purple-700">Confiança: {(external.confidence * 100).toFixed(0)}%</Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={runAnalysis} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Mercado</p>
            <p className="text-lg font-bold text-slate-900">{(p_mkt * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Fontes Externas</p>
            <p className="text-lg font-bold text-blue-600">{(external.external_probability * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-purple-600 rounded-lg p-3 text-white">
            <p className="text-xs text-purple-100 mb-1">IA Combinada</p>
            <p className="text-lg font-bold">{(p_final * 100).toFixed(0)}%</p>
          </div>
        </div>

        {hasEdge ? (
          <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900">Edge estatística de {position.edge}% detectada</span>
          </div>
        ) : (
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Sem edge clara (mercado eficiente)</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">Posição Recomendada (Kelly 0.25×)</h4>
            <Badge
              className={cn(
                riskLevel.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  riskLevel.color === 'green' ? 'bg-green-100 text-green-700' :
                    riskLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'
              )}
            >
              Risco {riskLevel.label}
            </Badge>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Valor Recomendado</span>
              <span className="text-lg font-bold text-slate-900">{formatBRL(position.stake_recommended_brl)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Contratos</span>
              <span className="font-semibold text-slate-900">{position.shares}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">% do Saldo (Kelly)</span>
              <span className="font-semibold text-purple-600">{position.kelly_fraction_pct}%</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Cenários</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-xs text-emerald-700 mb-1">✓ Se Ganhar</p>
              <p className="text-xl font-bold text-emerald-600">+{formatBRL(position.max_gain_brl)}</p>
              <p className="text-xs text-emerald-600 mt-1">ROI: +{position.roi_pct}%</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
              <p className="text-xs text-rose-700 mb-1">✗ Se Perder</p>
              <p className="text-xl font-bold text-rose-600">-{formatBRL(position.max_loss_brl)}</p>
              <p className="text-xs text-rose-600 mt-1">Perda total</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Valor Esperado (EV)</span>
            <span className={cn('font-bold', position.expected_value_brl >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {position.expected_value_brl >= 0 ? '+' : ''}{formatBRL(position.expected_value_brl)}
            </span>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full">
          {expanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
          {expanded ? 'Menos Detalhes' : 'Ver Análise Completa'}
        </Button>

        {expanded && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Sinais Externos
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Intensidade Noticiosa</span>
                  <span className="font-medium">{(external.news_intensity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Consenso Direcional</span>
                  <span className="font-medium">{external.directional_consensus > 0 ? '+' : ''}{(external.directional_consensus * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Choque Macro</span>
                  <span className="font-medium">{(external.macro_shock * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {external.key_indicators?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Indicadores Chave</h4>
                <div className="flex flex-wrap gap-2">
                  {external.key_indicators.map((indicator: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{indicator}</Badge>
                  ))}
                </div>
              </div>
            )}

            {external.sources?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Fontes Consultadas</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  {external.sources.map((source: string, i: number) => (
                    <li key={i}>• {source}</li>
                  ))}
                </ul>
              </div>
            )}

            {external.summary && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-700">{external.summary}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <strong>Gestão de Risco:</strong> Esta recomendação usa Kelly Criterion conservador (0.25×). Nunca invista mais do que pode perder. Resultados passados não garantem resultados futuros.
          </p>
        </div>
      </div>
    </Card>
  )
}
