'use server';

import { hashToken } from '@/lib/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Candidate, TokenValidationResponse, VoteSubmissionResponse } from '@/lib/types';

/**
 * Validates a raw voting token and fetches candidate list for the voting ballot.
 */
export async function validateTokenAction(rawToken: string): Promise<{
  validation: TokenValidationResponse;
  candidates: Candidate[];
}> {
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      validation: {
        valid: false,
        reason: 'INVALID_TOKEN',
        message: 'This voting link is invalid. Please contact the election administrator.',
      },
      candidates: [],
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const tokenHash = hashToken(rawToken);

    // 1. Validate token via atomic SECURITY DEFINER RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'validate_voting_token',
      { p_token_hash: tokenHash }
    );

    if (rpcError) {
      console.error('[validateTokenAction] RPC Error:', rpcError.message);
      return {
        validation: {
          valid: false,
          reason: 'SERVER_ERROR',
          message: 'Unable to verify voting link at this moment. Please try again.',
        },
        candidates: [],
      };
    }

    const validation = rpcResult as TokenValidationResponse;

    // If token has already been used or results_token is not returned by RPC, fetch results_token
    if (validation.used || !validation.results_token) {
      const { data: settings } = await supabase
        .from('election_settings')
        .select('results_token')
        .eq('id', 1)
        .single();
      if (settings?.results_token) {
        validation.results_token = settings.results_token;
      }
    }

    if (!validation.valid) {
      return { validation, candidates: [] };
    }

    // 2. If valid, fetch active candidates
    const { data: candidatesData, error: candError } = await supabase
      .from('candidates')
      .select('id, name, bio, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (candError) {
      console.error('[validateTokenAction] Candidate fetch error:', candError.message);
      return {
        validation: {
          valid: false,
          reason: 'CANDIDATE_FETCH_ERROR',
          message: 'Unable to load candidate ballot. Please try again.',
        },
        candidates: [],
      };
    }

    return {
      validation,
      candidates: (candidatesData || []) as Candidate[],
    };
  } catch (err: unknown) {
    console.error('[validateTokenAction] Unexpected error:', err);
    return {
      validation: {
        valid: false,
        reason: 'SERVER_ERROR',
        message: 'Something went wrong. Please try again.',
      },
      candidates: [],
    };
  }
}

/**
 * Submits an anonymous vote atomically.
 */
export async function submitVoteAction(
  rawToken: string,
  firstPreference: string,
  secondPreference: string
): Promise<VoteSubmissionResponse> {
  // 1. Basic validation
  if (!rawToken || !firstPreference || !secondPreference) {
    return {
      success: false,
      error_code: 'MISSING_FIELDS',
      message: 'Please select both your 1st and 2nd preferences before submitting.',
    };
  }

  if (firstPreference === secondPreference) {
    return {
      success: false,
      error_code: 'IDENTICAL_PREFERENCES',
      message: 'Please select different candidates for your 1st and 2nd preferences.',
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const tokenHash = hashToken(rawToken);

    // Call atomic submit_vote RPC (which uses FOR UPDATE lock)
    const { data: result, error } = await supabase.rpc('submit_vote', {
      p_token_hash: tokenHash,
      p_first_preference: firstPreference,
      p_second_preference: secondPreference,
    });

    if (error) {
      console.error('[submitVoteAction] Database error:', error.message);
      return {
        success: false,
        error_code: 'SERVER_ERROR',
        message: 'Something went wrong while recording your vote. Please try again.',
      };
    }

    const response = result as VoteSubmissionResponse;

    // Attach results_token so the student can be redirected to live results
    if (response.success && !response.results_token) {
      const { data: settings } = await supabase
        .from('election_settings')
        .select('results_token')
        .eq('id', 1)
        .single();
      if (settings?.results_token) {
        response.results_token = settings.results_token;
      }
    }

    return response;
  } catch (err: unknown) {
    console.error('[submitVoteAction] Unexpected exception:', err);
    return {
      success: false,
      error_code: 'SERVER_ERROR',
      message: 'Something went wrong. Please try again.',
    };
  }
}
