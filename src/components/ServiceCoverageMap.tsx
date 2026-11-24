/// <reference types="google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Check,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';

export interface ServiceHub {
  id: string;
  name: string;
  shortLabel: string;
  city: string;
  coverageNote: string;
  position: google.maps.LatLngLiteral;
}

const TERACORE_HUBS: ServiceHub[] = [
  {
    id: 'enugu',
    name: 'Teracore Integrated Solution Headquarters',
    shortLabel: 'Enugu (HQ)',
    city: 'Enugu State, Nigeria',
    coverageNote: 'Corporate Headquarters — Solar Energy, CCTV Security & Business IT Infrastructure across Enugu & Southeast.',
    position: { lat: 6.4584, lng: 7.5464 },
  },
  {
    id: 'lagos',
    name: 'Teracore Lagos Operations Hub',
    shortLabel: 'Lagos',
    city: 'Victoria Island, Lagos',
    coverageNote: 'Solar PV, Hybrid Inverters, IP CCTV & Commercial IT Deployments across Lagos & Southwest.',
    position: { lat: 6.4281, lng: 3.4219 },
  },
  {
    id: 'abuja',
    name: 'Teracore Abuja Operations Hub',
    shortLabel: 'Abuja',
    city: 'Central Business District, Abuja',
    coverageNote: 'Enterprise Solar Microgrids, Perimeter Security & Structured Networking across FCT & North-Central.',
    position: { lat: 9.0579, lng: 7.4951 },
  },
  {
    id: 'ph',
    name: 'Teracore Port Harcourt Operations Hub',
    shortLabel: 'Port Harcourt',
    city: 'GRA, Port Harcourt',
    coverageNote: 'Commercial Hybrid Power, Industrial Surveillance & Branch IT Support across South-South.',
    position: { lat: 4.8156, lng: 7.0498 },
  },
];

interface MapSource {
  title: string;
  uri: string;
  reviewSnippets?: string[];
}

interface SelectedSite {
  title: string;
  address: string;
  position: google.maps.LatLngLiteral;
  viewport?: google.maps.LatLngBoundsLiteral | google.maps.LatLngBounds | null;
}

interface ServiceCoverageMapProps {
  onSelectAddress?: (address: string, coords?: google.maps.LatLngLiteral) => void;
  title?: string;
  subtitle?: string;
}

function isQuotaError(err: unknown): boolean {
  const text =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err ?? '');
  return (
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('OverQuotaMapError') ||
    text.includes('QuotaExceeded') ||
    text.includes('429')
  );
}

function triggerQuotaWarningIfNeeded(err: unknown) {
  if (isQuotaError(err)) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

function useAutocompleteSuggestions(inputString: string) {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = inputString.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        sessionToken: sessionTokenRef.current ?? undefined,
        includedRegionCodes: ['ng'],
      })
        .then((res) => {
          if (cancelled) return;
          setSuggestions(res?.suggestions ?? []);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          triggerQuotaWarningIfNeeded(err);
          setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputString]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
  }, []);

  return { suggestions, isLoading, resetSession };
}

