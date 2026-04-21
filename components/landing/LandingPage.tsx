"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Play } from "lucide-react";

import { streamingLinksFromUnknown, type StreamingLinks } from "@/lib/musicLinks";

type AlbumItem = {
  id: string;
  name: string;
  coverUrl: string;
  links?: unknown;
};

type SongItem = {
  id: string;
  title: string;
  links?: unknown;
};

type CatalogAlbum = {
  id: string;
  name: string;
  coverUrl: string;
  links: StreamingLinks;
  songs: Array<{ id: string; title: string; links: StreamingLinks }>;
};

const ARTIST_PAGES = [
  { label: "Spotify", url: "https://open.spotify.com/" },
  { label: "YouTube Music", url: "https://music.youtube.com/" },
  { label: "Deezer", url: "https://www.deezer.com/" },
  { label: "Apple Music", url: "https://music.apple.com/" },
];

function toRows(links: StreamingLinks) {
  const rows: Array<{ label: string; url: string }> = [];
  if (links.youtubeMusic) rows.push({ label: "YouTube Music", url: links.youtubeMusic });
  if (links.deezer) rows.push({ label: "Deezer", url: links.deezer });
  if (links.spotify) rows.push({ label: "Spotify", url: links.spotify });
  links.customLinks.forEach((entry) => rows.push({ label: entry.label, url: entry.url }));
  return rows;
}

const HERO_VIDEO_ATTRIBUTION = {
  label: "Video credit",
  url: "https://www.vecteezy.com/video/35618384-ai-generated-cat-in-kitchen-with-pot-and-cup-in-the-style-of-anime-aesthetic-romantic-moonlit-seascapes-seamless-animated-looping-video",
};

