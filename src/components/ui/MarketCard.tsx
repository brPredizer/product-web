import React from 'react'
import Link from 'next/link'
import { createPageUrl } from '@/routes'
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Clock, Users } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const categoryLabels: Record<string, string> = {
  // slugs seeded by backend
  'clima': 'Clima',
  'criptomoedas': 'Criptomoedas',
  'cultura': 'Cultura',
  'economia': 'Economia',
  'em-alta': 'Em Alta',
  'empresas': 'Empresas',
  'esportes': 'Esportes',
  'financas': 'Finanças',
  'mencoes': 'Menções',
  'mundo': 'Mundo',
  'novidades': 'Novidades',
  'politica': 'Política',
  'saude': 'Saúde',
  'tecnologia-e-ciencia': 'Tecnologia e Ciência'
}

const categoryColors: Record<string, string> = {
  clima: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  criptomoedas: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  cultura: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  economia: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'em-alta': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  empresas: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  esportes: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'financas': 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20',
  'mencoes': 'bg-slate-200 text-slate-700 border-slate-200/20',
  mundo: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  novidades: 'bg-violet-100 text-violet-700 border-violet-100/20',
  'politica': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'saude': 'bg-rose-100 text-rose-600 border-rose-100/20',
  'tecnologia-e-ciencia': 'bg-violet-500/10 text-violet-600 border-violet-500/20'
}

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

export default function MarketCard({ market, compact = false }: { market: Market; compact?: boolean }) {
  const yesPercent = Math.round(((market.yes_price ?? 0.5) as number) * 100)
  const noPercent = 100 - yesPercent
  
  const isClosingSoon = !!market.closing_date && (new Date(market.closing_date).getTime() - Date.now() < 24 * 60 * 60 * 1000)

  const closingDistance = market.closing_date
    ? formatDistanceToNow(new Date(market.closing_date), { locale: ptBR, addSuffix: true })
    : null

  const volumeLabel = (market.volume_total ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  if (compact) {
    return (
      <Link 
        href={createPageUrl(`Market?id=${market.id}`)}
        className="group block p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
              {market.title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={`text-xs ${categoryColors[market.category ?? '']}`}>
                {categoryLabels[market.category ?? '']}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
              {closingDistance && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Encerra {closingDistance}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{volumeLabel} volume</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-emerald-600">{yesPercent}%</div>
            <div className="text-xs text-slate-500">SIM</div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link 
      href={createPageUrl(`Market?id=${market.id}`)}
      className="group block bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {market.image_url && (
        <div className="h-32 overflow-hidden">
          <img 
            src={market.image_url} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <Badge variant="outline" className={`text-xs ${categoryColors[market.category ?? '']}`}>
            {categoryLabels[market.category ?? '']}
          </Badge>
          {isClosingSoon && (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Encerra em breve
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-4 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {market.title}
        </h3>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-emerald-600">SIM R$ {(market.yes_price ?? 0).toFixed(2)}</span>
            <span className="font-semibold text-rose-500">NÃO R$ {((market.no_price ?? (1 - (market.yes_price ?? 0))) as number).toFixed(2)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
            <div 
              className="bg-emerald-600 transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
            <div 
              className="bg-rose-600 transition-all duration-500"
              style={{ width: `${noPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>R$ {(((market.volume_total ?? 0) as number) / 1000).toFixed(1)}k volume</span>
          </div>
          {market.closing_date && (
            <span>
              Encerra {format(new Date(market.closing_date), "d 'de' MMM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
