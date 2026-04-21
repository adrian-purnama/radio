"use client";

import { useEffect, useState } from "react";

type AmbientTrack = {
  id: string;
  name: string;
  audioUrl: string;
};

type Props = {
  refreshSignal: number;
};

export function AmbientTrackManager({ refreshSignal }: Props) {
  const [tracks, setTracks] = useState<AmbientTrack[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const response = await fetch("/api/ambient");
    const data = (await response.json()) as { tracks: AmbientTrack[] };
    setTracks(data.tracks);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/ambient")
      .then((response) => response.json() as Promise<{ tracks: AmbientTrack[] }>)
      .then((data) => {
        setTracks(data.tracks);
        setLoading(false);
      })
      .catch(() => undefined);
  }, [refreshSignal]);

  async function removeTrack(trackId: string) {
    await fetch(`/api/ambient/${trackId}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/20 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ambient Library</h2>
        <button onClick={() => void refresh()} className="rounded-md border border-white/25 px-3 py-1 text-xs">
          Refresh
        </button>
      </div>
      {loading ? <p className="text-sm text-white/65">Loading ambient tracks...</p> : null}
      {!loading && tracks.length === 0 ? (
        <p className="text-sm text-white/65">No ambient tracks uploaded yet.</p>
      ) : null}
      <div className="space-y-2">
        {tracks.map((track) => (
          <article key={track.id} className="space-y-2 rounded-xl border border-white/15 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{track.name}</p>
              <button
                type="button"
                onClick={() => void removeTrack(track.id)}
                className="rounded-md border border-red-300/30 px-2 py-1 text-xs text-red-200 hover:bg-red-300/10"
              >
                Delete
              </button>
            </div>
            <audio src={track.audioUrl} controls className="w-full" preload="metadata" />
          </article>
        ))}
      </div>
    </section>
  );
}
