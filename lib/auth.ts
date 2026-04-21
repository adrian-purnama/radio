import jwt, { type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";

const AUTH_COOKIE_NAME = "radio_admin_session";

type AdminJwtPayload = {
  adminId: string;
  email: string;
};

export function signAdminToken(payload: AdminJwtPayload) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session;
}
