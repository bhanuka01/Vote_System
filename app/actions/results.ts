'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ElectionResults } from '@/lib/types';

/**
 * Fetches aggregated election results using the secret results token.
 */
export async function getResultsAction(resultsToken: string): Promise<ElectionResults | { error: string }> {
  if (!resultsToken || typeof resultsToken !== 'string') {
    return { error: 'Invalid or missing results access token.' };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.rpc('get_election_results', {
      p_results_token: resultsToken.trim(),
    });

    if (error) {
      console.error('[getResultsAction] RPC error:', error.message);
      return { error: 'Unable to load results. Please verify your access token.' };
    }

    if (!data || (data as { error?: string }).error) {
      return { error: (data as { error: string }).error || 'Access denied. Invalid results token.' };
    }

    return data as ElectionResults;
  } catch (err: unknown) {
    console.error('[getResultsAction] Exception:', err);
    return { error: 'An unexpected error occurred while loading results.' };
  }
}
