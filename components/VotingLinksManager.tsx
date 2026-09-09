'use client';

import React, { useState, useEffect } from 'react';
import { GeneratedTokenItem, VotingTokenRecord } from '@/lib/types';
import { generateVotingTokensAction } from '@/app/actions/admin';
import {
  Link2,
  Download,
  Copy,
  Check,
  Search,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface VotingLinksManagerProps {
  initialTokens: VotingTokenRecord[];
  totalEligible: number;
}

export default function VotingLinksManager({
  initialTokens,
  totalEligible = 56,
}: VotingLinksManagerProps) {
  const [tokens, setTokens] = useState<VotingTokenRecord[]>(initialTokens);
  const [freshlyGenerated, setFreshlyGenerated] = useState<GeneratedTokenItem[]>([]);
  const [tokenCount, setTokenCount] = useState<number>(totalEligible || 56);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'voted' | 'not_voted'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Restore freshly generated tokens if user refreshed page
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('fmis45_fresh_tokens');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFreshlyGenerated(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to read cached tokens from sessionStorage:', err);
    }
  }, []);

  // Derive origin for URL generation
  const getAppOrigin = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const handleGenerateTokens = async () => {
    const origin = getAppOrigin();
    const confirmMsg =
      tokens.length > 0
        ? `There are already ${tokens.length} tokens in the database. Generating ${tokenCount} new tokens will add to them. Continue?`
        : `Generate exactly ${tokenCount} cryptographically secure private voting links?`;

    if (!window.confirm(confirmMsg)) return;

    setIsGenerating(true);
    setFeedback(null);

    const res = await generateVotingTokensAction(tokenCount, origin);
    if (res.success && res.tokens.length > 0) {
      setFreshlyGenerated(res.tokens);
      try {
        sessionStorage.setItem('fmis45_fresh_tokens', JSON.stringify(res.tokens));
      } catch (err) {
        console.error('Failed to cache tokens:', err);
      }

      setFeedback({
        type: 'success',
        text: `Generated ${res.tokens.length} private voting links. Please copy or download the CSV below for student distribution.`,
      });

      // Update tokens list state
      const newRecords: VotingTokenRecord[] = res.tokens.map((t) => ({
        id: t.token_hash,
        student_label: t.student_label,
        token_hash: t.token_hash,
        used: false,
        created_at: new Date().toISOString(),
        hash_prefix: `${t.token_hash.substring(0, 8)}...`,
      }));
      setTokens([...newRecords, ...tokens]);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setIsGenerating(false);
  };

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(identifier);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('Failed to copy to clipboard.');
    }
  };

  // Helper to reliably trigger a CSV file download using Blob and UTF-8 BOM
  const triggerCsvDownload = (filename: string, csvBody: string) => {
    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportFreshCsv = () => {
    if (freshlyGenerated.length === 0) {
      alert('No fresh private links found in this browser session. If you refreshed or already closed the tab, you can generate a new batch or export the token status table below.');
      return;
    }

    const headers = ['Student/Label', 'Voting URL', 'Status'];
    const rows = freshlyGenerated.map((item) => [
      `"${(item.student_label || '').replace(/"/g, '""')}"`,
      `"${(item.vote_url || '').replace(/"/g, '""')}"`,
      `"${item.used ? 'Voted' : 'Not voted'}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\r\n');

    triggerCsvDownload(`FMIS45_voting_links_${Date.now()}.csv`, csvContent);
  };

  const exportStatusCsv = () => {
    if (tokens.length === 0) {
      alert('No voting tokens found in the database. Please generate tokens first.');
      return;
    }

    const headers = ['Student/Label', 'Token Hash Prefix', 'Status', 'Used At'];
    const rows = tokens.map((t) => [
      `"${(t.student_label || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(t.hash_prefix || t.token_hash?.substring(0, 8) || '').replace(/"/g, '""')}"`,
      `"${t.used ? 'Voted' : 'Not voted'}"`,
      `"${t.used_at ? new Date(t.used_at).toLocaleString() : 'N/A'}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\r\n');

    triggerCsvDownload(`FMIS45_token_status_${Date.now()}.csv`, csvContent);
  };

  // Filter & search logic
  const filteredTokens = tokens.filter((t) => {
    const matchesSearch = (t.student_label || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'voted'
        ? t.used
        : !t.used;

    return matchesSearch && matchesStatus;
  });

  const votedCount = tokens.filter((t) => t.used).length;
  const notVotedCount = tokens.length - votedCount;

  return (
    <div className="space-y-6">
      {/* Header & Token Generator Panel */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Link2 className="w-6 h-6 text-indigo-600" />
              <span>Voting Links & Tokens</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Generate one-time private voting links for exactly {totalEligible} eligible voters.
            </p>
          </div>

          {/* Generator Button */}
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="500"
              value={tokenCount}
              onChange={(e) => setTokenCount(Number(e.target.value))}
              className="w-16 px-2.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-center"
              title="Number of tokens to generate"
            />
            <button
              onClick={handleGenerateTokens}
              disabled={isGenerating}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : `Generate ${tokenCount} Links`}</span>
            </button>
          </div>
        </div>

        {/* Anonymity Architecture Warning Box (Section 7 requirement) */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-900 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-950">
              Admin Privacy Notice & Anonymity Separation:
            </span>
            <p className="leading-relaxed">
              When assigning private links to students (e.g. Student 01 to Student 56), the election committee will be able to see <strong>whether</strong> a particular student link has been used. However, the database design strictly guarantees that candidate votes are stored in a separate table with <strong>no references, IDs, or timestamps connecting to tokens</strong>. You will never be able to discover who voted for whom.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs sm:text-sm font-medium border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Freshly Generated Token Drawer */}
        {freshlyGenerated.length > 0 && (
          <div className="mt-6 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-indigo-950 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Newly Generated Links Ready for Distribution ({freshlyGenerated.length})</span>
                </h3>
                <p className="text-xs text-indigo-700/90 mt-0.5">
                  Raw private tokens are only visible upon generation. Download the CSV now.
                </p>
              </div>

              <button
                onClick={exportFreshCsv}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV with Private URLs</span>
              </button>
            </div>

            {/* Quick Preview Table */}
            <div className="max-h-60 overflow-y-auto bg-white rounded-xl border border-indigo-100 divide-y divide-slate-100 text-xs">
              {freshlyGenerated.slice(0, 10).map((item) => (
                <div
                  key={item.token_hash}
                  className="p-3 flex items-center justify-between hover:bg-slate-50"
                >
                  <span className="font-bold text-slate-800 w-28">
                    {item.student_label}
                  </span>
                  <span className="font-mono text-slate-500 truncate flex-1 mx-2">
                    {item.vote_url}
                  </span>
                  <button
                    onClick={() => copyToClipboard(item.vote_url, item.token_hash)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg"
                    title="Copy Link"
                  >
                    {copiedId === item.token_hash ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
              {freshlyGenerated.length > 10 && (
                <div className="p-2.5 text-center text-slate-400 bg-slate-50 font-medium">
                  + {freshlyGenerated.length - 10} more links included in CSV export
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Existing Tokens Table with Status */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Voter Token Status Tracker
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total: {tokens.length} | Voted: {votedCount} | Not voted: {notVotedCount}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportStatusCsv}
              disabled={tokens.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Status CSV</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 my-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tokens.length})
            </button>
            <button
              onClick={() => setStatusFilter('voted')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'voted'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Voted ({votedCount})
            </button>
            <button
              onClick={() => setStatusFilter('not_voted')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'not_voted'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Not Voted ({notVotedCount})
            </button>
          </div>
        </div>

        {/* Tokens Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Student / Label</th>
                <th className="py-3 px-4">Token Hash Prefix</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredTokens.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {t.student_label || 'Student'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {t.hash_prefix || `${t.token_hash?.substring(0, 8)}...`}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        t.used
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.used ? 'Voted' : 'Not voted'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-slate-400">
                    {t.used_at
                      ? new Date(t.used_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}

              {filteredTokens.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                    {tokens.length === 0
                      ? 'No voting tokens generated yet. Click "Generate Links" above.'
                      : 'No tokens match your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
