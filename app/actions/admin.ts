'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateBatchTokens, generateResultsToken } from '@/lib/crypto';
import {
  Candidate,
  ElectionSettings,
  ElectionStatus,
  GeneratedTokenItem,
  VotingTokenRecord,
} from '@/lib/types';
import { revalidatePath } from 'next/cache';

/**
 * Checks if the current user session is an authenticated administrator.
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return !error && !!user;
  } catch {
    return false;
  }
}

/**
 * Fetches complete election configuration, candidate list, and summary stats for the admin.
 */
export async function getAdminElectionData(): Promise<{
  settings: ElectionSettings | null;
  candidates: Candidate[];
  stats: {
    totalEligible: number;
    votesCast: number;
    remaining: number;
    turnoutPct: number;
    totalTokens: number;
    usedTokens: number;
  };
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('election_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Settings fetch error:', settingsError.message);
    }

    // 2. Fetch candidates
    const { data: candidatesData, error: candError } = await supabase
      .from('candidates')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (candError) {
      console.error('Candidates fetch error:', candError.message);
    }

    // 3. Count votes cast
    const { count: votesCastCount, error: votesError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    if (votesError) {
      console.error('Votes count error:', votesError.message);
    }

    // 4. Token stats
    const { count: totalTokensCount } = await supabase
      .from('voting_tokens')
      .select('*', { count: 'exact', head: true });

    const { count: usedTokensCount } = await supabase
      .from('voting_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('used', true);

    const totalEligible = settingsData?.total_eligible_voters || 56;
    const votesCast = votesCastCount || 0;
    const remaining = Math.max(0, totalEligible - votesCast);
    const turnoutPct =
      totalEligible > 0
        ? Number(((votesCast / totalEligible) * 100).toFixed(1))
        : 0;

    return {
      settings: (settingsData as ElectionSettings) || null,
      candidates: (candidatesData as Candidate[]) || [],
      stats: {
        totalEligible,
        votesCast,
        remaining,
        turnoutPct,
        totalTokens: totalTokensCount || 0,
        usedTokens: usedTokensCount || 0,
      },
    };
  } catch (err: unknown) {
    console.error('[getAdminElectionData] Error:', err);
    return {
      settings: null,
      candidates: [],
      stats: {
        totalEligible: 56,
        votesCast: 0,
        remaining: 56,
        turnoutPct: 0,
        totalTokens: 0,
        usedTokens: 0,
      },
      error: 'Unable to load administration data.',
    };
  }
}

/**
 * Updates election status (DRAFT, OPEN, CLOSED).
 */
export async function updateElectionStatusAction(
  status: ElectionStatus
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('election_settings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    revalidatePath('/results');
    return { success: true, message: `Election status updated to ${status}.` };
  } catch (err: unknown) {
    return { success: false, message: 'Failed to update election status.' };
  }
}

/**
 * Updates election general settings (title, voter capacity, scoring weights).
 */
