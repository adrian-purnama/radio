import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getGridFsBucket, connectToDatabase } from "@/lib/db";
import { getGridFsFileInfo } from "@/lib/media";

type Params = {
  params: Promise<{ fileId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { fileId } = await params;

  if (!ObjectId.isValid(fileId)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  await connectToDatabase();
  const fileInfo = await getGridFsFileInfo(fileId);

  if (!fileInfo) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const bucket = await getGridFsBucket();
  const stream = bucket.openDownloadStream(new ObjectId(fileId));
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve());
  });

  const buffer = Buffer.concat(chunks);
  const metadata = (fileInfo as { metadata?: Record<string, unknown> }).metadata;
  const contentTypeValue = metadata?.mimeType;
  const mimeType =
    typeof contentTypeValue === "string" ? contentTypeValue : "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
