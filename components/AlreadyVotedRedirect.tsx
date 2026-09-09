'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface AlreadyVotedRedirectProps {
  resultsToken?: string;
  electionTitle?: string;
}

export default function AlreadyVotedRedirect({
  resultsToken,
  electionTitle = 'FMIS 45 Batch Representative Election',
}: AlreadyVotedRedirectProps) {
  const [countdown, setCountdown] = useState<number>(3);
  const router = useRouter();

  const resultsUrl = resultsToken ? `/results/${resultsToken}` : '/';

  useEffect(() => {
    if (!resultsToken) return;

    if (countdown <= 0) {
      router.push(resultsUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, resultsToken, resultsUrl, router]);

  return (
    <div className="max-w-md mx-auto my-8 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3">
        Ballot Already Cast
      </span>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
        You Have Already Voted!
      </h1>

      <p className="text-xs sm:text-sm text-slate-600 mb-6">
        Your anonymous vote for the {electionTitle} has already been recorded. Each private link can only be used once.
      </p>

      {resultsToken ? (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs sm:text-sm text-indigo-900">
            <p className="font-semibold mb-1">
              Redirecting to live results in{' '}
              <span className="inline-block w-5 text-center font-bold text-indigo-600 text-base">
                {countdown}
              </span>{' '}
              seconds...
            </p>
            <p className="text-xs text-indigo-700/80">
              You can track real-time voter turnout and candidate standings.
            </p>
          </div>

          <Link
            href={resultsUrl}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Live Results Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="border-t border-slate-100 pt-4">
          <Link
            href="/"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Return to Home
          </Link>
        </div>
      )}
    </div>
  );
}
