import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { ChatMessageModel } from "@/models/ChatMessage";

export async function GET() {
  await connectToDatabase();
  const messages = await ChatMessageModel.find()
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();

  return NextResponse.json({
    messages: messages.reverse().map((message) => ({
      id: String(message._id),
      username: message.username,
      message: message.message,
      createdAt: message.createdAt,
    })),
  });
}
