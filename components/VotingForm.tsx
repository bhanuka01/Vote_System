'use client';

import React, { useState } from 'react';
import { Candidate } from '@/lib/types';
import { submitVoteAction } from '@/app/actions/voting';
import { CheckCircle2, AlertCircle, ShieldCheck, Lock, HelpCircle } from 'lucide-react';

interface VotingFormProps {
  token: string;
  candidates: Candidate[];
  electionTitle?: string;
}

export default function VotingForm({
  token,
  candidates,
  electionTitle = 'FMIS 45 Batch Representative Election',
}: VotingFormProps) {
  const [firstPref, setFirstPref] = useState<string>('');
  const [secondPref, setSecondPref] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [hasVotedSuccess, setHasVotedSuccess] = useState<boolean>(false);

  // Helper to find candidate by ID
  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.name || 'Unknown Candidate';
  };

  // Handlers with automatic conflict prevention
  const handleSelectFirst = (candidateId: string) => {
    setErrorMsg(null);
    setFirstPref(candidateId);
    if (secondPref === candidateId) {
      setSecondPref(''); // Automatically clear second preference if selected for first
    }
  };

  const handleSelectSecond = (candidateId: string) => {
    setErrorMsg(null);
    if (firstPref === candidateId) {
      setErrorMsg('You cannot select the same candidate for both preferences.');
      return;
    }
    setSecondPref(candidateId);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstPref || !secondPref) {
      setErrorMsg('Please select both your 1st and 2nd preferences before submitting.');
      return;
    }

    if (firstPref === secondPref) {
      setErrorMsg('Please select different candidates for your 1st and 2nd preferences.');
      return;
    }

    // Open confirmation modal
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await submitVoteAction(token, firstPref, secondPref);

      if (response.success) {
        setHasVotedSuccess(true);
        setShowConfirmModal(false);
      } else {
        setErrorMsg(response.message || 'Something went wrong. Please try again.');
        setShowConfirmModal(false);
      }
    } catch {
      setErrorMsg('A network error occurred. Please verify your connection and try again.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (hasVotedSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Your vote has been successfully recorded.
        </h2>

        <p className="text-base text-slate-600 mb-6">
          Thank you for voting in the {electionTitle}.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 mb-6 space-y-2 text-left">
          <div className="flex items-start space-x-2">
            <Lock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="font-medium text-slate-700">
              Your voting link has been permanently deactivated.
            </p>
          </div>
          <p className="text-xs text-slate-500 pl-6">
            To preserve the secret ballot principle, your candidate selections are stored anonymously and cannot be retrieved or linked to your individual identity.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          You may now safely close this browser window.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold tracking-wider uppercase mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Official Ballot</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {electionTitle}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mb-4">
          Choose your 1st and 2nd preferences. Your vote is anonymous.
        </p>

        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-indigo-900 flex items-start space-x-2.5">
          <HelpCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Privacy Guarantee:</span> Your private link authorizes a single ballot, but your selections are stored with zero connection to your identity.
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 flex items-start space-x-3 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Submission Error</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Voting Form */}
      <form onSubmit={handlePreSubmit} className="space-y-6">
        {/* Preference 1 */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>1st Preference</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your primary candidate of choice (Highest weight)
              </p>
            </div>
            {firstPref && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Selected
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {candidates.map((cand) => {
              const isSelected = firstPref === cand.id;
              const isSecondPref = secondPref === cand.id;

              return (
                <label
                  key={`first-${cand.id}`}
                  className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                      : isSecondPref
                      ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                      : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="first_preference"
                    value={cand.id}
                    checked={isSelected}
                    onChange={() => handleSelectFirst(cand.id)}
                    className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-semibold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {cand.name}
                      </span>
                      {isSecondPref && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Selected as 2nd Pref
                        </span>
                      )}
                    </div>
                    {cand.bio && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {cand.bio}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* Preference 2 */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>2nd Preference</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your backup candidate of choice (Must be different from 1st)
              </p>
            </div>
            {secondPref && (
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Selected
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {candidates.map((cand) => {
              const isSelected = secondPref === cand.id;
              const isFirstPref = firstPref === cand.id;

              return (
                <label
                  key={`second-${cand.id}`}
                  className={`relative flex items-center p-4 rounded-xl border transition-all ${
                    isFirstPref
                      ? 'border-slate-200 bg-slate-100/60 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-slate-800 bg-slate-100 ring-2 ring-slate-800/10 cursor-pointer'
                      : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/50 cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="second_preference"
                    value={cand.id}
                    disabled={isFirstPref}
                    checked={isSelected}
                    onChange={() => handleSelectSecond(cand.id)}
                    className="w-5 h-5 text-slate-800 border-slate-300 focus:ring-slate-700 focus:ring-offset-0 disabled:opacity-50"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-semibold ${isSelected ? 'text-slate-900' : isFirstPref ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {cand.name}
                      </span>
                      {isFirstPref && (
                        <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Selected as 1st Pref
                        </span>
                      )}
                    </div>
                    {cand.bio && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {cand.bio}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!firstPref || !secondPref || isSubmitting}
            className="w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <span>SUBMIT MY VOTE</span>
          </button>
          <p className="text-center text-xs text-slate-500 mt-3">
            Each link can successfully submit only one vote. Please review your choices carefully.
          </p>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Confirm Your Ballot Submission
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Once submitted, your vote is permanently recorded and this private voting link will be disabled.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 mb-6">
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">
                  1st Preference (Primary)
                </span>
                <span className="text-base font-bold text-slate-900">
                  {getCandidateName(firstPref)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="text-xs text-slate-500 block uppercase font-medium">
                  2nd Preference (Secondary)
                </span>
                <span className="text-base font-bold text-slate-900">
                  {getCandidateName(secondPref)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Change Choices
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Recording...</span>
                  </>
                ) : (
                  <span>Confirm & Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
