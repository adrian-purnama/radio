"use client";

import { type RefObject, useEffect, useRef } from "react";

type Props = {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
};

export function AudioWave({ audioRef, isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;

    if (!canvas || !audio) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const audioCtx = new window.AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    let animationId = 0;

    const draw = () => {
      const { width, height } = canvas;
      context.clearRect(0, 0, width, height);

      if (isPlayingRef.current) {
        analyser.getByteFrequencyData(data);
      }

      const barCount = 30;
      const gap = 7;
      const barWidth = (width - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i += 1) {
        const value = data[i % data.length] ?? 0;
        const normalized = Math.max(0.08, value / 255);
        const barHeight = normalized * (height * 0.62);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        context.fillStyle = "rgba(255,255,255,0.35)";
        context.fillRect(x, y, barWidth, barHeight);
      }

      animationId = requestAnimationFrame(draw);
    };

    void audioCtx.resume().catch(() => undefined);
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      analyser.disconnect();
      void audioCtx.close();
    };
  }, [audioRef]);

  return (
    <div className="rounded-2xl border border-white/8 bg-black/18 p-3">
      <canvas ref={canvasRef} width={760} height={110} className="h-[96px] w-full opacity-75" />
    </div>
  );
}
