import mongoose, { Schema, Types, type InferSchemaType } from "mongoose";

const songSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    albumId: { type: Types.ObjectId, required: true, ref: "Album", index: true },
    audioFileId: { type: Types.ObjectId, required: true },
    audioMimeType: { type: String, required: true },
    orderIndex: { type: Number, required: true, default: 0 },
    isAdminFavorite: { type: Boolean, required: true, default: false },
    links: {
      youtubeMusic: { type: String, default: "" },
      deezer: { type: String, default: "" },
      spotify: { type: String, default: "" },
      customLinks: {
        type: [
          {
            label: { type: String, required: true, trim: true },
            url: { type: String, required: true, trim: true },
          },
        ],
        default: [],
      },
    },
  },
  { timestamps: true },
);

export type SongDocument = InferSchemaType<typeof songSchema>;

if (mongoose.models.Song) {
  delete mongoose.models.Song;
}

export const SongModel = mongoose.model("Song", songSchema);
