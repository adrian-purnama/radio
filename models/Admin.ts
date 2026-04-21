import { model, models, Schema, type InferSchemaType } from "mongoose";

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export type AdminDocument = InferSchemaType<typeof adminSchema>;

export const AdminModel = models.Admin || model("Admin", adminSchema);
