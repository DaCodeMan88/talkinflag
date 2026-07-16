#!/usr/bin/env npx tsx
/**
 * Repeatable E2E verification that a signed-in user with a fully-claimed
 * player profile sees the claimed dashboard ("✓ Claimed" card, no claim
 * prompts) on production.
 *
 * `setup` creates a disposable confirmed auth user + a claimed test player
 * (is_approved=false keeps it out of public listings; the dashboard query in
 * src/app/dashboard/page.tsx filters only on claimed_by + is_claimed, never
 * is_approved) and prints a magic link. A human then walks the link through
 * the live site. `teardown` removes everything. Both commands are idempotent
 * and safe to re-run after a crashed session.
 *
 * This script only writes DB/auth state — it never browses.
 *
 * Usage:
 *   npx tsx scripts/e2e-claim-check.ts setup
 *   npx tsx scripts/e2e-claim-check.ts teardown
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error("Missing Supabase env"); process.exit(1); }
const db = createClient(url, key);

const TEST_EMAIL = "e2e-claim-check@talkinflag.com";
const TEST_FIRST = "TF-E2E";
const TEST_LAST = "ClaimCheck";

async function findUserIdByEmail(): Promise<string | null> {
  // listUsers has no email filter param on this SDK version; page through.
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === TEST_EMAIL);
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
    page++;
  }
}

async function deleteTestPlayers(): Promise<void> {
  // claim_events / profile_change_requests rows cascade on player delete,
  // but claim_events is cleared explicitly to match teardown expectations.
  const { data: rows, error } = await db
    .from("players")
    .select("id")
    .eq("first_name", TEST_FIRST)
    .eq("last_name", TEST_LAST);
  if (error) throw error;
  for (const row of rows ?? []) {
    const ce = await db.from("claim_events").delete().eq("player_id", row.id);
    if (ce.error) throw ce.error;
    const pd = await db.from("players").delete().eq("id", row.id);
    if (pd.error) throw pd.error;
    console.log("deleted stale test player", row.id);
  }
}

async function setup() {
  // Reuse the auth user if a prior run left it behind.
  let userId = await findUserIdByEmail();
  if (userId) {
    console.log("reusing existing auth user", userId);
  } else {
    const { data: created, error: uErr } = await db.auth.admin.createUser({
      email: TEST_EMAIL,
      email_confirm: true,
    });
    if (uErr) throw uErr;
    userId = created.user.id;
    console.log("created auth user", userId);
  }

  // Idempotent: clear any leftover test player before inserting a fresh one.
  await deleteTestPlayers();

  const { data: player, error: pErr } = await db
    .from("players")
    .insert({
      first_name: TEST_FIRST,
      last_name: TEST_LAST,
      position: "WR",
      level: "college",
      is_approved: false, // keep out of public listings; dashboard query does not filter on it
      is_claimed: true,
      claim_pending: false,
      claimed_by: userId,
      claimed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (pErr) throw pErr;

  const { data: link, error: lErr } = await db.auth.admin.generateLink({
    type: "magiclink",
    email: TEST_EMAIL,
    options: { redirectTo: "https://talkinflag.com/auth/callback?next=/dashboard" },
  });
  if (lErr) throw lErr;

  console.log("player:", player.id);
  console.log("magic link:", link.properties.action_link);
  console.log("\nWalk the link through the live site, then run:");
  console.log("  npx tsx scripts/e2e-claim-check.ts teardown");
}

async function teardown() {
  await deleteTestPlayers();
  // Delete the auth user even if the player row was already gone (orphan cleanup).
  const userId = await findUserIdByEmail();
  if (userId) {
    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) throw error;
    console.log("deleted auth user", userId);
  } else {
    console.log("no auth user to delete");
  }
  console.log("teardown complete");
}

const cmd = process.argv[2];
if (cmd === "setup") setup().catch((e) => { console.error(e); process.exit(1); });
else if (cmd === "teardown") teardown().catch((e) => { console.error(e); process.exit(1); });
else { console.log("usage: npx tsx scripts/e2e-claim-check.ts setup|teardown"); process.exit(1); }
