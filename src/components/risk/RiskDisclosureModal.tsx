import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, ShieldAlert, Heart, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onAccept: () => void
  onDecline: () => void
  marketTitle?: string
}

export default function RiskDisclosureModal({ open, onAccept, onDecline }: Props) {
  const [acceptances, setAcceptances] = useState({
    loss100: false,
    fees: false,
    notInvestment: false,
    emotional: false,
  })
  const [confirmAnswer, setConfirmAnswer] = useState('')
  const [showFull, setShowFull] = useState(false)

  const allAccepted = Object.values(acceptances).every((v) => v)
  const lower = confirmAnswer.toLowerCase()
  const correctAnswer = lower.includes('100') || confirmAnswer === '100%'

  const handleAccept = () => {
    if (allAccepted && correctAnswer) {
      onAccept()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen?: boolean) => { if (!isOpen) onDecline() }}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Termo de Ciência e Risco</DialogTitle>
              <DialogDescription>Leia com atenção antes de prosseguir</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-2">Atenção: Risco de Perda Total</p>
                  <p className="text-sm text-amber-800">
                    Esta operação é <strong>especulativa</strong>. Você pode <strong>perder 100%</strong> do valor que
                    colocar nesta aposta. O valor alocado pode virar R$ 0,00.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Section
                icon={TrendingDown}
                iconColor="text-rose-600"
                title="(1) Risco de perda total"
                description="Eu entendo que esta operação é especulativa e que posso perder 100% do valor que eu colocar nesta aposta (o valor alocado pode virar R$ 0,00)."
              />

              <Section
                icon={AlertTriangle}
                iconColor="text-amber-600"
                title="(2) Taxas e custos"
                description="Eu entendo que o PredictX cobra taxas (taxa de depósito 7% e taxa de saque 10%) e que taxas reduzem ganhos e aumentam perdas na prática."
              />

              <Section
                icon={ShieldAlert}
                iconColor="text-blue-600"
                title="(3) Não é poupança nem renda garantida"
                description="Eu entendo que isto não é investimento garantido, não é recomendação financeira e não existe promessa de retorno. Devo operar apenas com valores que posso perder."
              />

              <Section
                icon={Heart}
                iconColor="text-purple-600"
                title="(4) Responsabilidade emocional e risco de compulsão"
                description="Eu reconheço que apostas podem causar danos emocionais e comportamentais, especialmente em situações de vulnerabilidade (ex.: estresse financeiro, luto, ansiedade). Fui alertado sobre sinais de possível transtorno do jogo: dificuldade de controlar frequência/intensidade, priorizar apostar acima de outras áreas da vida, continuar apesar de prejuízos."
              />
            </div>

            {showFull && (
              <div className="space-y-4 pt-4 border-t">
                <Section
                  icon={ShieldAlert}
                  iconColor="text-emerald-600"
                  title="(5) Ferramentas de proteção"
                  description="Eu sei que devo usar ferramentas de proteção, como: limite de depósitos, limite de perdas, pausas (cooldown) e autoexclusão. Posso configurá-las no meu perfil."
                />

                <Section
                  icon={Heart}
                  iconColor="text-rose-600"
                  title="(6) Ajuda e suporte"
                  description="Se eu perceber perda de controle ou sofrimento, buscarei ajuda. O SUS/RAPS (CAPS e rede de saúde mental) é um caminho. O PredictX facilita autoexclusão caso necessário."
                />

                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600">
                    <strong>Observação:</strong> Este termo segue princípios de divulgação de risco semelhantes aos usados em trading/derivativos e inclui avisos sobre danos relacionados a apostas. Versão do documento: 1.0 | Última atualização: Dezembro 2025
                  </p>
                </div>
              </div>
            )}

            {!showFull && (
              <button onClick={() => setShowFull(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                + Ler termo completo
              </button>
            )}

            <div className="space-y-3 pt-4 border-t">
              <label className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={acceptances.loss100}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setAcceptances((prev) => ({ ...prev, loss100: !!checked }))}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  <strong>Posso perder 100%</strong> do valor alocado nesta aposta
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={acceptances.fees}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setAcceptances((prev) => ({ ...prev, fees: !!checked }))}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  Entendo as <strong>taxas e custos</strong> (7% depósito, 10% saque)
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={acceptances.notInvestment}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setAcceptances((prev) => ({ ...prev, notInvestment: !!checked }))}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  Estou apostando com <strong>dinheiro que posso perder</strong>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={acceptances.emotional}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setAcceptances((prev) => ({ ...prev, emotional: !!checked }))}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  Entendo os <strong>riscos emocionais</strong> e sinais de compulsão
                </span>
              </label>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-blue-900">Pergunta de confirmação (anti-clique automático):</p>
              <p className="text-sm text-blue-800">Se eu perder, posso perder <strong>quanto</strong> do valor desta aposta?</p>
              <Input
                placeholder="Digite a resposta..."
                value={confirmAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmAnswer(e.target.value)}
                className={cn('bg-white', correctAnswer && 'border-emerald-500')}
              />
              {confirmAnswer && !correctAnswer && (
                <p className="text-xs text-rose-600">Dica: A resposta correta é "100%" ou "100"</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button onClick={handleAccept} disabled={!allAccepted || !correctAnswer} className="w-full bg-emerald-600 hover:bg-emerald-700">
            ✓ Aceito e desejo prosseguir
          </Button>
          <Button variant="outline" className="w-full" onClick={onDecline}>
            Cancelar e definir limites antes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Section({ icon: Icon, iconColor, title, description }: { icon: any; iconColor?: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn('w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0', iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}
