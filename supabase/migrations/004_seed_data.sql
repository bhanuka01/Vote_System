-- ==============================================================================
-- 004_seed_data.sql
-- Seed initial settings and candidates for FMIS 45 Batch Representative Election
-- ==============================================================================

-- Insert default election settings if not existing
INSERT INTO public.election_settings (
    id,
    title,
    status,
    total_eligible_voters,
    results_token,
    first_pref_weight,
    second_pref_weight
)
VALUES (
    1,
    'FMIS 45 Batch Representative Election',
    'DRAFT',
    56,
    'FMIS45-' || substring(md5(random()::text) from 1 for 16),
    2,
    1
)
ON CONFLICT (id) DO NOTHING;

-- Insert initial candidates as specified in requirements
INSERT INTO public.candidates (name, bio, display_order, is_active)
VALUES
    ('Kasun Perera', 'Passionate about student welfare, academic support workshops, and batch cohesion.', 1, true),
    ('Nimal Fernando', 'Dedicated to faculty-student communication, transparent updates, and resource sharing.', 2, true),
    ('Sahan Jayasuriya', 'Experienced project organizer focused on career networking events and sports meets.', 3, true),
    ('Chamod Silva', 'Committed to peer mentorship, tech infrastructure improvements, and inclusive representation.', 4, true)
ON CONFLICT DO NOTHING;
