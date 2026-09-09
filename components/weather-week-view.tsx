import React from "react";
import { LocationData, DailyForecastItem } from "@/types/weather";
import { Weather3DIcon } from "@/components/weather-3d-icon";
import { MapPin, Search, Droplets } from "lucide-react";
import { convertTemp } from "@/lib/utils";

interface WeatherWeekViewProps {
  location: LocationData;
  daily: DailyForecastItem[];
  unit: "C" | "F";
  onToggleUnit: () => void;
  onOpenSearch: () => void;
}

export const WeatherWeekView: React.FC<WeatherWeekViewProps> = ({
  location,
  daily = [],
  unit,
  onToggleUnit,
  onOpenSearch,
}) => {
  // Tomorrow's data (index 1 if available, otherwise index 0)
  const tomorrow = daily[1] || daily[0];
  const tomorrowMax = tomorrow ? convertTemp(tomorrow.tempMax, unit) : 28;
  const tomorrowMin = tomorrow ? convertTemp(tomorrow.tempMin, unit) : 23;
  const tomorrowRain = tomorrow?.precipitationProb ?? 80;
  const tomorrowCondition = tomorrow?.conditionText || "Cloudy / Rainy";

  const getDayName = (dateStr: string, index: number) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { weekday: "long" });
    } catch {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return days[index % 7];
    }
  };

  return (
    <div className="flex flex-col justify-between h-full px-5 pt-6 pb-2 text-white select-none">
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 text-left group hover:opacity-90 transition-opacity max-w-[70%]"
        >
          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-sm sm:text-base font-semibold text-white truncate">
            {location.name}
            {location.admin1 ? `, ${location.admin1}` : location.country ? `, ${location.country}` : ""}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleUnit}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-sky-300 transition-colors"
          >
            °{unit}
          </button>
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
            aria-label="Search location"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Section Heading: This Week */}
      <div className="mt-5 mb-3">
        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          This Week
        </h1>
      </div>

      {/* 3. Tomorrow Highlight Banner (Matching Middle Screen from Screenshot) */}
      <div className="sky-highlight-card p-5 mb-4 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs sm:text-sm font-semibold text-white/90 block">
            Tomorrow
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-white">
              {tomorrowMax}°
            </span>
            <span className="text-lg sm:text-xl font-light text-white/80">
              {tomorrowMin}°
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/90 pt-1">
            <Droplets className="w-3.5 h-3.5 fill-white text-white" />
            <span>{tomorrowRain}%</span>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <Weather3DIcon condition={tomorrowCondition} size="md" />
          <span className="text-[11px] font-medium text-white/95 mt-1 max-w-[90px] truncate">
            {tomorrowCondition}
          </span>
        </div>
      </div>

      {/* 4. 7-Day Extended Forecast Row List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none my-1">
        {daily.slice(1, 8).map((day, index) => {
          const max = convertTemp(day.tempMax, unit);
          const min = convertTemp(day.tempMin, unit);
          const dayName = getDayName(day.date, index + 1);
          const rain = day.precipitationProb;

          return (
            <div
              key={day.date}
              className="flex items-center justify-between py-1.5 px-1 group"
            >
              {/* Day Name */}
              <span className="text-xs sm:text-sm font-medium text-slate-200 w-24 sm:w-28 truncate">
                {dayName}
              </span>

              {/* Temperatures */}
              <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-semibold">
                <span className="text-white">{max}°</span>
                <span className="text-blue-200/70 font-normal">{min}°</span>
              </div>

              {/* Rain Chance & Icon */}
              <div className="flex items-center gap-2 justify-end w-20">
                {rain !== undefined && rain > 20 && (
                  <span className="text-[11px] font-medium text-sky-400 font-mono">
                    {rain}%
                  </span>
                )}
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <Weather3DIcon condition={day.conditionText} size="sm" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
