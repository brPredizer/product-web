"use client";

import React from "react";
import Link from "next/link";
import { createPageUrl } from "@/routes";
import { ROUTES } from "@/routes/pages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  CircleHelp,
  ListChecks,
  ShieldCheck,
  Target,
} from "lucide-react";

type ConceptItem = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  summary: string;
  details: string;
};

type StepItem = {
  step: string;
  title: string;
  description: string;
  linkLabel: string;
  linkHref: string;
};

const anchors = [
  { id: "conceitos", label: "Conceitos" },
  { id: "exemplo", label: "Exemplo" },
  { id: "passo-a-passo", label: "Passo a passo" },
  { id: "risco", label: "Risco" },
  { id: "faq", label: "FAQ" },
];

const concepts: ConceptItem[] = [
  {
    icon: Target,
    title: "Mercado preditivo",
    summary:
      "É um mercado em que você compra ou vende posição sobre um evento futuro.",
    details:
      "O preço muda com novas informações e com o fluxo de compra e venda dos participantes.",
  },
  {
    icon: ShieldCheck,
    title: "SIM/NÃO",
    summary:
      "Cada mercado tem dois lados: SIM/NÃO. O lado vencedor paga R$ 1,00 por contrato na resolução.",
    details:
      "Se o evento acontece, SIM vence. Se o evento não acontece, NÃO vence.",
  },
  {
    icon: CircleDollarSign,
    title: "Preço = probabilidade",
    summary:
      "O preço funciona como probabilidade implícita do mercado. R$ 0,60 indica algo perto de 60%.",
    details:
      "Se você acha que a chance real é diferente, pode abrir posição conforme sua análise.",
  },
];

const steps: StepItem[] = [
  {
    step: "01",
    title: "Escolha um mercado",
    description: "Escolha um mercado que você entende e leia a regra de resolução.",
    linkLabel: "Ver mercados",
    linkHref: createPageUrl("Explore"),
  },
  {
    step: "02",
    title: "Leia a probabilidade",
    description: "Compare o preço atual com a sua visão de probabilidade.",
    linkLabel: "Como ler as probabilidades",
    linkHref: "#conceitos",
  },
  {
    step: "03",
    title: "Monte sua posição",
    description: "Abra posição em SIM ou NÃO com valor compatível com seu risco.",
    linkLabel: "Como comprar/vender",
    linkHref: createPageUrl("Explore"),
  },
  {
    step: "04",
    title: "Acompanhe a resolução",
    description: "Acompanhe até a resolução oficial e o crédito da posição vencedora.",
    linkLabel: "Como funciona a resolução",
    linkHref: ROUTES.resolutionRules,
  },
];

const faqItems: Array<{ question: string; answer: React.ReactNode }> = [
  {
    question: "Isso é aposta ou mercado?",
    answer:
      "É um mercado de previsão com negociação entre participantes, não uma aposta contra a casa. O preço é público e muda com oferta e demanda.",
  },
  {
    question: "Posso perder tudo?",
    answer:
      "Sim. Se sua posição perder na resolução, você pode perder todo o valor investido.",
  },
  {
    question: "Posso encerrar antes do resultado?",
    answer:
      "Você pode encerrar se houver liquidez disponível para negociar a saída antes da resolução.",
  },
  {
    question: "Como a plataforma ganha dinheiro?",
    answer: (
      <>
        A receita da plataforma vem de taxas operacionais. Consulte a{" "}
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={ROUTES.fees}>
          Política de taxas
        </Link>{" "}
        para ver os valores vigentes.
      </>
    ),
  },
  {
    question: "Como funciona a resolução?",
    answer:
      "A resolução usa critérios e fonte publicados antes da abertura do mercado.",
  },
  {
    question: "Qual é o mínimo para começar?",
    answer:
      "Você pode começar com valor baixo. O ideal é iniciar pequeno até dominar a dinâmica de posição e risco.",
  },
];

