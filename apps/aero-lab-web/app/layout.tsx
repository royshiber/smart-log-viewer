import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

/**
 * Why: Stitch exports use Space Grotesk + Inter with RTL shell; Next font loader gives stable subsets.
 * What: root layout wires CSS variables and loads Material Symbols like the HTML export.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DRONE_OS_V4 — Aero-Lab',
  description: 'Stitch-derived Aero-Lab dashboard (design tokens from export)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-body text-on-surface antialiased select-none min-h-screen">
        {children}
      </body>
    </html>
  );
}
