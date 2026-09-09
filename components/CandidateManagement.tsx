'use client';

import React, { useState } from 'react';
import { Candidate, ElectionStatus } from '@/lib/types';
import {
  addCandidateAction,
  editCandidateAction,
  toggleCandidateActiveAction,
} from '@/app/actions/admin';
import {
  UserPlus,
  Users,
  Check,
  X,
  Edit2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface CandidateManagementProps {
  initialCandidates: Candidate[];
  electionStatus: ElectionStatus;
  votesCast: number;
}

export default function CandidateManagement({
  initialCandidates,
  electionStatus,
  votesCast,
}: CandidateManagementProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const isLocked = electionStatus === 'OPEN' || votesCast > 0;

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    setFeedback(null);

    const res = await addCandidateAction(name, bio);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setName('');
      setBio('');
      // Optimistic update
      setCandidates([
        ...candidates,
        {
          id: `temp-${Date.now()}`,
          name: name.trim(),
          bio: bio.trim() || null,
          display_order: candidates.length + 1,
          is_active: true,
        },
      ]);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setAdding(false);
  };

  const startEdit = (candidate: Candidate) => {
    setEditingId(candidate.id);
    setEditName(candidate.name);
    setEditBio(candidate.bio || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;

    setFeedback(null);
    const res = await editCandidateAction(id, editName, editBio, true);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setCandidates(
        candidates.map((c) =>
          c.id === id ? { ...c, name: editName.trim(), bio: editBio.trim() || null } : c
        )
      );
      setEditingId(null);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    if (isLocked) {
      alert('Cannot alter candidates while voting is active or votes have been cast.');
      return;
    }

    setFeedback(null);
    const newState = !currentState;
    const res = await toggleCandidateActiveAction(id, newState);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setCandidates(
        candidates.map((c) => (c.id === id ? { ...c, is_active: newState } : c))
      );
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Lock Warning */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-6 h-6 text-indigo-600" />
              <span>Candidate Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Add and configure candidate profiles for the preferential ballot.
            </p>
          </div>

          {isLocked && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Ballot Locked (Voting Started)</span>
            </div>
          )}
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

        {/* Add Candidate Form */}
        {!isLocked ? (
          <form onSubmit={handleAddCandidate} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief Bio / Platform Statement
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Focused on student welfare and career workshops"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adding || !name.trim()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{adding ? 'Adding...' : '+ Add Candidate'}</span>
            </button>
          </form>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Ballot is immutable:</span> Once voting begins or votes have been recorded, candidates cannot be added or deleted to maintain election integrity.
            </div>
          </div>
        )}
      </div>

      {/* Candidate List */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Current Candidates ({candidates.length})
        </h2>

        <div className="divide-y divide-slate-100">
          {candidates.map((cand, index) => {
            const isEditing = editingId === cand.id;

            return (
              <div
                key={cand.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start space-x-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>

                  {isEditing ? (
                    <div className="space-y-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-indigo-400 text-sm focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Bio / platform statement"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{cand.name}</span>
                        {!cand.is_active && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      {cand.bio && (
                        <p className="text-xs text-slate-500 mt-0.5">{cand.bio}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Candidate Action Buttons */}
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(cand.id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                        title="Cancel edit"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    !isLocked && (
                      <>
                        <button
                          onClick={() => startEdit(cand)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg text-xs flex items-center space-x-1"
                          title="Edit candidate"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => handleToggleActive(cand.id, cand.is_active)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            cand.is_active
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {cand.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )
                  )}
                </div>
              </div>
            );
          })}

          {candidates.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No candidates registered yet. Please add at least 2 candidates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
