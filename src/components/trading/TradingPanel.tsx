"use client"
import React, { useState } from 'react'
import { mockApi } from '@/api/mockClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Slider } from "@/components/ui/slider";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import RiskAssistant from './RiskAssistant'
import RiskDisclosureModal from '../risk/RiskDisclosureModal'
import { addMonths } from 'date-fns'

type Market = any

type TradingPanelProps = {
  market: Market
  userBalance?: number
  onTrade: (tradeData: any) => Promise<any> | any
  userId?: string | number
  variant?: 'card' | 'embedded' | string
  showRiskAssistant?: boolean
  side?: string
  onSideChange?: (side: string) => void
  hideSideSelector?: boolean
}

export default function TradingPanel({
  market,
  userBalance = 0,
  onTrade,
  userId,
  variant = 'card',
  showRiskAssistant = true,
  side: controlledSide,
  onSideChange,
  hideSideSelector = false,
}: TradingPanelProps) {
  const isEmbedded = variant === 'embedded'
  const [internalSide, setInternalSide] = useState<string>('yes')
  const side = controlledSide ?? internalSide
  const setSide = onSideChange ?? setInternalSide
  const [amount, setAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false)
  const [pendingTrade, setPendingTrade] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: disclosures = [] } = useQuery({
    queryKey: ['risk-disclosures', userId],
    queryFn: () => mockApi.entities.RiskDisclosure.filter({ user_id: userId }, '-created_date', 10),
    enabled: !!userId,
  })

  const createDisclosureMutation = useMutation({
    mutationFn: (data: any) => mockApi.entities.RiskDisclosure.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-disclosures', userId] })
    },
  })

  const hasValidDisclosure = disclosures.some((d: any) => {
    if (d.revoked) return false
    const validUntil = new Date(d.valid_until)
    return validUntil > new Date()
  })

  const price = side === 'yes' ? market.yes_price : (market.no_price ?? (1 - market.yes_price))
  const units = amount ? Math.floor(parseFloat(amount) / price) : 0
  const potentialPayout = units * 1
  const potentialProfit = potentialPayout - (parseFloat(amount) || 0)

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    if (!hasValidDisclosure) {
      setPendingTrade({
        side,
        amount: parseFloat(amount),
        contracts: units,
        price,
      })
      setShowRiskModal(true)
      return
    }

    executeTrade({
      side,
      amount: parseFloat(amount),
      contracts: units,
      price,
    })
  }

  const executeTrade = async (tradeData: any) => {
    setIsLoading(true)
    try {
      await onTrade(tradeData)
      setAmount('')
      setPendingTrade(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRisk = async () => {
    try {
      await createDisclosureMutation.mutateAsync({
        user_id: userId,
        document_version: '1.0',
        locale: 'pt-BR',
        valid_until: addMonths(new Date(), 6).toISOString(),
        answers_confirmed: true,
        market_id: market.id,
      })

      setShowRiskModal(false)

      if (pendingTrade) {
        executeTrade(pendingTrade)
      }
    } catch (error) {
      console.error('Error accepting risk disclosure:', error)
    }
  }

  const handleDeclineRisk = () => {
    setShowRiskModal(false)
    setPendingTrade(null)
  }

  const quickAmounts = [10, 50, 100, 500]

  const cardOuterClass = isEmbedded ? '' : 'bg-white rounded-2xl border border-slate-200 overflow-hidden'
  const bodyClass = isEmbedded ? '' : 'p-6'

  const sideSelector = (
    <div className={cn('grid grid-cols-2', isEmbedded ? 'gap-2 mb-4' : 'gap-3 mb-6')}>
      <button
        onClick={() => setSide('yes')}
        className={cn(
          isEmbedded ? 'p-2 rounded-lg border' : 'p-3 rounded-xl border-2',
          'transition-all duration-200',
          side === 'yes' ? 'border-emerald-500 bg-emerald-50/80' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className={cn('text-sm font-semibold', side === 'yes' ? 'text-emerald-600' : 'text-slate-700')}>SIM</span>
          </span>
          {!isEmbedded && <span className="text-xs text-slate-500">{Math.round(market.yes_price * 100)}%</span>}
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className={cn(isEmbedded ? 'text-base' : 'text-xl', 'font-bold', side === 'yes' ? 'text-emerald-600' : 'text-slate-900')}>
            R$ {(market.yes_price).toFixed(2)}
          </span>
          {!isEmbedded && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">prob.</span>
          )}
        </div>
      </button>

      <button
        onClick={() => setSide('no')}
        className={cn(
          isEmbedded ? 'p-2 rounded-lg border' : 'p-3 rounded-xl border-2',
          'transition-all duration-200',
          side === 'no' ? 'border-rose-500 bg-rose-50/80' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span className={cn('text-sm font-semibold', side === 'no' ? 'text-rose-600' : 'text-slate-700')}>NÃO</span>
          </span>
          {!isEmbedded && <span className="text-xs text-slate-500">{Math.round((market.no_price ?? (1 - market.yes_price)) * 100)}%</span>}
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className={cn(isEmbedded ? 'text-base' : 'text-xl', 'font-bold', side === 'no' ? 'text-rose-600' : 'text-slate-900')}>
            R$ {(market.no_price || (1 - market.yes_price)).toFixed(2)}
          </span>
          {!isEmbedded && (
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">prob.</span>
          )}
        </div>
      </button>
    </div>
  )

  const tradeContent = (
    <div className={cardOuterClass}>
      <div className={bodyClass}>
        {!hideSideSelector && sideSelector}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Valor a investir</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              placeholder="0,00"
              className="pl-10 h-12 text-lg font-semibold"
            />
          </div>
        </div>

        <div className={cn('flex gap-2', isEmbedded ? 'mb-4' : 'mb-6')}>
          {quickAmounts.map((qa) => (
            <button
              key={qa}
              onClick={() => setAmount(qa.toString())}
              className="flex-1 py-2 px-3 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              R${qa}
            </button>
          ))}
        </div>

        {amount && parseFloat(amount) > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Contratos</span>
              <span className="font-semibold text-slate-900">{units}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Preço por contrato</span>
              <span className="font-semibold text-slate-900">R$ {price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pagamento se acertar</span>
              <span className="font-semibold text-emerald-600">R$ {potentialPayout.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between">
              <span className="text-slate-600 font-medium">Ganho potencial</span>
              <span className="font-bold text-emerald-600">+R$ {potentialProfit.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Info className="w-4 h-4 text-slate-500" /> Saldo disponível
          </span>
          <span className="font-medium text-slate-900">R$ {userBalance.toFixed(2)}</span>
        </div>

        <Button
          onClick={handleTrade}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > userBalance || isLoading}
          className={cn(
            'w-full h-12 text-base font-semibold transition-all',
            side === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'
          )}
        >
          {isLoading ? 'Processando...' : `Comprar ${side === 'yes' ? 'SIM' : 'NÃO'}`}
        </Button>

        <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Cada contrato paga R$1,00 se você acertar o resultado; caso contrário, paga R$0,00. Você pode perder 100% do valor investido.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <RiskDisclosureModal
        open={showRiskModal}
        onAccept={handleAcceptRisk}
        onDecline={handleDeclineRisk}
        marketTitle={market.title}
      />

      <div className="space-y-4">
        {!isEmbedded && userId && !hasValidDisclosure && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">Termo de Ciência Obrigatório</p>
                <p className="text-xs text-amber-700">Antes de realizar sua primeira aposta, você precisará ler e aceitar o Termo de Ciência e Risco.</p>
              </div>
            </div>
          </div>
        )}

        {tradeContent}

        {showRiskAssistant && (
          <RiskAssistant market={market} userBalance={userBalance} side={side} />
        )}
      </div>
    </>
  )
}
