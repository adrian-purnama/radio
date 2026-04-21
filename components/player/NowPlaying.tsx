"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, ExternalLink, Share2, Star, X } from "lucide-react";

import { streamingLinksFromUnknown, type StreamingLinks } from "@/lib/musicLinks";
import type { PlaybackSong } from "@/store/player-store";

type Props = {
  song: PlaybackSong | null;
};

function linkRows(links: StreamingLinks): { key: string; label: string; url: string }[] {
  const rows: { key: string; label: string; url: string }[] = [];
  const yt = links.youtubeMusic?.trim();
  const dz = links.deezer?.trim();
  const sp = links.spotify?.trim();
  if (yt) rows.push({ key: "youtube", label: "YouTube Music", url: yt });
  if (dz) rows.push({ key: "deezer", label: "Deezer", url: dz });
  if (sp) rows.push({ key: "spotify", label: "Spotify", url: sp });
  links.customLinks.forEach((entry, index) => {
    const url = entry.url?.trim();
    const label = entry.label?.trim();
    if (url && label) {
      rows.push({ key: `custom-${index}`, label, url });
    }
  });
  return rows;
}

export function NowPlaying({ song }: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!shareOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShareOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shareOpen]);

  const albumRows = useMemo(
    () => linkRows(song?.albumLinks ?? streamingLinksFromUnknown(null)),
    [song?.albumLinks],
  );
  const songRows = useMemo(
    () => linkRows(song?.songLinks ?? streamingLinksFromUnknown(null)),
    [song?.songLinks],
  );

  async function copyUrl(url: string, key: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  if (!song) {
    return <div className="text-base text-white/75">No songs uploaded yet.</div>;
  }

  const modal =
    mounted && shareOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={() => setShareOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-links-title"
              className="flex max-h-[min(80vh,520px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/95 p-5 text-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
                <div>
                  <h2 id="share-links-title" className="text-lg font-semibold tracking-tight">
                    Streaming links
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    {song.title} · {song.albumName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="rounded-lg border border-white/15 p-2 text-white/80 hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="chat-scroll min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                <section className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Album</p>
                  {albumRows.length === 0 ? (
                    <p className="text-sm text-white/45">No album links yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {albumRows.map((row) => {
                        const copyKey = `album-${row.key}`;
                        return (
                          <li
                            key={copyKey}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-2"
                          >
                            <span className="min-w-0 flex-1 truncate text-sm text-white/90">{row.label}</span>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-white/85 hover:bg-white/10"
                              >
                                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                                Open
                              </a>
                              <button
                                type="button"
                                onClick={() => void copyUrl(row.url, copyKey)}
                                className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-white/85 hover:bg-white/10"
                              >
                                <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                                {copiedKey === copyKey ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Song</p>
                  {songRows.length === 0 ? (
                    <p className="text-sm text-white/45">No song links yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {songRows.map((row) => {
                        const copyKey = `song-${row.key}`;
                        return (
                          <li
                            key={copyKey}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-2"
                          >
                            <span className="min-w-0 flex-1 truncate text-sm text-white/90">{row.label}</span>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-white/85 hover:bg-white/10"
                              >
                                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                                Open
                              </a>
                              <button
                                type="button"
                                onClick={() => void copyUrl(row.url, copyKey)}
                                className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-white/85 hover:bg-white/10"
                              >
                                <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                                {copiedKey === copyKey ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Now Playing</p>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2 py-2"
          aria-label="Share streaming links"
          title="Share streaming links"
        >
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">{song.title}</h1>
        {song.isAdminFavorite ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-100"
            title="Admin favorite song"
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-300" strokeWidth={1.5} />
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-base text-white/75">{song.albumName}</p>
        {song.albumIsAdminFavorite ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-100"
            title="Admin favorite album"
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-300" strokeWidth={1.5} />
          </span>
        ) : null}
      </div>
      {modal}
    </div>
  );
}
