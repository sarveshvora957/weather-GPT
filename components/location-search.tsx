"use client";

import React, { useState, useEffect } from "react";
import { LocationData } from "@/types/weather";
import { WeatherService, POPULAR_LOCATIONS } from "@/lib/weather-service";
import { Search, MapPin, Navigation, X, Clock, Sparkles } from "lucide-react";

interface LocationSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: LocationData) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await WeatherService.searchLocations(query);
        setResults(found);
      } catch (err) {
        console.error("Location search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Geolocation auto-detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
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
          onSelectLocation(detectedLoc);
          onClose();
        } catch (e) {
          console.error("Location error:", e);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation denied or error:", err);
        setIsLocating(false);
        alert("Unable to retrieve your location. You can search manually!");
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-3xl glass-panel border border-white/15 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-aurora-cyan pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, region, or country (e.g. Ahmedabad, Mumbai, Tokyo)..."
            autoFocus
            className="w-full pl-11 pr-10 py-3.5 text-sm rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-aurora-cyan/50 focus:ring-2 focus:ring-aurora-cyan/20"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* GPS Auto-Detect Button */}
        <button
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="w-full py-2.5 px-4 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-xs font-semibold text-aurora-cyan transition-colors flex items-center justify-center gap-2"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Detecting Satellite Coordinates..." : "Use Current GPS Location"}</span>
        </button>

        {/* Results List */}
        <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-thin">
          {isSearching && (
            <div className="py-6 text-center text-xs text-slate-400 font-mono">
              Searching global meteorological station database...
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 block">
                Matching Locations ({results.length})
              </span>
              {results.map((loc) => {
                const subtext = [loc.admin2, loc.admin1, loc.country].filter(Boolean).join(", ");
                return (
                  <button
                    key={loc.id || `${loc.name}-${loc.latitude}-${loc.longitude}`}
                    onClick={() => {
                      onSelectLocation(loc);
                      onClose();
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-xs text-slate-200 transition-colors flex items-center justify-between group"
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
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {loc.countryCode || "IN"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-400">
              No location found for &ldquo;{query}&rdquo;. Try searching with city + state or PIN code.
            </div>
          )}

          {/* Popular Shortcuts when query is empty */}
          {!query && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 block">
                Popular Cities in India
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id || loc.name}
                    onClick={() => {
                      onSelectLocation(loc);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-200 hover:text-aurora-cyan transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <div className="truncate text-left">
                      <span className="font-semibold block truncate">{loc.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {[loc.admin2, loc.admin1].filter(Boolean).join(", ") || loc.country}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
