"use client"
import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Slider } from "@/components/ui/slider";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import RiskAssistant from './RiskAssistant'
import RiskDisclosureModal from '../risk/RiskDisclosureModal'
import {
  riskTermsClient,
  type RiskAcceptance,
  type RiskTermResponse,
  isAcceptanceMissingError,
} from '@/app/api/terms/riskTermsClient'
import { toast } from 'sonner'

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
  const [amountCents, setAmountCents] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false)
  const [pendingTrade, setPendingTrade] = useState<any>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false)
  const rawMarketId = market?.id ?? market?.marketId ?? market?.market_id ?? null
  const marketId = rawMarketId ? String(rawMarketId) : null
  const formatBrlAmount = (value: number) =>
    (Number.isFinite(value) ? value : 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  const parseAmountMaskToCents = (value: string) => value.replace(/\D/g, '')

  const {
    data: acceptance,
    error: acceptanceError,
    refetch: refetchAcceptance,
  } = useQuery<RiskAcceptance | null>({
    queryKey: ['risk-acceptance', userId, marketId],
    queryFn: () => riskTermsClient.getAcceptance({ marketId }),
    enabled: !!userId && !!marketId,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: riskTerm,
    isFetching: isTermLoading,
    error: riskTermError,
    refetch: refetchRiskTerm,
  } = useQuery<RiskTermResponse>({
    queryKey: ['risk-term', marketId],
    queryFn: () => riskTermsClient.getRiskTerms({ marketId }),
    enabled: !!showRiskModal && !!marketId,
  })
  const riskTermErrorMessage = riskTermError instanceof Error ? riskTermError.message : null

  const acceptRiskMutation = useMutation({
    mutationFn: async () => {
      if (!marketId) throw new Error('marketId é obrigatório para registrar aceite.')
      const snapshot = riskTerm?.text ?? ''
      let termHash: string | null = null

      if (snapshot && typeof window !== 'undefined' && window.crypto?.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(snapshot)
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
        termHash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      }

      return riskTermsClient.acceptRiskTerms({
        marketId,
        termVersion: riskTerm?.termVersion ?? undefined,
        termSnapshot: snapshot || undefined,
        termHash: termHash ?? undefined,
      })
    },
    onSuccess: async () => {
      await refetchAcceptance()
      setShowRiskModal(false)
      toast.success('Aceite registrado.')

      if (pendingTrade) {
        executeTrade(pendingTrade)
      }
      setPendingTrade(null)
    },
    onError: (error: any) => {
      const message = error?.message || 'Não foi possível registrar o aceite.'
      toast.error(message)
    },
  })

  const hasAcceptedRisk = Boolean(acceptance?.id)
  const acceptanceDate = acceptance?.acceptedAt || null
  const acceptanceVersion = acceptance?.termVersion ?? riskTerm?.termVersion ?? null
  const acceptanceDateLabel = (() => {
    if (!acceptanceDate) return null
    const parsed = new Date(acceptanceDate)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toLocaleString('pt-BR')
  })()

  const yesPriceNum = Number(market?.yes_price ?? 0.5)
  const noPriceNum = Number(market?.no_price ?? (1 - yesPriceNum))
  const price = side === 'yes' ? yesPriceNum : noPriceNum
  const amountValue = amountCents ? Number(amountCents) / 100 : 0
  const amountDisplayValue = amountCents ? formatBrlAmount(amountValue) : ''
  const units = amountValue > 0 && price > 0 ? Math.floor(amountValue / price) : 0
  const potentialPayout = units * 1
  const potentialProfit = potentialPayout - amountValue

  const resolveAcceptanceStatus = async (): Promise<
    { state: 'accepted' | 'missing' | 'error'; errorMessage?: string }
  > => {
    if (hasAcceptedRisk) return { state: 'accepted' }
    if (acceptance === null) return { state: 'missing' }

    if (acceptanceError) {
      return {
        state: isAcceptanceMissingError(acceptanceError) ? 'missing' : 'error',
        errorMessage: (acceptanceError as any)?.message,
      }
    }

    try {
      const result = await refetchAcceptance()
      const latest = result?.data

      if (latest && (latest as RiskAcceptance)?.id) return { state: 'accepted' }
      if (latest === null) return { state: 'missing' }

      if (result?.error) {
        return {
          state: isAcceptanceMissingError(result.error) ? 'missing' : 'error',
          errorMessage: (result.error as any)?.message,
        }
      }
    } catch (err: any) {
      return {
        state: isAcceptanceMissingError(err) ? 'missing' : 'error',
        errorMessage: err?.message,
      }
    }

    return { state: 'missing' }
  }

  const handleTrade = async () => {
    if (amountValue <= 0) return
    if (!marketId) {
      toast.error('Não foi possível identificar o mercado.')
      return
    }

    const tradeData = {
      side,
      amount: amountValue,
      contracts: units,
      price,
    }

    const acceptanceStatus = await resolveAcceptanceStatus()

    if (acceptanceStatus.state === 'accepted') {
      executeTrade(tradeData)
      return
    }

    if (acceptanceStatus.state === 'missing') {
      setPendingTrade(tradeData)
      setShowRiskModal(true)
      return
    }

    toast.error(
      acceptanceStatus.errorMessage ||
        'Não foi possível verificar o termo de risco. Tente novamente.'
    )
  }
  const executeTrade = async (tradeData: any) => {
    setIsLoading(true)
    try {
      await onTrade(tradeData)
      setAmountCents('')
      setPendingTrade(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRisk = async () => {
    try {
      await acceptRiskMutation.mutateAsync()
    } catch (error) {
      console.error('Error accepting risk disclosure:', error)
    }
  }

  const handleDeclineRisk = () => {
    setShowRiskModal(false)
    setPendingTrade(null)
  }

  const handleDownloadAcceptance = async () => {
    if (!hasAcceptedRisk) return
    setIsDownloadingPdf(true)
    try {
      const { blob, filename } = await riskTermsClient.downloadAcceptance({
        marketId,
        acceptedAt: acceptance?.acceptedAt ?? null,
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'termo-risco.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      if (error?.status === 404) {
        toast.error('Nenhum comprovante disponível para este mercado.')
      } else {
        const message = error?.message || 'Não foi possível baixar o comprovante.'
        toast.error(message)
      }
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const quickAmounts = [10, 50, 100, 500]
  const tradeButtonDisabled =
    amountValue <= 0 || amountValue > userBalance || isLoading
  const tradeButtonLabel = isLoading
    ? 'Processando...'
    : `Comprar ${side === 'yes' ? 'SIM' : 'NÃO'}`

  const cardOuterClass = isEmbedded ? '' : 'bg-white'
  const bodyClass = isEmbedded ? '' : 'p-0'

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
          {!isEmbedded && <span className="text-xs text-slate-500">{Math.round(yesPriceNum * 100)}%</span>}
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className={cn(isEmbedded ? 'text-base' : 'text-xl', 'font-bold', side === 'yes' ? 'text-emerald-600' : 'text-slate-900')}>
            R$ {formatBrlAmount(yesPriceNum)}
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
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span className={cn('text-sm font-semibold', side === 'no' ? 'text-rose-600' : 'text-slate-700')}>NÃO</span>
          </span>
          {!isEmbedded && <span className="text-xs text-slate-500">{Math.round(noPriceNum * 100)}%</span>}
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className={cn(isEmbedded ? 'text-base' : 'text-xl', 'font-bold', side === 'no' ? 'text-rose-600' : 'text-slate-900')}>
            R$ {formatBrlAmount(noPriceNum)}
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
              type="text"
              inputMode="numeric"
              value={amountDisplayValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountCents(parseAmountMaskToCents(e.target.value))}
              placeholder="0,00"
              className="pl-10 h-12 text-lg font-semibold"
            />
          </div>
        </div>

        <div className={cn('flex gap-2', isEmbedded ? 'mb-4' : 'mb-6')}>
          {quickAmounts.map((qa) => (
            <button
              key={qa}
              onClick={() => setAmountCents(String(qa * 100))}
              className="flex-1 py-2 px-3 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              R${qa}
            </button>
          ))}
        </div>

        {amountValue > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Contratos</span>
              <span className="font-semibold text-slate-900">{units.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Preço por contrato</span>
              <span className="font-semibold text-slate-900">R$ {formatBrlAmount(Number(price))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pagamento se acertar</span>
              <span className="font-semibold text-emerald-600">R$ {formatBrlAmount(potentialPayout)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between">
              <span className="text-slate-600 font-medium">Ganho potencial</span>
              <span className="font-bold text-emerald-600">+R$ {formatBrlAmount(potentialProfit)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Info className="w-4 h-4 text-slate-500" /> Saldo disponível
          </span>
          <span className="font-medium text-slate-900">R$ {formatBrlAmount(userBalance)}</span>
        </div>

        <Button
          onClick={handleTrade}
          disabled={tradeButtonDisabled}
          className={cn(
            'w-full h-12 text-base font-semibold transition-all',
            side === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'
          )}
        >
          {tradeButtonLabel}
        </Button>

        <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            O lado vencedor liquida em R $1,00 por contrato e o lado perdedor em R$0,00. Em caso de perda, você pode perder 100% do valor investido.
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
        termText={riskTerm?.text}
        termVersion={riskTerm?.termVersion}
        isLoadingTerm={isTermLoading}
        loadError={riskTermErrorMessage}
        onRetryFetch={refetchRiskTerm}
        isSubmitting={acceptRiskMutation.isPending}
        acceptanceInfo={
          hasAcceptedRisk
            ? {
                acceptedAt: acceptanceDate ?? undefined,
                termVersion: acceptanceVersion ?? undefined,
              }
            : undefined
        }
        onDownload={hasAcceptedRisk ? handleDownloadAcceptance : undefined}
        isDownloading={isDownloadingPdf}
      />

      <div className="space-y-4">
        {tradeContent}

        {showRiskAssistant && (
          <RiskAssistant market={market} userBalance={userBalance} side={side} />
        )}
      </div>
    </>
  )
}
