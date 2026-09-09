-- ==============================================================================
-- 001_initial_schema.sql
-- Anonymous Batch Representative Voting System (FMIS 45)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Candidates Table
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for candidates
CREATE INDEX IF NOT EXISTS idx_candidates_is_active ON public.candidates(is_active);

-- 2. Election Settings Table (Single-row configuration)
CREATE TABLE IF NOT EXISTS public.election_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    title TEXT NOT NULL DEFAULT 'FMIS 45 Batch Representative Election',
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED')),
    total_eligible_voters INTEGER NOT NULL DEFAULT 56,
    results_token TEXT NOT NULL,
    first_pref_weight INTEGER NOT NULL DEFAULT 2,
    second_pref_weight INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Voting Tokens Table (Authorization only; strictly separated from vote data)
-- IMPORTANT: Only SHA-256 hashes of tokens are stored here.
-- Raw tokens are never stored in the database.
CREATE TABLE IF NOT EXISTS public.voting_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT NOT NULL UNIQUE,
    student_label TEXT, -- e.g. 'Student 01' ... 'Student 56' for link distribution
    used BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast lookup and status filtering
CREATE INDEX IF NOT EXISTS idx_voting_tokens_hash ON public.voting_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_voting_tokens_used ON public.voting_tokens(used);

-- 4. Votes Table (Ballot box)
-- CRITICAL PRIVACY REQUIREMENT:
-- DO NOT store student ID, student name, email, token ID, token hash, IP address, or user agent.
-- This table is completely disconnected from voting_tokens and any voter identity.
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_preference UUID NOT NULL REFERENCES public.candidates(id),
    second_preference UUID NOT NULL REFERENCES public.candidates(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT chk_distinct_preferences CHECK (first_preference <> second_preference)
);

-- Indexes for counting preferences
CREATE INDEX IF NOT EXISTS idx_votes_first_preference ON public.votes(first_preference);
CREATE INDEX IF NOT EXISTS idx_votes_second_preference ON public.votes(second_preference);
