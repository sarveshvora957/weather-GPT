import React, { useState, useEffect, useRef } from "react";
import { LocationData, CurrentWeather, AIChatMessage } from "@/types/weather";
import { Bot, Send, Sparkles, Mic, MicOff, ArrowLeft, User } from "lucide-react";
import { convertTemp } from "@/lib/utils";

interface WeatherAIViewProps {
  location: LocationData;
  current: CurrentWeather;
  unit: "C" | "F";
  onBack: () => void;
}

export const WeatherAIView: React.FC<WeatherAIViewProps> = ({
  location,
  current,
  unit,
  onBack,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome-ai",
      role: "assistant",
      content: `Hello! I'm **WeatherGPT**, your meteorological AI assistant. Current temperature in **${location.name}** is **${convertTemp(current.temperature, unit)}°${unit}** with **${current.conditionText}**. How can I help you today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || query).trim();
    if (!text || loading) return;

    setQuery("");
    const userMsg: AIChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const userApiKey =
        typeof window !== "undefined"
          ? localStorage.getItem("weathergpt_gemini_key") || undefined
          : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          activeLocation: location,
          isDemoMode: true,
          userApiKey,
          unit,
        }),
      });

      if (!res.ok) throw new Error("AI request failed");
      const reply: AIChatMessage = await res.json();
      setMessages((prev) => [...prev, reply]);
    } catch (e) {
      console.error(e);
      const temp = convertTemp(current.temperature, unit);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `In **${location.name}**, it is currently ${temp}°${unit} with ${current.conditionText}, ${current.humidity}% humidity, and wind at ${Math.round(current.windSpeed)} km/h. Everything looks steady for your daily plans.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    `Will it rain today in ${location.name}?`,
    `What should I wear right now?`,
    `Is it safe for outdoor travel?`,
  ];

  return (
    <div className="flex flex-col justify-between h-full px-5 pt-6 pb-2 text-white select-none">
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-slate-200 transition-colors"
          aria-label="Back to Today"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              WeatherGPT AI
            </h1>
            <span className="text-[10px] text-sky-300 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Grounded
            </span>
          </div>
        </div>

        <div className="w-6" />
      </div>

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none my-3">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isUser ? "bg-white/15 text-white" : "bg-sky-500/30 text-sky-300 border border-sky-400/30"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[82%] text-xs leading-relaxed ${
                  isUser
                    ? "sky-highlight-card text-white font-medium ml-auto"
                    : "royal-card text-slate-100 font-normal border border-white/10"
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-sky-300 text-xs p-3 royal-card w-36">
            <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-[11px]">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Suggested Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] text-sky-200 shrink-0 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 4. Input Box */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/10 border border-white/15"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask weather about ${location.name}...`}
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-blue-200/50 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-navy-950 font-bold transition-all"
            aria-label="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
