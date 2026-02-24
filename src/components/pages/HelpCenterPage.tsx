"use client";

import React from "react";
import Link from "next/link";
import { ROUTES } from "@/routes/pages";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CircleHelp, FileText, Mail, Shield } from "lucide-react";

const helpCards = [
  {
    title: "Perguntas frequentes",
    description: "Respostas rápidas sobre operação, risco, liquidez e resolução de mercados.",
    href: ROUTES.faq,
    cta: "Ir para o FAQ",
    icon: CircleHelp,
  },
  {
    title: "Documentos oficiais",
    description: "Consulte termos, privacidade, taxas, aviso de risco e regras de resolução.",
    href: ROUTES.terms,
    cta: "Abrir documentos legais",
    icon: FileText,
  },
  {
    title: "Contato de suporte",
    description: "Se precisar de ajuda no uso da plataforma, fale com o time oficial de suporte.",
    href: "mailto:contato@predizer.com",
    cta: "Enviar e-mail",
    icon: Mail,
  },
];

const legalLinks = [
  { label: "Política de taxas", href: ROUTES.fees },
  { label: "Termos de uso", href: ROUTES.terms },
  { label: "Política de privacidade", href: ROUTES.privacy },
  { label: "Aviso de risco", href: ROUTES.riskDisclosure },
  { label: "Regras de resolução", href: ROUTES.resolutionRules },
];

export default function HelpCenterPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <Shield className="mr-1 h-3.5 w-3.5" />
            Suporte oficial
          </Badge>
          <h1 className="mt-4 text-lg font-semibold text-slate-900 sm:text-xl">Central de ajuda</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-base">
            Encontre caminhos rápidos para suporte, FAQ e documentos oficiais da Predizer.
          </p>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          {helpCards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <card.icon className="h-4 w-4" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{card.description}</p>
              <Link
                href={card.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {card.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Documentos legais</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Se quiser revisar regras da plataforma, use os atalhos abaixo.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {item.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

