import { NextResponse } from "next/server";

import { getCatalogSongs } from "@/lib/playback";

export async function GET() {
  const songs = await getCatalogSongs();

  if (songs.length === 0) {
    return NextResponse.json({ song: null, queue: [] });
  }

  return NextResponse.json({
    song: songs[0],
    queue: songs,
  });
}
