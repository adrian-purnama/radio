"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import type { ChatMessagePayload } from "@/lib/chat-types";

type Props = {
  open: boolean;
  onToggle: () => void;
  messages: ChatMessagePayload[];
  onSend: (username: string, message: string) => void;
};

export function ChatDrawer({ open, onToggle, messages, onSend }: Props) {
  const [username, setUsername] = useState("listener");
  const [message, setMessage] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) {
      return;
    }

    feed.scrollTop = feed.scrollHeight;
  }, [messages]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    onSend(username.trim() || "listener", trimmed);
    setMessage("");
  }

  return (
    <div className="fixed right-4 bottom-4 z-20 w-[340px] max-w-[calc(100vw-2rem)]">
      <button
        type="button"
        onClick={onToggle}
        className="mb-3 ml-auto block rounded-full bg-black/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md"
      >
        {open ? "Hide Chat" : "Show Chat"}
      </button>

      {open ? (
        <div className="space-y-3">
          <div ref={feedRef} className="chat-scroll max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {messages.slice(-30).map((item) => (
              <div key={item.id} className="pointer-events-none text-sm text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                <p className="inline rounded-md bg-black/45 px-2 py-1 text-xs font-semibold text-white/85">
                  {item.username}
                </p>
                <p className="mt-1 inline rounded-md bg-black/55 px-2 py-1 leading-relaxed">
                  {item.message}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-[52%] rounded-full border border-white/15 bg-black/55 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50"
                placeholder="name"
              />
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="flex-1 rounded-full border border-white/15 bg-black/55 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-black"
              >
                Chat
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
