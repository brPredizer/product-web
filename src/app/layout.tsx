import '@/index.css';
import Providers from './providers';
import MercadoPagoSecurityScripts from '@/components/MercadoPagoSecurityScripts';
import React, { ReactNode } from 'react';

export const metadata = {
  title: 'PredictX',
  description: 'Mercados preditivos transparentes construídos em Next.js',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <MercadoPagoSecurityScripts />
          {children}
        </Providers>
      </body>
    </html>
  );
}