export function LandingPage() {
  const [albums, setAlbums] = useState<CatalogAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlbums, setExpandedAlbums] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const albumsResponse = await fetch("/api/albums");
        const albumsData = (await albumsResponse.json()) as { albums: AlbumItem[] };
        const baseAlbums = albumsData.albums ?? [];

        const detailed = await Promise.all(
          baseAlbums.map(async (album) => {
            const songsResponse = await fetch(`/api/albums/${album.id}/songs`);
            const songsData = (await songsResponse.json()) as { songs: SongItem[] };
            return {
              id: album.id,
              name: album.name,
              coverUrl: album.coverUrl,
              links: streamingLinksFromUnknown(album.links),
              songs: (songsData.songs ?? []).map((song) => ({
                id: song.id,
                title: song.title,
                links: streamingLinksFromUnknown(song.links),
              })),
            } satisfies CatalogAlbum;
          }),
        );

        if (active) {
          setAlbums(detailed);
          setExpandedAlbums(
            Object.fromEntries(detailed.map((album, index) => [album.id, index < 1])),
          );
        }
      } catch {
        if (active) {
          setAlbums([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  const totalSongs = useMemo(
    () => albums.reduce((sum, album) => sum + album.songs.length, 0),
    [albums],
  );

  const marqueeAlbums = useMemo(() => {
    if (albums.length === 0) {
      return [] as CatalogAlbum[];
    }
    return [...albums, ...albums];
  }, [albums]);

  function toggleExpanded(albumId: string) {
    setExpandedAlbums((previous) => ({
      ...previous,
      [albumId]: !previous[albumId],
    }));
  }

  function scrollToCatalog() {
    const target = document.getElementById("catalog-section");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-linear-to-b from-slate-950 via-slate-900 to-zinc-950 text-slate-100">
      <div className="aurora-layer pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_88%_10%,rgba(129,140,248,0.12),transparent_32%),radial-gradient(circle_at_55%_100%,rgba(148,163,184,0.1),transparent_52%)]" />

      <section className="relative z-10 w-full">
        <div className="relative min-h-screen w-full overflow-hidden">
          {/* video here */}
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/hero-video.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={albums[0]?.coverUrl ?? ""}
          />
          <a
            href={HERO_VIDEO_ATTRIBUTION.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 z-10 rounded-full bg-slate-950/55 px-2.5 py-1 text-[10px] text-slate-200/90 backdrop-blur-sm transition hover:bg-slate-900/75 hover:text-white"
          >
            {HERO_VIDEO_ATTRIBUTION.label}
          </a>
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/82 via-slate-900/56 to-slate-950/48" />
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-start px-6 pt-20 md:px-12 md:pt-28">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200/75">LoFi Radio</p>
              <h1 className="mt-3 text-[4rem] font-semibold tracking-tight text-slate-100 md:text-6xl">
                2am Signal
              </h1>
              {/* <p className="mt-3 text-base text-slate-300 md:text-lg">Calm radio, one click away.</p> */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
                >
                  <Play className="h-4 w-4" strokeWidth={1.8} />
                  Enter Radio
                </Link>
                <p className="text-xs text-slate-300/90">
                  {albums.length} albums · {totalSongs} songs
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {ARTIST_PAGES.map((page) => (
                  <a
                    key={page.label}
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-500/80 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                  >
                    {page.label}
                    <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="group inline-flex items-center gap-3 text-slate-100 transition hover:text-sky-200"
                >
                  <span className="text-sm font-medium tracking-wide">Explore Catalogue</span>
                  <span className="relative inline-flex h-5 w-5 items-center justify-center">
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" strokeWidth={1.8} />
                  </span>
                  <span className="ml-1 h-px w-14 bg-slate-400/70 transition-all duration-300 group-hover:w-20 group-hover:bg-sky-300/90" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* {marqueeAlbums.length > 0 ? (
        <section className="relative z-10 mx-auto w-full overflow-hidden py-6">
          <div className="flex gap-6 overflow-x-auto px-5 pb-2 md:px-10">
            {marqueeAlbums.map((album, index) => (
              <div
                key={`${album.id}-${index}`}
                className="flex h-20 w-[260px] shrink-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 shadow-[0_10px_28px_rgba(14,116,144,0.08)] backdrop-blur"
              >
                <Image
                  src={album.coverUrl}
                  alt={album.name}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{album.name}</p>
                  <p className="text-[11px] text-zinc-500">{album.songs.length} songs</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null} */}


      <section
        id="catalog-section"
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28 pt-12 md:px-12"
      >
        <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white-600/75">The Catalog</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
              Every record, every sleeve.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Hover each album to peek the vinyl. Click to reveal the tracklist and open your
              favorite streaming platform.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-300">Loading catalog...</p>
        ) : null}

        {!loading && albums.length === 0 ? (
          <p className="text-sm text-slate-300">No albums available yet.</p>
        ) : null}

        <div className="space-y-10 md:space-y-12">
          {albums.map((album, index) => {
            const albumRows = toRows(album.links);
            const isExpanded = expandedAlbums[album.id] ?? false;
            const reverse = index % 2 === 1;

            return (
              <article
                key={album.id}
                className="album-card relative overflow-visible rounded-3xl border border-slate-700/70 bg-slate-900/65 p-6 shadow-[0_16px_40px_rgba(2,6,23,0.45)] backdrop-blur md:p-8"
              >
                <div
                  className={`grid items-center gap-10 md:gap-12 ${
                    reverse ? "md:grid-cols-[1fr_340px]" : "md:grid-cols-[340px_1fr]"
                  }`}
                >
                  <div
                    className={`album-stage pointer-events-none relative mx-auto h-64 w-64 overflow-visible md:h-80 md:w-80 ${
                      reverse ? "md:order-2" : "md:order-1"
                    }`}
                  >
                    <div
                      className="album-vinyl pointer-events-none absolute inset-0 z-0 translate-x-[3.4rem] rounded-full bg-[radial-gradient(circle_at_center,#0f172a_0%,#0f172a_28%,#1e293b_32%,#0f172a_34%,#1e293b_36%,#0f172a_40%,#020617_90%)] shadow-[0_18px_45px_rgba(15,23,42,0.35)] border-2 border-amber-500"
                      aria-hidden
                    >
                      <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400" />
                      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900" />
                    </div>
                    <Image
                      src={album.coverUrl}
                      alt={album.name}
                      width={288}
                      height={288}
                      unoptimized
                      className="album-cover pointer-events-none relative z-10 h-full w-full rounded-2xl object-cover shadow-[0_18px_45px_rgba(14,116,144,0.22)]"
                    />
                  </div>

                  <div className={reverse ? "space-y-6 md:order-1" : "space-y-6 md:order-2"}>
                    <div className="flex items-center justify-between gap-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-sky-200/70">
                          Album {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
                          {album.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {album.songs.length} songs · {albumRows.length} platforms
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(album.id)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-600 text-slate-200 transition hover:bg-slate-800"
                        aria-label={isExpanded ? "Collapse tracklist" : "Expand tracklist"}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-500 ${
                            isExpanded ? "rotate-180" : "rotate-0"
                          }`}
                          strokeWidth={1.8}
                        />
                      </button>
                    </div>

                    {albumRows.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-2.5">
                        {albumRows.map((row) => (
                          <a
                            key={`${album.id}-${row.label}-${row.url}`}
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                          >
                            {row.label}
                            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <div
                      className={`mt-2 grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out ${
                        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="min-h-0 divide-y divide-slate-700 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/55">
                        {album.songs.map((song, songIndex) => {
                          const songRows = toRows(song.links);
                          return (
                            <div
                              key={song.id}
                              className="song-pill px-4 py-3.5 md:px-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-200/70">
                                    Track {String(songIndex + 1).padStart(2, "0")}
                                  </p>
                                  <p className="truncate text-sm font-medium text-slate-100">{song.title}</p>
                                </div>
                                {songRows.length > 0 ? (
                                  <div className="flex flex-wrap justify-end gap-1.5">
                                    {songRows.map((row) => (
                                      <a
                                        key={`${song.id}-${row.label}-${row.url}`}
                                        href={row.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200 transition hover:bg-slate-800"
                                      >
                                        {row.label}
                                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500">No links</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-800 bg-slate-950/50 py-8 text-center text-xs text-slate-400 backdrop-blur">
        2AM Signal · A quiet radio for late nights.
      </footer>
    </main>
  );
}
