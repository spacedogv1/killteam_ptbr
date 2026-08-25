import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kill Team Ops — Missões em português',
  description: 'Consulta offline das missões e Tac Ops do Kill Team Approved Ops 2025.',
  manifest: 'manifest.webmanifest',
  themeColor: '#111818',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Kill Team Ops',
    description: 'Missões e Tac Ops em português para consultar durante a partida.',
    images: ['social-preview.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
