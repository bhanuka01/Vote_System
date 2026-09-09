'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ElectionSettings,
  ElectionStatus,
  Candidate,
} from '@/lib/types';
import { updateElectionStatusAction } from '@/app/actions/admin';
import {
  Users,
  Vote,
  Hourglass,
  Percent,
  PlayCircle,
  StopCircle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  initialSettings: ElectionSettings | null;
  candidates: Candidate[];
  stats: {
    totalEligible: number;
    votesCast: number;
    remaining: number;
    turnoutPct: number;
    totalTokens: number;
    usedTokens: number;
  };
}

export default function AdminDashboard({
  initialSettings,
  candidates,
  stats,
}: AdminDashboardProps) {
  const [status, setStatus] = useState<ElectionStatus>(
    initialSettings?.status || 'DRAFT'
  );
  const [updating, setUpdating] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleStatusChange = async (newStatus: ElectionStatus) => {
    const confirmMessage =
      newStatus === 'OPEN'
        ? 'Are you ready to OPEN voting? Students with private links will be able to cast ballots immediately.'
        : newStatus === 'CLOSED'
        ? 'Are you sure you want to CLOSE voting? No further votes will be accepted.'
        : 'Revert to DRAFT? Voting will be paused.';

    if (!window.confirm(confirmMessage)) return;

    setUpdating(true);
    setMsg(null);

    const res = await updateElectionStatusAction(newStatus);
    if (res.success) {
      setStatus(newStatus);
      setMsg({ type: 'success', text: res.message });
    } else {
      setMsg({ type: 'error', text: res.message });
    }
    setUpdating(false);
  };

  const resultsUrl = initialSettings?.results_token
    ? `/results/${initialSettings.results_token}`
    : '#';

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{msg.text}</span>
          <button
            onClick={() => setMsg(null)}
            className="text-slate-400 hover:text-slate-600 ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Status & Controls Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Election Status
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  status === 'OPEN'
                    ? 'text-emerald-600'
                    : status === 'CLOSED'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {status}
              </span>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  status === 'OPEN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'CLOSED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {status === 'OPEN'
                  ? 'Voting is active'
                  : status === 'CLOSED'
                  ? 'Voting is concluded'
                  : 'Pre-election setup'}
              </span>
            </div>
          </div>

          {/* Lifecycle Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {status !== 'OPEN' && (
              <button
                onClick={() => handleStatusChange('OPEN')}
                disabled={updating || candidates.length < 2}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Open Voting</span>
              </button>
            )}

            {status === 'OPEN' && (
              <button
                onClick={() => handleStatusChange('CLOSED')}
                disabled={updating}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
              >
                <StopCircle className="w-4 h-4" />
                <span>Close Election</span>
              </button>
            )}

            {status === 'CLOSED' && (
              <button
                onClick={() => handleStatusChange('DRAFT')}
                disabled={updating}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Draft</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Eligible Voters
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {stats.totalEligible}
            </div>
            <p className="text-xs text-slate-500 mt-1">Batch total</p>
          </div>

          <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Votes Cast
              </span>
              <Vote className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-indigo-900">
              {stats.votesCast}
            </div>
            <p className="text-xs text-indigo-700/80 mt-1">Ballots recorded</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Remaining
              </span>
              <Hourglass className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {stats.remaining}
            </div>
            <p className="text-xs text-slate-500 mt-1">Uncast ballots</p>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Turnout
              </span>
              <Percent className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-900">
              {stats.turnoutPct}%
            </div>
            <p className="text-xs text-emerald-700/80 mt-1">
              {stats.votesCast} of {stats.totalEligible}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Candidates Card */}
        <Link
          href="/admin/candidates"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Candidate Roster
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {candidates.length} Candidates
          </div>
          <p className="text-xs text-slate-500">
            {candidates.filter((c) => c.is_active).length} active on the ballot. Add or edit candidates.
          </p>
        </Link>

        {/* Voting Links Card */}
        <Link
          href="/admin/voting-links"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Voting Links
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {stats.totalTokens} Tokens
          </div>
          <p className="text-xs text-slate-500">
            {stats.usedTokens} used, {Math.max(0, stats.totalTokens - stats.usedTokens)} unused. Generate & export CSV.
          </p>
        </Link>

        {/* Live Results Card */}
        <Link
          href={resultsUrl}
          target="_blank"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Live Results Page
            </span>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            View Tally
          </div>
          <p className="text-xs text-slate-500">
            Open batch-wide live results and preferential scoring.
          </p>
        </Link>
      </div>

      {/* Anonymity Architecture Notice */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">
              Election Integrity & Anonymity Protocol
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Voter authorization is strictly separated from ballot choices. The administrator can verify whether a specific student link has been used, but has no technical ability to associate that link with any candidate preference in the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
