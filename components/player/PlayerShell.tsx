"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { usePlayer } from "@/hooks/usePlayer";
import { NowPlaying } from "@/components/player/NowPlaying";
import { PlaybackControls } from "@/components/player/PlaybackControls";
import { ModeToggle } from "@/components/player/ModeToggle";
import { AmbientControlPanel } from "@/components/player/AmbientControlPanel";
import { Users } from "lucide-react";

export function PlayerShell() {
  const [isControlStackMinimized, setIsControlStackMinimized] = useState(false);
  const [listenerCount, setListenerCount] = useState(46);
  const [baseCoverUrl, setBaseCoverUrl] = useState<string | null>(null);
  const [overlayCoverUrl, setOverlayCoverUrl] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const baseCoverRef = useRef<string | null>(null);
  const {
    audioRef,
    currentSong,
    queue,
    mode,
    albums,
    selectedAlbumId,
    selectedAlbumName,
    playlists,
    selectedPlaylistId,
    selectedPlaylistName,
    selectedPlaylistSongIds,
    isPlaying,
    currentTime,
    duration,
    progressPercent,
    setMode,
    chooseAlbumForLoop,
    createPlaylist,
    selectPlaylist,
    deletePlaylist,
    toggleSongInPlaylist,
    togglePlay,
    goToPreviousSong,
    goToNextSong,
    seekTo,
  } =
    usePlayer();


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const onEnded = () => {
      void goToNextSong();
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [audioRef, goToNextSong]);

  useEffect(() => {
    const interval = setInterval(() => {
      setListenerCount((previous) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = previous + delta;
        return Math.max(18, Math.min(240, next));
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextCover = currentSong?.coverUrl ?? null;
    if (!nextCover) {
      baseCoverRef.current = null;
      setTimeout(() => {
        setBaseCoverUrl(null);
        setOverlayCoverUrl(null);
        setOverlayVisible(false);
      }, 0);
      return;
    }

    if (!baseCoverRef.current) {
      baseCoverRef.current = nextCover;
      setTimeout(() => {
        setBaseCoverUrl(nextCover);
      }, 0);
      return;
    }
    if (baseCoverRef.current === nextCover) {
      return;
    }
    const preload = new window.Image();
    preload.src = nextCover;
    const onLoaded = () => {
      setOverlayCoverUrl(nextCover);
      setOverlayVisible(false);
      requestAnimationFrame(() => {
        setOverlayVisible(true);
      });
      const settleTimer = setTimeout(() => {
        baseCoverRef.current = nextCover;
        setBaseCoverUrl(nextCover);
        setOverlayCoverUrl(null);
        setOverlayVisible(false);
      }, 700);
      return () => clearTimeout(settleTimer);
    };
    preload.addEventListener("load", onLoaded);
    return () => {
      preload.removeEventListener("load", onLoaded);
    };
  }, [currentSong?.coverUrl]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6">
      <div className="absolute inset-0 z-0 bg-zinc-950" />
      {baseCoverUrl ? (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-100"
          style={{ backgroundImage: `url(${baseCoverUrl})` }}
        />
      ) : null}
      {overlayCoverUrl ? (
        <div
          className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-700 ${
            overlayVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${overlayCoverUrl})` }}
        />
      ) : null}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/65 to-black/75" />

      <audio ref={audioRef} preload="auto" />

      <div className="fixed top-4 right-4 z-20 flex items-center gap-1 rounded-full border border-emerald-300/25 bg-black/40 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-emerald-100 backdrop-blur-md">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]"
          aria-hidden
        />
          <span className="tabular-nums">{listenerCount}</span>
          <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
      </div>

      <section className="z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-black/18 p-5 shadow-[0_10px_28px_rgba(0,0,0,0.28)] backdrop-blur-md md:p-6">
        <div className="grid grid-cols-1 gap-4">
          <article className="rounded-2xl border border-white/10 bg-black/24 p-5">
            <div className="grid items-center gap-5 md:grid-cols-[1fr_112px]">
              <NowPlaying song={currentSong} />
              <div className="relative h-24 w-24 justify-self-start overflow-hidden rounded-xl border border-white/15 md:justify-self-end">
                {baseCoverUrl ? (
                  <Image
                    src={baseCoverUrl}
                    alt={currentSong?.albumName ?? "Album cover"}
                    width={96}
                    height={96}
                    unoptimized
                    className="absolute inset-0 h-full w-full object-cover opacity-100"
                  />
                ) : null}
                {overlayCoverUrl ? (
                  <Image
                    src={overlayCoverUrl}
                    alt="Incoming album cover"
                    width={96}
                    height={96}
                    unoptimized
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      overlayVisible ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ) : null}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/24 p-4">
            <PlaybackControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              progressPercent={progressPercent}
              onTogglePlay={togglePlay}
              onPrevious={goToPreviousSong}
              onNext={() => void goToNextSong()}
              onSeek={seekTo}
            />
          </article>
        </div>
      </section>

      <div className="fixed bottom-4 left-4 z-20 w-[260px] max-w-[calc(100vw-2rem)] space-y-2">
        <button
          type="button"
          onClick={() => setIsControlStackMinimized((value) => !value)}
          className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-black/60"
        >
          {isControlStackMinimized ? "Show Controls" : "Hide Controls"}
        </button>

        {!isControlStackMinimized ? (
          <div className="space-y-2">
            <ModeToggle
              mode={mode}
              albums={albums}
          songs={queue.map((song) => ({
            id: song.id,
            title: song.title,
            albumName: song.albumName,
            isAdminFavorite: song.isAdminFavorite,
            albumIsAdminFavorite: song.albumIsAdminFavorite,
          }))}
              selectedAlbumId={selectedAlbumId}
              selectedAlbumName={selectedAlbumName}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          selectedPlaylistName={selectedPlaylistName}
          selectedPlaylistSongIds={selectedPlaylistSongIds}
              onChange={setMode}
              onSelectAlbum={chooseAlbumForLoop}
          onCreatePlaylist={createPlaylist}
          onSelectPlaylist={selectPlaylist}
          onDeletePlaylist={deletePlaylist}
          onToggleSongInPlaylist={toggleSongInPlaylist}
            />
            <AmbientControlPanel />
          </div>
        ) : null}
      </div>
    </div>
  );
}
