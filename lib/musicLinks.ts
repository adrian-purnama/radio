import { z } from "zod";

export type StreamingLinks = {
  youtubeMusic: string;
  deezer: string;
  spotify: string;
  customLinks: Array<{ label: string; url: string }>;
};

export function streamingLinksFromUnknown(raw: unknown): StreamingLinks {
  if (!raw || typeof raw !== "object") {
    return { youtubeMusic: "", deezer: "", spotify: "", customLinks: [] };
  }

  const links = raw as Record<string, unknown>;
  const customLinks = Array.isArray(links.customLinks)
    ? (links.customLinks as { label?: unknown; url?: unknown }[])
        .map((entry) => ({
          label: typeof entry.label === "string" ? entry.label.trim() : "",
          url: typeof entry.url === "string" ? entry.url.trim() : "",
        }))
        .filter((entry) => entry.label.length > 0 && entry.url.length > 0)
    : [];

  return {
    youtubeMusic: typeof links.youtubeMusic === "string" ? links.youtubeMusic.trim() : "",
    deezer: typeof links.deezer === "string" ? links.deezer.trim() : "",
    spotify: typeof links.spotify === "string" ? links.spotify.trim() : "",
    customLinks,
  };
}

export const musicLinksSchema = z.object({
  youtubeMusic: z.string().trim().url().optional().or(z.literal("")),
  deezer: z.string().trim().url().optional().or(z.literal("")),
  spotify: z.string().trim().url().optional().or(z.literal("")),
  customLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        url: z.string().trim().url(),
      }),
    )
    .optional(),
  customName: z.string().trim().max(80).optional().or(z.literal("")),
  customUrl: z.string().trim().url().optional().or(z.literal("")),
});

export type MusicLinksInput = z.input<typeof musicLinksSchema>;

export function normalizeMusicLinks(input: MusicLinksInput) {
  const parsed = musicLinksSchema.parse(input);
  return {
    youtubeMusic: parsed.youtubeMusic || "",
    deezer: parsed.deezer || "",
    spotify: parsed.spotify || "",
    customLinks:
      parsed.customLinks && parsed.customLinks.length > 0
        ? parsed.customLinks
        : parsed.customName && parsed.customUrl
          ? [{ label: parsed.customName, url: parsed.customUrl }]
          : [],
  };
}
