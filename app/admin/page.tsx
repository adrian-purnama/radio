"use client";

import { useState } from "react";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AlbumForm } from "@/components/admin/AlbumForm";
import { AlbumManager } from "@/components/admin/AlbumManager";
import { AmbientTrackForm } from "@/components/admin/AmbientTrackForm";
import { AmbientTrackManager } from "@/components/admin/AmbientTrackManager";

export default function AdminPage() {
  const { loading, authenticated, admin, login, logout } = useAdminAuth();
  const [refreshSignal, setRefreshSignal] = useState(0);

  if (loading) {
    return <main className="p-6 text-white">Loading...</main>;
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <AdminLoginForm onSubmit={login} />
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-zinc-950 p-6 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-black/40 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Admin Console</p>
          <p className="text-sm text-white/80">{admin?.email}</p>
          <p className="text-xs text-white/55">Manage albums, songs, and ambient layers.</p>
        </div>
        <button onClick={() => void logout()} className="rounded-md bg-white px-4 py-2 text-black">
          Logout
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <AlbumForm
          onCreated={async () => {
            setRefreshSignal((value) => value + 1);
          }}
        />
        <AmbientTrackForm
          onCreated={async () => {
            setRefreshSignal((value) => value + 1);
          }}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AlbumManager refreshSignal={refreshSignal} />
        <AmbientTrackManager refreshSignal={refreshSignal} />
      </section>
    </main>
  );
}
