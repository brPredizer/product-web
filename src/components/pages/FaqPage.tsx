"use client";

import React from "react";
import Link from "next/link";
import { ROUTES } from "@/routes/pages";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CircleHelp } from "lucide-react";

type FaqGroup = {
  id: string;
  title: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
};

const faqGroups: FaqGroup[] = [
  {
    id: "operacao",
    title: "Operação de mercado",
    items: [
      {
        question: "O que o preço da posição significa na prática?",
        answer:
          "O preço representa a probabilidade implícita (aproximada) do resultado acontecer, considerando o que o mercado está precificando naquele momento. Ex.: R$ 0,62 sugere cerca de 62%.\n\nImportante: isso não é “verdade”, é consenso do mercado naquele instante. Notícias, volume e sentimento podem mudar o preço rapidamente.",
      },
      {
        question: "Qual a diferença entre posição SIM e posição NÃO?",
        answer:
          "SIM: você ganha R$ 1,00 por contrato se o evento acontecer.\nNÃO: você ganha R$ 1,00 por contrato se o evento NÃO acontecer.\n\nSeu custo de entrada é o preço atual do contrato. O seu lucro/prejuízo final depende do preço que você pagou e do resultado na resolução.",
      },
      {
        question: "Como calculo lucro e prejuízo (com exemplo)?",
        answer:
          "Regra simples:\n• Se você compra SIM por R$ 0,40 e o evento acontece, você recebe R$ 1,00. Lucro bruto ≈ R$ 1,00 − R$ 0,40 = R$ 0,60 por contrato (antes de taxas).\n• Se não acontece, seu contrato SIM vale R$ 0,00 na resolução (perda do valor investido naquele contrato).\n\nPara posição NÃO, a lógica inverte: você ganha se o evento não acontecer.",
      },
      {
        question: "Posso encerrar a posição antes da resolução?",
        answer:
          "Sim, desde que exista liquidez (ou seja, alguém do outro lado disposto a comprar/vender). Você pode vender sua posição para realizar lucro ou reduzir perdas.\n\nO preço de saída pode ser diferente do preço de entrada. Isso é normal: o mercado se move e a liquidez varia.",
      },
      {
        question: "O que é liquidez e por que ela importa?",
        answer:
          "Liquidez é a facilidade de entrar e sair de uma posição sem “machucar” o preço.\n\nEm mercados com pouca liquidez, pode ocorrer:\n• spreads maiores (diferença entre compra e venda)\n• execução parcial (ordem não é preenchida por completo)\n• variação maior no preço quando você tenta negociar",
      },
      {
        question: "O que são spread e slippage (e por que eu deveria ligar)?",
        answer:
          "• Spread: diferença entre o melhor preço de compra e o melhor preço de venda.\n• Slippage: quando sua ordem executa a um preço pior do que você esperava, geralmente por baixa liquidez ou movimento rápido.\n\nDica prática: se quiser mais controle, use ordens limitadas (quando disponível) e evite operar em momentos de alta volatilidade.",
      },
      {
        question: "Existe ordem limitada e ordem a mercado?",
        answer:
          "Quando disponível:\n• Ordem a mercado executa mais rápido, mas pode ter slippage.\n• Ordem limitada define o preço máximo (para comprar) ou mínimo (para vender), oferecendo mais controle.\n\nSe seu objetivo é previsibilidade, a ordem limitada tende a ser a escolha mais conservadora.",
      },
    ],
  },
  {
    id: "risco",
    title: "Risco e responsabilidade",
    items: [
      {
        question: "Posso perder todo o valor investido em uma posição?",
        answer:
          "Sim. A perda pode chegar a 100% do valor investido em um contrato, dependendo do lado que você escolheu e do resultado final.\n\nPor isso, a regra de ouro é: só opere com valores que não comprometem suas despesas essenciais.",
      },
      {
        question: "A plataforma lucra quando eu perco?",
        answer:
          "Não. A receita da plataforma vem de taxas operacionais (ex.: negociação, depósito/saque, ou outras taxas descritas na Política de taxas).\n\nSeu resultado (ganho/perda) depende do mercado e da sua decisão — não de uma plataforma jogando contra você.",
      },
      {
        question: "O mercado é investimento garantido?",
        answer:
          "Não. Mercados de probabilidade envolvem risco e variabilidade. Mesmo uma análise bem feita pode dar errado, porque eventos reais podem surpreender.\n\nSe você procura algo com previsibilidade, este tipo de produto pode não ser adequado ao seu perfil.",
      },
      {
        question: "Como operar com mais segurança (sem virar refém da emoção)?",
        answer:
          "Três hábitos tradicionais que nunca falham:\n1) Defina limite por posição (quanto você aceita perder)\n2) Defina limite diário/semanal (quando parar)\n3) Evite “recuperar prejuízo” no impulso\n\nDisciplina é chata… mas é exatamente por isso que funciona.",
      },
      {
        question: "Posso usar alavancagem?",
        answer:
          "Se a plataforma não oferecer explicitamente, não. E mesmo quando existe, alavancagem aumenta risco e acelera perdas.\n\nA abordagem mais prudente é operar sem alavancagem e com tamanhos menores, especialmente no início.",
      },
      {
        question: "Existe risco de manipulação de mercado?",
        answer:
          "Em qualquer ambiente com baixa liquidez pode existir tentativa de influenciar preço no curto prazo.\n\nMitigação prática:\n• observe liquidez/spread antes de entrar\n• evite operar em mercados pouco negociados se você precisar de saída rápida\n• prefira mercados com regras e fontes de resolução bem definidas",
      },
    ],
  },
  {
    id: "conta",
    title: "Conta, taxas e regras",
    items: [
      {
        question: "Quais taxas posso pagar ao usar a plataforma?",
        answer:
          "As taxas podem envolver negociação (compra/venda), depósito e saque, dependendo da política vigente.\n\nVocê sempre encontra os valores atualizados na Política de taxas. Transparência aqui é regra — não surpresa no extrato.",
      },
      {
        question: "Quando as taxas são cobradas?",
        answer:
          "Depende do tipo de taxa:\n• taxas de depósito/saque: no momento da operação\n• taxas de negociação: na execução da ordem (compra/venda)\n\nRecomendação: antes de operar, confira a política e simule mentalmente o custo total. O básico bem feito evita arrependimento depois.",
      },
      {
        question: "Como funciona a resolução de um mercado?",
        answer:
          "Cada mercado possui critérios e fonte(s) de verificação definidos antes da abertura.\n\nNa data/condição de encerramento, o mercado é resolvido seguindo exatamente a regra publicada. A resolução não é “opinião”: é a aplicação objetiva do critério anunciado.",
      },
      {
        question: "O que acontece se a fonte oficial mudar, cair ou ficar indisponível?",
        answer:
          "O mercado segue a regra publicada, que pode prever fontes alternativas, janela de verificação ou critérios de contingência.\n\nQuando aplicável, a plataforma utiliza a melhor evidência disponível conforme as regras de resolução daquele mercado.",
      },
      {
        question: "Existe contestação ou disputa de resolução?",
        answer:
          "Quando previsto nas regras, pode existir um processo de revisão com base em evidências e na própria regra publicada.\n\nPonto-chave: a disputa avalia o cumprimento do critério, não “quem estava torcendo por qual lado”.",
      },
      {
        question: "Preciso verificar identidade (KYC) para usar?",
        answer:
          "Pode ser necessário em algumas operações (principalmente saques, limites maiores e medidas de segurança/antifraude), conforme políticas internas e exigências de compliance.\n\nSe houver exigência, a plataforma informará claramente no fluxo.",
      },
      {
        question: "Como a plataforma protege minha conta?",
        answer:
          "Boas práticas típicas incluem criptografia, controles de sessão e camadas de segurança.\n\nO que você pode fazer do seu lado (e isso é o que mais funciona):\n• use senha forte e única\n• evite compartilhar código/links\n• desconfie de mensagens pedindo dados sensíveis",
      },
      {
        question: "Onde encontro Termos, Privacidade, Aviso de risco e Regras de resolução?",
        answer:
          "Esses documentos ficam em páginas públicas. Você pode acessar pelos links abaixo.\n\nDica de gente antiga: leia pelo menos o Aviso de risco e as Regras de resolução antes da primeira operação. Dá menos emoção, mas dá mais paz.",
      },
    ],
  },
];

export default function FaqPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <CircleHelp className="mr-1 h-3.5 w-3.5" />
            FAQ oficial
          </Badge>
          <h1 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
            Perguntas frequentes
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-base">
            Respostas claras sobre operação, risco, taxas, liquidez e critérios de
            resolução. Sem enrolação — só o que importa para operar com consciência.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          {faqGroups.map((group, groupIndex) => (
            <article
              key={group.id}
              className={
                groupIndex > 0 ? "mt-5 border-t border-slate-200 pt-5" : ""
              }
            >
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {group.title}
              </h2>
              <Accordion type="single" collapsible className="mt-3 space-y-1.5">
                {group.items.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`${group.id}-${index}`}
                    className="rounded-lg border border-slate-200 px-3"
                  >
                    <AccordionTrigger className="py-3 text-left text-sm font-semibold text-slate-900 hover:no-underline sm:text-base">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 text-sm leading-relaxed text-slate-700 sm:text-base whitespace-pre-line">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </article>
          ))}

          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link
                href={ROUTES.learn}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:text-base"
              >
                <ArrowLeft className="h-4 w-4" />
                Como funciona
              </Link>
              <div className="sm:text-right">
                <Link
                  href={ROUTES.fees}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:text-base"
                >
                  Política de taxas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
