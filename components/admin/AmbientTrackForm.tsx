"use client";

import { FormEvent, useState } from "react";

type Props = {
  onCreated: () => Promise<void>;
};

export function AmbientTrackForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim() || !audio) {
      setError("Ambient name and audio file are required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("audio", audio);

    setSubmitting(true);
    try {
      const response = await fetch("/api/ambient", { method: "POST", body: formData });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not upload ambient track");
      }

      setName("");
      setAudio(null);
      setSuccess("Ambient track uploaded.");
      await onCreated();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not upload ambient track",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/20 bg-black/40 p-4">
      <h2 className="text-lg font-semibold">Upload Ambient Track</h2>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ambient name (rain, vinyl, forest...)"
        className="w-full rounded-md bg-white/10 px-3 py-2"
      />
      <input
        type="file"
        accept="audio/*"
        onChange={(event) => setAudio(event.target.files?.[0] ?? null)}
        className="w-full rounded-md bg-white/10 px-3 py-2 text-sm"
      />
      <button disabled={submitting} className="rounded-md bg-white px-4 py-2 text-black">
        {submitting ? "Uploading..." : "Add Ambient"}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
    </form>
  );
}
