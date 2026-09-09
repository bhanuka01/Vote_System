import React from 'react';
import { getResultsAction } from '@/app/actions/results';
import ResultsView from '@/components/ResultsView';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface ResultsPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { token } = await params;
  const resultsData = await getResultsAction(token);

  if ('error' in resultsData) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Results Access Denied
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          The results access link provided is invalid or has expired.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 mb-6 text-left space-y-1">
          <p className="font-semibold text-slate-700">Notice:</p>
          <p>
            Private voting links cannot be used to view election results. Results are accessible exclusively through the batch-wide results URL distributed by the election committee.
          </p>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <Link
            href="/"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ResultsView
      initialResults={resultsData}
      resultsToken={token}
    />
  );
}
