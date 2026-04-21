import { z } from "zod";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { uploadFileToGridFs } from "@/lib/media";
import { AmbientTrackModel } from "@/models/AmbientTrack";

const ambientNameSchema = z.string().trim().min(1).max(120);

export async function GET() {
  await connectToDatabase();
  const tracks = await AmbientTrackModel.find().sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    tracks: tracks.map((track) => ({
      id: String(track._id),
      name: track.name,
      audioFileId: String(track.audioFileId),
      audioUrl: `/api/media/${String(track.audioFileId)}`,
      createdAt: track.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const formData = await request.formData();
    const name = ambientNameSchema.parse(formData.get("name"));
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Ambient audio is required" }, { status: 400 });
    }

    if (!audio.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Ambient file must be audio" }, { status: 400 });
    }

    await connectToDatabase();
    const audioFileId = await uploadFileToGridFs(audio, {
      uploadedBy: session.adminId,
      kind: "ambient-audio",
    });

    const track = await AmbientTrackModel.create({
      name,
      audioFileId,
      audioMimeType: audio.type,
    });

    return NextResponse.json(
      {
        track: {
          id: String(track._id),
          name: track.name,
          audioFileId: String(track.audioFileId),
          audioUrl: `/api/media/${String(track.audioFileId)}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not create ambient track" }, { status: 500 });
  }
}
