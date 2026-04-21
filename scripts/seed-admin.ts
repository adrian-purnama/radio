import "dotenv/config";

import { connectToDatabase } from "../lib/db";
import { env } from "../lib/env";
import { hashPassword } from "../lib/password";
import { AdminModel } from "../models/Admin";

async function seedAdmin() {
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set");
  }

  await connectToDatabase();

  const email = env.ADMIN_SEED_EMAIL.toLowerCase();
  const passwordHash = await hashPassword(env.ADMIN_SEED_PASSWORD);

  const existing = await AdminModel.findOne({ email });

  if (!existing) {
    await AdminModel.create({ email, passwordHash });
    console.log(`Created admin user: ${email}`);
    return;
  }

  existing.passwordHash = passwordHash;
  await existing.save();
  console.log(`Updated admin password: ${email}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
