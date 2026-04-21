import { ObjectId } from "mongodb";
import { z } from "zod";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { uploadFileToGridFs } from "@/lib/media";
import { normalizeMusicLinks } from "@/lib/musicLinks";
import { AlbumModel } from "@/models/Album";
import { SongModel } from "@/models/Song";

const songTitleSchema = z.string().trim().min(1).max(160);

function parseCustomLinks(rawLabels: string, rawUrls: string) {
  const labels = rawLabels
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const urls = rawUrls
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  return labels
    .map((label, index) => ({ label, url: urls[index] ?? "" }))
    .filter((entry) => Boolean(entry.url));
}

type Params = {
  params: Promise<{ albumId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { albumId } = await params;

  if (!ObjectId.isValid(albumId)) {
    return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
  }

  await connectToDatabase();
  const songs = await SongModel.find({ albumId }).sort({ orderIndex: 1, createdAt: 1 }).lean();

  return NextResponse.json({
    songs: songs.map((song) => ({
      id: String(song._id),
      title: song.title,
      albumId: String(song.albumId),
      audioFileId: String(song.audioFileId),
      audioUrl: `/api/media/${String(song.audioFileId)}`,
      orderIndex: song.orderIndex,
      isAdminFavorite: Boolean(song.isAdminFavorite),
      links: song.links ?? {},
    })),
  });
}

export async function POST(request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const { albumId } = await params;

  if (!ObjectId.isValid(albumId)) {
    return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const title = songTitleSchema.parse(formData.get("title"));
    const audio = formData.get("audio");
    const links = normalizeMusicLinks({
      youtubeMusic: String(formData.get("youtubeMusic") ?? ""),
      deezer: String(formData.get("deezer") ?? ""),
      spotify: String(formData.get("spotify") ?? ""),
      customLinks: parseCustomLinks(
        String(formData.get("customLabels") ?? ""),
        String(formData.get("customUrls") ?? ""),
      ),
    });

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    if (!audio.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Audio must be an audio file" }, { status: 400 });
    }

    if (audio.size > 32 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio must be <= 32MB" }, { status: 400 });
    }

    await connectToDatabase();
    const album = await AlbumModel.findById(albumId).lean();
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const audioFileId = await uploadFileToGridFs(audio, {
      uploadedBy: session.adminId,
      kind: "song-audio",
    });

    const maxOrderSong = await SongModel.findOne({ albumId }).sort({ orderIndex: -1 }).lean();
    const orderIndex = maxOrderSong ? maxOrderSong.orderIndex + 1 : 0;

    const song = await SongModel.create({
      title,
      albumId,
      audioFileId,
      audioMimeType: audio.type,
      orderIndex,
      isAdminFavorite: false,
      links,
    });

    return NextResponse.json(
      {
        song: {
          id: String(song._id),
          title: song.title,
          albumId: String(song.albumId),
          audioFileId: String(song.audioFileId),
          audioUrl: `/api/media/${String(song.audioFileId)}`,
          orderIndex: song.orderIndex,
          isAdminFavorite: Boolean(song.isAdminFavorite),
          links: song.links ?? {},
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not add song" }, { status: 500 });
  }
}
