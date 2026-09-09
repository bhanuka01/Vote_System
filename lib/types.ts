export type ElectionStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface Candidate {
  id: string;
  name: string;
  bio?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface ElectionSettings {
  id: number;
  title: string;
  status: ElectionStatus;
  total_eligible_voters: number;
  results_token: string;
  first_pref_weight: number;
  second_pref_weight: number;
  created_at?: string;
  updated_at?: string;
}

export interface VotingTokenRecord {
  id: string;
  token_hash: string;
  student_label?: string | null;
  used: boolean;
  used_at?: string | null;
  created_at?: string;
  hash_prefix?: string;
}

export interface GeneratedTokenItem {
  id?: string;
  student_label: string;
  raw_token: string;
  token_hash: string;
  vote_url: string;
  used: boolean;
}

export interface CandidateResult {
  id: string;
  name: string;
  bio?: string | null;
  is_active: boolean;
  first_preference_count: number;
  second_preference_count: number;
  weighted_score: number;
}

export interface ElectionResults {
  title: string;
  status: ElectionStatus;
  total_eligible_voters: number;
  votes_cast: number;
  remaining_voters: number;
  turnout_percentage: number;
  first_pref_weight: number;
  second_pref_weight: number;
  candidates: CandidateResult[];
  last_updated: string;
  error?: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  used?: boolean;
  election_status?: ElectionStatus;
  election_title?: string;
  results_token?: string;
  reason?: string;
  message: string;
}

export interface VoteSubmissionResponse {
  success: boolean;
  message: string;
  error_code?: string;
  results_token?: string;
}
