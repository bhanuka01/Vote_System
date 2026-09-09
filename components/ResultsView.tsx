'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ElectionResults } from '@/lib/types';
import { getResultsAction } from '@/app/actions/results';
import {
  Users,
  Vote,
  Hourglass,
  Percent,
  RefreshCw,
  Award,
  Printer,
  Info,
} from 'lucide-react';

interface ResultsViewProps {
  initialResults: ElectionResults;
  resultsToken: string;
}

export default function ResultsView({
  initialResults,
  resultsToken,
}: ResultsViewProps) {
  const [results, setResults] = useState<ElectionResults>(initialResults);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const updated = await getResultsAction(resultsToken);
      if (!('error' in updated)) {
        setResults(updated);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to refresh results:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [resultsToken]);

  // Periodic refresh every 10 seconds if election is OPEN
  useEffect(() => {
    if (results.status !== 'OPEN') return;

    const interval = setInterval(() => {
      refreshData();
    }, 10000);

    return () => clearInterval(interval);
  }, [results.status, refreshData]);

  // Find the top weighted score for relative visual bar sizing
  const highestScore = Math.max(
    ...results.candidates.map((c) => c.weighted_score),
    1
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  results.status === 'OPEN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : results.status === 'CLOSED'
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {results.status === 'OPEN' && (
                  <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                )}
                {results.status === 'OPEN'
                  ? 'Live Poll Open'
                  : results.status === 'CLOSED'
                  ? 'Official Final Results'
                  : 'Draft / Setup'}
              </span>

              <span className="text-xs text-slate-400">
                Updated: {lastRefreshedAt.toLocaleTimeString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {results.title}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Preferential Election Tally & Voter Turnout
            </p>
          </div>

          <div className="flex items-center space-x-2 no-print">
            <button
              onClick={() => refreshData()}
              disabled={isRefreshing}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Refresh results"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
              />
              <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Print results page"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Turnout Overview Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Eligible Voters
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {results.total_eligible_voters}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Registered students</p>
          </div>

          <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Votes Cast
              </span>
              <Vote className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {results.votes_cast}
            </div>
            <p className="text-xs text-indigo-700/80 mt-0.5">Ballots recorded</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Remaining
              </span>
              <Hourglass className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {results.remaining_voters}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Pending ballots</p>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Turnout
              </span>
              <Percent className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-900">
              {results.turnout_percentage}%
            </div>
            <p className="text-xs text-emerald-700/80 mt-0.5">Participation rate</p>
          </div>
        </div>

        {/* Turnout Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span>Overall Voter Turnout</span>
            <span>{results.votes_cast} of {results.total_eligible_voters} voted</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, results.turnout_percentage)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Candidate Standings Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Candidate Results</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Ranked by Weighted Preference Score
            </p>
          </div>

          <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
            Formula: (1st × {results.first_pref_weight} pts) + (2nd × {results.second_pref_weight} pt)
          </div>
        </div>

        {/* Mobile View: Vertical Card Stack (100% screen width, no horizontal scroll needed) */}
        <div className="block sm:hidden space-y-3">
          {results.candidates.map((candidate, idx) => {
            const isLeader = idx === 0 && candidate.weighted_score > 0;
            const barWidth =
              highestScore > 0
                ? `${(candidate.weighted_score / highestScore) * 100}%`
                : '0%';

            return (
              <div
                key={`mobile-${candidate.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isLeader
                    ? 'border-indigo-300 bg-indigo-50/40 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-700/30 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-base leading-tight flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="truncate">{candidate.name}</span>
                        {isLeader && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                            Leader
                          </span>
                        )}
                      </div>
                      {candidate.bio && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {candidate.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total Weighted Score */}
                  <div className="text-right flex-shrink-0 pl-2">
                    <div className="text-base font-extrabold text-indigo-600">
                      {candidate.weighted_score}{' '}
                      <span className="text-[10px] font-normal text-slate-400">pts</span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Score
                    </span>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: barWidth }}
                  ></div>
                </div>

                {/* 1st & 2nd Preference Breakdown Pills */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/80 text-xs">
                  <div className="flex items-center justify-between bg-indigo-50/60 border border-indigo-100/70 rounded-lg px-2.5 py-1.5">
                    <span className="text-slate-600 text-[11px] font-medium">
                      1st Preference:
                    </span>
                    <span className="font-bold text-indigo-900 text-sm">
                      {candidate.first_preference_count}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
                    <span className="text-slate-600 text-[11px] font-medium">
                      2nd Preference:
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {candidate.second_preference_count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {results.candidates.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No candidates registered yet.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table (Hidden on Mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-4 rounded-l-lg">Rank & Candidate</th>
                <th className="py-3.5 px-4 text-center">1st Preference</th>
                <th className="py-3.5 px-4 text-center">2nd Preference</th>
                <th className="py-3.5 px-4 text-right rounded-r-lg">
                  Weighted Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {results.candidates.map((candidate, idx) => {
                const isLeader = idx === 0 && candidate.weighted_score > 0;
                const barWidth =
                  highestScore > 0
                    ? `${(candidate.weighted_score / highestScore) * 100}%`
                    : '0%';

                return (
                  <tr
                    key={candidate.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isLeader ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-sm'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-700/30 text-amber-900'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{candidate.name}</span>
                            {isLeader && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full uppercase">
                                Current Leader
                              </span>
                            )}
                          </div>
                          {candidate.bio && (
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {candidate.bio}
                            </p>
                          )}

                          {/* Visual Score Bar */}
                          <div className="w-36 sm:w-48 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: barWidth }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-block font-semibold text-slate-800 bg-indigo-50/70 border border-indigo-100/80 px-2.5 py-1 rounded-md text-sm">
                        {candidate.first_preference_count}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-block font-semibold text-slate-800 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md text-sm">
                        {candidate.second_preference_count}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="text-base font-extrabold text-indigo-600">
                        {candidate.weighted_score}{' '}
                        <span className="text-xs font-normal text-slate-400">pts</span>
                      </span>
                    </td>
                  </tr>
                );
              })}

              {results.candidates.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">
                    No candidates registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Scoring Clarification Box (Section 10 Requirement) */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start space-x-2.5">
          <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">
              Weighted Preference Score Clarification
            </p>
            <p>
              Each ballot awards <strong>{results.first_pref_weight} points</strong> to the 1st preference candidate and <strong>{results.second_pref_weight} point</strong> to the 2nd preference candidate.
            </p>
            <p className="text-slate-500">
              This score is calculated as a standardized weighted evaluation. The election committee must refer to the batch election constitution for official declaration of the winner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
