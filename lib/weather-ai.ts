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
    const temporalIntent = this.extractTemporalIntent(trimmed, lang);
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
          extractedLocation,
          current,
          hourly.slice(0, 12),
          daily.slice(0, 7),
          aqi,
          recommendation,
          options.userApiKey || process.env.GEMINI_API_KEY!,
          unit,
          lang
        );
      } catch (err) {
        console.warn("Gemini API call failed, using deterministic multilingual engine:", err);
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
      let verdict = "";
      if (isTravel) {
        verdict = `### ✈️ यात्रा सलाह: **${recs.betterForTravel}** चुनें\n\nआज यात्रा के लिए **${recs.betterForTravel}** अधिक अनुकूल है, क्योंकि ${
          rainA < rainB
            ? `यहाँ बारिश का जोखिम काफी कम है (${rainA}% बनाम ${rainB}%)`
            : currentA.temperature < currentB.temperature
            ? `यहाँ का तापमान अधिक आरामदायक है (${tempA} बनाम ${tempB})`
            : `यहाँ मौसम की समग्र स्थिति अधिक स्थिर है`
        }।`;
      } else {
        verdict = `### ⚖️ मौसम की तुलना: **${cityA.name} बनाम ${cityB.name}**\n\n* 🏆 **यात्रा और आउटडोर गतिविधियों के लिए श्रेष्ठ:** **${recs.betterForTravel}**\n* 🍃 **अधिक स्वच्छ वायु गुणवत्ता (AQI):** **${recs.betterAirQuality}** (${aqiA.aqi < aqiB.aqi ? aqiA.aqi : aqiB.aqi} AQI)\n* ❄️ **ठंडा गंतव्य:** **${recs.coolerClimate}** (${recs.coolerClimate === cityA.name ? tempA : tempB})`;
      }

      return `${verdict}

**तुलनात्मक तालिका:**

| पैरामीटर | ${cityA.name} | ${cityB.name} | टिप्पणी |
| :--- | :--- | :--- | :--- |
| 🌡️ **तापमान** | **${tempA}** (महसूस: ${feelsA}) | **${tempB}** (महसूस: ${feelsB}) | ${recs.coolerClimate} अधिक ठंडा है |
| 🌧️ **बारिश की संभावना** | **${rainA}%** (${condA}) | **${rainB}%** (${condB}) | ${rainA <= rainB ? cityA.name : cityB.name} में बारिश का जोखिम कम है |
| 💧 **आर्द्रता (नमी)** | ${currentA.humidity}% | ${currentB.humidity}% | ${currentA.humidity < currentB.humidity ? cityA.name : cityB.name} में नमी कम है |
| 💨 **हवा की गति** | ${Math.round(currentA.windSpeed)} km/h | ${Math.round(currentB.windSpeed)} km/h | ${Math.abs(currentA.windSpeed - currentB.windSpeed).toFixed(1)} km/h का अंतर |
| ☀️ **UV इंडेक्स** | ${currentA.uvIndex} | ${currentB.uvIndex} | ${currentA.uvIndex > 6 || currentB.uvIndex > 6 ? "उच्च UV" : "मध्यम"} |
| 🍃 **वायु गुणवत्ता (AQI)** | ${aqiA.aqi} (${aqiCatA}) | ${aqiB.aqi} (${aqiCatB}) | ${recs.betterAirQuality} में स्वच्छ हवा है |

> 💡 **मौसम विशेषज्ञ की राय:** ${recs.betterForTravel} आज के लिए बेहतर विकल्प है।`;
    }

    if (lang === "gu") {
      let verdict = "";
      if (isTravel) {
        verdict = `### ✈️ મુસાફરી સલાહ: **${recs.betterForTravel}** પસંદ કરો\n\nઆજે મુસાફરી માટે **${recs.betterForTravel}** વધુ અનુકૂળ છે, કારણ કે ${
          rainA < rainB
            ? `ત્યાં વરસાદનું જોખમ ઘણું ઓછું છે (${rainA}% સામે ${rainB}%)`
            : currentA.temperature < currentB.temperature
            ? `ત્યાં તાપમાન વધુ આરામદાયક છે (${tempA} સામે ${tempB})`
            : `ત્યાં સમગ્ર હવામાન વધુ સ્થિર છે`
        }.`;
      } else {
        verdict = `### ⚖️ હવામાન સરખામણી: **${cityA.name} અને ${cityB.name}**\n\n* 🏆 **મુસાફરી અને બહારની પ્રવૃત્તિઓ માટે શ્રેષ્ઠ:** **${recs.betterForTravel}**\n* 🍃 **વધુ સ્વચ્છ હવા (AQI):** **${recs.betterAirQuality}** (${aqiA.aqi < aqiB.aqi ? aqiA.aqi : aqiB.aqi} AQI)\n* ❄️ **વધુ ઠંડું સ્થળ:** **${recs.coolerClimate}** (${recs.coolerClimate === cityA.name ? tempA : tempB})`;
      }

      return `${verdict}

**સરખામણી કોષ્ટક:**

| પરિમાણ | ${cityA.name} | ${cityB.name} | તારણ / નોંધ |
| :--- | :--- | :--- | :--- |
| 🌡️ **તાપમાન** | **${tempA}** (અનુભવાતું: ${feelsA}) | **${tempB}** (અનુભવાતું: ${feelsB}) | ${recs.coolerClimate} વધુ ઠંડું છે |
| 🌧️ **વરસાદની શક્યતા** | **${rainA}%** (${condA}) | **${rainB}%** (${condB}) | ${rainA <= rainB ? cityA.name : cityB.name}માં વરસાદનું જોખમ ઓછું છે |
| 💧 **ભેજ** | ${currentA.humidity}% | ${currentB.humidity}% | ${currentA.humidity < currentB.humidity ? cityA.name : cityB.name}માં ભેજ ઓછો છે |
| 💨 **પવનની ઝડપ** | ${Math.round(currentA.windSpeed)} km/h | ${Math.round(currentB.windSpeed)} km/h | ${Math.abs(currentA.windSpeed - currentB.windSpeed).toFixed(1)} km/h તફાવત |
| ☀️ **UV ઇન્ડેક્સ** | ${currentA.uvIndex} | ${currentB.uvIndex} | ${currentA.uvIndex > 6 || currentB.uvIndex > 6 ? "વધુ UV" : "મધ્યમ"} |
| 🍃 **હવાની ગુણવત્તા (AQI)** | ${aqiA.aqi} (${aqiCatA}) | ${aqiB.aqi} (${aqiCatB}) | ${recs.betterAirQuality}માં વધુ સારી હવા છે |

> 💡 **હવામાન નિષ્ણાતનો અભિપ્રાય:** ${recs.betterForTravel} આજ માટે વધુ અનુકૂળ પસંદગી છે.`;
    }

    // Default English
    let verdict = "";
    if (isTravel) {
      verdict = `### ✈️ Travel Recommendation: Choose **${recs.betterForTravel}**\n\nFor travelling today, **${recs.betterForTravel}** is the more favorable choice due to ${
        rainA < rainB
          ? `significantly lower rain risk (${rainA}% vs ${rainB}%)`
          : currentA.temperature < currentB.temperature
          ? `more comfortable ambient temperatures (${tempA} vs ${tempB})`
          : `more stable overall weather conditions`
      }.`;
    } else {
      verdict = `### ⚖️ Meteorological Comparison: **${cityA.name} vs ${cityB.name}**\n\n* 🏆 **Best for Travel / Outdoor Activities:** **${recs.betterForTravel}**\n* 🍃 **Cleaner Air (AQI):** **${recs.betterAirQuality}** (${aqiA.aqi < aqiB.aqi ? aqiA.aqi : aqiB.aqi} AQI)\n* ❄️ **Cooler Destination:** **${recs.coolerClimate}** (${recs.coolerClimate === cityA.name ? tempA : tempB})`;
    }

    return `${verdict}

**Side-by-Side Comparison Matrix:**

| Parameter | ${cityA.name} | ${cityB.name} | Advantage / Note |
| :--- | :--- | :--- | :--- |
| 🌡️ **Temperature** | **${tempA}** (Feels ${feelsA}) | **${tempB}** (Feels ${feelsB}) | ${recs.coolerClimate} is cooler |
| 🌧️ **Rain Probability** | **${rainA}%** (${condA}) | **${rainB}%** (${condB}) | ${rainA <= rainB ? cityA.name : cityB.name} has lower rain risk |
| 💧 **Humidity** | ${currentA.humidity}% | ${currentB.humidity}% | ${currentA.humidity < currentB.humidity ? cityA.name : cityB.name} is less humid |
| 💨 **Wind Speed** | ${Math.round(currentA.windSpeed)} km/h | ${Math.round(currentB.windSpeed)} km/h | ${Math.abs(currentA.windSpeed - currentB.windSpeed).toFixed(1)} km/h difference |
| ☀️ **UV Index** | ${currentA.uvIndex} | ${currentB.uvIndex} | ${currentA.uvIndex > 6 || currentB.uvIndex > 6 ? "High UV" : "Moderate"} |
| 🍃 **Air Quality (AQI)** | ${aqiA.aqi} (${aqiCatA}) | ${aqiB.aqi} (${aqiCatB}) | ${recs.betterAirQuality} has cleaner air |

> 💡 **Meteorologist Verdict:** ${comp.verdict}`;
  }

  /**
   * Multilingual Temporal expression classifier
   */
  private static extractTemporalIntent(
    query: string,
    lang: LanguageCode = "en"
  ): {
    target: "today" | "tomorrow" | "tonight" | "weekend" | "7day" | "hourly" | "specific_time";
    specificHour?: number;
  } {
    const q = query.toLowerCase();

    // Specific time parsing (e.g. "5 pm", "7:00 pm", "6 baje", "६ बजे", "૬ વાગ્યે")
    const timeMatch = q.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|vagye)?/i);
    if (timeMatch && (q.includes("pm") || q.includes("am") || q.includes("at ") || q.includes("o'clock") || q.includes("baje") || query.includes("बजे") || query.includes("વાગ્યે"))) {
      let hour = parseInt(timeMatch[1], 10);
      const isPm = timeMatch[3]?.toLowerCase() === "pm";
      const isAm = timeMatch[3]?.toLowerCase() === "am";
      if (isPm && hour < 12) hour += 12;
      if (isAm && hour === 12) hour = 0;
      return { target: "specific_time", specificHour: hour };
    }

    if (
      q.includes("tomorrow") ||
      q.includes("kal") ||
      q.includes("kaale") ||
      q.includes("aavtikale") ||
      query.includes("कल") ||
      query.includes("काले") ||
      query.includes("આવતીકાલે")
    ) {
      return { target: "tomorrow" };
    }

    if (
      q.includes("tonight") ||
      q.includes("this night") ||
      q.includes("aaj raat") ||
      q.includes("aaje raatre") ||
      query.includes("आज रात") ||
      query.includes("આજે રાત્રે")
    ) {
      return { target: "tonight" };
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

    return { target: "today" };
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
      q.includes("drive") ||
      q.includes("flight") ||
      q.includes("safe to travel") ||
      q.includes("road trip") ||
      q.includes("highway") ||
      query.includes("यात्रा") ||
      query.includes("મુસાફરી")
    ) {
      return "travel";
    }

    if (
      q.includes("wear") ||
      q.includes("clothing") ||
      q.includes("umbrella") ||
      q.includes("jacket") ||
      q.includes("coat") ||
      q.includes("chata") ||
      q.includes("chhatri") ||
      query.includes("छाता") ||
      query.includes("છત્રી")
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
    temporal: { target: string; specificHour?: number },
    current: CurrentWeather,
    hourly: HourlyForecastItem[],
    daily: DailyForecastItem[],
    aqi: AirQuality,
    location: LocationData,
    unit: "C" | "F" = "C"
  ): AIRecommendation {
    const isTomorrow = temporal.target === "tomorrow" || query.toLowerCase().includes("tomorrow");
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
   * Multilingual Natural Language Response Formulator
   * Strictly formats in English, Hindi, or Gujarati based on detected language
   */
  private static generateDeterministicResponse(
    domain: AIRecommendation["domain"],
    query: string,
    temporal: { target: string; specificHour?: number },
    location: LocationData,
    current: CurrentWeather,
    hourly: HourlyForecastItem[],
    daily: DailyForecastItem[],
    aqi: AirQuality,
    recommendation: AIRecommendation,
    unit: "C" | "F" = "C",
    lang: LanguageCode = "en"
  ): string {
    const isTomorrow = temporal.target === "tomorrow";
    const targetDay = isTomorrow && daily[1] ? daily[1] : daily[0] || daily[0];
    const rainProb = targetDay.precipitationProb || (isTomorrow ? 65 : 20);
    const qLower = query.toLowerCase();

    const cond = this.getLocalizedCondition(current.conditionText, lang);
    const aqiCat = this.getLocalizedAQICategory(aqi.category, lang);

    // 0. Unit conversion query (e.g. "Convert the temperature to Fahrenheit", "फ़ारेनहाइट में तापमान", "તાપમાન ફેરેનહીટમાં")
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
        return `### 🌡️ ${location.name} में तापमान (फ़ारेनहाइट)

**${location.name}** में वर्तमान तापमान फ़ारेनहाइट में परिवर्तित करने पर **${fTemp}** है (महसूस होने वाला तापमान: **${fFeels}**)।

* 🔺 **आज का अधिकतम:** **${fHigh}**
* 🔻 **रात का न्यूनतम:** **${fLow}**
* 💧 **आर्द्रता (नमी):** ${current.humidity}%
* 💨 **हवा की गति:** ${formatWindSpeed(current.windSpeed)} (झोंके: ${formatWindSpeed(current.windGusts)})

वर्तमान वायुमंडलीय स्थिति **${cond}** है।`;
      }

      if (lang === "gu") {
        return `### 🌡️ ${location.name}માં તાપમાન (ફેરેનહીટ)

**${location.name}**માં હાલનું તાપમાન ફેરેનહીટમાં રૂપાંતરિત કરતા **${fTemp}** છે (અનુભવાતું તાપમાન: **${fFeels}**).

* 🔺 **આજનું મહત્તમ:** **${fHigh}**
* 🔻 **રાત્રિનું લઘુત્તમ:** **${fLow}**
* 💧 **ભેજ:** ${current.humidity}%
* 💨 **પવનની ઝડપ:** ${formatWindSpeed(current.windSpeed)} (ઝોંકા: ${formatWindSpeed(current.windGusts)})

હાલની વાતાવરણીય સ્થિતિ **${cond}** છે.`;
      }

      return `### 🌡️ Temperature in ${location.name} (Fahrenheit)

In **${location.name}**, the current temperature converted to Fahrenheit is **${fTemp}** (feels like **${fFeels}**).

* 🔺 **Today's High:** **${fHigh}**
* 🔻 **Overnight Low:** **${fLow}**
* 💧 **Relative Humidity:** ${current.humidity}%
* 💨 **Wind Speed:** ${formatWindSpeed(current.windSpeed)} with gusts up to ${formatWindSpeed(current.windGusts)}

Current atmospheric conditions are **${current.conditionText.toLowerCase()}**.`;
    }

    // 0b. Outdoor activities query
    if (
      qLower.includes("outdoor") ||
      qLower.includes("outside") ||
      qLower.includes("go out") ||
      qLower.includes("activities") ||
      qLower.includes("bahar") ||
      qLower.includes("javanu") ||
      qLower.includes("ghoomne") ||
      query.includes("बाहर") ||
      query.includes("घूमने") ||
      query.includes("બહાર") ||
      query.includes("જવાનું")
    ) {
      const isGood = rainProb <= 35 && current.temperature <= (unit === "F" ? 95 : 35) && current.temperature >= (unit === "F" ? 50 : 10) && aqi.aqi <= 150;

      if (lang === "hi") {
        return `### ☀️ बाहरी गतिविधियों (आउटडोर) के लिए सलाह: ${location.name}

${isGood ? `✅ **हाँ, आज बाहरी गतिविधियों के लिए मौसम अनुकूल है!** **${location.name}** में मौसम सुखद है।` : `⚠️ **बाहरी गतिविधियों के लिए सावधानी बरतें।** **${location.name}** में मौसम पूरी तरह अनुकूल नहीं है।`}

* 🕒 **सर्वोत्तम समय:** शाम 5:00 बजे से 7:30 बजे तक (सुहावना मौसम)
* 🌡️ **तापमान:** ${formatTemp(current.temperature, unit)} (महसूस: ${formatTemp(current.feelsLike, unit)})
* 🌧️ **बारिश की संभावना:** **${rainProb}%** (${rainProb > 40 ? "हल्की फुहारों की संभावना" : "सूखा मौसम"})
* ☀️ **UV इंडेक्स:** ${current.uvIndex} (${current.uvIndex >= 6 ? "उच्च — सनस्क्रीन लगाएं" : "मध्यम"})
* 🍃 **वायु गुणवत्ता:** ${aqi.aqi} AQI (${aqiCat})

${isGood ? "टहलने, जॉगिंग, साइकिल चलाने या घूमने के लिए मौसम बहुत बढ़िया है।" : "यदि बाहर जाना आवश्यक हो तो छाता और पानी साथ रखें।"}`;
      }

      if (lang === "gu") {
        return `### ☀️ બહારની પ્રવૃત્તિઓ માટે હવામાન સલાહ: ${location.name}

${isGood ? `✅ **હા, આજે બહાર જવા માટે હવામાન અનુકૂળ છે!** **${location.name}**માં વાતાવરણ સારું છે.` : `⚠️ **બહારની પ્રવૃત્તિઓ માટે સાવચેતી રાખવી જરૂરી છે.** **${location.name}**માં હવામાન સંપૂર્ણ અનુકૂળ નથી.`}

* 🕒 **શ્રેષ્ઠ સમય:** સાંજે 5:00 થી 7:30 વાગ્યા સુધી (સુખદ ઠંડક)
* 🌡️ **તાપમાન:** ${formatTemp(current.temperature, unit)} (અનુભવાતું: ${formatTemp(current.feelsLike, unit)})
* 🌧️ **વરસાદની શક્યતા:** **${rainProb}%** (${rainProb > 40 ? "વરસાદી ઝાપટાંની શક્યતા" : "સૂકું વાતાવરણ"})
* ☀️ **UV ઇન્ડેક્સ:** ${current.uvIndex} (${current.uvIndex >= 6 ? "વધુ — સનસ્ક્રીન લગાવો" : "મધ્યમ"})
* 🍃 **હવાની ગુણવત્તા:** ${aqi.aqi} AQI (${aqiCat})

${isGood ? "ચાલવા, જોગિંગ, સાયકલિંગ અથવા ફરવા જવા માટે શ્રેષ્ઠ વાતાવરણ છે." : "જો બહાર જવું જરૂરી હોય તો છત્રી અને પીવાનું પાણી સાથે રાખવું."}`;
      }

      const isGoodEn = rainProb <= 35 && current.temperature <= (unit === "F" ? 95 : 35) && current.temperature >= (unit === "F" ? 50 : 10) && aqi.aqi <= 150;
      return `### ☀️ Outdoor Activity Recommendation: ${location.name}

${isGoodEn ? `✅ **YES, conditions are favorable for outdoor activities!** Weather in **${location.name}** is pleasant.` : `⚠️ **Exercise caution for outdoor activities.** Weather in **${location.name}** is sub-optimal.`}

* 🕒 **Recommended Window:** 5:00 PM – 7:30 PM (cooler temperatures & pleasant breeze)
* 🌡️ **Temperature:** ${formatTemp(current.temperature, unit)} (Feels like ${formatTemp(current.feelsLike, unit)})
* 🌧️ **Precipitation Probability:** **${rainProb}%** (${rainProb > 40 ? "Passing showers possible" : "Dry conditions"})
* ☀️ **UV Index:** ${current.uvIndex} (${current.uvIndex >= 6 ? "High — Wear sunscreen" : "Moderate"})
* 🍃 **Air Quality:** ${aqi.aqi} AQI (${aqi.category})

${isGoodEn ? "Great conditions for walking, jogging, cycling, or casual travel." : "Keep hydration and rain gear handy if you need to be outdoors."}`;
    }

    // 1. Rain & Umbrella Query (e.g. "Will it rain today?", "आज बारिश होगी?", "શું વરસાદ પડશે?")
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

      if (lang === "hi") {
        return `### 🌧️ बारिश और छाता पूर्वानुमान: ${location.name}

${willRain ? `☔ **हाँ, छाता साथ रखें!** आज ${location.name} में बारिश की संभावना **${rainProb}%** है।` : `☀️ **छाते की आवश्यकता नहीं है।** ${location.name} में बारिश की संभावना बहुत कम (**${rainProb}%**) है।`}

* 🌡️ **तापमान:** ${formatTemp(targetDay.tempMax, unit)} (न्यूनतम: ${formatTemp(targetDay.tempMin, unit)})
* 🌧️ **बारिश की संभावना:** **${rainProb}%** (${cond})
* 💧 **आर्द्रता (नमी):** ${current.humidity}%
* 💨 **हवा की गति:** ${targetDay.windSpeedMax} km/h

> 💡 **मौसम सलाह:** ${
          rainProb > 60
            ? "आज शाम बारिश होने की संभावना है। छाता साथ रखना अच्छा रहेगा।"
            : rainProb > 30
            ? "दोपहर या शाम के समय हल्की फुहारें संभव हैं। छोटा छाता साथ रखना सुरक्षित रहेगा।"
            : "मौसम मुख्यतः सूखा रहेगा और बारिश का जोखिम नहीं है।"
        }`;
      }

      if (lang === "gu") {
        return `### 🌧️ વરસાદ અને છત્રીની આગાહી: ${location.name}

${willRain ? `☔ **હા, છત્રી સાથે રાખવી સારી રહેશે!** આજે ${location.name}માં વરસાદની શક્યતા **${rainProb}%** છે.` : `☀️ **છત્રીની જરૂર નથી.** ${location.name}માં વરસાદની શક્યતા ઘણી ઓછી (**${rainProb}%**) છે.`}

* 🌡️ **તાપમાન:** ${formatTemp(targetDay.tempMax, unit)} (લઘુત્તમ: ${formatTemp(targetDay.tempMin, unit)})
* 🌧️ **વરસાદની શક્યતા:** **${rainProb}%** (${cond})
* 💧 **ભેજ:** ${current.humidity}%
* 💨 **પવનની ઝડપ:** ${targetDay.windSpeedMax} km/h

> 💡 **હવામાન સલાહ:** ${
          rainProb > 60
            ? "આજે સાંજે વરસાદ પડવાની શક્યતા છે. છત્રી સાથે રાખવી સારી રહેશે."
            : rainProb > 30
            ? "સાંજના સમયે હળવા ઝાપટાં પડી શકે છે. નાની છત્રી સાથે રાખવી હિતાવહ છે."
            : "વાતાવરણ મુખ્યત્વે સૂકું રહેશે અને વરસાદની સંભાવના નહિવત છે."
        }`;
      }

      // English
      return `### 🌧️ Rain & Umbrella Forecast: ${location.name}

${willRain ? `☔ **YES, carry an umbrella!** There is a **${rainProb}% chance of rain** ${isTomorrow ? "tomorrow" : "today"} in ${location.name}.` : `☀️ **NO umbrella needed.** Rain probability is low (**${rainProb}%**) in ${location.name}.`}

* 🌡️ **Temperature:** ${formatTemp(targetDay.tempMax, unit)} (Low: ${formatTemp(targetDay.tempMin, unit)})
* 🌧️ **Rain Probability:** **${rainProb}%** (${targetDay.conditionText})
* 💧 **Current Humidity:** ${current.humidity}%
* ☁️ **Cloud Cover:** ${current.cloudCover}%
* 💨 **Wind:** ${targetDay.windSpeedMax} km/h

> 💡 **Precipitation Outlook:** ${
        rainProb > 60
          ? "It looks likely to rain this evening. Carrying an umbrella would be a good idea."
          : rainProb > 30
          ? "Passing showers possible during evening or afternoon intervals. Keeping a compact umbrella is a good precaution."
          : "Predominantly dry conditions with negligible rain risk."
      }`;
    }

    // 2. Tomorrow's Forecast (e.g. "What's the weather tomorrow in Jetpur?", "કાલે જેતપુરમાં હવામાન કેવું રહેશે?")
    if (isTomorrow) {
      const tomorrow = daily[1] || daily[0];
      const tCond = this.getLocalizedCondition(tomorrow.conditionText, lang);

      if (lang === "hi") {
        return `### 📅 कल का मौसम पूर्वानुमान: ${location.name}

कल **${location.name}** में **${tCond}** रहने की संभावना है, जिसमें अधिकतम तापमान **${formatTemp(tomorrow.tempMax, unit)}** और न्यूनतम तापमान **${formatTemp(tomorrow.tempMin, unit)}** रहेगा।

* 🌡️ **तापमान सीमा:** अधिकतम **${formatTemp(tomorrow.tempMax, unit)}** / न्यूनतम **${formatTemp(tomorrow.tempMin, unit)}**
* 🌧️ **बारिश की संभावना:** **${tomorrow.precipitationProb}%** (${tomorrow.precipitationProb > 40 ? "बारिश की फुहारें संभव" : "मुख्यतः सूखा"})
* 💨 **हवा के झोंके:** ${tomorrow.windSpeedMax} km/h
* 🍃 **वायु गुणवत्ता अनुमान:** ${aqiCat} श्रेणी (~${aqi.aqi} AQI)

समग्र वायुमंडलीय स्थिति आपके दैनिक कार्यों के लिए अनुकूल रहने की उम्मीद है।`;
      }

      if (lang === "gu") {
        return `### 📅 કાલના હવામાનની આગાહી: ${location.name}

આવતીકાલે **${location.name}**માં **${tCond}** વાતાવરણ રહેવાની શક્યતા છે, જેમાં મહત્તમ તાપમાન **${formatTemp(tomorrow.tempMax, unit)}** અને લઘુત્તમ તાપમાન **${formatTemp(tomorrow.tempMin, unit)}** રહેશે.

* 🌡️ **તાપમાન:** મહત્તમ **${formatTemp(tomorrow.tempMax, unit)}** / લઘુત્તમ **${formatTemp(tomorrow.tempMin, unit)}**
* 🌧️ **વરસાદની શક્યતા:** **${tomorrow.precipitationProb}%** (${tomorrow.precipitationProb > 40 ? "વરસાદી ઝાપટાંની શક્યતા" : "મુખ્યત્વે સૂકું"})
* 💨 **પવનની ઝડપ:** ${tomorrow.windSpeedMax} km/h
* 🍃 **હવાની ગુણવત્તા:** ${aqiCat} શ્રેણી (~${aqi.aqi} AQI)

તમારી દૈનિક યોજનાઓ માટે વાતાવરણ અનુકૂળ રહેવાની ધારણા છે.`;
      }

      return `### 📅 Tomorrow's Weather Forecast for ${location.name}

Tomorrow in **${location.name}**, expect **${tomorrow.conditionText}** with temperatures reaching a high of **${formatTemp(tomorrow.tempMax, unit)}** and an overnight low of **${formatTemp(tomorrow.tempMin, unit)}**.

* 🌡️ **Temperature Range:** High of **${formatTemp(tomorrow.tempMax, unit)}** / Low of **${formatTemp(tomorrow.tempMin, unit)}**
* 🌧️ **Precipitation Likelihood:** **${tomorrow.precipitationProb}%** (${tomorrow.precipitationProb > 40 ? "Rain showers likely" : "Mostly dry"})
* 💨 **Peak Wind Gusts:** ${tomorrow.windSpeedMax} km/h
* 🍃 **Air Quality Forecast:** ${aqi.category} category (~${aqi.aqi} AQI)

Overall atmospheric conditions remain stable for your daily plans.`;
    }

    // 3. Direct Temperature Query (e.g. "What is the temperature in Jetpur?", "રાજકોટમાં તાપમાન કેટલું છે?")
    if (
      qLower.includes("temperature") ||
      qLower.includes("temp") ||
      qLower.includes("how hot") ||
      qLower.includes("how cold") ||
      qLower.includes("tapman") ||
      query.includes("तापमान") ||
      query.includes("तापीय") ||
      query.includes("તાપમાન")
    ) {
      if (lang === "hi") {
        return `### 🌡️ ${location.name} में तापमान

**${location.name}** में वर्तमान तापमान **${formatTemp(current.temperature, unit)}** है (महसूस होने वाला तापमान: **${formatTemp(current.feelsLike, unit)}**)।

* 🔺 **आज का अधिकतम तापमान:** **${formatTemp(targetDay.tempMax, unit)}**
* 🔻 **रात का न्यूनतम तापमान:** **${formatTemp(targetDay.tempMin, unit)}**
* 💧 **आर्द्रता (नमी):** ${current.humidity}% | ओस बिंदु: ${formatTemp(current.dewPoint, unit)}
* 💨 **हवा की गति:** ${formatWindSpeed(current.windSpeed)} (झोंके: ${formatWindSpeed(current.windGusts)})

वर्तमान मौसम की स्थिति **${cond}** है।`;
      }

      if (lang === "gu") {
        return `### 🌡️ ${location.name}માં તાપમાન

**${location.name}**માં હાલનું તાપમાન **${formatTemp(current.temperature, unit)}** છે (અનુભવાતું તાપમાન: **${formatTemp(current.feelsLike, unit)}**).

* 🔺 **આજનું મહત્તમ તાપમાન:** **${formatTemp(targetDay.tempMax, unit)}**
* 🔻 **રાત્રિનું લઘુત્તમ તાપમાન:** **${formatTemp(targetDay.tempMin, unit)}**
* 💧 **ભેજ:** ${current.humidity}% | ડ્યૂ પોઈન્ટ: ${formatTemp(current.dewPoint, unit)}
* 💨 **પવનની ઝડપ:** ${formatWindSpeed(current.windSpeed)} (ઝોંકા: ${formatWindSpeed(current.windGusts)})

હાલની વાતાવરણીય સ્થિતિ **${cond}** છે.`;
      }

      return `### 🌡️ Temperature in ${location.name}

The current temperature in **${location.name}** is **${formatTemp(current.temperature, unit)}** (feels like **${formatTemp(current.feelsLike, unit)}**).

* 🔺 **Today's High:** **${formatTemp(targetDay.tempMax, unit)}**
* 🔻 **Overnight Low:** **${formatTemp(targetDay.tempMin, unit)}**
* 💧 **Relative Humidity:** ${current.humidity}% | Dew Point: ${formatTemp(current.dewPoint, unit)}
* 💨 **Wind Speed:** ${formatWindSpeed(current.windSpeed)} with gusts up to ${formatWindSpeed(current.windGusts)}

Current atmospheric conditions are **${current.conditionText.toLowerCase()}**.`;
    }

    // 4. 7-Day Extended Forecast
    if (
      qLower.includes("7-day") ||
      qLower.includes("7 day") ||
      qLower.includes("week forecast") ||
      query.includes("7 दिन") ||
      query.includes("7 દિવસ")
    ) {
      if (lang === "hi") {
        return `### 📅 ${location.name} का 7 दिनों का मौसम पूर्वानुमान

**${location.name}** के लिए आगामी 7 दिनों का मौसम परिदृश्य:

| दिन | तारीख | मौसम | अधिकतम / न्यूनतम | बारिश % |
| :--- | :--- | :--- | :--- | :--- |
${daily.slice(0, 7).map((d) => `| **${this.getLocalizedDayName(d.dayName, "hi")}** | ${d.date.slice(5)} | ${this.getLocalizedCondition(d.conditionText, "hi")} | **${formatTemp(d.tempMax, unit)}** / ${formatTemp(d.tempMin, unit)} | 🌧️ ${d.precipitationProb}% |`).join("\n")}

> 📈 **साप्ताहिक रुझान:** अधिकतम तापमान ${formatTemp(Math.max(...daily.slice(0, 7).map((d) => d.tempMax)), unit)} तक जाने की संभावना है।`;
      }

      if (lang === "gu") {
        return `### 📅 ${location.name}નું 7 દિવસનું હવામાન

**${location.name}** માટે આગામી 7 દિવસનું હવામાન પૂર્વાનુમાન:

| વાર | તારીખ | વાતાવરણ | મહત્તમ / લઘુત્તમ | વરસાદ % |
| :--- | :--- | :--- | :--- | :--- |
${daily.slice(0, 7).map((d) => `| **${this.getLocalizedDayName(d.dayName, "gu")}** | ${d.date.slice(5)} | ${this.getLocalizedCondition(d.conditionText, "gu")} | **${formatTemp(d.tempMax, unit)}** / ${formatTemp(d.tempMin, unit)} | 🌧️ ${d.precipitationProb}% |`).join("\n")}

> 📈 **સાપ્તાહિક પ્રવાહ:** મહત્તમ તાપમાન ${formatTemp(Math.max(...daily.slice(0, 7).map((d) => d.tempMax)), unit)} સુધી પહોંચી શકે છે.`;
      }

      return `### 📅 7-Day Extended Forecast for ${location.name}

Here is the projected meteorological outlook for **${location.name}** over the next 7 days:

| Day | Date | Condition | High / Low | Rain % |
| :--- | :--- | :--- | :--- | :--- |
${daily.slice(0, 7).map((d) => `| **${d.dayName}** | ${d.date.slice(5)} | ${d.conditionText} | **${formatTemp(d.tempMax, unit)}** / ${formatTemp(d.tempMin, unit)} | 🌧️ ${d.precipitationProb}% |`).join("\n")}

> 📈 **Week Trend:** Temperatures will peak at ${formatTemp(Math.max(...daily.slice(0, 7).map((d) => d.tempMax)), unit)}.`;
    }

    // 5. Default Rich Meteorological Overview
    if (lang === "hi") {
      return `### ☀️ ${location.name} में आज का मौसम

**${location.name}** में वर्तमान में मौसम **${cond}** है और तापमान **${formatTemp(current.temperature, unit)}** (महसूस: **${formatTemp(current.feelsLike, unit)}**) बना हुआ है।

* 🔺 **आज का अधिकतम तापमान:** **${formatTemp(targetDay.tempMax, unit)}** / **न्यूनतम:** **${formatTemp(targetDay.tempMin, unit)}**
* 💧 **आर्द्रता (नमी):** ${current.humidity}% | ओस बिंदु: ${formatTemp(current.dewPoint, unit)}
* 💨 **हवा की गति:** ${formatWindSpeed(current.windSpeed)} (झोंके: ${formatWindSpeed(current.windGusts)})
* ☀️ **UV इंडेक्स:** ${current.uvIndex} (${current.uvIndex > 6 ? "उच्च — सनस्क्रीन का उपयोग करें" : "मध्यम"})
* 🍃 **वायु गुणवत्ता:** ${aqi.aqi} AQI — **${aqiCat}** (PM2.5: ${aqi.pm25} µg/m³)

आज दिनभर मौसम स्थिर और अनुकूल रहने की उम्मीद है।`;
    }

    if (lang === "gu") {
      return `### ☀️ ${location.name}માં આજનું હવામાન

હાલમાં **${location.name}**માં વાતાવરણ **${cond}** છે અને તાપમાન **${formatTemp(current.temperature, unit)}** (અનુભવાતું તાપમાન: **${formatTemp(current.feelsLike, unit)}**) નોંધાયું છે.

* 🔺 **આજનું મહત્તમ તાપમાન:** **${formatTemp(targetDay.tempMax, unit)}** / **લઘુત્તમ:** **${formatTemp(targetDay.tempMin, unit)}**
* 💧 **ભેજ:** ${current.humidity}% | ડ્યૂ પોઈન્ટ: ${formatTemp(current.dewPoint, unit)}
* 💨 **પવનની ઝડપ:** ${formatWindSpeed(current.windSpeed)} (ઝોંકા: ${formatWindSpeed(current.windGusts)})
* ☀️ **UV ઇન્ડેક્સ:** ${current.uvIndex} (${current.uvIndex > 6 ? "વધુ — સનસ્ક્રીન વાપરવાની સલાહ" : "મધ્યમ"})
* 🍃 **હવાની ગુણવત્તા:** ${aqi.aqi} AQI — **${aqiCat}** (PM2.5: ${aqi.pm25} µg/m³)

દિવસ દરમિયાન હવામાન સ્થિર અને સુખદ રહેશે.`;
    }

    // Default English
    return `### ☀️ Weather in ${location.name}

In **${location.name}**, conditions are currently **${current.conditionText}** with a temperature of **${formatTemp(current.temperature, unit)}** (feels like **${formatTemp(current.feelsLike, unit)}**).

* 🔺 **Today's High:** **${formatTemp(targetDay.tempMax, unit)}** / **Low:** **${formatTemp(targetDay.tempMin, unit)}**
* 💧 **Relative Humidity:** ${current.humidity}% | Dew point: ${formatTemp(current.dewPoint, unit)}
* 💨 **Wind:** ${formatWindSpeed(current.windSpeed)} with gusts up to ${formatWindSpeed(current.windGusts)}
* ☀️ **UV Index:** ${current.uvIndex} (${current.uvIndex > 6 ? "High — Sunscreen recommended" : "Moderate"})
* 🍃 **Air Quality:** ${aqi.aqi} AQI — **${aqi.category}** (PM2.5: ${aqi.pm25} µg/m³)

Atmospheric conditions are steady and comfortable throughout the day.`;
  }

  /**
   * Google Gemini LLM API Call with multilingual weather grounding
   */
  private static async callGeminiLLM(
    prompt: string,
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
        ? "Language Requirement: The user requested Gujarati. You MUST respond strictly in authentic GUJARATI (ગુજરાતી લિપિ). Use natural Gujarati weather terms (તાપમાન, વરસાદ, ભેજ, પવનની ઝડપ, છત્રી, સ્વચ્છ આકાશ)."
        : lang === "hi"
        ? "Language Requirement: The user requested Hindi. You MUST respond strictly in authentic HINDI (देवनागरी लिपि). Use natural Hindi weather terms (तापमान, बारिश, आर्द्रता, हवा की गति, छाता, साफ़ मौसम)."
        : "Language Requirement: Respond in clear, professional English.";

    const systemPrompt = `You are WeatherGPT, an advanced multilingual conversational AI for weather forecasting, alerts, and climate intelligence.
${langInstructions}
You have access to real-time, verified meteorological data:
Location: ${location.name}, ${[location.admin2, location.admin1, location.country].filter(Boolean).join(", ")}
Current Weather: Temp ${formatTemp(current.temperature, unit)} (Feels like ${formatTemp(current.feelsLike, unit)}), Condition: ${current.conditionText}, Humidity: ${current.humidity}%, Wind: ${current.windSpeed} km/h (Gusts: ${current.windGusts} km/h), UV: ${current.uvIndex}, Pressure: ${current.pressure} hPa, Visibility: ${current.visibility.toFixed(1)} km.
Air Quality: ${aqi.aqi} (${aqi.category}, PM2.5: ${aqi.pm25} µg/m³).
Forecast Summary: Today High ${formatTemp(daily[0]?.tempMax || current.tempMax, unit)}/Low ${formatTemp(daily[0]?.tempMin || current.tempMin, unit)} (Rain: ${daily[0]?.precipitationProb}%), Tomorrow High ${formatTemp(daily[1]?.tempMax || current.tempMax, unit)}/Low ${formatTemp(daily[1]?.tempMin || current.tempMin, unit)} (Rain: ${daily[1]?.precipitationProb}%).
Domain Analysis: ${recommendation.title} — Status: ${recommendation.status}, Score: ${recommendation.score}/100.
User Temperature Preference: °${unit} (Always state temperatures in °${unit}).

Rules:
1. Ground your answer strictly in the provided real weather metrics. Never invent weather.
2. Be conversational, crisp, helpful, and structured with markdown headings and bullet points.
3. If weather data is unavailable, clearly state so in the target language.
4. Always format temperatures in °${unit}.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
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
