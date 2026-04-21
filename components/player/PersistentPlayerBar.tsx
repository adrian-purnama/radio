"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Pause, Play, SkipForward } from "lucide-react";

import { usePlayer } from "@/hooks/usePlayer";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function PersistentPlayerBarContent() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    progressPercent,
    togglePlay,
    goToNextSong,
    seekTo,
  } = usePlayer();

  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-3 left-1/2 z-40 w-[min(860px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-white/15 bg-black/10 px-3 py-2.5 text-white shadow-[0_14px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 overflow-hidden rounded-lg border border-white/15">
          <Image
            src={currentSong.coverUrl}
            alt={currentSong.albumName}
            width={44}
            height={44}
            unoptimized
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{currentSong.title}</p>
          <p className="truncate text-xs text-white/65">{currentSong.albumName}</p>
        </div>
        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:opacity-90"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
        </button>
        <button
          type="button"
          onClick={() => void goToNextSong()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
          aria-label="Next song"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
        <Link
          href="/"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
          aria-label="Open full player"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || currentTime)}
          onChange={(event) => seekTo(Number(event.target.value))}
          className="player-range h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
          aria-label="Song progress"
          disabled={!duration}
        />
        <span className="w-24 text-right text-[11px] text-white/70">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

export function PersistentPlayerBar() {
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }

  return <PersistentPlayerBarContent />;
}

