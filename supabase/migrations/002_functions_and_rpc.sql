-- ==============================================================================
-- 002_functions_and_rpc.sql
-- Atomic voting RPC, validation, and aggregated results
-- ==============================================================================

-- 1. Validate Voting Token RPC
-- Callable by public to check if a voting link is valid and unused
CREATE OR REPLACE FUNCTION public.validate_voting_token(p_token_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token_record RECORD;
    v_election_record RECORD;
BEGIN
    -- Check election settings
    SELECT status, title INTO v_election_record FROM public.election_settings WHERE id = 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'reason', 'NO_ELECTION',
            'message', 'Election is not configured yet.'
        );
    END IF;

    -- Look up token
    SELECT id, used, used_at INTO v_token_record
    FROM public.voting_tokens
    WHERE token_hash = p_token_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'reason', 'INVALID_TOKEN',
            'message', 'This voting link is invalid. Please contact the election administrator.'
        );
    END IF;

    IF v_token_record.used THEN
        RETURN jsonb_build_object(
            'valid', false,
            'used', true,
            'reason', 'ALREADY_USED',
            'message', 'This voting link has already been used. Each voting link can only be used once.'
        );
    END IF;

    IF v_election_record.status <> 'OPEN' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'election_status', v_election_record.status,
            'reason', 'ELECTION_NOT_OPEN',
            'message', CASE
                WHEN v_election_record.status = 'DRAFT' THEN 'Voting has not started yet.'
                ELSE 'Voting is currently closed.'
            END
        );
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'used', false,
        'election_status', v_election_record.status,
        'election_title', v_election_record.title,
        'message', 'Token is valid and ready for voting.'
    );
END;
$$;

-- 2. Atomic Vote Submission RPC
-- Runs atomically with row-level locking (FOR UPDATE)
-- Guarantees that concurrent requests or double clicks CANNOT cast two votes with the same token
CREATE OR REPLACE FUNCTION public.submit_vote(
    p_token_hash TEXT,
    p_first_preference UUID,
    p_second_preference UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_election_status TEXT;
    v_token_id UUID;
    v_token_used BOOLEAN;
    v_cand1_valid BOOLEAN;
    v_cand2_valid BOOLEAN;
BEGIN
    -- 1. Check election state
    SELECT status INTO v_election_status FROM public.election_settings WHERE id = 1;
    IF v_election_status IS NULL OR v_election_status <> 'OPEN' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ELECTION_NOT_OPEN',
            'message', 'Voting is currently closed.'
        );
    END IF;

    -- 2. Validate distinct preferences
    IF p_first_preference = p_second_preference THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'IDENTICAL_PREFERENCES',
            'message', 'Please select different candidates for your 1st and 2nd preferences.'
        );
    END IF;

    -- 3. Validate candidates exist and are active
    SELECT EXISTS (SELECT 1 FROM public.candidates WHERE id = p_first_preference AND is_active = true) INTO v_cand1_valid;
    SELECT EXISTS (SELECT 1 FROM public.candidates WHERE id = p_second_preference AND is_active = true) INTO v_cand2_valid;

    IF NOT (v_cand1_valid AND v_cand2_valid) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_CANDIDATE',
            'message', 'One or more selected candidates are invalid or inactive.'
        );
    END IF;

    -- 4. Lock token row to prevent race conditions (FOR UPDATE)
    SELECT id, used INTO v_token_id, v_token_used
    FROM public.voting_tokens
    WHERE token_hash = p_token_hash
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_TOKEN',
            'message', 'This voting link is invalid. Please contact the election administrator.'
        );
    END IF;

    IF v_token_used THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ALREADY_USED',
            'message', 'This voting link has already been used. Each voting link can only be used once.'
        );
    END IF;

    -- 5. Mark token as used
    UPDATE public.voting_tokens
    SET used = true,
        used_at = now()
    WHERE id = v_token_id;

    -- 6. Insert anonymous vote into votes table
    -- ZERO voter identity, token ID, or network metadata stored
    INSERT INTO public.votes (first_preference, second_preference, created_at)
    VALUES (p_first_preference, p_second_preference, now());

    -- 7. Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Your vote has been successfully recorded. Thank you for voting. Your voting link can no longer be used.'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error_code', 'SERVER_ERROR',
        'message', 'Something went wrong. Please try again.'
    );
