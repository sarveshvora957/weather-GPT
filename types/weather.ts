export interface LocationData {
  id?: number | string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode?: string;
  admin1?: string; // State or Region (e.g. Gujarat)
  admin2?: string; // District / County / Admin Area (e.g. Rajkot)
  timezone?: string;
  elevation?: number;
  population?: number;
  postcode?: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  precipitation: number;
  weatherCode: number;
  conditionText: string;
  icon: string;
  sunrise: string;
  sunset: string;
  isDay: boolean;
  cloudCover: number;
  dewPoint: number;
  updatedAt: string;
}

export interface HourlyForecastItem {
  time: string;
  timestamp: number;
  temperature: number;
  feelsLike: number;
  precipitationProb: number;
  precipitation: number;
  weatherCode: number;
  conditionText: string;
  icon: string;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  uvIndex: number;
  isDay: boolean;
  cloudCover: number;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  precipitationProb: number;
  precipitationSum: number;
  weatherCode: number;
  conditionText: string;
  icon: string;
  uvIndexMax: number;
  windSpeedMax: number;
  windDirectionDominant: number;
  sunrise: string;
  sunset: string;
}

export interface AirQuality {
  aqi: number; // European or US AQI index (0-500)
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  dust: number;
  recommendation: string;
  sensitiveGroupAdvisory: string;
  color: string;
}

export interface WeatherAlert {
  id: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  event: string;
  headline: string;
  description: string;
  instruction: string;
  areaDesc: string;
  effective: string;
  expires: string;
  senderName: string;
  certainty?: string;
  urgency?: string;
  color: string;
}

export interface ClimateHistory {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  startYear: number;
  endYear: number;
  yearlyTrends: {
    year: number;
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    rainfallSum: number;
    heatwaveDays: number;
    extremePrecipDays: number;
  }[];
  temperatureRiseDecade: number; // e.g. +0.8°C over 20 years
  rainfallShiftPercent: number; // e.g. -4.2%
  seasonalBreakdown: {
    season: 'Summer' | 'Monsoon' | 'Autumn' | 'Winter' | 'Spring';
    avgTemp: number;
    rainfall: number;
    trend: 'Warming' | 'Cooling' | 'Wetter' | 'Drier';
  }[];
  summary: string;
}

export interface AIRecommendation {
  domain: 'cricket' | 'sports' | 'travel' | 'clothing' | 'agriculture' | 'events' | 'commute' | 'general';
  status: 'SAFE' | 'MODERATE_RISK' | 'HIGH_RISK' | 'CRITICAL';
  title: string;
  badgeText: string;
  badgeColor: string;
  score: number; // 0 to 100 feasibility score
  reasoning: string;
  keyFactors: { label: string; value: string; impact: 'positive' | 'warning' | 'negative' }[];
  actionPlan: string[];
  bestWindow?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: string;
  location?: LocationData;
  weatherSummary?: Partial<CurrentWeather>;
  hourlyForecast?: HourlyForecastItem[];
  dailyForecast?: DailyForecastItem[];
  airQuality?: AirQuality;
  recommendation?: AIRecommendation;
  alerts?: WeatherAlert[];
  suggestedQuestions?: string[];
  isDemo?: boolean;
  comparisonData?: ComparisonData;
  language?: "en" | "hi" | "gu";
}

export interface ComparisonData {
  cityA: {
    location: LocationData;
    current: CurrentWeather;
    daily: DailyForecastItem[];
    aqi: AirQuality;
  };
  cityB: {
    location: LocationData;
    current: CurrentWeather;
    daily: DailyForecastItem[];
    aqi: AirQuality;
  };
  verdict: string;
  recommendations: {
    betterForOutdoor: string;
    betterForTravel: string;
    betterAirQuality: string;
    coolerClimate: string;
  };
  metricDifferences: {
    metric: string;
    cityAValue: string | number;
    cityBValue: string | number;
    winner: 'A' | 'B' | 'TIE';
    insight: string;
  }[];
}

export interface UserCustomAlert {
  id: string;
  name: string;
  location: string;
  conditionType: 'rain' | 'temperature_high' | 'temperature_low' | 'wind' | 'aqi' | 'severe';
  threshold: number;
  unit: string;
  enabled: boolean;
  notifyChannels: ('in-app' | 'push' | 'email')[];
  createdAt: string;
}

export interface SIHDemoScenario {
  id: string;
  scenarioNumber: number;
  title: string;
  subtitle: string;
  location: LocationData;
  queryPrompt: string;
  contextDescription: string;
  simulatedWeatherState: 'heavy_monsoon' | 'heatwave' | 'cricket_evening' | 'mountain_travel' | 'dual_city_climate';
  tag: string;
}
