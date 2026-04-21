import { ObjectId } from "mongodb";

import { getGridFsBucket } from "@/lib/db";

export async function uploadFileToGridFs(file: File, metadata?: Record<string, string>) {
  const bucket = await getGridFsBucket();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const filename = file.name || `upload-${Date.now()}`;

  const uploadStream = bucket.openUploadStream(filename, {
    metadata: {
      ...metadata,
      mimeType: file.type,
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve());
    uploadStream.end(Buffer.from(bytes));
  });

  return uploadStream.id as ObjectId;
}

export async function getGridFsFileInfo(fileId: string) {
  const bucket = await getGridFsBucket();
  const objectId = new ObjectId(fileId);
  const files = await bucket.find({ _id: objectId }).toArray();
  return files[0] ?? null;
}
