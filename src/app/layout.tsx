import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from './Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Research Grant Craft',
  description: 'Open-source grant proposal wizard + reviewer report for researchers.',
  metadataBase: new URL('https://github.com/selinachegg/research-grant-craft'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800 mt-20 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
            <p>
              <span className="font-medium text-slate-500 dark:text-slate-400">Research Grant Craft</span>
              {' '}— open-source, local-first.{' '}
              <a href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy</a>
              {' · '}MIT Licence
            </p>
            <p className="text-center">
              This tool does not predict funding outcomes.{' '}
              <a
                href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/LIMITATIONS.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-600 dark:hover:text-slate-300"
              >
                Limitations
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
