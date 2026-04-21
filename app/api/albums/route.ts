import { z } from "zod";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { uploadFileToGridFs } from "@/lib/media";
import { normalizeMusicLinks } from "@/lib/musicLinks";
import { AlbumModel } from "@/models/Album";
import { SongModel } from "@/models/Song";

const albumNameSchema = z.string().trim().min(1).max(120);

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

export async function GET() {
  await connectToDatabase();
  const albums = await AlbumModel.find().sort({ createdAt: -1 }).lean();

  const albumsWithSongs = await Promise.all(
    albums.map(async (album) => {
      const songsCount = await SongModel.countDocuments({ albumId: album._id });
      return {
        id: String(album._id),
        name: album.name,
        coverImageFileId: String(album.coverImageFileId),
        coverUrl: `/api/media/${String(album.coverImageFileId)}`,
        isAdminFavorite: Boolean(album.isAdminFavorite),
        links: album.links ?? {},
        songsCount,
      };
    }),
  );

  return NextResponse.json({ albums: albumsWithSongs });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const formData = await request.formData();
    const name = albumNameSchema.parse(formData.get("name"));
    const cover = formData.get("cover");
    const links = normalizeMusicLinks({
      youtubeMusic: String(formData.get("youtubeMusic") ?? ""),
      deezer: String(formData.get("deezer") ?? ""),
      spotify: String(formData.get("spotify") ?? ""),
      customLinks: parseCustomLinks(
        String(formData.get("customLabels") ?? ""),
        String(formData.get("customUrls") ?? ""),
      ),
    });

    if (!(cover instanceof File)) {
      return NextResponse.json({ error: "Album cover is required" }, { status: 400 });
    }

    if (!cover.type.startsWith("image/")) {
      return NextResponse.json({ error: "Cover must be an image file" }, { status: 400 });
    }

    if (cover.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Cover must be <= 8MB" }, { status: 400 });
    }

    await connectToDatabase();
    const coverImageFileId = await uploadFileToGridFs(cover, {
      uploadedBy: session.adminId,
      kind: "album-cover",
    });

    const album = await AlbumModel.create({
      name,
      coverImageFileId,
      coverMimeType: cover.type,
      isAdminFavorite: false,
      links,
    });

    return NextResponse.json(
      {
        album: {
          id: String(album._id),
          name: album.name,
          coverImageFileId: String(album.coverImageFileId),
          coverUrl: `/api/media/${String(album.coverImageFileId)}`,
          isAdminFavorite: Boolean(album.isAdminFavorite),
          links: album.links ?? {},
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not create album" }, { status: 500 });
  }
}
