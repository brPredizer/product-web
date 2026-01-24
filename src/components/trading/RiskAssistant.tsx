'use client'

import React, { useEffect, useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { mockApi } from '@/app/api/mockClient'

import {
  calculateRiskManagedPosition,
  blendProbability,
  fetchExternalSignals,
  getRiskLevel,
  formatBRL,
} from '@/utils/marketIntelligence'

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

export default function RiskAssistant({
  market,
  userBalance,
  side,
}: RiskAssistantProps) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  const TEST_FORCE_READY = true

  const runAnalysis = async () => {
    if (TEST_FORCE_READY) return
    setLoading(true)

    try {
      const external = await fetchExternalSignals(market, mockApi)

      const p_mkt = Number(
        side === 'yes'
          ? market.yes_price
          : market.no_price ?? 1 - market.yes_price
      )

      const p_final = blendProbability(
        p_mkt,
        Number(external.external_probability ?? 0.5),
        side === 'yes'
          ? Number(external.directional_consensus ?? 0)
          : -Number(external.directional_consensus ?? 0),
        Math.min(1, (market.volume_total || 0) / 100000)
      )

      const position = calculateRiskManagedPosition(
        userBalance,
        p_mkt,
        p_final,
        Number(external.confidence ?? 0.5)
      )

      setAnalysis({ external, p_final, position, p_mkt })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!TEST_FORCE_READY || !market) return

    const p_mkt = Number(
      side === 'yes'
        ? market.yes_price
        : market.no_price ?? 1 - market.yes_price
    )

    const external = {
      external_probability: p_mkt,
      confidence: 0.72,
      news_intensity: 0.4,
      directional_consensus: 0.05,
      macro_shock: 0.02,
      summary: 'Análise simulada para visualização.',
    }

    const position = calculateRiskManagedPosition(
      userBalance || 1000,
      p_mkt,
      p_mkt,
      external.confidence
    )

    setAnalysis({ external, p_final: p_mkt, position, p_mkt })
  }, [market?.id, side, userBalance])

  if (!analysis) {
    return (
      <div className="p-4 text-sm text-slate-500">
        {loading ? 'Analisando mercado…' : 'Preparando análise…'}
      </div>
    )
  }

  const { external, p_final, position, p_mkt } = analysis
  const riskLevel = getRiskLevel(position.kelly_fraction_pct)
  const hasEdge = Number(position.edge) > 0

  return (
    <div>
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-100 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-600">
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            <div>
              <p className="font-semibold text-slate-900">
                Assistente de Risco IA
              </p>
              <p className="text-xs text-slate-600">
                Confiança {Math.round(external.confidence * 100)}%
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={runAnalysis}
            disabled={loading}
          >
            <RefreshCw
              className={cn('w-4 h-4', loading && 'animate-spin')}
            />
          </Button>
        </div>

        {/* PROBABILIDADES */}
        <div className="grid grid-cols-3 gap-3 px-4 py-4">
          <StatCard label="Mercado" value={`${(p_mkt * 100).toFixed(0)}%`} />
          <StatCard
            label="Fontes Externas"
            value={`${(external.external_probability * 100).toFixed(0)}%`}
          />
          <StatCard
            label="IA Combinada"
            value={`${(p_final * 100).toFixed(0)}%`}
            highlight
          />
        </div>

        {/* EDGE */}
        <div
          className={cn(
            'mx-4 mb-4 rounded-xl p-3 flex items-center gap-2',
            hasEdge
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          )}
        >
          {hasEdge ? <TrendingUp size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-medium">
            {hasEdge
              ? `Edge estatística de ${position.edge}% detectada`
              : 'Sem edge clara (mercado eficiente)'}
          </span>
        </div>

        {/* POSIÇÃO */}
        <div className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-900">
              Posição Recomendada
              <span className="ml-2 text-sm text-slate-500 font-normal">
                (Kelly 0.25×)
              </span>
            </h4>

            <Badge
              className={cn(
                'whitespace-nowrap',
                riskLevel.color === 'emerald' &&
                  'bg-emerald-100 text-emerald-700',
                riskLevel.color === 'yellow' &&
                  'bg-yellow-100 text-yellow-700',
                riskLevel.color === 'rose' &&
                  'bg-rose-100 text-rose-700'
              )}
            >
              Risco {riskLevel.label}
            </Badge>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 space-y-3">
            <InfoRow
              label="Valor Recomendado"
              value={formatBRL(position.stake_recommended_brl)}
              strong
            />
            <InfoRow label="Contratos" value={position.shares} />
            <InfoRow
              label="% do Saldo"
              value={`${position.kelly_fraction_pct}%`}
              accent
            />
          </div>
        </div>

        {/* EV */}
        <div className="mx-4 mb-4 flex justify-between">
          <span className="text-sm text-slate-600">
            Valor Esperado (EV)
          </span>
          <span
            className={cn(
              'font-bold',
              position.expected_value_brl >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            )}
          >
            {position.expected_value_brl >= 0 ? '+' : ''}
            {formatBRL(position.expected_value_brl)}
          </span>
        </div>

        {/* EXPAND */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full p-5 border-t rounded-t-none justify-center"
        >
          {expanded ? 'Menos detalhes' : 'Ver análise completa'}
        </Button>

        {expanded && (
          <div className="px-4 py-4 space-y-3 border-t text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <Info size={14} /> Sinais Externos
            </h4>

            <Detail label="Intensidade Noticiosa" value={external.news_intensity} />
            <Detail label="Consenso Direcional" value={external.directional_consensus} />
            <Detail label="Choque Macro" value={external.macro_shock} />

            {external.summary && (
              <div className="bg-slate-50 p-3 rounded-lg">
                {external.summary}
              </div>
            )}
          </div>
        )}

        {/* RISCO */}
        <div className="mx-4 mb-4 rounded-xl bg-amber-50 p-3 flex gap-2">
          <Shield size={16} className="text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Gestão de Risco:</strong> Kelly conservador (0.25×).
            Nunca invista mais do que pode perder.
          </p>
        </div>
      </div>
    </div>
  )
}

/* COMPONENTES AUX */

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl p-4 text-center',
        highlight
          ? 'bg-violet-600 text-white'
          : 'bg-white shadow-sm'
      )}
    >
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}

function InfoRow({
  label,
  value,
  strong,
  accent,
}: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span
        className={cn(
          'font-medium',
          strong && 'text-lg font-bold',
          accent && 'text-violet-600'
        )}
      >
        {value}
      </span>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium">{(value * 100).toFixed(0)}%</span>
    </div>
  )
}
