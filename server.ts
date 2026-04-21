import "dotenv/config";
import http from "node:http";
import next from "next";
import { Server } from "socket.io";

import { connectToDatabase } from "./lib/db";
import { ChatMessageModel } from "./models/ChatMessage";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(async () => {
  await connectToDatabase();

  const httpServer = http.createServer((req, res) => {
    void handler(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("chat:message", async (payload: { username?: string; message?: string }) => {
      const username = (payload.username ?? "").trim().slice(0, 32);
      const message = (payload.message ?? "").trim().slice(0, 400);

      if (!username || !message) {
        return;
      }

      const saved = await ChatMessageModel.create({
        username,
        message,
      });

      io.emit("chat:message", {
        id: String(saved._id),
        username: saved.username,
        message: saved.message,
        createdAt: saved.createdAt.toISOString(),
      });
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
