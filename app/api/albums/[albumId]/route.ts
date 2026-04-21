import { ObjectId } from "mongodb";
import { Types } from "mongoose";
import { z } from "zod";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { connectToDatabase, getGridFsBucket } from "@/lib/db";
import { normalizeMusicLinks } from "@/lib/musicLinks";
import { AlbumModel } from "@/models/Album";
import { SongModel } from "@/models/Song";

const payloadSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
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
  params: Promise<{ albumId: string }>;
};

/** Native collection.findOne returns generic Document; cast after read (same fields as lean). */
type AlbumLeanForPatch = {
  _id: unknown;
  name: string;
  coverImageFileId: unknown;
  isAdminFavorite?: boolean;
  links?: unknown;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const { albumId } = await params;
  if (!ObjectId.isValid(albumId)) {
    return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    await connectToDatabase();

    const updateData: Record<string, unknown> = {};
    if (typeof payload.name === "string") {
      updateData.name = payload.name;
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

    let albumObjectId: Types.ObjectId;
    try {
      albumObjectId = new Types.ObjectId(albumId);
    } catch {
      return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
    }

    const keys = Object.keys(updateData);
    const favoriteOnly = keys.length === 1 && keys[0] === "isAdminFavorite";

    let album: AlbumLeanForPatch | null;

    if (favoriteOnly) {
      const result = await AlbumModel.collection.updateOne(
        { _id: albumObjectId },
        { $set: { isAdminFavorite: updateData.isAdminFavorite } },
      );
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Album not found" }, { status: 404 });
      }
      album = (await AlbumModel.collection.findOne({ _id: albumObjectId })) as AlbumLeanForPatch | null;
    } else {
      album = (await AlbumModel.findByIdAndUpdate(
        albumObjectId,
        { $set: updateData },
        { new: true },
      ).lean()) as AlbumLeanForPatch | null;
    }

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({
      album: {
        id: String(album._id),
        name: album.name,
        coverUrl: `/api/media/${String(album.coverImageFileId)}`,
        isAdminFavorite: Boolean(album.isAdminFavorite),
        links: (album.links as Record<string, unknown> | undefined) ?? {},
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update album" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const { albumId } = await params;
  if (!ObjectId.isValid(albumId)) {
    return NextResponse.json({ error: "Invalid album id" }, { status: 400 });
  }

  await connectToDatabase();
  const album = await AlbumModel.findById(albumId);
  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const songs = await SongModel.find({ albumId }).lean();
  const bucket = await getGridFsBucket();

  for (const song of songs) {
    try {
      await bucket.delete(new ObjectId(String(song.audioFileId)));
    } catch {
      // ignore missing files
    }
  }

  try {
    await bucket.delete(new ObjectId(String(album.coverImageFileId)));
  } catch {
    // ignore missing files
  }

  await SongModel.deleteMany({ albumId });
  await album.deleteOne();

  return NextResponse.json({ ok: true });
}
