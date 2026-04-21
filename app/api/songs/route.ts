import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { SongModel } from "@/models/Song";
import { AlbumModel } from "@/models/Album";

export async function GET() {
  await connectToDatabase();
  const songs = await SongModel.find().sort({ createdAt: 1 }).lean();

  const albumIds = [...new Set(songs.map((song) => String(song.albumId)))];
  const albums = await AlbumModel.find({ _id: { $in: albumIds } }).lean();
  const albumMap = new Map(albums.map((album) => [String(album._id), album]));

  return NextResponse.json({
    songs: songs.map((song) => {
      const album = albumMap.get(String(song.albumId));
      return {
        id: String(song._id),
        title: song.title,
        albumId: String(song.albumId),
        albumName: album?.name ?? "Unknown album",
        audioFileId: String(song.audioFileId),
        audioUrl: `/api/media/${String(song.audioFileId)}`,
      };
    }),
  });
}
