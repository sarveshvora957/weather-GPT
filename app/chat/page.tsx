"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { ChatBox } from "@/components/chat-box";
import { LocationSearch } from "@/components/location-search";
import {
  LocationData,
  AIChatMessage,
  SIHDemoScenario,
} from "@/types/weather";
import { DEFAULT_LOCATION } from "@/lib/weather-service";
import { SIH_DEMO_SCENARIOS } from "@/lib/demo-scenarios";
import { useWeatherSettings } from "@/components/weather-context";
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Sparkles,
  Zap,
  Search,
} from "lucide-react";

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const { unit, currentLocation, setCurrentLocation } = useWeatherSettings();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("conv-welcome");
  const [activeMessages, setActiveMessages] = useState<AIChatMessage[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [convFilter, setConvFilter] = useState("");

  // Load conversations list
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const json = await res.json();
        setConversations(json);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  // Load specific conversation messages
  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveMessages(data.messages || []);
        setActiveConvId(id);
      }
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
    loadConversation("conv-welcome");
  }, []);

  // Handle URL prefilled query or scenario
  useEffect(() => {
    const q = searchParams.get("q");
    const scenarioId = searchParams.get("scenario");

    if (scenarioId) {
      const found = SIH_DEMO_SCENARIOS.find((s) => s.id === scenarioId);
      if (found) {
        setCurrentLocation(found.location);
        handleSendMessage(found.queryPrompt);
      }
    } else if (q) {
      handleSendMessage(q);
    }
  }, [searchParams]);

  const handleCreateNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Weather Discussion" }),
      });
      if (res.ok) {
        const newConv = await res.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setActiveMessages([]);
      }
    } catch (err) {
      console.error("New chat error:", err);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations?id=${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveMessages([]);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSendMessage = async (prompt: string): Promise<AIChatMessage> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        conversationId: activeConvId,
        activeLocation: currentLocation,
        isDemoMode: true,
        unit,
      }),
    });

    if (!res.ok) {
      throw new Error("Chat request failed");
    }

    const data: AIChatMessage = await res.json();
    fetchConversations(); // refresh titles
    return data;
  };

  const handleScenarioSelect = (scenario: SIHDemoScenario) => {
    setCurrentLocation(scenario.location);
    handleSendMessage(scenario.queryPrompt);
  };

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

        <main className="flex-1 p-4 sm:p-6 space-y-4 flex flex-col md:flex-row gap-4 overflow-hidden">
          {/* Chat History Conversations Left Panel */}
          <div className="w-full md:w-64 rounded-3xl glass-panel p-4 border border-white/10 flex flex-col justify-between shrink-0 h-auto md:h-[680px]">
            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              {/* New Chat Button */}
              <button
                onClick={handleCreateNewChat}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-aurora-cyan text-navy-950 font-bold text-xs shadow-neon-cyan hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Weather Chat</span>
              </button>

              {/* Filter input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={convFilter}
                  onChange={(e) => setConvFilter(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-aurora-cyan/40"
                />
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                  Recent Inquiries
                </span>

                {conversations
                  .filter((c) => c.title.toLowerCase().includes(convFilter.toLowerCase()))
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversation(c.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer group transition-colors ${
                        activeConvId === c.id
                          ? "bg-aurora-cyan/20 text-aurora-cyan font-semibold border border-aurora-cyan/30"
                          : "hover:bg-white/5 text-slate-300 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-aurora-cyan" />
                        <span className="truncate">{c.title}</span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteChat(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Demo Mode Preset Selector */}
            <div className="pt-3 border-t border-white/10 text-[11px]">
              <span className="text-slate-400 block mb-1.5 font-semibold flex items-center gap-1 text-amber-300">
                <Zap className="w-3.5 h-3.5" />
                <span>SIH 2026 Presentation Presets</span>
              </span>
              <div className="space-y-1">
                {SIH_DEMO_SCENARIOS.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleScenarioSelect(s)}
                    className="w-full text-left p-1.5 rounded-lg bg-black/20 hover:bg-amber-400/20 text-[10px] text-slate-300 hover:text-amber-200 border border-white/5 truncate transition-colors block"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main ChatGPT Conversation Box */}
          <div className="flex-1">
            <ChatBox
              initialMessages={activeMessages}
              currentLocation={currentLocation}
              onSendMessage={handleSendMessage}
              isDemoMode={true}
            />
          </div>
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

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Loading WeatherGPT AI...</div>}>
      <ChatContent />
    </Suspense>
  );
}
