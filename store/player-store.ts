"use client";

import { create } from "zustand";

import type { StreamingLinks } from "@/lib/musicLinks";

export type PlaybackMode = "album-loop" | "random-loop" | "playlist-loop";

export type PlaybackSong = {
  id: string;
  title: string;
  albumId: string;
  albumName: string;
  isAdminFavorite?: boolean;
  albumIsAdminFavorite?: boolean;
  coverUrl: string;
  audioUrl: string;
  orderIndex: number;
  albumLinks?: StreamingLinks;
  songLinks?: StreamingLinks;
};

type PlayerState = {
  currentSong: PlaybackSong | null;
  queue: PlaybackSong[];
  mode: PlaybackMode;
  isPlaying: boolean;
  setCurrentSong: (song: PlaybackSong | null) => void;
  setQueue: (queue: PlaybackSong[]) => void;
  setMode: (mode: PlaybackMode) => void;
  setPlaying: (isPlaying: boolean) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  queue: [],
  mode: "album-loop",
  isPlaying: true,
  setCurrentSong: (currentSong) => set({ currentSong }),
  setQueue: (queue) => set({ queue }),
  setMode: (mode) => set({ mode }),
  setPlaying: (isPlaying) => set({ isPlaying }),
}));
