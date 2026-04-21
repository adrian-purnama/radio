"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api-client";

export type AmbientTrack = {
  id: string;
  name: string;
  audioUrl: string;
};

type AmbientResponse = {
  tracks: AmbientTrack[];
};

export function useAmbientMixer() {
  const [tracks, setTracks] = useState<AmbientTrack[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  useEffect(() => {
    apiFetch<AmbientResponse>("/api/ambient")
      .then((data) => {
        setTracks(data.tracks);
        setVolumes((previous) => {
          const next = { ...previous };
          for (const track of data.tracks) {
            if (typeof next[track.id] !== "number") {
              next[track.id] = 0.35;
            }
          }
          return next;
        });
      })
      .catch(() => undefined);
  }, []);

  function toggleTrack(trackId: string) {
    setSelectedTrackIds((previous) =>
      previous.includes(trackId)
        ? previous.filter((id) => id !== trackId)
        : [...previous, trackId],
    );
  }

  function setTrackVolume(trackId: string, volume: number) {
    setVolumes((previous) => ({
      ...previous,
      [trackId]: Math.max(0, Math.min(volume, 1)),
    }));
  }

  function setAmbientEnabled(nextEnabled: boolean) {
    setEnabled(nextEnabled);
  }

  const selectedTracks = useMemo(
    () => tracks.filter((track) => selectedTrackIds.includes(track.id)),
    [tracks, selectedTrackIds],
  );

  return {
    tracks,
    enabled,
    selectedTrackIds,
    selectedTracks,
    volumes,
    setEnabled: setAmbientEnabled,
    toggleTrack,
    setTrackVolume,
  };
}
