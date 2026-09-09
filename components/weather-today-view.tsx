import React from "react";
import { LocationData, CurrentWeather, HourlyForecastItem, DailyForecastItem } from "@/types/weather";
import { Weather3DIcon } from "@/components/weather-3d-icon";
import { MapPin, Search } from "lucide-react";
import { convertTemp } from "@/lib/utils";

interface WeatherTodayViewProps {
  location: LocationData;
  current: CurrentWeather;
  todayDaily?: DailyForecastItem;
  hourly: HourlyForecastItem[];
  unit: "C" | "F";
  onToggleUnit: () => void;
  onOpenSearch: () => void;
}

export const WeatherTodayView: React.FC<WeatherTodayViewProps> = ({
  location,
  current,
  todayDaily,
  hourly = [],
  unit,
  onToggleUnit,
  onOpenSearch,
}) => {
  const displayTemp = convertTemp(current.temperature, unit);
  const displayFeelsLike = convertTemp(current.feelsLike, unit);

  // Format sunrise / sunset to "5:00 AM" / "5:48 PM"
  const formatTimeStr = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return isoString;
    }
  };

  const rainChance =
    todayDaily?.precipitationProb ??
    (current.precipitation > 0 ? 90 : Math.min(85, Math.round(current.cloudCover * 0.8)));

  return (
    <div className="flex flex-col justify-between h-full px-5 pt-6 pb-2 text-white select-none">
      {/* 1. Top Bar: Location Pin & Search Button & Unit Switch */}
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
          {/* One-click °C / °F toggle pill */}
          <button
            onClick={onToggleUnit}
            title="Toggle Celsius / Fahrenheit"
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

      {/* 2. Hero Weather Section (Matching exact center layout in screenshot) */}
      <div className="flex flex-col items-center justify-center my-auto py-4">
        {/* Large 3D Weather Illustration */}
        <div className="mb-2">
          <Weather3DIcon
            condition={current.conditionText}
            isNight={!current.isDay}
            size="xl"
          />
        </div>

        {/* Condition Text */}
        <h2 className="text-base sm:text-lg font-medium text-blue-100 tracking-wide">
          {current.conditionText}
        </h2>

        {/* Huge Temperature Display */}
        <div className="flex items-start justify-center mt-1">
          <span className="text-7xl sm:text-8xl font-bold tracking-tight text-white leading-none">
            {displayTemp}
          </span>
          <span className="text-3xl sm:text-4xl font-light text-sky-200 ml-0.5 mt-1">°</span>
        </div>

        {/* Feels Like Text */}
        <p className="text-xs sm:text-sm text-blue-200/80 mt-1">
          Feels like {displayFeelsLike}°
        </p>
      </div>

      {/* 3. 6-Metric Parameters Card (2 rows of 3 columns matching screenshot) */}
      <div className="royal-card p-4 sm:p-5 my-3 shadow-lg">
        <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 text-center">
          {/* Row 1 */}
          <div>
            <span className="text-[11px] text-blue-200/70 block">Wind speed</span>
            <strong className="text-xs sm:text-sm font-semibold text-white mt-0.5 block">
              {Math.round(current.windSpeed)} km/h
            </strong>
          </div>

          <div>
            <span className="text-[11px] text-blue-200/70 block">Humidity</span>
            <strong className="text-xs sm:text-sm font-semibold text-white mt-0.5 block">
              {current.humidity}%
            </strong>
          </div>

          <div>
            <span className="text-[11px] text-blue-200/70 block">Chance of rain</span>
            <strong className="text-xs sm:text-sm font-semibold text-white mt-0.5 block">
              {rainChance}%
            </strong>
          </div>

          {/* Row 2 */}
          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] text-blue-200/70 block">Sunrise</span>
            <strong className="text-xs sm:text-sm font-semibold text-white mt-0.5 block">
              {formatTimeStr(current.sunrise)}
            </strong>
          </div>

          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] text-blue-200/70 block">Sunset</span>
            <strong className="text-xs sm:text-sm font-semibold text-white mt-0.5 block">
              {formatTimeStr(current.sunset)}
            </strong>
          </div>

          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] text-blue-200/70 block">Pressure</span>
            <strong className="text-xs sm:text-sm font-semibold text-white mt-0.5 block">
              {Math.round(current.pressure)} hPa
            </strong>
          </div>
        </div>
      </div>

      {/* 4. Hourly Forecast Horizontal Carousel */}
      <div className="mt-2 mb-1">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {hourly.slice(0, 10).map((item, index) => {
            const isFirst = index === 0;
            const hTemp = convertTemp(item.temperature, unit);
            const timeLabel = isFirst
              ? "Now"
              : new Date(item.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

            if (isFirst) {
              return (
                <div
                  key={item.time}
                  className="sky-highlight-card shrink-0 min-w-[74px] p-3 flex flex-col items-center justify-between text-center"
                >
                  <span className="text-[11px] font-medium text-white">{timeLabel}</span>
                  <div className="my-1.5">
                    <Weather3DIcon condition={item.conditionText} size="sm" />
                  </div>
                  <span className="text-base font-bold text-white">{hTemp}°</span>
                </div>
              );
            }

            return (
              <div
                key={item.time}
                className="royal-card shrink-0 min-w-[74px] p-3 flex flex-col items-center justify-between text-center"
              >
                <span className="text-[11px] text-blue-200/80">{timeLabel}</span>
                <div className="my-1.5">
                  <Weather3DIcon condition={item.conditionText} size="sm" />
                </div>
                <span className="text-base font-bold text-white">{hTemp}°</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
