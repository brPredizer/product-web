"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/routes/pages";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, FileCheck2, Mail } from "lucide-react";
import type { LegalPageContent } from "./legalContent";

type LegalPageShellProps = {
  content: LegalPageContent;
};

const legalNavigationItems = [
  { path: ROUTES.faq, title: "FAQ" },
  { path: ROUTES.fees, title: "Política de taxas" },
  { path: ROUTES.terms, title: "Termos de uso" },
  { path: ROUTES.privacy, title: "Política de privacidade" },
  { path: ROUTES.riskDisclosure, title: "Aviso de risco" },
  { path: ROUTES.resolutionRules, title: "Regras de resolução" },
];

export default function LegalPageShell({ content }: LegalPageShellProps): JSX.Element {
  const pathname = usePathname();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const currentIndex = legalNavigationItems.findIndex((item) => item.path === pathname);
  const previousItem = currentIndex > 0 ? legalNavigationItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < legalNavigationItems.length - 1
      ? legalNavigationItems[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{content.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-base">{content.subtitle}</p>
          <p className="mt-4 text-sm text-slate-500">Última atualização: {content.updatedAt}</p>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          {content.sections.map((section, index) => (
            <article key={section.title} className={index > 0 ? "mt-5 border-t border-slate-200 pt-5" : ""}>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{section.title}</h2>
              <div className="mt-3 space-y-2.5">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-slate-700 sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}

          {(previousItem || nextItem) && (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  {previousItem ? (
                    <Link
                      href={previousItem.path}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:text-base"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {previousItem.title}
                    </Link>
                  ) : null}
                </div>
                <div className="sm:text-right">
                  {nextItem ? (
                    <Link
                      href={nextItem.path}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:text-base"
                    >
                      {nextItem.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 lg:hidden">
          <h3 className="text-sm font-semibold text-slate-900">Precisa de mais contexto?</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Consulte a central de perguntas frequentes ou entre em contato com o suporte oficial.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href={ROUTES.faq}
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Ir para FAQ
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="mailto:contato@predizer.com"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Contatar suporte
              <Mail className="h-4 w-4" />
            </Link>
          </div>
        </section>
        
      </div>

      <div className="sticky bottom-4 z-30 mt-5 hidden justify-end pr-3 lg:flex">
        <aside
          className={`rounded-2xl border border-emerald-200 bg-white/95 shadow-lg backdrop-blur transition-all ${
            isContextOpen ? "w-80 p-4" : "w-auto p-3"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsContextOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-label="Alternar contexto"
          >
            <span className="text-sm font-semibold text-slate-900">Precisa de mais contexto?</span>
            {isContextOpen ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {isContextOpen ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Consulte a central de perguntas frequentes ou entre em contato com o suporte oficial.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={ROUTES.faq}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Ir para FAQ
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="mailto:contato@predizer.com"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Contatar suporte
                  <Mail className="h-4 w-4" />
                </Link>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
