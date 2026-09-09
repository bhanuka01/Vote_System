-- ==============================================================================
-- 003_rls_policies.sql
-- Row Level Security (RLS) policies for maximum anonymity and security
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Candidates Policies
-- ------------------------------------------------------------------------------
-- Public can view candidates when voting or viewing results
CREATE POLICY "Public can view active candidates"
ON public.candidates
FOR SELECT
TO anon, authenticated
USING (is_active = true OR auth.role() = 'authenticated');

-- Authenticated admins have full management
CREATE POLICY "Admin full access on candidates"
ON public.candidates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. Election Settings Policies
-- ------------------------------------------------------------------------------
-- Public can view election info
CREATE POLICY "Public can read election settings"
ON public.election_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated admins can update settings
CREATE POLICY "Admin update election settings"
ON public.election_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. Voting Tokens Policies
-- CRITICAL SECURITY:
-- Anon users CANNOT SELECT, INSERT, UPDATE, OR DELETE directly.
-- Public operations are exclusively routed through SECURITY DEFINER RPCs
-- (validate_voting_token and submit_vote).
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on voting_tokens"
ON public.voting_tokens
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. Votes Policies
-- CRITICAL ANONYMITY & INTEGRITY:
-- Direct access is blocked for anon users.
-- Insertion happens exclusively via submit_vote RPC.
-- Deletion or modification of votes is disallowed even for admins to preserve integrity.
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin can read votes for audit"
ON public.votes
FOR SELECT
TO authenticated
USING (true);

-- Explicitly revoke public access to tables directly as defense-in-depth
REVOKE ALL ON public.voting_tokens FROM anon;
REVOKE ALL ON public.votes FROM anon;

-- Grant execute permissions on RPCs to anon and authenticated
GRANT EXECUTE ON FUNCTION public.validate_voting_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_vote(TEXT, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_results(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_token_overview() TO authenticated;
