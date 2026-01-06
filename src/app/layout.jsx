import '@/index.css';
import Providers from './providers';

export const metadata = {
  title: 'PredictX',
  description: 'Mercados preditivos transparentes construídos em Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
