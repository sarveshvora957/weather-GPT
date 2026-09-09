"use client";

import React, { useState, useEffect, useRef } from "react";
import { AIChatMessage, LocationData, ComparisonData } from "@/types/weather";
import {
  Send,
  ArrowUp,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  MapPin,
  Droplets,
  Wind,
  Sun,
  Bot,
  User,
  Navigation,
  GitCompare,
  Plus,
  History,
  Sparkles,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { convertTemp, formatTemp } from "@/lib/utils";
import { Weather3DIcon } from "@/components/weather-3d-icon";
import Link from "next/link";

interface ChatBoxProps {
  initialMessages?: AIChatMessage[];
  currentLocation: LocationData;
  onSendMessage: (text: string, history: AIChatMessage[]) => Promise<AIChatMessage>;
  onNewChat?: () => void;
  onToggleHistory?: () => void;
  onSelectLocation?: (loc: LocationData) => void;
  isDemoMode?: boolean;
  unit?: "C" | "F";
  onToggleUnit?: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  initialMessages = [],
  currentLocation,
  onSendMessage,
  onNewChat,
  onToggleHistory,
  onSelectLocation,
  isDemoMode = false,
  unit = "C",
  onToggleUnit,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>("Finding location...");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamIntervalRef = useRef<any>(null);

  // Sync initialMessages when passed
  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, streamedText]);

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
          setInputText(transcript);
          setIsListening(false);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please try Google Chrome or Microsoft Edge.");
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

    const cleanText = text
      .replace(/[*#>`|]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleUseMyLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    setLoadingPhase("Detecting GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLoadingPhase("Resolving locality...");
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const cityName = data.city || data.locality || data.principalSubdivision || "my location";
          if (onSelectLocation && data.latitude && data.longitude) {
            onSelectLocation({
              name: cityName,
              latitude,
              longitude,
              country: data.countryName || "India",
              admin1: data.principalSubdivision,
            });
          }
          handleSubmitWithText(`What is the weather in ${cityName}?`);
        } catch (e) {
          console.warn("GPS reverse geocode error:", e);
          handleSubmitWithText("What is the weather near my current location?");
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setIsLoading(false);
        alert("Unable to access current location. Please ensure location permissions are enabled.");
      },
      { timeout: 8000 }
    );
  };

  const handleSubmitWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userPrompt = text.trim();
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: AIChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: userPrompt,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsLoading(true);

    // Dynamic phase transitions for thinking feel
    setLoadingPhase("📍 Finding location...");
    const phaseTimer1 = setTimeout(() => setLoadingPhase("🌦️ Fetching verified weather data..."), 500);
    const phaseTimer2 = setTimeout(() => setLoadingPhase("🤖 Preparing natural answer..."), 1200);

    try {
      const assistantReply = await onSendMessage(userPrompt, nextHistory);
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      // Progressive streaming / typing effect for reply text
      const fullText = assistantReply.content || "";
      const msgId = assistantReply.id;
      setStreamingMessageId(msgId);
      setStreamedText("");

      // Add assistant placeholder to messages
      setMessages((prev) => [...prev, { ...assistantReply, content: "" }]);
      setIsLoading(false);

      let currentIdx = 0;
      const step = Math.max(2, Math.floor(fullText.length / 30));
      clearInterval(streamIntervalRef.current);

      streamIntervalRef.current = setInterval(() => {
        currentIdx += step;
        if (currentIdx >= fullText.length) {
          clearInterval(streamIntervalRef.current);
          setStreamedText(fullText);
          setStreamingMessageId(null);
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, content: fullText } : m))
          );
        } else {
          setStreamedText(fullText.slice(0, currentIdx));
        }
      }, 16);
    } catch (err) {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      setIsLoading(false);
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: "assistant",
          content: "I couldn't retrieve current weather data right now. Please check your connection and try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitWithText(inputText);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestionCards = [
    { label: "Will it rain today?", icon: "🌧️", prompt: `Will it rain today in ${currentLocation.name}?` },
    { label: `Weather in ${currentLocation.name}`, icon: "🌡️", prompt: `What's the weather in ${currentLocation.name}?` },
    { label: "Weather near me", icon: "🗺️", action: handleUseMyLocation },
    { label: "Is today good for outdoor activities?", icon: "☀️", prompt: `Is it good for outdoor activities today in ${currentLocation.name}?` },
    { label: "Show me the 7-day forecast", icon: "📅", prompt: `7-day weather forecast for ${currentLocation.name}` },
    { label: "Is the weather suitable for travel?", icon: "✈️", prompt: `Is the weather suitable for travel in ${currentLocation.name}?` },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-navy-950/40 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
      {/* 1. Top Bar: Clean, modern header */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between bg-navy-950/70 backdrop-blur-xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* History drawer toggle on mobile */}
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 md:hidden transition-colors"
              title="Chat History"
              aria-label="Toggle history"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-aurora-cyan p-[1px] shadow-sm flex items-center justify-center">
              <div className="w-full h-full rounded-xl bg-navy-950 flex items-center justify-center">
                <Bot className="w-4 h-4 text-aurora-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">WeatherGPT</h1>
                <span className="text-[10px] text-aurora-cyan font-mono px-1.5 py-0.2 rounded bg-aurora-cyan/10 border border-aurora-cyan/20">
                  AI Agent
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Zero-hallucination real-time meteorological intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Active location indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200"
            title={`Active Context: ${currentLocation.name}`}
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="max-w-[90px] sm:max-w-[130px] truncate font-medium">
              {currentLocation.name}
            </span>
          </div>

          {/* Near Me GPS Button */}
          <button
            onClick={handleUseMyLocation}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-sky-300 hover:text-white border border-white/10 transition-colors"
            title="Use current GPS location"
            aria-label="Use GPS"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {/* Unit Toggle °C / °F */}
          {onToggleUnit && (
            <button
              onClick={onToggleUnit}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-aurora-cyan transition-colors"
              title={`Switch unit (current: °${unit})`}
              aria-label="Toggle temperature unit"
            >
              °{unit}
            </button>
          )}

          {/* New Chat Button */}
          <button
            onClick={() => {
              if (onNewChat) onNewChat();
              setMessages([]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-brand-500 hover:brightness-110 text-white text-xs font-bold shadow-sm transition-all"
            title="Start fresh conversation"
            aria-label="New chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* 2. Messages Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          /* Welcome / Empty State */
          <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4 py-8 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-aurora-cyan p-[1px] shadow-neon-cyan flex items-center justify-center mb-4">
              <div className="w-full h-full rounded-2xl bg-navy-950 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-aurora-cyan" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              How can I help with the weather?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md leading-relaxed">
              Ask about rainfall risks, hourly temperatures, outdoor playability, or compare cities across India with zero hallucination.
            </p>

            {/* 6 Clean Clickable Suggested Prompts */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 text-left">
              {suggestionCards.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (card.action) {
                      card.action();
                    } else if (card.prompt) {
                      handleSubmitWithText(card.prompt);
                    }
                  }}
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-aurora-cyan/30 text-xs text-slate-200 hover:text-white transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base">{card.icon}</span>
                    <span className="truncate font-medium">{card.label}</span>
                  </div>
                  <ArrowUp className="w-3.5 h-3.5 rotate-45 text-slate-400 group-hover:text-aurora-cyan shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Thread */
          messages.map((msg) => {
            const isUser = msg.role === "user";
            const isCurrentlyStreaming = streamingMessageId === msg.id;
            const displayContent = isCurrentlyStreaming ? streamedText : msg.content;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/30 to-aurora-cyan/20 border border-sky-400/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-aurora-cyan" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2.5 ${isUser ? "text-right" : "text-left"}`}>
                  {/* Sender Header */}
                  <div className={`text-[11px] font-medium text-slate-400 flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                    <span>{isUser ? "You" : "WeatherGPT"}</span>
                    {!isUser && msg.location?.name && (
                      <span className="text-[10px] text-sky-400 flex items-center gap-1 font-normal">
                        • {msg.location.name}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 sm:p-4.5 text-sm leading-relaxed ${
                      isUser
                        ? "bg-sky-600 text-white rounded-tr-none shadow-md inline-block text-left"
                        : "bg-white/[0.04] border border-white/10 text-slate-100 rounded-tl-none shadow-lg"
                    }`}
                  >
                    <div className="prose prose-invert prose-sm max-w-none text-slate-100 whitespace-pre-wrap">
                      {displayContent}
                      {isCurrentlyStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-aurora-cyan animate-pulse align-middle" />
                      )}
                    </div>

                    {/* Compact Weather Summary Card (Only when verified weather returned) */}
                    {!isUser && msg.weatherSummary && !isCurrentlyStreaming && (
                      <div className="mt-3.5 p-3.5 rounded-2xl bg-black/30 border border-white/10 shadow-md space-y-2.5">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="text-xs font-bold text-white">
                              {msg.location?.name || currentLocation.name}
                              {msg.location?.country ? `, ${msg.location.country}` : ""}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Verified Live
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4 py-1">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-white">
                                {convertTemp(msg.weatherSummary.temperature ?? 0, unit)}°{unit}
                              </span>
                              <span className="text-xs text-slate-400">
                                Feels {convertTemp(msg.weatherSummary.feelsLike ?? 0, unit)}°{unit}
                              </span>
                            </div>
                            <p className="text-xs text-sky-300 font-medium">
                              {msg.weatherSummary.conditionText || "Clear"}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <Weather3DIcon
                              condition={msg.weatherSummary.conditionText || "clear"}
                              isNight={!msg.weatherSummary.isDay}
                              size="sm"
                            />
                          </div>
                        </div>

                        {/* 4 Clean Metric Pills */}
                        <div className="grid grid-cols-4 gap-1.5 text-[11px] pt-1">
                          <div className="p-2 rounded-xl bg-white/5 text-center">
                            <span className="text-slate-400 block text-[10px]">💧 Humidity</span>
                            <strong className="text-white mt-0.5 block">{msg.weatherSummary.humidity ?? 0}%</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 text-center">
                            <span className="text-slate-400 block text-[10px]">💨 Wind</span>
                            <strong className="text-white mt-0.5 block">{Math.round(msg.weatherSummary.windSpeed ?? 0)} km/h</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 text-center">
                            <span className="text-slate-400 block text-[10px]">🌧️ Rain</span>
                            <strong className="text-white mt-0.5 block">
                              {msg.dailyForecast?.[0]?.precipitationProb ?? 15}%
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 text-center">
                            <span className="text-slate-400 block text-[10px]">☀️ UV</span>
                            <strong className="text-white mt-0.5 block">{msg.weatherSummary.uvIndex ?? 0}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Activity / Outdoor Recommendation Card (Only when specifically asked) */}
                    {!isUser && msg.recommendation && !isCurrentlyStreaming && (
                      <div className="mt-3.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            {msg.recommendation.title || "Outdoor Recommendation"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                            Score: {msg.recommendation.score}/100
                          </span>
                        </div>
                        {msg.recommendation.bestWindow && (
                          <p className="text-slate-300 text-[11px]">
                            Optimal Window: <strong className="text-white">{msg.recommendation.bestWindow}</strong>
                          </p>
                        )}
                        {msg.recommendation.actionPlan && msg.recommendation.actionPlan.length > 0 && (
                          <ul className="space-y-1 text-slate-300 text-[11px] pt-1 border-t border-emerald-500/20">
                            {msg.recommendation.actionPlan.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Dual-City Comparison Card (Only on comparative queries) */}
                    {!isUser && msg.comparisonData && !isCurrentlyStreaming && (
                      <div className="mt-3.5 p-3.5 rounded-2xl bg-black/30 border border-aurora-cyan/30 shadow-md space-y-2.5 text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <GitCompare className="w-3.5 h-3.5 text-aurora-cyan" />
                            {msg.comparisonData.cityA.location.name} vs {msg.comparisonData.cityB.location.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-aurora-cyan/20 text-aurora-cyan">
                            Side-by-Side
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div className="p-2 rounded-xl bg-white/5">
                            <span className="text-slate-400 block text-[10px]">Best for Travel</span>
                            <strong className="text-emerald-300 mt-0.5 block">{msg.comparisonData.recommendations.betterForTravel}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5">
                            <span className="text-slate-400 block text-[10px]">Cleaner Air</span>
                            <strong className="text-sky-300 mt-0.5 block">{msg.comparisonData.recommendations.betterAirQuality}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5">
                            <span className="text-slate-400 block text-[10px]">Cooler Climate</span>
                            <strong className="text-amber-300 mt-0.5 block">{msg.comparisonData.recommendations.coolerClimate}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Follow-up question chips */}
                    {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && !isCurrentlyStreaming && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.slice(0, 3).map((q, qi) => (
                          <button
                            key={qi}
                            onClick={() => handleSubmitWithText(q)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 hover:text-aurora-cyan border border-white/5 transition-colors text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Action Bar */}
                  {!isUser && !isCurrentlyStreaming && (
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 px-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-white flex items-center gap-1 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>

                      <button
                        onClick={() => handleSpeakText(msg.content)}
                        className="hover:text-white flex items-center gap-1 transition-colors"
                        title="Read aloud"
                      >
                        {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-aurora-cyan" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{isSpeaking ? "Stop" : "Speak"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700/50 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* AI Loading / Thinking State */}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-aurora-cyan animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 rounded-tl-none flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-aurora-cyan animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-slate-300 font-mono">{loadingPhase}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Composer */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-navy-950/80 backdrop-blur-xl shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitWithText(inputText);
            }}
            className="flex items-end gap-2 p-2 rounded-2xl bg-white/[0.06] border border-white/15 focus-within:border-aurora-cyan/50 focus-within:ring-1 focus-within:ring-aurora-cyan/30 transition-all shadow-xl"
          >
            {/* Working Voice Input Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                isListening
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse"
                  : "hover:bg-white/10 text-slate-300 border-transparent"
              }`}
              title={isListening ? "Listening... click to stop" : "Voice input"}
              aria-label="Voice input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Auto-sizing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask WeatherGPT anything... (e.g. Will it rain tonight?)"
              disabled={isLoading}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-slate-400 focus:outline-none resize-none max-h-32 scrollbar-none leading-relaxed"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-aurora-cyan text-navy-950 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
              title="Send message"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 font-bold" />
            </button>
          </form>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>WeatherGPT verifies real meteorological telemetry via Open-Meteo with zero hallucination.</span>
            <span className="hidden sm:inline font-mono">Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
