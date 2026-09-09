import React from "react";
import { Home, Calendar, Bookmark, Bot, Compass } from "lucide-react";

export type WeatherTab = "today" | "week" | "saved" | "ai";

interface BottomNavBarProps {
  activeTab: WeatherTab;
  onChangeTab: (tab: WeatherTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const navItems: { id: WeatherTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "today",
      label: "Today",
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: "week",
      label: "This Week",
      icon: <Compass className="w-5 h-5" />,
    },
    {
      id: "saved",
      label: "Saved",
      icon: <Bookmark className="w-5 h-5" />,
    },
    {
      id: "ai",
      label: "WeatherGPT",
      icon: <Bot className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="w-full px-6 py-3.5 flex items-center justify-around bg-[#0c1f40]/90 backdrop-blur-xl border-t border-white/10 rounded-b-[40px]"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            aria-label={item.label}
            className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${
              isActive
                ? "text-white scale-110"
                : "text-slate-400 hover:text-slate-200 hover:scale-105"
            }`}
          >
            {item.icon}
            {/* Active glowing indicator pill */}
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] mt-1" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
