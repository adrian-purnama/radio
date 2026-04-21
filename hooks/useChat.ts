"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { getSocketClient } from "@/lib/socket-client";
import type { ChatMessagePayload } from "@/lib/chat-types";

type HistoryResponse = {
  messages: ChatMessagePayload[];
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const socket = useMemo(() => getSocketClient(), []);

  useEffect(() => {
    apiFetch<HistoryResponse>("/api/chat/history")
      .then((data) => setMessages(data.messages))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onMessage = (message: ChatMessagePayload) => {
      setMessages((previous) => [...previous.slice(-80), message]);
    };

    socket.on("chat:message", onMessage);

    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [socket]);

  function sendMessage(username: string, message: string) {
    socket.emit("chat:message", { username, message });
  }

  return {
    messages,
    isOpen,
    setIsOpen,
    sendMessage,
  };
}
