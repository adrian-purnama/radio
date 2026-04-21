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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const previousSongsRef = useRef<PlaybackSong[]>([]);
  const goToNextSongRef = useRef<() => Promise<void>>(async () => undefined);
  const autoplayUnlockBoundRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const { currentSong, queue, mode, isPlaying, setCurrentSong, setQueue, setMode, setPlaying } =
    usePlayerStore();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const audio = document.getElementById("global-radio-audio") as HTMLAudioElement | null;
    if (audio) {
      audioRef.current = audio;
      setAudioReady(true);
    }
  }, []);

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
      const currentSrc = audio.getAttribute("src") ?? "";
      const isSameTrack = currentSrc === currentSong.audioUrl;
      if (!isSameTrack) {
        audio.src = currentSong.audioUrl;
        audio.load();
        setTimeout(() => {
          setCurrentTime(0);
          setDuration(0);
        }, 0);
      }
      if (isPlaying) {
        void audio.play().catch(() => undefined);
      }
    }
  }, [audioReady, currentSong, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const syncNow = () => {
      setCurrentTime(audio.currentTime || 0);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onDurationChange = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const onEnded = () => {
      setCurrentTime(0);
      void goToNextSongRef.current();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    syncNow();

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioReady]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      return;
    }

    let disposed = false;

    const unlockAndPlay = () => {
      if (disposed) {
        return;
      }
      void audio.play().catch(() => undefined);
      window.removeEventListener("pointerdown", unlockAndPlay);
      window.removeEventListener("keydown", unlockAndPlay);
      autoplayUnlockBoundRef.current = false;
    };

    void audio.play().catch(() => {
      if (autoplayUnlockBoundRef.current) {
        return;
      }
      autoplayUnlockBoundRef.current = true;
      window.addEventListener("pointerdown", unlockAndPlay, { once: true });
      window.addEventListener("keydown", unlockAndPlay, { once: true });
    });

    return () => {
      disposed = true;
      if (autoplayUnlockBoundRef.current) {
        window.removeEventListener("pointerdown", unlockAndPlay);
        window.removeEventListener("keydown", unlockAndPlay);
        autoplayUnlockBoundRef.current = false;
      }
    };
  }, [audioReady, isPlaying, currentSong?.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        const isTypingTarget =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target.isContentEditable;
        if (isTypingTarget) {
          return;
        }
      }

      event.preventDefault();
      setPlaying(!isPlaying);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlaying, setPlaying]);

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
  }, [audioReady, isPlaying]);

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

  useEffect(() => {
    goToNextSongRef.current = goToNextSong;
  }, [goToNextSong]);

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
