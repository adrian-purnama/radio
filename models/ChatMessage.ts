import { model, models, Schema, type InferSchemaType } from "mongoose";

const chatMessageSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, maxlength: 32 },
    message: { type: String, required: true, trim: true, maxlength: 400 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type ChatMessageDocument = InferSchemaType<typeof chatMessageSchema>;

export const ChatMessageModel =
  models.ChatMessage || model("ChatMessage", chatMessageSchema);
