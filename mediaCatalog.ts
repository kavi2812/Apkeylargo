import {
  DriveAudioTrack,
  SpotifyPlaylistPreset,
  YouTubeTrack,
} from '../types/launcher';

export const COVER_NIGHT_DRIVE =
  '/src/assets/images/cover_night_drive_1794719737765.jpg';
export const COVER_MONSOON_LOFI =
  '/src/assets/images/cover_monsoon_lofi_1794719736863.jpg';
export const COVER_COASTAL_CRUISE =
  '/src/assets/images/cover_coastal_cruise_1794719736748.jpg';

export const YOUTUBE_PRESETS: YouTubeTrack[] = [
  {
    id: 'yt-lofi-drive',
    videoId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio · Beats to Relax / Drive To',
    channel: 'Lofi Girl',
    category: 'Live Radio',
  },
  {
    id: 'yt-synthwave',
    videoId: '4xDzrJKXOOY',
    title: 'Synthwave Radio · Chill Synth / Retro Beats',
    channel: 'Lofi Girl Synthwave',
    category: 'Night Drive',
  },
  {
    id: 'yt-chill-mix',
    videoId: '5yx6BWlEVcY',
    title: 'Chillhop Radio · Jazzy & Lofi Hip Hop Beats',
    channel: 'Chillhop Music',
    category: 'Highway Chill',
  },
  {
    id: 'yt-scenic-4k',
    videoId: 'LXb3EKWsInQ',
    title: 'Scenic Roadtrip 4K · Ambient Instrumental',
    channel: 'Scenic Drives',
    category: 'Ambient Visual',
  },
];

export const SPOTIFY_PRESETS: SpotifyPlaylistPreset[] = [
  {
    id: 'sp-night-drive',
    name: 'Night Rider',
    subtitle: 'Electronic & Atmospheric Highway Mix',
    spotifyUri: 'https://open.spotify.com/playlist/37i9dQZF1DX6GJXiuZRisr',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX6GJXiuZRisr?utm_source=generator&theme=0',
    coverUrl: COVER_NIGHT_DRIVE,
  },
  {
    id: 'sp-lofi-beats',
    name: 'Lofi Beats',
    subtitle: 'Chill Cabin Instrumentals',
    spotifyUri: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0',
    coverUrl: COVER_MONSOON_LOFI,
  },
  {
    id: 'sp-mint',
    name: 'Mint Roadtrip',
    subtitle: 'Upbeat Dance & Highway Energy',
    spotifyUri: 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
    embedUrl:
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX4dyzvuaRJ0n?utm_source=generator&theme=0',
    coverUrl: COVER_COASTAL_CRUISE,
  },
];

export const DRIVE_AUDIO_TRACKS: DriveAudioTrack[] = [
  {
    id: 'drive-night',
    title: 'Expressway Midnight (Synth)',
    artist: 'Cabin Audio',
    album: 'Night Drive Sessions',
    durationSec: 240,
    coverUrl: COVER_NIGHT_DRIVE,
    kind: 'synth-groove',
    synthPreset: 'night-drive',
  },
  {
    id: 'drive-monsoon',
    title: 'Monsoon Windshield Lo-Fi',
    artist: 'Cabin Audio',
    album: 'Rainy Commute',
    durationSec: 210,
    coverUrl: COVER_MONSOON_LOFI,
    kind: 'synth-groove',
    synthPreset: 'monsoon-lofi',
  },
  {
    id: 'drive-coastal',
    title: 'Western Ghats Golden Hour',
    artist: 'Cabin Audio',
    album: 'Highway Sessions',
    durationSec: 260,
    coverUrl: COVER_COASTAL_CRUISE,
    kind: 'synth-groove',
    synthPreset: 'coastal-cruise',
  },
];

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').slice(0, 11);
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    const vParam = url.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;
    const parts = url.pathname.split('/').filter(Boolean);
    const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live');
    if (embedIdx !== -1 && parts[embedIdx + 1]) {
      const id = parts[embedIdx + 1].slice(0, 11);
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function toSpotifyEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith('spotify:')) {
      const [, type, id] = trimmed.split(':');
      if (type && id) {
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
      }
    }
    const url = new URL(trimmed);
    if (!url.hostname.includes('spotify.com')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const cleanParts = parts[0] === 'embed' ? parts.slice(1) : parts;
    // Strip optional locale segment like intl-in
    const normalized = cleanParts[0]?.startsWith('intl-') ? cleanParts.slice(1) : cleanParts;
    if (normalized.length >= 2) {
      const [type, id] = normalized;
      if (['track', 'album', 'playlist', 'episode', 'show', 'artist'].includes(type)) {
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
      }
    }
  } catch {
    return null;
  }
  return null;
}
