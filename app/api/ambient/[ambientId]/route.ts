import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { connectToDatabase, getGridFsBucket } from "@/lib/db";
import { AmbientTrackModel } from "@/models/AmbientTrack";

type Params = {
  params: Promise<{ ambientId: string }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const { ambientId } = await params;
  if (!ObjectId.isValid(ambientId)) {
    return NextResponse.json({ error: "Invalid ambient id" }, { status: 400 });
  }

  await connectToDatabase();

  const track = await AmbientTrackModel.findById(ambientId);
  if (!track) {
    return NextResponse.json({ error: "Ambient track not found" }, { status: 404 });
  }

  const bucket = await getGridFsBucket();

  try {
    await bucket.delete(new ObjectId(String(track.audioFileId)));
  } catch {
    // Ignore delete failures for already missing files.
  }

  await track.deleteOne();
  return NextResponse.json({ ok: true });
}
