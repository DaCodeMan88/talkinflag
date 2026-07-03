alter table players add column is_approved boolean not null default true;
-- default TRUE so every existing path (admin add, import scripts, the 374
-- already-live players) keeps working without changes; only the new
-- self-submit route explicitly opts a row into false/pending.

alter table claim_events add column note text;
-- optional context string, e.g. 'self-registered new profile', shown in
-- the admin Recent Claims panel to distinguish from an existing-profile claim
