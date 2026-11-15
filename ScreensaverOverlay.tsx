import React from 'react';
import { Gauge, Minimize2, Navigation } from 'lucide-react';
import { ClockSnapshot } from '../hooks/useClock';
import { ActiveRouteSummary } from '../types/launcher';

interface ScreensaverOverlayProps {
  clock: ClockSnapshot;
  speedKmh: number | null;
  activeRoute: ActiveRouteSummary | null;
  dimOverlay: boolean;
  onExit: () => void;
}

export const ScreensaverOverlay: React.FC<ScreensaverOverlayProps> = ({
  clock,
  speedKmh,
  activeRoute,
  dimOverlay,
  onExit,
}) => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col">
      {/* Mild 50% translucent map tint (no borders/boxes) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          dimOverlay ? 'bg-slate-950/50' : 'bg-transparent'
        }`}
      />

      {/* Upper 50% Map Region: Borderless Centered Time, Day & Date Sunk in Map */}
      <div className="relative z-10 h-1/2 w-full flex flex-col items-center justify-center px-5 pt-3 pb-2">
        {/* Top Corner Borderless Symbols: Speed (left) & Exit Screensaver (right) */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between gap-4">
          {speedKmh !== null ? (
            <div className="pointer-events-auto inline-flex items-center gap-2 px-2 py-1 text-xs font-mono-tabular text-white font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span>{speedKmh}</span>
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onExit}
            aria-label="Exit screensaver"
            className="pointer-events-auto w-11 h-11 flex items-center justify-center text-white/90 hover:text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-transform active:scale-95"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        </div>

        {/* Centered Large Stylish Time with Smaller Day & Date Below — No Border or Background */}
        <button
          type="button"
          onClick={onExit}
          aria-label="Wake"
          className="pointer-events-auto flex flex-col items-center justify-center text-center bg-transparent border-0 shadow-none px-4 py-2 drop-shadow-[0_3px_14px_rgba(0,0,0,0.9)] transition-opacity hover:opacity-90"
        >
          <div className="flex items-baseline justify-center gap-2.5">
            <span className="font-display font-bold text-6xl sm:text-7xl md:text-8xl tracking-[-0.03em] text-white tabular-nums leading-none">
              {clock.timeText}
            </span>
            {clock.ampmText ? (
              <span className="font-display font-bold text-xl sm:text-2xl text-amber-300 tabular-nums">
                {clock.ampmText}
              </span>
            ) : (
              <span className="font-mono-tabular text-xl sm:text-2xl text-sky-300">
                :{clock.secondsText}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-1">
            <span className="font-display font-semibold text-base sm:text-xl text-white tracking-tight">
              {clock.weekdayText}
            </span>
            <span aria-hidden="true" className="text-sky-300 text-base">
              ·
            </span>
            <span className="font-display font-medium text-base sm:text-lg text-sky-200">
              {clock.fullDateText}
            </span>
          </div>

          {activeRoute && (
            <div className="mt-1.5 flex items-center justify-center gap-2 text-xs sm:text-sm text-sky-200 font-medium tabular-nums">
              <Navigation className="w-4 h-4 shrink-0" />
              <span>
                {activeRoute.durationText} · {activeRoute.distanceText}
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
