"use client";

import Link from 'next/link';
import React from 'react';
import { ROUTES } from '@/routes/pages';

interface FooterProps {
  variant?: 'default' | 'compact';
}

const sections = [
  {
    title: 'Produto',
    links: [
      { label: 'Explorar', href: ROUTES.explore },
      { label: 'Aprender', href: ROUTES.learn },
      { label: 'Dashboard', href: ROUTES.home },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { label: 'Central de ajuda', href: '/faq' },
      { label: 'Contato', href: 'mailto:contato@predizer.com' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos', href: '/termos' },
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Aviso de risco', href: '/aviso-de-risco' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre', href: '/sobre' },
      { label: 'Status', href: '/status' },
    ],
  },
];

export default function Footer({ variant = 'default' }: FooterProps) {
  const isCompact = variant === 'compact';

  return (
    <footer className={`bg-slate-950 text-slate-100 ${isCompact ? 'pt-10 pb-8' : 'pt-12 pb-10'} mt-16`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`grid gap-8 ${isCompact ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <p className="text-sm font-semibold text-white tracking-tight">{section.title}</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {section.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-emerald-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white text-lg">P</div>
            <span>Predizer</span>
          </div>
          <p className="text-xs sm:text-sm">© {new Date().getFullYear()} Predizer. Mercado de previsões.</p>
        </div>
      </div>
    </footer>
  );
}
