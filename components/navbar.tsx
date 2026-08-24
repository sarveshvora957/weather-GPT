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
  Compass,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { LocationData } from "@/types/weather";
import { DEFAULT_LOCATION, POPULAR_LOCATIONS } from "@/lib/weather-service";

interface NavbarProps {
  currentLocation?: LocationData;
  onLocationChange?: (loc: LocationData) => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation = DEFAULT_LOCATION,
  onLocationChange,
  onOpenSearch,
}) => {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(2);
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel px-4 lg:px-6 py-3 transition-colors duration-200">
      <div className="mx-auto flex items-center justify-between gap-4 max-w-7xl">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-aurora-cyan to-brand-400 p-[1px] shadow-neon-cyan">
              <div className="flex items-center justify-center w-full h-full rounded-xl bg-navy-950/90 group-hover:bg-navy-900 transition-colors">
                <Sparkles className="w-5 h-5 text-aurora-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-aurora-cyan">
                  Weather<span className="text-aurora-cyan font-black">GPT</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  SIH 2026
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Conversational Meteorological AI
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Search & Location Switcher */}
        <div className="hidden sm:flex items-center gap-3 max-w-md w-full justify-center">
          {/* Quick Global Search Bar */}
          <button
            onClick={onOpenSearch}
            className="flex items-center justify-between w-full max-w-xs px-3.5 py-1.5 text-xs rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all hover:border-aurora-cyan/40 group shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-aurora-cyan" />
              <span>Search any city, forecast, or query...</span>
            </div>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 font-mono border border-white/10">
              ⌘K
            </kbd>
          </button>

          {/* Active City Pill with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-aurora-cyan transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-aurora-cyan" />
              <span className="max-w-[110px] truncate">{currentLocation.name}</span>
            </button>

            {showLocationDropdown && (
              <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl glass-panel shadow-2xl z-50 animate-in fade-in-50 slide-in-from-top-2 border border-white/15">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Popular Locations
                </div>
                <div className="space-y-1 mt-1">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc.id || loc.name}
                      onClick={() => {
                        onLocationChange?.(loc);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                        currentLocation.name === loc.name
                          ? "bg-aurora-cyan/20 text-aurora-cyan font-medium"
                          : "hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-[10px] text-slate-400">{loc.admin1 || loc.country}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Theme, Notifications & User */}
        <div className="flex items-center gap-2">
          {/* SIH Demo Mode Quick Launcher Link */}
          <Link
            href="/chat?demo=true"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 hover:brightness-110 transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>SIH Demo Mode</span>
          </Link>

          {/* Theme Toggle Button */}
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    2 Active
                  </span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                    <p className="font-semibold text-rose-300">Monsoon Rain Alert ({currentLocation.name})</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      65% rain probability expected during evening hours.
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <p className="font-semibold text-amber-300">High UV Index (6.8)</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Wear UV sunscreen between 11:30 AM - 3:30 PM.
                    </p>
                  </div>
                </div>
                <Link
                  href="/alerts"
                  onClick={() => setShowNotificationPopup(false)}
                  className="block text-center mt-3 text-[11px] font-medium text-aurora-cyan hover:underline"
                >
                  View all alerts & smart preferences →
                </Link>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <Link
            href="/settings"
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-aurora-cyan to-brand-500 flex items-center justify-center text-[11px] font-bold text-navy-950">
              SIH
            </div>
            <span className="text-xs font-medium text-slate-300 hidden sm:inline">Presenter</span>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-white/10 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-white/5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              Dashboard
            </Link>
            <Link
              href="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-aurora-cyan/15 text-xs font-medium text-aurora-cyan border border-aurora-cyan/30"
            >
              WeatherGPT Chat
            </Link>
            <Link
              href="/forecast"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-white/5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              Forecast
            </Link>
            <Link
              href="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-white/5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              Radar Map
            </Link>
            <Link
              href="/alerts"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-white/5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              Alerts
            </Link>
            <Link
              href="/climate"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-white/5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              Climate
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-white/5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              Compare
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-white/5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
