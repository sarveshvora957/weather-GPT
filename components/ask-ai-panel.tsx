"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LocationData,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQuality,
  AIChatMessage,
} from "@/types/weather";
import {
  Bot,
  Send,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowRight,
  Check,
  Copy,
  HelpCircle,
  Zap,
} from "lucide-react";

interface AskAIPanelProps {
  currentLocation: LocationData;
  currentWeather: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  aqi?: AirQuality | null;
  unit?: "C" | "F";
}

export const AskAIPanel: React.FC<AskAIPanelProps> = ({
  currentLocation,
  currentWeather,
  hourly,
  daily,
  aqi,
  unit = "C",
}) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition error:", err);
      }
    }
  };

  const handleSpeakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#>`]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAsk = async (promptText?: string) => {
    const textToSend = (promptText || query).trim();
    if (!textToSend || isLoading) return;

    setQuery("");

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const userApiKey =
        typeof window !== "undefined"
          ? localStorage.getItem("weathergpt_gemini_key") || undefined
          : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          activeLocation: currentLocation,
          isDemoMode: true,
          userApiKey,
          unit,
        }),
      });

      if (!res.ok) throw new Error("AI request failed");
      const reply: AIChatMessage = await res.json();
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error("AI chat error:", err);
      const displayTemp =
        unit === "F"
          ? Math.round((currentWeather.temperature * 9) / 5 + 32)
          : Math.round(currentWeather.temperature);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `In **${currentLocation.name}**, current temperature is ${displayTemp}°${unit} (${currentWeather.conditionText}) with humidity at ${currentWeather.humidity}% and ${currentWeather.precipitation > 0 ? "active precipitation" : "fair skies"}. Check back shortly for deep reasoning.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Location-grounded dynamic suggested questions
  const suggestedQuestions = [
    `Will it rain today in ${currentLocation.name}?`,
    `Should I carry an umbrella tonight?`,
    `Is it safe to travel or drive today in ${currentLocation.name}?`,
    `What should I wear today for this weather?`,
    `Is today good for outdoor activities / cricket?`,
    `How hot will it feel in the afternoon?`,
    `What is the best time to go outside today?`,
  ];

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-aurora-cyan to-brand-400 p-[1px] shadow-neon-cyan shrink-0">
            <div className="w-full h-full rounded-2xl bg-navy-950 flex items-center justify-center">
              <Bot className="w-5 h-5 text-aurora-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Ask Weather<span className="text-aurora-cyan">GPT</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-semibold font-mono">
                Context: {currentLocation.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Conversational intelligence grounded in live atmospheric conditions
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 transition-colors"
          >
            Clear Discussion
          </button>
        )}
      </div>

      {/* Starter Suggestions Pills */}
      {messages.length === 0 && (
        <div className="space-y-2.5 py-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-aurora-cyan" />
            <span>Suggested Questions for {currentLocation.name}:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(q)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-aurora-cyan/15 text-xs text-slate-300 hover:text-aurora-cyan border border-white/10 hover:border-aurora-cyan/40 transition-all text-left flex items-center gap-1.5 group"
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-aurora-cyan shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-brand-600/30 border border-aurora-cyan/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-aurora-cyan" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm space-y-2 ${
                    isUser
                      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-br-none shadow-md"
                      : "glass-panel border border-white/15 text-slate-100 rounded-bl-none shadow-lg"
                  }`}
                >
                  <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Recommendation Badge if provided */}
                  {!isUser && msg.recommendation && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border ${msg.recommendation.badgeColor}`}>
                        {msg.recommendation.badgeText}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Feasibility: <strong>{msg.recommendation.score}/100</strong>
                      </span>
                    </div>
                  )}

                  {/* Audio read / Copy actions */}
                  {!isUser && (
                    <div className="flex items-center justify-end gap-2 pt-1 text-[10px] text-slate-400">
                      <button
                        onClick={() => handleSpeakText(msg.content)}
                        className="hover:text-white flex items-center gap-1"
                        title="Read response aloud"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3 text-aurora-cyan" /> : <Volume2 className="w-3 h-3" />}
                        <span>Listen</span>
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-white flex items-center gap-1"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2 items-center text-xs text-aurora-cyan p-3 rounded-2xl glass-panel border border-aurora-cyan/30">
              <div className="w-2 h-2 rounded-full bg-aurora-cyan animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-slate-300 font-mono">
                Analyzing weather patterns for {currentLocation.name}...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Question Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2 pt-2"
      >
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-3 rounded-2xl border transition-all ${
            isListening
              ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse shadow-neon-rose"
              : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
          }`}
          title={isListening ? "Listening... click to stop" : "Speak question"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Ask anything about ${currentLocation.name}'s weather (e.g. Will I need an umbrella tonight?)...`}
          disabled={isLoading}
          className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-aurora-cyan/50 focus:ring-2 focus:ring-aurora-cyan/20 transition-all shadow-inner"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-black text-xs sm:text-sm shadow-neon-cyan hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>Ask AI</span>
          <Send className="w-3.5 h-3.5 fill-navy-950" />
        </button>
      </form>
    </div>
  );
};
