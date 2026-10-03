import type { Metadata } from 'next';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ToasterProvider } from '@/components/ui/ToasterProvider';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'VesperStay',
    template: '%s · VesperStay',
  },
  description:
    'Ultra-luxury twilight hospitality — property management and channel manager.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased dark:bg-[#0B0F17] dark:text-slate-100">
        <ThemeProvider>
          {children}
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
