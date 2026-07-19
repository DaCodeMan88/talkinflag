-- 017_ranking_snapshot_cohort.sql
-- Rankings are now computed per cohort (hs = 18U, cw = college/world).
alter table ranking_snapshots add column if not exists cohort text;
