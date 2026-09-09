"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LocationData } from "@/types/weather";
import { DEFAULT_LOCATION } from "@/lib/weather-service";

export type TemperatureUnit = "C" | "F";

interface WeatherContextType {
  unit: TemperatureUnit;
  setUnit: (unit: TemperatureUnit) => void;
  toggleUnit: () => void;
  currentLocation: LocationData;
  setCurrentLocation: (loc: LocationData) => void;
  formatTemperature: (celsius: number) => string;
  convertTemperature: (celsius: number) => number;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize unit from localStorage if available
  const [unit, setUnitState] = useState<TemperatureUnit>("C");
  const [currentLocation, setCurrentLocationState] = useState<LocationData>(DEFAULT_LOCATION);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedUnit = localStorage.getItem("weathergpt_temp_unit");
      if (savedUnit === "C" || savedUnit === "F") {
        setUnitState(savedUnit);
      }

      const savedLoc = localStorage.getItem("weathergpt_active_location");
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed && parsed.latitude && parsed.longitude) {
          setCurrentLocationState(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read weather preferences from localStorage:", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const setUnit = (newUnit: TemperatureUnit) => {
    setUnitState(newUnit);
    try {
      localStorage.setItem("weathergpt_temp_unit", newUnit);
    } catch (e) {
      // ignore
    }
  };

  const toggleUnit = () => {
    const nextUnit: TemperatureUnit = unit === "C" ? "F" : "C";
    setUnit(nextUnit);
  };

  const setCurrentLocation = (loc: LocationData) => {
    setCurrentLocationState(loc);
    try {
      localStorage.setItem("weathergpt_active_location", JSON.stringify(loc));
      sessionStorage.setItem("weathergpt_last_location", JSON.stringify(loc));
    } catch (e) {
      // ignore
    }
  };

  const convertTemperature = (celsius: number): number => {
    if (unit === "F") {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  };

  const formatTemperature = (celsius: number): string => {
    const val = convertTemperature(celsius);
    return `${val}°${unit}`;
  };

  return (
    <WeatherContext.Provider
      value={{
        unit,
        setUnit,
        toggleUnit,
        currentLocation,
        setCurrentLocation,
        formatTemperature,
        convertTemperature,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export function useWeatherSettings(): WeatherContextType {
  const context = useContext(WeatherContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      unit: "C",
      setUnit: () => {},
      toggleUnit: () => {},
      currentLocation: DEFAULT_LOCATION,
      setCurrentLocation: () => {},
      formatTemperature: (c: number) => `${Math.round(c)}°C`,
      convertTemperature: (c: number) => Math.round(c),
    };
  }
  return context;
}
