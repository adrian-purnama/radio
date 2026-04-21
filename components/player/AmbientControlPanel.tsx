"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

import { useAmbientMixer, type AmbientTrack } from "@/hooks/useAmbientMixer";

type TrackAudioProps = {
  track: AmbientTrack;
  enabled: boolean;
  volume: number;
};

function TrackAudio({ track, enabled, volume }: TrackAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = volume;
    audio.loop = true;
    if (!enabled) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => undefined);
  }, [enabled, volume, track.id]);

  return <audio ref={audioRef} src={track.audioUrl} preload="auto" />;
}

export function AmbientControlPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    tracks,
    enabled,
    selectedTrackIds,
    selectedTracks,
    volumes,
    setEnabled,
    toggleTrack,
    setTrackVolume,
  } = useAmbientMixer();

  return (
    <>
      {enabled
        ? selectedTracks.map((track) => (
            <TrackAudio key={track.id} track={track} enabled volume={volumes[track.id] ?? 0.35} />
          ))
        : null}

      <aside className="space-y-2 rounded-2xl border border-white/12 bg-black/28 p-2.5 text-white backdrop-blur-md">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/70">Ambient</p>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              enabled ? "bg-white text-black" : "bg-white/15 text-white"
            }`}
          >
            {enabled ? "On" : "Off"}
          </button>
        </div>
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] uppercase tracking-[0.15em] text-white/60">
            {selectedTrackIds.length > 0
              ? `${selectedTrackIds.length} selected`
              : "No ambient selected"}
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-md px-2 py-1 text-[11px] text-white/75 hover:bg-white/10"
          >
            Control
          </button>
        </div>
      </aside>

      {typeof window !== "undefined" && isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950/96 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Ambient Control</h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {tracks.map((track) => {
                    const isSelected = selectedTrackIds.includes(track.id);
                    const volume = volumes[track.id] ?? 0.35;

                    return (
                      <div
                        key={track.id}
                        className="space-y-1.5 rounded-xl border border-white/12 bg-black/25 p-2.5"
                      >
                        <label className="flex items-center gap-2 text-sm text-white">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTrack(track.id)}
                            className="h-4 w-4 accent-white"
                          />
                          <span>{track.name}</span>
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={volume}
                          onChange={(event) =>
                            setTrackVolume(track.id, Number(event.target.value))
                          }
                          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
