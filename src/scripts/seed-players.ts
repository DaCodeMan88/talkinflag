// Seed script — run with: npx tsx src/scripts/seed-players.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const players = [
  {
    first_name: "Ambra",
    last_name: "Marcucci",
    position: "QB",
    level: "national",
    school_or_team: "Italian National Team",
    country: "Italy",
    country_code: "IT",
    bio: "Co-host of Talkin Flag. Member of the Italian National Flag Football Team.",
    instagram: "@ambramarcucci",
    is_verified: true,
    ranking_national: 1,
  },
  {
    first_name: "Tika",
    last_name: "Marcucci",
    position: "WR",
    level: "national",
    school_or_team: "Italian National Team",
    country: "Italy",
    country_code: "IT",
    bio: "Co-host of Talkin Flag. Member of the Italian National Flag Football Team.",
    instagram: "@tikamarcucci",
    is_verified: true,
    ranking_national: 2,
  },
];

async function seed() {
  const { error } = await supabase.from("players").upsert(players, { onConflict: "first_name,last_name" });

  if (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
  console.log(`Seeded ${players.length} players successfully`);
}

seed();