export default function Learn(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-900 to-slate-800 py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Badge className="mb-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <CircleHelp className="mr-1 h-3.5 w-3.5" />
            Guia rápido
          </Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">Como negociar previsões na Predizer</h1>
          <p className="mt-3 max-w-3xl text-slate-200">
            Contratos SIM/NÃO, preço como probabilidade e impacto financeiro em linguagem direta.
          </p>
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Em 20 segundos</p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-100 sm:grid-cols-3">
              <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">SIM paga R$ 1,00 se o evento ocorrer.</li>
              <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">NÃO paga R$ 1,00 se o evento não ocorrer.</li>
              <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">O preço representa a probabilidade implícita.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <nav aria-label="Sumário da página" className="overflow-x-auto">
            <ul className="flex min-w-max items-center justify-center gap-6 py-3 text-sm">
              {anchors.map((anchor) => (
                <li key={anchor.id}>
                  <a
                    href={`#${anchor.id}`}
                    className="font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    {anchor.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <section id="conceitos" className="scroll-mt-28 border-b border-slate-200 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Conceitos fundamentais</h2>
            <p className="mt-2 text-slate-600">Base mínima para leitura de preço e tomada de posição.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {concepts.map((concept, index) => (
              <article key={concept.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <concept.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{concept.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{concept.summary}</p>
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value={`details-${index}`} className="border-slate-200">
                    <AccordionTrigger className="py-2 text-sm font-medium text-slate-700 hover:no-underline">
                      Saiba mais
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600">
                      {concept.details}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="exemplo" className="scroll-mt-28 border-b border-slate-200 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Exemplo prático</h2>
            <p className="mt-2 text-slate-600">Simulação direta de custo, cenário vencedor e perda potencial.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mercado</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                Banco Central reduzirá a Selic na próxima reunião?
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-700">SIM</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">R$ 0,65</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm font-semibold text-rose-700">NÃO</p>
                <p className="mt-1 text-2xl font-bold text-rose-800">R$ 0,35</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900">Se eu comprar 100 contratos SIM</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-center justify-between gap-3">
                  <span>Custo da posição</span>
                  <strong className="text-slate-900">R$ 65,00</strong>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span>Se SIM vencer</span>
                  <strong className="text-emerald-700">Recebe R$ 100,00 (lucro de R$ 35,00)</strong>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span>Se NÃO vencer</span>
                  <strong className="text-rose-700">Perde R$ 65,00</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="passo-a-passo" className="scroll-mt-28 border-b border-slate-200 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Passo a passo</h2>
            <p className="mt-2 text-slate-600">Fluxo essencial para começar com disciplina de risco.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((item) => (
              <article key={item.step} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.step}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                <Link
                  href={item.linkHref}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  {item.linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="risco" className="scroll-mt-28 border-b border-slate-200 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-amber-900">Aviso de risco</h2>
                <p className="mt-2 text-sm leading-relaxed text-amber-800">
                  Mercado de previsão envolve risco de perda total. Defina limites e opere apenas com um valor que você pode perder sem afetar o seu orçamento.
                </p>
                <Link
                  href={ROUTES.riskDisclosure}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-900 underline underline-offset-4 hover:text-amber-950"
                >
                  Ler aviso de risco completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-28 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Perguntas frequentes</h2>
            <p className="mt-2 text-slate-600">Perguntas centrais para operação inicial.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`faq-${index}`}
                className="rounded-xl border border-slate-200 bg-white px-5"
              >
                <AccordionTrigger className="py-4 text-left font-medium text-slate-900 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Link
            href={ROUTES.faq}
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Ver FAQ completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="pt-2">
        <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
          <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-600 to-emerald-500 p-7 text-center text-white">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold">Pronto para começar?</h2>
              <p className="mt-2 text-sm text-emerald-50">
                Acesse mercados abertos e monte sua primeira posição com disciplina de risco.
              </p>
            </div>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={createPageUrl("Explore")}>
                <Button className="w-full bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto">
                  Explorar Mercados
                  <BarChart3 className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={createPageUrl("Wallet")}>
                <Button
                  variant="outline"
                  className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  Fazer depósito
                  <ListChecks className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
