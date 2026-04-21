import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

import { env } from "@/lib/env";

declare global {
  var mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
  var gridFsBucket: GridFSBucket | undefined;
}

export async function connectToDatabase() {
  console.log("Connecting to database...");
  console.log(env.MONGODB_URI);
  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
    });
  }

  const connection = await global.mongooseConnectionPromise;
  return connection;
}

export async function getGridFsBucket() {
  await connectToDatabase();

  if (!global.gridFsBucket) {
    if (!mongoose.connection.db) {
      throw new Error("MongoDB database connection unavailable");
    }

    global.gridFsBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "media",
    });
  }

  return global.gridFsBucket;
}
