import React, { useCallback, useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import {
  Clock,
  Home,
  LayoutGrid,
  Map as MapIcon,
  Monitor,
  Moon,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { InteractiveMapCanvas } from './components/InteractiveMapCanvas';
import { KeyLargoSettingsModal } from './components/KeyLargoSettingsModal';
import { PersistentMediaDeck } from './components/PersistentMediaDeck';
import { ScreensaverOverlay } from './components/ScreensaverOverlay';
import { useClock } from './hooks/useClock';
import { useGeolocation } from './hooks/useGeolocation';
import { usePersistentMedia } from './hooks/usePersistentMedia';
import {
  ActiveRouteSummary,
  LauncherSettings,
  LauncherView,
} from './types/launcher';

const SETTINGS_STORAGE_KEY = 'car_launcher_settings_v2';

const DEFAULT_SETTINGS: LauncherSettings = {
  theme: 'dark',
  use24Hour: false,
  screensaverTimeoutSec: 30,
  brightnessPercent: 100,
  autoGpsFollow: true,
  screensaverDimOverlay: true,
};

function loadInitialSettings(): LauncherSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  const [settings, setSettings] = useState<LauncherSettings>(loadInitialSettings);
  const [view, setView] = useState<LauncherView>('home');
  const [isScreensaver, setIsScreensaver] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<ActiveRouteSummary | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const clock = useClock(settings.use24Hour);
  const geo = useGeolocation();
  const media = usePersistentMedia();

  const mapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<LauncherSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Auto-screensaver turns ON ONLY when music plays (never interrupts YouTube video)
  const onlyMusicPlaying =
    !media.youtubePlaying &&
    (media.drivePlaying || media.spotifyMode === 'embed');

  useEffect(() => {
    if (
      settings.screensaverTimeoutSec === 0 ||
      isScreensaver ||
      settingsOpen ||
      !onlyMusicPlaying
    ) {
      return;
    }

    let timerId = window.setTimeout(() => {
      setIsScreensaver(true);
    }, settings.screensaverTimeoutSec * 1000);

    const resetTimer = () => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        setIsScreensaver(true);
      }, settings.screensaverTimeoutSec * 1000);
    };

    window.addEventListener('pointerdown', resetTimer, { passive: true });
    window.addEventListener('keydown', resetTimer);

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('pointerdown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [
    settings.screensaverTimeoutSec,
    isScreensaver,
    settingsOpen,
    onlyMusicPlaying,
  ]);

  // Steering wheel / keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        media.toggleActivePlay();
      } else if (e.key === 'ArrowRight' || e.key === 'MediaTrackNext') {
        media.nextActiveTrack();
      } else if (e.key === 'ArrowLeft' || e.key === 'MediaTrackPrevious') {
        media.prevActiveTrack();
      } else if (e.key === 's' || e.key === 'S') {
        setIsScreensaver((prev) => !prev);
      } else if (e.key === 'Escape' && isScreensaver) {
        setIsScreensaver(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, isScreensaver]);

  const dimmerOpacity = Math.max(0, (100 - settings.brightnessPercent) * 0.0085);

  const leftColumnClass = isScreensaver
    ? 'contents'
    : view === 'map-full' || view === 'media-full'
      ? 'flex-1 min-w-0 h-full flex flex-col gap-2'
      : 'flex-[1.38] min-w-0 h-full flex flex-col gap-2';

  const mapWrapperClass = isScreensaver
    ? 'fixed inset-0 z-10'
    : 'flex-1 min-h-0 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm';

  const rightDeckWrapperClass = isScreensaver
    ? 'contents'
    : view === 'map-full'
      ? 'contents'
      : view === 'media-full'
        ? 'flex-[1.15] min-w-[360px] h-full flex flex-col gap-2.5'
        : 'w-[368px] lg:w-[396px] xl:w-[440px] shrink-0 h-full flex flex-col gap-2.5';

  return (
    <div className="relative w-screen h-dvh overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Tier 1/2 Google Maps Platform Quota Notice Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm shrink-0">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main 3-Zone Cockpit Layout */}
      <div className="relative flex-1 min-h-0 flex">
        {/* LEFT VERTICAL RAIL (Symbol-Only Navigation + Separate Screensaver Button) */}
        {!isScreensaver && (
          <nav
            aria-label="Navigation rail"
            className="w-[70px] shrink-0 h-full py-3 px-1.5 bg-white/95 dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 flex flex-col items-center justify-between z-30"
          >
            {/* Primary View Symbols */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setView('home')}
                aria-label="Home"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  view === 'home'
                    ? 'bg-sky-500/15 text-sky-600 dark:text-amber-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <Home className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setView('map-full')}
                aria-label="Map"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  view === 'map-full'
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <MapIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setView('media-full')}
                aria-label="Media"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  view === 'media-full'
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            {/* Separate Dedicated Screensaver Switch Button */}
            <div className="flex flex-col items-center gap-2 py-2 border-y border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsScreensaver(true)}
                aria-label="Screensaver"
                className="w-12 h-12 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 hover:bg-sky-500/25 flex items-center justify-center transition-colors shadow-sm"
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Utility Symbols: Theme + Settings + Numeric Speed */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    theme: settings.theme === 'dark' ? 'light' : 'dark',
                  })
                }
                aria-label="Theme"
                className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
              >
                {settings.theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
                className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {geo.speedKmh !== null && (
                <span className="text-[10px] font-mono-tabular text-slate-500 dark:text-slate-400">
                  {geo.speedKmh}
                </span>
              )}
            </div>
          </nav>
        )}

        {/* MAIN WORKSPACE */}
        <main className="relative flex-1 min-w-0 min-h-0 flex p-2.5 gap-2.5">
          {/* Left Map Column: Large Time + Day/Date Below Time + Persistent Map */}
          <div className={leftColumnClass}>
            {!isScreensaver && (
              <section
                aria-label="Time and Date"
                className="rounded-2xl bg-gradient-to-r from-white via-slate-50 to-sky-50/70 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/90 border border-slate-200 dark:border-white/10 shadow-sm px-5 py-2.5 flex items-center justify-between gap-4 shrink-0"
              >
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-4xl sm:text-5xl tracking-[-0.03em] text-slate-900 dark:text-white tabular-nums leading-none">
                      {clock.timeText}
                    </span>
                    {clock.ampmText ? (
                      <span className="font-display font-bold text-base sm:text-lg text-sky-600 dark:text-amber-300 tabular-nums tracking-wide">
                        {clock.ampmText}
                      </span>
                    ) : (
                      <span className="font-mono-tabular text-base text-slate-400">
                        :{clock.secondsText}
                      </span>
                    )}
                  </div>

                  <p className="font-display font-medium text-sm sm:text-base text-slate-600 dark:text-sky-300 mt-1 leading-none truncate">
                    {clock.weekdayText} · {clock.fullDateText}
                  </p>
                </div>

                <Clock className="w-6 h-6 text-slate-300 dark:text-white/15 shrink-0" />
              </section>
            )}

            {/* Persistent Interactive Google Map */}
            <div className={mapWrapperClass}>
              {mapsApiKey ? (
                <APIProvider
                  apiKey={mapsApiKey}
                  libraries={['places', 'routes']}
                  language="en"
                >
                  <InteractiveMapCanvas
                    theme={settings.theme}
                    carPosition={geo.position}
                    carHeading={geo.heading}
                    gpsActive={geo.gpsActive}
                    onRequestGps={geo.requestGpsLock}
                    isScreensaver={isScreensaver}
                    autoGpsFollow={settings.autoGpsFollow}
                    activeRoute={activeRoute}
                    onRouteComputed={setActiveRoute}
                  />
                </APIProvider>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-900">
                  <MapIcon className="w-10 h-10 text-sky-500" />
                </div>
              )}
            </div>
          </div>

          {/* Right Side: YouTube (Top) & Music Media (Down) */}
          <div className={rightDeckWrapperClass}>
            <PersistentMediaDeck
              media={media}
              view={view}
              isScreensaver={isScreensaver}
            />
          </div>
        </main>
      </div>

      {/* Screensaver Overlay */}
      {isScreensaver && (
        <ScreensaverOverlay
          clock={clock}
          speedKmh={geo.speedKmh}
          activeRoute={activeRoute}
          dimOverlay={settings.screensaverDimOverlay}
          onExit={() => setIsScreensaver(false)}
        />
      )}

      {/* Symbol-Based Settings Modal */}
      <KeyLargoSettingsModal
        open={settingsOpen}
        settings={settings}
        onUpdate={updateSettings}
        onClose={() => setSettingsOpen(false)}
        onStartScreensaver={() => setIsScreensaver(true)}
      />

      {/* Brightness Filter Overlay */}
      {dimmerOpacity > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[60] bg-black transition-opacity duration-200"
          style={{ opacity: dimmerOpacity }}
        />
      )}
    </div>
  );
}
