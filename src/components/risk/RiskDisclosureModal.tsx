import React, { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShieldAlert, Loader2, DownloadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onAccept: () => void
  onDecline: () => void
  marketTitle?: string
  termText?: string
  termVersion?: string
  isLoadingTerm?: boolean
  loadError?: string | null
  onRetryFetch?: () => void
  isSubmitting?: boolean
  acceptanceInfo?: { acceptedAt?: string; termVersion?: string | null }
  onDownload?: () => void
  isDownloading?: boolean
}

export default function RiskDisclosureModal({
  open,
  onAccept,
  onDecline,
  marketTitle,
  termText,
  termVersion,
  isLoadingTerm,
  loadError,
  onRetryFetch,
  isSubmitting,
  acceptanceInfo,
  onDownload,
  isDownloading,
}: Props) {
  const [acceptances, setAcceptances] = useState({
    loss100: false,
    fees: false,
    notInvestment: false,
    emotional: false,
    terms: false,
  })

  const [confirmAnswer, setConfirmAnswer] = useState('')
  const [blockedAttempt, setBlockedAttempt] = useState<string | null>(null)

  const allAccepted = Object.values(acceptances).every(Boolean)

  const requiredPhrase = 'posso perder 100% do valor investido'
  const normalizedAnswer = useMemo(
    () => confirmAnswer.trim().toLowerCase().replace(/\s+/g, ' '),
    [confirmAnswer]
  )
  const correctAnswer = normalizedAnswer === requiredPhrase
  const isAcceptDisabled =
    !allAccepted ||
    !correctAnswer ||
    !!isSubmitting ||
    !!isLoadingTerm ||
    !!loadError

  const acceptanceBadge = acceptanceInfo?.acceptedAt
    ? (() => {
        const parsed = new Date(acceptanceInfo.acceptedAt as string)
        if (Number.isNaN(parsed.getTime())) return null
        return `Aceito em ${parsed.toLocaleString('pt-BR')}`
      })()
    : null

  const handleAccept = () => {
    if (!isAcceptDisabled) onAccept()
  }

  const setAcceptance =
    (key: keyof typeof acceptances) =>
    (checked: boolean | 'indeterminate') =>
      setAcceptances((prev) => ({ ...prev, [key]: !!checked }))

  // Anti copy/paste (não é 100% “inescapável”, mas bloqueia o atalho padrão)
  const block = (msg: string) => (e: any) => {
    e.preventDefault?.()
    setBlockedAttempt(msg)
    window.setTimeout(() => setBlockedAttempt(null), 1800)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault()
      setBlockedAttempt('Colagem bloqueada. Digite a frase manualmente.')
      window.setTimeout(() => setBlockedAttempt(null), 1800)
    }
  }

  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const ne = (e.nativeEvent as any) || {}
    const inputType: string = ne.inputType || ''
    if (
      inputType === 'insertFromPaste' ||
      inputType === 'insertFromDrop' ||
      inputType === 'insertFromYank'
    ) {
      ne.preventDefault?.()
      setBlockedAttempt('Entrada por colagem ou arraste foi bloqueada.')
      window.setTimeout(() => setBlockedAttempt(null), 1800)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen?: boolean) => {
        if (!isOpen) onDecline()
      }}
    >
      {/* ✅ Layout: flex-col + overflow-hidden pra NÃO quebrar botões */}
      <DialogContent className="w-[min(96vw,980px)] max-w-none max-h-[92vh] flex flex-col overflow-hidden p-0">
        {/* HEADER FIXO */}
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl">Termo de Ciência e Risco</DialogTitle>
                <DialogDescription className="truncate">
                  {marketTitle
                    ? `Mercado: ${marketTitle}`
                    : 'Leia com atenção antes de prosseguir'}
                </DialogDescription>
                {(termVersion || acceptanceBadge) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {acceptanceBadge && (
                      <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                        {acceptanceBadge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* CORPO ROLÁVEL */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-[58vh]">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {/* TEXTO OFICIAL DO BACKEND */}
              <div className="bg-white border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  {onDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDownload}
                      disabled={isDownloading}
                      className="border-slate-200"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <DownloadCloud className="w-4 h-4 mr-2" />
                      )}
                      Baixar PDF
                    </Button>
                  )}
                </div>

                {isLoadingTerm ? (
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-11/12" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-9/12" />
                  </div>
                ) : loadError ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3">
                    <p className="font-medium">Não conseguimos carregar o termo oficial.</p>
                    <p className="text-xs mb-2">{loadError}</p>
                    {onRetryFetch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetryFetch}
                        className="px-0 text-amber-800 hover:text-amber-900"
                      >
                        Tentar novamente
                      </Button>
                    )}
                  </div>
                ) : termText ? (
                  <ContractRenderer text={termText} />
                ) : (
                  <p className="text-sm text-slate-600">
                    O texto oficial do termo não está disponível no momento.
                  </p>
                )}
              </div>

              {/* CHECKBOXES */}
              <div className="space-y-3 pt-4 border-t">
                <CheckLine
                  checked={acceptances.loss100}
                  onCheckedChange={setAcceptance('loss100')}
                  label={
                    <>
                      Entendo que <strong>posso perder 100%</strong> do valor desta posição
                    </>
                  }
                />
                <CheckLine
                  checked={acceptances.fees}
                  onCheckedChange={setAcceptance('fees')}
                  label={
                    <>
                      Entendo que existem <strong>taxas vigentes da plataforma</strong> e que
                      elas afetam meu resultado
                    </>
                  }
                />
                <CheckLine
                  checked={acceptances.notInvestment}
                  onCheckedChange={setAcceptance('notInvestment')}
                  label={
                    <>
                      Confirmo que vou operar apenas com <strong>dinheiro que posso perder</strong>
                    </>
                  }
                />
                <CheckLine
                  checked={acceptances.emotional}
                  onCheckedChange={setAcceptance('emotional')}
                  label={
                    <>
                      Reconheço <strong>riscos emocionais</strong> e sinais de compulsão, e vou pausar
                      se perder o controle
                    </>
                  }
                />
                <CheckLine
                  checked={acceptances.terms}
                  onCheckedChange={setAcceptance('terms')}
                  label={
                    <>
                      Li o resumo e o termo oficial, e aceito prosseguir por minha conta e risco
                    </>
                  }
                />
              </div>

              {/* CONFIRMAÇÃO ANTI-COLA */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  Frase obrigatória para liberar o aceite:
                </p>
                <p className="text-sm text-blue-800">
                  Digite exatamente:{' '}
                  <strong>&quot;posso perder 100% do valor investido&quot;</strong>
                </p>

                <Input
                  placeholder="Digite a frase para liberar o botão"
                  value={confirmAnswer}
                  onChange={(e) => setConfirmAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBeforeInput={handleBeforeInput}
                  onPaste={block}
                  onDrop={block}
                  onCopy={block}
                  onCut={block}
                  onContextMenu={block}
                  autoComplete="off"
                  spellCheck={false}
                  className={cn('bg-white', correctAnswer && 'border-emerald-500')}
                />

                {blockedAttempt && <p className="text-xs text-rose-600">{blockedAttempt}</p>}

                {confirmAnswer && !correctAnswer && !blockedAttempt && (
                  <p className="text-xs text-rose-600">
                    A frase precisa estar idêntica para liberar o botão.
                  </p>
                )}
              </div>

              {/* Espaço final pra não “grudar” no rodapé */}
              <div className="h-2" />
            </div>
          </ScrollArea>
        </div>

        {/* RODAPÉ FIXO (botões não quebram mais) */}
        <div className="p-6 pt-4 border-t bg-white">
          <div className="flex flex-row sm:flex-row gap-3 sm:gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-1/2 h-11"
              onClick={onDecline}
            >
              Cancelar e definir limites antes
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isAcceptDisabled}
              className="w-full sm:w-1/2 bg-emerald-600 hover:bg-emerald-700 h-11"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando aceite...
                </span>
              ) : (
                'Aceito e desejo prosseguir'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CheckLine({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean | 'indeterminate') => void
  label: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-1" />
      <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-relaxed">
        {label}
      </span>
    </label>
  )
}

