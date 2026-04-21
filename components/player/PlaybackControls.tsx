"use client";

type Props = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progressPercent: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (nextTime: number) => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  progressPercent,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
}: Props) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/28 bg-black/30 text-white transition hover:bg-white/10"
          aria-label="Previous song"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M7 6h2v12H7zM10 12l8-6v12z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:opacity-90"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/28 bg-black/30 text-white transition hover:bg-white/10"
          aria-label="Next song"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M15 6h2v12h-2zM6 6l8 6-8 6z" />
          </svg>
        </button>
      </div>

      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || currentTime)}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="player-range h-1 w-full cursor-pointer appearance-none rounded-full bg-white/14 accent-white"
          aria-label="Song progress"
          disabled={!duration}
        />
        <p className="text-xs text-white/65">
          {formatTime(currentTime)} / {formatTime(duration)}
        </p>
        <p className="sr-only">Progress {progressPercent.toFixed(0)} percent</p>
      </div>
    </div>
  );
}
