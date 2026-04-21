"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { usePlayerStore, type PlaybackSong } from "@/store/player-store";

type PlaybackResponse = {
  song: PlaybackSong | null;
  queue: PlaybackSong[];
};

type AlbumOption = {
  id: string;
  name: string;
  coverUrl: string;
  isAdminFavorite?: boolean;
};

type AlbumsResponse = {
  albums: Array<AlbumOption & { songsCount?: number }>;
};

type Playlist = {
  id: string;
  name: string;
  songIds: string[];
};

const PLAYLISTS_STORAGE_KEY = "radio.playlists";
const SELECTED_PLAYLIST_STORAGE_KEY = "radio.selectedPlaylistId";

export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousSongsRef = useRef<PlaybackSong[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const { currentSong, queue, mode, isPlaying, setCurrentSong, setQueue, setMode, setPlaying } =
    usePlayerStore();

  useEffect(() => {
    apiFetch<PlaybackResponse>("/api/playback/current")
      .then(({ song, queue: fetchedQueue }) => {
        setCurrentSong(song);
        setQueue(fetchedQueue);
      })
      .catch(() => undefined);
  }, [setCurrentSong, setQueue]);

  useEffect(() => {
    apiFetch<AlbumsResponse>("/api/albums")
      .then((data) => {
        const mapped = data.albums.map((album) => ({
          id: album.id,
          name: album.name,
          coverUrl: album.coverUrl,
          isAdminFavorite: Boolean(album.isAdminFavorite),
        }));
        setAlbums(mapped);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedPlaylists = window.localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    const storedSelected = window.localStorage.getItem(SELECTED_PLAYLIST_STORAGE_KEY);

    setTimeout(() => {
      if (storedPlaylists) {
        try {
          const parsed = JSON.parse(storedPlaylists) as Playlist[];
          if (Array.isArray(parsed)) {
            setPlaylists(parsed);
          }
        } catch {
          // ignore invalid storage data
        }
      }

      if (storedSelected) {
        setSelectedPlaylistId(storedSelected);
      }
    }, 0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    if (selectedPlaylistId) {
      window.localStorage.setItem(SELECTED_PLAYLIST_STORAGE_KEY, selectedPlaylistId);
    } else {
      window.localStorage.removeItem(SELECTED_PLAYLIST_STORAGE_KEY);
    }
  }, [playlists, selectedPlaylistId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (currentSong?.audioUrl) {
      audio.src = currentSong.audioUrl;
      audio.load();
      setTimeout(() => {
        setCurrentTime(0);
        setDuration(0);
      }, 0);
      if (isPlaying) {
        void audio.play().catch(() => undefined);
      }
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlaying) {
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  async function goToNextSong() {
    if (mode === "playlist-loop") {
      const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId);
      const playlistSongs = (selectedPlaylist?.songIds ?? [])
        .map((songId) => queue.find((song) => song.id === songId) ?? null)
        .filter((song): song is PlaybackSong => Boolean(song));

      if (playlistSongs.length === 0) {
        return;
      }

      if (currentSong) {
        previousSongsRef.current = [...previousSongsRef.current, currentSong].slice(-40);
      }

      if (!currentSong) {
        setCurrentSong(playlistSongs[0]);
        return;
      }

      const currentIndex = playlistSongs.findIndex((song) => song.id === currentSong.id);
      const nextSong =
        currentIndex < 0
          ? playlistSongs[0]
          : playlistSongs[(currentIndex + 1) % playlistSongs.length];

      setCurrentSong(nextSong);
      setPlaying(true);
      return;
    }

    const effectiveSelectedAlbumId = selectedAlbumId ?? currentSong?.albumId ?? null;
    if (currentSong) {
      previousSongsRef.current = [...previousSongsRef.current, currentSong].slice(-40);
    }

    const data = await apiFetch<PlaybackResponse>("/api/playback/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        currentSongId: currentSong?.id,
        selectedAlbumId: effectiveSelectedAlbumId,
      }),
    });

    setCurrentSong(data.song);
    setQueue(data.queue);
  }

  function goToPreviousSong() {
    const history = previousSongsRef.current;
    if (history.length === 0) {
      return;
    }

    const songToRestore = history[history.length - 1];
    previousSongsRef.current = history.slice(0, -1);
    if (songToRestore) {
      setCurrentSong(songToRestore);
      setPlaying(true);
    }
  }

  function togglePlay() {
    setPlaying(!isPlaying);
  }

  function changeMode(nextMode: "album-loop" | "random-loop" | "playlist-loop") {
    setMode(nextMode);
  }

  function chooseAlbumForLoop(albumId: string) {
    setSelectedAlbumId(albumId);

    const firstAlbumSong = queue
      .filter((song) => song.albumId === albumId)
      .sort((a, b) => a.orderIndex - b.orderIndex)[0];

    if (firstAlbumSong && mode === "album-loop") {
      setCurrentSong(firstAlbumSong);
    }
  }

  function seekTo(nextTime: number) {
    const audio = audioRef.current;
    if (!audio || Number.isNaN(nextTime)) {
      return;
    }

    const safeTime = Math.max(0, Math.min(nextTime, duration || nextTime));
    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  }

  const progressPercent = useMemo(() => {
    if (!duration) {
      return 0;
    }

    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const effectiveSelectedAlbumId = selectedAlbumId ?? currentSong?.albumId ?? null;

  const selectedAlbumName = useMemo(
    () => albums.find((album) => album.id === effectiveSelectedAlbumId)?.name ?? null,
    [albums, effectiveSelectedAlbumId],
  );

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  );

  function createPlaylist(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name: trimmed,
      songIds: [],
    };

    setPlaylists((previous) => [playlist, ...previous]);
    setSelectedPlaylistId(playlist.id);
  }

  function selectPlaylist(playlistId: string) {
    setSelectedPlaylistId(playlistId);
  }

  function deletePlaylist(playlistId: string) {
    setPlaylists((previous) => previous.filter((playlist) => playlist.id !== playlistId));
    setSelectedPlaylistId((current) => (current === playlistId ? null : current));
  }

  function toggleSongInPlaylist(songId: string) {
    if (!selectedPlaylistId) {
      return;
    }

    setPlaylists((previous) =>
      previous.map((playlist) => {
        if (playlist.id !== selectedPlaylistId) {
          return playlist;
        }

        const hasSong = playlist.songIds.includes(songId);
        return {
          ...playlist,
          songIds: hasSong
            ? playlist.songIds.filter((id) => id !== songId)
            : [...playlist.songIds, songId],
        };
      }),
    );
  }

  return {
    audioRef,
    currentSong,
    queue,
    albums,
    mode,
    selectedAlbumId: effectiveSelectedAlbumId,
    selectedAlbumName,
    playlists,
    selectedPlaylistId,
    selectedPlaylistName: selectedPlaylist?.name ?? null,
    selectedPlaylistSongIds: selectedPlaylist?.songIds ?? [],
    needsAlbumSelection: mode === "album-loop" && !effectiveSelectedAlbumId,
    isPlaying,
    currentTime,
    duration,
    progressPercent,
    setMode: changeMode,
    togglePlay,
    goToNextSong,
    goToPreviousSong,
    seekTo,
    chooseAlbumForLoop,
    createPlaylist,
    selectPlaylist,
    deletePlaylist,
    toggleSongInPlaylist,
  };
}
