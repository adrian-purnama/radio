"use client";

import { type FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";

import { SongUploadForm } from "@/components/admin/SongUploadForm";

const adminFetchInit: RequestInit = { credentials: "include" };

type Album = {
  id: string;
  name: string;
  coverUrl: string;
  songsCount: number;
  isAdminFavorite?: boolean;
  links?: {
    youtubeMusic?: string;
    deezer?: string;
    spotify?: string;
    customLinks?: Array<{ label: string; url: string }>;
  };
};

type Props = {
  refreshSignal: number;
};

type Song = {
  id: string;
  title: string;
  isAdminFavorite?: boolean;
  links?: {
    youtubeMusic?: string;
    deezer?: string;
    spotify?: string;
    customLinks?: Array<{ label: string; url: string }>;
  };
};

function stringifyCustomLinks(customLinks?: Array<{ label: string; url: string }>) {
  if (!customLinks || customLinks.length === 0) {
    return { labels: "", urls: "" };
  }
  return {
    labels: customLinks.map((entry) => entry.label).join("\n"),
    urls: customLinks.map((entry) => entry.url).join("\n"),
  };
}

function parseCustomLinks(formData: FormData) {
  const labels = String(formData.get("customLabels") ?? "")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const urls = String(formData.get("customUrls") ?? "")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  return labels
    .map((label, index) => ({ label, url: urls[index] ?? "" }))
    .filter((entry) => Boolean(entry.url));
}

export function AlbumManager({ refreshSignal }: Props) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songsByAlbum, setSongsByAlbum] = useState<Record<string, Song[]>>({});
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [addingSongAlbumId, setAddingSongAlbumId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const response = await fetch("/api/albums", adminFetchInit);
    const data = (await response.json()) as { albums: Album[] };
    setAlbums(data.albums);
    const songEntries = await Promise.all(
      data.albums.map(async (album) => {
        const songsResponse = await fetch(`/api/albums/${album.id}/songs`, adminFetchInit);
        const songsData = (await songsResponse.json()) as { songs: Song[] };
        return [album.id, songsData.songs] as const;
      }),
    );
    setSongsByAlbum(Object.fromEntries(songEntries));
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/albums", adminFetchInit)
      .then((response) => response.json() as Promise<{ albums: Album[] }>)
      .then(async (data) => {
        setAlbums(data.albums);
        const songEntries = await Promise.all(
          data.albums.map(async (album) => {
            const songsResponse = await fetch(`/api/albums/${album.id}/songs`, adminFetchInit);
            const songsData = (await songsResponse.json()) as { songs: Song[] };
            return [album.id, songsData.songs] as const;
          }),
        );
        setSongsByAlbum(Object.fromEntries(songEntries));
        setLoading(false);
      })
      .catch(() => undefined);
  }, [refreshSignal]);

  async function updateAlbum(event: FormEvent<HTMLFormElement>, albumId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch(`/api/albums/${albumId}`, {
      ...adminFetchInit,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        youtubeMusic: String(formData.get("youtubeMusic") ?? ""),
        deezer: String(formData.get("deezer") ?? ""),
        spotify: String(formData.get("spotify") ?? ""),
        customLinks: parseCustomLinks(formData),
        isAdminFavorite: Boolean(albums.find((album) => album.id === albumId)?.isAdminFavorite),
      }),
    });
    setEditingAlbumId(null);
    await refresh();
  }

  async function deleteAlbum(albumId: string) {
    if (!window.confirm("Delete this album and all songs?")) return;
    await fetch(`/api/albums/${albumId}`, { ...adminFetchInit, method: "DELETE" });
    await refresh();
  }

  async function toggleAlbumFavorite(album: Album) {
    const next = !(album.isAdminFavorite === true);
    const response = await fetch(`/api/albums/${album.id}`, {
      ...adminFetchInit,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isAdminFavorite: next,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      album?: { isAdminFavorite?: boolean };
    };
    if (!response.ok) {
      window.alert(data.error ?? "Could not update album favorite");
      return;
    }
    if (typeof data.album?.isAdminFavorite === "boolean") {
      setAlbums((previous) =>
        previous.map((entry) =>
          entry.id === album.id ? { ...entry, isAdminFavorite: data.album?.isAdminFavorite } : entry,
        ),
      );
    }
    await refresh();
  }

  async function updateSong(event: FormEvent<HTMLFormElement>, albumId: string, song: Song) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch(`/api/albums/${albumId}/songs/${song.id}`, {
      ...adminFetchInit,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        youtubeMusic: String(formData.get("youtubeMusic") ?? ""),
        deezer: String(formData.get("deezer") ?? ""),
        spotify: String(formData.get("spotify") ?? ""),
        customLinks: parseCustomLinks(formData),
        isAdminFavorite: Boolean(song.isAdminFavorite),
      }),
    });
    setEditingSongId(null);
    await refresh();
  }

  async function deleteSong(albumId: string, songId: string) {
    if (!window.confirm("Delete this song?")) return;
    await fetch(`/api/albums/${albumId}/songs/${songId}`, { ...adminFetchInit, method: "DELETE" });
    await refresh();
  }

  async function toggleSongFavorite(albumId: string, song: Song) {
    const next = !(song.isAdminFavorite === true);
    const response = await fetch(`/api/albums/${albumId}/songs/${song.id}`, {
      ...adminFetchInit,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isAdminFavorite: next,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      song?: { isAdminFavorite?: boolean };
    };
    if (!response.ok) {
      window.alert(data.error ?? "Could not update song favorite");
      return;
    }
    if (typeof data.song?.isAdminFavorite === "boolean") {
      setSongsByAlbum((previous) => ({
        ...previous,
        [albumId]: (previous[albumId] ?? []).map((entry) =>
          entry.id === song.id ? { ...entry, isAdminFavorite: data.song?.isAdminFavorite } : entry,
        ),
      }));
    }
    await refresh();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/20 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Album Manager</h2>
        <button onClick={() => void refresh()} className="rounded-md border border-white/25 px-3 py-1 text-xs">
          Refresh
        </button>
      </div>
      {loading ? <p className="text-sm text-white/65">Loading albums...</p> : null}
      {!loading && albums.length === 0 ? (
        <p className="text-sm text-white/65">No albums yet. Create one to begin.</p>
      ) : null}
      {albums.map((album) => (
        <article key={album.id} className="space-y-3 rounded-2xl border border-white/20 bg-black/40 p-4">
          <div className="flex items-center gap-3">
            <Image
              src={album.coverUrl}
              alt={album.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg object-cover"
              unoptimized
            />
            <div>
              <h3 className="text-lg font-semibold">{album.name}</h3>
              <p className="text-sm text-white/70">{album.songsCount} songs</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-pressed={album.isAdminFavorite === true}
                title={album.isAdminFavorite ? "Remove admin favorite album" : "Mark album as admin favorite"}
                onClick={() => void toggleAlbumFavorite(album)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/5 text-amber-200 hover:bg-white/10"
              >
                <Star
                  className={`h-4 w-4 ${album.isAdminFavorite === true ? "fill-amber-400 text-amber-300" : "text-amber-200/75"}`}
                  strokeWidth={1.5}
                />
              </button>
              <button
                type="button"
                onClick={() => setEditingAlbumId((current) => (current === album.id ? null : album.id))}
                className="rounded-md border border-white/30 px-2 py-1 text-xs"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void deleteAlbum(album.id)}
                className="rounded-md border border-red-300/50 px-2 py-1 text-xs text-red-200"
              >
                Delete
              </button>
            </div>
          </div>
          {editingAlbumId === album.id ? (
            <form onSubmit={(event) => void updateAlbum(event, album.id)} className="grid gap-2 rounded-lg bg-white/5 p-3">
              <input name="name" defaultValue={album.name} className="rounded-md bg-white/10 px-3 py-2 text-sm" />
              <input
                name="youtubeMusic"
                defaultValue={album.links?.youtubeMusic ?? ""}
                placeholder="YouTube Music link"
                className="rounded-md bg-white/10 px-3 py-2 text-sm"
              />
              <input
                name="deezer"
                defaultValue={album.links?.deezer ?? ""}
                placeholder="Deezer link"
                className="rounded-md bg-white/10 px-3 py-2 text-sm"
              />
              <input
                name="spotify"
                defaultValue={album.links?.spotify ?? ""}
                placeholder="Spotify link"
                className="rounded-md bg-white/10 px-3 py-2 text-sm"
              />
              {(() => {
                const custom = stringifyCustomLinks(album.links?.customLinks);
                return (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <textarea
                      name="customLabels"
                      defaultValue={custom.labels}
                      placeholder={"Custom labels (one per line)\nExample: Apple Music"}
                      className="min-h-20 rounded-md bg-white/10 px-3 py-2 text-sm"
                    />
                    <textarea
                      name="customUrls"
                      defaultValue={custom.urls}
                      placeholder={"Custom links (one per line)\nhttps://..."}
                      className="min-h-20 rounded-md bg-white/10 px-3 py-2 text-sm"
                    />
                  </div>
                );
              })()}
              <button className="rounded-md bg-white px-3 py-2 text-sm text-black">Save Album</button>
            </form>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                setAddingSongAlbumId((current) => (current === album.id ? null : album.id))
              }
              className="rounded-md border border-white/25 px-2 py-1 text-xs"
            >
              {addingSongAlbumId === album.id ? "Close Add Song" : "Add Song"}
            </button>
          </div>
          {addingSongAlbumId === album.id ? <SongUploadForm albumId={album.id} onUploaded={refresh} /> : null}
          <div className="space-y-2">
            {(songsByAlbum[album.id] ?? []).map((song) => (
              <div key={song.id} className="rounded-lg border border-white/15 bg-black/40 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <p className="truncate text-sm text-white/90">{song.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={song.isAdminFavorite === true}
                      title={song.isAdminFavorite ? "Remove admin favorite song" : "Mark song as admin favorite"}
                      onClick={() => void toggleSongFavorite(album.id, song)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/5 text-amber-200 hover:bg-white/10"
                    >
                      <Star
                        className={`h-4 w-4 ${song.isAdminFavorite === true ? "fill-amber-400 text-amber-300" : "text-amber-200/75"}`}
                        strokeWidth={1.5}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSongId((current) => (current === song.id ? null : song.id))}
                      className="rounded-md border border-white/30 px-2 py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteSong(album.id, song.id)}
                      className="rounded-md border border-red-300/50 px-2 py-1 text-xs text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {editingSongId === song.id ? (
                  <form onSubmit={(event) => void updateSong(event, album.id, song)} className="mt-2 grid gap-2">
                    <input name="title" defaultValue={song.title} className="rounded-md bg-white/10 px-3 py-2 text-sm" />
                    <input
                      name="youtubeMusic"
                      defaultValue={song.links?.youtubeMusic ?? ""}
                      placeholder="YouTube Music link"
                      className="rounded-md bg-white/10 px-3 py-2 text-sm"
                    />
                    <input
                      name="deezer"
                      defaultValue={song.links?.deezer ?? ""}
                      placeholder="Deezer link"
                      className="rounded-md bg-white/10 px-3 py-2 text-sm"
                    />
                    <input
                      name="spotify"
                      defaultValue={song.links?.spotify ?? ""}
                      placeholder="Spotify link"
                      className="rounded-md bg-white/10 px-3 py-2 text-sm"
                    />
                    {(() => {
                      const custom = stringifyCustomLinks(song.links?.customLinks);
                      return (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <textarea
                            name="customLabels"
                            defaultValue={custom.labels}
                            placeholder={"Custom labels (one per line)\nExample: Apple Music"}
                            className="min-h-20 rounded-md bg-white/10 px-3 py-2 text-sm"
                          />
                          <textarea
                            name="customUrls"
                            defaultValue={custom.urls}
                            placeholder={"Custom links (one per line)\nhttps://..."}
                            className="min-h-20 rounded-md bg-white/10 px-3 py-2 text-sm"
                          />
                        </div>
                      );
                    })()}
                    <button className="rounded-md bg-white px-3 py-2 text-xs text-black">Save Song</button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
