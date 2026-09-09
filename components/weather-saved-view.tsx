import React from "react";
import { LocationData, CurrentWeather } from "@/types/weather";
import { Weather3DIcon } from "@/components/weather-3d-icon";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { convertTemp } from "@/lib/utils";

interface SavedItem {
  location: LocationData;
  weather?: CurrentWeather;
  high?: number;
  low?: number;
}

interface WeatherSavedViewProps {
  savedLocations: LocationData[];
  weatherMap: Record<string, CurrentWeather>;
  unit: "C" | "F";
  onSelectLocation: (loc: LocationData) => void;
  onBack: () => void;
  onOpenSearch: () => void;
}

export const WeatherSavedView: React.FC<WeatherSavedViewProps> = ({
  savedLocations = [],
  weatherMap = {},
  unit,
  onSelectLocation,
  onBack,
  onOpenSearch,
}) => {
  // Preset demo showcase locations if saved list is empty
  const defaultPresets: SavedItem[] = [
    {
      location: {
        name: "New York",
        country: "United States",
        latitude: 40.7128,
        longitude: -74.006,
      },
      high: 28,
      low: 22,
    },
    {
      location: {
        name: "Tokyo",
        country: "Japan",
        latitude: 35.6762,
        longitude: 139.6503,
      },
      high: 30,
      low: 24,
    },
    {
      location: {
        name: "Vancouver",
        country: "Canada",
        latitude: 49.2827,
        longitude: -123.1207,
      },
      high: 20,
      low: 12,
    },
    {
      location: {
        name: "Agartala",
        country: "Tripura, India",
        latitude: 23.8315,
        longitude: 91.2868,
      },
      high: 31,
      low: 25,
    },
    {
      location: {
        name: "Ahmedabad",
        country: "Gujarat, India",
        latitude: 23.0225,
        longitude: 72.5714,
      },
      high: 34,
      low: 26,
    },
  ];

  const displayList: SavedItem[] =
    savedLocations.length > 0
      ? savedLocations.map((loc) => ({
          location: loc,
          weather: weatherMap[loc.name],
          high: weatherMap[loc.name] ? Math.round(weatherMap[loc.name].temperature + 3) : 28,
          low: weatherMap[loc.name] ? Math.round(weatherMap[loc.name].temperature - 4) : 22,
        }))
      : defaultPresets;

  return (
    <div className="flex flex-col justify-between h-full px-5 pt-6 pb-2 text-white select-none">
      {/* 1. Top Bar: Back Arrow, Title "Saved Locations", Search Icon */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-slate-200 transition-colors"
          aria-label="Back to Today"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Saved Locations
        </h1>

        <button
          onClick={onOpenSearch}
          className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
          aria-label="Search and add location"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 2. List of Saved Location Cards (Matching Screen 3 from Screenshot) */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none my-4">
        {displayList.map((item) => {
          const loc = item.location;
          const w = item.weather;
          const condition = w?.conditionText || (loc.name === "Tokyo" ? "Thunderstorm" : loc.name === "New York" ? "Cloudy" : "Light Rain");
          const high = convertTemp(item.high ?? (w ? w.temperature + 2 : 28), unit);
          const low = convertTemp(item.low ?? (w ? w.temperature - 4 : 22), unit);

          return (
            <div
              key={loc.name}
              onClick={() => onSelectLocation(loc)}
              className="royal-card-interactive p-4 sm:p-5 flex items-center justify-between cursor-pointer group"
            >
              {/* Left Details */}
              <div className="space-y-0.5 max-w-[65%]">
                <h2 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                  {loc.name}
                </h2>
                <span className="text-[11px] text-blue-200/70 block truncate">
                  {loc.country || loc.admin1 || "World"}
                </span>

                <div className="flex items-baseline gap-2 pt-1 font-mono">
                  <span className="text-xl font-bold text-white">
                    {high}°
                  </span>
                  <span className="text-xs text-blue-200/70 font-normal">
                    {low}°
                  </span>
                </div>

                <span className="text-xs text-blue-200/80 block pt-0.5">
                  {condition}
                </span>
              </div>

              {/* Right 3D Icon */}
              <div className="shrink-0 pl-2">
                <Weather3DIcon
                  condition={condition}
                  isNight={loc.name === "New York"}
                  size="md"
                />
              </div>
            </div>
          );
        })}

        {/* Add City Button */}
        <button
          onClick={onOpenSearch}
          className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-sky-300 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Location</span>
        </button>
      </div>
    </div>
  );
};
