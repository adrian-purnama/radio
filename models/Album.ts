import mongoose, { Schema, Types, type InferSchemaType } from "mongoose";

const albumSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    coverImageFileId: { type: Types.ObjectId, required: true },
    coverMimeType: { type: String, required: true },
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

export type AlbumDocument = InferSchemaType<typeof albumSchema>;

if (mongoose.models.Album) {
  delete mongoose.models.Album;
}

export const AlbumModel = mongoose.model("Album", albumSchema);
