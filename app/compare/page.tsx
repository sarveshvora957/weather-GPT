"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { CityComparison } from "@/components/city-comparison";
import { LocationSearch } from "@/components/location-search";
import { LocationData } from "@/types/weather";
import { DEFAULT_LOCATION, POPULAR_LOCATIONS } from "@/lib/weather-service";
import { useWeatherSettings } from "@/components/weather-context";
import { GitCompare } from "lucide-react";

export default function ComparePage() {
  const { currentLocation, setCurrentLocation } = useWeatherSettings();
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <WeatherBackground condition="clear" />
      <Navbar
        currentLocation={currentLocation}
        onLocationChange={setCurrentLocation}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <CityComparison
            initialCityA={POPULAR_LOCATIONS[0]} // Ahmedabad
            initialCityB={POPULAR_LOCATIONS[1]} // Mumbai
          />
        </main>
      </div>

      <LocationSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />
    </div>
  );
}
