import { z } from "zod";
import { NextResponse } from "next/server";

import { getCatalogSongs, pickNextSong } from "@/lib/playback";

const payloadSchema = z.object({
  mode: z.enum(["album-loop", "random-loop"]),
  currentSongId: z.string().optional().nullable(),
  selectedAlbumId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const songs = await getCatalogSongs();
    const nextSong = pickNextSong({
      songs,
      mode: payload.mode,
      currentSongId: payload.currentSongId,
      selectedAlbumId: payload.selectedAlbumId,
    });

    return NextResponse.json({
      song: nextSong,
      queue: songs,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not resolve next song" }, { status: 500 });
  }
}
