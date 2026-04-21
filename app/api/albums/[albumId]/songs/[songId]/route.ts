import { ObjectId } from "mongodb";
import { Types } from "mongoose";
import { z } from "zod";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { connectToDatabase, getGridFsBucket } from "@/lib/db";
import { normalizeMusicLinks } from "@/lib/musicLinks";
import { SongModel } from "@/models/Song";

const payloadSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  youtubeMusic: z.string().optional(),
  deezer: z.string().optional(),
  spotify: z.string().optional(),
  isAdminFavorite: z.boolean().optional(),
  customLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
});

type Params = {
  params: Promise<{ albumId: string; songId: string }>;
};

/** Native collection.findOne returns generic Document; cast after read (same fields as lean). */
type SongLeanForPatch = {
  _id: unknown;
  title: string;
  albumId: unknown;
  audioFileId: unknown;
  orderIndex: number;
  isAdminFavorite?: boolean;
  links?: unknown;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const { albumId, songId } = await params;
  if (!ObjectId.isValid(albumId) || !ObjectId.isValid(songId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    await connectToDatabase();

    const updateData: Record<string, unknown> = {};
    if (typeof payload.title === "string") {
      updateData.title = payload.title;
    }
    if (
      payload.youtubeMusic !== undefined ||
      payload.deezer !== undefined ||
      payload.spotify !== undefined ||
      payload.customLinks !== undefined
    ) {
      updateData.links = normalizeMusicLinks({
        youtubeMusic: payload.youtubeMusic ?? "",
        deezer: payload.deezer ?? "",
        spotify: payload.spotify ?? "",
        customLinks: payload.customLinks ?? [],
      });
    }
    if (typeof payload.isAdminFavorite === "boolean") {
      updateData.isAdminFavorite = payload.isAdminFavorite;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    let songObjectId: Types.ObjectId;
    let albumObjectId: Types.ObjectId;
    try {
      songObjectId = new Types.ObjectId(songId);
      albumObjectId = new Types.ObjectId(albumId);
    } catch {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const keys = Object.keys(updateData);
    const favoriteOnly = keys.length === 1 && keys[0] === "isAdminFavorite";

    let song: SongLeanForPatch | null;

    if (favoriteOnly) {
      const result = await SongModel.collection.updateOne(
        { _id: songObjectId, albumId: albumObjectId },
        { $set: { isAdminFavorite: updateData.isAdminFavorite } },
      );
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Song not found" }, { status: 404 });
      }
      song = (await SongModel.collection.findOne({
        _id: songObjectId,
        albumId: albumObjectId,
      })) as SongLeanForPatch | null;
    } else {
      song = (await SongModel.findOneAndUpdate(
        { _id: songObjectId, albumId: albumObjectId },
        { $set: updateData },
        { new: true },
      ).lean()) as SongLeanForPatch | null;
    }

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    return NextResponse.json({
      song: {
        id: String(song._id),
        title: song.title,
        albumId: String(song.albumId),
        audioUrl: `/api/media/${String(song.audioFileId)}`,
        orderIndex: song.orderIndex,
        isAdminFavorite: Boolean(song.isAdminFavorite),
        links: (song.links as Record<string, unknown> | undefined) ?? {},
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update song" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const { albumId, songId } = await params;
  if (!ObjectId.isValid(albumId) || !ObjectId.isValid(songId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectToDatabase();

  const song = await SongModel.findOne({ _id: songId, albumId });
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const bucket = await getGridFsBucket();
  try {
    await bucket.delete(new ObjectId(String(song.audioFileId)));
  } catch {
    // ignore missing file
  }

  await song.deleteOne();
  return NextResponse.json({ ok: true });
}
