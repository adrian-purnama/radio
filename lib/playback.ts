import { SongModel } from "@/models/Song";
import { AlbumModel } from "@/models/Album";
import { connectToDatabase } from "@/lib/db";
import { streamingLinksFromUnknown, type StreamingLinks } from "@/lib/musicLinks";

export type PlaybackMode = "album-loop" | "random-loop";

export type PlaybackSong = {
  id: string;
  title: string;
  albumId: string;
  albumName: string;
  isAdminFavorite: boolean;
  albumIsAdminFavorite: boolean;
  coverUrl: string;
  audioUrl: string;
  orderIndex: number;
  albumLinks: StreamingLinks;
  songLinks: StreamingLinks;
};

export async function getCatalogSongs() {
  await connectToDatabase();

  const songs = await SongModel.find().sort({ createdAt: 1 }).lean();
  if (songs.length === 0) {
    return [];
  }

  const albumIds = [...new Set(songs.map((song) => String(song.albumId)))];
  const albums = await AlbumModel.find({ _id: { $in: albumIds } }).lean();
  const albumMap = new Map(albums.map((album) => [String(album._id), album]));

  return songs
    .map<PlaybackSong | null>((song) => {
      const album = albumMap.get(String(song.albumId));
      if (!album) {
        return null;
      }

      return {
        id: String(song._id),
        title: song.title,
        albumId: String(song.albumId),
        albumName: album.name,
        isAdminFavorite: Boolean(song.isAdminFavorite),
        albumIsAdminFavorite: Boolean(album.isAdminFavorite),
        coverUrl: `/api/media/${String(album.coverImageFileId)}`,
        audioUrl: `/api/media/${String(song.audioFileId)}`,
        orderIndex: song.orderIndex,
        albumLinks: streamingLinksFromUnknown(album.links),
        songLinks: streamingLinksFromUnknown(song.links),
      };
    })
    .filter((song): song is PlaybackSong => Boolean(song));
}

export function pickNextSong({
  songs,
  mode,
  currentSongId,
  selectedAlbumId,
}: {
  songs: PlaybackSong[];
  mode: PlaybackMode;
  currentSongId?: string | null;
  selectedAlbumId?: string | null;
}) {
  if (songs.length === 0) {
    return null;
  }

  const albumScopedSongs =
    mode === "album-loop" && selectedAlbumId
      ? songs
          .filter((song) => song.albumId === selectedAlbumId)
          .sort((a, b) => a.orderIndex - b.orderIndex)
      : songs;

  if (albumScopedSongs.length === 0) {
    return null;
  }

  if (!currentSongId) {
    return albumScopedSongs[0];
  }

  const currentIndex = albumScopedSongs.findIndex((song) => song.id === currentSongId);
  if (currentIndex < 0) {
    return albumScopedSongs[0];
  }

  if (mode === "random-loop") {
    if (albumScopedSongs.length === 1) {
      return albumScopedSongs[0];
    }

    const candidates = albumScopedSongs.filter((song) => song.id !== currentSongId);
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  const currentSong = albumScopedSongs[currentIndex];
  const sameAlbumSongs = albumScopedSongs
    .filter((song) => song.albumId === currentSong.albumId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const inAlbumIndex = sameAlbumSongs.findIndex((song) => song.id === currentSong.id);
  if (inAlbumIndex < 0) {
    return sameAlbumSongs[0] ?? albumScopedSongs[0];
  }

  const nextInAlbum = sameAlbumSongs[(inAlbumIndex + 1) % sameAlbumSongs.length];
  return nextInAlbum ?? albumScopedSongs[0];
}
