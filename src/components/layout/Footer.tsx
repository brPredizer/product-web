"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { BookOpen, ShieldCheck, LifeBuoy, LinkIcon } from 'lucide-react';
import { ROUTES } from '@/routes/pages';
import { API_BASE_URL } from '@/app/api/api';
import styles from './Footer.module.css';

interface FooterProps {
  variant?: 'default' | 'compact';
}

const columns = [
  {
    title: 'Recursos',
    icon: BookOpen,
    links: [
      { label: 'Como funciona', href: ROUTES.learn },
      { label: 'FAQ', href: ROUTES.faq },
      { label: 'Política de taxas', href: ROUTES.fees },
    ],
  },
  {
    title: 'Legal',
    icon: ShieldCheck,
    links: [
      { label: 'Termos', href: ROUTES.terms },
      { label: 'Privacidade', href: ROUTES.privacy },
      { label: 'Aviso de risco', href: ROUTES.riskDisclosure },
      { label: 'Regras de resolução', href: ROUTES.resolutionRules },
    ],
  },
  {
    title: 'Suporte',
    icon: LifeBuoy,
    links: [
      { label: 'Central de ajuda', href: ROUTES.helpCenter },
      { label: 'Contato', href: 'mailto:contato@predizer.com' },
    ],
  },
];

const SocialIcon = ({ className }: { className: string }) => (
  <span aria-hidden="true" className={`${styles.socialIcon} ${className}`} />
);

const socialLinks = [
  { label: 'X', href: 'https://x.com/predizerbr', iconClass: styles.iconX },
  { label: 'Instagram', href: 'https://www.instagram.com/predizerbr', iconClass: styles.iconInstagram },
];

export default function Footer({ variant = 'default' }: FooterProps) {
  const isCompact = variant === 'compact';
  const [statusState, setStatusState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const statusUrl = API_BASE_URL
    ? `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}/health`
    : '';

  const checkStatus = async () => {
    try {
      setStatusState('loading');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      if (!statusUrl) {
        setStatusState('error');
        return;
      }
      const res = await fetch(statusUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const text = await res.text();
      const cleaned = text.replace(/"/g, '').trim();
      if (cleaned === 'Healthy') {
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
                <p className="text-xs text-slate-400">Mercado de previsões</p>
              </div>
            </div>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Mercados de previsões com liquidez e regras claras. Operações envolvem risco de perda total;
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
                  <LinkIcon className="h-3.5 w-3.5 text-slate-500" /> Social
                </p>
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  {socialLinks.map(({ label, href, iconClass }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:text-white"
                      aria-label={label}
                    >
                      <SocialIcon className={iconClass} />
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
            <Link className="transition hover:text-white" href={ROUTES.privacy}>
              Privacidade
            </Link>
            <Link className="transition hover:text-white" href={ROUTES.terms}>
              Termos
            </Link>
            <Link className="transition hover:text-white" href={ROUTES.riskDisclosure}>
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
