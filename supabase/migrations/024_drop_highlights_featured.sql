-- Retire the Top 10 Plays + Athlete of the Week features (owner request 2026-08-02).
-- Both tables verified empty before drop. Applied via Supabase MCP.
DROP TABLE IF EXISTS highlight_submissions;
DROP TABLE IF EXISTS featured_athlete;