/* ===========================
   PDF-LIKE CONTRACT RENDERER
   =========================== */

function sanitizeContractText(input: string) {
  if (!input) return ''

  let s = input

  // remove chars invisíveis (igual sua ideia no C#)
  s = s.replace(/\u00AD/g, '') // soft hyphen
  s = s.replace(/\u200B/g, '') // zero width space
  s = s.replace(/\u200C/g, '')
  s = s.replace(/\u200D/g, '')
  s = s.replace(/\uFEFF/g, '')
  s = s.replace(/\u00A0/g, ' ') // nbsp

  // garante espaço após "1)" quando vem colado
  s = s.replace(/(?<=\d\))(?=\S)/g, ' ')

  // normaliza espaços/tabs
  s = s.replace(/[ \t]+/g, ' ')

  return s.trim()
}

type ContractLine =
  | { kind: 'title'; text: string }
  | { kind: 'section'; n: string; t: string }
  | { kind: 'sub'; n: string; t: string }
  | { kind: 'item'; n: string; t: string }
  | { kind: 'p'; text: string }

function parseContract(text: string): ContractLine[] {
  const clean = sanitizeContractText(text)

  const lines = clean
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)

  const reTitle = /^CONTRATO\b/i
  const reSection = /^(?<n>\d+)\)\s*(?<t>.+)$/
  const reSub = /^(?<n>\d+\.\d+)\)\s*(?<t>.+)$/
  const reItem = /^(?<n>\d+\.\d+\.\d+)\)\s*(?<t>.+)$/

  const out: ContractLine[] = []

  for (const line of lines) {
    if (reTitle.test(line)) {
      out.push({ kind: 'title', text: line })
      continue
    }

    const mSec = line.match(reSection)
    if (mSec?.groups?.n && mSec?.groups?.t) {
      out.push({ kind: 'section', n: mSec.groups.n, t: mSec.groups.t })
      continue
    }

    const mItem = line.match(reItem)
    if (mItem?.groups?.n && mItem?.groups?.t) {
      out.push({ kind: 'item', n: mItem.groups.n, t: mItem.groups.t })
      continue
    }

    const mSub = line.match(reSub)
    if (mSub?.groups?.n && mSub?.groups?.t) {
      out.push({ kind: 'sub', n: mSub.groups.n, t: mSub.groups.t })
      continue
    }

    out.push({ kind: 'p', text: line })
  }

  return out
}

