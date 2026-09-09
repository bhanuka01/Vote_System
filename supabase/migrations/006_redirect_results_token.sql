-- ==============================================================================
-- 006_redirect_results_token.sql
-- Update validate_voting_token and submit_vote RPCs to return results_token
-- so clients can automatically redirect voters to the live results page.
-- ==============================================================================

-- 1. Update Validate Voting Token RPC
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
    SELECT status, title, results_token INTO v_election_record FROM public.election_settings WHERE id = 1;
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

    -- If token is already used, return results_token so user is auto-redirected to results
    IF v_token_record.used THEN
        RETURN jsonb_build_object(
            'valid', false,
            'used', true,
            'reason', 'ALREADY_USED',
            'results_token', v_election_record.results_token,
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
        'results_token', v_election_record.results_token,
        'message', 'Token is valid and ready for voting.'
    );
END;
$$;

-- 2. Update Submit Vote RPC to return results_token
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
    v_results_token TEXT;
    v_token_id UUID;
    v_token_used BOOLEAN;
    v_cand1_valid BOOLEAN;
    v_cand2_valid BOOLEAN;
BEGIN
    -- 1. Check election state and fetch results token
    SELECT status, results_token INTO v_election_status, v_results_token
    FROM public.election_settings
    WHERE id = 1;

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
            'results_token', v_results_token,
            'message', 'This voting link has already been used. Each voting link can only be used once.'
        );
    END IF;

    -- 5. Mark token as used
    UPDATE public.voting_tokens
    SET used = true,
        used_at = now()
    WHERE id = v_token_id;

    -- 6. Insert anonymous vote into votes table
    INSERT INTO public.votes (first_preference, second_preference, created_at)
    VALUES (p_first_preference, p_second_preference, now());

    -- 7. Return success with results_token for automatic redirect
    RETURN jsonb_build_object(
        'success', true,
        'results_token', v_results_token,
        'message', 'Your vote has been successfully recorded. Thank you for voting.'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error_code', 'SERVER_ERROR',
        'message', 'Something went wrong. Please try again.'
    );
END;
$$;
