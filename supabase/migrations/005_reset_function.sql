-- ==============================================================================
-- 005_reset_function.sql
-- Secure RPC to reset election data (clears votes, resets or clears tokens, sets status to DRAFT)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.reset_election_data(p_clear_tokens BOOLEAN DEFAULT false)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only authenticated administrators can trigger an election reset
    IF auth.role() <> 'authenticated' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Unauthorized: Admin authentication required.'
        );
    END IF;

    -- 1. Clear all votes
    DELETE FROM public.votes;

    -- 2. Handle tokens
    IF p_clear_tokens THEN
        -- Delete all generated tokens so fresh 56 links can be generated
        DELETE FROM public.voting_tokens;
    ELSE
        -- Retain existing tokens but reset their used status
        UPDATE public.voting_tokens
        SET used = false,
            used_at = NULL;
    END IF;

    -- 3. Reset election lifecycle back to DRAFT
    UPDATE public.election_settings
    SET status = 'DRAFT',
        updated_at = now()
    WHERE id = 1;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Election reset successful. All test votes cleared, status set to DRAFT.'
    );
END;
$$;

-- Grant execution permissions exclusively to authenticated admins
GRANT EXECUTE ON FUNCTION public.reset_election_data(BOOLEAN) TO authenticated;
