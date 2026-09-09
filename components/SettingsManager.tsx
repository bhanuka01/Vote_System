'use client';

import React, { useState } from 'react';
import { ElectionSettings } from '@/lib/types';
import {
  updateElectionSettingsAction,
  regenerateResultsTokenAction,
  resetElectionDataAction,
} from '@/app/actions/admin';
import {
  Settings,
  Key,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

interface SettingsManagerProps {
  initialSettings: ElectionSettings | null;
}

export default function SettingsManager({
  initialSettings,
}: SettingsManagerProps) {
  const [settings, setSettings] = useState<ElectionSettings | null>(initialSettings);
  const [title, setTitle] = useState(
    initialSettings?.title || 'FMIS 45 Batch Representative Election'
  );
  const [totalVoters, setTotalVoters] = useState(
    initialSettings?.total_eligible_voters || 56
  );
  const [firstWeight, setFirstWeight] = useState(
    initialSettings?.first_pref_weight || 2
  );
  const [secondWeight, setSecondWeight] = useState(
    initialSettings?.second_pref_weight || 1
  );
  const [resultsToken, setResultsToken] = useState(
    initialSettings?.results_token || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [copiedResultsUrl, setCopiedResultsUrl] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [clearTokensOnReset, setClearTokensOnReset] = useState(true);

  const getResultsUrl = () => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || '';
    return `${origin}/results/${resultsToken}`;
  };

  const handleResetElectionData = async () => {
    const confirmText = clearTokensOnReset
      ? '⚠️ ARE YOU ABSOLUTELY SURE?\n\nThis will:\n1. PERMANENTLY DELETE all submitted test votes.\n2. DELETE all generated voting tokens (so you can generate fresh links for official voting).\n3. Revert election status back to DRAFT.\n\nType OK to continue.'
      : '⚠️ ARE YOU ABSOLUTELY SURE?\n\nThis will:\n1. PERMANENTLY DELETE all submitted test votes.\n2. Reset all existing tokens to unused (without deleting them).\n3. Revert election status back to DRAFT.\n\nType OK to continue.';

    if (!window.confirm(confirmText)) return;

    setIsResetting(true);
    setFeedback(null);

    const res = await resetElectionDataAction(clearTokensOnReset);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setIsResetting(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await updateElectionSettingsAction({
      title: title.trim(),
      total_eligible_voters: Number(totalVoters),
      first_pref_weight: Number(firstWeight),
      second_pref_weight: Number(secondWeight),
    });

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      if (settings) {
        setSettings({
          ...settings,
          title,
          total_eligible_voters: Number(totalVoters),
          first_pref_weight: Number(firstWeight),
          second_pref_weight: Number(secondWeight),
        });
      }
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setIsSaving(false);
  };

  const handleRegenerateResultsToken = async () => {
    if (
      !window.confirm(
        'Regenerate results access token? Any previously distributed results links will stop working.'
      )
    ) {
      return;
    }

    setIsRegenerating(true);
    setFeedback(null);

    const res = await regenerateResultsTokenAction();
    if (res.success && res.newToken) {
      setResultsToken(res.newToken);
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setIsRegenerating(false);
  };

  const copyResultsUrl = async () => {
    const url = getResultsUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedResultsUrl(true);
      setTimeout(() => setCopiedResultsUrl(false), 2000);
    } catch {
      alert('Failed to copy to clipboard.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="pb-6 border-b border-slate-100">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Election Settings & Scoring</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure election parameters, preferential scoring weights, and public results access.
          </p>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs sm:text-sm font-medium border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Election Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Total Eligible Voters */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Eligible Voters (Batch Size)
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalVoters}
                onChange={(e) => setTotalVoters(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to calculate remaining voters and participation turnout percentage.
              </p>
            </div>

            {/* Weights */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1st Preference Weight (Points)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={firstWeight}
                  onChange={(e) => setFirstWeight(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2nd Preference Weight (Points)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={secondWeight}
                  onChange={(e) => setSecondWeight(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Secret Results Access Mechanism (Section 11 Requirement) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Batch Results Access URL
            </h2>
            <p className="text-xs text-slate-500">
              Separate secret token for public results viewing. Voting links do not grant results access.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-mono text-xs sm:text-sm text-slate-800 break-all bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1">
              {getResultsUrl()}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyResultsUrl}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all"
              >
                {copiedResultsUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <Link
                href={`/results/${resultsToken}`}
                target="_blank"
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-all"
              >
                <span>Preview</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/70 gap-2">
            <div className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Token: <code className="font-mono">{resultsToken}</code></span>
            </div>

            <button
              onClick={handleRegenerateResultsToken}
              disabled={isRegenerating}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center space-x-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Secret Token</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Election Reset & Test Purge */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-rose-200 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-950">
              Reset Election & Purge Test Data
            </h2>
            <p className="text-xs text-slate-500">
              Clear test votes and prepare the system for the real election.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-rose-50/50 border border-rose-100 space-y-4">
          <p className="text-xs text-rose-800 leading-relaxed">
            Use this action once you have finished test-voting and want to reset all ballot counts to 0 before the actual university election begins.
          </p>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={clearTokensOnReset}
                onChange={(e) => setClearTokensOnReset(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <span className="font-medium">
                Also delete existing voting tokens (Recommended: Allows generating fresh 56 links)
              </span>
            </label>
            {!clearTokensOnReset && (
              <p className="text-[11px] text-slate-500 pl-6">
                If unchecked, existing tokens will be kept and their status will be reset to &quot;Not voted&quot;.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetElectionData}
              disabled={isResetting}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isResetting ? 'Resetting Election...' : 'Reset Election & Clear All Votes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
