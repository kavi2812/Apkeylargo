import { useCallback, useEffect, useState } from 'react';

export interface GeolocationState {
  position: google.maps.LatLngLiteral;
  speedKmh: number | null;
  heading: number | null;
  gpsActive: boolean;
  gpsStatusText: string;
  requestGpsLock: () => void;
}

// Default center: New Delhi (Creta E primary market fallback until GPS lock)
const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 28.6139,
  lng: 77.209,
};

export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('GPS Standby');

  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatusText('GPS Unavailable');
      return undefined;
    }

    setGpsStatusText('Acquiring GPS');
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setSpeedKmh(
          typeof pos.coords.speed === 'number' && !Number.isNaN(pos.coords.speed)
            ? Math.max(0, Math.round(pos.coords.speed * 3.6))
            : 0
        );
        setHeading(
          typeof pos.coords.heading === 'number' && !Number.isNaN(pos.coords.heading)
            ? pos.coords.heading
            : null
        );
        setGpsActive(true);
        setGpsStatusText('GPS Locked');
      },
      () => {
        setGpsActive(false);
        setGpsStatusText('Default Location');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 8000,
      }
    );

    return watchId;
  }, []);

  useEffect(() => {
    let watchId: number | undefined;
    // Check permission non-intrusively; if already granted, start watching immediately
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            watchId = startWatch();
          }
        })
        .catch(() => {
          // Wait for explicit tap on Locate button
        });
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [startWatch]);

  const requestGpsLock = useCallback(() => {
    startWatch();
  }, [startWatch]);

  return {
    position,
    speedKmh,
    heading,
    gpsActive,
    gpsStatusText,
    requestGpsLock,
  };
}
