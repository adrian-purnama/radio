import { model, models, Schema, Types, type InferSchemaType } from "mongoose";

const ambientTrackSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    audioFileId: { type: Types.ObjectId, required: true },
    audioMimeType: { type: String, required: true },
  },
  { timestamps: true },
);

export type AmbientTrackDocument = InferSchemaType<typeof ambientTrackSchema>;

export const AmbientTrackModel =
  models.AmbientTrack || model("AmbientTrack", ambientTrackSchema);