END;
$$;

-- 3. Get Election Results RPC
-- Protected by secret results token or admin authentication
CREATE OR REPLACE FUNCTION public.get_election_results(p_results_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings RECORD;
    v_total_votes INTEGER;
    v_turnout_pct NUMERIC(5,2);
    v_candidate_results JSONB;
BEGIN
    -- Fetch election settings
    SELECT title, status, total_eligible_voters, results_token, first_pref_weight, second_pref_weight
    INTO v_settings
    FROM public.election_settings
    WHERE id = 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Election settings not configured.');
    END IF;

    -- Validate results token unless called by an authenticated admin
    IF auth.role() <> 'authenticated' AND (p_results_token IS NULL OR p_results_token <> v_settings.results_token) THEN
        RETURN jsonb_build_object('error', 'Unauthorized: Invalid results access token.');
    END IF;

    -- Total votes cast
    SELECT COUNT(*) INTO v_total_votes FROM public.votes;

    -- Turnout calculation
    IF v_settings.total_eligible_voters > 0 THEN
        v_turnout_pct := ROUND((v_total_votes::numeric / v_settings.total_eligible_voters::numeric) * 100.0, 1);
    ELSE
        v_turnout_pct := 0.0;
    END IF;

    -- Candidate tally breakdown
    SELECT COALESCE(jsonb_agg(cand_row), '[]'::jsonb)
    INTO v_candidate_results
    FROM (
        SELECT
            c.id,
            c.name,
            c.bio,
            c.is_active,
            COALESCE(fp.first_count, 0) AS first_preference_count,
            COALESCE(sp.second_count, 0) AS second_preference_count,
            (COALESCE(fp.first_count, 0) * v_settings.first_pref_weight +
             COALESCE(sp.second_count, 0) * v_settings.second_pref_weight) AS weighted_score
        FROM public.candidates c
        LEFT JOIN (
            SELECT first_preference, COUNT(*) AS first_count
            FROM public.votes
            GROUP BY first_preference
        ) fp ON fp.first_preference = c.id
        LEFT JOIN (
            SELECT second_preference, COUNT(*) AS second_count
            FROM public.votes
            GROUP BY second_preference
        ) sp ON sp.second_preference = c.id
        WHERE c.is_active = true
        ORDER BY weighted_score DESC, first_preference_count DESC, c.name ASC
    ) cand_row;

    RETURN jsonb_build_object(
        'title', v_settings.title,
        'status', v_settings.status,
        'total_eligible_voters', v_settings.total_eligible_voters,
        'votes_cast', v_total_votes,
        'remaining_voters', GREATEST(0, v_settings.total_eligible_voters - v_total_votes),
        'turnout_percentage', v_turnout_pct,
        'first_pref_weight', v_settings.first_pref_weight,
        'second_pref_weight', v_settings.second_pref_weight,
        'candidates', v_candidate_results,
        'last_updated', now()
    );
END;
$$;

-- 4. Admin Token Overview Function
-- Authenticated admins only: view token usage status without exposing vote choices
CREATE OR REPLACE FUNCTION public.get_admin_token_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tokens JSONB;
BEGIN
    IF auth.role() <> 'authenticated' THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    SELECT COALESCE(jsonb_agg(token_row ORDER BY student_label ASC, created_at ASC), '[]'::jsonb)
    INTO v_tokens
    FROM (
        SELECT
            id,
            student_label,
            used,
            used_at,
            created_at,
            substring(token_hash FROM 1 FOR 8) || '...' AS hash_prefix
        FROM public.voting_tokens
    ) token_row;

    RETURN v_tokens;
END;
$$;
