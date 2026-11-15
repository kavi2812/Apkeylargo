import React, { useRef, useState } from 'react';
import {
  Check,
  CloudRain,
  Compass,
  Disc3,
  Film,
  Flame,
  FolderOpen,
  Headphones,
  Link2,
  Moon,
  Music2,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Youtube,
} from 'lucide-react';
import { usePersistentMedia } from '../hooks/usePersistentMedia';
import { LauncherView } from '../types/launcher';

type MediaController = ReturnType<typeof usePersistentMedia>;

interface PersistentMediaDeckProps {
  media: MediaController;
  view: LauncherView;
  isScreensaver: boolean;
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

const SpotifyGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.58 14.42a.62.62 0 0 1-.86.21c-2.36-1.44-5.33-1.77-8.83-.97a.62.62 0 1 1-.28-1.22c3.83-.87 7.12-.49 9.76 1.12a.62.62 0 0 1 .21.86Zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.7-1.66-6.82-2.14-10.01-1.17a.78.78 0 1 1-.45-1.5c3.64-1.1 8.18-.57 11.27 1.33a.78.78 0 0 1 .26 1.08Zm.1-2.83c-3.24-1.92-8.59-2.1-11.69-1.16a.94.94 0 1 1-.55-1.79c3.56-1.08 9.46-.87 13.19 1.34a.94.94 0 0 1-.95 1.61Z" />
  </svg>
);

const YOUTUBE_ICONS = [Radio, Moon, Headphones, Film];
const MUSIC_ICONS = [Flame, CloudRain, Sun];
const SPOTIFY_ICONS = [Moon, Headphones, Sparkles];

