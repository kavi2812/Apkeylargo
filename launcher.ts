export type LauncherView = 'home' | 'map-full' | 'media-full';

export type MediaTab = 'spotify' | 'youtube';

export type SpotifyMode = 'embed' | 'drive-audio';

export type CockpitTheme = 'dark' | 'light';

export type ScreensaverTimeoutSec = 0 | 15 | 30 | 60 | 120;

export interface LauncherSettings {
  theme: CockpitTheme;
  use24Hour: boolean;
  screensaverTimeoutSec: ScreensaverTimeoutSec;
  brightnessPercent: number;
  autoGpsFollow: boolean;
  screensaverDimOverlay: boolean;
}

export interface YouTubeTrack {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  category: string;
}

export interface SpotifyPlaylistPreset {
  id: string;
  name: string;
  subtitle: string;
  spotifyUri: string;
  embedUrl: string;
  coverUrl: string;
}

export interface DriveAudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  coverUrl: string;
  kind: 'synth-groove' | 'local-file';
  synthPreset?: 'night-drive' | 'monsoon-lofi' | 'coastal-cruise';
  objectUrl?: string;
}

export interface ActiveRouteSummary {
  destinationName: string;
  destinationAddress: string;
  destinationLocation: google.maps.LatLngLiteral;
  distanceText: string;
  durationText: string;
  distanceMeters: number;
  durationMillis: number;
}

export interface NearbyPlacePin {
  id: string;
  name: string;
  address: string;
  category: string;
  location: google.maps.LatLngLiteral;
}
