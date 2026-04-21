"use client";

import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (email: string, password: string) => Promise<void>;
};

export function AdminLoginForm({ onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Could not sign in",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-white/20 bg-black/40 p-6">
      <h1 className="text-2xl font-semibold">Admin Login</h1>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="email"
        className="w-full rounded-md bg-white/10 px-3 py-2"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="password"
        className="w-full rounded-md bg-white/10 px-3 py-2"
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-white px-4 py-2 font-semibold text-black"
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
