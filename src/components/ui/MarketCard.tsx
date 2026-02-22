import React from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, Users } from 'lucide-react'

import { createPageUrl } from '@/routes'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const categoryLabels: Record<string, string> = {
  CLIMA: 'Clima',
  CRIPTOMOEDAS: 'Criptomoedas',
  CULTURA: 'Cultura',
  ECONOMIA: 'Economia',
  'EM-ALTA': 'Em Alta',
  EMPRESAS: 'Empresas',
  ESPORTES: 'Esportes',
  FINANCAS: 'Finanças',
  MENCOES: 'Mencões',
  MUNDO: 'Mundo',
  NOVIDADES: 'Novidades',
  POLITICA: 'Política',
  SAUDE: 'Saúde',
  'TECNOLOGIA-E-CIENCIA': 'Tecnologia e Ciência'
}

const categoryColors: Record<string, string> = {
  CLIMA: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/25',
  CRIPTOMOEDAS: 'bg-amber-500/10 text-amber-800 border-amber-500/25',
  CULTURA: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/25',
  ECONOMIA: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
  'EM-ALTA': 'bg-lime-400/15 text-lime-800 border-lime-500/25',
  EMPRESAS: 'bg-sky-500/10 text-sky-700 border-sky-500/25',
  ESPORTES: 'bg-orange-500/10 text-orange-700 border-orange-500/25',
  FINANCAS: 'bg-rose-500/10 text-rose-700 border-rose-500/25',
  MENCOES: 'bg-slate-200 text-slate-700 border-slate-300/60',
  MUNDO: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/25',
  NOVIDADES: 'bg-teal-500/10 text-teal-700 border-teal-500/25',
  POLITICA: 'bg-blue-500/10 text-blue-700 border-blue-500/25',
  SAUDE: 'bg-red-500/10 text-red-700 border-red-500/25',
  'TECNOLOGIA-E-CIENCIA': 'bg-violet-500/10 text-violet-700 border-violet-500/25'
}

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_SEGMENT_PX = 6

type Market = {
  id: string | number
  title: string
  yes_price?: number
  no_price?: number
  closing_date?: string | null
  image_url?: string | null
  volume_total?: number | null
  category?: string
}

function clampPct(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizePercents(yesPrice?: number, noPrice?: number): { yes: number; no: number } {
  const rawYes = Number.isFinite(yesPrice) ? Number(yesPrice) * 100 : Number.NaN
  const rawNo = Number.isFinite(noPrice) ? Number(noPrice) * 100 : Number.NaN

  if (Number.isFinite(rawYes) && Number.isFinite(rawNo) && rawYes + rawNo > 0) {
    const total = rawYes + rawNo
    return {
      yes: clampPct((rawYes / total) * 100),
      no: clampPct((rawNo / total) * 100)
    }
  }

  if (Number.isFinite(rawYes)) {
    const yes = clampPct(rawYes)
    return { yes, no: clampPct(100 - yes) }
  }

  if (Number.isFinite(rawNo)) {
    const no = clampPct(rawNo)
    return { yes: clampPct(100 - no), no }
  }

  return { yes: 50, no: 50 }
}

function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value)
  const compact = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })

  if (abs >= 1_000_000) return `R$ ${compact.format(value / 1_000_000)}M`
  if (abs >= 1_000) return `R$ ${compact.format(value / 1_000)}k`

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export default function MarketCard({ market, compact = false }: { market: Market; compact?: boolean }) {
  const { yes, no } = normalizePercents(market.yes_price, market.no_price)
  const yesPct = Math.round(yes)
  const noPct = Math.round(no)

  const categoryKey = market.category ?? ''
  const categoryLabel = categoryLabels[categoryKey] ?? (categoryKey.replaceAll('-', ' ') || 'Mercado')
  const categoryColor = categoryColors[categoryKey] ?? 'bg-slate-100 text-slate-700 border-slate-200'

  const closingDate = parseDate(market.closing_date)
  const closingMs = closingDate ? closingDate.getTime() - Date.now() : null
  const isClosingSoon = closingMs !== null && closingMs > 0 && closingMs < DAY_MS

  const closeLabel = closingDate
    ? `Encerra ${format(closingDate, "d 'de' MMM", { locale: ptBR })}`
    : 'Sem data de encerramento'

  const closeDistanceLabel = closingDate
    ? `Encerra ${formatDistanceToNow(closingDate, { locale: ptBR, addSuffix: true })}`
    : closeLabel

  const volumeLabel = `${formatCompactCurrency(Number(market.volume_total ?? 0))} volume`

  const showYes = yes > 0
  const showNo = no > 0

  return (
    <Link
      href={createPageUrl(`Market?id=${market.id}`)}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      <Card
        className={cn(
          'h-full rounded-2xl border-slate-200 bg-white p-5 shadow-sm transition-all duration-200',
          'hover:-translate-y-0.5 hover:shadow-md',
          compact && 'p-4'
        )}
      >
        {market.image_url && !compact ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
            <img
              src={market.image_url}
              alt={market.title}
              className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn('rounded-lg px-3 py-lg text-xs font-medium', categoryColor)}>
              {categoryLabel}
            </Badge>

            {isClosingSoon ? (
              <Badge
                variant="outline"
                className="rounded-lg border-amber-200 bg-amber-50 px-3 py-lg text-xs font-medium text-amber-700"
              >
                <Clock className="mr-1 h-3 w-3" />
                Encerra em breve
              </Badge>
            ) : null}
          </div>

        </div>

        <h3
          className={cn(
            'mt-4 line-clamp-3 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-slate-900',
            compact && 'mt-3 line-clamp-2 text-base'
          )}
        >
          {market.title}
        </h3>

        <div className={cn('mt-4', compact && 'mt-3')}>
          <div className="grid grid-cols-2 items-end gap-3">
            <div>
              <div className="text-[11px] font-medium text-slate-500">SIM</div>
              <div className={cn('mt-0.5 font-semibold leading-none tabular-nums text-emerald-600', compact ? 'text-lg' : 'text-xl')}>
                {yesPct}%
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-medium text-slate-500">NÃO</div>
              <div className={cn('mt-0.5 font-semibold leading-none tabular-nums text-rose-600', compact ? 'text-lg' : 'text-xl')}>
                {noPct}%
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div
              className={cn(
                'w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200',
                compact ? 'h-1' : 'h-1.5'
              )}
            >
              <div className="flex h-full w-full">
                <div
                  className={cn('h-full bg-emerald-500 transition-[width] duration-300', showYes && 'min-w-[6px]')}
                  style={{
                    width: `${yes}%`,
                    minWidth: showYes ? MIN_SEGMENT_PX : 0
                  }}
                  aria-label={`SIM ${yesPct}%`}
                />
                <div
                  className={cn('h-full bg-rose-500 transition-[width] duration-300', showNo && 'min-w-[6px]')}
                  style={{
                    width: `${no}%`,
                    minWidth: showNo ? MIN_SEGMENT_PX : 0
                  }}
                  aria-label={`NÃO ${noPct}%`}
                />
              </div>
            </div>

            {!compact ? (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  SIM
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  NÃO
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            'mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500',
            compact && 'mt-3 text-[11px]'
          )}
        >
          <div className="inline-flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 shrink-0" />
            <span className="tabular-nums truncate">{volumeLabel}</span>
          </div>

          <div className="inline-flex items-center gap-2 min-w-0">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="truncate">{compact ? closeDistanceLabel : closeLabel}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