function ContractRenderer({ text }: { text: string }) {
  const blocks = useMemo(() => parseContract(text), [text])

  return (
    <div className="text-slate-900" style={{ fontFamily: '"Arial", sans-serif' }}>
      {/* “papel” */}
      <div className="px-6 py-6 ">
        {/* tipografia de documento */}
        <div>
          {blocks.map((b, idx) => {
            if (b.kind === 'title') {
              return (
                <div key={idx} className="text-center font-bold text-[16px] tracking-wide mb-4">
                  {b.text}
                </div>
              )
            }

            if (b.kind === 'section') {
              return (
                <div key={idx} className="mt-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 text-right font-bold text-[14px] leading-6">
                      {b.n})
                    </div>
                    <div className="flex-1 font-bold text-[14px] leading-6">
                      {b.t}
                    </div>
                  </div>
                </div>
              )
            }

            if (b.kind === 'sub') {
              return (
                <div key={idx} className="mt-2 pl-2">
                  <div className="flex items-start gap-3">
                    <div className="w-12 text-right font-semibold text-[13px] leading-6">
                      {b.n})
                    </div>
                    <div
                      className="flex-1 text-[13.5px] leading-6 text-slate-800"
                      style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                    >
                      {b.t}
                    </div>
                  </div>
                </div>
              )
            }

            if (b.kind === 'item') {
              return (
                <div key={idx} className="mt-2 pl-5">
                  <div className="flex items-start gap-3">
                    <div className="w-14 text-right font-semibold text-[13px] leading-6">
                      {b.n})
                    </div>
                    <div
                      className="flex-1 text-[13.5px] leading-6 text-slate-800"
                      style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                    >
                      {b.t}
                    </div>
                  </div>
                </div>
              )
            }

            // paragraph
            return (
              <div
                key={idx}
                className="mt-2 text-[13.5px] leading-6 text-slate-800"
                style={{ textAlign: 'justify', textJustify: 'inter-word' }}
              >
                {b.text}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
