import React from 'react';
import {
  Contrast,
  Download,
  LocateFixed,
  Monitor,
  Moon,
  SlidersHorizontal,
  Sun,
  SunMedium,
  Timer,
  X,
} from 'lucide-react';
import { LauncherSettings, ScreensaverTimeoutSec } from '../types/launcher';

interface KeyLargoSettingsModalProps {
  open: boolean;
  settings: LauncherSettings;
  onUpdate: (patch: Partial<LauncherSettings>) => void;
  onClose: () => void;
  onStartScreensaver: () => void;
}

const TIMEOUT_OPTIONS: Array<{ value: ScreensaverTimeoutSec; label: string }> = [
  { value: 0, label: '0' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 120, label: '2m' },
];

export const KeyLargoSettingsModal: React.FC<KeyLargoSettingsModalProps> = ({
  open,
  settings,
  onUpdate,
  onClose,
  onStartScreensaver,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto cockpit-scroll rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/12 shadow-2xl p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Symbol Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-3">
          <SlidersHorizontal className="w-5 h-5 text-sky-500" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme + 12h/24h */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => onUpdate({ theme: 'dark' })}
              aria-label="Night"
              className={`flex-1 min-h-[42px] rounded-lg flex items-center justify-center transition-colors ${
                settings.theme === 'dark'
                  ? 'bg-slate-950 text-amber-300 shadow'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ theme: 'light' })}
              aria-label="Day"
              className={`flex-1 min-h-[42px] rounded-lg flex items-center justify-center transition-colors ${
                settings.theme === 'light'
                  ? 'bg-white text-amber-500 shadow'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => onUpdate({ use24Hour: false })}
              className={`flex-1 min-h-[42px] rounded-lg text-xs font-mono-tabular font-semibold transition-colors ${
                !settings.use24Hour
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              12H
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ use24Hour: true })}
              className={`flex-1 min-h-[42px] rounded-lg text-xs font-mono-tabular font-semibold transition-colors ${
                settings.use24Hour
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              24H
            </button>
          </div>
        </div>

        {/* Auto Screensaver Timer (Music Only) */}
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-sky-500 shrink-0" />
          <div className="flex-1 grid grid-cols-5 gap-1.5">
            {TIMEOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate({ screensaverTimeoutSec: opt.value })}
                className={`min-h-[40px] rounded-xl text-xs font-mono-tabular font-semibold border transition-colors ${
                  settings.screensaverTimeoutSec === opt.value
                    ? 'bg-sky-500 text-white border-sky-400'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brightness Filter Slider */}
        <div className="flex items-center gap-3">
          <SunMedium className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="range"
            min={45}
            max={100}
            value={settings.brightnessPercent}
            onChange={(e) => onUpdate({ brightnessPercent: Number(e.target.value) })}
            aria-label="Brightness"
            className="flex-1 accent-sky-500 cursor-pointer"
          />
          <span className="font-mono-tabular text-xs font-semibold text-slate-900 dark:text-white w-10 text-right">
            {settings.brightnessPercent}%
          </span>
        </div>

        {/* Symbol Toggles + Screensaver + ZIP Download */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => onUpdate({ autoGpsFollow: !settings.autoGpsFollow })}
            aria-label="Auto GPS Follow"
            className={`min-h-[46px] rounded-xl border flex items-center justify-center transition-colors ${
              settings.autoGpsFollow
                ? 'bg-sky-500/15 text-sky-500 border-sky-500/40'
                : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'
            }`}
          >
            <LocateFixed className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdate({ screensaverDimOverlay: !settings.screensaverDimOverlay })
            }
            aria-label="Screensaver Scrim"
            className={`min-h-[46px] rounded-xl border flex items-center justify-center transition-colors ${
              settings.screensaverDimOverlay
                ? 'bg-sky-500/15 text-sky-500 border-sky-500/40'
                : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'
            }`}
          >
            <Contrast className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onStartScreensaver();
            }}
            aria-label="Screensaver"
            className="min-h-[46px] rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-400 transition-colors"
          >
            <Monitor className="w-5 h-5" />
          </button>

          <a
            href="/car-launcher.zip"
            download="car-launcher.zip"
            aria-label="Download ZIP"
            className="min-h-[46px] rounded-xl bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>

      </div>
    </div>
  );
};
                
