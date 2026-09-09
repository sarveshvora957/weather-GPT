"use client";

import React, { useState, useEffect, useRef } from "react";
import { LocationData } from "@/types/weather";
import { WeatherService, POPULAR_LOCATIONS } from "@/lib/weather-service";
import {
  Search,
  MapPin,
  Navigation,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface LocationSearchBarProps {
  currentLocation: LocationData;
  onSelectLocation: (loc: LocationData) => void;
  isLoading?: boolean;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  currentLocation,
  onSelectLocation,
  isLoading = false,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setErrorMessage(null);
      try {
        const found = await WeatherService.searchLocations(query.trim());
        setResults(found);
        setDropdownOpen(true);
        if (found.length === 0) {
          setErrorMessage(`No matching location found for "${query}". Try another city name!`);
        }
      } catch (err) {
        console.error("Location search failed:", err);
        setErrorMessage("Network issue while searching location. Please try again.");
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Form submit handler (Search button or Enter key)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setErrorMessage(null);
    try {
      const found = await WeatherService.searchLocations(query.trim());
      if (found && found.length > 0) {
        handleSelect(found[0]);
      } else {
        setErrorMessage(`Could not find "${query}". Please check spelling.`);
        setDropdownOpen(true);
      }
    } catch (err) {
      setErrorMessage("Error resolving location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (loc: LocationData) => {
    onSelectLocation(loc);
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
    setErrorMessage(null);

    // Cache in sessionStorage for current session
    try {
      sessionStorage.setItem("weathergpt_last_location", JSON.stringify(loc));
    } catch (e) {
      // ignore
    }
  };

  // HTML5 Browser Geolocation Auto-Detection
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          let cityName = "Current Location";
          let admin = "";
          let countryName = "Auto-detected";

          try {
            const revRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            if (revRes.ok) {
              const geoData = await revRes.json();
              cityName = geoData.city || geoData.locality || geoData.principalSubdivision || "Current Location";
              admin = geoData.principalSubdivision || "";
              countryName = geoData.countryName || "Auto-detected";
            }
          } catch (geoErr) {
            console.warn("Reverse geocode fallback:", geoErr);
          }

          const detectedLoc: LocationData = {
            id: `detected_${lat.toFixed(4)}_${lon.toFixed(4)}`,
            name: cityName,
            admin1: admin,
            latitude: lat,
            longitude: lon,
            country: countryName,
            timezone: "auto",
          };

          handleSelect(detectedLoc);
        } catch (e) {
          console.error("Location error:", e);
          setErrorMessage("Failed to resolve your GPS coordinates. You can type your city!");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation denied:", err);
        setIsLocating(false);
        setErrorMessage("GPS location permission was denied. You can search manually!");
      }
    );
  };

  // Quick switch pills (focused on major Indian hubs & requested towns)
  const quickLocations: LocationData[] = [
    { id: "ahmedabad", name: "Ahmedabad", admin1: "Gujarat", admin2: "Ahmedabad", country: "India", countryCode: "IN", latitude: 23.0225, longitude: 72.5714, timezone: "Asia/Kolkata" },
    { id: "jetpur", name: "Jetpur", admin1: "Gujarat", admin2: "Rajkot", country: "India", countryCode: "IN", latitude: 21.7548, longitude: 70.6235, timezone: "Asia/Kolkata" },
    { id: "rajkot", name: "Rajkot", admin1: "Gujarat", admin2: "Rajkot", country: "India", countryCode: "IN", latitude: 22.3039, longitude: 70.8022, timezone: "Asia/Kolkata" },
    { id: "surat", name: "Surat", admin1: "Gujarat", admin2: "Surat", country: "India", countryCode: "IN", latitude: 21.1702, longitude: 72.8311, timezone: "Asia/Kolkata" },
    { id: "vadodara", name: "Vadodara", admin1: "Gujarat", admin2: "Vadodara", country: "India", countryCode: "IN", latitude: 22.3072, longitude: 73.1812, timezone: "Asia/Kolkata" },
    { id: "mumbai", name: "Mumbai", admin1: "Maharashtra", admin2: "Mumbai Suburban", country: "India", countryCode: "IN", latitude: 19.076, longitude: 72.8777, timezone: "Asia/Kolkata" },
    { id: "delhi", name: "Delhi", admin1: "Delhi", admin2: "New Delhi", country: "India", countryCode: "IN", latitude: 28.6139, longitude: 77.209, timezone: "Asia/Kolkata" },
    { id: "bengaluru", name: "Bengaluru", admin1: "Karnataka", admin2: "Bangalore Urban", country: "India", countryCode: "IN", latitude: 12.9716, longitude: 77.5946, timezone: "Asia/Kolkata" },
  ];

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto space-y-2.5 relative z-30">
      {/* Main Search Bar Form */}
      <form
        onSubmit={handleSubmit}
        className="p-1.5 sm:p-2 rounded-3xl glass-panel border border-white/20 shadow-2xl flex items-center gap-2 bg-navy-950/70 backdrop-blur-2xl hover:border-aurora-cyan/50 focus-within:border-aurora-cyan transition-all"
      >
        <div className="pl-3 text-aurora-cyan flex items-center shrink-0">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2 || results.length > 0) {
              setDropdownOpen(true);
            }
          }}
          placeholder="Search any place in India or worldwide (e.g. Jetpur, Rajkot, Surat, 360370)..."
          className="w-full bg-transparent px-2 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setDropdownOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search Action Button */}
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-black text-xs sm:text-sm shadow-neon-cyan hover:brightness-110 disabled:opacity-40 transition-all shrink-0 flex items-center gap-1.5"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Search</span>}
        </button>

        {/* My Location GPS Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          title="Detect Current Location via GPS"
          className="px-3 sm:px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-aurora-cyan border border-white/10 hover:border-aurora-cyan/40 text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-amber-400" : ""}`} />
          <span className="hidden sm:inline">{isLocating ? "Locating..." : "My Location"}</span>
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {dropdownOpen && (results.length > 0 || isSearching || errorMessage) && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl glass-panel border border-white/20 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto scrollbar-thin">
          {isSearching && (
            <div className="p-4 text-center text-xs text-slate-300 font-mono flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-aurora-cyan" />
              <span>Searching location database...</span>
            </div>
          )}

          {errorMessage && !isSearching && (
            <div className="p-3 text-xs text-amber-300 flex items-center gap-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Matching Locations ({results.length})
              </div>

              {results.map((loc) => {
                const subtext = [loc.admin2, loc.admin1, loc.country].filter(Boolean).join(", ");
                return (
                  <button
                    key={loc.id || `${loc.name}-${loc.latitude}-${loc.longitude}`}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs text-slate-200 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <MapPin className="w-4 h-4 text-aurora-cyan shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-white group-hover:text-aurora-cyan transition-colors text-sm">
                          {loc.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {subtext}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                      {loc.countryCode || "IN"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick City Switch Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-aurora-cyan" />
          <span>Quick Switch:</span>
        </span>
        {quickLocations.map((qLoc) => {
          const isActive = currentLocation.name.toLowerCase() === qLoc.name.toLowerCase();
          return (
            <button
              key={qLoc.id}
              type="button"
              onClick={() => handleSelect(qLoc)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                isActive
                  ? "bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/40 shadow-sm"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
              }`}
            >
              <MapPin className={`w-3 h-3 ${isActive ? "text-aurora-cyan" : "text-slate-400"}`} />
              <span>{qLoc.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
