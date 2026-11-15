import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  Fuel,
  LocateFixed,
  Minus,
  Navigation,
  ParkingCircle,
  Plus,
  Search,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';
import {
  ActiveRouteSummary,
  CockpitTheme,
  NearbyPlacePin,
} from '../types/launcher';

interface InteractiveMapCanvasProps {
  theme: CockpitTheme;
  carPosition: google.maps.LatLngLiteral;
  carHeading: number | null;
  gpsActive: boolean;
  onRequestGps: () => void;
  isScreensaver: boolean;
  autoGpsFollow: boolean;
  activeRoute: ActiveRouteSummary | null;
  onRouteComputed: (route: ActiveRouteSummary | null) => void;
}

function triggerQuotaBannerIfExhausted(err: unknown) {
  const msg = String(err ?? '');
  if (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('Quota')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

export const InteractiveMapCanvas: React.FC<InteractiveMapCanvasProps> = ({
  theme,
  carPosition,
  carHeading,
  gpsActive,
  onRequestGps,
  isScreensaver,
  autoGpsFollow,
  activeRoute,
  onRouteComputed,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [nearbyPins, setNearbyPins] = useState<NearbyPlacePin[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !autoGpsFollow || activeRoute) return;
    map.panTo(carPosition);
  }, [map, carPosition, autoGpsFollow, activeRoute]);

  useEffect(() => {
    if (!placesLib || isScreensaver) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new AutocompleteSessionToken();
      }
      AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        sessionToken: sessionTokenRef.current,
        locationBias: {
          center: carPosition,
          radius: 35000,
        },
      })
        .then((res) => {
          setSuggestions(res.suggestions ?? []);
        })
        .catch((err) => {
          triggerQuotaBannerIfExhausted(err);
        });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [placesLib, searchQuery, carPosition, isScreensaver]);

  const clearRoute = useCallback(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteComputed(null);
  }, [onRouteComputed]);

  const computeDrivingRoute = useCallback(
    async (
      destination: google.maps.LatLngLiteral,
      name: string,
      address: string
    ) => {
      if (!routesLib || !map) return;
      setRouteLoading(true);

      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];

      try {
        const request = {
          origin: carPosition,
          destination,
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        };
        const response = await (
          routesLib.Route as unknown as {
            computeRoutes: (req: typeof request) => Promise<{
              routes?: Array<{
                createPolylines: () => google.maps.Polyline[];
                distanceMeters?: number;
                durationMillis?: number;
                viewport?: google.maps.LatLngBounds;
              }>;
            }>;
          }
        ).computeRoutes(request);

        const primaryRoute = response.routes?.[0];
        if (!primaryRoute) {
          setRouteLoading(false);
          return;
        }

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: theme === 'dark' ? '#38BDF8' : '#0284C7',
            strokeOpacity: 0.95,
            strokeWeight: 6,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 48);
        } else {
          map.panTo(destination);
        }

        const distMeters = primaryRoute.distanceMeters ?? 0;
        const durMillis = primaryRoute.durationMillis ?? 0;
        const distanceText =
          distMeters >= 1000
            ? `${(distMeters / 1000).toFixed(1)} km`
            : `${Math.round(distMeters)} m`;
        const totalMin = Math.max(1, Math.round(durMillis / 60000));
        const durationText =
          totalMin >= 60
            ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`
            : `${totalMin}m`;

        onRouteComputed({
          destinationName: name,
          destinationAddress: address,
          destinationLocation: destination,
          distanceText,
          durationText,
          distanceMeters: distMeters,
          durationMillis: durMillis,
        });
      } catch (err) {
        triggerQuotaBannerIfExhausted(err);
      } finally {
        setRouteLoading(false);
      }
    },
    [routesLib, map, carPosition, theme, onRouteComputed]
  );

  useEffect(() => {
    polylinesRef.current.forEach((p) => {
      p.setOptions({
        strokeColor: theme === 'dark' ? '#38BDF8' : '#0284C7',
      });
    });
  }, [theme]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        });
        sessionTokenRef.current = null;
        setSuggestions([]);
        setSearchQuery('');

        if (place.location) {
          const dest = {
            lat: place.location.lat(),
            lng: place.location.lng(),
          };
          await computeDrivingRoute(
            dest,
            place.displayName || '',
            place.formattedAddress || ''
          );
        }
      } catch (err) {
        triggerQuotaBannerIfExhausted(err);
      }
    },
    [placesLib, computeDrivingRoute]
  );

  const handleNearbySearch = useCallback(
    async (categoryId: string, primaryType: string) => {
      if (!placesLib || !map) return;
      if (activeCategory === categoryId) {
        setActiveCategory(null);
        setNearbyPins([]);
        return;
      }

      setActiveCategory(categoryId);

      try {
        const center = map.getCenter()
          ? { lat: map.getCenter()!.lat(), lng: map.getCenter()!.lng() }
          : carPosition;

        const { places } = await placesLib.Place.searchNearby({
          fields: ['id', 'displayName', 'formattedAddress', 'location'],
          locationRestriction: {
            center,
            radius: 5000,
          },
          includedPrimaryTypes: [primaryType],
          maxResultCount: 6,
        });

        const pins: NearbyPlacePin[] = (places ?? [])
          .filter((p) => Boolean(p.location))
          .map((p) => ({
            id: p.id,
            name: p.displayName || '',
            address: p.formattedAddress || '',
            category: categoryId,
            location: {
              lat: p.location!.lat(),
              lng: p.location!.lng(),
            },
          }));

        setNearbyPins(pins);
      } catch (err) {
        triggerQuotaBannerIfExhausted(err);
      }
    },
    [placesLib, map, carPosition, activeCategory]
  );

  const handleRecenter = useCallback(() => {
    onRequestGps();
    if (map) {
      map.panTo(carPosition);
      map.setZoom(15);
    }
  }, [map, carPosition, onRequestGps]);

  const handleZoom = useCallback(
    (delta: number) => {
      if (!map) return;
      const current = map.getZoom() ?? 14;
      map.setZoom(Math.max(4, Math.min(20, current + delta)));
    },
    [map]
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
        defaultCenter={carPosition}
        defaultZoom={14}
        gestureHandling="greedy"
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
      >
        {/* Vehicle Marker */}
        <AdvancedMarker position={carPosition}>
          <div
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-sky-500/20 border-2 border-sky-400 shadow-lg"
            style={{
              transform: carHeading !== null ? `rotate(${carHeading}deg)` : undefined,
            }}
          >
            <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
              <Navigation className="w-4 h-4 fill-current" />
            </div>
          </div>
        </AdvancedMarker>

        {/* Active Destination Marker */}
        {activeRoute && (
          <AdvancedMarker position={activeRoute.destinationLocation}>
            <Pin
              background="#0EA5E9"
              borderColor="#FFFFFF"
              glyphColor="#FFFFFF"
            />
          </AdvancedMarker>
        )}

        {/* Nearby Symbol Pins */}
        {nearbyPins.map((pin) => (
          <AdvancedMarker
            key={pin.id}
            position={pin.location}
            onClick={() => {
              void computeDrivingRoute(pin.location, pin.name, pin.address);
            }}
          >
            <button
              type="button"
              onClick={() => {
                void computeDrivingRoute(pin.location, pin.name, pin.address);
              }}
              aria-label={pin.category}
              className="w-9 h-9 rounded-full bg-slate-900/95 text-sky-400 border border-white/25 shadow-lg flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors"
            >
              {pin.category === 'fuel' ? (
                <Fuel className="w-4 h-4" />
              ) : pin.category === 'food' ? (
                <Utensils className="w-4 h-4" />
              ) : pin.category === 'parking' ? (
                <ParkingCircle className="w-4 h-4" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
            </button>
          </AdvancedMarker>
        ))}
      </GoogleMap>

      {/* Symbol-Only Map Controls */}
      {!isScreensaver && (
        <>
          {/* Top Search & Symbol Quick POI Buttons */}
          <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="relative flex-1">
                <div className="flex items-center h-11 rounded-xl bg-white/95 dark:bg-slate-900/92 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg px-3 gap-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search destination"
                    className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                      }}
                      aria-label="Clear"
                      className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-white/12 shadow-2xl overflow-hidden max-h-52 overflow-y-auto cockpit-scroll">
                    {suggestions.map((s, idx) => (
                      <button
                        key={s.placePrediction?.placeId ?? idx}
                        type="button"
                        onClick={() => void handleSelectSuggestion(s)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-left flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/10 border-b border-slate-100 dark:border-white/5 last:border-b-0 transition-colors"
                      >
                        <Compass className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="text-sm text-slate-800 dark:text-slate-100 truncate">
                          {s.placePrediction?.text.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleRecenter}
                aria-label="Center GPS"
                className={`w-11 h-11 rounded-xl backdrop-blur-md border shadow-lg flex items-center justify-center transition-colors shrink-0 ${
                  gpsActive
                    ? 'bg-sky-500 text-white border-sky-400'
                    : 'bg-white/95 dark:bg-slate-900/92 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LocateFixed className="w-4 h-4" />
              </button>
            </div>

            {/* Pure Symbol POI Filter Buttons */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {[
                { id: 'fuel', type: 'gas_station', Icon: Fuel, label: 'Fuel' },
                { id: 'food', type: 'restaurant', Icon: Utensils, label: 'Food' },
                { id: 'parking', type: 'parking', Icon: ParkingCircle, label: 'Parking' },
                { id: 'service', type: 'car_repair', Icon: Wrench, label: 'Service' },
              ].map(({ id, type, Icon, label }) => {
                const active = activeCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => void handleNearbySearch(id, type)}
                    aria-label={label}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-md border transition-colors shrink-0 shadow-sm ${
                      active
                        ? 'bg-sky-500 text-white border-sky-400'
                        : 'bg-white/90 dark:bg-slate-900/88 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Map Zoom Controls */}
          <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleZoom(1)}
              aria-label="Zoom in"
              className="w-11 h-11 rounded-xl bg-white/95 dark:bg-slate-900/92 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-1)}
              aria-label="Zoom out"
              className="w-11 h-11 rounded-xl bg-white/95 dark:bg-slate-900/92 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>

          {/* Numeric Route Summary + Symbol Close */}
          {(activeRoute || routeLoading) && (
            <div className="absolute left-3 bottom-3 z-20">
              <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl px-3 py-2 flex items-center gap-3">
                <Navigation className="w-4 h-4 text-sky-500 shrink-0" />
                {routeLoading ? (
                  <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-300">
                    ···
                  </span>
                ) : (
                  activeRoute && (
                    <>
                      <span className="text-sm font-display font-semibold text-slate-900 dark:text-white tabular-nums">
                        {activeRoute.durationText} · {activeRoute.distanceText}
                      </span>
                      <button
                        type="button"
                        onClick={clearRoute}
                        aria-label="Clear route"
                        className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
                        
