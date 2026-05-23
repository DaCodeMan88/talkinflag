import { NextResponse } from "next/server";
import { getEpisodes } from "@/lib/youtube";

export async function GET() {
  const episodes = await getEpisodes(50);
  return NextResponse.json(episodes);
}
