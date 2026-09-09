import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Vote,
  Users,
  CheckCircle2,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-md shadow-indigo-200">
          45
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Financial Mathematics and Industrial Statistics</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Batch Representative Election
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-8">
          A secure, mobile-friendly preferential election system designed for 56 eligible student voters.
        </p>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
              <Vote className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Preferential Voting</h2>
            <p className="text-xs text-slate-500">
              Select distinct 1st and 2nd preferences for representative candidates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Guaranteed Anonymity</h2>
            <p className="text-xs text-slate-500">
              Voter authorization is physically and logically separated from ballot contents.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">One-Time Token</h2>
            <p className="text-xs text-slate-500">
              Atomic database transactions ensure each link can submit exactly one vote.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works for Students */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <span>How to Vote as an FMIS 45 Student</span>
        </h2>

        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-semibold text-slate-900">Receive Your Private Link</p>
              <p className="text-xs text-slate-500">
                The election committee will privately send you a unique voting link (e.g.{' '}
                <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  /vote/Ab83kLm91...
                </code>
                ).
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-semibold text-slate-900">Select Your Preferences</p>
              <p className="text-xs text-slate-500">
                Open the link on your mobile phone or laptop. Choose your 1st and 2nd candidate preferences.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-semibold text-slate-900">Anonymous Submission</p>
              <p className="text-xs text-slate-500">
                When you click submit, your ballot is deposited into the anonymous ballot box, and your one-time link is permanently burned.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Anonymity Architecture Breakdown */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Lock className="w-4 h-4" />
          <span>Technical Anonymity Model</span>
        </div>

        <h2 className="text-xl font-bold">
          Why your vote cannot be traced back to you
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          In typical surveys, voter identification is stored side-by-side with answers. In this application, we enforce strict isolation:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-1">
              voting_tokens Table
            </span>
            <p className="text-slate-300">
              Stores only SHA-256 hashes of private links and a <code className="text-indigo-300">used</code> flag. Contains zero candidate choice data.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-indigo-400 block mb-1">
              votes Table
            </span>
            <p className="text-slate-300">
              Stores only candidate IDs. Contains zero student IDs, token IDs, hashes, or IP addresses.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Gateway Link */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Election Committee Portal</h3>
            <p className="text-xs text-slate-500">
              Manage candidates, generate batch tokens, and monitor participation.
            </p>
          </div>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <span>Admin Access</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
