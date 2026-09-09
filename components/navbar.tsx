"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Search,
  Bell,
  Sun,
  Moon,
  MapPin,
  Menu,
  X,
  Navigation,
  CloudSun,
  Map,
  CalendarDays,
  TrendingUp,
  GitCompare,
  AlertTriangle,
} from "lucide-react";
import { LocationData } from "@/types/weather";
import { DEFAULT_LOCATION, POPULAR_LOCATIONS } from "@/lib/weather-service";
import { useWeatherSettings } from "@/components/weather-context";

interface NavbarProps {
  currentLocation?: LocationData;
  onLocationChange?: (loc: LocationData) => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation: propLocation,
  onLocationChange,
  onOpenSearch,
}) => {
  const pathname = usePathname();
  const { unit, toggleUnit, currentLocation: contextLoc, setCurrentLocation } = useWeatherSettings();
  const activeLocation = propLocation || contextLoc || DEFAULT_LOCATION;

  const [isDark, setIsDark] = useState(true);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(1);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("weathergpt_theme");
    if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.classList.add("light");
    } else {
      setIsDark(true);
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("weathergpt_theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("weathergpt_theme", "light");
    }
  };

  const handleSelectCity = (loc: LocationData) => {
    if (onLocationChange) {
      onLocationChange(loc);
    }
    setCurrentLocation(loc);
    setShowLocationDropdown(false);
  };

  const navLinks = [
    { name: "Weather", href: "/" },
    { name: "AI Chat", href: "/chat" },
    { name: "Radar", href: "/map" },
    { name: "Forecast", href: "/forecast" },
    { name: "Climate", href: "/climate" },
    { name: "Compare", href: "/compare" },
    { name: "Alerts", href: "/alerts" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel px-4 lg:px-6 py-2.5 transition-colors duration-200">
      <div className="mx-auto flex items-center justify-between gap-3 max-w-7xl">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-aurora-cyan to-brand-400 p-[1px] shadow-neon-cyan">
              <div className="flex items-center justify-center w-full h-full rounded-2xl bg-navy-950/90 group-hover:bg-navy-900 transition-colors">
                <CloudSun className="w-5 h-5 text-aurora-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  Weather<span className="text-aurora-cyan">GPT</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Live Meteorology & AI
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-aurora-cyan/20 text-aurora-cyan shadow-sm font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Center-Right: Search Shortcut & Location Switcher */}
        <div className="hidden sm:flex items-center gap-2 max-w-xs w-full justify-end">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center justify-between w-full max-w-[200px] px-3 py-1.5 text-xs rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all hover:border-aurora-cyan/40 group shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-aurora-cyan shrink-0" />
                <span className="truncate">Search India...</span>
              </div>
              <kbd className="text-[10px] px-1 py-0.5 rounded bg-black/40 text-slate-400 font-mono border border-white/10 shrink-0">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Active City Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-aurora-cyan transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-aurora-cyan shrink-0" />
              <span className="max-w-[95px] truncate">{activeLocation.name}</span>
            </button>

            {showLocationDropdown && (
              <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl glass-panel shadow-2xl z-50 animate-in fade-in-50 border border-white/15">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Popular Indian Cities
                </div>
                <div className="space-y-1 mt-1">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc.id || loc.name}
                      onClick={() => handleSelectCity(loc)}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors ${
                        activeLocation.name.toLowerCase() === loc.name.toLowerCase()
                          ? "bg-aurora-cyan/20 text-aurora-cyan font-bold"
                          : "hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      <span className="font-semibold">{loc.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {[loc.admin2, loc.admin1].filter(Boolean).join(", ") || loc.country}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: °C/°F Toggle & Theme / Alerts */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Universal Persistent °C / °F Switch */}
          <button
            onClick={toggleUnit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono font-black text-white border border-white/20 transition-all shadow-sm"
            title="Toggle between Celsius and Fahrenheit"
            aria-label="Toggle Temperature Unit"
          >
            <span className={unit === "C" ? "text-aurora-cyan font-extrabold" : "text-slate-400"}>°C</span>
            <span className="text-slate-500">/</span>
            <span className={unit === "F" ? "text-aurora-cyan font-extrabold" : "text-slate-400"}>°F</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-300" />
              {notificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotificationPopup && (
              <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl glass-panel shadow-2xl z-50 animate-in fade-in-50 border border-white/15">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-semibold text-slate-200">Active Weather Alerts</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                    1 Active
                  </span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
                    <p className="font-bold text-cyan-300">Live Forecast Active</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Real-time Open-Meteo observations synched for {activeLocation.name}.
                    </p>
                  </div>
                </div>
                <Link
                  href="/alerts"
                  onClick={() => setShowNotificationPopup(false)}
                  className="block text-center mt-3 text-[11px] font-medium text-aurora-cyan hover:underline"
                >
                  Manage alert preferences →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-white/10 space-y-2 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/30"
                      : "bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