export const PersistentMediaDeck: React.FC<PersistentMediaDeckProps> = ({
  media,
  view,
  isScreensaver,
}) => {
  const [ytInput, setYtInput] = useState('');
  const [ytError, setYtError] = useState(false);
  const [showYtUrlBar, setShowYtUrlBar] = useState(false);

  const [spInput, setSpInput] = useState('');
  const [spError, setSpError] = useState(false);
  const [showSpUrlBar, setShowSpUrlBar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showInWorkspace =
    !isScreensaver && (view === 'home' || view === 'media-full');
  const isMapFullHidden = !isScreensaver && view === 'map-full';

  const screensaverShowYouTube =
    isScreensaver && media.activePlayingSource === 'youtube';
  const screensaverShowMusic =
    isScreensaver && media.activePlayingSource !== 'youtube';

  const showYouTubeCard = showInWorkspace || screensaverShowYouTube;
  const showMusicCard = showInWorkspace || screensaverShowMusic;

  const handleLoadYt = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = media.loadCustomYouTubeUrl(ytInput);
    if (ok) {
      setYtError(false);
      setYtInput('');
      setShowYtUrlBar(false);
    } else {
      setYtError(true);
    }
  };

  const handleLoadSp = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = media.loadCustomSpotifyUrl(spInput);
    if (ok) {
      setSpError(false);
      setSpInput('');
      setShowSpUrlBar(false);
    } else {
      setSpError(true);
    }
  };

  return (
    <div
      className={
        isScreensaver
          ? 'dark fixed inset-x-4 top-[50%] bottom-3 z-30 mx-auto max-w-[460px] flex flex-col justify-center pointer-events-none'
          : isMapFullHidden
            ? 'contents'
            : 'flex-1 min-h-0 flex flex-col gap-2.5'
      }
    >
      {/* 1. YOUTUBE CARD */}
      <section
        aria-label="YouTube"
        className={
          screensaverShowYouTube
            ? 'min-h-0 h-full flex flex-col bg-transparent border-0 shadow-none pointer-events-auto'
            : showInWorkspace
              ? 'flex-[1.15] min-h-0 flex flex-col rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden'
              : 'fixed -left-[9999px] -top-[9999px] w-[320px] h-[180px] opacity-0 pointer-events-none'
        }
      >
        {showInWorkspace && (
          <div className="flex items-center justify-between gap-1.5 px-3 py-1.5 border-b border-slate-200 dark:border-white/8 shrink-0">
            <Youtube className="w-5 h-5 text-[#FF2D2D] shrink-0" />

            <div className="flex items-center gap-1 overflow-x-auto">
              {media.youtubeTracks.map((yt, idx) => {
                const Icon = YOUTUBE_ICONS[idx % YOUTUBE_ICONS.length] ?? Compass;
                return (
                  <button
                    key={yt.id}
                    type="button"
                    onClick={() => media.selectYouTubeTrack(idx)}
                    aria-label={`Stream ${idx + 1}`}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      idx === media.youtubeIndex
                        ? 'bg-[#FF2D2D] text-white'
                        : 'bg-slate-100 dark:bg-white/6 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/12'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowYtUrlBar((v) => !v)}
                aria-label="URL"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  showYtUrlBar
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 dark:bg-white/6 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/12'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {showInWorkspace && showYtUrlBar && (
          <form
            onSubmit={handleLoadYt}
            className="px-3 py-1.5 border-b border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              value={ytInput}
              onChange={(e) => {
                setYtInput(e.target.value);
                setYtError(false);
              }}
              aria-label="YouTube URL"
              className={`flex-1 h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border text-xs text-slate-900 dark:text-slate-100 focus:outline-none ${
                ytError
                  ? 'border-rose-500'
                  : 'border-slate-200 dark:border-white/10 focus:border-[#FF2D2D]'
              }`}
            />
            <button
              type="submit"
              aria-label="Load"
              className="w-9 h-8 rounded-lg bg-[#FF2D2D] text-white flex items-center justify-center shrink-0"
            >
              <Check className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Persistent YouTube Player Iframe Slot */}
        <div
          className={
            screensaverShowYouTube
              ? 'relative flex-1 min-h-[120px] rounded-2xl overflow-hidden bg-transparent'
              : 'relative flex-1 min-h-[110px] bg-black'
          }
        >
          <div id="creta-yt-player" className="w-full h-full" />
        </div>

        {/* Symbol Transport Bar */}
        {showYouTubeCard && (
          <div
            className={
              screensaverShowYouTube
                ? 'pt-2 flex items-center justify-center gap-5 shrink-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]'
                : 'px-3 py-1.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 shrink-0'
            }
          >
            <Youtube className="w-5 h-5 text-[#FF2D2D] shrink-0" />

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={media.prevYouTubeTrack}
                aria-label="Previous"
                className={
                  screensaverShowYouTube
                    ? 'w-10 h-10 text-white/90 hover:text-white flex items-center justify-center'
                    : 'w-10 h-9 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20'
                }
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={media.toggleYouTubePlay}
                aria-label="Play or Pause"
                className={
                  screensaverShowYouTube
                    ? 'w-11 h-11 text-[#FF2D2D] hover:scale-105 flex items-center justify-center transition-transform'
                    : 'w-11 h-9 rounded-lg bg-[#FF2D2D] text-white flex items-center justify-center hover:opacity-95 shadow-sm'
                }
              >
                {media.youtubePlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>
              <button
                type="button"
                onClick={media.nextYouTubeTrack}
                aria-label="Next"
                className={
                  screensaverShowYouTube
                    ? 'w-10 h-10 text-white/90 hover:text-white flex items-center justify-center'
                    : 'w-10 h-9 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20'
                }
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {!screensaverShowYouTube && <div className="w-5 shrink-0" />}
          </div>
        )}
      </section>

      {/* 2. MUSIC & SPOTIFY CARD */}
      <section
        aria-label="Music Media"
        className={
          screensaverShowMusic
            ? 'min-h-0 h-full flex flex-col justify-center bg-transparent border-0 shadow-none pointer-events-auto'
            : showInWorkspace
              ? 'flex-1 min-h-0 flex flex-col rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden'
              : 'fixed -left-[9999px] -top-[9999px] w-[300px] h-[80px] opacity-0 pointer-events-none'
        }
      >
        {showMusicCard && (
          <div
            className={
              screensaverShowMusic
                ? 'flex items-center justify-center gap-4 pb-1.5 shrink-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]'
                : 'flex items-center justify-between gap-1.5 px-3 py-1.5 border-b border-slate-200 dark:border-white/10 shrink-0'
            }
          >
            <div
              className={
                screensaverShowMusic
                  ? 'flex items-center gap-3'
                  : 'flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/10'
              }
            >
              <button
                type="button"
                onClick={() => media.setSpotifyMode('drive-audio')}
                aria-label="Audio Player"
                className={
                  screensaverShowMusic
                    ? `w-9 h-9 flex items-center justify-center transition-colors ${
                        media.spotifyMode === 'drive-audio'
                          ? 'text-[#1DB954]'
                          : 'text-white/75 hover:text-white'
                      }`
                    : `w-9 h-8 rounded-md flex items-center justify-center transition-colors ${
                        media.spotifyMode === 'drive-audio'
                          ? 'bg-[#1DB954] text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300'
                      }`
                }
              >
                <Music2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => media.setSpotifyMode('embed')}
                aria-label="Spotify"
                className={
                  screensaverShowMusic
                    ? `w-9 h-9 flex items-center justify-center transition-colors ${
                        media.spotifyMode === 'embed'
                          ? 'text-[#1DB954]'
                          : 'text-white/75 hover:text-white'
                      }`
                    : `w-9 h-8 rounded-md flex items-center justify-center transition-colors ${
                        media.spotifyMode === 'embed'
                          ? 'bg-[#1DB954] text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300'
                      }`
                }
              >
                <SpotifyGlyph className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {showInWorkspace &&
                (media.spotifyMode === 'drive-audio' ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={(e) => media.addLocalAudioFiles(e.target.files)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Open USB Audio"
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/15"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSpUrlBar((v) => !v)}
                    aria-label="Spotify URL"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      showSpUrlBar
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                ))}

              <button
                type="button"
                onClick={media.toggleMute}
                aria-label="Mute"
                className={
                  screensaverShowMusic
                    ? 'w-9 h-9 flex items-center justify-center text-white/90 hover:text-white'
                    : 'w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20'
                }
              >
                {media.muted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {showInWorkspace &&
          media.spotifyMode === 'embed' &&
          showSpUrlBar && (
            <form
              onSubmit={handleLoadSp}
              className="px-3 py-1.5 border-b border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-1.5 shrink-0"
            >
              <input
                type="text"
                value={spInput}
                onChange={(e) => {
                  setSpInput(e.target.value);
                  setSpError(false);
                }}
                aria-label="Spotify URL"
                className={`flex-1 h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border text-xs text-slate-900 dark:text-slate-100 focus:outline-none ${
                  spError
                    ? 'border-rose-500'
                    : 'border-slate-200 dark:border-white/10 focus:border-[#1DB954]'
                }`}
              />
              <button
                type="submit"
                aria-label="Load"
                className="w-9 h-8 rounded-lg bg-[#1DB954] text-slate-950 flex items-center justify-center shrink-0"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
          )}

        {/* PERSISTENT SPOTIFY EMBED IFRAME */}
        <div
          className={
            showMusicCard && media.spotifyMode === 'embed'
              ? screensaverShowMusic
                ? 'flex-1 min-h-0 flex flex-col gap-2 bg-transparent'
                : 'flex-1 min-h-0 flex flex-col p-2.5 gap-2'
              : 'fixed -left-[9999px] -top-[9999px] w-[300px] h-[80px] opacity-0 pointer-events-none'
          }
        >
          <div className="flex-1 min-h-[80px] rounded-xl overflow-hidden bg-transparent">
            <iframe
              title="Spotify"
              src={media.activeSpotifyEmbedUrl}
              width="100%"
              height="100%"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full h-full border-0"
            />
          </div>

          {showMusicCard && media.spotifyMode === 'embed' && (
            <div className="flex items-center justify-center gap-3 shrink-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {media.spotifyPresets.map((preset, idx) => {
                const Icon = SPOTIFY_ICONS[idx % SPOTIFY_ICONS.length] ?? Disc3;
                const active =
                  !media.customSpotifyEmbedUrl &&
                  media.activeSpotifyPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => media.selectSpotifyPreset(preset.id)}
                    aria-label={`Playlist ${idx + 1}`}
                    className={
                      screensaverShowMusic
                        ? `w-9 h-9 flex items-center justify-center transition-colors ${
                            active
                              ? 'text-[#1DB954]'
                              : 'text-white/75 hover:text-white'
                          }`
                        : `w-10 h-9 rounded-lg flex items-center justify-center transition-colors ${
                            active
                              ? 'bg-[#1DB954] text-slate-950'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                          }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MUSIC / USB SYMBOL DECK */}
        {showMusicCard && media.spotifyMode === 'drive-audio' && (
          <div
            className={
              screensaverShowMusic
                ? 'flex-1 min-h-0 flex flex-col justify-center gap-3 px-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]'
                : 'flex-1 min-h-0 flex flex-col justify-between p-2.5 gap-1.5'
            }
          >
            {/* Artwork + Progress Bar (Numeric duration only, no names) */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={
                  screensaverShowMusic
                    ? 'relative w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center'
                    : 'relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-center'
                }
              >
                <img
                  src={media.currentDriveTrack.coverUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Disc3 className="w-5 h-5 text-slate-400 absolute -z-10" />
              </div>

              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                <div
                  className={
                    screensaverShowMusic
                      ? 'h-1.5 w-full rounded-full bg-white/25 overflow-hidden'
                      : 'h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden'
                  }
                >
                  <div
                    className="h-full bg-[#1DB954] transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (media.driveProgressSec /
                          Math.max(1, media.currentDriveTrack.durationSec)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <div
                  className={
                    screensaverShowMusic
                      ? 'flex justify-between text-xs text-white/85 font-mono-tabular'
                      : 'flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular'
                  }
                >
                  <span>{formatDuration(media.driveProgressSec)}</span>
                  <span>{formatDuration(media.currentDriveTrack.durationSec)}</span>
                </div>
              </div>
            </div>

            {/* Centered Tactile Transport Symbols */}
            <div className="flex items-center justify-center gap-6 shrink-0">
              <button
                type="button"
                onClick={media.prevDriveTrack}
                aria-label="Previous"
                className={
                  screensaverShowMusic
                    ? 'w-11 h-11 text-white/90 hover:text-white flex items-center justify-center transition-transform active:scale-95'
                    : 'w-11 h-11 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors'
                }
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              <button
                type="button"
                onClick={media.toggleDrivePlay}
                aria-label="Play or Pause"
                className={
                  screensaverShowMusic
                    ? 'w-12 h-12 text-[#1DB954] hover:scale-105 flex items-center justify-center transition-transform active:scale-95'
                    : 'w-12 h-12 rounded-full bg-amber-200 text-slate-950 flex items-center justify-center hover:brightness-105 shadow-md transition-transform active:scale-95'
                }
              >
                {media.drivePlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={media.nextDriveTrack}
                aria-label="Next"
                className={
                  screensaverShowMusic
                    ? 'w-11 h-11 text-white/90 hover:text-white flex items-center justify-center transition-transform active:scale-95'
                    : 'w-11 h-11 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors'
                }
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Symbol Track Selector */}
            <div className="flex items-center justify-center gap-3 overflow-x-auto shrink-0">
              {media.driveTracks.map((track, idx) => {
                const Icon = MUSIC_ICONS[idx % MUSIC_ICONS.length] ?? Disc3;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => media.selectDriveTrack(idx)}
                    aria-label={`Track ${idx + 1}`}
                    className={
                      screensaverShowMusic
                        ? `w-9 h-8 flex items-center justify-center shrink-0 transition-colors ${
                            idx === media.driveTrackIndex
                              ? 'text-white scale-110'
                              : 'text-white/60 hover:text-white/90'
                          }`
                        : `w-10 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            idx === media.driveTrackIndex
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                          }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
