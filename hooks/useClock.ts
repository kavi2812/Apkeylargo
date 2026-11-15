import { useEffect, useState } from 'react';

export interface ClockSnapshot {
  timeText: string;
  ampmText: string;
  secondsText: string;
  weekdayText: string;
  dateText: string;
  fullDateText: string;
  shortDateText: string;
}

function buildSnapshot(now: Date, use24Hour: boolean): ClockSnapshot {
  const hours24 = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hoursDisplay = use24Hour ? hours24 : hours24 % 12 || 12;
  const paddedHours = use24Hour
    ? String(hoursDisplay).padStart(2, '0')
    : String(hoursDisplay);
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  const ampmText = use24Hour ? '' : hours24 >= 12 ? 'PM' : 'AM';

  const weekdayText = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateText = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const fullDateText = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const shortDateText = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return {
    timeText: `${paddedHours}:${paddedMinutes}`,
    ampmText,
    secondsText: paddedSeconds,
    weekdayText,
    dateText,
    fullDateText,
    shortDateText,
  };
}

export function useClock(use24Hour: boolean): ClockSnapshot {
  const [snapshot, setSnapshot] = useState<ClockSnapshot>(() =>
    buildSnapshot(new Date(), use24Hour)
  );

  useEffect(() => {
    setSnapshot(buildSnapshot(new Date(), use24Hour));
    const timer = window.setInterval(() => {
      setSnapshot(buildSnapshot(new Date(), use24Hour));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [use24Hour]);

  return snapshot;
}
