import React from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  GraduationCap, 
  TrendingUp, 
  Shield, 
  DollarSign,
  BookOpen,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Scale
} from 'lucide-react';
import { motion } from 'framer-motion';

const concepts = [
  {
    icon: Target,
    title: 'O que é um Mercado Preditivo?',
    description: 'Um mercado onde você negocia contratos sobre eventos futuros. O preço reflete a probabilidade coletiva do evento acontecer.'
  },
  {
    icon: BarChart3,
    title: 'Contratos SIM / NÃO',
    description: 'Cada mercado tem dois lados: SIM (o evento acontece) e NÃO (o evento não acontece). Cada contrato paga R$1 se você acertar.'
  },
  {
    icon: DollarSign,
    title: 'Preço = Probabilidade',
    description: 'Se um contrato SIM custa 60¢, o mercado estima 60% de chance do evento acontecer. Compre barato se você discorda!'
  },
  {
    icon: Scale,
    title: 'Hedge e Gestão de Risco',
    description: 'Use mercados preditivos para se proteger contra cenários adversos ou para expressar visões sobre eventos econômicos.'
  }
];

const steps = [
  {
    step: '01',
    title: 'Escolha um Mercado',
    description: 'Navegue pelos mercados disponíveis e encontre eventos sobre os quais você tem uma opinião ou conhecimento.'
  },
  {
    step: '02',
    title: 'Analise as Probabilidades',
    description: 'O preço do contrato SIM indica a probabilidade implícita. Se você acha que o mercado está errado, há oportunidade.'
  },
  {
    step: '03',
    title: 'Compre Contratos',
    description: 'Compre SIM se você acredita que o evento vai acontecer, ou NÃO caso contrário. Invista apenas o que você pode perder.'
  },
  {
    step: '04',
    title: 'Aguarde a Resolução',
    description: 'Quando o evento é verificado, contratos vencedores recebem R$1 cada. Seu lucro é a diferença do preço de compra.'
  }
];

const faqs = [
  {
    question: 'Isso é aposta ou investimento?',
    answer: 'Mercados preditivos são instrumentos financeiros que refletem probabilidades coletivas. Diferente de apostas tradicionais, você negocia com outros participantes (não contra a casa) e os preços são formados livremente pelo mercado. É similar a negociar ações, mas sobre eventos específicos.'
  },
  {
    question: 'Posso perder todo meu dinheiro?',
    answer: 'Sim. Se você comprar contratos SIM e o evento não acontecer (ou vice-versa), você perde o valor investido. Por isso, invista apenas o que você pode perder e diversifique suas posições.'
  },
  {
    question: 'Como a plataforma ganha dinheiro?',
    answer: 'Cobramos apenas taxas transparentes: 7% sobre depósitos e 10% sobre saques. Não temos posição proprietária contra os usuários e não lucramos com suas perdas.'
  },
  {
    question: 'Como sei que o resultado é justo?',
    answer: 'Cada mercado tem critérios de resolução públicos e fontes oficiais de verificação definidas antes da abertura. Os resultados são verificados de forma transparente e auditável.'
  },
  {
    question: 'Posso vender meus contratos antes do resultado?',
    answer: 'Em breve! Estamos desenvolvendo um livro de ordens completo que permitirá negociar contratos a qualquer momento antes da resolução.'
  },
  {
    question: 'Qual o valor mínimo para começar?',
    answer: 'O depósito mínimo é R$10. Com isso você já pode comprar contratos e começar a participar dos mercados.'
  }
];

export default function Learn() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-6">
              <GraduationCap className="w-3 h-3 mr-1" />
              Central de Conhecimento
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Aprenda a Negociar
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400"> Previsões</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Entenda como funcionam os mercados preditivos, o que são contratos binários e como transformar seu conhecimento em posições financeiras.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Concepts */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Conceitos Fundamentais</h2>
          <p className="text-lg text-slate-600">Tudo que você precisa saber antes de começar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {concepts.map((concept, index) => (
            <motion.div
              key={concept.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <concept.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{concept.title}</h3>
              <p className="text-slate-600 leading-relaxed">{concept.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Example */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-blue-100 text-blue-700 mb-4">
              <Lightbulb className="w-3 h-3 mr-1" />
              Exemplo Prático
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900">Como Funciona na Prática</h2>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-2">Mercado de Exemplo</p>
              <h3 className="text-xl font-semibold text-slate-900">
                "O Banco Central vai cortar a Selic em Setembro 2025?"
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-emerald-600">SIM</span>
                  <span className="text-2xl font-bold text-emerald-600">65¢</span>
                </div>
                <p className="text-sm text-slate-600">
                  O mercado estima <strong>65% de probabilidade</strong> de corte na Selic.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-rose-600">NÃO</span>
                  <span className="text-2xl font-bold text-rose-600">35¢</span>
                </div>
                <p className="text-sm text-slate-600">
                  O mercado estima <strong>35% de probabilidade</strong> de não haver corte.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 mb-3">Se você comprar 100 contratos SIM por R$65:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Se o Banco Central cortar:</span>
                  <span className="font-semibold text-emerald-900">Você recebe R$100 (+R$35 lucro)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Se não houver corte:</span>
                  <span className="font-semibold text-rose-600">Você perde R$65</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step by Step */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Passo a Passo</h2>
          <p className="text-lg text-slate-600">Do cadastro ao seu primeiro trade</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="text-6xl font-bold text-slate-100 mb-4">{item.step}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-8 -right-4 w-6 h-6 text-slate-300" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Risk Warning */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Aviso de Risco</h3>
              <p className="text-amber-700 leading-relaxed">
                Negociar em mercados preditivos envolve risco substancial de perda. 
                Você pode perder todo o capital investido. Não invista dinheiro que você não pode perder. 
                Mercados preditivos não são adequados para todos os perfis de investidor. 
                Certifique-se de entender completamente os riscos antes de negociar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Perguntas Frequentes</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-xl border border-slate-200 px-6"
            >
              <AccordionTrigger className="text-left font-medium text-slate-900 hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Pronto para Começar?</h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Explore os mercados disponíveis e faça sua primeira previsão. 
            Lembre-se: invista apenas o que você pode perder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={createPageUrl('Explore')}>
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
                Explorar Mercados
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href={createPageUrl('Wallet')}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Fazer Depósito
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}