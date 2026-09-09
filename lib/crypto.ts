import { createHash, randomBytes } from 'crypto';
import { GeneratedTokenItem } from './types';

/**
 * Computes a standard SHA-256 hex hash of a string (such as a raw voting token).
 * Used to store only hashes in the database while users hold the unhashed private link.
 */
export function hashToken(rawToken: string): string {
  if (!rawToken || typeof rawToken !== 'string') {
    return '';
  }
  return createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Generates a cryptographically secure random token (32 hex characters = 128 bits of entropy).
 * Suitable for URL paths (/vote/{token}).
 */
export function generateSecureToken(byteLength: number = 16): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generates a human-distinguishable results view token.
 */
export function generateResultsToken(prefix: string = 'FMIS45'): string {
  const randomSuffix = randomBytes(8).toString('hex');
  return `${prefix}-${randomSuffix}`;
}

/**
 * Generates a batch of private voting tokens with student labels (e.g. 56 students).
 */
export function generateBatchTokens(
  count: number = 56,
  baseUrl: string = '',
  labelPrefix: string = 'Student'
): GeneratedTokenItem[] {
  const tokens: GeneratedTokenItem[] = [];
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  for (let i = 1; i <= count; i++) {
    const studentNumber = String(i).padStart(2, '0');
    const studentLabel = `${labelPrefix} ${studentNumber}`;
    const rawToken = generateSecureToken(16);
    const tokenHash = hashToken(rawToken);
    const voteUrl = `${cleanBaseUrl}/vote/${rawToken}`;

    tokens.push({
      student_label: studentLabel,
      raw_token: rawToken,
      token_hash: tokenHash,
      vote_url: voteUrl,
      used: false,
    });
  }

  return tokens;
}
