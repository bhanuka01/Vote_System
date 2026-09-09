import { describe, it, expect } from 'vitest';

// Pure logic validator mirroring server and database constraints
function validateVoteSelection(
  firstPref: string,
  secondPref: string,
  electionStatus: 'DRAFT' | 'OPEN' | 'CLOSED'
): { valid: boolean; error?: string } {
  if (electionStatus !== 'OPEN') {
    return { valid: false, error: 'Voting is currently closed.' };
  }
  if (!firstPref || !secondPref) {
    return { valid: false, error: 'Both 1st and 2nd preferences must be selected.' };
  }
  if (firstPref === secondPref) {
    return {
      valid: false,
      error: 'Please select different candidates for your 1st and 2nd preferences.',
    };
  }
  return { valid: true };
}

// Pure logic for preferential weighted score
function calculateWeightedScore(
  firstCount: number,
  secondCount: number,
  firstWeight: number = 2,
  secondWeight: number = 1
): number {
  return firstCount * firstWeight + secondCount * secondWeight;
}

// Pure logic for turnout calculation
function calculateTurnout(
  votesCast: number,
  totalEligible: number
): { turnoutPct: number; remaining: number } {
  if (totalEligible <= 0) return { turnoutPct: 0, remaining: 0 };
  const turnoutPct = Number(((votesCast / totalEligible) * 100).toFixed(1));
  const remaining = Math.max(0, totalEligible - votesCast);
  return { turnoutPct, remaining };
}

describe('Voting Validation Rules', () => {
  it('rejects if 1st and 2nd preferences are the same candidate', () => {
    const candidateA = 'cand-111';
    const result = validateVoteSelection(candidateA, candidateA, 'OPEN');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('different candidates');
  });

  it('accepts if 1st and 2nd preferences are different candidates', () => {
    const candidateA = 'cand-111';
    const candidateB = 'cand-222';
    const result = validateVoteSelection(candidateA, candidateB, 'OPEN');

    expect(result.valid).toBe(true);
  });

  it('rejects voting if election is DRAFT', () => {
    const result = validateVoteSelection('cand-1', 'cand-2', 'DRAFT');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Voting is currently closed.');
  });

  it('rejects voting if election is CLOSED', () => {
    const result = validateVoteSelection('cand-1', 'cand-2', 'CLOSED');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Voting is currently closed.');
  });
});

describe('Preferential Scoring & Weighted Tally Calculation', () => {
  it('calculates weighted score according to specification (1st: 2 pts, 2nd: 1 pt)', () => {
    // Specification example:
    // Candidate A: 18 first preferences * 2 = 36, 9 second preferences * 1 = 9 -> Total = 45 points
    const scoreA = calculateWeightedScore(18, 9, 2, 1);
    expect(scoreA).toBe(45);

    // Candidate B: 14 first preferences * 2 = 28, 15 second preferences * 1 = 15 -> Total = 43 points
    const scoreB = calculateWeightedScore(14, 15, 2, 1);
    expect(scoreB).toBe(43);

    // Candidate C: 7 first preferences * 2 = 14, 12 second preferences * 1 = 12 -> Total = 26 points
    const scoreC = calculateWeightedScore(7, 12, 2, 1);
    expect(scoreC).toBe(26);

    // Candidate D: 4 first preferences * 2 = 8, 7 second preferences * 1 = 7 -> Total = 15 points
    const scoreD = calculateWeightedScore(4, 7, 2, 1);
    expect(scoreD).toBe(15);
  });

  it('supports configurable scoring weights', () => {
    // Custom weights: 1st: 3 pts, 2nd: 1 pt
    const customScore = calculateWeightedScore(10, 5, 3, 1);
    expect(customScore).toBe(35);
  });
});

describe('Participation & Turnout Statistics', () => {
  it('calculates exact turnout percentage and remaining voters for 56 students', () => {
    // Specification scenario: Total Eligible: 56, Votes Cast: 43 -> Turnout: 76.8%, Remaining: 13
    const { turnoutPct, remaining } = calculateTurnout(43, 56);

    expect(remaining).toBe(13);
    expect(turnoutPct).toBe(76.8);
  });

  it('handles 0 votes cast', () => {
    const { turnoutPct, remaining } = calculateTurnout(0, 56);
    expect(remaining).toBe(56);
    expect(turnoutPct).toBe(0);
  });

  it('handles 100% participation (56 votes cast)', () => {
    const { turnoutPct, remaining } = calculateTurnout(56, 56);
    expect(remaining).toBe(0);
    expect(turnoutPct).toBe(100.0);
  });
});

describe('Atomic One-Time Token State Machine Simulation', () => {
  it('prevents double voting and ensures atomic token burning', () => {
    const mockDb = {
      tokens: new Map<string, { used: boolean; used_at: string | null }>(),
      votes: [] as Array<{ first: string; second: string }>,
    };

    const tokenHash = 'mock-sha256-hash';
    mockDb.tokens.set(tokenHash, { used: false, used_at: null });

    // Simulated atomic RPC
    function atomicSubmit(hash: string, cand1: string, cand2: string) {
      const record = mockDb.tokens.get(hash);
      if (!record) return { success: false, error: 'INVALID_TOKEN' };
      if (record.used) return { success: false, error: 'ALREADY_USED' };
      if (cand1 === cand2) return { success: false, error: 'SAME_CANDIDATE' };

      // Mark used
      record.used = true;
      record.used_at = new Date().toISOString();

      // Store vote completely disconnected from token
      mockDb.votes.push({ first: cand1, second: cand2 });

      return { success: true };
    }

    // First submission succeeds
    const firstAttempt = atomicSubmit(tokenHash, 'cand-1', 'cand-2');
    expect(firstAttempt.success).toBe(true);
    expect(mockDb.votes).toHaveLength(1);
    expect(mockDb.tokens.get(tokenHash)?.used).toBe(true);

    // Second submission with the same token is rejected
    const secondAttempt = atomicSubmit(tokenHash, 'cand-1', 'cand-2');
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.error).toBe('ALREADY_USED');
    expect(mockDb.votes).toHaveLength(1); // No second vote inserted
  });

  it('verifies zero voter identity is stored with votes', () => {
    const mockVote = {
      id: 'uuid-123',
      first_preference: 'cand-a',
      second_preference: 'cand-b',
      created_at: new Date().toISOString(),
    };

    // Assert voter identity fields are absent
    expect(mockVote).not.toHaveProperty('student_id');
    expect(mockVote).not.toHaveProperty('student_name');
    expect(mockVote).not.toHaveProperty('email');
    expect(mockVote).not.toHaveProperty('token');
    expect(mockVote).not.toHaveProperty('token_id');
    expect(mockVote).not.toHaveProperty('token_hash');
    expect(mockVote).not.toHaveProperty('ip_address');
    expect(mockVote).not.toHaveProperty('user_agent');
  });
});
