import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(plainText: string) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export function comparePassword(plainText: string, hash: string) {
  return bcrypt.compare(plainText, hash);
}
