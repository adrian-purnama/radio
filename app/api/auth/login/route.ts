import { z } from "zod";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { comparePassword } from "@/lib/password";
import { signAdminToken, setAdminSessionCookie } from "@/lib/auth";
import { AdminModel } from "@/models/Admin";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    await connectToDatabase();

    const admin = await AdminModel.findOne({ email: payload.email.toLowerCase() });

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await comparePassword(payload.password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signAdminToken({ adminId: String(admin._id), email: admin.email });
    await setAdminSessionCookie(token);

    return NextResponse.json({
      admin: { id: String(admin._id), email: admin.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
