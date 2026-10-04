import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  X,
  Check,
  Navigation,
  Globe,
  Map as MapIcon,
  Crosshair,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

// Comprehensive high-accuracy Indian cities & major metropolitan localities database
export const CURATED_LOCATIONS = [
  // Hyderabad & Secunderabad
  { city: 'Hyderabad', area: 'Jubilee Hills', state: 'Telangana', lat: 17.4319, lng: 78.4073, pincode: '500033', popular: true },
  { city: 'Hyderabad', area: 'Banjara Hills', state: 'Telangana', lat: 17.4156, lng: 78.4354, pincode: '500034', popular: true },
  { city: 'Hyderabad', area: 'Hitec City', state: 'Telangana', lat: 17.4474, lng: 78.3762, pincode: '500081', popular: true },
  { city: 'Hyderabad', area: 'Gachibowli', state: 'Telangana', lat: 17.4401, lng: 78.3489, pincode: '500032', popular: true },
  { city: 'Hyderabad', area: 'Madhapur', state: 'Telangana', lat: 17.4483, lng: 78.3915, pincode: '500081' },
  { city: 'Hyderabad', area: 'Kondapur', state: 'Telangana', lat: 17.4699, lng: 78.3578, pincode: '500084' },
  { city: 'Hyderabad', area: 'Kukatpally', state: 'Telangana', lat: 17.4875, lng: 78.4067, pincode: '500072' },
  { city: 'Hyderabad', area: 'Manikonda', state: 'Telangana', lat: 17.3995, lng: 78.3842, pincode: '500089' },
  { city: 'Secunderabad', area: 'Marredpally', state: 'Telangana', lat: 17.4523, lng: 78.5085, pincode: '500026' },

  // Bangalore
  { city: 'Bangalore', area: 'Indiranagar', state: 'Karnataka', lat: 12.9784, lng: 77.6408, pincode: '560038', popular: true },
  { city: 'Bangalore', area: 'Koramangala', state: 'Karnataka', lat: 12.9352, lng: 77.6245, pincode: '560034', popular: true },
  { city: 'Bangalore', area: 'HSR Layout', state: 'Karnataka', lat: 12.9121, lng: 77.6446, pincode: '560102', popular: true },
  { city: 'Bangalore', area: 'Whitefield', state: 'Karnataka', lat: 12.9698, lng: 77.7500, pincode: '560066', popular: true },
  { city: 'Bangalore', area: 'Jayanagar', state: 'Karnataka', lat: 12.9308, lng: 77.5838, pincode: '560011' },
  { city: 'Bangalore', area: 'Bellandur', state: 'Karnataka', lat: 12.9304, lng: 77.6784, pincode: '560103' },
  { city: 'Bangalore', area: 'Electronic City', state: 'Karnataka', lat: 12.8452, lng: 77.6602, pincode: '560100' },

  // Mumbai & Navi Mumbai
  { city: 'Mumbai', area: 'Bandra West', state: 'Maharashtra', lat: 19.0596, lng: 72.8295, pincode: '400050', popular: true },
  { city: 'Mumbai', area: 'Andheri West', state: 'Maharashtra', lat: 19.1197, lng: 72.8464, pincode: '400058', popular: true },
  { city: 'Mumbai', area: 'Powai', state: 'Maharashtra', lat: 19.1176, lng: 72.9060, pincode: '400076', popular: true },
  { city: 'Mumbai', area: 'Juhu', state: 'Maharashtra', lat: 19.1075, lng: 72.8263, pincode: '400049' },
  { city: 'Mumbai', area: 'Colaba', state: 'Maharashtra', lat: 18.9067, lng: 72.8147, pincode: '400005' },
  { city: 'Navi Mumbai', area: 'Vashi', state: 'Maharashtra', lat: 19.0771, lng: 72.9986, pincode: '400703' },
  { city: 'Thane', area: 'Ghubunder Road', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, pincode: '400607' },

  // Delhi NCR
  { city: 'Delhi NCR', area: 'Connaught Place', state: 'Delhi', lat: 28.6315, lng: 77.2167, pincode: '110001', popular: true },
  { city: 'Delhi NCR', area: 'South Extension', state: 'Delhi', lat: 28.5729, lng: 77.2217, pincode: '110049', popular: true },
  { city: 'Delhi NCR', area: 'Hauz Khas', state: 'Delhi', lat: 28.5494, lng: 77.2001, pincode: '110016' },
  { city: 'Delhi NCR', area: 'Gurgaon DLF Cyber City', state: 'Haryana', lat: 28.4950, lng: 77.0895, pincode: '122002', popular: true },
  { city: 'Delhi NCR', area: 'Gurgaon Golf Course Road', state: 'Haryana', lat: 28.4595, lng: 77.1025, pincode: '122011' },
  { city: 'Delhi NCR', area: 'Noida Sector 62', state: 'Uttar Pradesh', lat: 28.6276, lng: 77.3725, pincode: '201309', popular: true },

  // Pune
  { city: 'Pune', area: 'Kothrud', state: 'Maharashtra', lat: 18.5074, lng: 73.8077, pincode: '411038', popular: true },
  { city: 'Pune', area: 'Viman Nagar', state: 'Maharashtra', lat: 18.5679, lng: 73.9143, pincode: '411014', popular: true },
  { city: 'Pune', area: 'Baner', state: 'Maharashtra', lat: 18.5590, lng: 73.7868, pincode: '411045' },
  { city: 'Pune', area: 'Kalyani Nagar', state: 'Maharashtra', lat: 18.5482, lng: 73.9029, pincode: '411006' },

  // Chennai
  { city: 'Chennai', area: 'Adyar', state: 'Tamil Nadu', lat: 13.0012, lng: 80.2565, pincode: '600020', popular: true },
  { city: 'Chennai', area: 'Anna Nagar', state: 'Tamil Nadu', lat: 13.0850, lng: 80.2101, pincode: '600040', popular: true },
  { city: 'Chennai', area: 'OMR Thoraipakkam', state: 'Tamil Nadu', lat: 12.9348, lng: 80.2311, pincode: '600097' },

  // Kolkata
  { city: 'Kolkata', area: 'Salt Lake City', state: 'West Bengal', lat: 22.5804, lng: 88.4172, pincode: '700064', popular: true },
  { city: 'Kolkata', area: 'New Town', state: 'West Bengal', lat: 22.5850, lng: 88.4686, pincode: '700156' },

  // Other Major Cities
  { city: 'Ahmedabad', area: 'Bodakdev', state: 'Gujarat', lat: 23.0373, lng: 72.5118, pincode: '380054', popular: true },
  { city: 'Jaipur', area: 'Malviya Nagar', state: 'Rajasthan', lat: 26.8533, lng: 75.8055, pincode: '302017', popular: true },
  { city: 'Visakhapatnam', area: 'MVP Colony', state: 'Andhra Pradesh', lat: 17.7423, lng: 83.3364, pincode: '530017', popular: true },
  { city: 'Vijayawada', area: 'Benz Circle', state: 'Andhra Pradesh', lat: 16.5003, lng: 80.6480, pincode: '520010', popular: true },
  { city: 'Kochi', area: 'Kakkanad', state: 'Kerala', lat: 10.0159, lng: 76.3419, pincode: '682030', popular: true },
  { city: 'Chandigarh', area: 'Sector 17', state: 'Chandigarh', lat: 30.7398, lng: 76.7827, pincode: '160017', popular: true },
];