function HubMarker({
  hub,
  isOpen,
  onToggle,
  onClose,
}: {
  hub: ServiceHub;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={hub.position}
        title={hub.name}
        onClick={onToggle}
      >
        <Pin background="#0a1628" borderColor="#1e3a5f" glyphColor="#10b981" scale={1.1} />
      </AdvancedMarker>
      {isOpen && marker && (
        <InfoWindow anchor={marker} maxWidth={260} onCloseClick={onClose}>
          <div className="p-1 space-y-1 text-slate-900">
            <div className="font-display text-xs font-bold text-navy-900">{hub.name}</div>
            <div className="text-[11px] font-semibold text-emerald-700">{hub.city}</div>
            <p className="text-[11px] text-slate-600 leading-relaxed">{hub.coverageNote}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function SelectedSiteMarker({
  site,
  isOpen,
  onToggle,
  onClose,
}: {
  site: SelectedSite;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={site.position}
        title={site.title}
        onClick={onToggle}
      >
        <Pin background="#059669" borderColor="#047857" glyphColor="#ffffff" scale={1.25} />
      </AdvancedMarker>
      {isOpen && marker && (
        <InfoWindow anchor={marker} maxWidth={260} onCloseClick={onClose}>
          <div className="p-1 space-y-1 text-slate-900">
            <div className="font-display text-xs font-bold text-emerald-800">{site.title}</div>
            <div className="text-[11px] text-slate-700">{site.address}</div>
            <div className="text-[10px] font-mono text-slate-500">
              {site.position.lat.toFixed(5)}, {site.position.lng.toFixed(5)}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapViewportController({
  focusTarget,
}: {
  focusTarget: { position: google.maps.LatLngLiteral; zoom?: number; viewport?: google.maps.LatLngBoundsLiteral | google.maps.LatLngBounds | null } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !focusTarget) return;
    if (focusTarget.viewport) {
      map.fitBounds(focusTarget.viewport);
    } else {
      map.panTo(focusTarget.position);
      map.setZoom(focusTarget.zoom ?? 13);
    }
  }, [map, focusTarget]);

  return null;
}

function MapInteractiveWorkspace({
  onSelectAddress,
}: {
  onSelectAddress?: (address: string, coords?: google.maps.LatLngLiteral) => void;
}) {
  const placesLib = useMapsLibrary('places');
  const [searchInput, setSearchInput] = useState('');
  const { suggestions, isLoading: suggestionsLoading, resetSession } =
    useAutocompleteSuggestions(searchInput);

  const [openHubId, setOpenHubId] = useState<string | null>('enugu');
  const [selectedSite, setSelectedSite] = useState<SelectedSite | null>(null);
  const [siteInfoOpen, setSiteInfoOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<{
    position: google.maps.LatLngLiteral;
    zoom?: number;
    viewport?: google.maps.LatLngBoundsLiteral | google.maps.LatLngBounds | null;
  } | null>(null);

  const [appliedNotice, setAppliedNotice] = useState(false);
  const [groundingLoading, setGroundingLoading] = useState(false);
  const [groundingSummary, setGroundingSummary] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<MapSource[]>([]);
  const [groundingError, setGroundingError] = useState<string | null>(null);

  const handleSelectSuggestion = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    if (!placesLib || !suggestion.placePrediction) return;
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
      });
      const loc = place.location;
      if (!loc) return;

      const coords: google.maps.LatLngLiteral = {
        lat: loc.lat(),
        lng: loc.lng(),
      };
      const address =
        place.formattedAddress ||
        place.displayName ||
        suggestion.placePrediction.text.text;

      setSelectedSite({
        title: place.displayName || 'Selected Project Site',
        address,
        position: coords,
        viewport: place.viewport ?? null,
      });
      setOpenHubId(null);
      setSiteInfoOpen(true);
      setFocusTarget({ position: coords, zoom: 15, viewport: place.viewport ?? null });
      setSearchInput(address);
      setGroundingSummary(null);
      setGroundingSources([]);
      setGroundingError(null);
      setAppliedNotice(false);
      resetSession();
    } catch (err) {
      triggerQuotaWarningIfNeeded(err);
    }
  };

  const handleFocusHub = (hub: ServiceHub) => {
    setOpenHubId(hub.id);
    setSiteInfoOpen(false);
    setFocusTarget({ position: hub.position, zoom: 12 });
  };

  const handleApplyToForm = () => {
    if (!selectedSite || !onSelectAddress) return;
    onSelectAddress(selectedSite.address, selectedSite.position);
    setAppliedNotice(true);
    window.setTimeout(() => setAppliedNotice(false), 3000);
  };

  const handleCheckAreaContext = async () => {
    const targetCoords = selectedSite?.position ?? TERACORE_HUBS[0].position;
    const targetLabel = selectedSite?.address ?? TERACORE_HUBS[0].city;

    setGroundingLoading(true);
    setGroundingError(null);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'maps',
          latLng: { latitude: targetCoords.lat, longitude: targetCoords.lng },
          message: `Provide brief area and infrastructure context around "${targetLabel}" (lat ${targetCoords.lat.toFixed(4)}, lng ${targetCoords.lng.toFixed(4)}) relevant to scheduling a Teracore Integrated Solution solar, CCTV security, or office IT site assessment. Mention notable nearby commercial districts or roads grounded by Google Maps.`,
        }),
      });

      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }

      const data = (await res.json()) as {
        reply?: string;
        mapSources?: MapSource[];
        error?: string;
      };
      if (!res.ok || !data.reply) {
        setGroundingError(
          data.error || 'Unable to retrieve area context at the moment.'
        );
      } else {
        setGroundingSummary(data.reply);
        setGroundingSources(Array.isArray(data.mapSources) ? data.mapSources : []);
      }
    } catch {
      setGroundingError('Connection interrupted while checking Google Maps context.');
    } finally {
      setGroundingLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search your street, estate, or business address in Nigeria..."
              aria-label="Search site address"
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
            {suggestionsLoading && (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100"
            >
              {suggestions.map((suggestion, idx) => {
                const label = suggestion.placePrediction?.text?.text;
                if (!label) return null;
                return (
                  <li key={suggestion.placePrediction?.placeId || idx}>
                    <button
                      type="button"
                      onClick={() => void handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TERACORE_HUBS.map((hub) => {
            const active = openHubId === hub.id;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => handleFocusHub(hub)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-500" />
                <span>{hub.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explicit Height Map Container */}
      <div className="h-[380px] sm:h-[420px] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={TERACORE_HUBS[0].position}
          defaultZoom={11}
          gestureHandling="cooperative"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          onClick={(e) => {
            const latLng = e.detail.latLng;
            if (!latLng) return;
            const coords = { lat: latLng.lat, lng: latLng.lng };
            const coordLabel = `Pinned Site (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
            setSelectedSite({
              title: 'Pinned Project Coordinates',
              address: coordLabel,
              position: coords,
            });
            setOpenHubId(null);
            setSiteInfoOpen(true);
            setAppliedNotice(false);
            setGroundingSummary(null);
            setGroundingSources([]);
          }}
          className="w-full h-full"
        >
          <MapViewportController focusTarget={focusTarget} />

          {TERACORE_HUBS.map((hub) => (
            <HubMarker
              key={hub.id}
              hub={hub}
              isOpen={openHubId === hub.id}
              onToggle={() => {
                setSiteInfoOpen(false);
                setOpenHubId((prev) => (prev === hub.id ? null : hub.id));
              }}
              onClose={() => setOpenHubId(null)}
            />
          ))}

          {selectedSite && (
            <SelectedSiteMarker
              site={selectedSite}
              isOpen={siteInfoOpen}
              onToggle={() => {
                setOpenHubId(null);
                setSiteInfoOpen((prev) => !prev);
              }}
              onClose={() => setSiteInfoOpen(false)}
            />
          )}
        </GoogleMap>
      </div>

      {/* Selected Site Actions + Google Maps Grounding */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-500">
              {selectedSite ? 'Selected Project Site' : 'Interactive Site Selection'}
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {selectedSite
                ? selectedSite.address
                : 'Search an address above or click anywhere on the map to pin your premises.'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedSite && onSelectAddress && (
              <button
                type="button"
                onClick={handleApplyToForm}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {appliedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Applied to Form</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Use This Address in Form</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleCheckAreaContext()}
              disabled={groundingLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-navy-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {groundingLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>
                {groundingLoading ? 'Checking Maps Context...' : 'Check Area Context'}
              </span>
            </button>
          </div>
        </div>

        {groundingError && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
            {groundingError}
          </div>
        )}

        {groundingSummary && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-xs font-semibold text-emerald-700">
              Location Brief (Grounded with Google Maps)
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {groundingSummary}
            </p>
            {groundingSources.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500">
                  Google Maps References
                </div>
                <div className="flex flex-wrap gap-2">
                  {groundingSources.map((src, idx) => (
                    <a
                      key={`${src.uri}-${idx}`}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-navy-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                    >
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{src.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ServiceCoverageMap({
  onSelectAddress,
  title = 'Service Coverage & Site Location Lookup',
  subtitle = 'Explore Teracore Integrated Solution headquarters in Enugu State and regional hubs in Lagos, Abuja, and Port Harcourt, or search and pin your site address before submitting an enquiry.',
}: ServiceCoverageMapProps) {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const [apiKey, setApiKey] = useState<string>(envKey);
  const [keyLoading, setKeyLoading] = useState<boolean>(!envKey);

  useEffect(() => {
    if (envKey) return;
    let active = true;
    fetch('/api/maps-config')
      .then((res) => (res.ok ? res.json() : { apiKey: '' }))
      .then((data: { apiKey?: string }) => {
        if (active && data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {
        // Handled cleanly below
      })
      .finally(() => {
        if (active) setKeyLoading(false);
      });
    return () => {
      active = false;
    };
  }, [envKey]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
      <div className="space-y-1.5">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{subtitle}</p>
      </div>

      {keyLoading ? (
        <div className="h-[380px] sm:h-[420px] w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading interactive coverage map...</span>
        </div>
      ) : !apiKey ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 space-y-2">
          <div className="font-semibold text-slate-900">
            Interactive map key is not configured in this environment.
          </div>
          <p>
            You can still enter your site city or street address directly in the consultation form. Teracore is headquartered in Enugu State, Nigeria, with regional operations in Lagos, Abuja, and Port Harcourt.
          </p>
        </div>
      ) : (
        <APIProvider apiKey={apiKey} libraries={['places', 'marker']} language="en" region="NG">
          <MapInteractiveWorkspace onSelectAddress={onSelectAddress} />
        </APIProvider>
      )}
    </div>
  );
}
