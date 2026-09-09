import { describe, it, expect } from 'vitest';
import {
  hashToken,
  generateSecureToken,
  generateBatchTokens,
  generateResultsToken,
} from '../lib/crypto';

describe('Cryptographic Token Utilities', () => {
  it('generates 32-character hex tokens with high entropy', () => {
    const token1 = generateSecureToken(16);
    const token2 = generateSecureToken(16);

    expect(token1).toHaveLength(32);
    expect(token2).toHaveLength(32);
    expect(token1).not.toBe(token2);
    expect(/^[0-9a-f]{32}$/.test(token1)).toBe(true);
  });

  it('hashes tokens consistently using SHA-256', () => {
    const rawToken = 'test-token-secret-123';
    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);

    // SHA-256 produces 64 hex characters (256 bits)
    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
  });

  it('produces completely different hashes for different tokens', () => {
    const hashA = hashToken('token-a');
    const hashB = hashToken('token-b');

    expect(hashA).not.toBe(hashB);
  });

  it('generates batch of exactly 56 unique voting tokens with student labels', () => {
    const batch = generateBatchTokens(56, 'https://example.com', 'Student');

    expect(batch).toHaveLength(56);

    const labels = new Set(batch.map((b) => b.student_label));
    const tokens = new Set(batch.map((b) => b.raw_token));
    const hashes = new Set(batch.map((b) => b.token_hash));

    // Must all be unique
    expect(labels.size).toBe(56);
    expect(tokens.size).toBe(56);
    expect(hashes.size).toBe(56);

    // Check first and last labels
    expect(batch[0].student_label).toBe('Student 01');
    expect(batch[55].student_label).toBe('Student 56');

    // Check URL structure
    expect(batch[0].vote_url).toMatch(/^https:\/\/example\.com\/vote\/[0-9a-f]{32}$/);
  });

  it('generates results view tokens with custom prefix', () => {
    const resultsToken = generateResultsToken('FMIS45');

    expect(resultsToken.startsWith('FMIS45-')).toBe(true);
    expect(resultsToken.length).toBeGreaterThan(12);
  });
});
