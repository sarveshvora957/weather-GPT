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
  Globe,
} from "lucide-react";
import { convertTemp, formatTemp } from "@/lib/utils";
import { Weather3DIcon } from "@/components/weather-3d-icon";
import Link from "next/link";
import { WeatherAI, LanguageCode } from "@/lib/weather-ai";

interface ChatBoxProps {
  initialMessages?: AIChatMessage[];
  currentLocation: LocationData;
  onSendMessage: (
    text: string,
    history: AIChatMessage[],
    language?: "auto" | LanguageCode
  ) => Promise<AIChatMessage>;
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
  const [selectedLanguage, setSelectedLanguage] = useState<"auto" | LanguageCode>("auto");
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>("en");
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

  // Current effective language for UI elements
  const currentLang: LanguageCode =
    selectedLanguage !== "auto" ? selectedLanguage : activeLanguage;

  // Sync initialMessages when passed
  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, streamedText]);

  // Setup Web Speech Recognition with dynamic language binding (en-IN, hi-IN, gu-IN)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang =
          currentLang === "gu" ? "gu-IN" : currentLang === "hi" ? "hi-IN" : "en-IN";

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
  }, [currentLang]);

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
        // Set speech recognition language based on selected or detected conversation language
        const targetLang =
          selectedLanguage === "gu" || (selectedLanguage === "auto" && activeLanguage === "gu")
            ? "gu-IN"
            : selectedLanguage === "hi" || (selectedLanguage === "auto" && activeLanguage === "hi")
            ? "hi-IN"
            : "en-IN";
        recognitionRef.current.lang = targetLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition error:", err);
      }
    }
  };

  const handleSpeakText = (text: string, msgLang?: LanguageCode) => {
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
    const speakLang = msgLang || currentLang;
    utterance.lang = speakLang === "gu" ? "gu-IN" : speakLang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleUseMyLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const gpsLocation: LocationData = {
          name: "Current Location",
          latitude,
          longitude,
          country: "India",
        };
        if (onSelectLocation) {
          onSelectLocation(gpsLocation);
        }
        const promptByLang =
          currentLang === "hi"
            ? "यहाँ मौसम कैसा है और क्या मुझे छाता चाहिए?"
            : currentLang === "gu"
            ? "અહીં હવામાન કેવું છે અને શું મારે છત્રી રાખવી જોઈએ?"
            : "What's the weather like here and should I carry an umbrella?";
        handleSubmitWithText(promptByLang);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        const fallbackPrompt =
          currentLang === "hi"
            ? `${currentLocation.name} में आज का मौसम कैसा है?`
            : currentLang === "gu"
            ? `${currentLocation.name}માં આજે હવામાન કેવું છે?`
            : `What is the weather in ${currentLocation.name}?`;
        handleSubmitWithText(fallbackPrompt);
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
      language: currentLang,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsLoading(true);

    // Dynamic phase transitions localized to current language
    const phase1 =
      currentLang === "hi"
        ? "📍 स्थान खोजा जा रहा है..."
        : currentLang === "gu"
        ? "📍 સ્થાન શોધવામાં આવી રહ્યું છે..."
        : "📍 Finding location...";
    const phase2 =
      currentLang === "hi"
        ? "🌦️ मौसम डेटा प्राप्त किया जा रहा है..."
        : currentLang === "gu"
        ? "🌦️ હવામાન માહિતી મેળવી રહ્યા છીએ..."
        : "🌦️ Fetching verified weather data...";
    const phase3 =
      currentLang === "hi"
        ? "🤖 उत्तर तैयार किया जा रहा है..."
        : currentLang === "gu"
        ? "🤖 જવાબ તૈયાર થઈ રહ્યો છે..."
        : "🤖 Preparing natural answer...";

    setLoadingPhase(phase1);
    const phaseTimer1 = setTimeout(() => setLoadingPhase(phase2), 500);
    const phaseTimer2 = setTimeout(() => setLoadingPhase(phase3), 1200);

    try {
      const assistantReply = await onSendMessage(userPrompt, nextHistory, selectedLanguage);
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      // Update active language if returned by backend
      if (assistantReply.language) {
        setActiveLanguage(assistantReply.language);
      }

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
      const fallbackErr =
        currentLang === "gu"
          ? "માફ કરશો, હું હાલમાં નવીનતમ હવામાનની માહિતી મેળવી શક્યો નથી."
          : currentLang === "hi"
          ? "माफ़ कीजिए, मैं अभी नवीनतम मौसम की जानकारी प्राप्त नहीं कर सका।"
          : "I couldn't retrieve current weather data right now. Please check your connection and try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: "assistant",
          content: fallbackErr,
          timestamp: new Date().toISOString(),
          language: currentLang,
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

  // Quick Prompts dynamically adapted to language
  const suggestionCards =
    currentLang === "hi"
      ? [
          { label: "आज का मौसम", icon: "🌡️", prompt: `${currentLocation.name} में आज का मौसम कैसा है?` },
          { label: "क्या बारिश होगी?", icon: "🌧️", prompt: `क्या आज ${currentLocation.name} में बारिश होगी?` },
          { label: "कल का मौसम", icon: "📅", prompt: `${currentLocation.name} में कल का मौसम कैसा रहेगा?` },
          { label: "क्या मुझे छाता ले जाना चाहिए?", icon: "☔", prompt: `क्या मुझे आज ${currentLocation.name} में छाता ले जाना चाहिए?` },
          { label: "मेरे आसपास का मौसम", icon: "🗺️", action: handleUseMyLocation },
          { label: "अहमदाबाद बनाम सूरत मौसम की तुलना", icon: "⚖️", prompt: "अहमदाबाद बनाम सूरत मौसम की तुलना" },
        ]
      : currentLang === "gu"
      ? [
          { label: "આજનું હવામાન", icon: "🌡️", prompt: `${currentLocation.name}માં આજે હવામાન કેવું છે?` },
          { label: "શું વરસાદ પડશે?", icon: "🌧️", prompt: `શું આજે ${currentLocation.name}માં વરસાદ પડશે?` },
          { label: "કાલનું હવામાન", icon: "📅", prompt: `${currentLocation.name}માં કાલે હવામાન કેવું રહેશે?` },
          { label: "શું મારે છત્રી લઈ જવી જોઈએ?", icon: "☔", prompt: `શું મારે આજે ${currentLocation.name}માં છત્રી લઈ જવી જોઈએ?` },
          { label: "મારી આસપાસનું હવામાન", icon: "🗺️", action: handleUseMyLocation },
          { label: "અમદાવાદ અને સુરત વચ્ચે સરખામણી", icon: "⚖️", prompt: "અમદાવાદ અને સુરત વચ્ચે સરખામણી" },
        ]
      : [
          { label: "Weather today", icon: "🌡️", prompt: `What's the weather today in ${currentLocation.name}?` },
          { label: "Will it rain?", icon: "🌧️", prompt: `Will it rain today in ${currentLocation.name}?` },
          { label: "Weather tomorrow", icon: "📅", prompt: `What's the weather tomorrow in ${currentLocation.name}?` },
          { label: "Should I carry an umbrella?", icon: "☔", prompt: `Should I carry an umbrella in ${currentLocation.name}?` },
          { label: "Weather near me", icon: "🗺️", action: handleUseMyLocation },
          { label: "Ahmedabad vs Surat comparison", icon: "⚖️", prompt: "Ahmedabad vs Surat weather comparison" },
        ];

  return (
    <div className="flex flex-col h-full w-full bg-navy-950/40 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
      {/* 1. Top Bar: Clean, modern header with Language Selector */}
      <header className="h-16 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between bg-navy-950/80 backdrop-blur-xl shrink-0 z-10 gap-3">
        <div className="flex items-center gap-3">
          {/* History drawer toggle on mobile */}
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 md:hidden transition-colors shrink-0"
              title="Chat History"
              aria-label="Toggle history"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-aurora-cyan p-[1px] shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-xl bg-navy-950 flex items-center justify-center">
                <Bot className="w-4 h-4 text-aurora-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">WeatherGPT</h1>
                <span className="text-[10px] text-aurora-cyan font-mono px-1.5 py-0.2 rounded bg-aurora-cyan/10 border border-aurora-cyan/20">
                  AI Weather Agent
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden lg:block">
                {currentLang === "hi"
                  ? "मुझसे मौसम के बारे में कुछ भी पूछें (English, हिंदी, ગુજરાતી)"
                  : currentLang === "gu"
                  ? "મને હવામાન વિશે કંઈ પણ પૂછો (English, हिंदी, ગુજરાતી)"
                  : "Ask me anything about the weather (English, Hindi, Gujarati)"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions: Language Selector + Location + Unit + New Chat */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Multilingual Selector */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-xl border border-white/10 text-xs shrink-0">
            <div className="flex items-center gap-1 pl-1.5 pr-0.5 text-slate-400 hidden sm:flex">
              <Globe className="w-3.5 h-3.5 text-aurora-cyan" />
            </div>
            <button
              type="button"
              onClick={() => setSelectedLanguage("auto")}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                selectedLanguage === "auto"
                  ? "bg-aurora-cyan/25 text-aurora-cyan border border-aurora-cyan/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Auto-detect Language (English / Hindi / Gujarati)"
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("en")}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                selectedLanguage === "en"
                  ? "bg-aurora-cyan/25 text-aurora-cyan border border-aurora-cyan/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("hi")}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                selectedLanguage === "hi"
                  ? "bg-aurora-cyan/25 text-aurora-cyan border border-aurora-cyan/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="हिंदी (Hindi)"
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("gu")}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                selectedLanguage === "gu"
                  ? "bg-aurora-cyan/25 text-aurora-cyan border border-aurora-cyan/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="ગુજરાતી (Gujarati)"
            >
              ગુજરાતી
            </button>
          </div>

          {/* Active location indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 hidden sm:flex"
            title={`Active Context: ${currentLocation.name}`}
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="max-w-[80px] md:max-w-[120px] truncate font-medium">
              {currentLocation.name}
            </span>
          </div>

          {/* Near Me GPS Button */}
          <button
            onClick={handleUseMyLocation}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-sky-300 hover:text-white border border-white/10 transition-colors shrink-0"
            title="Use current GPS location"
            aria-label="Use GPS"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {/* Unit Toggle °C / °F */}
          {onToggleUnit && (
            <button
              onClick={onToggleUnit}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-aurora-cyan transition-colors shrink-0"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-brand-500 hover:brightness-110 text-white text-xs font-bold shadow-sm transition-all shrink-0"
            title="Start fresh conversation"
            aria-label="New chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* 2. Messages Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          /* Welcome / Empty State adapted to active/selected language */
          <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4 py-8 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-aurora-cyan p-[1px] shadow-neon-cyan flex items-center justify-center mb-4">
              <div className="w-full h-full rounded-2xl bg-navy-950 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-aurora-cyan" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentLang === "hi"
                ? "मौसम के बारे में आप क्या जानना चाहते हैं?"
                : currentLang === "gu"
                ? "હવામાન વિશે હું તમને કેવી રીતે મદદ કરી શકું?"
                : "How can I help with the weather?"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md leading-relaxed">
              {currentLang === "hi"
                ? "मुझसे मौसम, बारिश, तापमान, छाता ले जाने या शहरों की तुलना के बारे में पूछें।"
                : currentLang === "gu"
                ? "મને વરસાદનું જોખમ, તાપમાન, છત્રી રાખવા કે શહેરોની સરખામણી વિશે પૂછો."
                : "Ask about rainfall risks, hourly temperatures, outdoor playability, or compare cities across India with zero hallucination."}
            </p>

            {/* 6 Clean Clickable Suggested Prompts adapted to language */}
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
            const msgLang = msg.language || currentLang;

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
                    {!isUser && msg.language && (
                      <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-white/5 text-slate-400">
                        {msg.language}
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
                            {msgLang === "gu"
                              ? "ચકાસાયેલ લાઈવ"
                              : msgLang === "hi"
                              ? "सत्यापित लाइव"
                              : "Verified Live"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4 py-1">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-white">
                                {convertTemp(msg.weatherSummary.temperature ?? 0, unit)}°{unit}
                              </span>
                              <span className="text-xs text-slate-400">
                                {msgLang === "gu" ? "અનુભવાતું" : msgLang === "hi" ? "महसूस" : "Feels"}{" "}
                                {convertTemp(msg.weatherSummary.feelsLike ?? 0, unit)}°{unit}
                              </span>
                            </div>
                            <p className="text-xs text-sky-300 font-medium">
                              {WeatherAI.getLocalizedCondition(msg.weatherSummary.conditionText || "Clear", msgLang)}
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
                            <span className="text-slate-400 block text-[10px]">
                              {msgLang === "gu" ? "💧 ભેજ" : msgLang === "hi" ? "💧 आर्द्रता" : "💧 Humidity"}
                            </span>
                            <strong className="text-white mt-0.5 block">{msg.weatherSummary.humidity ?? 0}%</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 text-center">
                            <span className="text-slate-400 block text-[10px]">
                              {msgLang === "gu" ? "💨 પવન" : msgLang === "hi" ? "💨 हवा" : "💨 Wind"}
                            </span>
                            <strong className="text-white mt-0.5 block">{Math.round(msg.weatherSummary.windSpeed ?? 0)} km/h</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 text-center">
                            <span className="text-slate-400 block text-[10px]">
                              {msgLang === "gu" ? "🌧️ વરસાદ" : msgLang === "hi" ? "🌧️ बारिश" : "🌧️ Rain"}
                            </span>
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
                            <span className="text-slate-400 block text-[10px]">
                              {msgLang === "gu" ? "મુસાફરી માટે શ્રેષ્ઠ" : msgLang === "hi" ? "यात्रा के लिए श्रेष्ठ" : "Best for Travel"}
                            </span>
                            <strong className="text-emerald-300 mt-0.5 block">{msg.comparisonData.recommendations.betterForTravel}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5">
                            <span className="text-slate-400 block text-[10px]">
                              {msgLang === "gu" ? "સ્વચ્છ હવા" : msgLang === "hi" ? "स्वच्छ वायु" : "Cleaner Air"}
                            </span>
                            <strong className="text-sky-300 mt-0.5 block">{msg.comparisonData.recommendations.betterAirQuality}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5">
                            <span className="text-slate-400 block text-[10px]">
                              {msgLang === "gu" ? "વધુ ઠંડું" : msgLang === "hi" ? "अधिक ठंडा" : "Cooler Climate"}
                            </span>
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
                        onClick={() => handleSpeakText(msg.content, msg.language)}
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
              title={
                isListening
                  ? "Listening... click to stop"
                  : `Voice input (${currentLang === "gu" ? "Gujarati" : currentLang === "hi" ? "Hindi" : "English"})`
              }
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
              placeholder={
                currentLang === "hi"
                  ? "WeatherGPT से कुछ भी पूछें... (जैसे: क्या आज रात बारिश होगी?)"
                  : currentLang === "gu"
                  ? "WeatherGPT ને કંઈ પણ પૂછો... (જેમ કે: શું આજે રાત્રે વરસાદ પડશે?)"
                  : "Ask WeatherGPT anything... (e.g. Will it rain tonight?)"
              }
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
            <span>
              {currentLang === "hi"
                ? "WeatherGPT शून्य-त्रुटि वास्तविक मौसम डेटा प्रदान करता है। (English, हिंदी, ગુજરાતી)"
                : currentLang === "gu"
                ? "WeatherGPT વાસ્તવિક હવામાન ડેટા સાથે સચોટ માહિતી આપે છે. (English, हिंदी, ગુજરાતી)"
                : "WeatherGPT verifies real meteorological telemetry with zero hallucination. (English, Hindi, Gujarati)"}
            </span>
            <span className="hidden sm:inline font-mono">Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