export async function updateElectionSettingsAction(payload: {
  title: string;
  total_eligible_voters: number;
  first_pref_weight: number;
  second_pref_weight: number;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('election_settings')
      .update({
        title: payload.title,
        total_eligible_voters: payload.total_eligible_voters,
        first_pref_weight: payload.first_pref_weight,
        second_pref_weight: payload.second_pref_weight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: 'Election settings updated successfully.' };
  } catch (err: unknown) {
    return { success: false, message: 'Failed to save election settings.' };
  }
}

/**
 * Generates a new results view token.
 */
export async function regenerateResultsTokenAction(): Promise<{
  success: boolean;
  newToken?: string;
  message: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const newToken = generateResultsToken('FMIS45');

    const { error } = await supabase
      .from('election_settings')
      .update({
        results_token: newToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return {
      success: true,
      newToken,
      message: 'New results access token generated successfully.',
    };
  } catch {
    return { success: false, message: 'Failed to regenerate results token.' };
  }
}

/**
 * Adds a new candidate.
 */
export async function addCandidateAction(
  name: string,
  bio?: string
): Promise<{ success: boolean; message: string }> {
  if (!name || name.trim().length === 0) {
    return { success: false, message: 'Candidate name is required.' };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('candidates').insert({
      name: name.trim(),
      bio: bio ? bio.trim() : null,
      is_active: true,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/admin/candidates');
    return { success: true, message: 'Candidate added successfully.' };
  } catch {
    return { success: false, message: 'Failed to add candidate.' };
  }
}

/**
 * Edits a candidate.
 */
export async function editCandidateAction(
  id: string,
  name: string,
  bio?: string,
  is_active: boolean = true
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('candidates')
      .update({
        name: name.trim(),
        bio: bio ? bio.trim() : null,
        is_active,
      })
      .eq('id', id);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/admin/candidates');
    return { success: true, message: 'Candidate updated successfully.' };
  } catch {
    return { success: false, message: 'Failed to update candidate.' };
  }
}

/**
 * Toggles active state of a candidate.
 */
export async function toggleCandidateActiveAction(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('candidates')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/admin/candidates');
    return {
      success: true,
      message: `Candidate ${is_active ? 'activated' : 'deactivated'}.`,
    };
  } catch {
    return { success: false, message: 'Failed to toggle candidate state.' };
  }
}

/**
 * Generates batch voting tokens (e.g. 56 students).
 * Inserts SHA-256 hashes into voting_tokens.
 * Returns the raw tokens and full URLs for immediate CSV export/copy.
 */
export async function generateVotingTokensAction(
  count: number = 56,
  baseUrl: string = ''
): Promise<{
  success: boolean;
  tokens: GeneratedTokenItem[];
  message: string;
}> {
  try {
    const appUrl =
      baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generate cryptographic tokens
    const generatedItems = generateBatchTokens(count, appUrl, 'Student');

    // Prepare rows for DB (storing only SHA-256 hashes)
    const rowsToInsert = generatedItems.map((item) => ({
      token_hash: item.token_hash,
      student_label: item.student_label,
      used: false,
    }));

    // Insert into Supabase
    let client;
    try {
      client = createAdminClient();
    } catch {
      client = await createServerSupabaseClient();
    }

    const { error } = await client.from('voting_tokens').insert(rowsToInsert);

    if (error) {
      console.error('[generateVotingTokensAction] DB Error:', error.message);
      return {
        success: false,
        tokens: [],
        message: `Database error: ${error.message}`,
      };
    }

    revalidatePath('/admin/voting-links');
    return {
      success: true,
      tokens: generatedItems,
      message: `Successfully generated and saved ${count} voting tokens.`,
    };
  } catch (err: unknown) {
    console.error('[generateVotingTokensAction] Exception:', err);
    return {
      success: false,
      tokens: [],
      message: 'Failed to generate voting tokens.',
    };
  }
}

/**
 * Fetches the token usage tracker list (student_label, used, used_at, hash snippet).
 */
export async function getAdminTokensAction(): Promise<VotingTokenRecord[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('voting_tokens')
      .select('id, student_label, token_hash, used, used_at, created_at')
      .order('student_label', { ascending: true });

    if (error) {
      console.error('[getAdminTokensAction] Error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      student_label: row.student_label,
      token_hash: row.token_hash,
      used: row.used,
      used_at: row.used_at,
      created_at: row.created_at,
      hash_prefix: row.token_hash ? `${row.token_hash.substring(0, 8)}...` : '',
    }));
  } catch {
    return [];
  }
}

/**
 * Resets election data: clears test votes, optionally clears/resets tokens, and sets status to DRAFT.
 */
export async function resetElectionDataAction(
  clearTokens: boolean = true
): Promise<{ success: boolean; message: string }> {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, message: 'Unauthorized. Admin session required.' };
  }

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Try invoking reset_election_data RPC if installed
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'reset_election_data',
      { p_clear_tokens: clearTokens }
    );

    if (!rpcError && rpcData && (rpcData as { success: boolean }).success) {
      revalidatePath('/admin');
      revalidatePath('/admin/settings');
      revalidatePath('/admin/voting-links');
      revalidatePath('/results');
      return rpcData as { success: boolean; message: string };
    }

    // 2. Fallback to direct operations via admin client if RPC is not yet created
    let client;
    try {
      client = createAdminClient();
    } catch {
      client = supabase;
    }

    // Delete all votes
    await client.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Clear or reset tokens
    if (clearTokens) {
      await client.from('voting_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } else {
      await client
        .from('voting_tokens')
        .update({ used: false, used_at: null })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // Revert status to DRAFT
    await client
      .from('election_settings')
      .update({ status: 'DRAFT', updated_at: new Date().toISOString() })
      .eq('id', 1);

    revalidatePath('/admin');
    revalidatePath('/admin/settings');
    revalidatePath('/admin/voting-links');
    revalidatePath('/results');

    return {
      success: true,
      message: 'Election reset successfully. All votes cleared and status returned to DRAFT.',
    };
  } catch (err: unknown) {
    console.error('[resetElectionDataAction] Error:', err);
    return { success: false, message: 'Failed to reset election data.' };
  }
}

