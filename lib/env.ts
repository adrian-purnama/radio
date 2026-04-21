import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ADMIN_SEED_EMAIL: z.string().email("ADMIN_SEED_EMAIL must be an email").optional(),
  ADMIN_SEED_PASSWORD: z
    .string()
    .min(8, "ADMIN_SEED_PASSWORD must be at least 8 characters")
    .optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issueText = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${issueText}`);
}

export const env = parsed.data;
