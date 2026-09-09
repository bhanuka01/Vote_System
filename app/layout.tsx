import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FMIS 45 Batch Representative Election',
  description: 'Production-quality anonymous preferential voting system for university elections.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                45
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  FMIS 45 Election
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Financial Mathematics and Industrial Statistics
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Secure Ballot
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500 space-y-2">
            <p className="font-medium text-slate-600">
              FMIS 45 Batch Representative Election Commission
            </p>
            <p>
              Anonymity Guarantee: Ballots are stored strictly separate from voter authorization tokens.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
