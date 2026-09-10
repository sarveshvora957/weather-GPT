import {
  LocationData,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQuality,
  WeatherAlert,
  AIRecommendation,
  AIChatMessage,
  ComparisonData,
} from "@/types/weather";
import { WeatherService, DEFAULT_LOCATION } from "./weather-service";
import { formatTemp, formatWindSpeed } from "./utils";

export type LanguageCode = "en" | "hi" | "gu";

export interface AIProcessOptions {
  userApiKey?: string;
  isDemoMode?: boolean;
  activeLocation?: LocationData;
  unit?: "C" | "F";
  language?: "auto" | LanguageCode;
}

export class WeatherAI {
  /**
   * 1. Automatic Language Detection & Resolution Engine
   * Priority:
   * 1. Manual user selection ("en" | "hi" | "gu")
   * 2. Direct script detection (Devanagari -> hi, Gujarati -> gu)
   * 3. Romanized mixed-language detection (Hinglish -> hi, Gujlish -> gu)
   * 4. Multi-turn conversation language memory
   * 5. Fallback -> "en"
   */
  public static detectLanguage(
    query: string,
    history: { role: string; content?: string; language?: LanguageCode }[] = [],
    preferred?: "auto" | LanguageCode
  ): LanguageCode {
    if (preferred && preferred !== "auto") {
      return preferred;
    }

    const q = query.trim();
    if (!q) return "en";

    // 1. Script checks:
    // Gujarati script unicode block: U+0A80 to U+0AFF
    if (/[\u0A80-\u0AFF]/.test(q)) {
      return "gu";
    }
    // Devanagari script unicode block: U+0900 to U+097F
    if (/[\u0900-\u097F]/.test(q)) {
      return "hi";
    }

    const qLower = q.toLowerCase();

    // 2. Romanized Gujarati (Gujlish) distinctive vocabulary & inflections:
    const gujlishPatterns = [
      /\b(nu|chhe|che|kevu|kevo|kevi|ketlu|ketla|ketli|aaje|kaale|varsad|havaman|tadhko|chhatri|javanu|bahar|padse|rehse|nathi|aahi|hiya|joye|tamare|maru|aavse|kem|koni|sathe|karshe|bhai|shun|shu|ketla|hovanu)\b/i,
      /\b\w+\s+(?:nu|na|ni|no|ma)\b/i,
      /\b\w+(?:ma|nu)\b/i,
    ];

    // 3. Romanized Hindi (Hinglish) distinctive vocabulary & inflections:
    const hinglishPatterns = [
      /\b(kaisa|kaisi|kaise|kitna|kitni|kitne|barish|barsat|mausam|dhup|chata|chaata|hogi|hoga|honge|chahiye|yahan|yaha|kripya|mujhe|humko|rahega|rahegi|padegi|batao|aaj|hona)\b/i,
      /\b\w+\s+(?:ka|ki|ke|ko|me|se)\b/i,
    ];

    let gujScore = 0;
    let hinScore = 0;

    for (const pat of gujlishPatterns) {
      if (pat.test(qLower)) gujScore += 2;
    }
    for (const pat of hinglishPatterns) {
      if (pat.test(qLower)) hinScore += 2;
    }

    // Specific phrase checks:
    if (/\b(?:weather today kevu|nu weather|havaman kevu|varsad padse|aaje bahar|bahar javanu)\b/i.test(qLower)) {
      return "gu";
    }
    if (/\b(?:weather today kaisa|ka weather|mausam kaisa|barish hogi|chata le|le jana chahiye)\b/i.test(qLower)) {
      return "hi";
    }

    if (gujScore > hinScore && gujScore >= 2) return "gu";
    if (hinScore > gujScore && hinScore >= 2) return "hi";

    // 4. Conversation Context Memory:
    // If the query is an ambiguous continuation without English question grammar:
    if (history && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.language && (msg.language === "hi" || msg.language === "gu")) {
          const words = qLower.split(/\s+/).filter(Boolean);
          // If query is short and doesn't explicitly start with English question words:
          if (words.length <= 4 && !/^(what|which|how|is|are|can|could|should|tell|show|will)\b/i.test(qLower)) {
            return msg.language;
          }
        }
      }
    }

    // Default fallback
    return "en";
  }

  /**
   * Localized Weather Condition Helper
   */
  public static getLocalizedCondition(text: string, lang: LanguageCode): string {
    const t = (text || "").toLowerCase();
    if (lang === "en") return text || "Clear Sky";
    if (lang === "hi") {
      if (t.includes("clear") || t.includes("sunny")) return "साफ़ आकाश / धूप";
      if (t.includes("partly cloudy")) return "आंशिक रूप से बादल";
      if (t.includes("overcast") || t.includes("cloudy")) return "बादल छाए हुए";
      if (t.includes("thunderstorm") || t.includes("storm")) return "गरज के साथ तूफ़ान";
      if (t.includes("rain") || t.includes("shower") || t.includes("drizzle")) return "बारिश की फुहारें / बारिश";
      if (t.includes("snow")) return "बर्फ़बारी";
      if (t.includes("fog") || t.includes("mist")) return "कोहरा / धुंध";
      return "सामान्य मौसम";
    }
    // gu
    if (t.includes("clear") || t.includes("sunny")) return "સ્વચ્છ આકાશ / તડકો";
    if (t.includes("partly cloudy")) return "અંશતઃ વાદળછાયું";
    if (t.includes("overcast") || t.includes("cloudy")) return "વાદળછાયું આકાશ";
    if (t.includes("thunderstorm") || t.includes("storm")) return "ગાજવીજ સાથે વાવાઝોડું";
    if (t.includes("rain") || t.includes("shower") || t.includes("drizzle")) return "વરસાદી ઝાપટાં / વરસાદ";
    if (t.includes("snow")) return "બરફવર્ષા";
    if (t.includes("fog") || t.includes("mist")) return "ધુમ્મસ";
    return "સામાન્ય વાતાવરણ";
  }

  /**
   * Localized AQI Category Helper
   */
  public static getLocalizedAQICategory(cat: string, lang: LanguageCode): string {
    const c = (cat || "").toLowerCase();
    if (lang === "en") return cat || "Good";
    if (lang === "hi") {
      if (c.includes("good")) return "अच्छा";
      if (c.includes("fair") || c.includes("moderate")) return "मध्यम";
      if (c.includes("poor") || c.includes("unhealthy")) return "खराब / अस्वस्थ";
      if (c.includes("very poor")) return "बहुत खराब";
      if (c.includes("hazardous") || c.includes("severe")) return "गंभीर";
      return "सामान्य";
    }
    // gu
    if (c.includes("good")) return "સારું";
    if (c.includes("fair") || c.includes("moderate")) return "મધ્યમ";
    if (c.includes("poor") || c.includes("unhealthy")) return "નબળું / અસ્વસ્થ";
    if (c.includes("very poor")) return "ખૂબ નબળું";
    if (c.includes("hazardous") || c.includes("severe")) return "ગંભીર";
    return "સામાન્ય";
  }

  /**
   * Localized Day Name Helper
   */
  public static getLocalizedDayName(dayName: string, lang: LanguageCode): string {
    const d = (dayName || "").toLowerCase();
    if (lang === "en") return dayName;
    if (lang === "hi") {
      if (d.includes("mon")) return "सोमवार";
      if (d.includes("tue")) return "मंगलवार";
      if (d.includes("wed")) return "बुधवार";
      if (d.includes("thu")) return "गुरुवार";
      if (d.includes("fri")) return "शुक्रवार";
      if (d.includes("sat")) return "शनिवार";
      if (d.includes("sun")) return "रविवार";
      return dayName;
    }
    // gu
    if (d.includes("mon")) return "સોમવાર";
    if (d.includes("tue")) return "મંગળવાર";
    if (d.includes("wed")) return "બુધવાર";
    if (d.includes("thu")) return "ગુરુવાર";
    if (d.includes("fri")) return "શુક્રવાર";
    if (d.includes("sat")) return "શનિવાર";
    if (d.includes("sun")) return "રવિવાર";
    return dayName;
  }

  /**
   * Main entry point: Process natural language question, retrieve weather, compute analysis, and generate answer
   */
  static async processQuery(
    prompt: string,
    history: { role: string; content?: string; location?: LocationData; language?: LanguageCode }[] = [],
    options: AIProcessOptions = {}
  ): Promise<AIChatMessage> {
    const trimmed = prompt.trim();
    let unit: "C" | "F" = options.unit === "F" ? "F" : "C";

    // 0. Language Detection
    const lang = this.detectLanguage(trimmed, history, options.language);

    // Auto-detect unit conversion request in user query (English, Hindi, Gujarati)
    if (
      /\b(?:in fahrenheit|to fahrenheit|convert to fahrenheit|fahrenheit|in f|to f)\b/i.test(trimmed) ||
      /फ़ारेनहाइट|फॉरेनहाइट|ફેરેનહીટ|ફોરેનહીટ/i.test(trimmed)
    ) {
      unit = "F";
    } else if (
      /\b(?:in celsius|to celsius|convert to celsius|celsius|in c|to c)\b/i.test(trimmed) ||
      /सेल्सियस|સેલ્સિયસ/i.test(trimmed)
    ) {
      unit = "C";
    }

    // 0b. Check for dual-city comparative query (English, Hindi, Gujarati)
    const twoLocations = await this.extractTwoLocations(trimmed, history, options.activeLocation, lang);
    if (twoLocations) {
      const [cityA, cityB] = twoLocations;
      const comparison = await WeatherService.compareCities(cityA, cityB);
      const comparativeContent = this.generateComparativeResponse(
        trimmed,
        cityA,
        cityB,
        comparison,
        unit,
        lang
      );

      const suggestedQuestions =
        lang === "hi"
          ? [
              `${cityA.name} का 7 दिनों का मौसम पूर्वानुमान`,
              `${cityB.name} का 7 दिनों का मौसम पूर्वानुमान`,
              `क्या आज ${cityA.name} में बारिश होगी?`,
              `क्या मुझे ${cityB.name} में छाता ले जाना चाहिए?`,
            ]
          : lang === "gu"
          ? [
              `${cityA.name}નું 7 દિવસનું હવામાન`,
              `${cityB.name}નું 7 દિવસનું હવામાન`,
              `શું આજે ${cityA.name}માં વરસાદ પડશે?`,
              `શું મારે ${cityB.name}માં છત્રી લઈ જવી જોઈએ?`,
            ]
          : [
              `Detailed 7-day forecast for ${cityA.name}`,
              `Detailed 7-day forecast for ${cityB.name}`,
              `Will it rain today in ${cityA.name}?`,
              `Should I carry an umbrella in ${cityB.name}?`,
            ];

      return {
        id: `msg-comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: "assistant",
        content: comparativeContent,
        timestamp: new Date().toISOString(),
        intent: "travel",
        location: cityA,
        comparisonData: comparison,
        suggestedQuestions,
        language: lang,
        isDemo: options.isDemoMode,
      };
    }

    // 1. Extract Location & Temporal parameters with conversational memory
    const extractedLocation = await this.extractLocation(trimmed, history, options.activeLocation, lang);
    const temporalIntent = this.extractTemporalIntent(trimmed, lang, history);
    const domain = this.detectDomain(trimmed, lang);

    // 2. Fetch real meteorological data with zero hallucination
    let fullWeather, aqi, alerts;
    try {
      [fullWeather, aqi, alerts] = await Promise.all([
        WeatherService.getFullWeather(extractedLocation.latitude, extractedLocation.longitude),
        WeatherService.getAirQuality(extractedLocation.latitude, extractedLocation.longitude),
        WeatherService.getWeatherAlerts(extractedLocation.latitude, extractedLocation.longitude, extractedLocation.name),
      ]);
    } catch (fetchErr) {
      console.warn("Failed to fetch meteorological data:", fetchErr);
      const unavailableMsg =
        lang === "gu"
          ? "માફ કરશો, હું હાલમાં નવીનતમ હવામાનની માહિતી મેળવી શક્યો નથી."
          : lang === "hi"
          ? "माफ़ कीजिए, मैं अभी नवीनतम मौसम की जानकारी प्राप्त नहीं कर सका।"
          : "Sorry, I couldn't retrieve the latest weather data right now.";
      return {
        id: `msg-err-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: "assistant",
        content: unavailableMsg,
        timestamp: new Date().toISOString(),
        location: extractedLocation,
        language: lang,
        isDemo: options.isDemoMode,
      };
    }

    const { current, hourly, daily } = fullWeather;

    // 3. Compute Domain-specific recommendation matrix
    const recommendation = this.computeRecommendation(
      domain,
      trimmed,
      temporalIntent,
      current,
      hourly,
      daily,
      aqi,
      extractedLocation,
      unit
    );

    // 4. Generate conversational explanation in detected language
    let answerContent = "";
    if (options.userApiKey || process.env.GEMINI_API_KEY) {
      try {
        answerContent = await this.callGeminiLLM(
          prompt,
          history,
          extractedLocation,
          current,
          hourly.slice(0, 48),
          daily.slice(0, 7),
          aqi,
          recommendation,
          options.userApiKey || process.env.GEMINI_API_KEY!,
          unit,
          lang
        );
      } catch (err) {
        console.warn("Gemini API call failed, using natural deterministic multilingual engine:", err);
        answerContent = this.generateDeterministicResponse(
          domain,
          trimmed,
          temporalIntent,
          extractedLocation,
          current,
          hourly,
          daily,
          aqi,
          recommendation,
          unit,
          lang
        );
      }
    } else {
      answerContent = this.generateDeterministicResponse(
        domain,
        trimmed,
        temporalIntent,
        extractedLocation,
        current,
        hourly,
        daily,
        aqi,
        recommendation,
        unit,
        lang
      );
    }

    // 5. Generate smart follow-up suggestions in detected language
    const suggestedQuestions = this.generateFollowUpQuestions(domain, extractedLocation.name, lang);

    // Only attach recommendation (Feasibility Score & Action Plan) if user specifically asked about activities / playability / outdoor
    const qLower = trimmed.toLowerCase();
    const isActivityQuery =
      domain === "cricket" ||
      domain === "sports" ||
      domain === "events" ||
      qLower.includes("outside") ||
      qLower.includes("outdoor") ||
      qLower.includes("go out") ||
      qLower.includes("can we play") ||
      qLower.includes("activities") ||
      qLower.includes("bahar") ||
      qLower.includes("javanu") ||
      qLower.includes("ghoomne") ||
      qLower.includes("khelne") ||
      trimmed.includes("बाहर") ||
      trimmed.includes("घूमने") ||
      trimmed.includes("બહાર") ||
      trimmed.includes("જવાનું");

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: "assistant",
      content: answerContent,
      timestamp: new Date().toISOString(),
      intent: domain,
      location: extractedLocation,
      weatherSummary: current,
      hourlyForecast: hourly.slice(0, 12),
      dailyForecast: daily.slice(0, 7),
      airQuality: aqi,
      recommendation: isActivityQuery ? recommendation : undefined,
      alerts: alerts.filter((a) => a.severity !== "LOW"),
      suggestedQuestions,
      language: lang,
      isDemo: options.isDemoMode,
    };
  }

  /**
   * Comprehensive dictionary of major Indian & global cities with native English, Hindi, and Gujarati aliases
   */
  private static readonly cityKeywords: {
    name: string;
    displayName: string;
    lat: number;
    lon: number;
    country: string;
    state: string;
    tz?: string;
    aliases: string[];
  }[] = [
    // Gujarat Cities & Towns
    {
      name: "ahmedabad",
      displayName: "Ahmedabad",
      lat: 23.0225,
      lon: 72.5714,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["ahmedabad", "amdavad", "अहमदाबाद", "અમદાવાદ", "અહમદાબાદ"],
    },
    {
      name: "rajkot",
      displayName: "Rajkot",
      lat: 22.3039,
      lon: 70.8022,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["rajkot", "राजकोट", "રાજકોટ"],
    },
    {
      name: "jetpur",
      displayName: "Jetpur",
      lat: 21.7554,
      lon: 70.6276,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["jetpur", "जेतपुर", "જેતપુર", "જેટપુર"],
    },
    {
      name: "surat",
      displayName: "Surat",
      lat: 21.1702,
      lon: 72.8311,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["surat", "सूरत", "સુરત"],
    },
    {
      name: "vadodara",
      displayName: "Vadodara",
      lat: 22.3072,
      lon: 73.1812,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["vadodara", "baroda", "वडोदरा", "बड़ौदा", "વડોદરા", "બરોડા"],
    },
    {
      name: "gondal",
      displayName: "Gondal",
      lat: 21.9619,
      lon: 70.7997,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["gondal", "गोंडल", "ગોંડલ"],
    },
    {
      name: "morbi",
      displayName: "Morbi",
      lat: 22.812,
      lon: 70.8384,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["morbi", "मोरबी", "મોરબી"],
    },
    {
      name: "bhavnagar",
      displayName: "Bhavnagar",
      lat: 21.7645,
      lon: 72.1519,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["bhavnagar", "भावनगर", "ભાવનગર"],
    },
    {
      name: "jamnagar",
      displayName: "Jamnagar",
      lat: 22.4707,
      lon: 70.0577,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["jamnagar", "जामनगर", "જામનગર"],
    },
    {
      name: "junagadh",
      displayName: "Junagadh",
      lat: 21.5222,
      lon: 70.4579,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["junagadh", "जूनागढ़", "જૂનાગઢ"],
    },
    {
      name: "gandhinagar",
      displayName: "Gandhinagar",
      lat: 23.2156,
      lon: 72.6369,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["gandhinagar", "गांधीनगर", "ગાંધીનગર"],
    },
    {
      name: "porbandar",
      displayName: "Porbandar",
      lat: 21.6417,
      lon: 69.6293,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["porbandar", "पोरबंदर", "પોરબંદર"],
    },
    {
      name: "somnath",
      displayName: "Somnath",
      lat: 20.9014,
      lon: 70.4011,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["somnath", "सोमनाथ", "સોમનાથ"],
    },
    {
      name: "anand",
      displayName: "Anand",
      lat: 22.5645,
      lon: 72.9289,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["anand", "आनंद", "આણંદ"],
    },
    {
      name: "bhuj",
      displayName: "Bhuj",
      lat: 23.242,
      lon: 69.6669,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["bhuj", "भुज", "ભુજ"],
    },
    {
      name: "mehsana",
      displayName: "Mehsana",
      lat: 23.588,
      lon: 72.3693,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["mehsana", "महेसाणा", "મહેસાણા"],
    },
    {
      name: "navsari",
      displayName: "Navsari",
      lat: 20.95,
      lon: 72.93,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["navsari", "नवसारी", "નવસારી"],
    },
    {
      name: "valsad",
      displayName: "Valsad",
      lat: 20.61,
      lon: 72.93,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["valsad", "वलसाड", "વલસાડ"],
    },
    {
      name: "bharuch",
      displayName: "Bharuch",
      lat: 21.7,
      lon: 72.97,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["bharuch", "भरूच", "ભરૂચ"],
    },
    {
      name: "vapi",
      displayName: "Vapi",
      lat: 20.37,
      lon: 72.9,
      country: "India",
      state: "Gujarat",
      tz: "Asia/Kolkata",
      aliases: ["vapi", "वापी", "વાપી"],
    },

    // Major Indian Metros
    {
      name: "new delhi",
      displayName: "New Delhi",
      lat: 28.6139,
      lon: 77.209,
      country: "India",
      state: "Delhi",
      tz: "Asia/Kolkata",
      aliases: ["new delhi", "delhi", "नई दिल्ली", "दिल्ली", "નવી દિલ્હી", "દિલ્હી", "દિલ્લી"],
    },
    {
      name: "mumbai",
      displayName: "Mumbai",
      lat: 19.076,
      lon: 72.8777,
      country: "India",
      state: "Maharashtra",
      tz: "Asia/Kolkata",
      aliases: ["mumbai", "bombay", "मुंबई", "મુંબઈ"],
    },
    {
      name: "pune",
      displayName: "Pune",
      lat: 18.5204,
      lon: 73.8567,
      country: "India",
      state: "Maharashtra",
      tz: "Asia/Kolkata",
      aliases: ["pune", "पुणे", "પુણે"],
    },
    {
      name: "nagpur",
      displayName: "Nagpur",
      lat: 21.1458,
      lon: 79.0882,
      country: "India",
      state: "Maharashtra",
      tz: "Asia/Kolkata",
      aliases: ["nagpur", "नागपुर", "નાગપુર"],
    },
    {
      name: "bengaluru",
      displayName: "Bengaluru",
      lat: 12.9716,
      lon: 77.5946,
      country: "India",
      state: "Karnataka",
      tz: "Asia/Kolkata",
      aliases: ["bengaluru", "bangalore", "बेंगलुरु", "બેંગલુરુ"],
    },
    {
      name: "kolkata",
      displayName: "Kolkata",
      lat: 22.5726,
      lon: 88.3639,
      country: "India",
      state: "West Bengal",
      tz: "Asia/Kolkata",
      aliases: ["kolkata", "calcutta", "कोलकाता", "કોલકાતા"],
    },
    {
      name: "chennai",
      displayName: "Chennai",
      lat: 13.0827,
      lon: 80.2707,
      country: "India",
      state: "Tamil Nadu",
      tz: "Asia/Kolkata",
      aliases: ["chennai", "madras", "चेन्नई", "ચેન્નાઈ"],
    },
    {
      name: "hyderabad",
      displayName: "Hyderabad",
      lat: 17.385,
      lon: 78.4867,
      country: "India",
      state: "Telangana",
      tz: "Asia/Kolkata",
      aliases: ["hyderabad", "हैदराबाद", "હૈદરાબાદ"],
    },
    {
      name: "jaipur",
      displayName: "Jaipur",
      lat: 26.9124,
      lon: 75.7873,
      country: "India",
      state: "Rajasthan",
      tz: "Asia/Kolkata",
      aliases: ["jaipur", "जयपुर", "જયપુર"],
    },
    {
      name: "jodhpur",
      displayName: "Jodhpur",
      lat: 26.2389,
      lon: 73.0243,
      country: "India",
      state: "Rajasthan",
      tz: "Asia/Kolkata",
      aliases: ["jodhpur", "जोधपुर", "જોધપુર"],
    },
    {
      name: "udaipur",
      displayName: "Udaipur",
      lat: 24.5854,
      lon: 73.7125,
      country: "India",
      state: "Rajasthan",
      tz: "Asia/Kolkata",
      aliases: ["udaipur", "उदयपुर", "ઉદયપુર"],
    },
    {
      name: "lucknow",
      displayName: "Lucknow",
      lat: 26.8467,
      lon: 80.9462,
      country: "India",
      state: "Uttar Pradesh",
      tz: "Asia/Kolkata",
      aliases: ["lucknow", "लखनऊ", "લખનૌ"],
    },
    {
      name: "kanpur",
      displayName: "Kanpur",
      lat: 26.4499,
      lon: 80.3319,
      country: "India",
      state: "Uttar Pradesh",
      tz: "Asia/Kolkata",
      aliases: ["kanpur", "कानपुर", "કાનપુર"],
    },
    {
      name: "varanasi",
      displayName: "Varanasi",
      lat: 25.3176,
      lon: 82.9739,
      country: "India",
      state: "Uttar Pradesh",
      tz: "Asia/Kolkata",
      aliases: ["varanasi", "बनारस", "वाराणसी", "વારાણસી"],
    },
    {
      name: "chandigarh",
      displayName: "Chandigarh",
      lat: 30.7333,
      lon: 76.7794,
      country: "India",
      state: "Chandigarh",
      tz: "Asia/Kolkata",
      aliases: ["chandigarh", "चंडीगढ़", "ચંડીગઢ"],
    },
    {
      name: "bhopal",
      displayName: "Bhopal",
      lat: 23.2599,
      lon: 77.4126,
      country: "India",
      state: "Madhya Pradesh",
      tz: "Asia/Kolkata",
      aliases: ["bhopal", "भोपाल", "ભોપાલ"],
    },
    {
      name: "indore",
      displayName: "Indore",
      lat: 22.7196,
      lon: 75.8577,
      country: "India",
      state: "Madhya Pradesh",
      tz: "Asia/Kolkata",
      aliases: ["indore", "इंदौर", "ઇન્દોર"],
    },
    {
      name: "goa",
      displayName: "Goa",
      lat: 15.2993,
      lon: 74.124,
      country: "India",
      state: "Goa",
      tz: "Asia/Kolkata",
      aliases: ["goa", "गोवा", "ગોવા"],
    },
    {
      name: "srinagar",
      displayName: "Srinagar",
      lat: 34.0837,
      lon: 74.7973,
      country: "India",
      state: "Jammu and Kashmir",
      tz: "Asia/Kolkata",
      aliases: ["srinagar", "श्रीनगर", "શ્રીનગર"],
    },
    {
      name: "shimla",
      displayName: "Shimla",
      lat: 31.1048,
      lon: 77.1734,
      country: "India",
      state: "Himachal Pradesh",
      tz: "Asia/Kolkata",
      aliases: ["shimla", "शिमला", "શિમલા"],
    },
    // Global Metros
    {
      name: "london",
      displayName: "London",
      lat: 51.5074,
      lon: -0.1278,
      country: "United Kingdom",
      state: "England",
      tz: "Europe/London",
      aliases: ["london", "लंदन", "લંડન"],
    },
    {
      name: "new york",
      displayName: "New York",
      lat: 40.7128,
      lon: -74.006,
      country: "United States",
      state: "New York",
      tz: "America/New_York",
      aliases: ["new york", "न्यूयॉर्क", "ન્યૂયોર્ક"],
    },
    {
      name: "dubai",
      displayName: "Dubai",
      lat: 25.2048,
      lon: 55.2708,
      country: "United Arab Emirates",
      state: "Dubai",
      tz: "Asia/Dubai",
      aliases: ["dubai", "दुबई", "દુબઈ"],
    },
  ];

  /**
   * Helper to inspect prior conversation messages backwards for active location context
   */
  private static findLocationInHistory(
    history: { role: string; content?: string; location?: LocationData }[] = []
  ): LocationData | null {
    if (!history || history.length === 0) return null;
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.location && msg.location.name && msg.location.latitude && msg.location.longitude) {
        return msg.location;
      }
      if (msg.content) {
        const text = msg.content;
        for (const item of this.cityKeywords) {
          for (const alias of item.aliases) {
            const isAscii = /^[a-z0-9\s.-]+$/i.test(alias);
            const matches = isAscii
              ? new RegExp(`(?:^|[\\s,.;!?]|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:માં|નું|ના|ની|નો|થી|me|ma)?(?:$|[\\s,.;!?]|\\b)`, "i").test(text)
              : text.includes(alias);
            if (matches) {
              return {
                id: `${item.name}_${item.lat}_${item.lon}`,
                name: item.displayName,
                admin1: item.state,
                country: item.country,
                latitude: item.lat,
                longitude: item.lon,
                timezone: item.tz || "Asia/Kolkata",
              };
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Multilingual Entity Extraction for Geographic Locations
   * Supports native Gujarati, Devanagari Hindi, Roman Hindi, Roman Gujarati, and global geocoding
   */
  private static async extractLocation(
    query: string,
    history: { role: string; content?: string; location?: LocationData }[] = [],
    activeLocation?: LocationData,
    lang: LanguageCode = "en"
  ): Promise<LocationData> {
    const qRaw = query.trim();
    const qLower = qRaw.toLowerCase();

    // Direct check for "near me", "here", "અહીં", "यहाँ"
    if (
      qLower.includes("near me") ||
      qLower.includes("my location") ||
      qLower.includes("current location") ||
      qLower.includes("here") ||
      qLower.includes("yahan") ||
      qLower.includes("yaha") ||
      qLower.includes("ahi") ||
      qLower.includes("ahiya") ||
      qRaw.includes("यहाँ") ||
      qRaw.includes("यहाँ का") ||
      qRaw.includes("અહીં") ||
      qRaw.includes("અહીંયા") ||
      qRaw.includes("અહિયાં")
    ) {
      return activeLocation || DEFAULT_LOCATION;
    }

    // Helper to sanitize candidate search text across English, Hindi, and Gujarati
    const cleanLocationCandidate = (raw: string): string => {
      let s = raw.replace(/[?,!:;'"()[\]{}।॥]/g, " ");

      // Strip Gujarati locative & genitive suffixes attached to words (e.g. અમદાવાદમાં -> અમદાવાદ, રાજકોટમાં -> રાજકોટ, જેટપુરમાં -> જેતપુર)
      s = s.replace(/([^\s]+?)(?:માં|નું|ના|ની|નો|થી)\b/g, "$1 ");
      // Strip Roman attached suffix: e.g. "Ahmedabadma" -> "Ahmedabad"
      s = s.replace(/\b([a-zA-Z]{3,20})(?:ma|me)\b/gi, "$1 ");

      const stopPatterns = [
        /\b(?:tomorrow|today|tonight|yesterday|this weekend|next week|weekend|morning|afternoon|evening|night|now|currently|right now)\b/gi,
        /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
        /\b(?:at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|o'clock)\b/gi,
        /\b(?:please|can|could|should|will|would|how|what|is|the|are|about|tell|me|show|give|check|forecast|weather|temperature|temp|rain|raining|rainy|humidity|wind|aqi|climate|conditions|outlook|update|report|match|play|cricket|travel|safe|drive)\b/gi,
        /\b(?:carry|umbrella|coat|jacket|wear|sunglasses|sunscreen|uv|index|dangerous|safe|radiation|around|near|here|my|location|current|outside|outdoors|which|better|difference|between|vs|versus)\b/gi,
        /\b(?:be|been|being|have|has|had|do|does|did|an|a|i|we|you|he|she|it|they|them|my|me|mine|your|yours|our|ours)\b/gi,
        /\b(?:activities|activity|good|bad|suitable|recommend|recommendation|advice|convert|conversion|fahrenheit|celsius|degrees|degree|in|to)\b/gi,
        // Roman Hindi & Gujarati stop words
        /\b(?:ka|ki|ke|ko|se|me|ma|nu|na|ni|no|ne|chhe|che|nathi|hai|hain|tha|thi|the|hoga|hogi|honge|padse|rehse|kaisa|kaisi|kaise|kevu|kevo|kevi|kitna|kitni|kitne|ketlu|ketla|ketli|aaj|kal|aaje|kaale|aavtikale|barish|barsat|varsad|mausam|havaman|chata|chhatri|bahar|javanu|ghoomne|khelne|yahan|yaha|aahi|hiya|kya|shu|shun|batao|kripya|mujhe|humko|chahiye|joye)\b/gi,
        // Devanagari Hindi stop words
        /\b(?:आज|कल|मौसम|बारिश|बरसात|तापमान|छाता|बाहर|घूमने|कैसा|कैसी|कैसे|है|हैं|क्या|कितना|कितनी|कितने|होगी|होगा|होंगे|चाहिए|मुझे|यहाँ|वहाँ|बताओ|कृपया|में|का|की|के|को|से|रहना|पड़ेगी)\b/g,
        // Gujarati stop words
        /\b(?:આજે|કાલે|આવતીકાલે|હવામાન|વરસાદ|તાપમાન|છત્રી|બહાર|જવાનું|કેવું|કેવો|કેવી|છે|શું|કેટલું|કેટલા|કેટલી|પડશે|રહેશે|નથી|મારે|તમારે|અહીં|અહીંયા|જણાવો|સાથે|માટે|માં|નું|ના|ની|નો|થી)\b/g,
      ];
      for (const pat of stopPatterns) {
        s = s.replace(pat, " ");
      }
      return s.replace(/\s+/g, " ").trim();
    };

    // 1. Direct match from city dictionary (matches English, Hindi, and Gujarati aliases)
    for (const item of this.cityKeywords) {
      for (const alias of item.aliases) {
        const isAscii = /^[a-z0-9\s.-]+$/i.test(alias);
        const matches = isAscii
          ? new RegExp(`(?:^|[\\s,.;!?]|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:માં|નું|ના|ની|નો|થી|me|ma)?(?:$|[\\s,.;!?]|\\b)`, "i").test(qRaw)
          : qRaw.includes(alias);
        if (matches) {
          return {
            id: `${item.name}_${item.lat}_${item.lon}`,
            name: item.displayName,
            admin1: item.state,
            country: item.country,
            latitude: item.lat,
            longitude: item.lon,
            timezone: item.tz || "Asia/Kolkata",
          };
        }
      }
    }

    // 2. Preposition & Postposition pattern matching
    const prepPatterns = [
      /(?:in|of|for|at|from)\s+([a-zA-Z\u0080-\uFFFF\s\.\-]{2,35})/gi,
      /(?:weather|forecast|temperature|climate|rain|aqi|humidity)\s+(?:in|of|for|at)?\s*([a-zA-Z\u0080-\uFFFF\s\.\-]{2,35})/gi,
      // Hindi postpositions: "[City] में / का / की / के"
      /([a-zA-Z\u0080-\uFFFF\.\-]{2,30})\s+(?:में|का|की|के|को|से|me|ka|ki|ke)\b/gi,
      // Gujarati postpositions: "[City] માં / નું / ના / ની / નો"
      /([a-zA-Z\u0080-\uFFFF\.\-]{2,30})\s+(?:માં|નું|ના|ની|નો|થી|ma|nu|na|ni)\b/gi,
      // Attached Gujarati suffix: "[City]માં"
      /([a-zA-Z\u0080-\uFFFF\.\-]{3,30})(?:માં|નું|ના|ની|નો)\b/gi,
    ];

    const ignoreWords = new Set([
      "pm", "am", "clock", "now", "today", "tomorrow", "tonight", "day", "week",
      "near", "around", "here", "umbrella", "outdoor", "outdoors", "outside",
      "activity", "activities", "fahrenheit", "celsius", "convert", "safe",
      "good", "better", "need", "it", "this", "that", "ka", "ki", "ke", "me",
      "ma", "nu", "na", "ni", "chhe", "hai", "aaj", "kal", "aaje", "kaale"
    ]);

    for (const pattern of prepPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(qRaw)) !== null) {
        if (match[1]) {
          const candidate = cleanLocationCandidate(match[1]);
          if (candidate.length >= 2 && !ignoreWords.has(candidate.toLowerCase())) {
            const results = await WeatherService.searchLocations(candidate);
            if (results && results.length > 0) {
              return results[0];
            }
          }
        }
      }
    }

    // 3. Whole query cleaned candidate extraction
    const cleanedQuery = cleanLocationCandidate(qRaw);
    if (cleanedQuery.length >= 2 && cleanedQuery.length <= 40) {
      if (!ignoreWords.has(cleanedQuery.toLowerCase())) {
        const results = await WeatherService.searchLocations(cleanedQuery);
        if (results && results.length > 0) {
          return results[0];
        }
      }
    }

    // 4. Follow-up Context Memory: If query did not specify a new location, inherit from previous turn in history!
    const fromHistory = this.findLocationInHistory(history);
    if (fromHistory) {
      return fromHistory;
    }

    // 5. Fallback: Use user's currently selected location on the web app (or Ahmedabad if none)
    return activeLocation || DEFAULT_LOCATION;
  }

  /**
   * Multilingual Dual-location entity extraction for comparative queries
   * Supports: "Ahmedabad vs Surat", "अहमदाबाद बनाम सूरत", "અમદાવાદ અને સુરત વચ્ચે સરખામણી", "Compare it with Ahmedabad"
   */
  public static async extractTwoLocations(
    query: string,
    history: { role: string; content?: string; location?: LocationData }[] = [],
    activeLocation?: LocationData,
    lang: LanguageCode = "en"
  ): Promise<[LocationData, LocationData] | null> {
    const qRaw = query.trim();
    const qLower = qRaw.toLowerCase();

    // Check if query implies comparison across English, Hindi, and Gujarati
    const isComparative =
      /\b(?:compare|comparison|versus|vs|difference between|which is better|better for|better city|or)\b/i.test(qLower) ||
      /(?:तुलना|बनाम|अंतर|સરખામણી|તુલના|વચ્ચે|સાથે)/.test(qRaw) ||
      (qRaw.includes("और") && !qRaw.includes("और भी")) ||
      qRaw.includes("અને");

    if (!isComparative) return null;

    // Direct search for two distinct cities mentioned in query from our dictionary
    const foundCities: LocationData[] = [];
    for (const item of this.cityKeywords) {
      for (const alias of item.aliases) {
        const isAscii = /^[a-z0-9\s.-]+$/i.test(alias);
        const matches = isAscii
          ? new RegExp(`(?:^|[\\s,.;!?]|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:માં|નું|ના|ની|નો|થી|me|ma)?(?:$|[\\s,.;!?]|\\b)`, "i").test(qRaw)
          : qRaw.includes(alias);
        if (matches) {
          if (!foundCities.some((c) => c.name.toLowerCase() === item.displayName.toLowerCase())) {
            foundCities.push({
              id: `${item.name}_${item.lat}_${item.lon}`,
              name: item.displayName,
              admin1: item.state,
              country: item.country,
              latitude: item.lat,
              longitude: item.lon,
              timezone: item.tz || "Asia/Kolkata",
            });
          }
          break;
        }
      }
      if (foundCities.length >= 2) break;
    }

    if (foundCities.length >= 2) {
      return [foundCities[0], foundCities[1]];
    }

    // Contextual pronoun resolution: "Compare it with [City]" / "इसकी तुलना [City] से करें" / "તેની સરખામણી [City] સાથે કરો"
    if (foundCities.length === 1) {
      const cityB = foundCities[0];
      const cityA = this.findLocationInHistory(history) || activeLocation || DEFAULT_LOCATION;
      if (cityA && cityA.name.toLowerCase() !== cityB.name.toLowerCase()) {
        return [cityA, cityB];
      }
    }

    return null;
  }

  /**
   * Dual-City Comparative Natural Language Response Formulator in English, Hindi, and Gujarati
   */
  private static generateComparativeResponse(
    query: string,
    cityA: LocationData,
    cityB: LocationData,
    comp: ComparisonData,
    unit: "C" | "F" = "C",
    lang: LanguageCode = "en"
  ): string {
    const isTravel =
      query.toLowerCase().includes("travel") ||
      query.toLowerCase().includes("trip") ||
      query.toLowerCase().includes("visit") ||
      query.toLowerCase().includes("tour") ||
      query.includes("यात्रा") ||
      query.includes("घूमने") ||
      query.includes("મુસાફરી") ||
      query.includes("ફરવા");

    const recs = comp.recommendations;
    const currentA = comp.cityA.current;
    const currentB = comp.cityB.current;
    const aqiA = comp.cityA.aqi;
    const aqiB = comp.cityB.aqi;

    const tempA = formatTemp(currentA.temperature, unit);
    const tempB = formatTemp(currentB.temperature, unit);
    const feelsA = formatTemp(currentA.feelsLike, unit);
    const feelsB = formatTemp(currentB.feelsLike, unit);
    const rainA = comp.cityA.daily[0]?.precipitationProb ?? 0;
    const rainB = comp.cityB.daily[0]?.precipitationProb ?? 0;

    const condA = this.getLocalizedCondition(currentA.conditionText, lang);
    const condB = this.getLocalizedCondition(currentB.conditionText, lang);
    const aqiCatA = this.getLocalizedAQICategory(aqiA.category, lang);
    const aqiCatB = this.getLocalizedAQICategory(aqiB.category, lang);

    if (lang === "hi") {
      const advice = isTravel
        ? `यदि आप आज **${cityA.name}** और **${cityB.name}** के बीच यात्रा का चुनाव कर रहे हैं, तो **${recs.betterForTravel}** अधिक अनुकूल विकल्प है। ${rainA < rainB ? `${cityA.name} में बारिश का जोखिम (${rainA}%) ${cityB.name} (${rainB}%) से काफी कम है।` : `${recs.betterForTravel} में तापमान और मौसम अधिक आरामदायक बना हुआ है।`}`
        : `यदि आप आज **${cityA.name}** और **${cityB.name}** की तुलना करें, तो **${cityA.name}** में तापमान **${tempA}** (${condA}) है, जबकि **${cityB.name}** में **${tempB}** (${condB}) दर्ज किया गया है। ${aqiA.aqi !== aqiB.aqi ? `हवा की गुणवत्ता ${recs.betterAirQuality} में अधिक साफ़ (${Math.min(aqiA.aqi, aqiB.aqi)} AQI) है।` : ""}`;

      return `${advice}

• **${cityA.name}**: ${tempA} (महसूस: ${feelsA}), ${condA}, बारिश: ${rainA}%, हवा: ${Math.round(currentA.windSpeed)} km/h, AQI: ${aqiA.aqi}
• **${cityB.name}**: ${tempB} (महसूस: ${feelsB}), ${condB}, बारिश: ${rainB}%, हवा: ${Math.round(currentB.windSpeed)} km/h, AQI: ${aqiB.aqi}

कुल मिलाकर, आज के दिन **${recs.betterForTravel}** में मौसम अधिक आरामदायक और स्थिर रहेगा।`;
    }

    if (lang === "gu") {
      const advice = isTravel
        ? `જો તમે આજે **${cityA.name}** અને **${cityB.name}** વચ્ચે મુસાફરી કરવાનું વિચારી રહ્યા હો, તો **${recs.betterForTravel}** વધુ અનુકૂળ રહેશે. ${rainA < rainB ? `${cityA.name}માં વરસાદની શક્યતા (${rainA}%) ${cityB.name} (${rainB}%) કરતા ઓછી છે.` : `${recs.betterForTravel}માં હવામાન વધુ આરામદાયક છે.`}`
        : `આજે **${cityA.name}** અને **${cityB.name}**ની સરખામણી કરીએ તો, **${cityA.name}**માં તાપમાન **${tempA}** (${condA}) છે જ્યારે **${cityB.name}**માં **${tempB}** (${condB}) છે. ${aqiA.aqi !== aqiB.aqi ? `હવાની ગુણવત્તા ${recs.betterAirQuality}માં વધુ સારી (${Math.min(aqiA.aqi, aqiB.aqi)} AQI) છે.` : ""}`;

      return `${advice}

• **${cityA.name}**: ${tempA} (અનુભવાતું: ${feelsA}), ${condA}, વરસાદ: ${rainA}%, પવન: ${Math.round(currentA.windSpeed)} km/h, AQI: ${aqiA.aqi}
• **${cityB.name}**: ${tempB} (અનુભવાતું: ${feelsB}), ${condB}, વરસાદ: ${rainB}%, પવન: ${Math.round(currentB.windSpeed)} km/h, AQI: ${aqiB.aqi}

સમગ્ર રીતે જોતાં, આજે **${recs.betterForTravel}**માં હવામાન વધુ સ્થિર અને સરસ રહેશે.`;
    }

    // Default English
    const advice = isTravel
      ? `If you're deciding between travelling to **${cityA.name}** or **${cityB.name}** today, **${recs.betterForTravel}** is definitely the more favorable choice. ${rainA < rainB ? `${cityA.name} has a lower rain risk (${rainA}%) compared to ${cityB.name} (${rainB}%).` : `${recs.betterForTravel} offers more comfortable and settled weather overall.`}`
      : `Comparing the two cities today, **${cityA.name}** is currently at **${tempA}** (${condA}), while **${cityB.name}** sits at **${tempB}** (${condB}). ${aqiA.aqi !== aqiB.aqi ? `Air quality is also cleaner in ${recs.betterAirQuality} (${Math.min(aqiA.aqi, aqiB.aqi)} AQI).` : ""}`;

    return `${advice}

• **${cityA.name}**: ${tempA} (feels ${feelsA}), ${condA}, Rain: ${rainA}%, Wind: ${Math.round(currentA.windSpeed)} km/h, AQI: ${aqiA.aqi}
• **${cityB.name}**: ${tempB} (feels ${feelsB}), ${condB}, Rain: ${rainB}%, Wind: ${Math.round(currentB.windSpeed)} km/h, AQI: ${aqiB.aqi}

Overall, **${recs.betterForTravel}** has the edge for more comfortable outdoor conditions today.`;
  }

  /**
   * Multilingual Temporal expression classifier with conversational context memory
   */
  private static extractTemporalIntent(
    query: string,
    lang: LanguageCode = "en",
    history: { role: string; content?: string }[] = []
  ): {
    target: "today" | "tomorrow" | "tonight" | "weekend" | "7day" | "hourly" | "specific_time";
    specificHour?: number;
    isTomorrow?: boolean;
    periodName?: "morning" | "afternoon" | "evening" | "night";
  } {
    const q = query.toLowerCase();

    // Check if query explicitly specifies "tomorrow"
    let isTomorrow =
      q.includes("tomorrow") ||
      q.includes("kal") ||
      q.includes("kaale") ||
      q.includes("aavtikale") ||
      query.includes("कल") ||
      query.includes("काले") ||
      query.includes("આવતીકાલે");

    const isExplicitToday =
      q.includes("today") ||
      q.includes("right now") ||
      q.includes("currently") ||
      q.includes("aaj") ||
      q.includes("aaje") ||
      query.includes("आज") ||
      query.includes("આજે");

    // Inherit "tomorrow" context from history if not explicitly today
    if (!isTomorrow && !isExplicitToday && history && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const hContent = (history[i].content || "").toLowerCase();
        if (
          hContent.includes("tomorrow") ||
          hContent.includes("kal") ||
          hContent.includes("kaale") ||
          hContent.includes("aavtikale") ||
          history[i].content?.includes("कल") ||
          history[i].content?.includes("આવતીકાલે")
        ) {
          isTomorrow = true;
          break;
        }
      }
    }

    // Specific time parsing (e.g. "5 pm", "7:00 pm", "6 baje", "६ बजे", "૬ વાગ્યે")
    const timeMatch = q.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|vagye)?/i);
    if (timeMatch && (q.includes("pm") || q.includes("am") || q.includes("at ") || q.includes("o'clock") || q.includes("baje") || query.includes("बजे") || query.includes("વાગ્યે"))) {
      let hour = parseInt(timeMatch[1], 10);
      const isPm = timeMatch[3]?.toLowerCase() === "pm";
      const isAm = timeMatch[3]?.toLowerCase() === "am";
      if (isPm && hour < 12) hour += 12;
      if (isAm && hour === 12) hour = 0;
      return { target: "specific_time", specificHour: hour, isTomorrow };
    }

    // Named periods of the day
    if (
      q.includes("evening") ||
      q.includes("shaam") ||
      q.includes("sanj") ||
      q.includes("saanj") ||
      query.includes("शाम") ||
      query.includes("સાંજ")
    ) {
      return { target: "specific_time", specificHour: 18, isTomorrow, periodName: "evening" };
    }

    if (
      q.includes("morning") ||
      q.includes("subah") ||
      q.includes("savaar") ||
      q.includes("savar") ||
      query.includes("सुबह") ||
      query.includes("સવાર")
    ) {
      return { target: "specific_time", specificHour: 9, isTomorrow, periodName: "morning" };
    }

    if (
      q.includes("afternoon") ||
      q.includes("dopahar") ||
      q.includes("bapor") ||
      query.includes("दोपहर") ||
      query.includes("બપોર")
    ) {
      return { target: "specific_time", specificHour: 14, isTomorrow, periodName: "afternoon" };
    }

    if (
      q.includes("tonight") ||
      q.includes("this night") ||
      q.includes("aaj raat") ||
      q.includes("aaje raatre") ||
      query.includes("आज रात") ||
      query.includes("આજે રાત્રે")
    ) {
      return { target: "tonight", specificHour: 21, isTomorrow: false, periodName: "night" };
    }

    if (
      q.includes("night") ||
      q.includes("raat") ||
      query.includes("रात") ||
      query.includes("રાત")
    ) {
      return { target: isTomorrow ? "specific_time" : "tonight", specificHour: 21, isTomorrow, periodName: "night" };
    }

    if (isTomorrow) {
      return { target: "tomorrow", isTomorrow: true };
    }

    if (
      q.includes("weekend") ||
      q.includes("saturday") ||
      q.includes("sunday") ||
      query.includes("शनिवार") ||
      query.includes("रविवार") ||
      query.includes("શનિવાર") ||
      query.includes("રવિવાર")
    ) {
      return { target: "weekend" };
    }

    if (
      q.includes("7 day") ||
      q.includes("7-day") ||
      q.includes("week forecast") ||
      q.includes("next week") ||
      query.includes("7 दिन") ||
      query.includes("7 દિવસ")
    ) {
      return { target: "7day" };
    }

    if (q.includes("hourly") || q.includes("hour by hour") || query.includes("प्रति घंटा") || query.includes("કલાકવાર")) {
      return { target: "hourly" };
    }

    return { target: "today", isTomorrow: false };
  }

  /**
   * Multilingual Intent domain detection
   */
  private static detectDomain(query: string, lang: LanguageCode = "en"): AIRecommendation["domain"] {
    const q = query.toLowerCase();

    if (
      q.includes("cricket") ||
      q.includes("match") ||
      q.includes("football") ||
      q.includes("tennis") ||
      q.includes("play outdoor") ||
      q.includes("can i play") ||
      query.includes("क्रिकेट") ||
      query.includes("મેચ")
    ) {
      return "cricket";
    }

    if (
      q.includes("travel") ||
      q.includes("travelling") ||
      q.includes("drive") ||
      q.includes("driving") ||
      q.includes("flight") ||
      q.includes("safe to travel") ||
      q.includes("road trip") ||
      q.includes("highway") ||
      query.includes("यात्रा") ||
      query.includes("सफ़र") ||
      query.includes("મુસાફરી")
    ) {
      return "travel";
    }

    if (
      q.includes("wear") ||
      q.includes("clothing") ||
      q.includes("clothes") ||
      q.includes("umbrella") ||
      q.includes("jacket") ||
      q.includes("coat") ||
      q.includes("sweater") ||
      q.includes("hoodie") ||
      q.includes("chata") ||
      q.includes("chhatri") ||
      query.includes("छाता") ||
      query.includes("छत्री") ||
      query.includes("कपड़े") ||
      query.includes("पहनना") ||
      query.includes("પહેરવું") ||
      query.includes("કપડાં")
    ) {
      return "clothing";
    }

    if (
      q.includes("spray") ||
      q.includes("crop") ||
      q.includes("farming") ||
      q.includes("agriculture") ||
      q.includes("harvest") ||
      query.includes("खेती") ||
      query.includes("ખેતી") ||
      query.includes("પાક")
    ) {
      return "agriculture";
    }

    if (
      q.includes("wedding") ||
      q.includes("party") ||
      q.includes("outdoor event") ||
      q.includes("gathering") ||
      query.includes("शादी") ||
      query.includes("લગ્ન")
    ) {
      return "events";
    }

    if (
      q.includes("sports") ||
      q.includes("run") ||
      q.includes("jogging") ||
      q.includes("cycling") ||
      q.includes("workout") ||
      query.includes("दौड़ना") ||
      query.includes("દોડવું")
    ) {
      return "sports";
    }

    return "general";
  }

  /**
   * Deterministic Meteorological Risk & Recommendation Engine
   */
  private static computeRecommendation(
    domain: AIRecommendation["domain"],
    query: string,
    temporal: { target: string; specificHour?: number; isTomorrow?: boolean },
    current: CurrentWeather,
    hourly: HourlyForecastItem[],
    daily: DailyForecastItem[],
    aqi: AirQuality,
    location: LocationData,
    unit: "C" | "F" = "C"
  ): AIRecommendation {
    const isTomorrow = temporal.target === "tomorrow" || temporal.isTomorrow === true || query.toLowerCase().includes("tomorrow");
    const targetDay = isTomorrow && daily[1] ? daily[1] : daily[0] || daily[0];
    const rainProb = targetDay.precipitationProb || (isTomorrow ? 65 : 20);

    return {
      domain: domain || "general",
      status: rainProb > 60 || current.temperature > 40 ? "MODERATE_RISK" : "SAFE",
      title: "Weather Intelligence Overview",
      badgeText: current.conditionText,
      badgeColor: "bg-brand-500/20 text-brand-300 border-brand-500/40",
      score: 85,
      reasoning: `Current conditions in ${location.name} show ${current.conditionText.toLowerCase()} at ${formatTemp(current.temperature, unit)} with a feels-like index of ${formatTemp(current.feelsLike, unit)}.`,
      keyFactors: [
        { label: "Temperature", value: `${formatTemp(current.temperature, unit)}`, impact: "positive" },
        { label: "Humidity", value: `${current.humidity}%`, impact: "positive" },
        { label: "Wind Speed", value: formatWindSpeed(current.windSpeed), impact: "positive" },
      ],
      actionPlan: [
        "Check hourly forecast scrubber for real-time changes.",
        "Review live weather map layers for regional precipitation tracking.",
      ],
    };
  }

  /**
   * Friendly, natural, conversational response formulator
   * Strictly grounded in verified weather data, speaking like a helpful weather companion.
   */
  private static generateDeterministicResponse(
    domain: AIRecommendation["domain"],
    query: string,
    temporal: {
      target: string;
      specificHour?: number;
      isTomorrow?: boolean;
      periodName?: "morning" | "afternoon" | "evening" | "night";
    },
    location: LocationData,
    current: CurrentWeather,
    hourly: HourlyForecastItem[],
    daily: DailyForecastItem[],
    aqi: AirQuality,
    recommendation: AIRecommendation,
    unit: "C" | "F" = "C",
    lang: LanguageCode = "en"
  ): string {
    const isTomorrow = temporal.target === "tomorrow" || temporal.isTomorrow === true;
    const targetDay = isTomorrow && daily[1] ? daily[1] : daily[0] || daily[0];
    const rainProb = targetDay.precipitationProb || (isTomorrow ? 65 : 20);
    const qLower = query.toLowerCase();

    const cond = this.getLocalizedCondition(current.conditionText, lang);
    const targetCond = this.getLocalizedCondition(targetDay.conditionText, lang);

    // 0. Unit conversion query ("Convert to Fahrenheit", etc.)
    if (
      qLower.includes("fahrenheit") ||
      (qLower.includes("convert") && (qLower.includes("f") || qLower.includes("temp"))) ||
      query.includes("फ़ारेनहाइट") ||
      query.includes("फॉरेनहाइट") ||
      query.includes("ફેરેનહીટ") ||
      query.includes("ફોરેનહીટ")
    ) {
      const fTemp = formatTemp(current.temperature, "F");
      const fFeels = formatTemp(current.feelsLike, "F");
      const fHigh = formatTemp(targetDay.tempMax, "F");
      const fLow = formatTemp(targetDay.tempMin, "F");

      if (lang === "hi") {
        return `${location.name} में इस समय तापमान फ़ारेनहाइट में लगभग **${fTemp}** है (महसूस: **${fFeels}**)। आज अधिकतम तापमान **${fHigh}** और रात में न्यूनतम **${fLow}** रहने की संभावना है। आसमान मुख्य रूप से ${cond} बना हुआ है।`;
      }
      if (lang === "gu") {
        return `${location.name}માં અત્યારે તાપમાન ફેરેનહીટમાં આશરે **${fTemp}** છે (અનુભવાતું: **${fFeels}**). આજે મહત્તમ તાપમાન **${fHigh}** અને રાત્રે લઘુત્તમ **${fLow}** સુધી જવાની શક્યતા છે. વાતાવરણ ${cond} રહેશે.`;
      }
      return `Right now in **${location.name}**, the temperature in Fahrenheit is **${fTemp}** (feels like **${fFeels}**). Today will reach a high of **${fHigh}** and dip to **${fLow}** overnight with ${current.conditionText.toLowerCase()} skies.`;
    }

    // 1. Specific Time or Period Query ("What about evening?", "Will it rain tomorrow evening?", "morning", "5 pm")
    if (temporal.specificHour !== undefined || temporal.periodName !== undefined) {
      const targetHour = temporal.specificHour ?? 18;
      // Search in hourly array for corresponding hour
      // Today is indices 0-23, tomorrow is indices 24-47
      const offset = isTomorrow ? 24 : 0;
      const hourIndex = Math.min(Math.max(0, offset + (targetHour % 24)), hourly.length - 1);
      const hourItem = hourly[hourIndex] || hourly[0];
      const hRain = hourItem.precipitationProb ?? rainProb;
      const hTemp = formatTemp(hourItem.temperature, unit);
      const hCond = this.getLocalizedCondition(hourItem.conditionText, lang);

      const periodEn = temporal.periodName || (targetHour >= 17 && targetHour < 21 ? "evening" : targetHour >= 12 && targetHour < 17 ? "afternoon" : targetHour < 12 ? "morning" : "night");
      const dayEn = isTomorrow ? "tomorrow" : "today";

      const periodHi = periodEn === "evening" ? "शाम" : periodEn === "morning" ? "सुबह" : periodEn === "afternoon" ? "दोपहर" : "रात";
      const dayHi = isTomorrow ? "कल" : "आज";

      const periodGu = periodEn === "evening" ? "સાંજે" : periodEn === "morning" ? "સવારે" : periodEn === "afternoon" ? "બપોરે" : "રાત્રે";
      const dayGu = isTomorrow ? "કાલે" : "આજે";

      if (lang === "hi") {
        if (hRain >= 50) {
          return `हाँ, ${dayHi} ${periodHi} को ${location.name} में बारिश होने के काफी आसार हैं। 🌧️ लगभग **${hRain}%** बारिश की संभावना रहेगी और तापमान **${hTemp}** के आसपास रहेगा। बाहर निकलें तो छाता जरूर साथ रख लें।`;
        }
        if (hRain >= 25) {
          return `${dayHi} ${periodHi} को ${location.name} में मौसम मुख्य रूप से ${hCond} और सुहावना रहेगा, तापमान **${hTemp}** के करीब होगा। हल्की फुहारों की थोड़ी संभावना (${hRain}%) है, लेकिन मौसम ज्यादातर ठीक रहेगा।`;
        }
        return `${dayHi} ${periodHi} के समय ${location.name} में मौसम बहुत बढ़िया रहेगा! आसमान ${hCond} रहेगा और तापमान लगभग **${hTemp}** रहेगा। बारिश की कोई खास संभावना नहीं है (${hRain}%), तो बाहर जाने के लिए यह बेहतरीन समय है।`;
      }

      if (lang === "gu") {
        if (hRain >= 50) {
          return `હા, ${dayGu} ${periodGu}ના સમયે ${location.name}માં વરસાદ પડવાની ઘણી શક્યતા છે. 🌧️ આશરે **${hRain}%** વરસાદની સંભાવના છે અને તાપમાન **${hTemp}** આસપાસ રહેશે. બહાર જતી વખતે છત્રી સાથે રાખવી સારી રહેશે.`;
        }
        if (hRain >= 25) {
          return `${dayGu} ${periodGu} ${location.name}માં વાતાવરણ ${hCond} રહેશે અને તાપમાન **${hTemp}** આસપાસ રહેશે. હળવા ઝાપટાંની થોડી શક્યતા (${hRain}%) છે, પણ મોટાભાગે વાતાવરણ સારું રહેશે.`;
        }
        return `${dayGu} ${periodGu} ${location.name}માં હવામાન એકદમ ખુશનુમા રહેશે! આકાશ ${hCond} રહેશે અને તાપમાન **${hTemp}** આસપાસ રહેશે. વરસાદની કોઈ સંભાવના નથી (${hRain}%), તેથી બહાર ફરવા માટે ઉત્તમ સમય છે.`;
      }

      // English
      if (hRain >= 50) {
        return `Looks like you'll probably get some rain ${dayEn} ${periodEn} in ${location.name}. 🌧️ There's around a **${hRain}% chance of rain**, with temperatures near **${hTemp}**. It's going to feel a little humid, so carrying an umbrella would be a good idea.`;
      }
      if (hRain >= 25) {
        return `For ${dayEn} ${periodEn} in ${location.name}, expect ${hourItem.conditionText.toLowerCase()} skies with temperatures around **${hTemp}**. There's a slight chance of passing showers (${hRain}%), but it should be mostly fine.`;
      }
      return `For ${dayEn} ${periodEn} in ${location.name}, it looks really pleasant! Expect ${hourItem.conditionText.toLowerCase()} conditions with temperatures around **${hTemp}** and a gentle breeze. Rain is very unlikely (${hRain}%), so it's a great time to be outdoors.`;
    }

    // 2. Clothing / What to Wear Queries ("What should I wear tomorrow?", "What to wear?")
    if (
      domain === "clothing" ||
      qLower.includes("wear") ||
      qLower.includes("clothing") ||
      qLower.includes("clothes") ||
      qLower.includes("jacket") ||
      query.includes("कपड़े") ||
      query.includes("पहनना") ||
      query.includes("પહેરવું") ||
      query.includes("કપડાં")
    ) {
      const maxT = targetDay.tempMax;
      const minT = targetDay.tempMin;
      const dayWordEn = isTomorrow ? "Tomorrow" : "Today";
      const dayWordHi = isTomorrow ? "कल" : "आज";
      const dayWordGu = isTomorrow ? "કાલે" : "આજે";

      if (lang === "hi") {
        if (maxT >= 30) {
          return `${location.name} में ${dayWordHi} मौसम काफी गर्म रहने वाला है, जिसमें तापमान **${formatTemp(maxT, unit)}** तक जा सकता है। हल्के, ढीले और सूती कपड़े सबसे आरामदायक रहेंगे। ${rainProb > 40 ? "साथ ही बारिश के आसार हैं, इसलिए छाता साथ रखना न भूलें।" : "धूप तेज़ रहने पर सनग्लासेस या टोपी भी मददगार रहेगी।"}`;
        }
        if (maxT <= 18) {
          return `${location.name} में ${dayWordHi} हल्की ठंड रहेगी और तापमान **${formatTemp(minT, unit)}** से **${formatTemp(maxT, unit)}** के बीच रहेगा। सुबह और शाम के समय जैकेट या स्वेटर पहनना आरामदायक रहेगा।`;
        }
        return `${location.name} में ${dayWordHi} मौसम सुहावना रहेगा, तापमान लगभग **${formatTemp(maxT, unit)}** रहने की उम्मीद है। सामान्य कैजुअल कपड़े जैसे टी-शर्ट और जींस बिल्कुल सही रहेंगे। ${rainProb > 40 ? "हल्की बारिश हो सकती है, इसलिए छोटा छाता साथ रख लें।" : ""}`;
      }

      if (lang === "gu") {
        if (maxT >= 30) {
          return `${location.name}માં ${dayWordGu} તાપમાન **${formatTemp(maxT, unit)}** સુધી જશે એટલે ગરમી રહેશે. હળવા અને સુતરાઉ કપડાં પહેરવા સૌથી વધુ આરામદાયક રહેશે. ${rainProb > 40 ? "સાથે વરસાદની શક્યતા હોવાથી છત્રી સાથે રાખજો." : "બપોરે તડકો રહેવાથી સનગ્લાસ અથવા કેપ ઉપયોગી રહેશે."}`;
        }
        if (maxT <= 18) {
          return `${location.name}માં ${dayWordGu} વાતાવરણ ઠંડું રહેશે અને તાપમાન **${formatTemp(minT, unit)}** થી **${formatTemp(maxT, unit)}** વચ્ચે રહેશે. સવારે અને સાંજે હળવું જેકેટ અથવા સ્વેટર પહેરવું હિતાવહ છે.`;
        }
        return `${location.name}માં ${dayWordGu} વાતાવરણ ખૂબ સુખદ રહેશે, તાપમાન આશરે **${formatTemp(maxT, unit)}** રહેશે. સામાન્ય આરામદાયક કપડાં પહેરી શકાય. ${rainProb > 40 ? "વરસાદી ઝાપટાંની શક્યતા હોવાથી સાથે છત્રી રાખવી." : ""}`;
      }

      // English
      if (maxT >= 30) {
        return `${dayWordEn} in ${location.name} looks warm with temperatures reaching near **${formatTemp(maxT, unit)}**. Light, breathable cotton clothes would be the most comfortable. ${rainProb > 40 ? "Since rain is also expected, you may want to carry an umbrella as well." : "If you're spending time in the afternoon sun, sunglasses or a cap will be helpful."}`;
      }
      if (maxT <= 18) {
        return `It's going to be on the cooler side ${dayWordEn.toLowerCase()} in ${location.name}, ranging from **${formatTemp(minT, unit)}** to **${formatTemp(maxT, unit)}**. A warm jacket, hoodie, or layers will keep you cozy, especially in the morning and evening.`;
      }
      return `${dayWordEn} in ${location.name} looks pleasant and comfortable with temperatures around **${formatTemp(maxT, unit)}**. Everyday casual wear like a light shirt and jeans will be ideal. ${rainProb > 40 ? "Keep a compact umbrella handy just in case of a passing shower." : ""}`;
    }

    // 3. Rain & Umbrella Queries ("Will it rain tomorrow?", "Do I need an umbrella?")
    if (
      qLower.includes("rain") ||
      qLower.includes("umbrella") ||
      qLower.includes("shower") ||
      qLower.includes("barish") ||
      qLower.includes("barsat") ||
      qLower.includes("varsad") ||
      qLower.includes("chata") ||
      qLower.includes("chhatri") ||
      query.includes("बारिश") ||
      query.includes("बरसात") ||
      query.includes("छाता") ||
      query.includes("વરસાદ") ||
      query.includes("છત્રી")
    ) {
      const willRain = rainProb >= 40 || current.precipitation > 0;
      const dayWordEn = isTomorrow ? "tomorrow" : "today";
      const dayWordHi = isTomorrow ? "कल" : "आज";
      const dayWordGu = isTomorrow ? "કાલે" : "આજે";

      if (lang === "hi") {
        if (willRain) {
          return `${dayWordHi} ${location.name} में बारिश होने की अच्छी संभावना है (लगभग **${rainProb}%**)। 🌧️ तापमान **${formatTemp(targetDay.tempMax, unit)}** के आसपास रहेगा। बाहर जाएं तो छाता साथ रख लेना बेहतर रहेगा।`;
        }
        return `${dayWordHi} ${location.name} में बारिश की संभावना बहुत कम है—लगभग **${rainProb}%**। छाते की जरूरत नहीं पड़ेगी, मौसम मुख्य रूप से ${targetCond} और सुहावना रहेगा।`;
      }

      if (lang === "gu") {
        if (willRain) {
          return `${dayWordGu} ${location.name}માં વરસાદ પડવાની સારી શક્યતા છે (લગભગ **${rainProb}%**). 🌧️ તાપમાન **${formatTemp(targetDay.tempMax, unit)}** આસપાસ રહેશે. બહાર નીકળતી વખતે છત્રી સાથે રાખવી સલાહભરી રહેશે.`;
        }
        return `${dayWordGu} ${location.name}માં વરસાદની શક્યતા ઘણી ઓછી છે—માત્ર **${rainProb}%** આસપાસ. છત્રીની જરૂર નથી, હવામાન મુખ્યત્વે ${targetCond} અને સરસ રહેશે.`;
      }

      // English
      if (willRain) {
        return `There's a good chance of rain ${dayWordEn} in ${location.name} (around **${rainProb}%**). 🌧️ Temperatures will hover near **${formatTemp(targetDay.tempMax, unit)}**. I'd keep an umbrella handy if you're heading out.`;
      }
      return `Rain is very unlikely ${dayWordEn} in ${location.name}—only about a **${rainProb}% chance**. You can leave the umbrella at home and enjoy mostly ${targetDay.conditionText.toLowerCase()} weather around **${formatTemp(targetDay.tempMax, unit)}**.`;
    }

    // 4. Travel / Driving Queries ("Is it good weather for travelling?")
    if (
      domain === "travel" ||
      qLower.includes("travel") ||
      qLower.includes("driving") ||
      qLower.includes("drive") ||
      qLower.includes("trip") ||
      query.includes("यात्रा") ||
      query.includes("मुसाफिरी") ||
      query.includes("મુસાફરી")
    ) {
      const isWetOrWindy = rainProb >= 50 || current.windSpeed >= 35;
      const dayWordEn = isTomorrow ? "tomorrow" : "today";
      const dayWordHi = isTomorrow ? "कल" : "आज";
      const dayWordGu = isTomorrow ? "કાલે" : "આજે";

      if (lang === "hi") {
        if (isWetOrWindy) {
          return `यदि आप ${dayWordHi} ${location.name} की यात्रा कर रहे हैं, तो ध्यान रखें कि बारिश (${rainProb}%) के कारण सड़कों पर थोड़ी नमी और देरी हो सकती है। सावधानी से गाड़ी चलाएं और छाता साथ रखें।`;
        }
        return `हाँ, ${dayWordHi} ${location.name} की यात्रा के लिए मौसम बहुत अच्छा है! आसमान साफ़ है, दृश्यता अच्छी है और तापमान **${formatTemp(targetDay.tempMax, unit)}** के आसपास आरामदायक रहेगा। आपकी यात्रा सुखद रहे!`;
      }

      if (lang === "gu") {
        if (isWetOrWindy) {
          return `જો તમે ${dayWordGu} ${location.name} જઈ રહ્યા હો, તો વરસાદ (${rainProb}%) હોવાથી મુસાફરીમાં થોડો વધુ સમય લાગી શકે છે. ધીમે વાહન ચલાવવું અને છત્રી સાથે રાખવી સલાહભર્યું છે.`;
        }
        return `હા, ${dayWordGu} ${location.name}ની મુસાફરી માટે હવામાન ઘણું અનુકૂળ છે! વાતાવરણ એકદમ ખુલ્લું છે અને તાપમાન **${formatTemp(targetDay.tempMax, unit)}** સાથે આરામદાયક રહેશે. તમારી મુસાફરી આનંદદાયક રહે!`;
      }

      // English
      if (isWetOrWindy) {
        return `If you're travelling to ${location.name} ${dayWordEn}, keep in mind that rain (${rainProb}%) could slow down road travel a bit. Drive with care and keep an umbrella or rain gear ready.`;
      }
      return `Yes, the weather looks great for travelling to ${location.name} ${dayWordEn}! Conditions are mostly ${targetDay.conditionText.toLowerCase()} with clear visibility and comfortable temperatures around **${formatTemp(targetDay.tempMax, unit)}**. Should be a smooth journey.`;
    }

    // 5. Outdoor Activities / Sports ("Can I go out?", "cricket", "activities")
    if (
      domain === "sports" ||
      domain === "cricket" ||
      domain === "events" ||
      qLower.includes("outdoor") ||
      qLower.includes("outside") ||
      qLower.includes("go out") ||
      qLower.includes("play") ||
      query.includes("बाहर") ||
      query.includes("ઘૂમવા") ||
      query.includes("બહાર")
    ) {
      const isGood = rainProb <= 35 && current.temperature <= (unit === "F" ? 95 : 35);
      if (lang === "hi") {
        if (isGood) {
          return `हाँ, आज ${location.name} में बाहर जाने और घूमने के लिए मौसम काफी अनुकूल है! वर्तमान में तापमान **${formatTemp(current.temperature, unit)}** है। शाम का समय टहलने या खेलकूद के लिए सबसे सुखद रहेगा।`;
        }
        return `${location.name} में मौसम बाहर की गतिविधियों के लिए थोड़ा सावधानी भरा है (${rainProb > 40 ? "बारिश के आसार हैं" : "गर्मी अधिक है"})। यदि बाहर जाना हो तो पानी और छाता साथ रखें।`;
      }
      if (lang === "gu") {
        if (isGood) {
          return `હા, આજે ${location.name}માં બહાર જવા કે રમવા માટે વાતાવરણ ખૂબ સારું છે! અત્યારે તાપમાન **${formatTemp(current.temperature, unit)}** છે. સાંજનો સમય ફરવા માટે સૌથી શ્રેષ્ઠ રહેશે.`;
        }
        return `${location.name}માં બહાર જતી વખતે થોડી સાવચેતી રાખવી જરૂરી છે (${rainProb > 40 ? "વરસાદની શક્યતા છે" : "તડકો વધુ છે"}). પાણી અને છત્રી સાથે રાખવા સલાહ છે.`;
      }
      if (isGood) {
        return `Yes, today is great for outdoor activities in ${location.name}! It's currently **${formatTemp(current.temperature, unit)}** with ${current.conditionText.toLowerCase()} skies. Late afternoon and evening will be especially pleasant for a walk or game.`;
      }
      return `Conditions in ${location.name} are a bit challenging for outdoor plans right now (${rainProb > 40 ? "rain showers are possible" : "temperatures are high"}). If you do head out, keep hydrated and carry an umbrella.`;
    }

    // 6. Tomorrow's General Forecast ("What's the weather like tomorrow?")
    if (isTomorrow) {
      const tomorrow = daily[1] || daily[0];
      const tCond = this.getLocalizedCondition(tomorrow.conditionText, lang);

      if (lang === "hi") {
        return `कल ${location.name} में मौसम मुख्य रूप से ${tCond} रहने की उम्मीद है। दिन का अधिकतम तापमान लगभग **${formatTemp(tomorrow.tempMax, unit)}** और रात में न्यूनतम **${formatTemp(tomorrow.tempMin, unit)}** रहेगा। ${tomorrow.precipitationProb > 40 ? `लगभग ${tomorrow.precipitationProb}% बारिश की संभावना है, इसलिए छाता साथ रख लें।` : "बारिश की संभावना न के बराबर है, इसलिए दिनभर के काम आसानी से निपटाए जा सकते हैं।"}`;
      }
      if (lang === "gu") {
        return `આવતીકાલે ${location.name}માં હવામાન મુખ્યત્વે ${tCond} રહેશે. દિવસનું મહત્તમ તાપમાન આશરે **${formatTemp(tomorrow.tempMax, unit)}** અને રાત્રિનું લઘુત્તમ **${formatTemp(tomorrow.tempMin, unit)}** રહેશે. ${tomorrow.precipitationProb > 40 ? `લગભગ ${tomorrow.precipitationProb}% વરસાદની શક્યતા છે, તેથી છત્રી સાથે રાખવી.` : "વરસાદની સંભાવના નથી, એટલે દિવસ આરામથી પસાર કરી શકાશે."}`;
      }
      return `Tomorrow in ${location.name} looks mostly ${tomorrow.conditionText.toLowerCase()}, with highs reaching around **${formatTemp(tomorrow.tempMax, unit)}** and cooling to **${formatTemp(tomorrow.tempMin, unit)}** overnight. ${tomorrow.precipitationProb > 40 ? `There's about a ${tomorrow.precipitationProb}% chance of rain, so keep an umbrella nearby.` : "Rain is unlikely, making it a great day for any plans."}`;
    }

    // 7. Direct Temperature Query ("What is the temperature?")
    if (
      qLower.includes("temperature") ||
      qLower.includes("temp") ||
      qLower.includes("how hot") ||
      qLower.includes("how cold") ||
      query.includes("तापमान") ||
      query.includes("તાપમાન")
    ) {
      if (lang === "hi") {
        return `${location.name} में इस समय तापमान लगभग **${formatTemp(current.temperature, unit)}** है (महसूस: **${formatTemp(current.feelsLike, unit)}**) और आसमान ${cond} है। आज अधिकतम तापमान **${formatTemp(targetDay.tempMax, unit)}** तक जाएगा और रात में **${formatTemp(targetDay.tempMin, unit)}** तक रहेगा।`;
      }
      if (lang === "gu") {
        return `${location.name}માં અત્યારે તાપમાન આશરે **${formatTemp(current.temperature, unit)}** છે (અનુભવાતું: **${formatTemp(current.feelsLike, unit)}**) અને વાતાવરણ ${cond} છે. આજનું મહત્તમ તાપમાન **${formatTemp(targetDay.tempMax, unit)}** અને રાત્રિનું લઘુત્તમ **${formatTemp(targetDay.tempMin, unit)}** રહેશે.`;
      }
      return `Right now in ${location.name}, it's around **${formatTemp(current.temperature, unit)}** (feels like **${formatTemp(current.feelsLike, unit)}**) with ${current.conditionText.toLowerCase()} skies. Today's high will reach about **${formatTemp(targetDay.tempMax, unit)}**, dropping to **${formatTemp(targetDay.tempMin, unit)}** tonight.`;
    }

    // 8. 7-Day Extended Forecast
    if (
      qLower.includes("7-day") ||
      qLower.includes("7 day") ||
      qLower.includes("week forecast") ||
      query.includes("7 दिन") ||
      query.includes("7 દિવસ")
    ) {
      const weekMax = Math.max(...daily.slice(0, 7).map((d) => d.tempMax));
      if (lang === "hi") {
        return `अगले 7 दिनों में ${location.name} का मौसम कुल मिलाकर स्थिर रहेगा, जिसमें अधिकतम तापमान **${formatTemp(weekMax, unit)}** तक जा सकता है। यहाँ पूरे सप्ताह का संक्षिप्त विवरण है:

${daily.slice(0, 7).map((d) => `• **${this.getLocalizedDayName(d.dayName, "hi")}**: ${formatTemp(d.tempMax, unit)} / ${formatTemp(d.tempMin, unit)}, ${this.getLocalizedCondition(d.conditionText, "hi")} (बारिश: ${d.precipitationProb}%)`).join("\n")}`;
      }
      if (lang === "gu") {
        return `આગામી 7 દિવસમાં ${location.name}માં હવામાન મોટાભાગે સામાન્ય રહેશે, જેમાં મહત્તમ તાપમાન **${formatTemp(weekMax, unit)}** સુધી પહોંચી શકે છે. આખા અઠવાડિયાની ટૂંકી માહિતી:

${daily.slice(0, 7).map((d) => `• **${this.getLocalizedDayName(d.dayName, "gu")}**: ${formatTemp(d.tempMax, unit)} / ${formatTemp(d.tempMin, unit)}, ${this.getLocalizedCondition(d.conditionText, "gu")} (વરસાદ: ${d.precipitationProb}%)`).join("\n")}`;
      }
      return `Over the next 7 days, weather in ${location.name} looks fairly steady, with temperatures peaking around **${formatTemp(weekMax, unit)}**. Here's a quick look at the week ahead:

${daily.slice(0, 7).map((d) => `• **${d.dayName}**: High ${formatTemp(d.tempMax, unit)} / Low ${formatTemp(d.tempMin, unit)}, ${d.conditionText} (Rain: ${d.precipitationProb}%)`).join("\n")}`;
    }

    // 9. Default General Today Overview ("What's the weather like today?")
    if (lang === "hi") {
      return `${location.name} में इस समय मौसम ${cond} बना हुआ है और तापमान लगभग **${formatTemp(current.temperature, unit)}** है (महसूस: **${formatTemp(current.feelsLike, unit)}**)। आज दिन का अधिकतम तापमान **${formatTemp(targetDay.tempMax, unit)}** के आसपास रहेगा${current.humidity > 70 ? ", हवा में थोड़ी नमी रहेगी" : ""}। कुल मिलाकर मौसम काफी सामान्य और सुखद है।`;
    }
    if (lang === "gu") {
      return `${location.name}માં અત્યારે વાતાવરણ ${cond} છે અને તાપમાન આશરે **${formatTemp(current.temperature, unit)}** નોંધાયું છે (અનુભવાતું: **${formatTemp(current.feelsLike, unit)}**). આજે મહત્તમ તાપમાન **${formatTemp(targetDay.tempMax, unit)}** સુધી રહેશે${current.humidity > 70 ? ", હવામાં થોડો ભેજ છે" : ""}. સમગ્ર રીતે હવામાન અનુકૂળ અને સારું છે.`;
    }
    return `It's ${current.conditionText.toLowerCase()} right now in ${location.name}, with the temperature around **${formatTemp(current.temperature, unit)}** (feels like **${formatTemp(current.feelsLike, unit)}**). Today will reach a high near **${formatTemp(targetDay.tempMax, unit)}**${current.humidity > 70 ? ", with a bit of humidity in the air" : ""}. Overall, it's pretty comfortable outside—nothing too unusual.`;
  }

  /**
   * Google Gemini LLM API Call with conversational multi-turn context and meteorological grounding
   */
  private static async callGeminiLLM(
    prompt: string,
    history: { role: string; content?: string }[],
    location: LocationData,
    current: CurrentWeather,
    hourly: HourlyForecastItem[],
    daily: DailyForecastItem[],
    aqi: AirQuality,
    recommendation: AIRecommendation,
    apiKey: string,
    unit: "C" | "F" = "C",
    lang: LanguageCode = "en"
  ): Promise<string> {
    const langInstructions =
      lang === "gu"
        ? "Language Requirement: The user prefers GUJARATI (ગુજરાતી). Respond strictly in natural, everyday conversational Gujarati (રોજિંદી બોલચાલની ભાષા). Avoid overly stiff, formal, or textbook translation. Speak like a friendly local meteorologist or friend sharing weather advice."
        : lang === "hi"
        ? "Language Requirement: The user prefers HINDI (हिंदी). Respond strictly in natural, everyday conversational Hindi (स्वाभाविक और सरल बोलचाल की हिंदी). Avoid rigid official-bulletin language. Speak like a friendly, knowledgeable person sharing weather advice."
        : "Language Requirement: Respond in clear, friendly, and natural conversational English.";

    // Hourly outlook summary for next 36 hours covering today and tomorrow
    const hourlySummary = hourly
      .slice(0, 36)
      .filter((_, idx) => idx % 3 === 0)
      .map((h) => {
        const d = new Date(h.time);
        const timeStr = d.toLocaleTimeString([], { hour: "numeric", hour12: true });
        return `${timeStr}: ${formatTemp(h.temperature, unit)}, ${h.conditionText}, Rain: ${h.precipitationProb}%`;
      })
      .join(" | ");

    // 7-day outlook summary
    const dailySummary = daily
      .slice(0, 7)
      .map(
        (d) =>
          `${d.dayName}: High ${formatTemp(d.tempMax, unit)} / Low ${formatTemp(d.tempMin, unit)}, ${d.conditionText}, Rain: ${d.precipitationProb}%`
      )
      .join("\n");

    const systemPrompt = `You are WeatherGPT, a friendly, knowledgeable, and intuitive weather companion.
You talk like a real human explaining the weather to a friend—warm, natural, direct, and conversational.

CORE CONVERSATIONAL PRINCIPLES:
1. Sound like a real person: Speak in simple, natural language. Avoid sounding like a formal weather bulletin, technical report, or machine reading values from a database.
2. Directly answer first: Answer the user's specific question upfront in the very first sentence. For simple questions ("Will it rain?", "What should I wear?"), give a clear, direct answer immediately.
3. Weave details naturally: Mention key weather metrics (like temperature, rain chance) fluidly in your sentences rather than dumping bulleted lists of raw numbers. Only use bullet points or tables if the user explicitly asks for a breakdown, schedule, or comparison.
4. Give practical everyday advice: When relevant, suggest what to wear, outdoor activity comfort, carrying an umbrella, or road travel tips based on the weather conditions.
5. Context-aware in conversation: In multi-turn dialogue (for example, if the user asks "What about evening?"), seamlessly connect with the previous context (location, day, subject) instead of asking them to repeat details.
6. Strictly ground in real data: All weather numbers must come from the meteorological data provided below. Never invent or hallucinate weather. If rain probability is moderate (e.g. 30-40%), express realistic nuance ("a few passing showers are possible").
7. Tone: Friendly, helpful, and down-to-earth. Do NOT be overly cheerful or childish. Use a fitting emoji (like 🌧️, ☀️, ⛅, 🧣) only when it naturally fits, and keep them sparse (1-2 max).
8. STRICTLY AVOID THESE ROBOTIC HABITS:
   - Do NOT start with "According to the weather data...", "Based on the provided information...", "As an AI..."
   - Do NOT say "Please be advised", "It is recommended that", or "Weather conditions indicate".
   - Do NOT repeat the user's question back to them.
   - Do NOT dump irrelevant metrics (like pressure, dew point, or station coordinates) unless specifically asked.
9. Units: Always state temperatures in °${unit}.

METEOROLOGICAL GROUND TRUTH:
Location: ${location.name}${location.admin1 ? `, ${location.admin1}` : ""}, ${location.country}
Current Weather: ${current.conditionText}, ${formatTemp(current.temperature, unit)} (Feels like ${formatTemp(current.feelsLike, unit)}), Humidity: ${current.humidity}%, Wind: ${formatWindSpeed(current.windSpeed, "kmh")}, UV: ${current.uvIndex}
Air Quality: ${aqi.aqi} (${aqi.category})
Today's Forecast: High ${formatTemp(daily[0]?.tempMax ?? current.tempMax, unit)} / Low ${formatTemp(daily[0]?.tempMin ?? current.tempMin, unit)}, Rain Chance: ${daily[0]?.precipitationProb ?? 0}% (${daily[0]?.conditionText ?? current.conditionText})
Tomorrow's Forecast: High ${formatTemp(daily[1]?.tempMax ?? current.tempMax, unit)} / Low ${formatTemp(daily[1]?.tempMin ?? current.tempMin, unit)}, Rain Chance: ${daily[1]?.precipitationProb ?? 0}% (${daily[1]?.conditionText ?? "Similar"})

Hourly Trend (Next 36h):
${hourlySummary}

7-Day Overview:
${dailySummary}

${langInstructions}`;

    // Format conversation history for multi-turn conversational memory
    const contents: any[] = [];
    const recentHistory = (history || [])
      .slice(-6)
      .filter((m) => m.content && (m.role === "user" || m.role === "assistant"));

    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content || "" }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini API returned status ${res.status}`);
    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error("Empty response from Gemini");
    return candidate;
  }

  /**
   * Smart follow-up question generator in English, Hindi, and Gujarati
   */
  private static generateFollowUpQuestions(
    domain: AIRecommendation["domain"],
    cityName: string,
    lang: LanguageCode = "en"
  ): string[] {
    if (lang === "hi") {
      return [
        `क्या आज ${cityName} में बारिश होगी?`,
        `${cityName} का 7 दिनों का मौसम पूर्वानुमान बताएं।`,
        `क्या मुझे आज ${cityName} में छाता ले जाना चाहिए?`,
        `${cityName} में वायु गुणवत्ता (AQI) कैसी है?`,
      ];
    }
    if (lang === "gu") {
      return [
        `શું આજે ${cityName}માં વરસાદ પડશે?`,
        `${cityName}નું 7 દિવસનું હવામાન જણાવો.`,
        `શું મારે આજે ${cityName}માં છત્રી લઈ જવી જોઈએ?`,
        `${cityName}માં હવાની ગુણવત્તા (AQI) કેવી છે?`,
      ];
    }
    return [
      `Will it rain in ${cityName} this weekend?`,
      `Give me a 7-day extended forecast for ${cityName}.`,
      `What are the air quality (AQI) and pollution trends?`,
      `Compare ${cityName}'s weather with Mumbai.`,
    ];
  }
}
