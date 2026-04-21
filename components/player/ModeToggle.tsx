"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";

import type { PlaybackMode } from "@/store/player-store";

type CatalogSong = {
  id: string;
  title: string;
  albumName: string;
  isAdminFavorite?: boolean;
  albumIsAdminFavorite?: boolean;
};

type Props = {
  mode: PlaybackMode;
  onChange: (mode: PlaybackMode) => void;
  albums: { id: string; name: string; coverUrl: string; isAdminFavorite?: boolean }[];
  songs: CatalogSong[];
  selectedAlbumId: string | null;
  selectedAlbumName: string | null;
  playlists: { id: string; name: string; songIds: string[] }[];
  selectedPlaylistId: string | null;
  selectedPlaylistName: string | null;
  selectedPlaylistSongIds: string[];
  onSelectAlbum: (albumId: string) => void;
  onCreatePlaylist: (name: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onToggleSongInPlaylist: (songId: string) => void;
};

export function ModeToggle({
  mode,
  onChange,
  albums,
  songs,
  selectedAlbumId,
  selectedAlbumName,
  playlists,
  selectedPlaylistId,
  selectedPlaylistName,
  selectedPlaylistSongIds,
  onSelectAlbum,
  onCreatePlaylist,
  onSelectPlaylist,
  onDeletePlaylist,
  onToggleSongInPlaylist,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [expandedAlbums, setExpandedAlbums] = useState<Record<string, boolean>>({});
  const canUseDom = typeof window !== "undefined";
  const openAlbumModal = () => setIsModalOpen(true);
  const closeAlbumModal = () => setIsModalOpen(false);

  function handleAlbumLoopPick() {
    onChange("album-loop");
    openAlbumModal();
  }

  function chooseAlbum(albumId: string) {
    onSelectAlbum(albumId);
    closeAlbumModal();
  }

  function handlePlaylistLoopPick() {
    onChange("playlist-loop");
    setIsPlaylistModalOpen(true);
  }

  function createPlaylist() {
    if (!newPlaylistName.trim()) {
      return;
    }

    onCreatePlaylist(newPlaylistName);
    setNewPlaylistName("");
  }

  const songsByAlbum = useMemo(() => {
    const grouped = new Map<string, CatalogSong[]>();
    for (const song of songs) {
      const bucket = grouped.get(song.albumName) ?? [];
      bucket.push(song);
      grouped.set(song.albumName, bucket);
    }

    return Array.from(grouped.entries()).map(([albumName, albumSongs]) => ({
      albumName,
      songs: albumSongs,
    }));
  }, [songs]);

  const selectedAlbumIsFavorite = Boolean(
    selectedAlbumId && albums.find((album) => album.id === selectedAlbumId)?.isAdminFavorite,
  );

  function toggleAlbumExpanded(albumName: string) {
    setExpandedAlbums((previous) => ({
      ...previous,
      [albumName]: !previous[albumName],
    }));
  }

  return (
    <div className="space-y-1.5 rounded-2xl border border-white/12 bg-black/28 p-2.5 backdrop-blur-md">
      <div className="grid grid-cols-3 gap-1 rounded-full bg-black/35 p-1">
        <button
          type="button"
          onClick={handleAlbumLoopPick}
          className={`w-full rounded-full px-2 py-1.5 text-xs font-medium transition ${
            mode === "album-loop" ? "bg-white text-black" : "text-white/80"
          }`}
        >
          Album
        </button>
        <button
          type="button"
          onClick={() => onChange("random-loop")}
          className={`w-full rounded-full px-2 py-1.5 text-xs font-medium transition ${
            mode === "random-loop" ? "bg-white text-black" : "text-white/80"
          }`}
        >
          Random
        </button>
        <button
          type="button"
          onClick={handlePlaylistLoopPick}
          className={`w-full rounded-full px-2 py-1.5 text-xs font-medium transition ${
            mode === "playlist-loop" ? "bg-white text-black" : "text-white/80"
          }`}
        >
          Playlist
        </button>
      </div>

      {mode === "album-loop" ? (
        <div className="flex items-center justify-between px-1">
          <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] uppercase tracking-[0.15em] text-white/60">
            {selectedAlbumIsFavorite ? (
              <Star
                className="h-3 w-3 shrink-0 fill-amber-400 text-amber-300"
                strokeWidth={1.5}
                aria-hidden
              />
            ) : null}
            <span className="truncate">
              {selectedAlbumName ? `Looping: ${selectedAlbumName}` : "Looping: select album"}
            </span>
          </p>
          <button
            type="button"
            onClick={openAlbumModal}
            className="rounded-md px-2 py-1 text-[11px] text-white/75 hover:bg-white/10"
          >
            {selectedAlbumName ? "Change" : "Pick"}
          </button>
        </div>
      ) : null}

      {mode === "playlist-loop" ? (
        <div className="flex items-center justify-between px-1">
          <p className="truncate text-[11px] uppercase tracking-[0.15em] text-white/60">
            {selectedPlaylistName
              ? `Playlist: ${selectedPlaylistName} (${selectedPlaylistSongIds.length})`
              : "Playlist: select"}
          </p>
          <button
            type="button"
            onClick={() => setIsPlaylistModalOpen(true)}
            className="rounded-md px-2 py-1 text-[11px] text-white/75 hover:bg-white/10"
          >
            {selectedPlaylistName ? "Edit" : "Pick"}
          </button>
        </div>
      ) : null}

      {canUseDom && isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950/96 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Select album loop</h3>
              <button
                type="button"
                onClick={closeAlbumModal}
                className="rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {albums.map((album) => {
                    const isActive = album.id === selectedAlbumId;
                    return (
                      <button
                        key={album.id}
                        type="button"
                        onClick={() => chooseAlbum(album.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                          isActive
                            ? "border-white bg-white text-black shadow-[0_6px_20px_rgba(255,255,255,0.15)]"
                            : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        <Image
                          src={album.coverUrl}
                          alt={album.name}
                          width={44}
                          height={44}
                          unoptimized
                          className="h-11 w-11 rounded-md object-cover"
                        />
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate">{album.name}</span>
                          {album.isAdminFavorite ? (
                            <Star
                              className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-300"
                              strokeWidth={1.5}
                              aria-label="Staff pick album"
                            />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {canUseDom && isPlaylistModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950/96 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Playlist Loop Manager</h3>
                  <button
                    type="button"
                    onClick={() => setIsPlaylistModalOpen(false)}
                    className="rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                <div className="mb-4 flex gap-2">
                  <input
                    value={newPlaylistName}
                    onChange={(event) => setNewPlaylistName(event.target.value)}
                    placeholder="New playlist name..."
                    className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={createPlaylist}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black"
                  >
                    Add
                  </button>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-[0.14em] text-white/60">My Playlists</h4>
                </div>
                <div className="mb-4 max-h-40 space-y-2 overflow-y-auto pr-1">
                  {playlists.map((playlist) => {
                    const isActive = playlist.id === selectedPlaylistId;
                    return (
                      <div
                        key={playlist.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectPlaylist(playlist.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelectPlaylist(playlist.id);
                          }
                        }}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${
                          isActive ? "border-white bg-white text-black" : "border-white/15 text-white"
                        }`}
                      >
                        <p className="text-left text-sm">
                          {playlist.name} ({playlist.songIds.length})
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeletePlaylist(playlist.id);
                          }}
                          className={`text-xs ${isActive ? "text-black/70" : "text-red-200"}`}
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-[0.14em] text-white/60">Albums</h4>
                  <p className="text-[11px] text-white/50">Select songs for active playlist</p>
                </div>
                <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {selectedPlaylistId ? (
                    songsByAlbum.map((group) => {
                      const isExpanded = expandedAlbums[group.albumName] ?? true;
                      return (
                        <div key={group.albumName} className="rounded-lg bg-white/[0.03]">
                          <button
                            type="button"
                            onClick={() => toggleAlbumExpanded(group.albumName)}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.04]"
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-sm font-medium text-white/90">
                              <span className="truncate">{group.albumName}</span>
                              {group.songs[0]?.albumIsAdminFavorite ? (
                                <Star
                                  className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-300"
                                  strokeWidth={1.5}
                                  aria-label="Staff pick album"
                                />
                              ) : null}
                            </span>
                            <span className="shrink-0 text-[11px] text-white/45">
                              {isExpanded ? "−" : "+"} {group.songs.length}
                            </span>
                          </button>

                          {isExpanded ? (
                            <div className="space-y-1 pl-2 pb-1">
                              {group.songs.map((song) => {
                                const included = selectedPlaylistSongIds.includes(song.id);
                                return (
                                  <label
                                    key={song.id}
                                    className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-white/90 hover:bg-white/[0.04]"
                                  >
                                    <span className="flex min-w-0 flex-1 items-center gap-2 truncate pr-3">
                                      {song.isAdminFavorite ? (
                                        <Star
                                          className="h-3 w-3 shrink-0 fill-amber-400 text-amber-300"
                                          strokeWidth={1.5}
                                          aria-label="Staff pick song"
                                        />
                                      ) : null}
                                      <span className="truncate">{song.title}</span>
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={included}
                                      onChange={() => onToggleSongInPlaylist(song.id)}
                                      className="h-4 w-4 accent-white"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-white/65">Create or select a playlist first.</p>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