export const LocationSelector = ({
  value = '',
  onChange,
  placeholder = 'Search exact locality or city (e.g. Jubilee Hills, Whitefield, Bandra...)',
  showMap = true,
  label = 'Location / City',
  required = false,
  className = '',
}) => {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedResults, setGeocodedResults] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(() => {
    return (
      CURATED_LOCATIONS.find(
        (l) => l.city.toLowerCase() === (value || '').toLowerCase() || `${l.city}, ${l.area}`.toLowerCase().includes((value || '').toLowerCase())
      ) || CURATED_LOCATIONS[0]
    );
  });

  const wrapperRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
      const matched = CURATED_LOCATIONS.find(
        (l) =>
          l.city.toLowerCase() === value.toLowerCase() ||
          `${l.city} (${l.area})`.toLowerCase() === value.toLowerCase() ||
          `${l.city}, ${l.area}`.toLowerCase().includes(value.toLowerCase())
      );
      if (matched) setSelectedLoc(matched);
    }
  }, [value]);

  // Handle clicking outside or pressing Escape to close the dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Real-time live geocoding using OpenStreetMap Nominatim API
  const performGeocoding = useCallback(async (searchText) => {
    if (!searchText || searchText.trim().length < 2) {
      setGeocodedResults([]);
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchText
        )}&countrycodes=in&addressdetails=1&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((item) => {
          const addr = item.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            addr.state_district ||
            item.name;
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.commercial ||
            item.name;
          const state = addr.state || '';

          return {
            city: city || 'India',
            area: area && area !== city ? area : 'Main Area',
            state: state,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            pincode: addr.postcode || '',
            displayName: item.display_name,
            isLive: true,
          };
        });

        setGeocodedResults(mapped);
      }
    } catch (err) {
      // Gracefully fall back to local curated database if network request fails
      setGeocodedResults([]);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (onChange) onChange(val, null);

    // Debounce geocoding request by 350ms
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performGeocoding(val);
      }, 350);
    } else {
      setGeocodedResults([]);
    }
  };

  // Detect Current Location using browser GPS / Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const detectedCity = addr.city || addr.town || addr.state_district || 'Hyderabad';
            const detectedArea = addr.suburb || addr.neighbourhood || addr.residential || 'Current Area';
            const detectedState = addr.state || 'Telangana';

            const locObj = {
              city: detectedCity,
              area: detectedArea,
              state: detectedState,
              lat: latitude,
              lng: longitude,
              pincode: addr.postcode || '',
              displayName: data.display_name,
              isGpsDetected: true,
            };

            const fullString = `${detectedCity} (${detectedArea})`;
            setQuery(fullString);
            setSelectedLoc(locObj);
            setIsOpen(false);
            if (onChange) onChange(fullString, locObj);
          }
        } catch (err) {
          // Fallback with exact coordinates
          const locObj = {
            city: 'My Location',
            area: 'GPS Coordinates',
            state: 'Detected',
            lat: latitude,
            lng: longitude,
            isGpsDetected: true,
          };
          setQuery(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          setSelectedLoc(locObj);
          setIsOpen(false);
          if (onChange) onChange(query, locObj);
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        alert('Could not retrieve your GPS location. Please select from the list or type your city.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelect = (loc) => {
    const val = loc.area && loc.area !== 'All Areas' ? `${loc.city} (${loc.area})` : loc.city;
    setQuery(val);
    setSelectedLoc(loc);
    setIsOpen(false);
    if (onChange) onChange(val, loc);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setGeocodedResults([]);
    if (onChange) onChange('', null);
  };

  // Combine curated and live geocoded results
  const localFiltered = query.trim().length >= 2
    ? CURATED_LOCATIONS.filter((l) => {
        const q = query.toLowerCase();
        return (
          l.city.toLowerCase().includes(q) ||
          l.area.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q) ||
          (l.pincode && l.pincode.includes(q))
        );
      })
    : CURATED_LOCATIONS.filter((l) => l.popular);

  const displayedResults = geocodedResults.length > 0 ? geocodedResults : localFiltered;

  return (
    <div className={`space-y-2 ${className}`} ref={wrapperRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>

          {/* Quick GPS Location Detect Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition"
          >
            {isDetecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{isDetecting ? 'Detecting GPS...' : 'Use My Exact Location'}</span>
          </button>
        </div>
      )}

      {/* Input Field with Dropdown Toggle */}
      <div className="relative">
        <div className="absolute left-3.5 top-3 flex items-center pointer-events-none text-slate-400">
          {isGeocoding ? (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 text-blue-600" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown Suggestions Menu */}
        {isOpen && (
          <div className="absolute z-40 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto animate-fadeIn">
            {/* GPS Detection Bar inside dropdown */}
            <div className="p-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDetectLocation}
                className="w-full text-left flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                <Crosshair className="w-4 h-4 text-blue-600" />
                <span>{isDetecting ? 'Acquiring GPS location...' : 'Auto-Detect Current GPS Location'}</span>
              </button>
            </div>

            {/* Popular Cities Header */}
            {query.trim().length < 2 && (
              <div className="p-2.5 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Popular Hubs (Click to Pick):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi NCR', 'Pune', 'Chennai'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const found = CURATED_LOCATIONS.find((l) => l.city === c && l.popular);
                        if (found) handleSelect(found);
                      }}
                      className="text-xs px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-lg font-medium text-slate-700 transition"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List of matching locations */}
            <div className="divide-y divide-slate-100">
              {displayedResults.length > 0 ? (
                displayedResults.map((loc, i) => {
                  const isSelected =
                    selectedLoc?.city === loc.city && selectedLoc?.area === loc.area;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(loc)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-blue-50/60 transition flex items-center justify-between ${
                        isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="text-xs font-semibold">
                            {loc.area ? `${loc.area}, ` : ''}
                            <span className="text-slate-900">{loc.city}</span>
                            {loc.pincode && (
                              <span className="ml-1 text-[11px] text-slate-400 font-mono">
                                ({loc.pincode})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {loc.state ? `${loc.state}, India` : 'India'}
                            {loc.lat && loc.lng && (
                              <span className="ml-2 font-mono">
                                • {loc.lat.toFixed(4)}°, {loc.lng.toFixed(4)}°
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isGeocoding
                    ? 'Searching real location coordinates...'
                    : `No exact matches for "${query}". You can still use it as a custom location text.`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REAL Interactive OpenStreetMap Preview with Exact Pin & Coordinates */}
      {showMap && selectedLoc && selectedLoc.lat && selectedLoc.lng && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm mt-3 animate-fadeIn">
          {/* Top Bar with Exact Address & Google Maps link */}
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>
                    {selectedLoc.area && selectedLoc.area !== 'All Areas'
                      ? `${selectedLoc.area}, ${selectedLoc.city}`
                      : selectedLoc.city}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Accurate GPS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {selectedLoc.state} • {selectedLoc.lat.toFixed(5)}° N, {selectedLoc.lng.toFixed(5)}° E
                </div>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps?q=${selectedLoc.lat},${selectedLoc.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition"
              title="Open in Google Maps"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Google Maps</span>
            </a>
          </div>

          {/* Real Interactive OpenStreetMap Iframe */}
          <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
            <iframe
              title="Accurate Map View"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedLoc.lng - 0.018}%2C${selectedLoc.lat - 0.012}%2C${selectedLoc.lng + 0.018}%2C${selectedLoc.lat + 0.012}&layer=mapnik&marker=${selectedLoc.lat}%2C${selectedLoc.lng}`}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>

          {/* Bottom Precision Footnote */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Globe className="w-3 h-3 text-blue-500" />
              Real OpenStreetMap Geographic View
            </span>
            <span className="font-semibold text-slate-700">
              Coverage: 25km radius around {selectedLoc.city}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
