"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Twitter, Instagram, BookOpen, ShieldCheck, LifeBuoy, MessageCircle } from 'lucide-react';
import { ROUTES } from '@/routes/pages';

interface FooterProps {
  variant?: 'default' | 'compact';
}

const columns = [
  {
    title: 'Recursos',
    icon: BookOpen,
    links: [
      { label: 'Aprender', href: ROUTES.learn },
      { label: 'FAQ', href: '/faq' },
      { label: 'Política de taxas', href: '/taxas' },
    ],
  },
  {
    title: 'Legal',
    icon: ShieldCheck,
    links: [
      { label: 'Termos', href: '/termos' },
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Aviso de risco', href: '/aviso-de-risco' },
      { label: 'Regras de resolução', href: '/regras-de-resolucao' },
    ],
  },
  {
    title: 'Suporte',
    icon: LifeBuoy,
    links: [
      { label: 'Central de ajuda', href: '/faq' },
      { label: 'Contato', href: 'mailto:contato@predizer.com' },
    ],
  },
];

const socialLinks = [
  { label: 'X / Twitter', href: 'https://twitter.com', icon: Twitter },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: Instagram },
];

export default function Footer({ variant = 'default' }: FooterProps) {
  const isCompact = variant === 'compact';
  const [statusState, setStatusState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const checkStatus = async () => {
    try {
      setStatusState('loading');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('https://predizerapi.onrender.com/', { signal: controller.signal });
      clearTimeout(timeoutId);
      const text = await res.text();
      const cleaned = text.replace(/"/g, '').trim();
      if (cleaned === 'Product API online') {
        setStatusState('ok');
      } else {
        setStatusState('error');
      }
    } catch (error) {
      setStatusState('error');
    }
  };

  useEffect(() => {
    checkStatus();
    const intervalId = setInterval(checkStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <footer
      className={`border-t border-white/10 bg-gradient-to-b from-slate-950 via-slate-950/98 to-slate-900 text-slate-200 ${isCompact ? 'pt-8 pb-7' : 'pt-10 pb-9'
        }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">P</div>
              <div>
                <p className="text-base font-semibold text-white">Predizer</p>
                <p className="text-xs text-slate-400">Mercado de probabilidades</p>
              </div>
            </div>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Mercados de probabilidades com liquidez e regras claras. Operações envolvem risco de perda total;
              use com responsabilidade e consulte sempre as regras de resolução.
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <span
                className={`h-2 w-2 rounded-full ${
                  statusState === 'error' ? 'bg-rose-400' : statusState === 'ok' ? 'bg-emerald-400' : 'bg-amber-300'
                }`}
              />
              Status:
              <button
                type="button"
                onClick={checkStatus}
                className=" text-slate-300 underline underline-offset-4 transition hover:text-white"
              >
                {statusState === 'loading' ? 'checando...' : statusState === 'ok' ? 'online' : statusState === 'error' ? 'falhou' : 'ver'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {columns.map((section) => (
                <div key={section.title} className="space-y-2">
                  <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {section.icon && <section.icon className="h-3.5 w-3.5 text-slate-500" />} {section.title}
                  </p>
                  <ul className="space-y-1.5 text-[13px]">
                    {section.links.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="text-slate-300 transition hover:text-white"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="space-y-2.5">
                <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  <MessageCircle className="h-3.5 w-3.5 text-slate-500" /> Social
                </p>
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  {socialLinks.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:text-white"
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2.5 border-t border-white/10 pt-5 text-[12px] text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Predizer. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link className="transition hover:text-white" href="/privacidade">
              Privacidade
            </Link>
            <Link className="transition hover:text-white" href="/termos">
              Termos
            </Link>
            <Link className="transition hover:text-white" href="/aviso-de-risco">
              Aviso de risco
            </Link>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="text-slate-300">Brasil • PT-BR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
