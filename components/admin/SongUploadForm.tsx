"use client";

import { FormEvent, useState } from "react";

type Props = {
  albumId: string;
  onUploaded: () => Promise<void>;
};

export function SongUploadForm({ albumId, onUploaded }: Props) {
  const [title, setTitle] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [youtubeMusic, setYoutubeMusic] = useState("");
  const [deezer, setDeezer] = useState("");
  const [spotify, setSpotify] = useState("");
  const [customLabels, setCustomLabels] = useState("");
  const [customUrls, setCustomUrls] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim() || !audio) {
      setError("Song title and audio file are required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("audio", audio);
    formData.append("youtubeMusic", youtubeMusic.trim());
    formData.append("deezer", deezer.trim());
    formData.append("spotify", spotify.trim());
    formData.append("customLabels", customLabels.trim());
    formData.append("customUrls", customUrls.trim());

    setUploading(true);
    try {
      const response = await fetch(`/api/albums/${albumId}/songs`, { method: "POST", body: formData });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not upload song");
      }

      setTitle("");
      setAudio(null);
      setYoutubeMusic("");
      setDeezer("");
      setSpotify("");
      setCustomLabels("");
      setCustomUrls("");
      setSuccess("Song uploaded.");
      await onUploaded();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload song");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Song title"
        className="w-full rounded-md bg-white/10 px-3 py-2"
      />
      <input
        type="file"
        accept="audio/*"
        onChange={(event) => setAudio(event.target.files?.[0] ?? null)}
        className="w-full rounded-md bg-white/10 px-3 py-2 text-sm"
      />
      <input
        value={youtubeMusic}
        onChange={(event) => setYoutubeMusic(event.target.value)}
        placeholder="YouTube Music link"
        className="w-full rounded-md bg-white/10 px-3 py-2 text-sm"
      />
      <input
        value={deezer}
        onChange={(event) => setDeezer(event.target.value)}
        placeholder="Deezer link"
        className="w-full rounded-md bg-white/10 px-3 py-2 text-sm"
      />
      <input
        value={spotify}
        onChange={(event) => setSpotify(event.target.value)}
        placeholder="Spotify link"
        className="w-full rounded-md bg-white/10 px-3 py-2 text-sm"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <textarea
          value={customLabels}
          onChange={(event) => setCustomLabels(event.target.value)}
          placeholder={"Custom labels (one per line)\nExample: Apple Music\nBandcamp"}
          className="min-h-20 w-full rounded-md bg-white/10 px-3 py-2 text-sm"
        />
        <textarea
          value={customUrls}
          onChange={(event) => setCustomUrls(event.target.value)}
          placeholder={"Custom links (one per line)\nhttps://...\nhttps://..."}
          className="min-h-20 w-full rounded-md bg-white/10 px-3 py-2 text-sm"
        />
      </div>
      <button disabled={uploading} className="rounded-md bg-white px-4 py-2 text-black">
        {uploading ? "Uploading..." : "Add Song"}
      </button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-300">{success}</p> : null}
    </form>
  );
}
