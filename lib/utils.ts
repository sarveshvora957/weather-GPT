import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// WMO Weather interpretation codes (WW)
export function getWeatherCondition(code: number): {
  text: string;
  icon: string;
  emoji: string;
  category: 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunderstorm' | 'fog';
} {
  switch (code) {
    case 0:
      return { text: "Clear Sky", icon: "Sun", emoji: "☀️", category: "clear" };
    case 1:
      return { text: "Mainly Clear", icon: "SunDim", emoji: "🌤️", category: "clear" };
    case 2:
      return { text: "Partly Cloudy", icon: "CloudSun", emoji: "⛅", category: "cloudy" };
    case 3:
      return { text: "Overcast", icon: "Cloud", emoji: "☁️", category: "cloudy" };
    case 45:
      return { text: "Foggy", icon: "CloudFog", emoji: "🌫️", category: "fog" };
    case 48:
      return { text: "Depositing Rime Fog", icon: "CloudFog", emoji: "🌫️", category: "fog" };
    case 51:
      return { text: "Light Drizzle", icon: "CloudDrizzle", emoji: "🌦️", category: "rain" };
    case 53:
      return { text: "Moderate Drizzle", icon: "CloudDrizzle", emoji: "🌦️", category: "rain" };
    case 55:
      return { text: "Dense Drizzle", icon: "CloudRain", emoji: "🌧️", category: "rain" };
    case 56:
    case 57:
      return { text: "Freezing Drizzle", icon: "CloudSnow", emoji: "🌨️", category: "snow" };
    case 61:
      return { text: "Slight Rain", icon: "CloudRain", emoji: "🌦️", category: "rain" };
    case 63:
      return { text: "Moderate Rain", icon: "CloudRain", emoji: "🌧️", category: "rain" };
    case 65:
      return { text: "Heavy Rain", icon: "CloudRainWind", emoji: "⛈️", category: "rain" };
    case 66:
    case 67:
      return { text: "Freezing Rain", icon: "CloudSnow", emoji: "🌨️", category: "snow" };
    case 71:
      return { text: "Slight Snow Fall", icon: "Snowflake", emoji: "🌨️", category: "snow" };
    case 73:
      return { text: "Moderate Snow Fall", icon: "Snowflake", emoji: "❄️", category: "snow" };
    case 75:
      return { text: "Heavy Snow Fall", icon: "Snowflake", emoji: "❄️", category: "snow" };
    case 77:
      return { text: "Snow Grains", icon: "Snowflake", emoji: "❄️", category: "snow" };
    case 80:
      return { text: "Slight Rain Showers", icon: "CloudRain", emoji: "🌦️", category: "rain" };
    case 81:
      return { text: "Moderate Showers", icon: "CloudRain", emoji: "🌧️", category: "rain" };
    case 82:
      return { text: "Violent Rain Showers", icon: "CloudRainWind", emoji: "⛈️", category: "rain" };
    case 85:
    case 86:
      return { text: "Snow Showers", icon: "Snowflake", emoji: "🌨️", category: "snow" };
    case 95:
      return { text: "Thunderstorm", icon: "CloudLightning", emoji: "⚡", category: "thunderstorm" };
    case 96:
      return { text: "Thunderstorm with Slight Hail", icon: "CloudLightning", emoji: "⛈️", category: "thunderstorm" };
    case 99:
      return { text: "Severe Thunderstorm with Heavy Hail", icon: "Zap", emoji: "⚡⛈️", category: "thunderstorm" };
    default:
      return { text: "Clear", icon: "Sun", emoji: "☀️", category: "clear" };
  }
}

export function formatTemp(celsius: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatWindSpeed(kmh: number, unit: 'kmh' | 'mph' | 'ms' = 'kmh'): string {
  if (unit === 'mph') {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  if (unit === 'ms') {
    return `${(kmh / 3.6).toFixed(1)} m/s`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function getWindDirectionName(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

export function getAQICategory(aqi: number): {
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  color: string;
  textColor: string;
  bgGradient: string;
  description: string;
} {
  if (aqi <= 50) {
    return {
      category: "Good",
      color: "#10b981", // emerald
      textColor: "text-emerald-400",
      bgGradient: "from-emerald-500/20 to-teal-500/10",
      description: "Air quality is satisfactory and poses little or no health risk.",
    };
  }
  if (aqi <= 100) {
    return {
      category: "Moderate",
      color: "#f59e0b", // amber
      textColor: "text-amber-400",
      bgGradient: "from-amber-500/20 to-yellow-500/10",
      description: "Acceptable quality; sensitive individuals should monitor outdoor exposure.",
    };
  }
  if (aqi <= 150) {
    return {
      category: "Unhealthy for Sensitive Groups",
      color: "#f97316", // orange
      textColor: "text-orange-400",
      bgGradient: "from-orange-500/20 to-amber-500/10",
      description: "People with respiratory or heart diseases may experience symptoms.",
    };
  }
  if (aqi <= 200) {
    return {
      category: "Unhealthy",
      color: "#ef4444", // red
      textColor: "text-red-400",
      bgGradient: "from-red-500/20 to-rose-500/10",
      description: "Everyone may begin to experience health effects; sensitive groups may experience more serious effects.",
    };
  }
  if (aqi <= 300) {
    return {
      category: "Very Unhealthy",
      color: "#8b5cf6", // purple
      textColor: "text-purple-400",
      bgGradient: "from-purple-500/20 to-violet-500/10",
      description: "Health alert: The risk of health effects is increased for everyone.",
    };
  }
  return {
    category: "Hazardous",
    color: "#be123c", // rose dark / maroon
    textColor: "text-rose-400",
    bgGradient: "from-rose-900/30 to-red-950/20",
    description: "Health warning of emergency conditions: The entire population is more likely to be affected.",
  };
}

export function getUVLevel(uv: number): {
  level: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  color: string;
  advice: string;
} {
  if (uv <= 2) return { level: "Low", color: "#10b981", advice: "Minimal protection required. Safe for normal outdoor activities." };
  if (uv <= 5) return { level: "Moderate", color: "#f59e0b", advice: "Wear sunscreen, hat, and sunglasses during midday hours." };
  if (uv <= 7) return { level: "High", color: "#f97316", advice: "Protection essential. Seek shade during 11 AM – 3 PM." };
  if (uv <= 10) return { level: "Very High", color: "#ef4444", advice: "Extra precautions needed. Unprotected skin can burn rapidly." };
  return { level: "Extreme", color: "#8b5cf6", advice: "Avoid outdoor sun exposure during midday. Full coverage required." };
}

export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
}
