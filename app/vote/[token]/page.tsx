import React from 'react';
import { validateTokenAction } from '@/app/actions/voting';
import VotingForm from '@/components/VotingForm';
import AlreadyVotedRedirect from '@/components/AlreadyVotedRedirect';
import { AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface VotePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function VotePage({ params }: VotePageProps) {
  const { token } = await params;
  const { validation, candidates } = await validateTokenAction(token);

  // 1. Invalid token state
  if (!validation.valid && validation.reason === 'INVALID_TOKEN') {
    return (
      <div className="max-w-md mx-auto my-8 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Invalid Voting Link
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          This voting link is invalid. Please make sure you copied the full private URL or contact the election administrator.
        </p>
        <div className="border-t border-slate-100 pt-4">
          <Link
            href="/"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Return to Election Information
          </Link>
        </div>
      </div>
    );
  }

  // 2. Token already used state -> Automatically redirect to results
  if (validation.used || validation.reason === 'ALREADY_USED') {
    return (
      <AlreadyVotedRedirect
        resultsToken={validation.results_token}
        electionTitle={validation.election_title}
      />
    );
  }

  // 3. Election closed or not open state
  if (!validation.valid && validation.reason === 'ELECTION_NOT_OPEN') {
    const isDraft = validation.election_status === 'DRAFT';
    return (
      <div className="max-w-md mx-auto my-8 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {isDraft ? 'Voting Has Not Started Yet' : 'Voting Is Currently Closed'}
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          {isDraft
            ? 'The election committee has not opened voting yet. Please hold on to your private voting link.'
            : 'The election poll has concluded. No more votes can be accepted.'}
        </p>
        <div className="border-t border-slate-100 pt-4">
          <Link
            href="/"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Return to Election Information
          </Link>
        </div>
      </div>
    );
  }

  // 4. Other server or database error state
  if (!validation.valid || candidates.length === 0) {
    return (
      <div className="max-w-md mx-auto my-8 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Unable to Load Ballot
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          {validation.message || 'Something went wrong. Please try again later.'}
        </p>
        <div className="border-t border-slate-100 pt-4">
          <Link
            href="/"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Return to Election Information
          </Link>
        </div>
      </div>
    );
  }

  // 5. Valid ballot ready for voting
  return (
    <VotingForm
      token={token}
      candidates={candidates}
      electionTitle={validation.election_title}
    />
  );
}
